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

// Helper to describe the action between opener and hero
function facingOpenContext(heroPos: Position, openerPos: Position): string {
  const seatOrder = [Position.UTG, Position.UTG1, Position.MP, Position.LJ, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB];
  const openerIdx = seatOrder.indexOf(openerPos);
  const heroIdx = seatOrder.indexOf(heroPos);
  const gap = heroIdx - openerIdx;

  if (gap === 1) return `${posLabel(openerPos)} raised and the action is on you in the ${posLabel(heroPos)}`;
  if (gap === 2) return `${posLabel(openerPos)} raised, one player folded, and the action is on you in the ${posLabel(heroPos)}`;
  if (gap > 2) return `${posLabel(openerPos)} raised, everyone between you folded, and the action is on you in the ${posLabel(heroPos)}`;
  return `${posLabel(openerPos)} raised and the action is on you in the ${posLabel(heroPos)}`;
}

export function explainJamVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  const ctx = facingOpenContext(heroPos, openerPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Going all-in is the best play. ${hand} is strong enough to stand up against ${posLabel(openerPos)}'s opening range, and at ${stackBb}bb you get maximum value from fold equity.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a 3-bet jam. The stack-to-pot ratio makes flatting awkward. ${hand} has strong equity against the ${posLabel(openerPos)} opening range and jamming maximizes fold equity.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: 3-bet jam with premium hands and strong suited aces. ${hand} falls into this category. Do not flat call with short stacks when you can leverage fold equity.`,
  };
}

export function explainCallVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  const hasPosition = heroPos === Position.BTN || heroPos === Position.CO;
  const ctx = facingOpenContext(heroPos, openerPos);

  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Calling is the best play. ${hasPosition ? 'You have position, so you get to act last on every street after the flop.' : 'You are getting a good price to see a flop.'} ${hand} has good playability and implied odds.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a call. ${hasPosition ? 'Positional advantage makes flatting profitable.' : 'The pot odds justify defending.'} ${hand} has good equity and playability against the opener's range but is not strong enough to 3-bet jam.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: call with hands that have good playability but are not premium. ${hand} fits this category. Save your 3-bet jams for stronger holdings.`,
  };
}

export function explainFoldVsOpen(hand: string, heroPos: Position, openerPos: Position, stackBb: number): Explanation {
  const ctx = facingOpenContext(heroPos, openerPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Folding is the disciplined play. ${hand} might look decent, but against ${posLabel(openerPos)}'s raising range it is likely dominated. Getting involved with a weak hand against a raiser is a common way to leak chips.`,
    poker: `${hand} in the ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(openerPos)} open is a fold. The hand does not have sufficient equity against the opener's range to justify calling or 3-betting. Continuing here is a long-term chip burner.`,
    pattern: `Facing a ${posLabel(openerPos)} open at ${stackBb}bb from ${posLabel(heroPos)}: fold hands like ${hand} that are dominated by the raiser's range. Discipline in these spots preserves chips for more profitable situations.`,
  };
}

// ======= FACING LIMP EXPLANATIONS =======

function facingLimpContext(heroPos: Position, limperPos: Position): string {
  const seatOrder = [Position.UTG, Position.UTG1, Position.MP, Position.LJ, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB];
  const limperIdx = seatOrder.indexOf(limperPos);
  const heroIdx = seatOrder.indexOf(heroPos);
  const gap = heroIdx - limperIdx;

  if (gap === 1) return `${posLabel(limperPos)} limped and the action is on you in the ${posLabel(heroPos)}`;
  if (gap === 2) return `${posLabel(limperPos)} limped, one player folded, and the action is on you in the ${posLabel(heroPos)}`;
  if (gap > 2) return `${posLabel(limperPos)} limped, everyone between you folded, and the action is on you in the ${posLabel(heroPos)}`;
  return `${posLabel(limperPos)} limped and the action is on you in the ${posLabel(heroPos)}`;
}

export function explainIsolateLimper(hand: string, heroPos: Position, limperPos: Position, stackBb: number): Explanation {
  const ctx = facingLimpContext(heroPos, limperPos);
  const hasPosition = [Position.BTN, Position.CO].includes(heroPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Raising to isolate is the best play. Limpers usually have weak hands — by raising, you take the initiative and often win the pot right there. ${hasPosition ? 'You also have position, which gives you a big edge after the flop.' : 'Even without position, your hand is strong enough to punish the limp.'}`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(limperPos)} limp is an isolation raise. Limpers have capped, wide ranges. Raising to 3-4x isolates you heads-up against a weak range${hasPosition ? ' with positional advantage' : ''}.`,
    pattern: `Facing a ${posLabel(limperPos)} limp at ${stackBb}bb from ${posLabel(heroPos)}: raise to isolate with strong hands like ${hand}. The key principle is that limpers are weak — punish them with a raise, do not limp behind.`,
  };
}

export function explainLimpBehind(hand: string, heroPos: Position, limperPos: Position, stackBb: number): Explanation {
  const ctx = facingLimpContext(heroPos, limperPos);
  const suited = hand.endsWith('s');
  const isPair = hand.length === 2 || (hand.length === 3 && hand[0] === hand[1]);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Limping behind is the best play here. ${isPair ? 'Small pairs play best by seeing a cheap flop and hoping to hit a set.' : suited ? 'This suited hand can make flushes and straights cheaply.' : 'This hand has some potential but is not strong enough to raise.'} Save your raises for hands that can win the pot before the flop.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(limperPos)} limp is a limp behind. ${isPair ? 'Set-mining at this stack depth offers good implied odds.' : 'The hand has speculative value but not enough equity to isolate.'} Overlimping keeps the pot small with a hand that plays better multiway.`,
    pattern: `Facing a ${posLabel(limperPos)} limp at ${stackBb}bb from ${posLabel(heroPos)}: limp behind with speculative hands like ${hand}. ${isPair ? 'Small pairs want cheap flops to hit sets.' : 'Suited connectors and suited gappers want multiway pots for implied odds.'}`,
  };
}

export function explainJamVsLimp(hand: string, heroPos: Position, limperPos: Position, stackBb: number): Explanation {
  const ctx = facingLimpContext(heroPos, limperPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Going all-in is the best play. At this stack depth, a normal raise commits too many chips — if you are going to play, you should shove. ${hand} is strong enough against a limper's weak range, and your fold equity is maximized by jamming.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(limperPos)} limp is a jam. The stack-to-pot ratio makes raising awkward. Jamming maximizes fold equity against the limper's weak, capped range.`,
    pattern: `Facing a ${posLabel(limperPos)} limp at ${stackBb}bb from ${posLabel(heroPos)}: jam with hands like ${hand} that are worth playing. At short stacks, do not make small raises over limpers — commit fully or fold.`,
  };
}

export function explainFoldVsLimp(hand: string, heroPos: Position, limperPos: Position, stackBb: number): Explanation {
  const ctx = facingLimpContext(heroPos, limperPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Folding is the right play. Just because someone limped does not mean you should enter the pot with a weak hand. ${hand} does not have enough strength or potential to justify getting involved, even against a limper.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(limperPos)} limp is a fold. Despite the limper showing weakness, this hand has insufficient equity and playability. Entering the pot here is a long-term chip leak.`,
    pattern: `Facing a ${posLabel(limperPos)} limp at ${stackBb}bb from ${posLabel(heroPos)}: fold weak hands like ${hand}. A limp ahead does not change the fact that junk hands lose money over time.`,
  };
}

// ======= FACING 3-BET EXPLANATIONS =======

function facing3BetContext(heroPos: Position, threeBettorPos: Position): string {
  return `You opened from ${posLabel(heroPos)} and ${posLabel(threeBettorPos)} 3-bet jammed`;
}

export function explainCallVs3Bet(hand: string, heroPos: Position, threeBettorPos: Position, stackBb: number): Explanation {
  const ctx = facing3BetContext(heroPos, threeBettorPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Calling is the correct play. ${hand} is at the top of your opening range and has enough equity against ${posLabel(threeBettorPos)}'s 3-bet range to call profitably. Do not let the pressure of a re-raise push you off a strong hand.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(threeBettorPos)} 3-bet is a call. The hand has sufficient equity against the 3-bettor's range. At this stack depth, calling is preferred over 4-bet jamming.`,
    pattern: `Facing a ${posLabel(threeBettorPos)} 3-bet at ${stackBb}bb from ${posLabel(heroPos)}: call with premium hands like ${hand}. You opened strong, they re-raised, but your hand is good enough to continue. Most of your range folds here — ${hand} is one of the exceptions.`,
  };
}

export function explainFoldVs3Bet(hand: string, heroPos: Position, threeBettorPos: Position, stackBb: number): Explanation {
  const ctx = facing3BetContext(heroPos, threeBettorPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Folding is the disciplined play. Yes, you opened with this hand, but a 3-bet represents serious strength. ${hand} does not have enough equity to call off your stack. Folding here is not weak — it is smart chip preservation.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(threeBettorPos)} 3-bet is a fold. The hand was good enough to open but not good enough to continue against a re-raise. Calling off here is a common and expensive leak.`,
    pattern: `Facing a ${posLabel(threeBettorPos)} 3-bet at ${stackBb}bb from ${posLabel(heroPos)}: fold hands like ${hand}. The most common mistake is calling 3-bets too wide because you already invested chips. Most of your opening range should fold to a 3-bet — that is correct strategy.`,
  };
}

export function explain4BetJam(hand: string, heroPos: Position, threeBettorPos: Position, stackBb: number): Explanation {
  const ctx = facing3BetContext(heroPos, threeBettorPos);
  return {
    plain: `${ctx} with ${hand} at ${stackBb}bb. Re-jamming all-in is the best play. ${hand} is a premium hand that dominates much of ${posLabel(threeBettorPos)}'s 3-bet range. By 4-bet jamming, you maximize value and put maximum pressure on the 3-bettor.`,
    poker: `${hand} from ${posLabel(heroPos)} at ${stackBb}bb facing a ${posLabel(threeBettorPos)} 3-bet is a 4-bet jam. At this stack depth, flatting a 3-bet with a premium is suboptimal. Jamming leverages fold equity against the 3-bettor's bluffs while getting value from their value range.`,
    pattern: `Facing a ${posLabel(threeBettorPos)} 3-bet at ${stackBb}bb from ${posLabel(heroPos)}: 4-bet jam with super-premium hands like ${hand}. This puts maximum pressure on the opponent and prevents them from realizing equity postflop.`,
  };
}
