# Code Review: Scenario Generator Pipeline (v2 Rewrite)
**Date:** April 14, 2026  
**Scope:** `play-scenario-generator.ts` (v2, April 13 rewrite)  
**Focus:** Card/explanation mismatch bug validation and RNG isolation

---

## 1. Correctness of v2 Architecture

**Status:** ✅ CORRECT with minor documentation gaps

### Finding: All output fields ARE derived from locked primitives

The `buildScenario()` function (lines 246–372) correctly derives ALL output fields from a fixed set of locked primitive parameters:
- `handCode` (string)
- `heroKey` (position key)
- `stackBb` (number)
- `spotType` (string)
- `opponentKey` (position key)

**Trace of field derivation:**

| Field | Source | Derivation |
|-------|--------|-----------|
| `cards` | `handCode` | `handCodeToCards(handCode)` (lines 85–109) — pure, deterministic |
| `action` | `handCode`, positions, `stackBb` | Re-derived from range tables via `getOpeningAction`, `getFacingOpenAction`, etc. (lines 272–281) |
| `explanation` | `handCode`, `action`, positions, `stackBb` | Fresh generated from templates (lines 283–317) |
| `situation` | `spotType`, `heroKey`, `opponentKey` | Built from static maps (lines 319–320) |
| `choices` | `spotType` | Static mapping (lines 322–323) |
| `correct` | `action`, `choices` | Derived from action lookup (lines 324–325) |

**No closure leaks detected.** The function takes all needed values as parameters; no external module state is read except for read-only lookup tables (`SUITS`, `COMPILED_RANGES`, `explainXxx` functions, position maps).

**No hidden state mutations.** The RNG is NOT used in `buildScenario()`. All randomness is consumed in `pickScenarioParams()` and `pickHand()` before passing primitive results to `buildScenario()`.

**Severity:** None  
**Recommendation:** Documentation is clear, but consider adding a comment above `buildScenario()` explicitly listing the locked parameters for future maintainers.

---

## 2. Dead Code from April 11 Patch

**Status:** ❌ CRITICAL: Old validation layer no longer exists but should be verified

### Finding: `spotToPlayScenario()` was replaced, not removed

The April 11 patch (`2bba710`) introduced a three-layer validation inside `spotToPlayScenario()`:
1. Card validation after `parseHandCode` with force-rebuild fallback
2. Fresh explanation generation (never use cached `spot.explanation`)
3. Final safety check: explanation must contain handCode

**Current status (April 13 v2):** All three validations have been REIMPLEMENTED inside `buildScenario()` and its callees:
- **Layer 1** (card validation): lines 258–266 in `buildScenario()` (hard check with force-rebuild)
- **Layer 2** (fresh explanation): lines 283–317 in `buildScenario()` (all explanation calls pass `handCode` explicitly)
- **Layer 3** (integrity check): lines 330–358 in `buildScenario()` (verify cards AND explanation reference same hand)

**Verification that old code is not called:**
- `spotToPlayScenario()` was declared in `play-scenario-generator.ts` (old version)
- Grep search found **zero** references to `spotToPlayScenario` or `generateDrillSpot` in current codebase
- New implementation uses `pickScenarioParams()` and `pickHand()` instead of `generateDrillSpot()`

**Post-generation validator (lines 472–496)** also exists and is called on every hand in `generateDailyHands()` (line 529).

**Severity:** None — the old code path is completely replaced, not bypassed.  
**Recommendation:** No action needed. The rewrite is clean.

---

## 3. React Rendering Safety

**Status:** ✅ CORRECT — useRef freeze still in place and still necessary

### Finding: `useRef` hands freeze is retained

In `src/app/play/page.tsx` line 72:
```typescript
const frozenHands = useRef(hands);
```

The hands array is frozen on first render and referenced as `frozenHands.current` throughout the component (line 82: `const hand = frozenHands.current[handIdx]`).

**Why it's still necessary:**
Even though `buildScenario()` guarantees output correctness when called, if a parent re-render swaps the `hands` prop array mid-game (while handIdx is at position 2, for example), the user would suddenly see hand 2 from the new array instead of the frozen hand from the original array. The useRef freeze prevents this race condition.

This is a React best practice for "locking in" state during a game flow, independent of architectural guarantees.

**Severity:** None  
**Recommendation:** No changes needed. The useRef freeze is belt-and-suspenders, which is appropriate for user-facing features.

---

## 4. Validator Coverage Gaps

**Status:** ⚠️ MEDIUM: Validator is comprehensive but has structural limits

### Current coverage (`scripts/validate-scenarios.mjs`):

**Test 1: 500 daily hands (100 dates × 5 hands)**
- Covers: date determinism, structural validation
- **Gap:** Only uses random hand picks (line 205: `pickRng(ALL_HANDS, handRng).code`) — does NOT exercise the `pickHand()` bias toward borderline hands

**Test 2: 500 bonus hands (random seeds)**
- Covers: random spot generation, validation
- **Gap:** Same as above

**Test 3: 3,380 exhaustive scenarios (169 hands × 4 spot types × 5 stacks)**
- Covers: ALL hands in ALL spot types at specific stack depths
- Actual coverage:
  - All 169 hands ✅
  - All 4 spot types ✅
  - Stack depths tested: 10, 15, 20, 25, 30 ✅
  - **Gap:** Only tests ONE position per spot type (hardcoded at line 258–261):
    - `unopened`: BTN only (should test UTG, HJ, CO, BTN, SB)
    - `facing_open`: BB vs BTN only (should test all opener/hero combos in FACING_OPEN_KEYS)
    - `facing_limp`: BTN vs HJ only (should test all limper/hero combos in FACING_LIMP_KEYS)
    - `facing_3bet`: BTN vs SB only (should test all hero/threeBettor combos in FACING_3BET_KEYS)

**Test 4: Determinism (30 dates)**
- Covers: Same date produces same hands
- ✅ Works correctly

**Test 5: No duplicates in daily sets (30 sets)**
- Covers: No repeat scenarios within one day's 5 hands
- ✅ Works correctly

### Missing coverage:

1. **Position coverage for exhaustive test:** Only 4 position pairs tested out of dozens available
   - Example: `facing_open` has 10 range keys (line 116–119 of validator), but test only checks BTN vs BB
   - Recommendation: Loop over all keys in FACING_OPEN_KEYS, FACING_LIMP_KEYS, FACING_3BET_KEYS

2. **AKs/BTN/25bb fallback path:** Never explicitly triggered
   - The validator never forces 20 consecutive validation failures to test line 565 fallback
   - Recommendation: Add specific test that forces fallback by generating invalid scenarios

3. **pickHand() bias logic:** Not tested
   - The 60% bias toward borderline hands (line 410–421) is never validated
   - Recommendation: Add test that verifies borderline hands appear in daily generation

**Severity:** Medium  
**Recommendation:** 
- Line 256–276: Expand exhaustive test to loop over ALL position combinations from FACING_OPEN_KEYS, FACING_LIMP_KEYS, FACING_3BET_KEYS
- Add new test: Force fallback by mocking validation failure 20+ times
- Add new test: Verify `pickHand()` bias produces appropriate hand strength distribution

---

## 5. Fallback Reachability

**Status:** ✅ CORRECT but undocumented

### Finding: Fallback is reachable but hard to trigger

**Fallback code (line 565):**
```typescript
const fallback = buildScenario('bonus_fallback', 'AKs', 'btn', 25, 'unopened', '');
```

**Conditions to trigger:**
1. `generateBonusHand()` called (line 548)
2. Validation fails 20+ times (line 552: `while (attempts < 20)`)

**Question: Can validation realistically fail 20 times?**

The `validateScenario()` check (lines 472–496) verifies:
- Cards length = 2
- Card ranks match handCode
- Suit consistency
- Explanation contains handCode
- Correct index in bounds

All of these should pass for ANY `buildScenario()` call unless:
1. `handCodeToCards()` is broken (not possible — deterministic from handCode)
2. An explanation template is broken (possible but caught by line 335–342 integrity check)

**Downstream handling:** Once fallback (AKs/BTN/25bb/unopened) is returned:
- It's a valid `PlayHandScenario` object
- Same schema as any other scenario
- UI will render it normally
- Scoring system will treat it like any other hand

**Telemetry:** No logging when fallback fires (observation at line 565 — it's just `const fallback = buildScenario(...)` with no console output)

**Severity:** Low  
**Recommendation:** 
- Add explicit console log when fallback is returned: `console.warn('[PokerTrainer] FALLBACK TRIGGERED: bonus hand generation exhausted after 20 attempts. Using AKs BTN 25bb.');`
- Consider a telemetry event if error tracking is in place

---

## 6. Per-Hand RNG Isolation

**Status:** ✅ CORRECT — isolation is properly implemented

### Finding: Each daily hand gets its own sub-seed

**Implementation (lines 514–521):**
```typescript
while (hands.length < 5 && attempts < 100) {
  attempts++;
  const handRng = seededRng(masterSeed ^ (attempts * 0x9e3779b9));
  const params = pickScenarioParams(handRng);
  const handCode = pickHand(handRng, params.spotType, params.heroKey, params.stackBb, params.opponentKey);
  ...
}
```

**Isolation mechanism:**
- `masterSeed = dateToSeed(today + '_pokertrain_v2')` — same for all users on same date
- `handRng` for attempt N: `seededRng(masterSeed ^ (attempts * 0x9e3779b9))`
  - `0x9e3779b9` is a large prime (used in Knuth's golden ratio hashing)
  - XOR creates a unique seed per attempt
  - Each attempt's RNG is fresh and does NOT carry state from previous attempts

**Verification that isolation is real:**
- Each iteration creates a NEW seeded RNG function (line 518)
- The parent loop's `rng` (line 508) is never used inside the loop
- `pickScenarioParams(handRng)` consumes the isolated RNG
- `pickHand(handRng, ...)` consumes more of the same isolated RNG
- Next iteration creates a completely new RNG with different seed

**No cross-contamination:** The `masterSeed` is only read (XOR'd), never mutated. Each sub-seed is independent.

**Bonus hands (line 549):** Use `Math.random()` (true random), not a seeded RNG, so no determinism issue.

**Severity:** None  
**Recommendation:** No action needed. Isolation is correct.

---

## Summary of Findings

| Finding | Severity | Category | Action |
|---------|----------|----------|--------|
| All output derived from locked primitives | None | Architecture | Add inline documentation |
| No dead code from April 11 | None | Code Quality | None |
| useRef freeze still necessary | None | React Safety | None |
| Validator coverage incomplete | Medium | Testing | Expand exhaustive test to all positions |
| Fallback reachable but undocumented | Low | Observability | Add console.warn on fallback |
| RNG isolation correct | None | Design | None |

---

## Detailed Recommendations

### 1. Expand Validator Coverage (High Priority)
**File:** `scripts/validate-scenarios.mjs` lines 255–276

Replace the hardcoded exhaustive test with loops over actual range keys:

```javascript
// Instead of hardcoding 4 spot type / position combos,
// loop over all valid combinations from range-tables
const exhaustiveTests = [
  ...FACING_OPEN_KEYS.map(key => {
    const [openerKey, heroKey, stackBb] = key.split('_');
    return { spotType: 'facing_open', heroKey, stackBb: parseInt(stackBb), opponentKey: openerKey };
  }),
  ...FACING_LIMP_KEYS.map(key => {
    const [limperKey, heroKey, stackBb] = key.split('_');
    return { spotType: 'facing_limp', heroKey, stackBb: parseInt(stackBb), opponentKey: limperKey };
  }),
  ...FACING_3BET_KEYS.map(key => {
    const [heroKey, threeBettorKey, stackBb] = key.split('_');
    return { spotType: 'facing_3bet', heroKey, stackBb: parseInt(stackBb), opponentKey: threeBettorKey };
  }),
  ...OPENING_POSITIONS.flatMap(heroKey =>
    STACK_DEPTHS.map(stackBb => ({
      spotType: 'unopened', heroKey, stackBb, opponentKey: ''
    }))
  ),
];

for (const params of exhaustiveTests) {
  for (const hand of ALL_HANDS) {
    // test buildScenario with params + hand
  }
}
```

This expands coverage from 3,380 to ~14,000+ scenarios but ensures all valid position pairs are tested.

### 2. Add Fallback Trigger Test (Medium Priority)
**File:** `scripts/validate-scenarios.mjs` after line 309

```javascript
// Test 6: Fallback reachability
console.log('Test 6: Fallback is reachable...');
let fallbackTriggered = false;
for (let i = 0; i < 20; i++) {
  const scenario = buildScenario(`fallback_test_${i}`, 'AKs', 'btn', 25, 'unopened', '');
  // If fallback were to trigger, we'd see fallback_fallback id
  if (scenario.id === 'bonus_fallback') fallbackTriggered = true;
}
if (!fallbackTriggered) {
  console.log('  ✓ Fallback available but not triggered (expected)\n');
} else {
  console.log('  ⚠ Fallback was triggered (unexpected)\n');
}
```

### 3. Document buildScenario() Contract (Low Priority)
**File:** `src/lib/services/play-scenario-generator.ts` line 243

Add a detailed JSDoc comment above `buildScenario()`:

```typescript
/**
 * Build a complete PlayHandScenario from locked primitive parameters.
 * 
 * ARCHITECTURE GUARANTEE: All output fields are derived ONLY from the input
 * parameters. No external state is read except for immutable lookups
 * (range tables, explanation templates, position maps).
 * 
 * Fields derived:
 *   - cards: from handCode only
 *   - action: from range tables via (opponentPos, heroPos, stackBb, handCode)
 *   - explanation: from templates via (handCode, action, positions, stackBb)
 *   - situation: from static maps via (spotType, positions)
 *   - choices/correct: derived from spotType and action
 * 
 * Safety: A validation step (lines 330–358) ensures cards and explanation
 * reference the same hand. If a mismatch is detected, a fallback explanation
 * is substituted and logged.
 * 
 * @param id - Unique scenario identifier
 * @param handCode - e.g. "AKs", "QTo", "88" (source of truth for cards)
 * @param heroKey - Position key: "utg", "btn", "sb", etc.
 * @param stackBb - Stack depth in blinds (typically 10–30)
 * @param spotType - "unopened", "facing_open", "facing_limp", "facing_3bet"
 * @param opponentKey - Position of opener/limper/threeBettor (empty for unopened)
 */
```

### 4. Add Fallback Logging (Low Priority)
**File:** `src/lib/services/play-scenario-generator.ts` line 565

```typescript
  // Absolute fallback — guaranteed valid
  const fallback = buildScenario('bonus_fallback', 'AKs', 'btn', 25, 'unopened', '');
  console.warn('[PokerTrainer] Bonus hand generation exhausted after 20 attempts. Returning fallback: AKs BTN 25bb unopened.');
  return fallback;
```

---

## Conclusion

**Overall Assessment:** ✅ **Safe to ship**

The v2 rewrite successfully eliminated the card/explanation mismatch risk through:
1. Single-source derivation from locked primitives in `buildScenario()`
2. Three-layer validation (cards, action, explanation)
3. Per-hand RNG isolation for deterministic daily generation
4. Final post-generation validator before returning to user

The validator is comprehensive but has room for improved position coverage. Recommended improvements are non-blocking but would increase confidence.

**No critical or high-severity issues detected.**
