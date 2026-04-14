# Poker Trainer — Work Plan & Priorities
## Updated April 11, 2026

---

## NEXT SESSION: Pick Up Here

1. **Run Supabase migration** — Paste `supabase-flagged-hands.sql` into Supabase SQL editor to enable the hand flagging feature
2. **Test new modules on live site** — Verify facing-limp and facing-3bet scenarios appear in daily/bonus hands after Vercel rebuilds
3. **BTN 15bb range fix** — Currently only 24% playable, should be ~35-40%. Update OPENING_RANGES_RAW BTN 15bb entry.
4. **Review with Chuck** — Discuss UX direction from meeting, get sign-off on nav/color changes
5. **Start implementing warm color palette** — CSS variables / design tokens swap (cream background, felt green, gold accents)
6. **Build the 5-tab navigation** — replace current 8-tab layout, wire up path-dependent Home screen

**Recent completions (April 7-11):**
- ✅ Session timeout fix committed and deployed (auth-context.tsx)
- ✅ Card/description mismatch bug fixed with 3-layer validation (42,250 tests pass)
- ✅ Hand flagging feature built (play page + admin tab + Supabase schema — just needs migration)
- ✅ Facing Limpers module (24 matchups × 4 stacks, 4 actions: isolate/limp/jam/fold)
- ✅ 3-Betting Strategy module (36 matchups × 4 stacks, 3 actions: call/fold/4-bet jam)

---

## PRIORITY 1: UX Overhaul (Retention is the #1 problem)

People are visiting but not coming back. Everything in this section directly addresses that.

### 1a. Visual Redesign — "Wordle for Poker" feel
- [ ] Implement warm light color palette (cream background, felt green accents, gold highlights)
- [ ] Replace dark charcoal theme across all screens
- [ ] Keep poker table green felt and brown rail — extend that warmth to the rest of the UI
- [ ] Ensure the app feels bright, inviting, and fun — not like a dark-mode dev tool
- [ ] Mockup approved direction: see `wordle-poker-mockup.html` in project-management folder
- **Status:** Mockup created, Chris says "getting a lot closer" — refine and implement

### 1b. Navigation Redesign — 5 tabs, clear purpose
Current 8-tab nav is confusing (Home = Play duplicate, too many choices). New structure:
- [ ] **Home** — personalized landing: greeting, daily challenge banner, "what do you want to work on?" quick actions, what's new / what's coming
- [ ] **Play** — Daily Hands only (the Wordle moment, daily reason to return)
- [ ] **Train** — focused session launcher for serious players: assessment, quick drill, fix my leaks, position drills, short stack jam/fold, learn basics. Pick one and go. No sub-tabs.
- [ ] **Progress** — stats, streaks, IQ trend, leak breakdown (needs data improvements, see 2d)
- [ ] **More** — settings, feedback, coach dashboard (admin), about
- [ ] Remove duplicate Home/Play routing
- **Decision needed:** Chris + Chuck confirm nav structure

### 1c. Session Timeout Fix — Stop the frozen screen
- [ ] Add visibility change listener — silently refresh Supabase auth token when user returns to tab
- [ ] If silent refresh fails, show friendly "Welcome back — tap to reconnect" prompt
- [ ] Consider auto-logout after 30+ min inactivity as fallback
- **Impact:** Directly causing users to abandon the app

### 1d. Table Visualization Consistency
- [ ] Show poker table with position badges on ALL hand decision screens (Daily Hands, Assessment, Drills)
- [ ] Currently only Assessment and Drills show the table — Daily Hands and Learn do not
- [ ] The table is the best visual in the app. Use it everywhere.

---

## PRIORITY 2: Content & Gameplay Fixes (Testers are noticing)

### 2a. Borderline Hand Scoring — "Acceptable Zone" for Bar Poker
Chris flagged: Q-low in the SB at 15bb is scored as wrong when jamming, but it's a profitable play at bar poker tables where BBs over-fold. The app is strict GTO but bar poker players don't play GTO — they make donkey calls and wild jams. The app shouldn't punish reasonable exploitative plays.

**Phase 1: Acceptable buffer (quick win)**
- [ ] Add a "borderline" zone: hands within ~5% of the range cutoff score as "acceptable" (yellow) instead of "wrong" (red)
- [ ] Update explanation text for borderline spots: "This is close. GTO says fold, but against a tight BB this jam is profitable."
- [ ] Apply to both opening ranges and facing-open ranges

**Phase 2: Bar Poker Exploit Mode (medium lift)**
- [ ] Wire up the existing Complexity Mode setting (Core/Coach/Advanced) — one mode becomes "Bar Poker" or "Exploit"
- [ ] Widen steal ranges (SB, BTN, CO) where recreational players over-fold the blinds
- [ ] Tighten call/jam ranges in spots where recreational players over-call (e.g., multiway pots)
- [ ] Show both GTO and exploit recommendations side by side in explanations

**Phase 3: Table-aware training (future)**
- [ ] Let users describe their table ("tight", "loose/passive", "maniac at the table")
- [ ] Adjust recommended ranges based on table profile
- [ ] "At your table, this hand is a jam because the BB folds 65% of the time"

**Impact:** Directly causing frustration — testers see borderline spots marked wrong and lose trust in the app's advice.

### 2b. Assessment Hands — HARDCODED, needs randomization
- [ ] Assessment is the same 20 hands every time — tester confirmed he's seeing repeats
- [ ] Build a dynamic assessment generator (like drills already have) that pulls from the range tables
- [ ] Keep the 9 leak categories but randomize which hands test each category
- [ ] Consider: generate a pool of 40+ spots, randomly pick 20 per session
- **Impact:** Solid players have no reason to retake the assessment right now

### 2c. Learn Quiz Questions — Also hardcoded
- [ ] Foundations quiz is same 14 questions every time
- [ ] Position quizzes are also hardcoded
- [ ] Lower priority than assessment, but should be randomized eventually
- **Note:** Drills are already random (confirmed). Daily Hands are date-seeded (correct by design).

### 2d. Spot Review — Show what the user got wrong
- [ ] After drills: no persistent review screen exists (only in-the-moment feedback)
- [ ] After assessment: review page shows correct answers but NOT the user's actual answers
- [ ] After Daily Hands: only shows color-coded grid, no individual hand review
- [ ] Fix: Show "You chose X → Correct answer was Y" with explanation in all review screens
- [ ] Infrastructure exists (user answers are stored) — just needs to be surfaced
- **Impact:** Users can't learn from mistakes without seeing what they got wrong

### 2e. Progress Tab — Needs real value
Current problems:
- [ ] All data stored in localStorage only — lost on browser/device switch
- [ ] Leak categories only populate from assessments (drills don't contribute)
- [ ] No historical trending ("am I getting better?")
- [ ] No actionable recommendations ("drill this next")
- [ ] Migrate progress data to Supabase so it persists across devices
- [ ] Add IQ trend over time (7-day, 30-day)
- [ ] Add "recommended next action" based on weakest leak category
- **Impact:** Progress page currently shows mostly zeros and "No data yet" for new users

---

## PRIORITY 3: Feedback & Polish

### 3a. Simplify Feedback Form
Current: 5 rating questions + freeform + name/email (too much friction)
- [ ] Replace with 4 simple questions:
  1. Is this your first time? (Yes / No)
  2. Did you have fun? (Meh / Yeah! / Loved it)
  3. Will you be back? (Probably not / Maybe / Definitely)
  4. Any suggestions? (freeform text box)
- [ ] Keep it under 30 seconds
- [ ] Mockup included in `wordle-poker-mockup.html`

### 3b. Settings — Wire up or simplify
- [ ] Only Drill Length currently works
- [ ] Complexity Mode (Core/Coach/Advanced) — UI only, not wired to anything
- [ ] Explanations (Plain English/Strategy/Exploit) — UI only, not wired
- [ ] Either: wire them up, or remove the "Coming soon" placeholders to avoid confusion
- [ ] Add inline explanations for each setting ("What does this do?")

### 3c. Leaderboard Fix
- [ ] Always shows rank #1 — needs to show actual "Place X of Y"

### 3d. Post-Assessment Summary
- [ ] Needs written summary with analysis and training recommendations after completing assessment

---

## PRIORITY 4: Preflop Pro Integration (Quick Reference Tool)

### Rationale
Chris built a standalone GTO quick-reference app (Preflop Pro) that lets players look up the correct preflop action for any hand in real time — pick position, stack depth, action sequence, and instantly see fold/open/jam/call for all 169 hands on a color-coded grid. It already has its own repo and codebase (`preflop-pro`), built on the same stack (Next.js + TypeScript + Tailwind).

Integrating this into the Poker Trainer as a `/reference` module makes strategic sense:

- **Fills a gap we already identified.** The roadmap calls for adding limpers, raisers, and 3-bettors. Preflop Pro already solves those spots — squeezes, multi-way pots, iso-raises, arbitrary action sequences. This leapfrogs Phase 3 scenario expansion.
- **Drives daily engagement.** Gives players a reason to open the app outside of the daily challenge. The trainer teaches the ranges; the reference tool is the safety net while they're still learning.
- **Potential premium feature.** Could gate it as a league member perk — free users get training, league members get the lookup tool.
- **Same tech stack.** Both apps are Next.js + TypeScript + Tailwind with static export to Vercel. No compatibility issues.
- **Complementary range models.** The Poker Trainer uses GTO-verified static lookup tables (23 benchmarks passing) for daily challenges and drills where correctness is non-negotiable. Preflop Pro uses an algorithmic solver that generates ranges on the fly for any action sequence — more flexible but heuristic. Keeping both gives us accuracy where it matters and flexibility everywhere else.

### What Already Exists (in `preflop-pro` repo)
- `gto-engine.ts` (~920 lines) — hand scoring, equity vs range, EV calculations, 7 spot-type solvers
- `HandGrid.tsx` — 13x13 color-coded hand matrix (green=raise, red=jam, blue=call, yellow=iso, grey=fold)
- `ActionInput.tsx` — position selector + dynamic action sequence builder (fold/limp/open/call/raise)
- `EquityDetails.tsx` — EV breakdown panel (EV jam, EV raise, EV fold, equity vs range)
- `ShareExport.tsx` — copy grid as image, share spot via native share API
- Full support for 9 positions, 5-50bb continuous stack slider, all spot types

### Integration Estimate: 1-2 Sessions

| Task | Effort |
|------|--------|
| Copy gto-engine.ts + types into Poker Trainer's `src/lib/` | Small |
| Copy 4 components into `src/components/reference/` | Small |
| Create `/reference` route with page layout | Small |
| Restyle to match Poker Trainer's theme (dark slate palette) | Medium |
| Wire into 5-tab nav as "Reference" or "Lookup" tab | Small |
| Test all spot types (opening, facing raise, limpers, squeeze) | Medium |
| Validate Preflop Pro's output against Poker Trainer's GTO benchmarks | Medium |

### Architecture Decision
- Keep Poker Trainer's static `range-tables.ts` for daily challenges, drills, and assessments (GTO-verified, benchmark-tested)
- Use Preflop Pro's dynamic solver for the reference tool (handles any action sequence, any stack depth 5-50bb)
- No range data duplication — each engine serves its own purpose

### Open Questions
- [ ] Should reference tool require login or be open to all visitors?
- [ ] Gate as premium/league feature or free for everyone?
- [ ] Keep Preflop Pro as a standalone app too, or sunset it once integrated?
- [ ] Add link from reference tool back to relevant training drill? ("Want to practice this spot?")

---

## PRIORITY 5: Growth & Partnerships (after UX is solid)

### App Name Decision
- [ ] Research domain availability for top 3 name candidates
- [ ] Check App Store / trademark conflicts
- [ ] Make final decision with Chuck by end of week
- [ ] Secure domain

### NPPT League Prep
- [ ] Identify who runs NPPT (owner / league operator contact)
- [ ] Draft outreach message — casual, player-to-player
- [ ] Prepare 2-minute demo walkthrough

### NPPT Integration Build (unblocks league outreach)
- [ ] Build region/venue database schema and run SQL migration
- [ ] Create league registration flow (select league → region → venues → nickname)
- [ ] Add nickname field to user profiles
- [ ] Build league-filtered leaderboards (by region, by venue)
- [ ] Test with NPPT data (13 regions, sample venues)

---

## BLOCKING / NEEDS DECISION (moved from Priority 4 to 5)

| Item | Owner | Status |
|------|-------|--------|
| Nav structure (5-tab redesign) | Chris + Chuck | Proposed in mockup, needs approval |
| Color direction (Wordle-light theme) | Chris + Chuck | Mockup close, needs final sign-off |
| App name | Chris + Chuck | Brainstorm done, need to pick and buy domain |
| GitHub repo visibility | Chris + Chuck | Repo is public — discuss making it private |
| NPPT contact | Chris | Need to identify decision maker |
| Monetization model | Chris + Chuck | Parking lot — revisit after league partnership |
| Mobile testing | Dev session | Schedule 30 min to test on actual phones |

---

## COMPLETED (April 6)

### GTO Solver Engine — Replaced Hand-Typed Ranges with Math (Accuracy Critical)
- [x] Built `scripts/generate-ranges.py` — preflop equity engine using EV math
- [x] Tuned model: fixed premium hands jamming at 25bb, trash hands opening from EP
- [x] 23/23 GTO benchmarks passing (including A3s bug and 66 bug)
- [x] Replaced all data in `range-tables.ts` with solver-generated output
- [x] All 60 facing-open combos verified, 14,365 scenarios validated, 0 critical issues
- [x] Committed (`937047e`) and pushed — live on Vercel

### Reviewed Preflop Pro Standalone App for Integration
- [x] Reviewed full codebase (~1,500 LOC) — gto-engine, components, UI
- [x] Assessed integration effort and documented in WORK-PLAN.md as Priority 4
- [x] Identified complementary range models (static verified tables + dynamic solver)

---

## COMPLETED (April 3)

### Built & Deployed: Guest Session Tracking + Admin Stats Dashboard
- [x] Built `app_sessions` Supabase table — tracks every visit (guest + registered)
- [x] Built `session-tracker.ts` — device fingerprint, heartbeat every 60s, hands counter
- [x] Built new Stats tab on admin dashboard with 7-day trends
- [x] Committed and pushed to GitHub → Vercel auto-deployed

### Built: Facing-Open Range Gap Fix (Accuracy Critical)
- [x] Built automated validation script — tests 14,365 scenarios
- [x] Filled ALL 37 missing facing-open combos with GTO ranges
- [x] Re-validated: 0 CRITICAL, 0 GAP issues
- [x] Fixes Chuck's bug (BB with 66 vs BTN raise being told to fold)

### Housekeeping (April 5)
- [x] Fixed stale URL references — all docs now point to poker-trainer-ashy.vercel.app
- [x] Security audit — no exposed secrets, source maps disabled, RLS properly configured
- [x] Confirmed poker-trainer-six was an old Vercel deployment name, not another project
- [x] Investigated all tabs: Progress, Settings, Feedback, Spot Review — findings documented

---

## DAILY STANDUP CHECKLIST

1. **Check Stats tab** — how many sessions yesterday? Guests vs registered?
2. **Check Feedback tab** — any new survey responses?
3. **Play today's daily** — experience it as a user, note anything off
4. **Pick one thing to advance** — testing, league outreach, or a bug fix
5. **Update this plan** — check off what's done, add what's new

---

## REFERENCE LINKS

- **Live app:** https://poker-trainer-ashy.vercel.app
- **Admin dashboard:** https://poker-trainer-ashy.vercel.app/admin
- **GitHub repo:** https://github.com/chuckpoole-lab/poker-trainer
- **Supabase dashboard:** https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa
- **NPPT website:** https://npptpoker.com
- **Color mockup:** project-management/wordle-poker-mockup.html
- **Dev log:** DEVLOG.md
- **Project plan:** PROJECT-PLAN.md

---

*Updated: April 5, 2026 — major reorganization after UX review session*
*Next review: April 7, 2026*
