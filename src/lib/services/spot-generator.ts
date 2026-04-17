// Dynamic spot generator for infinite drill variety
// Generates SpotDecision objects from range tables and explanation templates

import {
  Position,
  SimplifiedAction,
  SpotType,
  DifficultyBand,
  LeakCategoryId,
} from '@/lib/types';
import type { SpotDecision, SpotTemplate } from '@/lib/types';
import {
  ALL_HANDS,
  handStrength,
  getOpeningAction,
  getFacingOpenAction,
  getFacingLimpAction,
  getFacing3BetAction,
  COMPILED_RANGES,
  type HandCombo,
} from '@/lib/data/range-tables';
import {
  explainOpen,
  explainFoldUnopened,
  explainJamUnopened,
  explainJamVsOpen,
  explainCallVsOpen,
  explainFoldVsOpen,
  explainIsolateLimper,
  explainLimpBehind,
  explainJamVsLimp,
  explainFoldVsLimp,
  explainCallVs3Bet,
  explainFoldVs3Bet,
  explain4BetJam,
} from '@/lib/data/explanation-templates';

// Random helpers
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ======= SCENARIO DEFINITIONS =======

interface UnopenedScenario {
  type: 'unopened';
  position: Position;
  stackBb: number;
}

interface FacingOpenScenario {
  type: 'facing_open';
  heroPosition: Position;
  openerPosition: Position;
  stackBb: number;
}

interface FacingLimpScenario {
  type: 'facing_limp';
  heroPosition: Position;
  limperPosition: Position;
  stackBb: number;
}

interface Facing3BetScenario {
  type: 'facing_3bet';
  heroPosition: Position;
  threeBettorPosition: Position;
  stackBb: number;
}

type Scenario = UnopenedScenario | FacingOpenScenario | FacingLimpScenario | Facing3BetScenario;

// Positions that can open (for unopened spots)
const OPENING_POSITIONS: Position[] = [
  Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB,
];

// Stack depths we have data for
const STACK_DEPTHS = [10, 15, 20, 25, 30];

// Facing-open scenarios we have range data for
const FACING_OPEN_KEYS = Array.from(COMPILED_RANGES.facingOpen.keys());
const FACING_LIMP_KEYS = Array.from(COMPILED_RANGES.facingLimp.keys());
const FACING_3BET_KEYS = Array.from(COMPILED_RANGES.facing3Bet.keys());

function parseFacingOpenKey(key: string): { opener: Position; hero: Position; stack: number } | null {
  const parts = key.split('_');
  if (parts.length !== 3) return null;
  const posMap: Record<string, Position> = {
    utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
    lj: Position.LJ, hj: Position.HJ, co: Position.CO,
    btn: Position.BTN, sb: Position.SB, bb: Position.BB,
  };
  const opener = posMap[parts[0]];
  const hero = posMap[parts[1]];
  const stack = parseInt(parts[2]);
  if (!opener || !hero || isNaN(stack)) return null;
  return { opener, hero, stack };
}

// ======= DIFFICULTY CLASSIFICATION =======

function classifyDifficulty(hand: HandCombo, action: SimplifiedAction, scenario: Scenario): DifficultyBand {
  const strength = handStrength(hand);

  // Clear-cut hands are easy
  if (action === SimplifiedAction.FOLD && strength < 100) return DifficultyBand.EASY;
  if (action === SimplifiedAction.JAM && hand.isPair && strength > 300) return DifficultyBand.EASY;
  if (action === SimplifiedAction.OPEN && strength > 250) return DifficultyBand.EASY;

  // Borderline hands are threshold
  if (action === SimplifiedAction.FOLD && strength > 150) return DifficultyBand.THRESHOLD;
  if (action === SimplifiedAction.JAM && !hand.isPair && strength < 200) return DifficultyBand.THRESHOLD;

  return DifficultyBand.MEDIUM;
}

// ======= LEAK CATEGORY ASSIGNMENT =======

function assignLeakCategory(scenario: Scenario, action: SimplifiedAction): LeakCategoryId {
  if (scenario.type === 'facing_open') return LeakCategoryId.FACING_OPENS;
  if (scenario.type === 'facing_limp') return LeakCategoryId.FACING_LIMPS;
  if (scenario.type === 'facing_3bet') return LeakCategoryId.FACING_3BETS;

  const s = scenario as UnopenedScenario;

  if (s.stackBb <= 12) return LeakCategoryId.TEN_BB_PUSH_FOLD;
  if (s.stackBb <= 15 && action === SimplifiedAction.JAM) return LeakCategoryId.FIFTEEN_BB_RAISE_JAM;
  if (s.stackBb <= 15) return LeakCategoryId.FIFTEEN_BB_RAISE_JAM;
  if (s.stackBb <= 20) return LeakCategoryId.TWENTY_BB_COMMITMENT;
  if ([Position.UTG, Position.UTG1, Position.MP].includes(s.position)) return LeakCategoryId.EP_DISCIPLINE;
  if ([Position.CO, Position.BTN].includes(s.position)) return LeakCategoryId.LP_PRESSURE;
  if (s.position === Position.SB) return LeakCategoryId.SB_FUNDAMENTALS;

  return LeakCategoryId.EP_DISCIPLINE;
}

// ======= MAIN GENERATOR =======

export interface GeneratedSpot {
  spot: SpotDecision;
  template: SpotTemplate;
}

function generateUnopenedSpot(preferredCategory?: LeakCategoryId): GeneratedSpot {
  // Pick position and stack
  let position: Position;
  let stackBb: number;

  if (preferredCategory === LeakCategoryId.TEN_BB_PUSH_FOLD) {
    position = pickRandom([Position.CO, Position.BTN, Position.SB, Position.HJ]);
    stackBb = 10;
  } else if (preferredCategory === LeakCategoryId.FIFTEEN_BB_RAISE_JAM) {
    position = pickRandom([Position.CO, Position.BTN, Position.HJ, Position.SB]);
    stackBb = 15;
  } else if (preferredCategory === LeakCategoryId.TWENTY_BB_COMMITMENT) {
    position = pickRandom([Position.UTG, Position.HJ, Position.CO, Position.BTN]);
    stackBb = 20;
  } else if (preferredCategory === LeakCategoryId.EP_DISCIPLINE) {
    position = pickRandom([Position.UTG, Position.HJ]);
    stackBb = pickRandom([25, 30]);
  } else if (preferredCategory === LeakCategoryId.LP_PRESSURE) {
    position = pickRandom([Position.CO, Position.BTN]);
    stackBb = pickRandom([20, 25, 30]);
  } else if (preferredCategory === LeakCategoryId.SB_FUNDAMENTALS) {
    position = Position.SB;
    stackBb = pickRandom([15, 20, 25]);
  } else {
    position = pickRandom(OPENING_POSITIONS);
    stackBb = pickRandom(STACK_DEPTHS);
  }

  // Pick a hand (bias toward interesting decisions)
  const hand = pickInterestingHand(position, stackBb);
  const correctAction = getOpeningAction(position, stackBb, hand.code);

  // Build acceptable actions
  const acceptableActions: SimplifiedAction[] = [];
  if (correctAction === SimplifiedAction.OPEN && stackBb <= 15) {
    acceptableActions.push(SimplifiedAction.JAM);
  }
  if (correctAction === SimplifiedAction.JAM && stackBb >= 15) {
    acceptableActions.push(SimplifiedAction.OPEN);
  }

  // Build explanation
  const explanation = correctAction === SimplifiedAction.OPEN
    ? explainOpen(hand.code, position, stackBb)
    : correctAction === SimplifiedAction.JAM
      ? explainJamUnopened(hand.code, position, stackBb)
      : explainFoldUnopened(hand.code, position, stackBb);

  const scenario: UnopenedScenario = { type: 'unopened', position, stackBb };
  const id = randomId();

  const template: SpotTemplate = {
    id: `tpl_${id}`,
    stackDepthBb: stackBb,
    position,
    spotType: position === Position.SB ? SpotType.SB_UNOPENED : SpotType.UNOPENED,
    actionHistory: 'folded_to_hero',
  };

  const spot: SpotDecision = {
    id,
    spotTemplateId: template.id,
    handCode: hand.code,
    baselineAction: correctAction,
    simplifiedAction: correctAction,
    acceptableActions,
    difficultyBand: classifyDifficulty(hand, correctAction, scenario),
    leakCategory: assignLeakCategory(scenario, correctAction),
    explanation,
  };

  return { spot, template };
}

function generateFacingOpenSpot(preferredCategory?: LeakCategoryId): GeneratedSpot {
  // Pick a random facing-open scenario from our range data
  const key = pickRandom(FACING_OPEN_KEYS);
  const parsed = parseFacingOpenKey(key);

  if (!parsed) return generateUnopenedSpot(preferredCategory); // Fallback

  const { opener, hero, stack } = parsed;

  // Pick an interesting hand
  const hand = pickInterestingHandFacingOpen(opener, hero, stack);
  const correctAction = getFacingOpenAction(opener, hero, stack, hand.code);

  const acceptableActions: SimplifiedAction[] = [];
  if (correctAction === SimplifiedAction.JAM && stack >= 25) {
    acceptableActions.push(SimplifiedAction.CALL);
  }
  if (correctAction === SimplifiedAction.CALL && stack <= 20) {
    acceptableActions.push(SimplifiedAction.JAM);
  }

  const explanation = correctAction === SimplifiedAction.JAM
    ? explainJamVsOpen(hand.code, hero, opener, stack)
    : correctAction === SimplifiedAction.CALL
      ? explainCallVsOpen(hand.code, hero, opener, stack)
      : explainFoldVsOpen(hand.code, hero, opener, stack);

  const scenario: FacingOpenScenario = { type: 'facing_open', heroPosition: hero, openerPosition: opener, stackBb: stack };
  const id = randomId();

  const actionHistory = `${opener}_opens_2.2x_folds_to_hero`;

  const template: SpotTemplate = {
    id: `tpl_${id}`,
    stackDepthBb: stack,
    position: hero,
    spotType: SpotType.FACING_OPEN,
    actionHistory,
  };

  const spot: SpotDecision = {
    id,
    spotTemplateId: template.id,
    handCode: hand.code,
    baselineAction: correctAction,
    simplifiedAction: correctAction,
    acceptableActions,
    difficultyBand: classifyDifficulty(hand, correctAction, scenario),
    leakCategory: LeakCategoryId.FACING_OPENS,
    explanation,
  };

  return { spot, template };
}

// Pick hands biased toward interesting (borderline) decisions
function pickInterestingHand(position: Position, stackBb: number): HandCombo {
  // 60% chance: pick a borderline hand (hand near the edge of the range)
  // 40% chance: pick any hand
  if (Math.random() < 0.6) {
    const borderline = ALL_HANDS.filter(h => {
      const action = getOpeningAction(position, stackBb, h.code);
      const strength = handStrength(h);
      // Borderline: hands that are opens/jams but not super strong, or folds that look playable
      return (action !== SimplifiedAction.FOLD && strength < 250) ||
             (action === SimplifiedAction.FOLD && strength > 120 && strength < 200);
    });
    if (borderline.length > 0) return pickRandom(borderline);
  }
  return pickRandom(ALL_HANDS);
}

function pickInterestingHandFacingOpen(opener: Position, hero: Position, stack: number): HandCombo {
  if (Math.random() < 0.6) {
    const borderline = ALL_HANDS.filter(h => {
      const action = getFacingOpenAction(opener, hero, stack, h.code);
      const strength = handStrength(h);
      return (action !== SimplifiedAction.FOLD && strength < 280) ||
             (action === SimplifiedAction.FOLD && strength > 140 && strength < 220);
    });
    if (borderline.length > 0) return pickRandom(borderline);
  }
  return pickRandom(ALL_HANDS);
}

function pickInterestingHandFacingLimp(limper: Position, hero: Position, stack: number): HandCombo {
  if (Math.random() < 0.6) {
    const borderline = ALL_HANDS.filter(h => {
      const action = getFacingLimpAction(limper, hero, stack, h.code);
      const strength = handStrength(h);
      return (action !== SimplifiedAction.FOLD && strength < 260) ||
             (action === SimplifiedAction.FOLD && strength > 130 && strength < 210);
    });
    if (borderline.length > 0) return pickRandom(borderline);
  }
  return pickRandom(ALL_HANDS);
}

function pickInterestingHandFacing3Bet(heroPos: Position, threeBettorPos: Position, stack: number): HandCombo {
  if (Math.random() < 0.6) {
    const borderline = ALL_HANDS.filter(h => {
      const action = getFacing3BetAction(heroPos, threeBettorPos, stack, h.code);
      const strength = handStrength(h);
      // For 3-bet spots, borderline means hands near the call/fold boundary
      return (action !== SimplifiedAction.FOLD && strength < 300) ||
             (action === SimplifiedAction.FOLD && strength > 180 && strength < 280);
    });
    if (borderline.length > 0) return pickRandom(borderline);
  }
  return pickRandom(ALL_HANDS);
}

// ======= FACING LIMP GENERATOR =======

function generateFacingLimpSpot(): GeneratedSpot {
  const key = pickRandom(FACING_LIMP_KEYS);
  const parsed = parseFacingLimpKey(key);

  if (!parsed) return generateUnopenedSpot(); // Fallback

  const { limper, hero, stack } = parsed;
  const hand = pickInterestingHandFacingLimp(limper, hero, stack);
  const correctAction = getFacingLimpAction(limper, hero, stack, hand.code);

  const acceptableActions: SimplifiedAction[] = [];
  // At short stacks, raise and jam are somewhat interchangeable
  if (correctAction === SimplifiedAction.JAM && stack >= 20) {
    acceptableActions.push(SimplifiedAction.OPEN);
  }
  if (correctAction === SimplifiedAction.OPEN && stack <= 15) {
    acceptableActions.push(SimplifiedAction.JAM);
  }

  const explanation = correctAction === SimplifiedAction.OPEN
    ? explainIsolateLimper(hand.code, hero, limper, stack)
    : correctAction === SimplifiedAction.LIMP
      ? explainLimpBehind(hand.code, hero, limper, stack)
      : correctAction === SimplifiedAction.JAM
        ? explainJamVsLimp(hand.code, hero, limper, stack)
        : explainFoldVsLimp(hand.code, hero, limper, stack);

  const scenario: FacingLimpScenario = { type: 'facing_limp', heroPosition: hero, limperPosition: limper, stackBb: stack };
  const id = randomId();

  const actionHistory = `${limper}_limps_folds_to_hero`;

  const template: SpotTemplate = {
    id: `tpl_${id}`,
    stackDepthBb: stack,
    position: hero,
    spotType: SpotType.FACING_LIMP,
    actionHistory,
  };

  const spot: SpotDecision = {
    id,
    spotTemplateId: template.id,
    handCode: hand.code,
    baselineAction: correctAction,
    simplifiedAction: correctAction,
    acceptableActions,
    difficultyBand: classifyDifficulty(hand, correctAction, scenario),
    leakCategory: assignLeakCategory(scenario, correctAction),
    explanation,
  };

  return { spot, template };
}

// ======= FACING 3-BET GENERATOR =======

function generateFacing3BetSpot(): GeneratedSpot {
  const key = pickRandom(FACING_3BET_KEYS);
  const parsed = parseFacing3BetKey(key);

  if (!parsed) return generateUnopenedSpot(); // Fallback

  const { hero, threeBettor, stack } = parsed;
  const hand = pickInterestingHandFacing3Bet(hero, threeBettor, stack);
  const correctAction = getFacing3BetAction(hero, threeBettor, stack, hand.code);

  const acceptableActions: SimplifiedAction[] = [];
  // At short stacks, calling and jamming are close
  if (correctAction === SimplifiedAction.CALL && stack <= 20) {
    acceptableActions.push(SimplifiedAction.JAM);
  }
  if (correctAction === SimplifiedAction.JAM && stack >= 25) {
    acceptableActions.push(SimplifiedAction.CALL);
  }

  const explanation = correctAction === SimplifiedAction.JAM
    ? explain4BetJam(hand.code, hero, threeBettor, stack)
    : correctAction === SimplifiedAction.CALL
      ? explainCallVs3Bet(hand.code, hero, threeBettor, stack)
      : explainFoldVs3Bet(hand.code, hero, threeBettor, stack);

  const scenario: Facing3BetScenario = { type: 'facing_3bet', heroPosition: hero, threeBettorPosition: threeBettor, stackBb: stack };
  const id = randomId();

  const actionHistory = `hero_opens_${hero}_${threeBettor}_3bets`;

  const template: SpotTemplate = {
    id: `tpl_${id}`,
    stackDepthBb: stack,
    position: hero,
    spotType: SpotType.FACING_3BET,
    actionHistory,
  };

  const spot: SpotDecision = {
    id,
    spotTemplateId: template.id,
    handCode: hand.code,
    baselineAction: correctAction,
    simplifiedAction: correctAction,
    acceptableActions,
    difficultyBand: classifyDifficulty(hand, correctAction, scenario),
    leakCategory: assignLeakCategory(scenario, correctAction),
    explanation,
  };

  return { spot, template };
}

// ======= KEY PARSERS =======

function parseFacingLimpKey(key: string): { limper: Position; hero: Position; stack: number } | null {
  const parts = key.split('_');
  if (parts.length !== 3) return null;
  const posMap: Record<string, Position> = {
    utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
    lj: Position.LJ, hj: Position.HJ, co: Position.CO,
    btn: Position.BTN, sb: Position.SB, bb: Position.BB,
  };
  const limper = posMap[parts[0]];
  const hero = posMap[parts[1]];
  const stack = parseInt(parts[2]);
  if (!limper || !hero || isNaN(stack)) return null;
  return { limper, hero, stack };
}

function parseFacing3BetKey(key: string): { hero: Position; threeBettor: Position; stack: number } | null {
  const parts = key.split('_');
  if (parts.length !== 3) return null;
  const posMap: Record<string, Position> = {
    utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
    lj: Position.LJ, hj: Position.HJ, co: Position.CO,
    btn: Position.BTN, sb: Position.SB, bb: Position.BB,
  };
  const hero = posMap[parts[0]];
  const threeBettor = posMap[parts[1]];
  const stack = parseInt(parts[2]);
  if (!hero || !threeBettor || isNaN(stack)) return null;
  return { hero, threeBettor, stack };
}

// ======= PUBLIC API =======

/**
 * Generate a single drill spot.
 *
 * @param preferredCategory Optional leak category. If provided, always returns
 *   a spot from that category — explicit user choice overrides production gating.
 * @param adminMode When true, the mixed distribution includes facing-limp and
 *   facing-3bet spots. When false (default, production users), limp and 3-bet
 *   are stripped from the mixed roll — users only see facing_open + unopened.
 *   Explicit drilling into a hidden category (e.g., by passing
 *   `LeakCategoryId.FACING_LIMPS`) still works regardless of adminMode; the
 *   UI is responsible for hiding the entry points from non-admins.
 *   See WORK-PLAN.md Priority 1e for the bugs being tracked.
 */
export function generateDrillSpot(preferredCategory?: LeakCategoryId, adminMode: boolean = false): GeneratedSpot {
  // Facing opens now drills facing-open only (limpers have their own category)
  if (preferredCategory === LeakCategoryId.FACING_OPENS) {
    return generateFacingOpenSpot();
  }

  // Facing limpers: pure limp drill
  if (preferredCategory === LeakCategoryId.FACING_LIMPS) {
    return generateFacingLimpSpot();
  }

  // If asking for facing 3-bets, always generate that type
  if (preferredCategory === LeakCategoryId.FACING_3BETS) {
    return generateFacing3BetSpot();
  }

  // For other categories, generate the appropriate unopened spot
  if (preferredCategory) {
    return generateUnopenedSpot(preferredCategory);
  }

  const roll = Math.random();

  if (adminMode) {
    // Admin mixed distribution: 35% facing open / 15% facing limp / 10% facing 3-bet / 40% unopened
    if (roll < 0.35) return generateFacingOpenSpot();
    if (roll < 0.50) return generateFacingLimpSpot();
    if (roll < 0.60) return generateFacing3BetSpot();
    return generateUnopenedSpot();
  }

  // Non-admin mixed: 47% facing_open / 53% unopened (limp + 3-bet hidden)
  if (roll < 0.47) return generateFacingOpenSpot();
  return generateUnopenedSpot();
}

export function generateDrillSet(count: number, preferredCategory?: LeakCategoryId, adminMode: boolean = false): GeneratedSpot[] {
  const spots: GeneratedSpot[] = [];
  const usedHands = new Set<string>();

  let attempts = 0;
  while (spots.length < count && attempts < count * 5) {
    attempts++;
    const generated = generateDrillSpot(preferredCategory, adminMode);

    // Avoid duplicate hands in the same set
    const key = `${generated.spot.handCode}_${generated.template.position}_${generated.template.stackDepthBb}`;
    if (usedHands.has(key)) continue;

    usedHands.add(key);
    spots.push(generated);
  }

  return spots;
}
