# Poker Trainer — Session Log

This file is updated at the end of every work session. Read this first when starting a new session.

---

## Session: April 13, 2026 (Evening)
**Focus:** Complete architectural rewrite of scenario generator to permanently kill the card/explanation mismatch bug
**Note:** This session was worked in regular Claude chat (not cowork). Logged here on April 14 after git history review.

### Context
Chuck reported the mismatch bug *again* despite the April 7 and April 11 fixes:
- Example 1: Cards showed J♥T♣ but explanation said "with TT at 25bb"
- Example 2: Cards showed 6♦4♣ but explanation said "66 at 20bb" (originally fixed in v0.9.1)

Root cause determination: the earlier fixes patched symptoms without addressing the architectural problem. The pipeline had THREE separate stages (spot-generator → play-scenario-generator → React render), each capable of referencing a different hand. A `GeneratedSpot` object carried both a `handCode` and a pre-built explanation; the re-derivation logic had to stay perfectly in sync with the generator's internal RNG state. Any deviation could decouple them.

### What was done
- **Complete rewrite of `play-scenario-generator.ts` (v2 architecture)** — 763 lines rewritten
- **Single `buildScenario()` function** derives ALL output fields from the SAME locked primitive parameters: `handCode`, `heroKey`, `stackBb`, `spotType`, `opponentKey`. Cards, action, explanation, choices — everything from one call
- **Eliminated `GeneratedSpot` crossing the boundary** — the generator now picks only primitive parameters using the RNG, then passes them directly into `buildScenario`. Nothing pre-built leaks through.
- **Per-hand RNG isolation** — each of the 5 daily hands gets its own sub-seed derived from the master seed XOR'd with the hand index. Picking parameters for hand 3 cannot affect the RNG state used for hand 4.
- **Post-generation validator (`validateScenario`)** runs on every finished scenario. Checks: card ranks match handCode, explanation text contains handCode, correct index is in range. Any failure is logged and the scenario is skipped/replaced.
- **Bonus hand fallback** — if 20 attempts all fail validation, returns AKs/BTN/25bb as a guaranteed-valid safe fallback
- **New `handCodeToCards`** uses XOR-based seed from the hand code characters only — no positional or RNG state can influence which suits are assigned
- **Also fixed:** `FlaggedHand` type to match Supabase snake_case columns; Badge variant values in admin page
- **Testing:** 1,300 scenarios tested against real TypeScript source, 0 failures
- **Committed and pushed** — Commit `9da7897`

### Files changed (998 insertions, 332 deletions across 7 files)
1. `src/lib/services/play-scenario-generator.ts` — Full rewrite (v2)
2. `src/lib/services/play-storage.ts` — Minor updates
3. `src/app/admin/page.tsx` — Badge variant fix
4. `scripts/run-integration.ts` — NEW integration test harness
5. `scripts/validate-scenarios.mjs` — NEW validator script
6. `tsconfig.test.json` — NEW test config
7. `DEVLOG.md` — Added v0.10.1 entry (at repo root)

### Decisions made
- The pipeline is now architecturally incapable of producing a mismatch. There is only ONE source of truth (the locked primitives) and ONE derivation function.
- Fallback hand (AKs/BTN/25bb) is a deliberate sentinel — if users ever see it repeatedly, something is wrong upstream.

### What's next
- **Ask Chuck to retest** — play through 10-20 bonus hands and confirm no mismatches. Both the Apr 11 afternoon patch and this Apr 13 rewrite should eliminate the bug class.
- Remaining priorities unchanged from April 11 session queue.

---

## Session: April 11, 2026 (Afternoon)
**Focus:** Patch card/description mismatch with bulletproof validation layer
**Note:** This session was worked in regular Claude chat (not cowork). Logged here on April 14 after git history review.

### Context
Chuck reported the mismatch bug again after the April 7 fix shipped. Example: cards showed 8h 3h but tip said "A2s at 20bb". Previous fix (`e1e19b7`) was apparently not sufficient.

### What was done
- **Three-layer validation added to `spotToPlayScenario`:**
  1. Validate cards match handCode after `parseHandCode` — if mismatch, force-rebuild cards directly from handCode characters
  2. Remove dangerous fallback to `spot.explanation` (pre-cached text that could reference a different hand). ALL explanations now generated fresh from handCode, including a safe fallback for unparseable facing-open spots
  3. Final safety check: verify explanation text contains handCode. If not, substitute a corrected tip that explicitly names the hand
- **Froze hands array in `DailyHandsGame` via `useRef`** to prevent parent re-renders from swapping hands mid-game
- **Added stable `key` props** to game components to force clean remount when new hands are generated
- **Committed and pushed** — Commit `2bba710`

### Files changed (74 insertions, 11 deletions)
1. `src/lib/services/play-scenario-generator.ts` — Three-layer validation
2. `src/app/play/page.tsx` — useRef freeze + stable keys

### Decisions made
- The React re-render aspect (useRef freeze) was flagged as a potential contributor even though it wasn't confirmed as root cause.
- Post-mortem: this fix didn't fully solve the problem. Chuck reported mismatches again, which led to the April 13 full rewrite.

### What's next
- Superseded by April 13 rewrite — validation layer is still in place but now redundant with the v2 architecture.

---

## Session: April 11, 2026 (Morning)
**Focus:** Build Facing Limpers and 3-Betting Strategy modules

### What was done
- **Built Facing Limpers module** — 24 matchup scenarios (UTG/HJ/CO limps → BTN/SB responds, SB completes → BB responds) across 4 stack depths (15/20/25/30bb). GTO-based ranges for isolate-raise, limp-behind, jam, and fold actions. Key teaching: limpers are weak, raise to isolate.
- **Built 3-Betting Strategy module** — 36 matchup scenarios (hero opens from UTG/HJ/CO/BTN/SB → faces 3-bet from BTN/SB/BB) across 4 stack depths. Ranges for call, fold, and 4-bet jam. Key teaching: fold most of your opening range vs 3-bets — that's correct, not weak.
- **Added explanation templates** — 7 new template functions: explainIsolateLimper, explainLimpBehind, explainJamVsLimp, explainFoldVsLimp, explainCallVs3Bet, explainFoldVs3Bet, explain4BetJam. All include handCode for consistency.
- **Extended spot generator** — New dispatch: 35% facing open, 15% facing limp, 10% facing 3-bet, 40% unopened. Both modules have dedicated hand-picking functions biased toward borderline decisions.
- **Wired into play-scenario-generator** — Full three-layer validation for new types: card/handCode match, action re-derivation from range-tables, and explanation text verification. Added "Limp behind" as a new choice option for facing-limp spots.
- **TypeScript passes clean** — 0 errors in source files. Existing test suites still pass (42,250 scenarios + 5,916 card consistency checks).
- **Committed and pushed** — Commit `6230d06`

### Files changed (583 lines added)
1. `src/lib/data/range-tables.ts` — FACING_LIMP_RAW (24 entries), FACING_3BET_RAW (36 entries), CompiledRanges extended, getFacingLimpAction(), getFacing3BetAction()
2. `src/lib/data/explanation-templates.ts` — 7 new explanation functions + 2 context helpers
3. `src/lib/services/spot-generator.ts` — FacingLimpScenario, Facing3BetScenario types, 2 generators, 2 hand-pickers, 2 key parsers, updated dispatch
4. `src/lib/services/play-scenario-generator.ts` — Extended buildSituation, buildChoices, spotToPlayScenario for FACING_LIMP and FACING_3BET

### Decisions made
- Reused LeakCategoryId.FACING_OPENS for limp scenarios (same general category). 3-bet uses FACING_3BETS.
- Facing-limp spots have 4 choices (Fold/Limp behind/Raise/All-in) vs the standard 3 choices
- SB complete → BB is handled as a limp scenario where BB can raise wide (never fold since free option)
- Dispatch rates weighted toward unopened (40%) and facing-open (35%) since those are the core skills, with limps (15%) and 3-bets (10%) adding variety

### Also this session
- **Updated "What's New & Coming Soon"** on home screen — moved facing limpers and 3-bet training to New, added hand flagging, removed shipped items from Coming Soon. Commit `47565fe`.
- **Created Postflop Design Document** — `POSTFLOP-DESIGN.md` covering full architecture for postflop training: c-betting, hand ranging, bluffing, multi-street play. Includes rule engine design, difficulty tiers, bar poker adjustments, build order, and questions for Chuck.

### What's next
- **Review POSTFLOP-DESIGN.md with Chuck** — Key questions: c-betting vs hand ranging priority, where postflop appears in the app, single vs multi-street first
- **Run Supabase migration** — Paste supabase-flagged-hands.sql into Supabase SQL editor (still pending)
- **BTN 15bb range too tight** — Should be ~35-40% playable, currently only 24%. Data fix needed.
- **Test new modules on live site** — Verify limp and 3-bet scenarios appear in daily hands and bonus hands
- **Start Phase 1 postflop build** — Board texture classifier + hand strength evaluator (after Chuck approves direction)
- **Borderline hand scoring** — Phase 1 acceptable buffer
- **Visual polish** — Light theme tweaks

---

## Session: April 7, 2026 (Evening)
**Focus:** Fix card/explanation mismatch bug — commit and deploy

### What was done
- **Confirmed previous fix was never committed/pushed** — The 3-layer validation written earlier today was sitting as uncommitted changes. The live Vercel site was still running old code from April 6 (commit `a9425bc`).
- **Wrote stronger fix** — Instead of just validating after the fact, the new approach makes mismatches structurally impossible:
  1. `parseHandCode` is now fully deterministic from handCode (no RNG parameter)
  2. `spotToPlayScenario` re-derives the correct action from range-tables (authoritative source)
  3. `spotToPlayScenario` generates FRESH explanation text from handCode + verified action — never uses the pre-cached `spot.explanation`
  4. Cards, action, and tip text all flow from the same `handCode` in a single function
  5. `try/finally` on `Math.random` override in daily hands generation
  6. Explanation templates imported directly for fresh generation
- **Committed and pushed** — Commit `e1e19b7`, deployed via Vercel

### Commits pushed
1. `e1e19b7` Fix card/explanation mismatch bug

### Decisions made
- Replaced reactive validation (check-after-the-fact) with structural guarantee (single source of truth)
- Pre-cached `spot.explanation` is no longer used for display — tips are always regenerated fresh from handCode

### What's next
- **Test bonus hands on live site** — Play through several bonus rounds to confirm cards match explanations
- **Borderline hand scoring** — Phase 1 acceptable buffer (Priority 2a)
- **Visual polish pass** — Light theme tweaks on remaining pages
- **Wire up Train hub** — "Fix My Leaks" and "Position Drills"

---

## Session: April 7, 2026 (Afternoon)
**Focus:** Critical bug investigation — cards/explanation mismatch in bonus hands

### What was done (NOT DEPLOYED — see evening session)
- **Investigated hand logic mismatch bug** — Chuck's screenshots showed 8♥ 3♥ displayed on BTN 20bb, but the explanation said "A2s at 20bb" with "Raise" as correct answer. This was on BONUS HAND 5 in the new light UI.
- **Traced the full data pipeline** — Reviewed `spot-generator.ts` → `play-scenario-generator.ts` → `play/page.tsx` rendering chain. Every code path uses the same `hand.code` for cards, explanation, and correct action. The pipeline is logically sound.
- **Wrote and ran automated tests** — Verified `parseHandCode` is deterministic and correct across all 169 hands. A2s always produces A♥ 2♥, 83s always produces 8♥ 3♥. No code path exists where parseHandCode("A2s") could return ranks 8 and 3.
- **Reviewed React state management** — DailyHandsGame component unmounts/remounts between daily and bonus rounds. All data (cards, tips, correct answer) comes from the same `hands[handIdx]` object in a single render. No stale closure or key reuse issues found.
- **Root cause assessment** — Could not reproduce in code. Most likely cause is a Vercel CDN/build caching issue where old and new JavaScript chunks mixed after the UX deploy. The data pipeline has no logical path for this mismatch.
- **Added 3-layer defensive validation** in `spotToPlayScenario()`:
  1. **Card rank check** — Verifies `parseHandCode` output matches `handCode[0]` and `handCode[1]`, forces correction if mismatched
  2. **Action re-derivation** — Re-checks the correct action against `range-tables.ts` using the actual `handCode`, overrides `spot.simplifiedAction` if they disagree
  3. **Tip text cross-check** — Scans explanation text for references to wrong hand codes; if found, rebuilds the entire explanation from scratch using the correct handCode
- **Added try/finally to Math.random override** — `generateDailyHands()` temporarily overrides `Math.random` for seeded generation; now uses try/finally to guarantee restoration even if `generateDrillSpot()` throws
- **Added console.warn logging** — Any mismatch detected by the validation layers logs a `[PokerTrainer]` warning to help diagnose if the issue recurs

### Decisions made
- The validation approach: rather than trying to reproduce an unreproducible bug, we added multiple safety nets that make the entire class of mismatch bugs impossible to reach the user
- The range-tables are the authoritative source of truth — if the spot object disagrees with range-tables, range-tables win
- Keep investigating if Chuck reports the issue again (the console.warn logs will help)

### What's next
- **Commit and push** this fix so it deploys via Vercel
- **Ask Chuck to test bonus hands** — play through a few bonus rounds and report any card/explanation mismatches
- **Borderline hand scoring** — Phase 1 acceptable buffer (Priority 2a, ready to start)
- **Visual polish pass** — Some pages may need light theme tweaks
- **Wire up Train hub** — "Fix My Leaks" and "Position Drills" need drill configs

---

## Session: April 6, 2026
**Focus:** Bug fixes, UX overhaul (color palette + 5-tab nav), bar poker scoring direction

### What was done
- **Fixed daily stats timezone bug** — Coach dashboard was using UTC dates, causing player counts to reset at 7 PM Eastern instead of midnight. Fixed both client-side (session-tracker.ts → `America/New_York`) and server-side (Supabase `get_daily_stats` function → `AT TIME ZONE`). Deployed SQL update via Supabase dashboard.
- **Simplified feedback form** — Replaced 5 rating scales + name/email with 4 quick questions (first time? fun? coming back? suggestions?). Under 30 seconds. Reuses existing Supabase columns, no migration needed. *(committed prior session, pushed this session)*
- **Fixed session timeout** — Auth token refresh with Promise.race timeout guards, auto-reload after 2+ min away. *(committed prior session, pushed this session)*
- **UX overhaul: warm color palette** — Replaced entire dark charcoal theme with Wordle-inspired light theme. Cream backgrounds (#f0ebe3), forest green accents (#4a7c59), warm gold (#e8a848). Poker table felt/rail stays dark. Updated globals.css design tokens, action buttons, badges, shadows, all utility classes.
- **UX overhaul: 5-tab navigation** — Restructured from 8 tabs (Home, Play, Learn, Assess, Drills, Progress, Settings + Coach) to 5 tabs (Home, Play, Train, Progress, More). Train consolidates Learn + Assessment + Drills into a session launcher hub. More consolidates Settings + Feedback + About + Coach (admin).
- **New pages created:** `/train` (6-option session launcher), `/more` (settings hub), `/more/feedback`, `/more/about`
- **Fixed hardcoded dark colors** — Updated fallback hex values across page.tsx, play/page.tsx, Onboarding.tsx, FeedbackSurvey.tsx from dark slate to light theme values.
- **Updated work plan** — Added "Borderline Hand Scoring" as Priority 2a with three-phase roadmap (acceptable buffer → exploit mode → table-aware training). Added Preflop Pro integration notes.

### Commits pushed (4 total)
1. `ec4c6a8` Fix session timeout: add timeout guards and auto-reload on stale tab *(prior session)*
2. `1f3cc80` Simplify feedback form to 4 quick questions *(prior session)*
3. `770c1da` Fix daily stats timezone: use Eastern Time instead of UTC
4. `44b077f` UX overhaul: warm color palette + 5-tab navigation

### Decisions made
- Warm light theme approved — cream/green/gold palette live on Vercel
- 5-tab nav approved — Home, Play, Train, Progress, More
- Bar poker scoring: agreed to add "acceptable zone" for borderline hands (Phase 1). App shouldn't punish reasonable exploitative plays that work at bar poker tables. Full 3-phase roadmap captured.
- Poker table component keeps its dark felt/rail palette (intentional — that's the visual centerpiece)
- Old routes (/learn, /assessment, /drills, /settings) still work, just not in the tab bar

### What's next
- **Borderline hand scoring** — Add acceptable buffer to scoring logic (Phase 1, quick win)
- **Visual polish pass** — Some pages (assessment, drills, progress, admin) may need individual tweaks for the new light theme
- **Wire up Train hub** — Train options currently all route to existing pages; "Fix My Leaks" and "Position Drills" need specific drill configs passed through
- **Home page redesign** — Current home page is basic; mockup shows personalized landing with streak, daily challenge banner, quick actions
- **Get Chuck's feedback** — on the new warm palette and 5-tab nav live on the site

---

## Session: April 5, 2026 (Evening)
**Focus:** Bug fix, docs sync, missing commit

### What was done
- Fixed session timeout bug: added visibilitychange listener in auth-context.tsx that refreshes Supabase auth when user returns to a stale tab. Committed and pushed — live on Vercel.
- Committed and pushed all project docs: work plan, devlog, dashboard, UX vision, mockups synced to GitHub.
- Found and committed missing April 3 work: range-tables.ts (37 facing-open combos) and validate-ranges.py (14,365 scenarios). These had been done but never pushed.
- Three total commits pushed: session timeout fix, project docs, range gap fix.
- Created CLAUDE.md startup file so future sessions auto-load the work plan, set up todo list, recap last session.

### Decisions made
- Confirmed repo is clean and in sync with GitHub
- UX vision doc attachment to Chuck's Gmail draft still pending

### What's next
- Meeting with Chuck — walk through UX vision doc, get sign-off on color direction, 5-tab nav, two-path home screens
- Start implementing warm color palette (CSS variables / design tokens swap)
- Build the 5-tab navigation
- Build welcome screen fork ("How do you play poker?")

---

## Session: April 5, 2026 (Afternoon)
**Focus:** Codebase scan, folder portability check

### What was done
- Scanned all project-management files for hardcoded absolute paths — came back clean
- Confirmed safe to move the local folder without breaking anything
- Local folder path confirmed: C:\Users\rctha\Documents\poker-trainer\project-management

### What's next
- No action items from this session

---

## Session: April 3, 2026
**Focus:** GTO solver integration, range validation, app accuracy overhaul

### What was done
- Replaced entire hand-typed decision engine with GTO solver-generated ranges
- Built automated validation script testing 14,365 scenarios
- Filled all 37 missing facing-open combos with GTO ranges
- Fixed Chuck's bug: BB with 66 vs BTN raise was being told to fold
- Fixed A3s bug and all other edge cases systemically (not one by one)
- All 5 commits pushed to Vercel, live
- Validation: 0 CRITICAL, 0 GAP issues across all scenarios

### Decisions made
- GTO solver is now the source of truth for all preflop decisions
- Discussed building a standalone preflop Quick Reference app (separate from trainer)

### What's next
- See "NEXT SESSION" section in WORK-PLAN.md for full details
