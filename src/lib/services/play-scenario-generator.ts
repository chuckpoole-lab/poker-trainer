/**
 * Play mode scenario generator
 * Converts the spot generator output into Play mode hand scenarios.
 * Supports date-seeded daily challenges and unlimited bonus hands.
 */

import { generateDrillSpot, type GeneratedSpot } from './spot-generator';
import { Position, SimplifiedAction, SpotType, POSITION_LABELS } from '@/lib/types';
import { ALL_HANDS, getOpeningAction, getFacingOpenAction, type HandCombo } from '@/lib/data/range-tables';
import {
  explainOpen,
  explainFoldUnopened,
  explainJamUnopened,
  explainJamVsOpen,
  explainCallVsOpen,
  explainFoldVsOpen,
} from '@/lib/data/explanation-templates';

// ── Types ──

export interface PlayHandScenario {
  id: string;
  position: string;
  stack: string;
  situation: string;
  cards: Array<{ rank: string; suit: string }>;
  choices: string[];
  correct: number;
  tipRight: string;
  tipWrong: string;
}
// ── Seeded random number generator (Mulberry32) ──

function seededRng(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const chr = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Card parsing ──

const SUIT_CHOICES = ['h', 'd', 'c', 's'];
function parseHandCode(handCode: string): Array<{ rank: string; suit: string }> {
  const rank1 = handCode[0];
  const rank2 = handCode.length >= 2 ? handCode[1] : rank1;
  const isSuited = handCode.endsWith('s');
  const isPair = rank1 === rank2 && !handCode.endsWith('s') && !handCode.endsWith('o');

  // Deterministic suit assignment based on the hand code itself
  // This ensures cards ALWAYS match the hand code regardless of any external state
  const suitSeed = handCode.charCodeAt(0) * 31 + handCode.charCodeAt(1) * 7 + (handCode.length > 2 ? handCode.charCodeAt(2) : 0);

  if (isPair) {
    const s1Idx = suitSeed % 4;
    let s2Idx = (suitSeed * 3 + 1) % 3;
    if (s2Idx >= s1Idx) s2Idx++;
    return [
      { rank: rank1, suit: SUIT_CHOICES[s1Idx] },
      { rank: rank1, suit: SUIT_CHOICES[s2Idx] },
    ];
  }

  if (isSuited) {
    const suitIdx = suitSeed % 4;
    const suit = SUIT_CHOICES[suitIdx];
    return [
      { rank: rank1, suit },
      { rank: rank2, suit },
    ];
  }
  // Offsuit
  const s1Idx = suitSeed % 4;
  let s2Idx = (suitSeed * 3 + 1) % 3;
  if (s2Idx >= s1Idx) s2Idx++;
  return [
    { rank: rank1, suit: SUIT_CHOICES[s1Idx] },
    { rank: rank2, suit: SUIT_CHOICES[s2Idx] },
  ];
}

// ── Situation text builders ──

const POSITION_DISPLAY: Record<string, string> = {
  utg: 'Under the Gun', hj: 'Hijack', co: 'Cutoff',
  btn: 'Button', sb: 'Small Blind', bb: 'Big Blind',
  utg1: 'UTG+1', mp: 'Middle Position', lj: 'Lojack',
};

function buildSituation(spot: GeneratedSpot): string {
  const { template } = spot;
  const pos = POSITION_DISPLAY[template.position] || POSITION_LABELS[template.position as Position];

  if (template.spotType === SpotType.FACING_OPEN || template.spotType === SpotType.FACING_3BET) {
    const history = template.actionHistory;
    const openerMatch = history.match(/^(\w+)_opens/);
    const openerKey = openerMatch ? openerMatch[1] : 'unknown';
    const openerName = POSITION_DISPLAY[openerKey] || openerKey.toUpperCase();
    const heroPos = template.position;
    const seatOrder = ['utg', 'utg1', 'mp', 'lj', 'hj', 'co', 'btn', 'sb', 'bb'];
    const openerIdx = seatOrder.indexOf(openerKey);
    const heroIdx = seatOrder.indexOf(heroPos);
    const gap = heroIdx - openerIdx;

    if (gap === 1) {
      return `The ${openerName} raises to 2.5x.`;
    } else if (gap === 2) {
      return `The ${openerName} raises to 2.5x. The player between you folds.`;
    } else if (gap > 2) {
      return `The ${openerName} raises to 2.5x. Everyone between you folds.`;
    } else {
      return `The ${openerName} raises to 2.5x. Everyone else folds.`;
    }
  }

  if (template.position === Position.SB) {
    return 'Everyone folds to you. Only the big blind remains.';
  }

  const situationMap: Record<string, string> = {
    utg: "You're first to act. Full table, 8-9 players behind you.",
    utg1: "UTG folds. You're next to act with 7-8 players behind you.",
    mp: "The early positions fold. You have 6-7 players behind you.",
    lj: "The early positions fold to you. 5-6 players behind you.",
    hj: "It folds to you. 4-5 players behind you.",
    co: "Everyone folds to you. 3 players behind you.",
    btn: "Everyone folds to you. Only the blinds to get through.",
  };
  return situationMap[template.position] || 'Everyone folds to you.';
}
// ── Choice and tip builders ──

function buildChoices(correctAction: SimplifiedAction, spotType: SpotType, stackBb: number): string[] {
  if (spotType === SpotType.FACING_OPEN || spotType === SpotType.FACING_3BET) {
    return ['Fold', 'Call', 'All-in'];
  }
  return ['Fold', 'Raise', 'All-in'];
}

function getCorrectIndex(correctAction: SimplifiedAction, choices: string[]): number {
  const actionToChoice: Record<string, string[]> = {
    fold: ['Fold'],
    open: ['Raise to 2.5x', 'Raise'],
    call: ['Call'],
    jam: ['Shove all-in', 'All-in'],
  };
  const matches = actionToChoice[correctAction] || [];
  for (const m of matches) {
    const idx = choices.findIndex(c => c.includes(m));
    if (idx >= 0) return idx;
  }
  return 0;
}

const ACTION_DISPLAY: Record<string, string> = {
  fold: 'Fold', open: 'Raise', call: 'Call', jam: 'All-in',
};
// ── Convert a generated spot into a PlayHandScenario ──
// CRITICAL: This function is the single source of truth for what the user sees.
// Cards, correct action, and explanation are ALL derived from the same handCode
// to make it IMPOSSIBLE for them to reference different hands.

function spotToPlayScenario(generated: GeneratedSpot, rng: () => number): PlayHandScenario {
  const { spot, template } = generated;
  const pos = POSITION_DISPLAY[template.position] || POSITION_LABELS[template.position as Position];
  const handCode = spot.handCode;

  // Step 1: Generate cards directly from handCode (deterministic, no RNG dependency)
  const cards = parseHandCode(handCode);

  // Step 2: Re-derive the correct action from range-tables using handCode
  // Range-tables are the authoritative source of truth
  let verifiedAction: SimplifiedAction;
  const isFacingOpen = template.spotType === SpotType.FACING_OPEN || template.spotType === SpotType.FACING_3BET;
  const posMap: Record<string, Position> = {
    utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
    lj: Position.LJ, hj: Position.HJ, co: Position.CO,
    btn: Position.BTN, sb: Position.SB, bb: Position.BB,
  };

  let openerPos: Position | undefined;
  if (isFacingOpen) {
    const actionHistory = template.actionHistory || '';
    const openerMatch = actionHistory.match(/^(\w+)_opens/);
    openerPos = openerMatch ? posMap[openerMatch[1]] : undefined;
    if (openerPos) {
      verifiedAction = getFacingOpenAction(openerPos, template.position as Position, template.stackDepthBb, handCode);
    } else {
      verifiedAction = spot.simplifiedAction;
    }
  } else {
    verifiedAction = getOpeningAction(template.position as Position, template.stackDepthBb, handCode);
  }

  // Log if the verified action differs from what the spot generator produced
  if (verifiedAction !== spot.simplifiedAction) {
    console.warn(`[PokerTrainer] Action mismatch: spot=${spot.simplifiedAction} vs range-tables=${verifiedAction} for ${handCode} at ${template.position} ${template.stackDepthBb}bb. Using range-tables.`);
  }
  // Step 3: Generate FRESH explanation directly from handCode + verifiedAction
  // This is the key fix — we NEVER use the pre-cached spot.explanation
  // because it could reference a different hand due to caching/CDN inconsistency
  let freshExplanation: { plain: string };

  if (isFacingOpen && openerPos) {
    freshExplanation = verifiedAction === SimplifiedAction.JAM
      ? explainJamVsOpen(handCode, template.position as Position, openerPos, template.stackDepthBb)
      : verifiedAction === SimplifiedAction.CALL
        ? explainCallVsOpen(handCode, template.position as Position, openerPos, template.stackDepthBb)
        : explainFoldVsOpen(handCode, template.position as Position, openerPos, template.stackDepthBb);
  } else if (!isFacingOpen) {
    freshExplanation = verifiedAction === SimplifiedAction.OPEN
      ? explainOpen(handCode, template.position as Position, template.stackDepthBb)
      : verifiedAction === SimplifiedAction.JAM
        ? explainJamUnopened(handCode, template.position as Position, template.stackDepthBb)
        : explainFoldUnopened(handCode, template.position as Position, template.stackDepthBb);
  } else {
    // Fallback: use spot's pre-cached explanation (facing open but no opener parsed)
    freshExplanation = spot.explanation;
  }
  const situation = buildSituation(generated);
  const choices = buildChoices(verifiedAction, template.spotType as SpotType, template.stackDepthBb);
  const correct = getCorrectIndex(verifiedAction, choices);

  // Build tips from freshExplanation (guaranteed to reference handCode)
  const actionLabel = ACTION_DISPLAY[verifiedAction] || verifiedAction;
  const tipRight = freshExplanation.plain;
  const tipWrong = `The correct play is ${actionLabel}. ${freshExplanation.plain}`;

  return {
    id: spot.id,
    position: pos,
    stack: `${template.stackDepthBb} blinds`,
    situation,
    cards,
    choices,
    correct,
    tipRight,
    tipWrong,
  };
}
// ── Public API ──

/**
 * Generate the daily 5 hands — deterministic based on date.
 * Everyone gets the same hands on the same day.
 */
export function generateDailyHands(dateStr?: string): PlayHandScenario[] {
  const today = dateStr || new Date().toISOString().split('T')[0];
  const seed = dateToSeed(today + '_pokertrain_daily');
  const rng = seededRng(seed);

  const hands: PlayHandScenario[] = [];
  const usedKeys = new Set<string>();
  let attempts = 0;

  while (hands.length < 5 && attempts < 50) {
    attempts++;

    const scenarioSeed = seed + hands.length * 7919 + attempts * 31;
    const scenarioRng = seededRng(scenarioSeed);

    // Override Math.random temporarily for the generator
    // Use try/finally to guarantee restoration even if generateDrillSpot throws
    const originalRandom = Math.random;
    let generated: GeneratedSpot;
    try {
      Math.random = scenarioRng;
      generated = generateDrillSpot();
    } finally {
      Math.random = originalRandom;
    }
    // Avoid duplicates
    const key = `${generated.spot.handCode}_${generated.template.position}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    hands.push(spotToPlayScenario(generated, rng));
  }

  return hands;
}

/**
 * Generate a single random bonus hand for "Keep Playing" mode.
 * Not date-seeded — each is unique.
 */
export function generateBonusHand(): PlayHandScenario {
  const rng = () => Math.random();
  const generated = generateDrillSpot();
  return spotToPlayScenario(generated, rng);
}

/**
 * Generate a batch of bonus hands.
 */
export function generateBonusHands(count: number): PlayHandScenario[] {
  const hands: PlayHandScenario[] = [];
  const usedKeys = new Set<string>();
  let attempts = 0;
  while (hands.length < count && attempts < count * 5) {
    attempts++;
    const rng = () => Math.random();
    const generated = generateDrillSpot();
    const key = `${generated.spot.handCode}_${generated.template.position}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    hands.push(spotToPlayScenario(generated, rng));
  }

  return hands;
}
