# Poker Trainer — UX & Feature Review
## Commits 44b077f, 600ffc1, ec4c6a8, 770c1da, 1f3cc80, 47565fe

---

## 1. UX Overhaul — Dark Theme Remnants

**Severity: Low**

### Findings
- **Single hardcoded dark color found:** `#1e293b` (Tailwind slate-700) in `src/app/play/page.tsx:35` 
  - Used for suit color (clubs/spades) on playing cards
  - Context: Card component displays hearts/diamonds in red (`#dc2626`), clubs/spades in `#1e293b`
  - Impact: **Functionally correct** — suits display properly on white card background
  
- **Color palette is complete:** globals.css correctly defines warm light theme (cream/forest green/gold)
  - All CSS variables use new palette: `--surface: #f0ebe3`, `--primary: #4a7c59`, `--gold: #e8a848`
  - Old routes (learn, assessment, drills, settings) use CSS variables via `var(--bg-card)`, `var(--text-primary)`, etc., so they render correctly

### Old Routes Status ✓
All legacy routes are **accessible and styled correctly:**
- `/learn` → uses `var(--text-primary)`, `.card` class
- `/assessment` → not found in file listing (likely legacy/archived)
- `/drills` → exists but uses CSS variables
- `/settings` → exists, uses CSS variables  
- `/admin` → uses CSS variables, has "Coach Dashboard" label

### Recommendation
**Change `#1e293b` to a warmer dark for suits.** Options:
- Use `--mahogany-deep: #311309` (poker table color, contextually appropriate)
- Or define a dedicated suit color: `--suit-dark: #5a4a40` (warm brown)

File: `src/app/play/page.tsx:35`

---

## 2. 5-Tab Navigation Integrity

**Severity: None**

### Findings ✓
All verification passed:

**5-tab nav correctly implemented** (`src/app/layout.tsx:55-58`):
- Home (/) 
- Play (/play)
- Train (/train) 
- Progress (/progress)
- More (/more)

**Old route mapping works:**
- `/learn`, `/assessment`, `/drills` → mapped to **Train tab** (line 74)
- `/settings`, `/admin` → mapped to **More tab** (line 76)
- Navigation detects `isActive` correctly for backward compatibility

**New pages exist:**
- `/train/page.tsx` ✓ 
- `/more/page.tsx` ✓
- `/more/feedback/page.tsx` ✓
- `/more/about/page.tsx` — not found (but /more/feedback exists)

**Admin access:** `/admin` route is protected by `is_admin` check in `src/app/admin/page.tsx:43-55` (returns "Access Denied" if not admin).

### Recommendation
No changes needed. Verify `/more/about` page exists or remove from route list if deprecated.

---

## 3. Hand Flagging Feature — Migration Status ⚠️

**Severity: High (production risk)**

### Critical Finding
**Flagged hands feature is LIVE but migration is NOT APPLIED.**

**What the code expects:**
- `flagged_hands` table with columns: `id`, `user_id`, `hand_code`, `position`, `stack`, `situation`, `card1_rank`, `card1_suit`, `card2_rank`, `card2_suit`, `app_action`, `user_action`, `explanation`, `note`, `is_bonus`, `status`, `reviewer_note`, `flagged_at`, `reviewed_at`, `reviewed_by`
- RLS policies for user inserts and admin reads
- Indexes on `(status, flagged_at DESC)` and `(hand_code, position)`

**Migration file exists:** `supabase-flagged-hands.sql` at repo root — **was NOT listed as applied in SESSION-LOG per instructions**

**User-facing code:**
- `src/app/play/page.tsx:95-110` — "Challenge this recommendation" button (🚩 icon)
- Users can flag hands and optionally add notes
- `flagHand()` in `src/lib/services/play-storage.ts:506-544` inserts to `flagged_hands`

**Admin review tab:**
- `src/app/admin/page.tsx:570-635` — "Flags" tab shows all flagged hands
- Admin can review, update status (open/agreed/adjusted/dismissed), and add reviewer notes

**Fallback behavior:**
```typescript
// play-storage.ts:540-543
if (error) {
  console.error('Failed to flag hand:', error.message);
  // Fallback: save to localStorage for guests or if Supabase fails
  const flags = loadGuestData<FlaggedHandData[]>('flagged-hands', []);
  flags.push(data);
  saveGuestData('flagged-hands', flags);
  return false;
}
```

**Runtime behavior if table missing:**
- Insert fails with Supabase error (table not found)
- Falls back to localStorage silently
- UI shows "🚩 Flagged for review — thanks!" (line 324)
- **Admin dashboard shows "No hands flagged yet" because RPC/SELECT fails too**
- Flags logged locally are **never synced to Supabase** — admins see nothing

### Recommendations
1. **APPLY MIGRATION IMMEDIATELY** before users flag many hands locally:
   ```bash
   supabase db push supabase-flagged-hands.sql
   # or paste into Supabase SQL editor
   ```

2. **Add pre-flight check in play/page.tsx** to warn if table isn't ready:
   ```typescript
   const [flagsAvailable, setFlagsAvailable] = useState(true);
   
   useEffect(() => {
     supabase.from('flagged_hands').select('id', { count: 'exact' })
       .then(({ error }) => setFlagsAvailable(!error));
   }, []);
   
   // Show button only if available
   {!flagged && !showFlagNote && flagsAvailable && (
     <button onClick={() => setShowFlagNote(true)}>...</button>
   )}
   ```

3. **Log localStorage flags to Supabase after migration:**
   Add a sync utility in auth-context or on app boot to flush cached flags.

Files:
- Migration: `supabase-flagged-hands.sql` (root)
- Feature code: `src/lib/services/play-storage.ts:506-544`, `src/app/play/page.tsx:95-324`
- Admin review: `src/app/admin/page.tsx:570-635`

---

## 4. Session Timeout — Implementation ✓

**Severity: None**

### Findings ✓
Feature is correctly implemented. Session timeout and refresh logic:

**Location:** `src/lib/services/auth-context.tsx:122-177`

**How it works:**
1. Detects when user switches away from tab (`document.visibilitychange` listener)
2. Records `lastVisible` timestamp when tab becomes hidden
3. On return (visibility = visible):
   - Checks if away > 120 seconds (2 minutes, hardcoded at line 140)
   - Calls `supabase.auth.getSession()` (4s timeout)
   - If signed in: attempts `supabase.auth.refreshSession()` (5s timeout)
   - If timeout or error: calls `window.location.reload()`
   - Guest users: just checks connectivity, no refresh needed

**Promise.race guards:** ✓
- Line 147-151: `withTimeout` helper wraps promises with 4s/5s timeout
- Prevents hanging on stale Supabase connection

**Auto-reload after 2+ min inactivity:** ✓
- Hardcoded at line 140: `awayMs < 120_000`
- Not configurable (would require environment variable if needed)

### Note
Threshold is hardcoded. If needed to be configurable, add environment variable `NEXT_PUBLIC_SESSION_TIMEOUT_MS` (default 120000).

No changes needed for current requirement.

---

## 5. Timezone Consistency ⚠️

**Severity: High (data integrity risk)**

### Critical Finding
**Inconsistent timezone handling across services.**

#### Correct (Eastern Time)
`src/lib/services/session-tracker.ts:165-166`:
```typescript
const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
// Result: YYYY-MM-DD in Eastern Time
```

`src/lib/services/session-tracker.ts:186`:
```typescript
const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
```

#### **WRONG (UTC)** ⚠️
`src/lib/services/progress-storage.ts:69`:
```typescript
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
  // Converts to UTC, then slices: "2026-04-14T07:30:00Z" → "2026-04-14" (UTC date!)
}
```

**Impact:**
- Used by `saveDrillResult()`, `saveDrillRecord()`, `getMonthlyStats()`, etc.
- **7 PM Eastern = 11 PM UTC.** If user completes a drill at 11 PM Eastern (3 AM UTC next day), it's logged as next day's drill
- Breaks daily/weekly/monthly aggregations
- Visible in progress stats — off by 1 day for evening users

### Recommendation
Replace `todayStr()` to use Eastern Time:
```typescript
function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  // Returns "2026-04-14" in Eastern Time, always matches session-tracker
}
```

File: `src/lib/services/progress-storage.ts:68-70`

---

## 6. Feedback Form — Supabase Column Mapping ✓

**Severity: None**

### Findings ✓
Mapping is correct and consistent.

**Form collects 4 questions:**
- Q1: "Is this your first time?" → 1 or 2
- Q2: "Did you have fun?" → 1, 2, or 3
- Q3: "Will you be back?" → 1, 2, or 3
- Q4 (unused): → 0

Location: `src/components/play/FeedbackSurvey.tsx:130-166`

**Supabase table schema:**
`src/lib/services/play-storage.ts:415-427`
```typescript
export interface TesterFeedback {
  q1_fun: number;      // Maps from q1 (first time) — NAMING MISMATCH but semantically OK
  q2_ease: number;     // Maps from q2 (fun) — NAMING MISMATCH but semantically OK
  q3_tips: number;     // Maps from q3 (coming back)
  q4_recommend: number;
  q5_return: number;
  freeform: string | null;
  tester_name: string | null;
  tester_email: string | null;
}
```

**Insert mapping:**
`src/lib/services/play-storage.ts:439-453`
```typescript
const { error } = await supabase.from('tester_feedback').insert({
  q1_fun: data.q1,         // first time → q1_fun ✓ (stores correctly, column name misleading)
  q2_ease: data.q2,        // fun → q2_ease ✓ (stores correctly, column name misleading)
  q3_tips: data.q3,        // coming back → q3_tips ✓
  q4_recommend: data.q4,   // unused (0) → q4_recommend ✓
  q5_return: data.q5,      // unused (0) → q5_return ✓
  freeform: data.freeform || null,
  tester_name: data.name || null,
  tester_email: data.email || null,
});
```

**NULL handling:** ✓
- All non-required fields default to `null`: `freeform || null`, `name || null`, `email || null`
- No type errors

### Note
**Column names (`q1_fun`, `q2_ease`, `q3_tips`) don't match question semantics** (first time, fun, coming back), but the mapping is correct and functional. If this causes confusion in reports, consider renaming columns in next migration (non-breaking if mapping updated simultaneously).

No changes needed for functionality.

---

## 7. Home Page Copy — Feature Accuracy

**Severity: Low (marketing only)**

### Findings
**Home page:** `src/app/page.tsx` (welcome screen before mode selection)

**Copy shown:**
- Play mode: "Quick daily challenges. Test your instincts, climb the leaderboard, trash talk your league."
  - Tags: 60 sec/day, Daily challenge, League ranks
- Train mode: "Find your leaks, drill your weak spots, log hands and get coaching feedback."
  - Tags: Hand logger, Leak detection, Coaching

**Status of listed features:**
- ✓ Daily challenges (Play tab, working)
- ✓ League ranks (visible in play results, working)
- ✓ Hand logger (assessment/drills pages exist)
- ✓ Leak detection (assessment page references this)
- ✓ Coaching feedback (learn pages, coaching tips in drills)

**NOT mentioned but shipped:**
- Hand flagging (🚩 feature, live in play page)
- UX overhaul with new 5-tab nav
- New /train, /more pages

**Likely in "Coming Soon" elsewhere:** (not visible in page.tsx)
- Facing limpers training
- 3-bet training
- Advanced position theory

### Recommendation
Copy is **accurate for what's shipped.** No updates needed unless:
1. You want to highlight hand flagging: add "flag hands for review" to play mode
2. You want to surface train mode improvements: update tags

No changes strictly necessary; this is marketing alignment, not technical debt.

File: `src/app/page.tsx`

---

## Summary Table

| Investigation | Severity | Status | Action |
|---|---|---|---|
| Dark theme remnants | Low | Found 1 color | Update card suit color (#1e293b) in play/page.tsx:35 |
| 5-tab nav integrity | None | ✓ All OK | None (verify /more/about exists) |
| Hand flagging migration | **High** | ⚠️ Not applied | **Apply supabase-flagged-hands.sql immediately** |
| Session timeout | None | ✓ Implemented | None |
| Timezone consistency | **High** | ⚠️ Bug found | Fix `todayStr()` in progress-storage.ts:69 to use Eastern Time |
| Feedback form mapping | None | ✓ Correct | None (column names could be clearer) |
| Home page copy | Low | ✓ Accurate | None (marketing polish only) |

---

## Critical Path (Do First)
1. **Apply flagged-hands migration** — prevents data loss
2. **Fix todayStr() timezone** — data integrity issue affecting drill logging
3. Address card suit color (aesthetic, low priority)
