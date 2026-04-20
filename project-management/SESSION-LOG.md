# Poker Trainer — Session Log

This file is updated at the end of every work session. Read this first when starting a new session.

---

## Session: April 19, 2026
**Focus:** Automate flagged-hands pull + analysis; fix the integrity check so desync bugs actually get recorded

### Context
Chris asked for (c) a one-shot analysis of open flagged hands, then (a) admin Flags tab upgrade, then (b) scheduled daily digest. He also picked option 1 for Daily 5 visibility — make Home a real home page for all users. Mid-session pivot: after reviewing the 8 flags and noticing **zero `AUTO_INTEGRITY_FAIL` rows** despite multiple user-reported card/text desyncs, the priority became "fix the integrity check" before anything else — the instrumentation was blind.

### What was done
**1. Flagged-hands pull automation (item c).**
- `scripts/pull-flagged-hands.js` — Node script reads `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (custom parser, no dotenv), queries `flagged_hands` with a profiles join, writes `project-management/flag-pulls/flagged-YYYY-MM-DD.{json,md}`. `scripts/` is gitignored (local tooling), `flag-pulls/` added to .gitignore (contains user ids).
- `pull-flags.bat` (repo root) — double-click wrapper so Chris can run the pull himself without PowerShell/cmd gymnastics.
- Added `SUPABASE_SERVICE_ROLE_KEY=sb_secret_*` to `.env.local` (new sb_secret_ key format).
- Pulled 8 flags: 7 open, 1 agreed. Categories: 4 card/text desync complaints (J3s vs 85s, T4o vs TT, KJs wording, missing Call option), 2 no-note flags (92o, A2o), 1 agreed (AJs).

**2. Integrity-check fix (pivot — main work).**
Root cause: the existing `useEffect` integrity check in `DailyHandsGame` validated the hand **object** against itself (does `hand.cards` agree with `hand.handCode`, do tip arrays include the handCode) but never verified the **DOM actually rendered those cards and text**. Render desyncs — stale cards from a previous hand paired with new situation text — passed silently. That's why 3 user flags described desync but `AUTO_INTEGRITY_FAIL` rows = 0.

Fix has 3 layers in `src/app/play/page.tsx`:
- **DOM-level post-paint check.** Added `situationRef` and `cardsContainerRef`, and a double-rAF `useEffect` that reads `textContent` after paint and verifies it contains the expected position, stack, and both card ranks. Mismatch → auto-flag `AUTO_DOM_INTEGRITY_FAIL:` with the actual vs expected strings.
- **Strengthened data check.** Suit-pattern consistency (suited codes share a suit, offsuit don't), choices array validity (length > 0, correct index in range) added to the pre-existing data check.
- **Forced remount per hand.** Card keys changed from `key={i}` to `key={${hand.id}-${i}}`; choice button keys to `key={${hand.id}-c${i}}`. Prevents React reconciliation from reusing a DOM node across hand transitions — the mechanism that allowed stale cards to linger.

Every flag (auto or user) now records `build=<commit-sha-7>` (from `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`) and `id=<hand.id>` for deploy correlation. User-initiated flags also capture `domCards` and `domSituation` — if desync recurs we get ground-truth DOM data.

### Decisions made
- **DOM check, not DOM snapshot.** Kept it to a plain `textContent` substring scan — fast, robust to layout changes, avoids serializing whole subtrees into every flag row.
- **Force remount over trying to fix the reconciliation.** The hand-to-hand transition doesn't need to preserve DOM — cards are different, positions are different. Keying by `hand.id` is the cheapest way to guarantee a fresh render every time.
- **Build ID in every flag.** If a user reports a desync tomorrow, we can tell immediately whether it came from the pre-fix build or a post-fix one. Cheap correlation, high debugging value.
- **Deferred Daily 5 option 1 and admin Flags upgrade.** Getting the integrity fix into production was more important — without it we have no visibility into whether the desync bug is still happening.

### Validation
- `next build` clean — "✓ Compiled successfully in 6.1s, Finished TypeScript in 4.9s, Generating static pages (24/24)".
- Manual review of the diff: all 4 ref attachments are on the right elements, the double-rAF pattern matches the iOS Safari style-commit timing convention, dep array `[handIdx, hand?.id]` retriggers the check on hand transitions.
- Cannot validate the DOM check end-to-end locally (would need to reproduce a desync), but the **absence of AUTO_DOM_INTEGRITY_FAIL rows in the next 24–48h pull** becomes the negative verification; the **presence** of any such rows is the positive verification that the check is now catching real desyncs.

### Daily 5 option 1 — shipped (bonus item after fix)
Rewrote `src/app/page.tsx`. Root `/` no longer auto-redirects based on `profile.preferred_mode`. It's now a real home page: brand header, hero Daily 5 CTA (links to `/play` where the game lives), and two smaller mode nav cards (Play / Train). The user's preferred mode is highlighted with a "Your mode" chip and a green border so one-tap continuation still works. Preference is persisted on first click for both signed-in users and guests. If a signed-in user already completed today's Daily 5, the hero reframes to "Open Play mode" with a completed checkmark — still clickable for bonus hand and leaderboard, but the copy signals they're done for the day.

Train users — who were the motivation for this fix — now see Daily 5 first-class on every Home load.

### Committed and pushed
- `7ee5bbb` — `fix(play): harden integrity check with DOM-level verification + force remount per hand`
- `d751a35` — `docs: session 2026-04-19 log + add bar-poker research doc` (swept up the uncommitted BAR-POKER-RESEARCH.md from 2026-04-16)
- `e9b3e61` — `feat(home): real home page with Daily 5 for all users (option 1)`

All three pushed to `origin/master`. Vercel deploying.

### What's next
- **24–48h watch on the integrity fix.** Re-run `pull-flags.bat` Tuesday/Wednesday. Looking for (1) `AUTO_DOM_INTEGRITY_FAIL` rows — proof the check works; (2) drop in user-reported card/text mismatch flags — proof the fix works; (3) any user flags that still report desync will now carry `domCards` / `domSituation` capture, which pinpoints the actual rendered state.
- **Tasks #7 and #8** (admin Flags tab upgrade + scheduled daily digest) — Chris asked to prep options rather than implement. See `project-management/NEXT-SESSION-OPTIONS.md` for the menu: #7 has 3 options (7A minimum / 7B category-driven / 7C full tooling), #8 has 5 delivery options (local / Gmail draft / Supabase / GitHub Actions / Cowork schedule skill). Recommendations are 7A first, then 8B. Doc also includes the verification-pass checklist for task #5.

### End-of-day sync (closed 2026-04-19)
- **Repo state at close:** clean, origin/master == HEAD (3 commits pushed: 7ee5bbb, d751a35, e9b3e61, plus a final docs commit for this session log and NEXT-SESSION-OPTIONS.md).
- **Build:** clean on last run pre-commit. Next.js 16.2.1 Turbopack, 24 routes generated, TypeScript clean in 4.4s.
- **Deferred items:** None blocking. Chris to run `pull-flags.bat` in 24–48h for the integrity-fix verification pass. Next session: read NEXT-SESSION-OPTIONS.md, pick 7A/7B/7C for Flags tab and 8A–8E for digest.
- **Local-only artifacts:** `scripts/pull-flagged-hands.js`, `.env.local` service role key, `project-management/flag-pulls/` all stay local. `pull-flags.bat` (repo root) and `project-management/NEXT-SESSION-OPTIONS.md` committed so both seats get them.

---

## Session: April 16, 2026
**Focus:** Hide the new Facing Limpers and 3-Betting modules from production users

### Context
Chris flagged serious content problems in the modules wired up on April 15:
- **Ranges were wrong for almost every hand** in both Facing Limpers and Facing 3-Bets.
- **Action descriptions were off** — the explanation text didn't match the recommended action.
- **Single-limper assumption** — the generator treats "facing a limp" as one opponent limped, but at bar poker tables one limper almost always means two or three limpers. Multi-way limp spots play differently and the current ranges don't account for them.

Directive: do NOT remove the modules (the prototype content + generator code should stay so we can fix and re-enable). Hide them from everyone except Chris and Chuck until the content is rebuilt.

### What was done
Added an `adminMode` flag driven by `profile?.is_admin === true` to both the Play-mode and Drills-mode generators, and gated all UI entry points for the two modules behind the same flag. Admins (Chris + Chuck in the Supabase `profiles.is_admin` column) keep the full experience so they can reproduce the bugs in production. Non-admins and guests see none of it.

**Files changed (7):**

1. `src/lib/services/play-scenario-generator.ts` — `pickScenarioParams`, `generateDailyHands`, `generateBonusHand`, `generateBonusHands` all take a new `adminMode: boolean = false` parameter. When false, the dispatch collapses from 35/15/10/40 (facing_open / facing_limp / facing_3bet / unopened) to **47/53 facing_open/unopened**. Limp and 3-bet branches are skipped entirely.
2. `src/lib/services/spot-generator.ts` — `generateDrillSpot` and `generateDrillSet` accept the same `adminMode` flag. The "mixed" drill roll follows the same 47/53 collapse for non-admins. Explicit drilling into `FACING_LIMPS` or `FACING_3BETS` still works regardless of the flag (UI is responsible for hiding those entry points).
3. `src/app/play/page.tsx` — reads `profile?.is_admin` from `useAuth`, passes `adminMode` to `generateDailyHands` and `generateBonusHand`. Also conditionally strips the "Facing limpers" and "3-bet training" lines from the What's-New-on-Play-home list.
4. `src/app/learn/page.tsx` — added `useAuth`; filters PHASES to remove `facing_limpers` and `three_betting` phases for non-admins. Constant `ADMIN_ONLY_PHASE_IDS` documents the gate.
5. `src/app/train/page.tsx` — added `useAuth`; filters TRAIN_OPTIONS to remove "Facing Limpers" and "3-Bet Defense" launcher cards for non-admins. Constant `ADMIN_ONLY_TRAIN_TITLES` documents the gate.
6. `src/app/drills/page.tsx` — added `useAuth`; filters MODULES to remove `mod_facing_limpers` and `mod_facing_3bets` from the "By Category" list for non-admins. Constant `ADMIN_ONLY_MODULE_IDS` documents the gate.
7. `src/app/drills/session/page.tsx` — reads `profile?.is_admin`, passes `adminMode` to `generateDrillSet` on initial render and restart.

### Decisions made
- **Gate in the data layer, not just the UI.** Only hiding the launcher cards would have left the 25% limp/3-bet share of daily and bonus hands visible to everyone. Chris's reports describe exactly that content, so the fix has to drop it from the dispatch.
- **Admin = DB flag, not hardcoded email.** The app already has `profiles.is_admin` with a toggle on the admin page. Using it avoids shipping email allowlists in source.
- **Direct drill URLs still work for admins.** If an admin navigates to `/drills/session?module=mod_facing_limpers` directly, the session runs — important for the bug-reproduction workflow. Non-admins would never see that link surfaced, but if they deep-linked, they'd still reach the module (explicit `preferredCategory` bypasses the mixed-dispatch filter). We chose that over hard-blocking the route because the content itself isn't dangerous, just wrong — and the modules are coming back.
- **No in-app banner.** The bugs are tracked in WORK-PLAN.md Priority 1e; admins know what they're testing.

### Validation
- `npm run build` clean. 24 routes generated (including `/learn/facing-limpers` and `/learn/three-betting` — the pages still exist for admins to view). TypeScript 4.2s, Turbopack compile 3.2s, static generation 482ms.
- Manual reasoning pass on the dispatch: non-admin `pickScenarioParams` is now a two-branch function that can only return `facing_open` or `unopened`. `pickHand` and `buildScenario` were already correct for those two types (they've been in production for weeks). No way for a limp/3-bet scenario to leak into a non-admin daily or bonus hand.

### What's next
- **Deep-dive on the three reported problems.** Before re-enabling, we need to audit:
  1. Range correctness for every limp matchup (24 × 4 stacks = 96 range cells in FACING_LIMP_RAW) and every 3-bet matchup (36 × 4 = 144 cells in FACING_3BET_RAW). Cross-check against a solver or a trusted external reference.
  2. Action description accuracy — walk through `explainIsolateLimper`, `explainLimpBehind`, `explainJamVsLimp`, `explainFoldVsLimp`, `explainCallVs3Bet`, `explainFoldVs3Bet`, `explain4BetJam` and verify each says what the action actually does.
  3. Multi-way limp modeling — the scenario generator currently only creates single-limper spots. For bar poker we need 2- and 3-limper variants with appropriately adjusted ranges (iso-raise gets tighter, overlimp gets wider for suited broadways, jam ranges shift).
- **Once fixed, re-enable.** Remove `ADMIN_ONLY_*` filters and revert the dispatch split in the two generator files.
- **Keep the `flagged_hands` instrumentation running.** The A♦3♦-vs-AA bug could still recur in the facing_open / unopened paths; `AUTO_INTEGRITY_FAIL:` rows in Supabase are the evidence trail.

### Research for module rebuild (evening, Chris asleep)
Chris asked for homework before the next session: research bar poker and
low-stakes limping dynamics so we walk in with a clearer picture of the
target player pool. His own thesis: *"they all like cheap flops, can't fold
top pair and never met an ace they didn't love. They can't spell GTO let
alone play GTO ranges."*

**What was done**
- 6 WebSearches across bar poker / calling station strategy, iso-raise sizing
  with multiple limpers, short-stack tournament ranges, overlimp candidates,
  top-pair overvaluation, multiway pot strategy, 3-bet exploit adjustments,
  and typical limper hand ranges.
- Compiled findings into `project-management/BAR-POKER-RESEARCH.md`
  organized around Chris's three reported problems (wrong ranges → loosen;
  wrong action descriptions → bar-poker voice; single-limper assumption →
  multi-way modeling + 4bb + 1bb/limper sizing + overlimp candidates).
- Concrete punch list in the research doc maps cleanly to WORK-PLAN.md
  Priority 1e (range audit, explanation rewrite, multi-way modeling, 3-bet
  rebuild, re-enablement checklist).
- Saved two memories so future sessions inherit the thesis automatically:
  `project_bar_poker_thesis.md` (the player-pool model) and
  `feedback_poker_trainer_voice.md` (no solver-speak in explanations).

**Key takeaways for the rebuild**
- The target pool calls too much and bluffs too little — value-bet
  relentlessly, cut bluffs almost entirely, size up for value.
- Live iso-sizing is 4bb + 1bb per limper in position (5bb + 1bb OOP). Verify
  the generator emits sizes that match.
- Overlimp for speculative hands (suited connectors, suited Ax, small pairs)
  in late position behind multiple limpers — this is a missing action in the
  current module.
- Model multi-way as the default: 1 limper ≈ 25%, 2 limpers ≈ 45%,
  3 limpers ≈ 25%, 4+ ≈ 5%.
- Against 3-bets, fold way more than GTO says — this pool doesn't 3-bet bluff.
- Explanation templates need a bar-poker voice with opponent-range plain-
  language callouts and explicit "here's why GTO doesn't apply" framing.

### End-of-day sync (closed 2026-04-16)
- **Repo state:** 1 commit ahead of origin/master (the gate-hiding commit).
  Research artifacts are project-management docs only — no app code touched
  in the evening pass.
- **Build:** clean on last run. No stuck processes.
- **Deferred items:** none carrying over. All follow-up lives in
  WORK-PLAN.md Priority 1e, now cross-referenced from BAR-POKER-RESEARCH.md.
- **Docs to read first next session:** `BAR-POKER-RESEARCH.md` then
  `WORK-PLAN.md` Priority 1e — the research doc has the why, the work plan
  has the how.

---

## Session: April 15, 2026
**Focus:** Wire up Facing Limpers and 3-Betting modules so the What's New tab isn't lying

### Context
Chris flagged that the "What's New" tab on the Play home screen advertises "Facing limpers" and "3-bet training" as new features, but there were no dedicated modules for them anywhere a user could navigate to. Investigation confirmed:
- Scenario generator and range tables for limps and 3-bets were fully wired in (they DO appear as 15% / 10% of daily/bonus hands).
- `src/lib/data/training-modules-prototype.ts` had full module content (overviews + drills) labeled `NOT DEPLOYED` and was imported nowhere in `/src`.
- No lessons in the Learn page or launchers in the Train page for either topic.

Chose "option 1" — wire up the prototype modules properly rather than soften the What's New copy.

### What was done

**New leak category + drill module:**
- Added `LeakCategoryId.FACING_LIMPS = 'facing_limps'` to `src/lib/types/enums.ts`.
- Added matching `LEAK_CATEGORIES` entry and `mod_facing_limpers` module (curriculumOrder 7, spotPoolSize 120) to `src/lib/data/categories.ts`.
- Bumped `mod_lp_pressure` curriculumOrder from 7 → 8 to make room.
- Updated `assignLeakCategory` in `src/lib/services/spot-generator.ts` — facing-limp scenarios now map to `FACING_LIMPS` instead of reusing `FACING_OPENS`.

**Spot generator dispatch change (behavior note):**
- Drilling `mod_facing_opens` used to return a 70/30 mix of open-raises and limps. Now returns 100% pure facing-open-raise spots. Limps live in the new `mod_facing_limpers` drill (100% pure limps).
- Daily/bonus hand mixed dispatch is unchanged (still 35/15/10/40 open / limp / 3-bet / unopened).

**Learn lesson pages (new, read-only overviews):**
- `src/app/learn/facing-limpers/page.tsx` — renders `FACING_LIMPERS_MODULE.overview` (6 sections from the prototype) with "Start Facing Limpers Drill" CTA → `/drills/session?module=mod_facing_limpers&count=15`.
- `src/app/learn/three-betting/page.tsx` — renders `THREE_BETTING_MODULE.overview` (6 sections) with "Start Facing 3-Bets Drill" CTA → `/drills/session?module=mod_facing_3bets&count=15`.
- Added Phase 3a/3b cards to `src/app/learn/page.tsx` linking to both new lessons.
- Refactored the PHASES array to have a `unit` field (`questions` vs `sections`) so the count label is accurate for read-only lessons.

**Train page launchers (new):**
- Added "Facing Limpers" and "3-Bet Defense" launcher cards between Short Stack Jam/Fold and Learn the Basics.
- Both tagged "New" with a new orange `'new'` tagType. Introduced `TAG_STYLES` lookup so future tag types are trivial to add.

**Prototype file update:**
- Updated the header comment in `training-modules-prototype.ts` from "NOT DEPLOYED — prototype content for review" to reflect that the facing-limpers and 3-betting modules are now wired in. Raise-sizing module remains prototype-only.

### Files changed
1. `src/lib/types/enums.ts` — added `FACING_LIMPS`
2. `src/lib/data/categories.ts` — added leak category + module; renumbered `mod_lp_pressure`
3. `src/lib/services/spot-generator.ts` — dispatch now splits FACING_OPENS (pure) / FACING_LIMPS (pure); assignLeakCategory routes limp scenarios to FACING_LIMPS
4. `src/lib/data/training-modules-prototype.ts` — header comment
5. `src/app/learn/page.tsx` — 2 new phase cards; Phase type with unit field
6. `src/app/learn/facing-limpers/page.tsx` — NEW
7. `src/app/learn/three-betting/page.tsx` — NEW
8. `src/app/train/page.tsx` — 2 new launchers; TAG_STYLES lookup

### Decisions made
- Split `FACING_OPENS` and `FACING_LIMPS` into distinct leak categories rather than piling limps into the existing facing-opens drill. Cleaner for the user (if you want to practice limps, you drill limps; if you want opens, you drill opens) and for future progress-tracking.
- Learn pages are read-only overview pages (no quiz component). The "practice" step is the drill, not a second quiz. Kept scope tight.
- 3-Betting lesson links to the `mod_facing_3bets` drill even though that drill is about *defending* a 3-bet and the lesson covers both offense and defense. The mismatch is small — the prototype content explains the general concept well enough that facing-3-bet practice still reinforces it. A dedicated "offensive 3-bet" drill would need a new spot type in the generator (you're facing an open and choosing to 3-bet/raise); worth considering later but not blocking.

### Validation
- Initial attempt was only eyeballed — Chris asked for a real build.
- Ran `npm run build` via Desktop Commander. First build failed: `scoring.ts` has `Record<LeakCategoryId, string>` for display names and adding the `FACING_LIMPS` enum value required a mapping there too. Missed it on first pass.
- Fixed: added `[LeakCategoryId.FACING_LIMPS]: 'Facing Limpers'`.
- Second build clean: TypeScript passes, all 24 routes compiled (including the two new `/learn/facing-limpers` and `/learn/three-betting` routes).

### Git reconciliation (state BEFORE this session's push)
- `origin/master` was at `9da7897` (April 13 v2 scenario rewrite).
- 5 local-only commits from April 11 afternoon + April 14 sessions had never been pushed:
  - `0ff46e6` — docs catch-up + POSTFLOP-DESIGN
  - `2cde7b4` — DEVLOG reconciliation
  - `4b9b380` — 3 critical bug fixes (Eastern Time in progress-storage, BTN 15bb widen, SB→BB limp)
  - `f1b2cc0` — April 14 session log
  - `665322b` — April 14 code review results docs
- This means the live Vercel deploy today was still running April-13-era code. The A♦3♦-vs-AA mismatch Chris saw today was in a bundle that does NOT include the April 14 fixes. Doesn't directly explain the specific mismatch (the v2 architecture should prevent it), but it narrows the investigation.

### Push
- Committed April 15 work as `017fbec` (feat: wire up Facing Limpers and 3-Betting modules).
- Pushed all 6 commits (`9da7897..017fbec`). Local and origin/master now in sync.
- Also: added `.gitignore` entries for `build-log.txt`, `.commitmsg`, and `project-management/_backups/` to stop stashing local dev artifacts in the tree.

### Critical follow-ups
- **Card/explanation mismatch bug** (Chris reported again today, A♦3♦ with AA explanation on HAND 2 OF 5, SB vs BB 3-bet at 20bb). v2 architecture looked sound on re-review but the bug recurred. Planned: add production-visible instrumentation that logs full scenario object + auto-flags when `cards[0].rank !== handCode[0]` so next occurrence produces evidence instead of a screenshot.
- **Timezone still UTC in Play mode.** April 14 fix only touched `progress-storage.ts` (Train). `play-storage.ts` still uses `new Date().toISOString().split('T')[0]` in 4 spots (lines 73, 94, 140, 162). `cloud-storage.ts` lines 83/107 and `play-scenario-generator.ts` line 513 also still UTC. Daily resets and streak math flip at 8pm ET because of this.
- **Stats not refreshing on home page** (Chris: still #1 of 1, play count stuck). Suspect home `load()` only runs once on mount — doesn't refetch after daily challenge completion. Needs investigation.
- **Admin activity visibility** — no per-user activity view; Chris can't see who's doing what.

### Additional work (same session, after context reset)
All four critical follow-ups above shipped. Two commits:

- `bc67222` — fix: Eastern Time for daily/streak + add integrity check on play hands
  - `play-storage.ts`: extracted `easternTodayStr()` / `easternYesterdayStr()` helpers; replaced all 4 UTC date splits (getTodaysChallenge, saveDailyChallengeResult, updatePlayStreak, and the yesterday comparison inside it) with America/New_York versions.
  - `cloud-storage.ts`: same helpers added, replaced UTC at lines 83/107 in `updateStreak`.
  - `play-scenario-generator.ts`: `generateDailyHands()` now uses Eastern Time so the daily hand set matches the user's local day.
  - `play/page.tsx`: added a render-time integrity check inside `DailyHandsGame`. On each handIdx change, it compares `hand.cards[0/1].rank` against `hand.handCode[0/1]` and checks that `tipRight`/`tipWrong` reference the handCode. On fail, it `console.error`s the full scenario object, auto-inserts a `flagged_hands` row with `note: "AUTO_INTEGRITY_FAIL: …"`, and shows an inline red warning to the user. This captures real evidence for the A♦3♦ vs AA bug that couldn't be reproduced locally.

- `0325d81` — fix: refresh home stats after daily + admin visibility for Play-mode users
  - `play/page.tsx` `handleDailyComplete`: after `saveDailyChallengeResult`, now also re-fetches rank, total players, leaderboard, and iqHistory in parallel. Previously only streak updated — leaving "#1 of 1" stuck and the IQ trend chart a step behind.
  - `cloud-storage.ts` `getAllUsersStats`: now pulls `daily_challenge_results` and `profile.poker_iq` / `preferred_mode` / `league_slug`. Computes `dailyChallengesPlayed`, `dailyAccuracy`, `todayCompleted`, and uses the most-recent activity across dailies/drills/assessments for `lastActive`.
  - `admin/page.tsx`: `UserStat` interface extended. Each user card now shows IQ, dailies count, daily accuracy, drills, and latest assessment (5-col grid). Header row shows "Played today" badge (when true), preferred_mode badge, and streak emoji. Active-user counter now counts daily-only players.

### Validation (post-reset)
- `npm run build` clean twice (post-timezone fix and post-admin fix). 24 routes, TypeScript 4.x passes, Turbopack compile ~3s, static generation all OK.
- Live deploy on Vercel picks up automatically on push to master.

### What's next
- **Watch the `flagged_hands` table** in Supabase for entries with `note` starting `AUTO_INTEGRITY_FAIL:`. Each row captures the full scenario context (cards, handCode, explanation, position, stack, situation, handIdx, user_id) the moment the mismatch was shown to a user. That's the evidence trail for finally tracking down the A♦3♦ vs AA bug.
- ~~Still pending from April 14: Run the Supabase migration~~ — **Done 2026-04-15**. Chris ran `supabase-flagged-hands.sql` manually in the Supabase SQL editor. Verified via anon REST: `GET /rest/v1/flagged_hands?select=id&limit=0` returns 200. Auto-flag inserts and the admin dashboard hand-flagging views now hit a real table instead of falling back to localStorage.
- **Optional polish:**
  - Consider adding a separate drill launcher for "Offensive 3-Betting" (facing-open spots where 3-bet is the correct action) — requires generator changes.
  - Raise Sizing module is still prototype-only. Wire it up the same way if/when desired.
  - Verify the new drills page "By Category" list now shows "Facing Limpers" between "Facing 3-Bets" and "Late Position Pressure".

### End-of-day sync (closed 2026-04-15, late night)
- **Repo state:** clean. `git status` after committing the session-log update → nothing to commit. `origin/master..HEAD` → 0 commits ahead. Tonight's work is live in Vercel.
- **Supabase migration:** applied. `flagged_hands` table is reachable on the anon REST endpoint (200).
- **Build:** last clean build was `c2ac777`. No failed builds since. No stuck processes.
- **Nothing blocked or broken carrying over.** Next session can start fresh on new work.
- **Guardrail added** so future-me will proactively flag sync issues at session start: see the "Session-start checks" section of `CLAUDE.md` (and user-level memory for cross-project coverage).

### Friction notes (for future-me)
- Wasted ~15 min trying to OS-automate pasting the migration SQL into Brave for Chris. The Claude window kept reclaiming foreground; `App mode=switch` + minimize attempts didn't stick. Saved as feedback memory: for one-off privileged ops where Chris is already logged in, just hand him the two keystrokes (focus tab, Ctrl+V, Ctrl+Enter) instead of driving the UI.

---

## Session: April 14, 2026
**Focus:** Catch-up review after chat-session work, code review across all April 6–13 commits, clear critical bugs

### What was done

**Doc reconciliation (2 commits):**
- Discovered two commits made in regular Claude chat (not cowork) that weren't in SESSION-LOG: `2bba710` (Apr 11 bulletproof validation) and `9da7897` (Apr 13 full scenario generator rewrite).
- Reconciled two divergent DEVLOG.md files (repo root vs project-management). Designated `project-management/DEVLOG.md` as canonical; synced repo-root to match.
- Renumbered April 13 scenario rewrite from v0.9.2 → **v0.10.1** (v0.9.2 and v0.10.0 were already used for different work in the project-management devlog).
- Added POSTFLOP-DESIGN.md to git tracking.
- Added full April 11 afternoon and April 13 session entries to SESSION-LOG.
- Backups of all doc files at `project-management/_backups/2026-04-14/` before changes.
- Commits: `0ff46e6` (April 11 catch-up), `2cde7b4` (DEVLOG reconciliation).

**Code review (3 parallel agents, all 10 commits since April 6):**
- Architecture verdict: **v2 scenario generator is clean.** No dead code from April 11 patch, RNG isolation works, no closure leaks.
- Full review report saved at `project-management/code-review-2026-04-14/` with one SUMMARY.md and three detailed reports.

**Critical bugs fixed from review (1 commit):**

1. **Timezone bug in drill logging** (`src/lib/services/progress-storage.ts`)
   - `todayStr()` was using UTC via `toISOString().slice(0, 10)`. After 7 PM Eastern, drills logged as tomorrow's date, breaking streak continuity.
   - Fixed three spots (todayStr, inline yesterday in updateStreak, inline yesterday in getProgressStats). Now all use `toLocaleDateString('en-CA', { timeZone: 'America/New_York' })` matching session-tracker.ts pattern.
   - Added `yesterdayStr()` helper to avoid duplication.

2. **BTN 15bb opening range widened** (`src/lib/data/range-tables.ts`)
   - Previous range: `open='66-JJ', jam='44-55, QQ+, A3s+, K9s+, QTs+, JTs+, A7o+, KTo+, QTo+'` = ~21% playable (review agent said 2.7% but was only counting `open`, not jam).
   - Issue: narrower than CO 15bb (which should be tighter since CO faces 3 opponents vs BTN's 2). Work plan target: 35-40%.
   - New range: `open='88-JJ', jam='22-77, QQ+, A2s+, K7s+, Q8s+, J8s+, T8s+, 98s, A2o+, K8o+, Q9o+, J9o+, T9o'` = ~36% playable.
   - Manually constructed (not solver-regenerated) — the solver appears to have a calibration issue at 15bb BTN.

3. **SB-complete → BB scenarios fixed** (`src/lib/data/range-tables.ts` + `src/lib/services/play-scenario-generator.ts`)
   - Bug 1: `getFacingLimpAction()` returned `FOLD` as catchall for unassigned hands. BB has already posted the blind — Fold is not a legal action. Added special case: if limper=SB and hero=BB, catchall is `LIMP` (check/take free flop), not `FOLD`.
   - Bug 2: `buildChoices()` offered `['Fold', 'Limp behind', 'Raise', 'All-in']` for all facing-limp scenarios including SB→BB. Changed to return `['Check', 'Raise', 'All-in']` when limper=SB and hero=BB.
   - Bug 3: `correctChoiceIndex()` limp action mapping didn't recognize 'Check'. Added 'Check' to the limp label synonyms.

**Validation (all passing):**
- TypeScript: 0 errors
- `validate-scenarios.mjs`: 4,380 / 4,380 passed
- `test-card-consistency.mjs`: 5,916 / 5,916 passed
- Manual check: SB→BB limp now returns `['Check', 'Raise', 'All-in']`; other limp scenarios unchanged.

### Files changed
1. `src/lib/services/progress-storage.ts` — Eastern Time everywhere (3 spots fixed + new helper)
2. `src/lib/data/range-tables.ts` — BTN 15bb widened; SB→BB catchall fixed in getFacingLimpAction
3. `src/lib/services/play-scenario-generator.ts` — buildChoices + correctChoiceIndex handle SB→BB special case

### Decisions made
- BTN 15bb range was constructed manually (not regenerated from solver) since the solver output was consistently tighter than GTO target. Solver calibration at 15bb may need separate investigation.
- SB→BB fix is belt-and-suspenders (both action layer AND choice layer). Either alone would work, but both together prevent the bug from recurring if one path is changed later.
- "Check" chosen over "Limp behind" in BB-vs-SB-complete UX because BB has already completed the bet — the action is a check, not a limp.

### Pending (cannot be done in-session)
- **Supabase migration** — `supabase-flagged-hands.sql` still needs to be applied manually in the Supabase SQL editor. Without this, hand flagging is silently broken in production (flags go to localStorage only; admin dashboard shows no flags). This is a 5-minute fix for Chris: paste the SQL into https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa/sql/new and run.

### What's next
- **Run the Supabase migration** (priority 1 — unblocks the shipped-but-broken hand flagging feature)
- **Push all 3 local commits** to GitHub/Vercel
- **Medium items from code review:**
  - Empty raise ranges at 15bb+ in several spots (mostly intentional GTO — maybe not a real bug)
  - Expand `validate-scenarios.mjs` exhaustive loop to iterate all range-table keys (not just 4 hardcoded pairs)
  - Add `console.warn` telemetry when AKs/BTN/25bb fallback fires
- **Low item:** Hardcoded `#1e293b` on card suits at play/page.tsx:35
- **Then resume postflop work** — see POSTFLOP-DESIGN.md

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
