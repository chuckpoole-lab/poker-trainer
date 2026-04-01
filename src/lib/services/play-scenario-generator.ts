/**
 * Play mode scenario generator
 * Converts the spot generator output into Play mode hand scenarios.
 * Supports date-seeded daily challenges and unlimited bonus hands.
 */

import { generateDrillSpot, type GeneratedSpot } from './spot-generator';
import { Position, SimplifiedAction, SpotType, POSITION_LABELS } from '@/lib/types';
import { ALL_HANDS, type HandCombo } from '@/lib/data/range-tables';

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

function parseHandCode(handCode: string, rng: () => number): Array<{ rank: string; suit: string }> {
  const rank1 = handCode[0];
  const rank2 = handCode[1];
  const isSuited = handCode.endsWith('s');
  const isPair = rank1 === rank2 && handCode.length === 2;

  if (isPair) {
    const s1Idx = Math.floor(rng() * 4);
    let s2Idx = Math.floor(rng() * 3);
    if (s2Idx >= s1Idx) s2Idx++;
    return [
      { rank: rank1, suit: SUIT_CHOICES[s1Idx] },
      { rank: rank2, suit: SUIT_CHOICES[s2Idx] },
    ];
  }

  if (isSuited) {
    const suitIdx = Math.floor(rng() * 4);
    const suit = SUIT_CHOICES[suitIdx];
    return [
      { rank: rank1, suit },
      { rank: rank2, suit },
    ];
  }

  // Offsuit
  const s1Idx = Math.floor(rng() * 4);
  let s2Idx = Math.floor(rng() * 3);
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
    // Parse opener from action history
    const history = template.actionHistory;
    const openerMatch = history.match(/^(\w+)_opens/);
    const openerKey = openerMatch ? openerMatch[1] : 'unknown';
    const openerName = POSITION_DISPLAY[openerKey] || openerKey.toUpperCase();
    return `The ${openerName} raises to 2.5x. Everyone else folds to you.`;
  }

  if (template.position === Position.SB) {
    return 'Everyone folds to you. Only the big blind remains.';
  }

  const playersAfterMap: Record<string, string> = {
    utg: '8-9 players behind you', utg1: '7-8 players behind you',
    mp: '6-7 players behind you', lj: '5-6 players behind you',
    hj: '4-5 players behind you', co: '3 players behind you',
    btn: 'Only the blinds to get through',
  };
  const playersAfter = playersAfterMap[template.position] || 'several players behind you';

  return `Everyone folds to you. ${playersAfter}.`;
}

// ── Choice and tip builders ──

function buildChoices(correctAction: SimplifiedAction, spotType: SpotType, stackBb: number): string[] {
  // Build 3 contextual choices based on the spot type and correct action
  if (spotType === SpotType.FACING_OPEN || spotType === SpotType.FACING_3BET) {
    if (correctAction === SimplifiedAction.JAM) return ['Fold', 'Call', 'Shove all-in'];
    if (correctAction === SimplifiedAction.CALL) return ['Fold', 'Call', 'Shove all-in'];
    if (correctAction === SimplifiedAction.FOLD) return ['Fold', 'Call', 'Shove all-in'];
  }

  // Unopened pot
  if (stackBb <= 12) {
    // Push/fold territory
    if (correctAction === SimplifiedAction.JAM) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
    if (correctAction === SimplifiedAction.FOLD) return ['Fold', 'Limp in', 'Shove all-in'];
  }

  if (stackBb <= 15) {
    if (correctAction === SimplifiedAction.JAM) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
    if (correctAction === SimplifiedAction.OPEN) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
    if (correctAction === SimplifiedAction.FOLD) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
  }

  // Standard stacks (20-30bb)
  if (correctAction === SimplifiedAction.OPEN) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
  if (correctAction === SimplifiedAction.FOLD) return ['Fold', 'Raise to 2.5x', 'Limp in'];
  if (correctAction === SimplifiedAction.JAM) return ['Fold', 'Raise to 2.5x', 'Shove all-in'];

  return ['Fold', 'Raise to 2.5x', 'Shove all-in'];
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

function buildPlayTip(spot: GeneratedSpot, isCorrect: boolean): string {
  const { spot: s, template: t } = spot;
  const pos = POSITION_DISPLAY[t.position] || POSITION_LABELS[t.position as Position];
  const hand = s.handCode;
  const stack = t.stackDepthBb;
  const action = s.simplifiedAction;

  // Use the explanation templates but adapt for play mode tone
  const explanation = s.explanation;
  if (isCorrect) {
    return explanation.plain;
  }

  // Wrong answer: combine the plain explanation with a friendly nudge
  return explanation.plain;
}

// ── Convert a generated spot into a PlayHandScenario ──

function spotToPlayScenario(generated: GeneratedSpot, rng: () => number): PlayHandScenario {
  const { spot, template } = generated;
  const pos = POSITION_DISPLAY[template.position] || POSITION_LABELS[template.position as Position];

  const cards = parseHandCode(spot.handCode, rng);
  const situation = buildSituation(generated);
  const choices = buildChoices(spot.simplifiedAction, template.spotType as SpotType, template.stackDepthBb);
  const correct = getCorrectIndex(spot.simplifiedAction, choices);

  return {
    id: spot.id,
    position: pos,
    stack: `${template.stackDepthBb} blinds`,
    situation,
    cards,
    choices,
    correct,
    tipRight: buildPlayTip(generated, true),
    tipWrong: buildPlayTip(generated, false),
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

    // Use seeded random to pick scenario parameters deterministically
    const scenarioSeed = seed + hands.length * 7919 + attempts * 31;
    const scenarioRng = seededRng(scenarioSeed);

    // Override Math.random temporarily for the generator
    const originalRandom = Math.random;
    Math.random = scenarioRng;

    const generated = generateDrillSpot();

    Math.random = originalRandom;

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
