/**
 * Play mode scenario generator — v2 (complete rewrite, April 2026)
 *
 * Architecture principle: ALL output for a single hand (cards, action, explanation,
 * choices) is generated inside ONE function from ONE locked set of primitive
 * parameters.  No GeneratedSpot objects cross the boundary; only strings and numbers
 * are passed in.  A final validation pass runs on every hand before it is returned
 * to the caller so a corrupted scenario can never reach the user.
 */

import { Position, SimplifiedAction, SpotType, POSITION_LABELS } from '@/lib/types';
import {
  ALL_HANDS,
  getOpeningAction,
  getFacingOpenAction,
  getFacingLimpAction,
  getFacing3BetAction,
  COMPILED_RANGES,
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

// ─────────────────────────────────────────────
//  Public output type
// ─────────────────────────────────────────────

export interface PlayHandScenario {
  id: string;
  handCode: string;
  position: string;
  stack: string;
  situation: string;
  cards: Array<{ rank: string; suit: string }>;
  choices: string[];
  correct: number;
  tipRight: string;
  tipWrong: string;
}

// ─────────────────────────────────────────────
//  Seeded RNG (Mulberry32)
// ─────────────────────────────────────────────

function seededRng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// ─────────────────────────────────────────────
//  Card display helpers
// ─────────────────────────────────────────────

const SUITS = ['h', 'd', 'c', 's'] as const;

/**
 * Deterministically derive two playing cards from a hand code.
 * Derived entirely from the hand code characters — no external state.
 */
function handCodeToCards(handCode: string): Array<{ rank: string; suit: string }> {
  const r1 = handCode[0];
  const r2 = handCode.length >= 2 ? handCode[1] : r1;
  const isSuited = handCode.endsWith('s');
  const isPair = r1 === r2 && !isSuited && !handCode.endsWith('o');

  // Seed comes only from the hand-code characters
  const seed =
    (handCode.charCodeAt(0) * 7331) ^
    (handCode.charCodeAt(1) * 1999) ^
    (handCode.length > 2 ? handCode.charCodeAt(2) * 397 : 0);

  if (isSuited) {
    const suit = SUITS[Math.abs(seed) % 4];
    return [{ rank: r1, suit }, { rank: r2, suit }];
  }

  // Offsuit or pair: two different suits
  const s1 = Math.abs(seed) % 4;
  const s2 = (Math.abs(seed >> 2) % 3 + s1 + 1) % 4;
  return [
    { rank: r1, suit: SUITS[s1] },
    { rank: r2, suit: SUITS[s2] },
  ];
}

/**
 * Verify that the cards we produced actually reflect the hand code.
 * Returns true if everything is consistent.
 */
function cardsMatchHandCode(
  cards: Array<{ rank: string; suit: string }>,
  handCode: string,
): boolean {
  if (cards.length !== 2) return false;
  const r1 = handCode[0];
  const r2 = handCode.length >= 2 ? handCode[1] : r1;
  const isSuited = handCode.endsWith('s');
  const isPair = r1 === r2 && !isSuited && !handCode.endsWith('o');

  if (cards[0].rank !== r1) return false;
  if (cards[1].rank !== r2) return false;
  if (isSuited && cards[0].suit !== cards[1].suit) return false;
  if (!isPair && !isSuited && cards[0].suit === cards[1].suit) return false;
  return true;
}

// ─────────────────────────────────────────────
//  Position display maps
// ─────────────────────────────────────────────

const POS_DISPLAY: Record<string, string> = {
  utg: 'Under the Gun', hj: 'Hijack', co: 'Cutoff',
  btn: 'Button', sb: 'Small Blind', bb: 'Big Blind',
  utg1: 'UTG+1', mp: 'Middle Position', lj: 'Lojack',
};

const POS_MAP: Record<string, Position> = {
  utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
  lj: Position.LJ, hj: Position.HJ, co: Position.CO,
  btn: Position.BTN, sb: Position.SB, bb: Position.BB,
};

const SEAT_ORDER = ['utg', 'utg1', 'mp', 'lj', 'hj', 'co', 'btn', 'sb', 'bb'];

function posLabel(key: string): string {
  return POS_DISPLAY[key] ?? POSITION_LABELS[POS_MAP[key] as Position] ?? key.toUpperCase();
}

// ─────────────────────────────────────────────
//  Situation text builders
// ─────────────────────────────────────────────

const UNOPENED_SITUATION: Record<string, string> = {
  utg: "You're first to act. Full table, 8-9 players behind you.",
  utg1: 'UTG folds. You\'re next to act with 7-8 players behind you.',
  mp: 'The early positions fold. You have 6-7 players behind you.',
  lj: 'The early positions fold to you. 5-6 players behind you.',
  hj: 'It folds to you. 4-5 players behind you.',
  co: 'Everyone folds to you. 3 players behind you.',
  btn: 'Everyone folds to you. Only the blinds to get through.',
  sb: 'Everyone folds to you. Only the big blind remains.',
};

function buildSituation(
  spotType: string,
  heroKey: string,
  opponentKey: string,
): string {
  if (spotType === 'unopened') {
    return UNOPENED_SITUATION[heroKey] ?? 'Everyone folds to you.';
  }

  if (spotType === 'facing_open') {
    const heroIdx = SEAT_ORDER.indexOf(heroKey);
    const openIdx = SEAT_ORDER.indexOf(opponentKey);
    const gap = heroIdx - openIdx;
    const oName = posLabel(opponentKey);
    if (gap <= 1) return `The ${oName} raises to 2.5x.`;
    if (gap === 2) return `The ${oName} raises to 2.5x. The player between you folds.`;
    return `The ${oName} raises to 2.5x. Everyone between you folds.`;
  }

  if (spotType === 'facing_limp') {
    if (opponentKey === 'sb' && heroKey === 'bb') {
      return 'The Small Blind completes. You check or raise from the Big Blind.';
    }
    const heroIdx = SEAT_ORDER.indexOf(heroKey);
    const limpIdx = SEAT_ORDER.indexOf(opponentKey);
    const gap = heroIdx - limpIdx;
    const oName = posLabel(opponentKey);
    if (gap <= 1) return `The ${oName} limps in.`;
    if (gap === 2) return `The ${oName} limps in. The player between you folds.`;
    return `The ${oName} limps in. Everyone between you folds.`;
  }

  if (spotType === 'facing_3bet') {
    return `You raised to 2.5x. The ${posLabel(opponentKey)} goes all-in.`;
  }

  return 'Everyone folds to you.';
}

// ─────────────────────────────────────────────
//  Choices and correct-index builder
// ─────────────────────────────────────────────

function buildChoices(spotType: string, heroKey?: string, opponentKey?: string): string[] {
  if (spotType === 'facing_3bet' || spotType === 'facing_open') {
    return ['Fold', 'Call', 'All-in'];
  }
  if (spotType === 'facing_limp') {
    // Special case: BB defending vs SB-complete. BB has already posted,
    // so "Fold" is not a legal action. Use "Check" (free flop) instead of
    // "Limp behind" since BB already completed the bet.
    if (opponentKey === 'sb' && heroKey === 'bb') {
      return ['Check', 'Raise', 'All-in'];
    }
    return ['Fold', 'Limp behind', 'Raise', 'All-in'];
  }
  return ['Fold', 'Raise', 'All-in'];
}

function correctChoiceIndex(action: SimplifiedAction, choices: string[]): number {
  const map: Record<string, string[]> = {
    fold: ['Fold'],
    open: ['Raise to 2.5x', 'Raise'],
    call: ['Call'],
    jam: ['All-in', 'Shove all-in'],
    // "Check" is the BB-vs-SB-complete equivalent of limping behind
    limp: ['Limp behind', 'Limp', 'Check', 'Call'],
  };
  for (const label of (map[action] ?? [])) {
    const idx = choices.findIndex(c => c.includes(label));
    if (idx >= 0) return idx;
  }
  return 0;
}

const ACTION_LABEL: Record<string, string> = {
  fold: 'Fold', open: 'Raise', call: 'Call', jam: 'All-in', limp: 'Limp behind',
};

// ─────────────────────────────────────────────
//  The one and only scenario builder
//  ALL fields are derived from the same locked parameters.
// ─────────────────────────────────────────────

function buildScenario(
  id: string,
  handCode: string,
  heroKey: string,
  stackBb: number,
  spotType: string,
  opponentKey: string, // opener / limper / threeBettor key (or '' for unopened)
): PlayHandScenario {
  // ── 1. Cards — derived only from handCode ──
  const cards = handCodeToCards(handCode);

  // Hard check: cards must match handCode
  if (!cardsMatchHandCode(cards, handCode)) {
    console.error(`[PokerTrainer] Card mismatch for handCode="${handCode}". Cards:`, cards);
    // Force-rebuild as last resort
    const r1 = handCode[0];
    const r2 = handCode.length >= 2 ? handCode[1] : r1;
    const isSuited = handCode.endsWith('s');
    cards[0] = { rank: r1, suit: 'h' };
    cards[1] = { rank: r2, suit: isSuited ? 'h' : 'd' };
  }

  // ── 2. Correct action — always re-derived from range tables ──
  const heroPos = POS_MAP[heroKey];
  const opponentPos = opponentKey ? POS_MAP[opponentKey] : undefined;

  let action: SimplifiedAction;
  if (spotType === 'facing_open' && opponentPos) {
    action = getFacingOpenAction(opponentPos, heroPos, stackBb, handCode);
  } else if (spotType === 'facing_limp' && opponentPos) {
    action = getFacingLimpAction(opponentPos, heroPos, stackBb, handCode);
  } else if (spotType === 'facing_3bet' && opponentPos) {
    action = getFacing3BetAction(heroPos, opponentPos, stackBb, handCode);
  } else {
    action = getOpeningAction(heroPos, stackBb, handCode);
  }

  // ── 3. Explanation — derived only from handCode + action ──
  //    We pass handCode (not any cached value) into every template call.
  let explanation: { plain: string };

  if (spotType === 'facing_open' && opponentPos) {
    explanation =
      action === SimplifiedAction.JAM
        ? explainJamVsOpen(handCode, heroPos, opponentPos, stackBb)
        : action === SimplifiedAction.CALL
          ? explainCallVsOpen(handCode, heroPos, opponentPos, stackBb)
          : explainFoldVsOpen(handCode, heroPos, opponentPos, stackBb);
  } else if (spotType === 'facing_limp' && opponentPos) {
    explanation =
      action === SimplifiedAction.OPEN
        ? explainIsolateLimper(handCode, heroPos, opponentPos, stackBb)
        : action === SimplifiedAction.LIMP
          ? explainLimpBehind(handCode, heroPos, opponentPos, stackBb)
          : action === SimplifiedAction.JAM
            ? explainJamVsLimp(handCode, heroPos, opponentPos, stackBb)
            : explainFoldVsLimp(handCode, heroPos, opponentPos, stackBb);
  } else if (spotType === 'facing_3bet' && opponentPos) {
    explanation =
      action === SimplifiedAction.JAM
        ? explain4BetJam(handCode, heroPos, opponentPos, stackBb)
        : action === SimplifiedAction.CALL
          ? explainCallVs3Bet(handCode, heroPos, opponentPos, stackBb)
          : explainFoldVs3Bet(handCode, heroPos, opponentPos, stackBb);
  } else {
    explanation =
      action === SimplifiedAction.OPEN
        ? explainOpen(handCode, heroPos, stackBb)
        : action === SimplifiedAction.JAM
          ? explainJamUnopened(handCode, heroPos, stackBb)
          : explainFoldUnopened(handCode, heroPos, stackBb);
  }

  // ── 4. Situation text ──
  const situation = buildSituation(spotType, heroKey, opponentKey);

  // ── 5. Choices + correct index ──
  const choices = buildChoices(spotType, heroKey, opponentKey);
  const correct = correctChoiceIndex(action, choices);
  const actionLabel = ACTION_LABEL[action] ?? action;

  const tipRight = explanation.plain;
  const tipWrong = `The correct play is ${actionLabel}. ${explanation.plain}`;

  // ── 6. Final integrity check ──
  //    Verify that BOTH cards AND explanation reference the same hand.
  const rankOk = cards[0].rank === handCode[0] &&
    cards[1].rank === (handCode[1] ?? handCode[0]);

  const explanationContainsHand = tipRight.includes(handCode);

  if (!rankOk || !explanationContainsHand) {
    console.error(
      `[PokerTrainer] INTEGRITY FAILURE for handCode="${handCode}". ` +
      `rankOk=${rankOk}, explanationContainsHand=${explanationContainsHand}. ` +
      `tipRight="${tipRight.slice(0, 80)}"`
    );
    // Replace with a guaranteed-safe minimal explanation
    const safeExplanation =
      `With ${handCode} at ${stackBb}bb from ${posLabel(heroKey)}, the correct play is ${actionLabel.toLowerCase()}.`;
    return {
      id,
      handCode,
      position: posLabel(heroKey),
      stack: `${stackBb} blinds`,
      situation,
      cards,
      choices,
      correct,
      tipRight: safeExplanation,
      tipWrong: `The correct play is ${actionLabel}. ${safeExplanation}`,
    };
  }

  return {
    id,
    handCode,
    position: posLabel(heroKey),
    stack: `${stackBb} blinds`,
    situation,
    cards,
    choices,
    correct,
    tipRight,
    tipWrong,
  };
}

// ─────────────────────────────────────────────
//  Scenario parameter pickers
//  (pure RNG → primitive parameters only)
// ─────────────────────────────────────────────

const OPENING_POSITIONS = ['utg', 'hj', 'co', 'btn', 'sb'];
const STACK_DEPTHS = [10, 15, 20, 25, 30];
const FACING_OPEN_KEYS = Array.from(COMPILED_RANGES.facingOpen.keys());
const FACING_LIMP_KEYS = Array.from(COMPILED_RANGES.facingLimp.keys());
const FACING_3BET_KEYS = Array.from(COMPILED_RANGES.facing3Bet.keys());

function pickRng<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick a hand biased toward interesting (borderline) decisions. */
function pickHand(
  rng: () => number,
  spotType: string,
  heroKey: string,
  stackBb: number,
  opponentKey: string,
): string {
  const heroPos = POS_MAP[heroKey];
  const opponentPos = opponentKey ? POS_MAP[opponentKey] : undefined;

  function getAction(code: string): SimplifiedAction {
    if (spotType === 'facing_open' && opponentPos)
      return getFacingOpenAction(opponentPos, heroPos, stackBb, code);
    if (spotType === 'facing_limp' && opponentPos)
      return getFacingLimpAction(opponentPos, heroPos, stackBb, code);
    if (spotType === 'facing_3bet' && opponentPos)
      return getFacing3BetAction(heroPos, opponentPos, stackBb, code);
    return getOpeningAction(heroPos, stackBb, code);
  }

  if (rng() < 0.6) {
    const borderline = ALL_HANDS.filter(h => {
      const a = getAction(h.code);
      const strength = h.isPair
        ? 200 + (h.rank1 === h.rank2 ? 1 : 0)
        : h.suited ? 30 : 0;
      return (a !== SimplifiedAction.FOLD && strength < 250) ||
        (a === SimplifiedAction.FOLD && strength > 120 && strength < 200);
    });
    if (borderline.length > 0) return pickRng(borderline, rng).code;
  }
  return pickRng(ALL_HANDS, rng).code;
}

/** Generate a single raw scenario, returning only primitives.
 *
 * @param adminMode When true, enables the full 35/15/10/40 dispatch across
 *   facing_open / facing_limp / facing_3bet / unopened. When false (default,
 *   production users), facing_limp and facing_3bet are stripped — the
 *   distribution collapses to ~47% facing_open / 53% unopened.
 *
 *   Rationale (2026-04-16): the Facing Limpers and 3-Betting modules have
 *   known bugs — wrong ranges on most hands, wrong action descriptions,
 *   and the generator assumes single-limper when multi-way limps are the
 *   actual norm at bar poker. Hiding them from daily/bonus play until the
 *   content is rebuilt. Admins (Chris + Chuck) keep full dispatch so they
 *   can reproduce and debug. See WORK-PLAN.md Priority 1e.
 */
function pickScenarioParams(
  rng: () => number,
  adminMode: boolean = false,
): {
  spotType: string;
  heroKey: string;
  stackBb: number;
  opponentKey: string;
} {
  const roll = rng();

  if (adminMode) {
    // Admin dispatch: full 35/15/10/40 mix including experimental limp/3-bet modules
    if (roll < 0.35) {
      const key = pickRng(FACING_OPEN_KEYS, rng);
      const parts = key.split('_');
      if (parts.length !== 3) return pickScenarioParams(rng, adminMode);
      return { spotType: 'facing_open', heroKey: parts[1], stackBb: parseInt(parts[2]), opponentKey: parts[0] };
    }
    if (roll < 0.50) {
      const key = pickRng(FACING_LIMP_KEYS, rng);
      const parts = key.split('_');
      if (parts.length !== 3) return pickScenarioParams(rng, adminMode);
      return { spotType: 'facing_limp', heroKey: parts[1], stackBb: parseInt(parts[2]), opponentKey: parts[0] };
    }
    if (roll < 0.60) {
      const key = pickRng(FACING_3BET_KEYS, rng);
      const parts = key.split('_');
      if (parts.length !== 3) return pickScenarioParams(rng, adminMode);
      return { spotType: 'facing_3bet', heroKey: parts[0], stackBb: parseInt(parts[2]), opponentKey: parts[1] };
    }
    return {
      spotType: 'unopened',
      heroKey: pickRng(OPENING_POSITIONS, rng),
      stackBb: pickRng(STACK_DEPTHS, rng),
      opponentKey: '',
    };
  }

  // Non-admin (production) dispatch: 47/53 facing_open/unopened. Limp and 3-bet
  // modules hidden until range/action/multi-limper bugs are resolved.
  if (roll < 0.47) {
    const key = pickRng(FACING_OPEN_KEYS, rng);
    const parts = key.split('_');
    if (parts.length !== 3) return pickScenarioParams(rng, adminMode);
    return { spotType: 'facing_open', heroKey: parts[1], stackBb: parseInt(parts[2]), opponentKey: parts[0] };
  }
  return {
    spotType: 'unopened',
    heroKey: pickRng(OPENING_POSITIONS, rng),
    stackBb: pickRng(STACK_DEPTHS, rng),
    opponentKey: '',
  };
}

// ─────────────────────────────────────────────
//  Post-generation validator
//  Runs on every finished PlayHandScenario.
//  Returns true if the scenario is safe to show.
// ─────────────────────────────────────────────

function validateScenario(s: PlayHandScenario): boolean {
  if (!s.handCode || s.cards.length !== 2) return false;

  // Cards must match hand code
  const r1 = s.handCode[0];
  const r2 = s.handCode.length >= 2 ? s.handCode[1] : r1;
  if (s.cards[0].rank !== r1 || s.cards[1].rank !== r2) {
    console.error(`[PokerTrainer] VALIDATE FAIL: cards ${s.cards[0].rank}${s.cards[1].rank} don't match handCode ${s.handCode}`);
    return false;
  }

  // Explanation must reference the hand code
  if (!s.tipRight.includes(s.handCode) || !s.tipWrong.includes(s.handCode)) {
    console.error(`[PokerTrainer] VALIDATE FAIL: explanation missing handCode "${s.handCode}". tipRight="${s.tipRight.slice(0, 80)}"`);
    return false;
  }

  // Correct index must be in range
  if (s.correct < 0 || s.correct >= s.choices.length) {
    console.error(`[PokerTrainer] VALIDATE FAIL: correct index ${s.correct} out of range for choices`, s.choices);
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────

/**
 * Generate 5 daily hands — deterministic for all users on the same date.
 *
 * Date is computed in Eastern Time (America/New_York) so that the "daily hand"
 * matches the day the user actually sees on their watch. Using UTC here caused
 * evening users to get tomorrow's hands (7 PM ET = next-day UTC).
 */
export function generateDailyHands(dateStr?: string, adminMode: boolean = false): PlayHandScenario[] {
  const today = dateStr ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const masterSeed = dateToSeed(today + '_pokertrain_v2');
  const rng = seededRng(masterSeed);

  const hands: PlayHandScenario[] = [];
  const usedKeys = new Set<string>();
  let attempts = 0;

  while (hands.length < 5 && attempts < 100) {
    attempts++;

    // Each hand gets its own sub-seed so picking a scenario doesn't bleed into the next
    const handRng = seededRng(masterSeed ^ (attempts * 0x9e3779b9));

    const params = pickScenarioParams(handRng, adminMode);
    const handCode = pickHand(handRng, params.spotType, params.heroKey, params.stackBb, params.opponentKey);
    const dedupeKey = `${handCode}_${params.heroKey}_${params.spotType}`;

    if (usedKeys.has(dedupeKey)) continue;

    const id = `daily_${today}_${attempts}`;
    const scenario = buildScenario(id, handCode, params.heroKey, params.stackBb, params.spotType, params.opponentKey);

    if (!validateScenario(scenario)) {
      console.error(`[PokerTrainer] Daily hand ${attempts} failed validation, skipping.`);
      continue;
    }

    usedKeys.add(dedupeKey);
    hands.push(scenario);
  }

  if (hands.length < 5) {
    console.error(`[PokerTrainer] Could only generate ${hands.length}/5 valid daily hands after ${attempts} attempts.`);
  }

  return hands;
}

/**
 * Generate a single random bonus hand.
 */
export function generateBonusHand(adminMode: boolean = false): PlayHandScenario {
  let attempts = 0;

  while (attempts < 20) {
    attempts++;
    const handRng = seededRng(Math.floor(Math.random() * 0xffffffff));
    const params = pickScenarioParams(handRng, adminMode);
    const handCode = pickHand(handRng, params.spotType, params.heroKey, params.stackBb, params.opponentKey);
    const id = `bonus_${Date.now()}_${attempts}`;
    const scenario = buildScenario(id, handCode, params.heroKey, params.stackBb, params.spotType, params.opponentKey);

    if (validateScenario(scenario)) return scenario;
    console.error(`[PokerTrainer] Bonus hand attempt ${attempts} failed validation, retrying.`);
  }

  // Absolute fallback — guaranteed valid
  const fallback = buildScenario('bonus_fallback', 'AKs', 'btn', 25, 'unopened', '');
  return fallback;
}

/**
 * Generate a batch of bonus hands.
 */
export function generateBonusHands(count: number, adminMode: boolean = false): PlayHandScenario[] {
  const hands: PlayHandScenario[] = [];
  const usedKeys = new Set<string>();
  let attempts = 0;

  while (hands.length < count && attempts < count * 10) {
    attempts++;
    const scenario = generateBonusHand(adminMode);
    const key = `${scenario.handCode}_${scenario.position}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    hands.push(scenario);
  }

  return hands;
}
