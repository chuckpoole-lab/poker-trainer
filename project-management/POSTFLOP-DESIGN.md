# Poker Trainer — Postflop Training System Design
## April 11, 2026 — For review with Chuck

---

## Why This Is Hard (And Why It Matters)

Preflop is a solved problem at bar poker stack depths. There are 169 starting hands, a few positions, a few stack sizes — you can look it up on a chart. That's what we built. It works.

Postflop is different. Your two cards interact with three, four, then five board cards. Your position relative to opponents matters on every street. The pot size changes. Your opponent's range narrows based on every action they take. There's no chart for this — it requires thinking.

That's exactly why bar poker players need it. Most bar poker money is lost postflop, not preflop. Players who learn our preflop system and then go to a table will still bleed chips after the flop because they don't know when to bet, when to give up, or what their opponent likely has.

This document lays out how we teach postflop play in a way that bar poker players can actually absorb. No solver outputs. No GTO frequencies. Rules of thumb that work at the table.

---

## The Big Problem: You Can't Chart Postflop

Preflop: 169 hands × 9 positions × 5 stack depths = finite. We built lookup tables.

Postflop: your 2 cards × 1,755 possible flops × position × pot size × opponent actions × board runouts = essentially infinite. No lookup table is possible.

**Our solution: a rule engine, not a database.** Instead of storing every possible postflop situation, we classify situations into categories and teach decisions by category. This is actually how good poker players think — not "I have Ah7h on Kh9h2c" but "I have a flush draw on a dry-ish board, I'm in position, heads up."

---

## Architecture: The Postflop Decision Engine

### How a Postflop Scenario Works

```
1. PREFLOP SETUP (from existing system)
   Hero opens from CO with AhTh, BTN calls, everyone else folds
   Pot: 6.5bb, Stack: 23.5bb remaining

2. FLOP DEALT
   Board: Kh 7h 2c
   → Board Texture: DRY (rainbow, disconnected)
   → Hero Hand Strength: FLUSH_DRAW (9 outs, ~35% to hit by river)
   → Position: IN_POSITION (hero acts last)
   → Opponents: 1 (heads up)

3. DECISION POINT
   Opponent checks to hero.
   → Rule engine: flush draw + in position + heads up + dry board
   → Correct action: BET (semi-bluff c-bet, 1/2 pot)
   → Why: You have a draw with 9 outs, position, and fold equity.
          Betting wins the pot immediately if opponent folds, and
          you still have outs if called.

4. TURN (if scenario continues to multiple streets)
   Turn: 3c (brick — nothing changed)
   Opponent checks again.
   → Hero now decides: bet again (barrel) or check back?
```

### The Five Classification Systems

Every postflop scenario is classified along five dimensions. The combination determines the correct play.

**1. Board Texture**

| Category | Description | Example | C-Bet Frequency |
|----------|-------------|---------|-----------------|
| DRY | Rainbow, disconnected, no draws | K♠ 7♦ 2♣ | High (65-75%) |
| SEMI_WET | Two-tone or one connector | K♠ J♥ 4♠ | Medium (50-60%) |
| WET | Flush draw + straight draws possible | J♥ T♥ 9♣ | Low (35-45%) |
| PAIRED | Board has a pair | 8♠ 8♦ 3♣ | Medium (50-60%) |
| MONOTONE | All one suit | 9♥ 6♥ 2♥ | Depends on hand |

**2. Hand Strength (Hero's Hand vs. This Board)**

| Category | Description | Bar Poker Translation |
|----------|-------------|----------------------|
| MONSTER | Sets, two pair+, straights, flushes, full houses | "You crushed the flop" |
| OVERPAIR | Pocket pair above all board cards | "You have the best pair" |
| TOP_PAIR_GOOD | Top pair, A-Q kicker | "Strong pair, good kicker" |
| TOP_PAIR_WEAK | Top pair, J or lower kicker | "Good pair, watch the kicker" |
| MIDDLE_PAIR | Second or third pair on board | "Decent pair but vulnerable" |
| STRONG_DRAW | Flush draw + pair, or 12+ outs | "Big draw, lots of outs" |
| FLUSH_DRAW | 9-out flush draw, no pair | "Flush draw" |
| OESD | Open-ended straight draw (8 outs) | "Straight draw, 8 outs" |
| GUTSHOT | Inside straight draw (4 outs) | "Gutshot, only 4 outs" |
| OVERCARDS | Two cards above the board, no pair | "Nothing yet but live cards" |
| AIR | No pair, no draw, no showdown value | "You have nothing" |

**3. Position**

| Category | Meaning | Impact |
|----------|---------|--------|
| IN_POSITION (IP) | Hero acts last (e.g., BTN vs BB) | Big advantage — can control pot, see opponent act first |
| OUT_OF_POSITION (OOP) | Hero acts first (e.g., BB vs BTN) | Disadvantage — must act without information |

**4. Number of Opponents**

| Category | Adjustments |
|----------|-------------|
| HEADS_UP | Standard play, can bluff, can thin value bet |
| MULTIWAY (3+) | Tighten significantly, bluff rarely, someone likely has something |

**5. Street**

| Street | Cards | Key Concept |
|--------|-------|-------------|
| FLOP | 3 cards | Information gathering. C-bet or check? |
| TURN | 4 cards | Commitment decision. Barrel or give up? |
| RIVER | 5 cards | Final decision. Value bet, bluff, or check? |

---

## The Four Postflop Training Modules

### Module 1: Continuation Betting (C-Betting)

**What it teaches:** When you raised preflop and the flop comes, should you bet?

**Why bar poker players need this:** Most bar poker players either always bet (wasting chips) or never bet without a pair (giving up too much equity). The truth is in between, and it depends on the board.

**Scenario format:**
- Hero raised preflop from [position], [N] opponent(s) called
- Flop is [three cards]
- Hero's hand is [two cards]
- Opponent(s) check to hero
- Decision: Bet (1/2 pot, 2/3 pot) or Check

**Difficulty tiers:**
- Tier 1: Heads up, in position, dry boards. "You raised, they called, the flop is K-7-2 rainbow. You have AQ. Bet or check?"
- Tier 2: Heads up, out of position, or wet boards. "You raised from UTG, BB called. Flop is J-T-9 two-tone. You have AA. Bet or check?"
- Tier 3: Multiway pots. "You raised from CO, BTN and BB called. Flop is Q-8-3 two-tone. You have AK. Bet or check?"

**Key teaching rules:**
1. Bet dry boards more often (opponents can't have much)
2. Check wet boards more often (opponents have draws, might check-raise you)
3. Bet less in multiway pots (someone probably connected)
4. In position = can check back for free card; out of position = betting or check-calling is trickier
5. Bet your strong hands for value, bet your draws as semi-bluffs, check your medium hands

### Module 2: Hand Ranging

**What it teaches:** Narrowing down what your opponent likely has based on their actions.

**Why bar poker players need this:** Most players think "they could have anything" or "I'm scared they have a set." Neither is productive. Ranging teaches you to think logically: if they raised from UTG, they probably have a strong hand. If they called a flop bet and then bet the turn when the flush card hits, they probably have a flush.

**This is the hardest concept to teach.** It requires progressive thinking across streets. Here's how we break it down:

**Scenario format — "Range Narrowing" drills:**
- Present a hand history with opponent actions at each street
- At each decision point, ask: "Which of these hand categories could your opponent have?"
- Multiple choice: select all that apply
- After each street, show how the range narrowed

**Example walkthrough:**

```
Preflop: Villain raises from UTG at 25bb.
Question: "What range of hands does UTG likely have?"
→ Answer: Strong range — big pairs (AA-88), big aces (AK-AT),
  broadway suited (KQs, QJs). NOT random junk.

Flop: K♠ 7♥ 3♦ (dry board). Villain bets 1/2 pot.
Question: "After this bet, what does villain likely have?"
→ Answer: Top pair (AK, KQ, KJ), overpair (AA, QQ, JJ, TT),
  or a continuation bet with AQ/AJ (betting without a pair).
  Unlikely: sets (would bet bigger), draws (no draws available).

Turn: 9♠. Villain bets 2/3 pot.
Question: "Villain bet again. What does this tell you?"
→ Answer: The double barrel narrows it. Probably top pair+ (AK, KQ)
  or an overpair. AQ/AJ would usually check the turn. This is
  strength, not a bluff.

River: 2♣. Villain bets pot.
Question: "Big river bet. What's villain representing?"
→ Answer: Very strong — likely top pair with a good kicker (AK)
  or an overpair. The pot-sized bet polarizes their range to
  strong value hands or bluffs. But from UTG with this line,
  this is almost always value.
```

**Difficulty tiers:**
- Tier 1: Simple preflop range estimation. "UTG raised. What could they have?" Multiple choice.
- Tier 2: Flop range narrowing. "UTG raised, flop is K-7-3. They bet. What do they likely have now?"
- Tier 3: Multi-street range tracking. Full hand history, range narrowing through turn and river.

**Key teaching rules:**
1. Start with their preflop range (position tells you a lot)
2. Every action (bet, check, raise, call) narrows the range
3. Betting = strength or bluff. Checking = usually weakness or trapping.
4. Big bets polarize (very strong or bluffing). Small bets are more merged.
5. At bar poker, most opponents are NOT bluffing. Weight toward value.

### Module 3: Bluffing

**What it teaches:** When, where, and how much to bluff.

**Why bar poker players need this:** Two extremes — some players never bluff (they're easy to play against) and some players bluff constantly (they bleed chips). The goal is to teach them the right spots.

**Scenario format:**
- Present a postflop situation where hero has a weak hand or busted draw
- Hero has been the aggressor or has an opportunity to represent strength
- Decision: Bluff (bet/raise) or Give up (check/fold)

**Key concepts to teach:**

**Semi-bluffing (Tier 1 — start here):**
- You have a draw and bet, putting pressure on opponent while having outs
- "You have a flush draw. Betting is correct because they might fold AND you might hit"
- This is easier to teach than pure bluffs because there's a safety net

**Pure bluffing (Tier 2):**
- You have nothing but the situation suggests you should represent strength
- "You raised preflop, c-bet the flop, and the turn is an ace. Betting again represents a big hand."
- Teach when this works: dry boards, heads up, in position, opponent showed weakness

**Bluff sizing (Tier 3):**
- Smaller bluffs need to work less often to be profitable
- "A 1/3 pot bluff needs to work 25% of the time. A pot-sized bluff needs to work 50%."
- At bar poker tables where players call a lot, bluff LESS but size BIGGER when you do

**When NOT to bluff (critical for bar poker):**
1. Multiway pots — someone always has something
2. Against calling stations — they're not folding
3. On wet boards where opponent likely has a draw — they won't fold a draw
4. When your story doesn't make sense — "Why would you suddenly bet the river?"

**Key teaching rules:**
1. Bluff with draws (semi-bluff) before bluffing with air
2. Position matters hugely — bluff in position, be cautious OOP
3. Bluff less at bar poker tables where opponents call too much
4. Your bluff needs to tell a story — does your betting pattern make sense for a strong hand?
5. If they've shown strength (raised, bet multiple streets), don't bluff
6. Bet sizing: smaller bluffs are "cheaper" but get called more. Size based on what folds them.

### Module 4: Postflop Play by Street

**What it teaches:** The evolving decision tree from flop through river.

**Why this matters:** Each street has different considerations. The flop is about gathering information and setting up. The turn is the commitment decision. The river is about value and bluffs.

**Flop decisions:**
- I raised preflop: bet (c-bet) or check?
- I called preflop: check, bet (donk bet), or check-raise?
- Opponent bet: call, raise, or fold?

**Turn decisions:**
- I bet the flop, they called: bet again (barrel) or check (give up)?
- I checked the flop: bet now (delayed c-bet) or check again?
- Opponent bet: call, raise, or fold? Now pot odds matter more.

**River decisions:**
- I have a strong hand: bet for value (how much?)
- I have a medium hand: check (is it good enough to call if they bet?)
- I have nothing: bluff or give up?
- Opponent bet: call or fold? Now hand ranging matters most.

---

## Implementation Strategy: How We Build This

### Phase 1: Board Classification Engine (Foundation — build first)

New file: `src/lib/data/board-textures.ts`

```
Inputs: three to five board cards
Outputs: {
  texture: DRY | SEMI_WET | WET | PAIRED | MONOTONE
  flushDrawPossible: boolean
  straightDrawPossible: boolean
  highCard: rank
  connected: boolean (two cards within 2 ranks)
  suitedness: RAINBOW | TWO_TONE | MONOTONE
}
```

New file: `src/lib/data/hand-strength-evaluator.ts`

```
Inputs: hero's two cards + board cards
Outputs: {
  category: MONSTER | OVERPAIR | TOP_PAIR_GOOD | ... | AIR
  outs: number (if drawing)
  madeHand: boolean
  drawType: FLUSH_DRAW | OESD | GUTSHOT | COMBO_DRAW | NONE
  equity: approximate % (simplified calculation)
}
```

### Phase 2: C-Betting Module (First playable module)

This is the easiest to implement because:
- Only one street (flop)
- Hero is always the preflop raiser
- Opponent always checks to hero
- Decision is binary: bet or check
- Rules are straightforward and board-dependent

New file: `src/lib/data/postflop-rules.ts`

```
function getCBetDecision(
  handStrength, boardTexture, position, numOpponents, potSizeBb, stackBb
): { action: 'bet' | 'check', sizing: string, confidence: 'clear' | 'close' }
```

New explanation templates:
```
explainCBet(hand, board, position, sizing)
explainCheckBack(hand, board, position, reason)
```

Integration: New spot type `SpotType.POSTFLOP_CBET` in play-scenario-generator.

### Phase 3: Hand Ranging Module

New file: `src/lib/data/range-narrowing.ts`

Pre-built scenario library (not randomly generated — these need to be curated for teaching quality):
- 20-30 hand histories with progressive range-narrowing questions
- Each scenario teaches one concept (tight range from EP, polarized river bet, etc.)
- Difficulty tagged: beginner, intermediate, advanced

This module is more like a "Learn" feature than a "Play" feature. It requires reading and thinking, not snap decisions. Consider putting it in the Train section.

### Phase 4: Bluffing Module

New file: `src/lib/data/bluff-spots.ts`

Semi-bluff scenarios (draws) — can be generated from the rule engine.
Pure bluff scenarios — curated set showing good and bad bluff spots.
Bluff sizing quiz — "How often does this bluff need to work?"

Integration: `SpotType.POSTFLOP_BLUFF` and `SpotType.POSTFLOP_SEMI_BLUFF`

### Phase 5: Multi-Street Scenarios

This is the most complex. A single scenario unfolds across flop → turn → river.
Each street is a decision point. The player's choice affects what happens next.

This is essentially a choose-your-own-adventure for poker. Implementation options:
- A: Linear scenarios (one correct path, score at the end)
- B: Branching scenarios (multiple paths, score each decision)
- C: Single-street drills first, multi-street later

**Recommendation: start with C.** Single-street drills for each street (flop, turn, river) are much simpler to build and teach the same concepts. Multi-street branching scenarios can be a future enhancement.

---

## New Types and Enums Needed

```typescript
// New enums
enum PostflopStreet { FLOP = 'flop', TURN = 'turn', RIVER = 'river' }
enum BoardTexture { DRY = 'dry', SEMI_WET = 'semi_wet', WET = 'wet', PAIRED = 'paired', MONOTONE = 'monotone' }
enum HandStrengthCategory { MONSTER, OVERPAIR, TOP_PAIR_GOOD, TOP_PAIR_WEAK, MIDDLE_PAIR, STRONG_DRAW, FLUSH_DRAW, OESD, GUTSHOT, OVERCARDS, AIR }
enum PostflopAction { BET_SMALL = 'bet_small', BET_HALF = 'bet_half', BET_TWO_THIRDS = 'bet_two_thirds', BET_POT = 'bet_pot', CHECK = 'check', CALL = 'call', RAISE = 'raise', FOLD = 'fold' }
enum RelativePosition { IN_POSITION = 'ip', OUT_OF_POSITION = 'oop' }

// New spot types to add to SpotType enum
POSTFLOP_CBET = 'postflop_cbet'
POSTFLOP_FACING_BET = 'postflop_facing_bet'
POSTFLOP_BLUFF = 'postflop_bluff'
POSTFLOP_VALUE_BET = 'postflop_value_bet'

// New leak categories
CBET_DISCIPLINE = 'cbet_discipline'
POSTFLOP_AGGRESSION = 'postflop_aggression'
HAND_READING = 'hand_reading'
BLUFF_FREQUENCY = 'bluff_frequency'

// Postflop scenario type
interface PostflopScenario {
  id: string;
  preflopAction: string;        // "Hero raises CO, BTN calls"
  heroCards: Card[];             // Specific cards, not just hand code
  board: Card[];                 // 3-5 cards
  street: PostflopStreet;
  boardTexture: BoardTexture;
  handStrength: HandStrengthCategory;
  position: RelativePosition;
  numOpponents: number;
  potSizeBb: number;
  effectiveStackBb: number;
  opponentAction: string;       // "checks to you" or "bets 1/2 pot"
  choices: PostflopAction[];
  correctAction: PostflopAction;
  explanation: Explanation;
}
```

---

## Build Order Recommendation

| Phase | Module | Effort | Impact | Dependencies |
|-------|--------|--------|--------|--------------|
| 1 | Board texture + hand evaluator | Medium | Foundation | None |
| 2 | C-Betting (flop only, heads up, IP) | Medium | High | Phase 1 |
| 3 | C-Betting (add OOP, multiway) | Small | Medium | Phase 2 |
| 4 | Hand ranging (curated scenarios) | Medium | Very High | None (standalone) |
| 5 | Semi-bluffing (draw situations) | Small | High | Phase 1 |
| 6 | Pure bluffing (curated spots) | Small | Medium | Phase 1 |
| 7 | Facing bets (call/raise/fold) | Medium | High | Phase 1 |
| 8 | Multi-street scenarios | Large | Very High | All above |

**Recommendation:** Build phases 1-2 first (C-betting is the most common and impactful postflop decision). Build phase 4 (hand ranging) in parallel since it's standalone and doesn't need the rule engine. Then layer in bluffing and facing-bet scenarios.

---

## Bar Poker Adjustments

Everything above is GTO-influenced, but bar poker tables play differently. Key adjustments:

1. **Opponents call too much** → Value bet bigger, bluff less, don't thin value bet
2. **Opponents rarely raise without strong hands** → When they raise, believe them
3. **Multiway pots are common** → C-bet less, tighten postflop ranges
4. **Opponents don't fold to small bets** → Size up when bluffing, or just don't bluff
5. **Opponents overplay top pair** → Be willing to stack off with two pair+ but cautious with one pair
6. **Limp pots happen often** → These are multiway with wide ranges, play straightforward

These adjustments map naturally to the difficulty tier system:
- Tier 1 (Beginner): Teach the GTO-influenced baseline
- Tier 2 (Intermediate): Introduce exploitative adjustments for common bar poker tendencies
- Tier 3 (Advanced): Teach when to deviate based on specific opponent reads

---

## Questions for Chuck

1. **C-betting first or hand ranging first?** C-betting is easier to build and more directly actionable. Hand ranging is harder to teach but arguably more valuable long-term. Which should we prioritize?

2. **How should postflop scenarios appear in the app?** Options:
   - Mixed into Daily Hands (some preflop, some postflop)
   - Separate "Postflop Practice" mode in Train
   - Both (postflop in daily hands after a certain Poker IQ threshold)

3. **Multi-street or single-street first?** Single-street is much simpler to build but multi-street better represents real poker. Start simple and layer complexity?

4. **Board display:** We need to show community cards visually. Where on the screen? Above the hero's cards? Center of the poker table?

5. **Scope check:** Is this the right level of complexity for our audience? Are we building a training tool for bar poker players or something more ambitious?

---

## File Impact Summary

| File | Change |
|------|--------|
| `src/lib/types/enums.ts` | Add new enums: PostflopStreet, BoardTexture, HandStrengthCategory, PostflopAction, RelativePosition |
| `src/lib/types/models.ts` | Add PostflopScenario interface |
| `src/lib/data/board-textures.ts` | NEW — board texture classification engine |
| `src/lib/data/hand-strength-evaluator.ts` | NEW — hand strength vs board evaluation |
| `src/lib/data/postflop-rules.ts` | NEW — decision engine (c-bet, bluff, value bet rules) |
| `src/lib/data/postflop-explanation-templates.ts` | NEW — coaching text for all postflop actions |
| `src/lib/data/range-narrowing-scenarios.ts` | NEW — curated hand ranging exercises |
| `src/lib/services/postflop-scenario-generator.ts` | NEW — builds postflop scenarios from the rule engine |
| `src/lib/services/play-scenario-generator.ts` | Extend to include postflop scenarios in daily/bonus hands |
| `src/app/play/page.tsx` | Add board card display, postflop choice buttons |
