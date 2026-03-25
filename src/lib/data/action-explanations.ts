/**
 * Tier 1 & 2: Range-level "Why?" explanations for dynamically generated drill spots.
 *
 * Instead of writing 7,000+ individual explanations, we define explanations at the
 * range-boundary level: position × stack-depth-band × hand-category × action.
 *
 * The stitching function `getActionExplanation()` takes a generated spot and the
 * user's chosen action, matches it to the appropriate range-level explanation,
 * and returns a targeted "why" string.
 */

import { Position, SimplifiedAction, SpotType } from '@/lib/types';
import type { ActionExplanations, SpotDecision, SpotTemplate } from '@/lib/types';
import type { HandCombo } from '@/lib/data/range-tables';
import { ALL_HANDS, handStrength } from '@/lib/data/range-tables';

// ======= HAND CATEGORIZATION =======

export type HandCategory =
  | 'premium_pair'     // AA, KK, QQ, JJ
  | 'mid_pair'         // TT, 99, 88, 77
  | 'small_pair'       // 66-22
  | 'big_broadway_s'   // AKs, AQs, AJs, KQs
  | 'big_broadway_o'   // AKo, AQo, AJo, KQo
  | 'med_broadway_s'   // ATs, KJs, KTs, QJs, QTs, JTs
  | 'med_broadway_o'   // ATo, KJo, KTo, QJo, QTo, JTo
  | 'suited_ace'       // A9s-A2s
  | 'offsuit_ace'      // A9o-A2o
  | 'suited_connector' // T9s, 98s, 87s, 76s, 65s, 54s etc.
  | 'suited_king'      // K9s-K2s
  | 'offsuit_king'     // K9o-K2o
  | 'suited_gapper'    // Q9s, J9s, T8s, etc. (one-gappers and wider)
  | 'junk';            // everything else

const RANK_VAL: Record<string, number> = {
  'A':14,'K':13,'Q':12,'J':11,'T':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2
};

export function categorizeHand(handCode: string): HandCategory {
  const r1 = handCode[0];
  const r2 = handCode[1];
  const suited = handCode.endsWith('s');
  const isPair = r1 === r2;
  const v1 = RANK_VAL[r1];
  const v2 = RANK_VAL[r2] ?? RANK_VAL[r1]; // pairs

  if (isPair) {
    if (v1 >= 11) return 'premium_pair';
    if (v1 >= 7) return 'mid_pair';
    return 'small_pair';
  }

  // Broadway = both cards T+
  const bothBroadway = v1 >= 10 && v2 >= 10;
  // Big broadway = both cards J+ or ATs+/KTs+
  const bigBroadway = v1 >= 14 && v2 >= 11 || (v1 === 13 && v2 === 12);

  if (bigBroadway) return suited ? 'big_broadway_s' : 'big_broadway_o';
  if (bothBroadway) return suited ? 'med_broadway_s' : 'med_broadway_o';

  if (r1 === 'A') return suited ? 'suited_ace' : 'offsuit_ace';
  if (r1 === 'K') return suited ? 'suited_king' : 'offsuit_king';

  // Suited connectors: gap of 1 or 0 between ranks
  if (suited && v1 - v2 <= 2 && v2 >= 4) return 'suited_connector';
  if (suited && v1 >= 10) return 'suited_gapper';

  return 'junk';
}

// ======= STACK DEPTH BANDS =======

type StackBand = 'push_fold' | 'jam_or_fold' | 'raise_or_jam' | 'deep';

function getStackBand(stackBb: number): StackBand {
  if (stackBb <= 12) return 'push_fold';
  if (stackBb <= 15) return 'jam_or_fold';
  if (stackBb <= 20) return 'raise_or_jam';
  return 'deep';
}

// ======= POSITION BANDS =======

type PositionBand = 'early' | 'middle' | 'late' | 'blinds';

function getPositionBand(pos: Position): PositionBand {
  if ([Position.UTG, Position.UTG1, Position.MP].includes(pos)) return 'early';
  if ([Position.LJ, Position.HJ].includes(pos)) return 'middle';
  if ([Position.CO, Position.BTN].includes(pos)) return 'late';
  return 'blinds';
}

// ======= RANGE-LEVEL EXPLANATION TEMPLATES =======
// Each returns 4 strings keyed by universal button action

interface ExplanationContext {
  hand: string;
  position: Position;
  posLabel: string;
  stackBb: number;
  stackBand: StackBand;
  posBand: PositionBand;
  handCat: HandCategory;
  correctAction: SimplifiedAction;
  spotType: SpotType;
  // Facing open specific
  openerPos?: Position;
  openerLabel?: string;
}

// ── UNOPENED POT: Correct = FOLD ──

function unopenedFoldExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb, posBand, handCat, stackBand } = ctx;

  const foldReason = posBand === 'early'
    ? `From ${posLabel} you have too many players behind who could wake up with a dominating hand. ${hand} does not have the strength to justify opening from this position.`
    : stackBand === 'push_fold'
      ? `At ${stackBb}bb, ${hand} is below the jamming threshold from ${posLabel}. While push/fold requires aggression, there are limits — this hand does not have enough equity against calling ranges.`
      : `${hand} from ${posLabel} at ${stackBb}bb is just below the opening threshold. The risk of getting 3-bet or playing a bad postflop spot is not worth the marginal steal equity.`;

  const raiseReason = posBand === 'early'
    ? `Raising ${hand} from ${posLabel} is a leak. If you get 3-bet, you have to fold and waste chips. If you get called, you are out of position with a hand dominated by most continuing ranges. The bottom of the ${posLabel} opening range is significantly stronger than ${hand}.`
    : `Raising ${hand} from ${posLabel} at ${stackBb}bb is marginal at best. The hand is at the bottom of what could be defended, and the risk/reward does not favor opening. ${stackBb <= 15 ? 'At this stack depth, raising and folding to a 3-bet bleeds too many chips.' : 'Save your opens for hands with better playability.'}`;

  const callReason = ctx.spotType === SpotType.SB_UNOPENED
    ? `Completing the small blind with ${hand} at ${stackBb}bb gives the big blind a free look with position on you. ${stackBb <= 15 ? 'At this stack depth, push or fold — no limping.' : 'You play the worst position at the table in a pot with no initiative.'}`
    : `There is nothing to call — the pot is unopened. Limping with ${hand} ${stackBb <= 15 ? 'at this stack depth is a fundamental error. You surrender all fold equity.' : 'invites multiway action with a hand that plays poorly against multiple opponents.'}`;

  const jamReason = stackBand === 'push_fold'
    ? `${hand} is below the push/fold threshold from ${posLabel} at ${stackBb}bb. Even in push/fold mode, you need a hand with enough equity against calling ranges. This one does not clear the bar.`
    : `Shoving ${stackBb}bb with ${hand} from ${posLabel} is too loose. ${stackBb >= 20 ? 'At this stack depth you have room to play normal poker — jamming a weak hand risks your tournament life unnecessarily.' : 'The hands that call an all-in from this position all have you dominated.'}`;

  return { [SimplifiedAction.FOLD]: `Correct. ${foldReason}`, [SimplifiedAction.OPEN]: raiseReason, [SimplifiedAction.CALL]: callReason, [SimplifiedAction.JAM]: jamReason };
}

// ── UNOPENED POT: Correct = OPEN ──

function unopenedOpenExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb, posBand, handCat, stackBand } = ctx;

  const openReason = posBand === 'late'
    ? `${hand} from ${posLabel} at ${stackBb}bb is a standard steal. You have few players behind you, and this hand has enough strength and playability to profit from the fold equity alone.`
    : `${hand} is strong enough to open from ${posLabel} at ${stackBb}bb. ${stackBb >= 25 ? 'At this stack depth you can raise and comfortably navigate postflop decisions.' : 'Raise and be prepared to make a decision if someone 3-bets.'}`;

  const foldReason = posBand === 'late'
    ? `Folding ${hand} from ${posLabel} at ${stackBb}bb is too tight. Late position is a stealing seat — you have only ${ctx.position === Position.BTN ? 'two' : 'three'} players behind you. Folding playable hands here gives up free equity.`
    : `Folding ${hand} from ${posLabel} at ${stackBb}bb is too nitty. This hand clears the opening threshold for this position. If you only open premium hands, you miss profitable spots and your stack bleeds from blinds and antes.`;

  const callReason = ctx.spotType === SpotType.SB_UNOPENED
    ? `Completing the small blind with ${hand} at ${stackBb}bb wastes a strong hand. You have a raising hand — use it. Limping forfeits your fold equity and gives the BB a free flop with position.`
    : `There is nothing to call — the pot is unopened. Limping with a hand this strong gives up your fold equity and initiative. Raise to take control of the pot.`;

  const jamReason = stackBand === 'deep'
    ? `Jamming ${stackBb}bb with ${hand} is overkill. At this stack depth, a standard raise accomplishes the same goal while risking far less. Save the all-in for situations where you cannot afford to raise/fold.`
    : stackBand === 'raise_or_jam'
      ? `Jamming is an option but suboptimal. At ${stackBb}bb, a standard raise gives you more flexibility. You can fold to a 3-bet with some hands, or 4-bet jam with others. The raise preserves your options.`
      : `Jamming ${hand} at ${stackBb}bb is a valid alternative — at this stack depth, raise/fold is inefficient. But a standard open may still be slightly better if the hand is strong enough to call a jam.`;

  return { [SimplifiedAction.OPEN]: `Correct. ${openReason}`, [SimplifiedAction.FOLD]: foldReason, [SimplifiedAction.CALL]: callReason, [SimplifiedAction.JAM]: jamReason };
}

// ── UNOPENED POT: Correct = JAM ──

function unopenedJamExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb, posBand, stackBand } = ctx;

  const jamReason = stackBand === 'push_fold'
    ? `At ${stackBb}bb, push/fold is the correct strategy. ${hand} from ${posLabel} has enough equity against calling ranges to make the shove profitable. The fold equity from the remaining players makes this clearly positive.`
    : `At ${stackBb}bb, ${hand} is strong enough to play but not strong enough to raise and comfortably fold to a re-raise. Jamming maximizes your fold equity and avoids the raise-fold trap that bleeds chips.`;

  const raiseReason = stackBand === 'push_fold'
    ? `At ${stackBb}bb there is no room for a standard raise. A 2.2x open commits over 20% of your stack, and you cannot fold to a jam behind you. At this depth, simplify: push or fold.`
    : `Raising to 2.2x with ${hand} at ${stackBb}bb creates the raise-fold problem. You invest 2.2bb (${Math.round(2.2/stackBb*100)}% of your stack), someone jams, and you have to make a tough decision. ${hand} is not strong enough to call a jam comfortably but too strong to fold. Avoid this trap — jam instead.`;

  const foldReason = `Folding ${hand} from ${posLabel} at ${stackBb}bb is too passive. ${stackBand === 'push_fold' ? 'At this stack depth, you cannot afford to wait for premium hands — the blinds will consume your stack.' : 'This hand is well within the profitable jamming range from this position.'} Every orbit you wait costs 1.5bb in blinds.`;

  const callReason = ctx.spotType === SpotType.SB_UNOPENED
    ? `Completing the SB with ${hand} at ${stackBb}bb is a classic mistake. It gives the BB a free look with position on you. You have a jamming hand — use the fold equity. Push or fold from the SB at this depth.`
    : `There is nothing to call — the pot is unopened. Limping at ${stackBb}bb surrenders all fold equity and invites opponents to see a free flop. ${stackBb <= 12 ? 'At this stack depth, every chip matters. Push or fold.' : 'At this depth, jam or fold. There is no limp.'}`;

  return { [SimplifiedAction.JAM]: `Correct. ${jamReason}`, [SimplifiedAction.OPEN]: raiseReason, [SimplifiedAction.FOLD]: foldReason, [SimplifiedAction.CALL]: callReason };
}

// ── FACING OPEN: Correct = JAM ──

function facingOpenJamExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb, stackBand } = ctx;
  const opener = ctx.openerLabel ?? 'the opener';

  const jamReason = `${hand} from ${posLabel} at ${stackBb}bb facing a ${opener} open is a clear 3-bet jam. The hand has strong equity against ${opener}'s opening range, and at this stack depth flatting creates awkward postflop spots. Jamming maximizes fold equity and simplifies your decision.`;

  const callReason = stackBb >= 25
    ? `Calling is acceptable but suboptimal. At ${stackBb}bb, flatting with ${hand} creates postflop stack-to-pot ratio challenges. You end up in a bloated pot with a stack that is too short to maneuver. Jamming resolves the hand preflop.`
    : `Calling ${opener}'s open with ${hand} at ${stackBb}bb is a stack-depth mistake. At this depth, flatting commits too much of your stack without resolving the hand. You will face tough decisions on every street. Jam and let fold equity work for you.`;

  const foldReason = `Folding ${hand} from ${posLabel} at ${stackBb}bb facing a ${opener} open is too tight. This hand has strong equity against ${opener}'s range and is well within the 3-bet jamming threshold. Passing this up means you are missing profitable spots.`;

  const raiseReason = stackBb <= 25
    ? `A small 3-bet at ${stackBb}bb does not work. If ${opener} 4-bets, you are committed anyway. Since you are getting it in regardless, jam from the start to maximize fold equity.`
    : `A small 3-bet with ${hand} at ${stackBb}bb is awkward. It commits a large portion of your stack and if ${opener} 4-bets, you have a difficult decision. At this depth, either jam or call — skip the small 3-bet.`;

  return { [SimplifiedAction.JAM]: `Correct. ${jamReason}`, [SimplifiedAction.CALL]: callReason, [SimplifiedAction.FOLD]: foldReason, [SimplifiedAction.OPEN]: raiseReason };
}

// ── FACING OPEN: Correct = CALL ──

function facingOpenCallExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb } = ctx;
  const opener = ctx.openerLabel ?? 'the opener';
  const hasPosition = [Position.CO, Position.BTN].includes(ctx.position);

  const callReason = hasPosition
    ? `${hand} from ${posLabel} at ${stackBb}bb facing a ${opener} open is a call. You have position, so you act last on every street. The hand has good playability and implied odds. Save your 3-bet jams for stronger holdings.`
    : ctx.position === Position.BB
      ? `${hand} in the BB at ${stackBb}bb is a standard defend. You already have 1bb invested, you close the action, and ${hand} has good playability. The pot odds make this a clear call.`
      : `Calling ${opener}'s open with ${hand} from ${posLabel} at ${stackBb}bb is correct. The hand has enough equity and playability to see a flop profitably.`;

  const foldReason = `Folding ${hand} from ${posLabel} at ${stackBb}bb facing a ${opener} open is too tight. ${hasPosition ? 'You have position and the hand plays well postflop.' : ctx.position === Position.BB ? 'You are getting excellent pot odds from the big blind.' : 'The hand has enough equity to defend.'} Folding here means your defending range is too narrow.`;

  const jamReason = `Jamming ${stackBb}bb with ${hand} over ${opener}'s open is too aggressive. ${hand} is a playable hand, not a premium. The hands that call your jam have you in bad shape. Calling lets you see a flop and play poker with a hand that has good implied odds.`;

  const raiseReason = `A small 3-bet with ${hand} at ${stackBb}bb is risky. If ${opener} 4-bets, you have to fold — ${hand} is not strong enough to call. Calling gives you better pot odds and a simpler decision tree.`;

  return { [SimplifiedAction.CALL]: `Correct. ${callReason}`, [SimplifiedAction.FOLD]: foldReason, [SimplifiedAction.JAM]: jamReason, [SimplifiedAction.OPEN]: raiseReason };
}

// ── FACING OPEN: Correct = FOLD ──

function facingOpenFoldExplanations(ctx: ExplanationContext): ActionExplanations {
  const { hand, posLabel, stackBb } = ctx;
  const opener = ctx.openerLabel ?? 'the opener';

  const foldReason = `${hand} from ${posLabel} at ${stackBb}bb facing a ${opener} open is a fold. The hand does not have sufficient equity against ${opener}'s range to justify continuing. Getting involved here with a weak holding is a common way to slowly bleed chips.`;

  const callReason = `Calling ${opener}'s open with ${hand} from ${posLabel} at ${stackBb}bb is a trap. The hand is likely dominated by ${opener}'s range — you will make second-best pairs that cost you chips. Discipline in these spots preserves your stack for better opportunities.`;

  const jamReason = `Jamming ${stackBb}bb with ${hand} over ${opener}'s open is a big overplay. The hands that call have you crushed. You are risking a significant portion of your stack with a hand that does not have the equity to support it.`;

  const raiseReason = `A 3-bet with ${hand} at ${stackBb}bb accomplishes nothing positive. You commit chips with a weak hand, and ${opener} either folds (which you could have done for free) or calls/4-bets with a hand that dominates you. Fold and wait for a better spot.`;

  return { [SimplifiedAction.FOLD]: `Correct. ${foldReason}`, [SimplifiedAction.CALL]: callReason, [SimplifiedAction.JAM]: jamReason, [SimplifiedAction.OPEN]: raiseReason };
}

// ======= MAIN STITCHING FUNCTION =======

/**
 * Generate per-action explanations for a dynamically generated spot.
 * This is the Tier 2 "stitching" layer that connects generated hands
 * to range-level explanation templates.
 */
export function generateActionExplanations(
  spot: SpotDecision,
  template: SpotTemplate,
): ActionExplanations {
  // If the spot already has bespoke actionExplanations (e.g. assessment spots), use them
  if (spot.actionExplanations) return spot.actionExplanations;

  const posLabel = template.position.toUpperCase();
  const handCat = categorizeHand(spot.handCode);
  const stackBand = getStackBand(template.stackDepthBb);
  const posBand = getPositionBand(template.position);

  // Parse opener position from action history for facing-open spots
  let openerPos: Position | undefined;
  let openerLabel: string | undefined;
  if (template.spotType === SpotType.FACING_OPEN) {
    const match = template.actionHistory.match(/^([a-z0-9+]+)_opens/);
    if (match) {
      const posMap: Record<string, Position> = {
        utg: Position.UTG, 'utg+1': Position.UTG1, mp: Position.MP,
        lj: Position.LJ, hj: Position.HJ, co: Position.CO,
        btn: Position.BTN, sb: Position.SB, bb: Position.BB,
      };
      openerPos = posMap[match[1]];
      openerLabel = match[1].toUpperCase();
    }
  }

  const ctx: ExplanationContext = {
    hand: spot.handCode,
    position: template.position,
    posLabel,
    stackBb: template.stackDepthBb,
    stackBand,
    posBand,
    handCat,
    correctAction: spot.baselineAction,
    spotType: template.spotType,
    openerPos,
    openerLabel,
  };

  // Route to the correct template based on spot type and correct action
  const isFacingOpen = template.spotType === SpotType.FACING_OPEN;

  if (isFacingOpen) {
    switch (spot.baselineAction) {
      case SimplifiedAction.JAM: return facingOpenJamExplanations(ctx);
      case SimplifiedAction.CALL: return facingOpenCallExplanations(ctx);
      case SimplifiedAction.FOLD: return facingOpenFoldExplanations(ctx);
      default: return facingOpenFoldExplanations(ctx);
    }
  } else {
    // Unopened or SB unopened
    switch (spot.baselineAction) {
      case SimplifiedAction.OPEN: return unopenedOpenExplanations(ctx);
      case SimplifiedAction.JAM: return unopenedJamExplanations(ctx);
      case SimplifiedAction.FOLD: return unopenedFoldExplanations(ctx);
      default: return unopenedFoldExplanations(ctx);
    }
  }
}

/**
 * Get the explanation for a specific user action on a spot.
 * Returns the targeted "why" string for that action, or a fallback
 * to the existing plain explanation if no match is found.
 */
export function getActionExplanation(
  spot: SpotDecision,
  template: SpotTemplate,
  userAction: SimplifiedAction,
): string {
  const explanations = generateActionExplanations(spot, template);

  // Map universal buttons to lookup keys
  // The user clicks OPEN (Raise), CALL, FOLD, or JAM
  const key = userAction;
  if (explanations[key]) return explanations[key];

  // Fallback to existing plain explanation
  return spot.explanation.plain;
}
