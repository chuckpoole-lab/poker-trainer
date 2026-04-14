# Code Review Summary — April 14, 2026

**Scope:** All 10 commits shipped between April 6–13, 2026 (UX overhaul, card/explanation mismatch fixes, facing limpers, 3-bet modules, hand flagging, supporting fixes)

**Verdict:** **Architecture is solid — but do NOT do more major surgery until the four high-severity data/integration issues below are fixed.** They are small, targeted fixes (range data updates, one SQL migration, one timezone function) — not architectural work.

---

## Critical & High Severity — Fix Before More Feature Work

### 1. Hand flagging is broken in production (High)
- Feature shipped April 11 (`600ffc1`), lives on Vercel.
- Supabase migration `supabase-flagged-hands.sql` was never applied.
- Runtime behavior: flags silently fall back to localStorage; admin dashboard shows "No hands flagged yet" while users think their flags are being recorded.
- **Fix:** Paste `supabase-flagged-hands.sql` into Supabase SQL editor. This was already on the work plan as Priority 1 for "next session."
- *Source: review-ux-features.md*

### 2. Timezone bug in drill logging (High)
- `src/lib/services/progress-storage.ts:69` uses `new Date().toISOString().slice(0, 10)` — **UTC, not Eastern**.
- After 7 PM Eastern, drills log as *tomorrow's* date. Breaks daily streaks, stats, and weekly/monthly rollups.
- Related to the April 6 timezone fix (`770c1da`) — that fix only corrected `session-tracker.ts` and the Supabase stats function. `progress-storage.ts` was missed.
- **Fix:** Replace the `todayStr()` helper to use `.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })` (matches session-tracker's pattern).
- *Source: review-ux-features.md*

### 3. BTN 15bb opening range is drastically too tight (Critical)
- Current range: `66-JJ` only = **2.7% of combos**.
- Should be: **35–40%** (GTO for 15bb BTN).
- This was already flagged in the work plan ("24% playable, should be 35–40%"), but the actual number is even lower than the work plan estimated.
- Users learning from this data are being taught to fold hands they should be opening. Directly undermines the app's teaching goal.
- **Fix:** Replace the `OPENING_RANGES_RAW` entry for BTN 15bb with solver-generated range.
- *Source: review-range-tables.md*

### 4. SB-complete → BB has wrong action set (Medium-High)
- GTO principle: BB should never fold vs SB complete (free flop). Should raise or check/limp.
- Current data: only jam/fold actions available, no raise range.
- "Fold" is still presented as a choice — it can never be the correct answer.
- Creates a mathematically impossible scoring spot; players who correctly raise will be told they're wrong.
- **Fix:** Add raise range for BB vs SB-complete at all stack depths. Remove "Fold" from the choices array for this specific spot type (or keep it but mark it as never-correct for testing).
- *Source: review-range-tables.md*

---

## Medium Severity

### 5. Multiple empty raise ranges at 15bb+ (Medium)
- Several range-table entries for 15bb+ are binary jam-or-fold only, missing isolation-raise options.
- At deeper stacks (20bb+), isolation raises should be available.
- Makes the app feel overly simplistic at stack depths where more strategic play is possible.
- **Fix:** Regenerate affected entries with solver, include raise actions at 20bb+.
- *Source: review-range-tables.md*

### 6. Validator test coverage is narrower than claimed (Medium)
- `scripts/validate-scenarios.mjs` claims 1,300 scenarios tested, 0 failures.
- Actual coverage: 4,380 checks (500 daily + 500 bonus + 3,380 exhaustive), but the exhaustive loop only tests **4 hardcoded position pairs** (not all combos from the range tables).
- AKs/BTN/25bb fallback path is never explicitly triggered in tests.
- `pickHand()` bias-toward-borderline logic is never validated.
- **Fix:** Expand the exhaustive loop to iterate over `FACING_OPEN_KEYS`, `FACING_LIMP_KEYS`, `FACING_3BET_KEYS`. Add a test that forces the fallback path.
- *Source: review-scenario-generator.md*

### 7. No telemetry when scenario fallback fires (Medium)
- If the post-generation validator fails 20 times in a row, code falls back to AKs/BTN/25bb (line 565 of play-scenario-generator.ts).
- No `console.warn` or telemetry log when this happens — if it fires in production, you won't know.
- **Fix:** Add `console.warn('[PokerTrainer] Scenario fallback triggered', {...context})` at the fallback return.
- *Source: review-scenario-generator.md*

---

## Low Severity / Cosmetic

### 8. Hardcoded dark color on playing card suits (Low)
- `src/app/play/page.tsx:35` uses `#1e293b` (slate-700) for club/spade suits.
- Functionally correct, but clashes with the warm light palette — should match the mahogany poker rail tone.
- **Fix:** Replace with `#311309` (mahogany-deep) or define a dedicated suit color token.
- *Source: review-ux-features.md*

---

## Clean — No Action Needed

The following were verified and look good:

- **Scenario generator v2 architecture** — `buildScenario()` correctly derives everything from locked primitives. No closure leaks, no shared state. Every output field traceable.
- **Dead code cleanup** — April 11 afternoon "bulletproof validation layer" was fully replaced by the April 13 rewrite, not left behind as dead code.
- **React rendering safety** — `useRef` hands freeze in `DailyHandsGame` is still present and still appropriate as belt-and-suspenders.
- **RNG isolation** — Per-hand sub-seeds via `masterSeed ^ (attempts * 0x9e3779b9)` are truly isolated. No cross-hand contamination.
- **Dispatcher math** — 35%/15%/10%/40% split is mathematically correct, no off-by-one.
- **4-choice handling** — Facing-limp's 4 choices (Fold/Limp behind/Raise/All-in) are wired correctly throughout the UI. No hardcoded `length === 3` assumptions.
- **Explanation templates** — All 7 new templates (`explainIsolateLimper`, etc.) include `handCode` and produce coherent poker-appropriate text.
- **Test coverage (facing limp + facing 3-bet)** — `validate-scenarios.mjs` exercises both new spot types (added in April 13 rewrite).
- **5-tab navigation integrity** — Old routes (`/learn`, `/assessment`, `/drills`, `/settings`, `/admin`) all still work and use CSS variables that cascade correctly.
- **Session timeout** — `visibilitychange` listener, Promise.race timeout guards, and 2-minute auto-reload threshold all hooked up correctly.
- **Feedback form** — 4-question form maps correctly to existing Supabase columns (`q1_fun`, `q2_ease`, etc.) with proper null handling.
- **Home page copy** — "What's New" and "Coming Soon" accurately reflect shipped state.

---

## Recommended Action Sequence

**Before any new feature work:**
1. Apply `supabase-flagged-hands.sql` migration (5 min — unblocks hand flagging)
2. Fix `progress-storage.ts` timezone bug (15 min — one function change)
3. Regenerate BTN 15bb range from GTO solver (30 min — data fix)
4. Fix SB-complete → BB scenarios (30 min — data fix + choice filter)

**Then medium items as time allows:**
5. Add missing raise ranges at 15bb+ (30 min — data fix)
6. Expand validator exhaustive loop (30 min — test coverage)
7. Add fallback telemetry (5 min — one `console.warn`)

**Total: ~2.5 hours to clear the critical/medium debt before the next major build (postflop).**

---

## Detailed Review Reports

Full file:line references and investigation notes in:
- `review-scenario-generator.md` — v2 rewrite, validator coverage, RNG isolation
- `review-range-tables.md` — Facing Limpers, 3-bet modules, BTN 15bb
- `review-ux-features.md` — UX overhaul, hand flagging, timezone, session timeout, feedback form
