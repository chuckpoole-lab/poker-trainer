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

type Scenario = UnopenedScenario | FacingOpenScenario;

// Positions that can open (for unopened spots)
const OPENING_POSITIONS: Position[] = [
  Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB,
];

// Stack depths we have data for
const STACK_DEPTHS = [10, 15, 20, 25, 30];

// Facing-open scenarios we have range data for
const FACING_OPEN_KEYS = Array.from(COMPILED_RANGES.facingOpen.keys());

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

// ======= PUBLIC API =======

export function generateDrillSpot(preferredCategory?: LeakCategoryId): GeneratedSpot {
  // If asking for facing opens, always generate that type
  if (preferredCategory === LeakCategoryId.FACING_OPENS) {
    return generateFacingOpenSpot();
  }

  // For other categories, generate the appropriate unopened spot
  if (preferredCategory) {
    return generateUnopenedSpot(preferredCategory);
  }

  // Mixed: 40% facing open, 60% unopened
  if (Math.random() < 0.4) {
    return generateFacingOpenSpot();
  }
  return generateUnopenedSpot();
}

export function generateDrillSet(count: number, preferredCategory?: LeakCategoryId): GeneratedSpot[] {
  const spots: GeneratedSpot[] = [];
  const usedHands = new Set<string>();

  let attempts = 0;
  while (spots.length < count && attempts < count * 5) {
    attempts++;
    const generated = generateDrillSpot(preferredCategory);

    // Avoid duplicate hands in the same set
    const key = `${generated.spot.handCode}_${generated.template.position}_${generated.template.stackDepthBb}`;
    if (usedHands.has(key)) continue;

    usedHands.add(key);
    spots.push(generated);
  }

  return spots;
}
