import {
  Position,
  SimplifiedAction,
  SpotType,
  DifficultyBand,
  LeakCategoryId,
  SpotDecision,
  SpotTemplate,
  LeakCategory,
  Module,
} from '@/lib/types';

// Spot templates - includes original 12 + 8 new facing-open templates

const templates: SpotTemplate[] = [
  // Original unopened spots
  { id: 'tpl_01', stackDepthBb: 30, position: Position.UTG, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_02', stackDepthBb: 20, position: Position.BTN, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_03', stackDepthBb: 25, position: Position.CO, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_04', stackDepthBb: 20, position: Position.CO, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_05', stackDepthBb: 20, position: Position.HJ, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_06', stackDepthBb: 15, position: Position.CO, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_07', stackDepthBb: 15, position: Position.HJ, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_08', stackDepthBb: 10, position: Position.BTN, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_09', stackDepthBb: 10, position: Position.CO, spotType: SpotType.UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_10', stackDepthBb: 15, position: Position.SB, spotType: SpotType.SB_UNOPENED, actionHistory: 'folded_to_hero' },
  { id: 'tpl_11', stackDepthBb: 25, position: Position.CO, spotType: SpotType.FACING_3BET, actionHistory: 'hero_opened_2.2x_btn_3bet_5.5x' },
  { id: 'tpl_12', stackDepthBb: 30, position: Position.HJ, spotType: SpotType.FACING_3BET, actionHistory: 'hero_opened_2.2x_co_3bet_6x' },
  // New facing-open templates
  { id: 'tpl_13', stackDepthBb: 25, position: Position.CO, spotType: SpotType.FACING_OPEN, actionHistory: 'utg_opens_2.2x_folds_to_hero' },
  { id: 'tpl_14', stackDepthBb: 30, position: Position.CO, spotType: SpotType.FACING_OPEN, actionHistory: 'utg_opens_2.2x_folds_to_hero' },
  { id: 'tpl_15', stackDepthBb: 25, position: Position.BTN, spotType: SpotType.FACING_OPEN, actionHistory: 'co_opens_2.5x_folds_to_hero' },
  { id: 'tpl_16', stackDepthBb: 20, position: Position.BTN, spotType: SpotType.FACING_OPEN, actionHistory: 'co_opens_2.5x_folds_to_hero' },
  { id: 'tpl_17', stackDepthBb: 25, position: Position.BB, spotType: SpotType.FACING_OPEN, actionHistory: 'btn_opens_2.2x_sb_folds_hero_in_bb' },
  { id: 'tpl_18', stackDepthBb: 20, position: Position.SB, spotType: SpotType.FACING_OPEN, actionHistory: 'btn_opens_2.2x_hero_in_sb' },
  { id: 'tpl_19', stackDepthBb: 15, position: Position.BTN, spotType: SpotType.FACING_OPEN, actionHistory: 'hj_opens_2.2x_co_folds_hero_on_btn' },
  { id: 'tpl_20', stackDepthBb: 20, position: Position.CO, spotType: SpotType.FACING_OPEN, actionHistory: 'mp_opens_2.2x_folds_to_hero' },
];

export const ASSESSMENT_SPOTS: SpotDecision[] = [
  // ============ ORIGINAL 12 SPOTS ============
  {
    id: 'assess_01', spotTemplateId: 'tpl_01', handCode: 'K9o',
    baselineAction: SimplifiedAction.FOLD, simplifiedAction: SimplifiedAction.FOLD,
    acceptableActions: [], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.EP_DISCIPLINE, assessmentOrder: 1,
    explanation: {
      plain: 'K9 offsuit looks playable but from the earliest seat at the table you have 7 or 8 players left to act. Too many people can wake up with a better hand behind you.',
      poker: 'K9o is dominated by hands that continue vs a UTG open. You lack position postflop and the hand plays poorly multiway or against a 3-bet.',
      pattern: 'From UTG at 30bb: fold all Kx offsuit below KQ. If you would not be comfortable calling a 3-bet or playing out of position postflop, do not open it.',
    },
  },
  {
    id: 'assess_02', spotTemplateId: 'tpl_02', handCode: 'A2s',
    baselineAction: SimplifiedAction.OPEN, simplifiedAction: SimplifiedAction.OPEN,
    acceptableActions: [SimplifiedAction.JAM], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.LP_PRESSURE, assessmentOrder: 2,
    explanation: {
      plain: 'Everyone folded to you on the button. A2 suited is plenty strong enough to raise here. You only have to get past the blinds and you have position if they call.',
      poker: 'A2s is a standard BTN steal at 20bb. Suited aces have good equity when called and the fold equity from the steal is profitable on its own.',
      pattern: 'Button with 20bb and everyone folded to you: open any ace and most suited broadways. If in doubt on the button with an ace, raise it.',
    },
  },
  {
    id: 'assess_03', spotTemplateId: 'tpl_03', handCode: 'Q9s',
    baselineAction: SimplifiedAction.OPEN, simplifiedAction: SimplifiedAction.OPEN,
    acceptableActions: [], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.LP_PRESSURE, assessmentOrder: 3,
    explanation: {
      plain: 'It folded to you one seat before the button. Q9 suited is a good hand to raise here because you only have three players behind you and the hand has decent potential if called.',
      poker: 'Q9s is a profitable CO open at 25bb. Suited connectors and one-gappers with high cards play well as steals and have reasonable postflop equity when called by the blinds.',
      pattern: 'From the cutoff at 20-30bb with folds to you: open most suited broadways and suited connectors down to about Q8s/J8s. The cutoff is a stealing seat.',
    },
  },
  {
    id: 'assess_04', spotTemplateId: 'tpl_04', handCode: 'AJs',
    baselineAction: SimplifiedAction.OPEN, simplifiedAction: SimplifiedAction.OPEN,
    acceptableActions: [], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.TWENTY_BB_COMMITMENT, assessmentOrder: 4,
    explanation: {
      plain: 'AJ suited is a strong hand at any stack depth. At 20 big blinds from the cutoff you should raise. If someone 3-bets you can comfortably go all in.',
      poker: 'AJs is in the top tier of hands you open at 20bb from CO. It is strong enough to open and call (or 4-bet jam) vs a 3-bet. No commitment concerns with this holding.',
      pattern: 'At 20bb with a hand you would be happy to get all in with: just open normally. AJ suited and better are always opens from the cutoff.',
    },
  },
  {
    id: 'assess_05', spotTemplateId: 'tpl_05', handCode: 'QTo',
    baselineAction: SimplifiedAction.FOLD, simplifiedAction: SimplifiedAction.FOLD,
    acceptableActions: [SimplifiedAction.OPEN], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.TWENTY_BB_COMMITMENT, assessmentOrder: 5,
    explanation: {
      plain: 'At 20 big blinds from the hijack QT offsuit puts you in an awkward spot. If you raise and someone re-raises you have to fold and you just wasted chips. The hand is not strong enough to justify that risk from this position.',
      poker: 'QTo at 20bb from HJ is a raise/fold candidate at best but the chips invested in opening are too significant a fraction of your stack. The hand is dominated by common 3-bet holdings and plays poorly out of position.',
      pattern: 'At 20bb from middle position: if you would have to fold to a 3-bet AND the open costs more than 10% of your stack, the hand needs to be strong enough to justify that investment. QTo does not clear that bar from HJ.',
    },
  },
  {
    id: 'assess_06', spotTemplateId: 'tpl_06', handCode: 'A9o',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.FIFTEEN_BB_RAISE_JAM, assessmentOrder: 6,
    explanation: {
      plain: 'At 15 big blinds with A9 offsuit you should go all in rather than making a small raise. If you raise small you are putting in almost a third of your stack and then folding to a re-raise which wastes too many chips.',
      poker: 'At 15bb a standard open of 2-2.5x commits roughly 15-17% of your stack with no guarantee of seeing a flop. A9o is too strong to fold but not strong enough to open and comfortably call a 3-bet jam. The correct line is to jam and maximize fold equity.',
      pattern: 'At 15bb or less: if the hand is worth playing but you cannot call a re-raise, jam it. The raise/fold line bleeds chips at this stack depth. A9o is a clear jam from the cutoff.',
    },
  },
  {
    id: 'assess_07', spotTemplateId: 'tpl_07', handCode: 'KTs',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [SimplifiedAction.OPEN], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.FIFTEEN_BB_RAISE_JAM, assessmentOrder: 7,
    explanation: {
      plain: 'With 15 big blinds and KT suited from the hijack you should push all in. It might feel aggressive but at this stack size a normal raise followed by a fold to a re-raise costs too much.',
      poker: 'KTs at 15bb from HJ sits right at the jam/fold threshold. Opening and folding to a 3-bet wastes 2-2.5bb from a 15bb stack. KTs has sufficient equity against calling ranges to make the jam profitable.',
      pattern: 'At 15bb from HJ: jam with suited broadways KTs and better. Below that threshold (like KTs from UTG) the jam becomes marginal because more players remain to act.',
    },
  },
  {
    id: 'assess_08', spotTemplateId: 'tpl_08', handCode: 'K5s',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.TEN_BB_PUSH_FOLD, assessmentOrder: 8,
    explanation: {
      plain: 'At 10 big blinds on the button with everyone folding to you K5 suited is a clear all-in. You only need the blinds to fold often enough to profit and K5 suited has decent backup equity if called.',
      poker: 'K5s is well within the BTN jam range at 10bb. Against typical blind calling ranges you have roughly 35-40% equity when called and the fold equity from the blinds alone makes this profitable.',
      pattern: 'At 10bb on the button with folds to you: jam any king. The button has only two players to get through and almost any king-high is profitable to shove.',
    },
  },
  {
    id: 'assess_09', spotTemplateId: 'tpl_09', handCode: 'Q8o',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.TEN_BB_PUSH_FOLD, assessmentOrder: 9,
    explanation: {
      plain: 'At 10 big blinds from the cutoff Q8 offsuit should be pushed all in. You have three players behind you and Q8 is strong enough to shove. Waiting for a better hand risks blinding down further.',
      poker: 'Q8o at 10bb from CO is a standard jam in push/fold charts. The three remaining players need strong hands to call and Q8o has adequate equity against those calling ranges.',
      pattern: 'At 10bb from the cutoff: jam most queens and better. Q8o is near the bottom of the range but still clearly profitable. Tighter than the button but wider than the hijack.',
    },
  },
  {
    id: 'assess_10', spotTemplateId: 'tpl_10', handCode: 'K7o',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.SB_FUNDAMENTALS, assessmentOrder: 10,
    explanation: {
      plain: 'Everyone folded to you in the small blind with 15 big blinds. K7 offsuit might not look great but you only have one player to get through. Shoving puts maximum pressure on the big blind.',
      poker: 'K7o from the SB at 15bb is a standard jam when folded to. Against BB calling ranges you have workable equity and the fold equity is significant. Limping or raising small is suboptimal.',
      pattern: 'From the SB at 15bb with folds to you: jam wider than you think. You only need to beat one player. K7o and better is standard.',
    },
  },
  {
    id: 'assess_11', spotTemplateId: 'tpl_11', handCode: 'AQs',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [SimplifiedAction.CALL], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.FACING_3BETS, assessmentOrder: 11,
    explanation: {
      plain: 'You opened from the cutoff and the button re-raised. With AQ suited and 25 big blinds you should go all in. AQ suited is way too strong to fold here and at this stack depth calling leaves you in an awkward spot.',
      poker: 'AQs at 25bb facing a BTN 3-bet is a standard 4-bet jam. After opening to 2.2x and facing a 3-bet to 5.5x you have roughly 19bb behind. AQs has strong equity against 3-bet ranges.',
      pattern: 'Facing a 3-bet at 25bb or less: if the hand is in the top of your opening range (AQ+ and TT+), 4-bet jam. Do not flat call and play a bloated pot out of position with a short effective stack.',
    },
  },
  {
    id: 'assess_12', spotTemplateId: 'tpl_12', handCode: 'KJo',
    baselineAction: SimplifiedAction.FOLD, simplifiedAction: SimplifiedAction.FOLD,
    acceptableActions: [], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.FACING_3BETS, assessmentOrder: 12,
    explanation: {
      plain: 'You opened from the hijack and the cutoff re-raised. KJ offsuit might feel strong but against a 3-bet from a player in position it is dominated by the hands they typically re-raise with. Folding here is the disciplined play.',
      poker: 'KJo at 30bb facing a CO 3-bet is a fold. The hand is dominated by AK/AJ/KQ which are core 3-bet holdings. Calling out of position with KJo against a range that crushes you leads to difficult postflop spots.',
      pattern: 'Facing a 3-bet from a player with position: fold hands like KJo/QJo/KTo. These hands feel strong but they are dominated by the 3-bettor range. Save those chips for spots where you have the advantage.',
    },
  },

  // ============ 8 NEW FACING-OPEN SPOTS ============
  {
    id: 'assess_13', spotTemplateId: 'tpl_13', handCode: 'KQs',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [SimplifiedAction.CALL], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 13,
    explanation: {
      plain: 'An early position player raised and everyone else folded to you in the cutoff. KQ suited is a premium hand here. At 25 big blinds, going all in puts maximum pressure on the raiser and you have great equity if called.',
      poker: 'KQs at 25bb is a standard 3-bet jam over a UTG open from the CO. You have strong equity against a UTG opening range, your hand blocks AK and KK, and the stack depth makes flatting awkward.',
      pattern: 'Facing an early position open at 25bb or less: with premium hands like KQs, AJs+, TT+, go all in rather than calling. Flatting creates difficult postflop situations with a short stack.',
    },
  },
  {
    id: 'assess_14', spotTemplateId: 'tpl_14', handCode: '99',
    baselineAction: SimplifiedAction.CALL, simplifiedAction: SimplifiedAction.CALL,
    acceptableActions: [SimplifiedAction.JAM], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 14,
    explanation: {
      plain: 'An early position player raised and everyone else folded to you in the cutoff. With pocket nines at 30 big blinds, calling is the best play. You have position, a hand that plays well postflop, and enough stack depth to maneuver.',
      poker: '99 at 30bb facing a UTG open is a call from the CO. The stack depth allows for set mining and postflop play. 3-bet jamming is marginal because UTG ranges are tight, and 99 does poorly against the hands that call a jam.',
      pattern: 'Facing an early position open at 30bb with mid pairs (77-TT): calling is usually best. You have implied odds to hit a set, and enough chips behind to fold on bad boards.',
    },
  },
  {
    id: 'assess_15', spotTemplateId: 'tpl_15', handCode: 'A5s',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [SimplifiedAction.CALL], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 15,
    explanation: {
      plain: 'The cutoff raised and everyone folded to you on the button. A5 suited is a great hand to go all in with here. You have an ace, a suited hand with straight potential, and you can win the pot right now without seeing a flop.',
      poker: 'A5s on the BTN at 25bb is a strong 3-bet jam candidate over a CO open. The hand has blockers to aces, good equity when called, and the CO opening range is wide enough that your jam gets lots of folds.',
      pattern: 'On the button facing a cutoff open at 25bb: suited aces are great all-in hands. They have blockers, equity, and fold equity. A2s-A5s are better jams than calls because they play poorly postflop.',
    },
  },
  {
    id: 'assess_16', spotTemplateId: 'tpl_16', handCode: 'KJo',
    baselineAction: SimplifiedAction.FOLD, simplifiedAction: SimplifiedAction.FOLD,
    acceptableActions: [SimplifiedAction.CALL], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 16,
    explanation: {
      plain: 'The cutoff raised and you are on the button with KJ offsuit at 20 big blinds. This hand looks decent but it is dominated by a lot of hands the raiser could have. Calling risks getting squeezed by the blinds, and you cannot comfortably go all in with this hand.',
      poker: 'KJo on the BTN at 20bb facing a CO open is a marginal spot. The hand is dominated by AK, AJ, KQ which are all in the CO opening range. 3-bet jamming risks running into the top of their range, and flatting invites blind squeezes.',
      pattern: 'Facing a late position open at 20bb with hands like KJo, QJo, KTo: these are traps. They look playable but are dominated by the opener range. Fold and wait for a better spot unless you have a strong read.',
    },
  },
  {
    id: 'assess_17', spotTemplateId: 'tpl_17', handCode: 'Q9s',
    baselineAction: SimplifiedAction.CALL, simplifiedAction: SimplifiedAction.CALL,
    acceptableActions: [], difficultyBand: DifficultyBand.EASY,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 17,
    explanation: {
      plain: 'The button raised and the small blind folded. You are in the big blind with Q9 suited and 25 big blinds. You already have a big blind invested and you are getting a good price to call. Q9 suited can make flushes and straights.',
      poker: 'Q9s in the BB at 25bb vs a BTN open is a standard defend. You are closing the action, getting good pot odds (need to call 1.2bb to win 3.7bb), and Q9s has good playability with flush and straight potential.',
      pattern: 'In the big blind facing a button open at 20-30bb: defend with suited connectors, suited broadways, and any pair. You are getting a great price and closing the action. Q9s is a clear call.',
    },
  },
  {
    id: 'assess_18', spotTemplateId: 'tpl_18', handCode: 'ATo',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 18,
    explanation: {
      plain: 'The button raised and you are in the small blind with AT offsuit at 20 big blinds. Going all in is the best play here. AT is strong enough to get value from the button wider opening range, and calling out of position with 20bb creates problems.',
      poker: 'ATo in the SB at 20bb facing a BTN open is a 3-bet jam. Flatting out of position with a short stack is recipe for disaster. The BTN opens wide, so your AT has solid equity against their range. Jamming leverages fold equity.',
      pattern: 'In the small blind facing a button open at 20bb: with AT+, KQ, and pairs 88+, go all in. Do not call. The SB is the worst position postflop and at 20bb you cannot afford to play pots out of position.',
    },
  },
  {
    id: 'assess_19', spotTemplateId: 'tpl_19', handCode: '77',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [SimplifiedAction.CALL], difficultyBand: DifficultyBand.MEDIUM,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 19,
    explanation: {
      plain: 'The hijack raised and the cutoff folded. You are on the button with pocket sevens at 15 big blinds. At this stack depth, going all in is the correct play. You have a pair that is ahead of most of the raiser hands, and calling to try to hit a set is too expensive at 15bb.',
      poker: '77 on the BTN at 15bb facing an HJ open is a clear jam. Set mining is not viable at this stack depth (you need 15:1 implied odds). 77 has ~55% equity against a typical HJ opening range and the fold equity makes this very profitable.',
      pattern: 'Facing an open at 15bb with any pocket pair 55+: jam from the button or cutoff. You do not have the stack depth to set mine, and pairs have enough equity against opening ranges to make all-in profitable.',
    },
  },
  {
    id: 'assess_20', spotTemplateId: 'tpl_20', handCode: 'AJo',
    baselineAction: SimplifiedAction.JAM, simplifiedAction: SimplifiedAction.JAM,
    acceptableActions: [], difficultyBand: DifficultyBand.THRESHOLD,
    leakCategory: LeakCategoryId.FACING_OPENS, assessmentOrder: 20,
    explanation: {
      plain: 'A middle position player raised and everyone folded to you in the cutoff with AJ offsuit at 20 big blinds. Going all in is the right move. AJ is strong enough to stand up against a middle position raising range, and at 20bb you cannot afford to call and play postflop.',
      poker: 'AJo in the CO at 20bb facing an MP open is a 3-bet jam. Flatting with 20bb creates stack-to-pot ratio problems postflop. AJo has good equity against MP opening ranges and jamming maximizes fold equity against hands like KQ, QJ, small pairs that will fold.',
      pattern: 'Facing a middle position open at 20bb from the cutoff: with AJ+, KQs, and TT+, go all in. The combination of equity when called and fold equity makes jamming clearly better than flatting at this stack depth.',
    },
  },
];

export const SPOT_TEMPLATES = templates;

export function getTemplate(id: string): SpotTemplate | undefined {
  return templates.find(t => t.id === id);
}
