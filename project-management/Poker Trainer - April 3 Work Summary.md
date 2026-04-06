# Poker Trainer — Development Update
**April 3, 2026**

---

## The Big Fix: Hand Decision Accuracy

This was our #1 priority today. The app was giving wrong answers on certain hands — most notably telling players to fold A3s in the SB vs a CO open at 25bb, which is flat-out wrong. After investigating, we found the root cause wasn't a one-off typo. The entire decision engine was built on hand-typed lookup tables with no mathematical verification. 37 of the 60 facing-open position combos were completely missing, and even the ones that existed had errors in edge cases.

**What we built:** A GTO preflop equity engine (`generate-ranges.py`) that replaces all hand-typed data with mathematically generated ranges. Instead of a human guessing what hands should do in each spot, the solver calculates expected value for jamming, opening, calling, and folding using preflop equity math, fold equity modeling, and pot odds — the same approach commercial poker solvers use.

**Results:**

- 23 out of 23 GTO benchmarks pass (including the A3s bug and Chuck's 66-in-BB bug from earlier)
- All 60 facing-open combos now have complete, correct data (was 23 of 60 before today's session)
- 14,365 total scenarios validated with 0 critical issues
- Opening ranges now match standard GTO charts: UTG ~15%, HJ ~19%, CO ~27%, BTN ~42%, SB ~36%
- Premium hands (AA, KK, AKs) correctly open at deeper stacks instead of jamming
- Trash hands (93o, 82o) correctly fold from early position instead of opening

**Why this matters:** Every hand the app presents will now have a defensible, mathematically correct answer. Our credibility depends on being right, and now we have the engine to back it up. If we ever need to adjust ranges, we re-run the solver — no more manual editing.

---

## Other Fixes Deployed Today

**Leaderboard rank display** — Was always showing "#1" because it only showed rank without context. Now shows "Place X of Y players" so testers can see where they actually stand.

**Poker IQ trend visualization** — Added a sparkline chart on the Play home screen showing IQ growth over the last 14 days. Gives players a visual sense of improvement.

**Feedback collection improvements** — Response rate from testers was low. Three changes: (1) added quick emoji reaction buttons on the results screen right after completing a challenge, (2) restructured the survey to lead with a single freeform question instead of required ratings, (3) added a subtle pulse animation on the feedback button after completing a daily challenge.

**Correct action in explanations** — When a player got a hand wrong, the app said "Here's the play" but never actually stated what the correct play was. Now it explicitly says "The correct play is Call" (or Fold, Raise, All-in) before the explanation.

**Error boundary** — Added a global error handler so if anything crashes in the browser, players see a branded error screen with a refresh button instead of a blank page.

---

## Commits Pushed

1. `ef343d1` — Fill all 37 missing facing-open range combos
2. `e83a346` — Fix leaderboard rank display and add IQ trend sparkline
3. `d3ab6e8` — Improve feedback collection and add error boundary
4. `5f724bc` — Fix SB defense ranges and show correct action in explanations
5. `937047e` — Replace hand-typed ranges with GTO solver-generated data

All changes are live on Vercel.

---

## What's Next

- **League structure** — Ready to build out the league/competition framework
- **Expanded scenarios** — Adding limpers, raisers, and 3-bettors to make drills more realistic (Phase 3)
- **Post-assessment summary** — Written analysis and training recommendations after completing an assessment
