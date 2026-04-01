// Dynamic explanation templates for generated spots
// Each template function takes scenario parameters and returns plain/poker/pattern explanations

import { Position, SimplifiedAction, POSITION_LABELS, POSITION_FULL_NAMES } from '@/lib/types';
import type { Explanation } from '@/lib/types';

const posLabel = (p: Position) => POSITION_LABELS[p];

// ======= UNOPENED POT EXPLANATIONS =======

export function explainOpen(hand: string, pos: Position, stackBb: number): Explanation {
  const isLate = [Position.CO, Position.BTN].includes(pos);
  const isEarly = [Position.UTG, Position.UTG1].includes(pos);
  const suited = hand.endsWith('s');

  const situationPhrase = isEarly
    ? `You're first to act with ${hand} at ${stackBb}bb`
    : `It folds to you with ${hand} at ${stackBb}bb`;

  return {
    plain: isLate
      ? `${situationPhrase} in late position. This is a standard raising hand. You only have ${pos === Position.BTN ? 'two' : 'three'} players behind you and ${suited ? 'the hand has good potential if called' : 'the hand is strong enough to take down the blinds'}.`
      : `${situationPhrase}. This hand is strong enough to open from ${posLabel(pos)}. ${stackBb >= 25 ? 'At this stack depth you can raise and comfortably play postflop.' : 'Raise and be prepared to make a decision if someone re-raises.'}`,
    poker: `${hand} from ${posLabel(pos)} at ${stackBb}bb is a standard open. ${isLate ? 'Late position allows wider opening ranges due to fewer players to act behind.' : 'This hand has sufficient equity and playability to justify an open from this position.'}`,
    pattern: `From ${posLabel(pos)} at ${stackBb}bb: ${hand} is an open. ${isLate ? 'In late position, raise with a wide range of broadways, suited connectors, and any ace.' : 'From earlier positions, stick to hands that play well against 3-bets and in multiway pots.'}`,
  };
}

export function explainFoldUnopened(hand: string, pos: Position, stackBb: number): Explanation {
  const isEarly = [Position.UTG, Position.UTG1, Position.MP].includes(pos);

  return {
    plain: isEarly
      ? `${hand} might look playable, but from ${posLabel(pos)} you have too many players left to act behind you. If you raise and get re-raised, you will likely have to fold and waste chips.`
      : `${hand} at ${stackBb}bb from ${posLabel(pos)} is just below the threshold for opening. The risk of getting into a bad spot postflop or facing a re-raise is not worth the potential reward.`,
    poker: `${hand} from ${posLabel(pos)} at ${stackBb}bb is a fold. ${isEarly ? 'Early position ranges need to be tight because multiple players can wake up with premium holdings.' : 'This hand is too marginal at this stack depth and does not have sufficient equity against likely calling/3-betting ranges.'}`,
    pattern: `From ${posLabel(pos)} at ${stackBb}bb: fold hands like ${hand}. ${isEarly ? 'Tighten up in early position. Save chips for spots where you have position or a stronger hand.' : 'At this stack depth, borderline hands become unprofitable. Wait for a cleaner spot.'}`,
  };
}

export function explainJamUnopened(hand: string, pos: Position, stackBb: number): Explanation {
  const isBlind = [Position.SB, Position.BB].includes(pos);

  return {
    plain: stackBb <= 12
      ? `At ${stackBb}bb with ${hand}, your only real options are all-in or fold. ${hand} is strong enough to shove. ${isBlind ? 'From the blinds, you only need to get through one player.' : 'Making a small raise at this stack depth wastes chips if you have to fold to a re-raise.'}`
      : `At ${stackBb}bb, ${hand} is strong enough to play but not strong enough to raise and then fold to a re-raise. Going all-in maximizes your fold equity and avoids the raise-fold trap.`,
    poker: `${hand} from ${posLabel(pos)} at ${stackBb}bb is a jam. ${stackBb <= 12 ? 'At this stack depth, push/fold is the correct strategy.' : 'The raise/fold line costs too much relative to your stack. Jamming leverages maximum fold equity.'} ${hand} has sufficient equity against calling ranges.`,
    pattern: `At ${stackBb}bb from ${posLabel(pos)}: jam with ${hand}. ${stackBb <= 12 ? 'Below 12bb, simplify your strategy to push or fold.' : 'At 13-15bb, jam hands that are worth playing but cannot profitably raise/fold.'} The key is maximizing fold equity.`,
  };
}

// ======= FACING OPEN EXPLANATIONS =======

export function explainJamVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  return {
    plain: `${posLabel(openerPos)} raised and everyone folded to you in the ${posLabel(heroPos)} with ${hand} at ${stackBb}bb. Going all-in is the best play. ${hand} is strong enough to stand up against ${posLabel(openerPos)}'s opening range, and at ${stackBb}bb you get maximum value from fold equity.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a 3-bet jam. The stack-to-pot ratio makes flatting awkward. ${hand} has strong equity against the ${posLabel(openerPos)} opening range and jamming maximizes fold equity.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: 3-bet jam with premium hands and strong suited aces. ${hand} falls into this category. Do not flat call with short stacks when you can leverage fold equity.`,
  };
}

export function explainCallVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  const hasPosition = heroPos === Position.BTN || heroPos === Position.CO;

  return {
    plain: `${posLabel(openerPos)} raised and everyone folded to you in the ${posLabel(heroPos)} with ${hand} at ${stackBb}bb. Calling is the best play. ${hasPosition ? 'You have position, so you get to act last on every street after the flop.' : 'You are getting a good price to see a flop.'} ${hand} has good playability and implied odds.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a call. ${hasPosition ? 'Positional advantage makes flatting profitable.' : 'The pot odds justify defending.'} ${hand} has good equity and playability against the opener's range but is not strong enough to 3-bet jam.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: call with hands that have good playability but are not premium. ${hand} fits this category. Save your 3-bet jams for stronger holdings.`,
  };
}

export function explainFoldVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  return {
    plain: `${posLabel(openerPos)} raised and everyone folded to you in the ${posLabel(heroPos)} with ${hand} at ${stackBb}bb. Folding is the disciplined play. ${hand} might look decent, but against ${posLabel(openerPos)}'s raising range it is likely dominated. Getting involved with a weak hand against a raiser is a common way to leak chips.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a fold. The hand does not have sufficient equity against the opener's range to justify calling or 3-betting. Continuing here is a long-term chip burner.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: fold hands like ${hand} that are dominated by the raiser's range. Discipline in these spots preserves chips for more profitable situations.`,
  };
}
