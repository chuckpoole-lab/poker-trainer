# Code Review: Facing Limpers & 3-Betting Strategy Modules (April 11 Commit 6230d06)

**Review Date:** April 14, 2026  
**Commit:** `6230d06` ("Add Facing Limpers and 3-Betting Strategy modules")  
**Files Reviewed:** range-tables.ts, explanation-templates.ts, spot-generator.ts, play-scenario-generator.ts  
**Stack:** Next.js 16 + TypeScript

---

## 1. Range Table Correctness (Poker Principles Spot-Check)

### Sample Entries Analysis

#### BTN vs UTG Limp at 15bb
**Entry:** `utg_btn_15`  
**Range:** `jamRange: '44+, A2s+, K6s+, Q8s+, J9s+, T9s+, A4o+, K9o+, QTo+, JTo+'`  
**Analysis:**  
- At 15bb facing a UTG limp, BTN should isolate (raise) wide or jam premiums
- Data shows NO raise range (empty string), only jam with strong pairs (44+) and broadways/strong aces
- **Issue:** This violates poker principle — BTN vs weak UTG limp should have a RAISE range for medium strength hands (22-33, some broadways)
- At 15bb, BTN should not jam all playable hands; some should raise to isolate
- **Severity:** MEDIUM — the jam range is reasonable, but missing the raise range creates a false binary (jam or fold), which is too tight for 15bb

**Recommendation:** Review `utg_btn_15` and similar entries. At 15bb+, BTN should have a raise range of ~22+, some broadways, some Ax hands to build the pot. Jam only premiums (99+, AQo+).

---

#### SB Complete → BB at 15bb
**Entry:** `sb_bb_15` (Facing Limp)  
**Data:** `raiseRange: '', jamRange: '22+, A2s+, K3s+, Q5s+, J7s+, T8s+, 97s+, 87s+, A2o+, K6o+, Q8o+, J9o+, T9o+'`  
**Analysis:**
- SB complete (limp) is extremely weak action. BB is getting 2:1 odds to call with ANY two cards (free option).
- GTO principle: BB should NEVER fold vs SB complete (mathematically impossible to lose chips). BB should raise for value with 100% of hands, or at minimum a huge portion.
- Data shows NO raise range, only jam with roughly 60% of hands
- **Issue:** At 15bb, BB is being told to jam 60% but the remaining 40% is blank (presumably fold), which is anti-GTO. BB should raise with the top hands and limp behind with weak hands, NEVER fold.
- **Severity:** MEDIUM-HIGH — the strategic principle is violated. BB vs SB complete is an "always raise or limp, never fold" spot, not a "jam or fold" spot.

**Recommendation:** For all SB_BB entries, ensure:
1. raiseRange is populated with premium/strong hands
2. limpRange is populated with weak hands  
3. jamRange is rare or empty at 15-20bb (only at short stacks)
4. Fold is NEVER correct vs SB complete (remove from choice builder)

---

#### CO Limp → BTN at 20bb
**Entry:** `co_btn_20`  
**Data:** `raiseRange: '33+, A2s+, K3s+, Q5s+, J7s+, T7s+, 97s+, 87s+, 76s+, A2o+, K7o+, Q9o+, J9o+, T9o+'`  
**Analysis:**
- CO limp is weak. BTN is in position with initiative.
- Range includes all pairs 33+, all aces, broadways — approximately 30%+ of hands
- This is REASONABLE isolation range. At 20bb, BTN can raise with medium-strong hands and jam premiums.
- Jam range is `88+, A9s+, KJs+, AJo+` (premiums only) — correct.
- **Verdict:** CORRECT for this spot.

---

#### HJ Limp → SB at 20bb
**Entry:** `hj_sb_20`  
**Data:** `raiseRange: '55+, A3s+, K9s+, QTs+, JTs+, A8o+, KJo+', jamRange: 'TT+, AQs+, AKo+'`  
**Analysis:**
- HJ limp is weak; SB is out of position but has initiative
- Raise range: medium pairs (55+) and strong hands (A3+, K9+) — approximately 12-15%
- Jam range: premiums (TT+, AQ+, AK+) — correct for short stack
- Out-of-position ranges correctly TIGHTER than in-position equivalents
- **Verdict:** CORRECT.

---

#### BTN vs UTG Open at 15bb (Facing 3-Bet)
**Entry:** `utg_btn_15`  
**Data:** `callRange: '99+, AQs+, AKo', jamRange: ''`  
**Analysis:**
- UTG opens (tight), BTN 3-bets (already committed to aggression)
- At 15bb, BTN called (which means facing a 3-bet jam, not a raise)
- Call range is TT+, AQ+, AK — very tight, only premiums
- No 4-bet jam because stacks are already shallow
- **Issue:** Is this the right direction? If BTN opened wide at 15bb (likely 33+, A2s+, etc.), BTN should have a tighter 3-bet/call range vs UTG 3-bet. TT+ seems TOO tight given how wide BTN opens. Let me check BTN opening range at 15bb...
- **Found issue from separate analysis (point 7 below):** BTN 15bb opening range is only `66-JJ` (6 pairs), not the wide range I would expect
- Given that BTN opens only 66-JJ at 15bb, calling with TT+ vs a UTG 3-bet is TOO TIGHT. If BTN opens 66-JJ, BTN should call with all of those hands vs a 3-bet.
- **Severity:** HIGH — call range is inconsistent with opening range. If BTN opens 66+, BTN should call TT+ (which overlaps opening range). But this entry says call TT+ when the opening range itself only goes to JJ.

**Recommendation:** Verify consistency: what does BTN actually open at 15bb? Then ensure facing-3bet call ranges are calibrated against that same range.

---

#### Overall Range Logic Issues

**Out-of-position ranges vs in-position:**
- UTG limps → BTN (in-position): `jamRange: '44+, A2s+, K6s+, ...'` — wide
- UTG limps → SB (out-of-position): `jamRange: '55+, A2s+, K7s+, ...'` — tighter
- ✓ CORRECT principle (OOP tighter than IP)

**Short stack jam principles:**
- 15bb: jam hands are typically pairs-5+, A2+, some broadways
- 20bb: jam hands can include medium pairs
- 25bb+: raises become viable instead of jams
- ✓ Generally CORRECT

---

## 2. Dispatcher Logic (Spot Generation Distribution)

**Location:** `src/lib/services/spot-generator.ts`, `generateDrillSpot()`

**Code (lines ~490-510):**
```typescript
const roll = Math.random();
if (roll < 0.35) {
  return generateFacingOpenSpot();
}
if (roll < 0.50) {
  return generateFacingLimpSpot();
}
if (roll < 0.60) {
  return generateFacing3BetSpot();
}
return generateUnopenedSpot();
```

**Verification:**
- 0.00–0.35: facing open (35%) ✓
- 0.35–0.50: facing limp (15%) ✓
- 0.50–0.60: facing 3-bet (10%) ✓
- 0.60–1.00: unopened (40%) ✓

**Result:** Math is CORRECT. No off-by-one errors. Each branch is mutually exclusive and total = 100%.

**Edge case:** When `preferredCategory` is passed, dispatcher short-circuits:
- `FACING_OPENS` → 70% facing-open, 30% facing-limp (special case) ✓
- `FACING_3BETS` → always facing-3bet ✓

**Verdict:** CORRECT. No logic errors.

---

## 3. Four-Choice Handling (Facing Limp)

**Location:** `src/lib/services/play-scenario-generator.ts`, `buildChoices()`

**Code (lines ~195-206):**
```typescript
function buildChoices(correctAction: SimplifiedAction, spotType: SpotType, stackBb: number): string[] {
  if (spotType === SpotType.FACING_3BET) {
    return ['Fold', 'Call', 'All-in'];
  }
  if (spotType === SpotType.FACING_OPEN) {
    return ['Fold', 'Call', 'All-in'];
  }
  if (spotType === SpotType.FACING_LIMP) {
    return ['Fold', 'Limp behind', 'Raise', 'All-in'];
  }
  return ['Fold', 'Raise', 'All-in'];
}
```

**Analysis:**
- Facing Limp correctly returns 4 choices: Fold, Limp behind, Raise, All-in
- Function returns an array; no code assumes `length === 3`
- `getCorrectIndex()` uses `.findIndex()` which works with any array length ✓
- No hardcoded index 2 or 3 anywhere in the codebase (checked)

**UI Integration:**
- React components map over `choices` array dynamically — no assumptions about length
- Each choice is rendered without positional logic

**Verdict:** CORRECT. Four-choice system is properly wired. No breaking assumptions.

---

## 4. Explanation Template Correctness

**Checked all 7 new functions:**

| Function | Hand Included? | Coherence | Notes |
|----------|---|---|---|
| `explainIsolateLimper` | ✓ `${hand}` | ✓ Correct | Discusses isolating a limper, mentions weak hand |
| `explainLimpBehind` | ✓ `${hand}` | ✓ Correct | Discusses speculative hands, mentions set mining |
| `explainJamVsLimp` | ✓ `${hand}` | ✓ Correct | Discusses short-stack jam, folding equity |
| `explainFoldVsLimp` | ✓ `${hand}` | ✓ Correct | Discusses weak hands, fold discipline |
| `explainCallVs3Bet` | ✓ `${hand}` | ✓ Correct | Discusses calling a 3-bet with premium |
| `explainFoldVs3Bet` | ✓ `${hand}` | ✓ Correct | Discusses folding vs 3-bet (chip preservation) |
| `explain4BetJam` | ✓ `${hand}` | ✓ Correct | Discusses 4-bet jam with premiums |

**Verdict:** ALL CORRECT. Every template includes handCode and coherent text for the action.

---

## 5. SB Complete → BB Handling

**Location:** `src/lib/services/play-scenario-generator.ts`, `buildChoices()` and `buildSituation()`

**Current Behavior:**
- Scenario is generated as `FACING_LIMP` type with limperPos = SB
- `buildChoices()` returns 4 choices: `['Fold', 'Limp behind', 'Raise', 'All-in']`
- `buildSituation()` detects SB→BB and outputs: "The Small Blind completes. You check or raise from the Big Blind."

**Issue:** The choices array INCLUDES 'Fold', but the situation text says "check or raise". This is misleading. BB should never fold vs SB complete (mathematically incorrect).

**Expected Behavior (GTO):**
- BB should only have: Raise, Limp behind (check/limp). NO FOLD.
- The situation text correctly describes the options ("check or raise")
- But the choices array contradicts this by including "Fold" as an option

**Severity:** MEDIUM-HIGH — Not architecturally broken (fold will just be "wrong"), but teaches bad strategy. Players will learn that folding vs SB complete is an option when it's never correct.

**Recommendation:** In `buildChoices()`, add special case:
```typescript
if (spotType === SpotType.FACING_LIMP && limperPos === Position.SB && heroPos === Position.BB) {
  return ['Limp behind', 'Raise', 'All-in'];  // No Fold
}
```

Or handle this in spot generation — remove Fold from acceptable actions for BB vs SB complete.

---

## 6. Test Coverage for New Types

**Location:** `scripts/validate-scenarios.mjs`

**Findings:**
- File EXISTS in HEAD (April 13) and includes validation for FACING_LIMP and FACING_3BET
- Lines 120-123: `FACING_LIMP_KEYS` and `FACING_3BET_KEYS` are defined
- Lines 139, 144: Both spot types are exercised in the validation loop
- 1,300+ scenarios tested with 0 failures (per April 13 session log)

**Note:** This file did NOT exist at the time of the April 11 commit. It was added in the April 13 rewrite.

**Verdict:** COVERAGE EXISTS (post-commit), but was not part of the original commit 6230d06. No regression testing built into the April 11 commit itself.

---

## 7. BTN 15bb Opening Range (Known Issue)

**Location:** `src/lib/data/range-tables.ts`, line ~152

**Current Data:**
```typescript
[Position.BTN]: { open: '66-JJ', jam: '44-55, QQ+, A3s+, K9s+, QTs+, JTs+, A7o+, KTo+, QTo+' },
```

**Analysis:**
- `open: '66-JJ'` = 6 pairs (66, 77, 88, 99, TT, JJ)
- In 1326 combos: 6 pairs × 6 combos each = 36 combos
- **36 / 1326 = 2.7% of combos** (extremely tight)
- Work plan says: "should be ~35-40%"
- **This is 13–15x too tight.**

**Comparison:**
- BTN 20bb: `'33+, A2s+, K4s+, Q6s+, J7s+, T8s+, 98s+, A2o+, K7o+, Q9o+, J9o+, T9o+'` (visibly much wider)
- BTN 10bb: only jam (no open), which is correct for 10bb

**GTO Reality:**
- At 15bb (57.5 chips at 2/5 game, or ~3 orbits to blinds), BTN should open 35–40% to balance the game
- Current range of 66-JJ is defensive/tight, suitable for 20-25bb stacks
- **Status:** Issue CONFIRMED, OPEN, and CRITICAL

**Severity:** CRITICAL — This directly breaks opening strategy. Any player learning from this range is learning a losing play. This was flagged in WORK-PLAN.md for April 11 session and remains unfixed.

**Recommendation:** Update BTN 15bb open range to include all pairs 33+, all aces, broadways, some suited connectors. Target: ~35-40%.

---

## 8. Summary of Findings

| # | Issue | Severity | File | Line(s) | Status |
|---|-------|----------|------|---------|--------|
| 1 | UTG_BTN_15 missing raise range | MEDIUM | range-tables.ts | 285 | OPEN |
| 2 | SB→BB entries missing raise range (GTO violation) | MEDIUM-HIGH | range-tables.ts | 315-318 | OPEN |
| 3 | BTN opening range at 15bb vastly too tight (2.7% vs 35-40%) | CRITICAL | range-tables.ts | 152 | OPEN, FLAGGED in WORK-PLAN |
| 4 | Dispatcher math | None | spot-generator.ts | 490-510 | CORRECT ✓ |
| 5 | Four-choice handling | None | play-scenario-generator.ts | 195-206 | CORRECT ✓ |
| 6 | Explanation templates missing handCode | None | explanation-templates.ts | all 7 functions | CORRECT ✓ |
| 7 | SB→BB allows Fold option (should not) | MEDIUM-HIGH | play-scenario-generator.ts | 195-206 | OPEN |
| 8 | Test coverage for new types | None | validate-scenarios.mjs | 120-144 | EXISTS (post-commit) |

---

## Recommendations for Next Session

**Critical (block release):**
- [ ] Fix BTN 15bb opening range from `66-JJ` to a proper 35-40% range
- [ ] Remove Fold from choices for BB vs SB complete; ensure only Raise/Limp are options

**High (should fix soon):**
- [ ] Review SB_BB entries (all stacks) — ensure raise range is populated for value hands
- [ ] Review UTG_BTN and similar entries where raiseRange is empty at 15bb+
- [ ] Verify facing-3bet call ranges are consistent with opening ranges

**Medium (polish):**
- [ ] Add explanation text to spot generation that clarifies "vs weak limp" principle
- [ ] Consider adding a validator that checks: for every facing-limp entry, if raiseRange is empty, jamRange should be very wide (covering the raise + jam spectrum)

---

## Conclusion

The new Facing Limpers and 3-Betting modules are **architecturally sound** (dispatcher works, four-choice handling is clean, explanations are coherent). However, **range data has material errors:**

1. **BTN 15bb opening is critically broken** (2.7% vs 35-40%) — this alone affects the entire module's credibility
2. **SB→BB missing raise ranges** (violates GTO principle that BB never folds to SB complete)
3. **Several empty raise ranges** at 15bb+ where raise should be present

The mismatch bug fixes from April 13 are solid (separate commit `9da7897`), so card/explanation consistency is no longer a concern.

**Recommendation:** Do NOT release this commit to production for daily challenges until the BTN 15bb and SB→BB range issues are fixed. The facing-3bet and most facing-limp spots appear sound; only these specific matchups are broken.

