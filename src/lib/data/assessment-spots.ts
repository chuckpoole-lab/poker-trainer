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

// Shorthand for universal button actions used in actionExplanations keys
const F = SimplifiedAction.FOLD;
const R = SimplifiedAction.OPEN;   // "Raise" button
const C = SimplifiedAction.CALL;   // "Call" button
const J = SimplifiedAction.JAM;    // "All In" button

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
    actionExplanations: {
      [F]: 'Correct. K9o from UTG is too weak. With 7-8 players behind you, someone likely holds a dominating hand like KT+, AK, or a pocket pair. Folding saves you from playing a dominated hand out of position.',
      [R]: 'Raising K9o from UTG at 30bb is a common leak. If you get 3-bet, you have to fold and waste 2.2bb. If you get called, you are out of position with a hand that is dominated by most hands that continue. KQ is the floor for Kx offsuit opens from UTG.',
      [C]: 'You cannot call from UTG in an unopened pot — there is nothing to call. If you mean limping, that is even worse: it invites multiway action with a hand that plays terribly against multiple opponents and gives up the initiative.',
      [J]: 'Shoving 30bb with K9o from UTG is way too loose. At 30bb you have plenty of room to play normal poker. An all-in here only gets called by hands that crush you (any pair 99+, AQ+). You are lighting chips on fire.',
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
    actionExplanations: {
      [R]: 'Correct. A2s on the BTN at 20bb is a textbook steal. You only need to get through two players, you have position if called, and suited aces have backdoor flush potential. Raising to 2-2.5x is the standard play.',
      [F]: 'Folding A2s on the button when it folds to you is way too tight. You only need to beat the blinds, and any ace is profitable to raise here. Folding playable hands in steal spots is one of the most common leaks — you are giving up free equity.',
      [C]: 'There is nothing to call — the pot is unopened. If you are thinking about limping, that is a mistake at 20bb. Limping forfeits your fold equity and invites the big blind to see a flop cheaply. At this stack depth, raise or fold.',
      [J]: 'Acceptable but not optimal. At 20bb, A2s has enough fold equity as a jam, but you are risking your entire stack unnecessarily. A standard raise to 2-2.5x accomplishes the same goal (steal the blinds) while risking far less. Save the all-in for hands where you cannot afford to raise and fold.',
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
    actionExplanations: {
      [R]: 'Correct. Q9s from the CO at 25bb is a standard open. You have only three players behind you, the hand has flush and straight potential, and at this stack depth a 2.2x raise is efficient. The cutoff is a stealing position — take advantage of it.',
      [F]: 'Folding Q9s from the cutoff is too nitty. The CO is a prime stealing seat with only the BTN and blinds to get through. Suited broadway one-gappers like Q9s are profitable raises here. If you only open premium hands from the CO, you are missing a huge amount of value.',
      [C]: 'There is nothing to call — the pot is unopened. Limping from the cutoff at 25bb gives up your fold equity and tells the button and blinds you have a weak hand. Either raise to steal the blinds or fold.',
      [J]: 'Shoving 25bb with Q9s from the CO is too aggressive. At 25bb you have room for a normal raise. If you jam, you fold out all the hands you want action from and only get called by hands that beat you. A standard raise captures the same fold equity with much less risk.',
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
    actionExplanations: {
      [R]: 'Correct. AJs at 20bb from CO is a premium open. The hand is strong enough that if someone 3-bets you, you can happily 4-bet jam. Raising to 2-2.5x is the best play — it gives you flexibility and builds the pot when you have the best hand.',
      [F]: 'Folding AJs from the cutoff at any stack depth is a serious mistake. This is a top-tier hand that dominates most of the range that would continue against you. AJs is in the top 5% of all starting hands — you should always be playing it.',
      [C]: 'There is nothing to call — the pot is unopened. Limping AJs at 20bb is terrible because you are disguising a strong hand as weak, inviting multiway action, and giving up fold equity. This hand wants to build a pot, not see a cheap flop.',
      [J]: 'Jamming 20bb with AJs from the CO works but is suboptimal. At 20bb a raise gives you more flexibility: you build the pot, maintain the option to 4-bet jam if 3-bet, and keep weaker hands in. Going all-in first folds out the weaker hands you want action from.',
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
    actionExplanations: {
      [F]: 'Correct. QTo from HJ at 20bb is a borderline hand that leans fold. Opening costs ~2.2bb (11% of your stack) and if you get 3-bet you have to fold. QTo is dominated by AQ, KQ, AJ — all common 3-bet hands. Discipline here preserves chips for cleaner spots.',
      [R]: 'Acceptable but marginal. QTo from HJ at 20bb is right on the edge. The problem is the raise-fold trap: you invest 2.2bb, get 3-bet, and have to fold a hand that is dominated by the 3-bettor range. At deeper stacks this is a fine open, but at 20bb the investment is too costly relative to your stack.',
      [C]: 'There is nothing to call — the pot is unopened. Limping QTo from the hijack at 20bb is a clear mistake. It shows weakness, invites the button and blinds to play cheaply, and you end up in a multiway pot out of position with a mediocre hand.',
      [J]: 'Shoving 20bb with QTo from HJ is too loose. QTo is dominated by virtually every hand that calls an all-in from this position (AQ, AJ, KQ, TT+). You are turning a marginal hand into a massive overcommitment. The expected value of this jam is deeply negative.',
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
    actionExplanations: {
      [J]: 'Correct. A9o from the CO at 15bb is a textbook jam. Raising small commits ~15% of your stack, and if you get 3-bet you have to fold — wasting precious chips. Jamming maximizes your fold equity and A9o has solid equity (~55-60%) against typical calling ranges.',
      [R]: 'Raising to 2.2x at 15bb with A9o creates the raise-fold trap. You invest 2.2bb (nearly 15% of your stack), someone jams behind you, and you have to fold with A9o because you are not getting the right price. That 2.2bb bleeds away. At this stack depth, the correct line is jam or fold — skip the middle ground.',
      [F]: 'Folding A9o from the CO at 15bb is too tight. Any ace is in your jamming range from this position at this stack depth. A9o is well above the threshold for a profitable shove. If you only jam premium hands you are not applying enough pressure on the blinds and your stack will erode.',
      [C]: 'There is nothing to call here — the pot is unopened. Limping with 15bb is a major strategic error. You give up all fold equity, invite the blinds to see a free flop, and play a bloated pot out of position with a hand that works best as a shove-or-fold decision.',
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
    actionExplanations: {
      [J]: 'Correct. KTs at 15bb from HJ is a jam. The suited broadway has good equity when called (~45-50% vs calling ranges) and significant fold equity from the remaining players. At this stack depth, the jam is clearly better than the raise-fold line.',
      [R]: 'Acceptable but suboptimal. Raising to 2.2x with KTs commits ~15% of your stack, and if someone shoves you are in an ugly spot — KTs is not strong enough to call a jam comfortably, but folding wastes valuable chips. Jamming avoids this dilemma entirely and puts maximum pressure on opponents.',
      [F]: 'Folding KTs from HJ at 15bb is too tight. Suited broadways with this much equity should not be folded at this stack depth. KTs is well within the profitable jam range from the hijack. Passing on these spots means your stack slowly bleeds away waiting for premiums that may not come.',
      [C]: 'There is nothing to call — the pot is unopened. Limping KTs from the hijack at 15bb is a fundamental error. You waste your positional awareness advantage and fold equity. At 15bb, every decision in an unopened pot should be jam or fold.',
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
    actionExplanations: {
      [J]: 'Correct. K5s on the BTN at 10bb is a clear shove. You only have two players to beat, K-high has decent equity when called (~38%), and the suited kicker adds flush potential. The math is simple: if the blinds fold often enough, you profit. And K5s clears that bar easily.',
      [F]: 'Folding K5s on the button at 10bb is way too tight. At this stack depth, push/fold is the correct strategy. Any king from the button is a profitable jam. If you only shove premiums at 10bb, the blinds and antes will eat your stack before you find them.',
      [R]: 'At 10bb there is no room for a standard raise. A 2.2x open puts in more than 20% of your stack, and you cannot fold if someone jams behind you. At 10bb, simplify: push or fold. There is no raise-fold line.',
      [C]: 'There is nothing to call — the pot is unopened. At 10bb, limping is catastrophic. It broadcasts weakness, invites the big blind to check behind, and you end up playing a marginal hand in a small pot with zero fold equity. Push/fold only at this depth.',
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
    actionExplanations: {
      [J]: 'Correct. Q8o from CO at 10bb is a standard push/fold jam. Three players behind you need strong holdings to call, and Q8o has ~35% equity against typical calling ranges. Combined with the fold equity from three players having to fold, this is clearly profitable.',
      [F]: 'Folding Q8o from the CO at 10bb is too passive. At this stack depth, you cannot afford to wait for premium hands — the blinds will consume your stack. Q8o is well within the profitable jam range from CO. Every orbit you wait costs you 1.5bb in blinds.',
      [R]: 'At 10bb, there is no room for a standard raise. Opening to 2.2x commits over 20% of your stack and you cannot profitably fold to a jam. The correct strategy at 10bb is push or fold — no in-between.',
      [C]: 'There is nothing to call — the pot is unopened. Limping Q8o at 10bb surrenders all fold equity and invites the big blind to see a flop for free. At 10bb, every chip matters. Push or fold.',
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
    actionExplanations: {
      [J]: 'Correct. K7o from SB at 15bb with folds to you is a standard jam. You only have the big blind to beat. K-high has decent equity when called (~40% vs BB calling range), and the BB has to fold the majority of their range. This is pure math — the jam is profitable.',
      [F]: 'Folding K7o in the small blind at 15bb when everyone folded to you is a major leak. You only need to get through ONE player. K7o is well above the jamming threshold here. If you fold hands like this, you are surrendering the small blind far too often and your stack erodes rapidly.',
      [R]: 'Raising to 2.2x from the SB at 15bb creates the raise-fold problem. You invest 2.2bb, the BB jams, and now you have to decide with K7o. The jam avoids this dilemma: maximum fold equity, no awkward postflop decisions, and you get the pot heads-up with initiative.',
      [C]: 'Completing the small blind (limping) with K7o at 15bb is a classic recreational player mistake. It gives the big blind a free look at a flop with position on you. You play the worst position at the table in a pot with no fold equity. Jam or fold — there is no limp at 15bb.',
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
    actionExplanations: {
      [J]: 'Correct. AQs facing a BTN 3-bet at 25bb is a slam-dunk 4-bet jam. After your 2.2x open and their 5.5x 3-bet, you have ~19bb behind. AQs has excellent equity against 3-bet ranges (~55% vs a typical BTN 3-bet range). Jamming leverages fold equity and your hand strength.',
      [C]: 'Acceptable but not ideal. Calling the 3-bet with AQs leaves you with ~19bb and a bloated pot playing out of position on the flop. You will often face difficult decisions postflop with a stack-to-pot ratio that makes it hard to maneuver. At this stack depth, just get it in preflop.',
      [F]: 'Folding AQs to a BTN 3-bet at 25bb is a massive mistake. AQs is in the top 3-4% of all starting hands and has ~55% equity against typical 3-bet ranges. The button 3-bets wide here (they know you open wide from CO). Folding this hand leaves money on the table every single time.',
      [R]: 'You already opened and the button 3-bet you. A 4-bet to a non-all-in amount does not make sense at 25bb — it would commit most of your stack anyway. Either jam (correct) or call. There is no room for a small 4-bet at this stack depth.',
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
    actionExplanations: {
      [F]: 'Correct. KJo facing a CO 3-bet at 30bb is a fold. It feels wrong to fold a "good" hand, but the 3-bettor range is loaded with AK, AJ, KQ, QQ+ — all of which dominate you. You are out of position and the hand plays terribly against their range. Discipline here saves significant chips over time.',
      [J]: 'Jamming 30bb with KJo facing a CO 3-bet is a major overplay. At 30bb, a 4-bet jam is a massive overbet into a 3-bettor range that has you dominated. KJo has only ~35% equity against a typical CO 3-bet calling range. This is burning chips.',
      [C]: 'Calling the 3-bet with KJo creates a nightmare scenario. You are out of position, the 3-bettor has a range advantage, and KJo flops well-but-not-great (top pair weak kicker situations). You will constantly face tough decisions against someone who has initiative and position. This is a long-term chip leak.',
      [R]: 'You already opened and they 3-bet. A small 4-bet here is essentially committing your stack (at 30bb, a 4-bet would be ~14bb). If you are going to put that many chips in, just jam. But KJo is not strong enough to 4-bet jam either — so the answer is fold.',
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
    actionExplanations: {
      [J]: 'Correct. KQs facing a UTG open from the CO at 25bb is a textbook 3-bet jam. You block AK and KK (key hands in UTG range), have ~48% equity against a UTG calling range, and the fold equity against their uncalled range is significant. This is exactly the spot to get aggressive.',
      [C]: 'Acceptable but suboptimal. Calling the UTG open with KQs at 25bb creates awkward postflop situations. You are out of position against a strong range with a hand that often makes top-pair-good-kicker — strong enough to get in trouble, not strong enough to stack off comfortably. Jamming simplifies the decision and leverages fold equity.',
      [F]: 'Folding KQs to a UTG open from the CO at 25bb is far too tight. KQs is a premium hand that has excellent equity against UTG opening ranges. The blocker effects (blocking AK and KK) make this a very profitable 3-bet jam. Folding here is leaving significant value on the table.',
      [R]: 'A small 3-bet at 25bb does not work well. If you 3-bet to ~6bb and UTG jams, you are committed anyway since you would have ~19bb behind in a pot of ~9bb. Since you are getting it in regardless, jam from the start to maximize fold equity and avoid an awkward decision point.',
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
    actionExplanations: {
      [C]: 'Correct. 99 facing a UTG open from the CO at 30bb is a call. At 30bb you have enough stack depth for set mining (you hit a set ~12% of the time and can win a big pot). You have position, so you act last on every street. The hand plays well postflop as an overpair to most boards.',
      [J]: 'Acceptable but marginal. 3-bet jamming 99 at 30bb over a UTG open is aggressive. UTG ranges are tight, and the hands that call your jam (TT+, AK, AQs) have you in bad shape. You are basically flipping at best and dominated at worst. Calling preserves your stack and lets you play a skill-based postflop game.',
      [F]: 'Folding 99 to a UTG open from the CO at 30bb is too tight. Pocket nines is a strong hand that has ~54% equity against a UTG opening range. You have position, stack depth for set mining, and a hand that makes for easy postflop decisions (fold on overcard-heavy boards, value bet when you are ahead).',
      [R]: 'A small 3-bet with 99 at 30bb is awkward. If UTG 4-bets, you have to fold 99 (it is not strong enough to call a 4-bet). If they call, you are playing a bloated pot out of position with a one-pair hand. The flat call is more elegant and profitable in this spot.',
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
    actionExplanations: {
      [J]: 'Correct. A5s on the BTN at 25bb facing a CO open is a perfect 3-bet jam. The ace blocks AA and AK (making it less likely you are called by premiums), the hand has ~42% equity against calling ranges thanks to the suited wheel straight potential, and the CO folds a large chunk of their wide opening range.',
      [C]: 'Acceptable but suboptimal. Calling the CO open with A5s means you see a flop with a hand that usually makes weak pairs or draws. A5s plays poorly postflop as a call — you hit top pair with a bad kicker, or you miss entirely. Jamming is better because A5s works best as a fold-equity play that has great backup equity when called.',
      [F]: 'Folding A5s on the button facing a CO open at 25bb is way too tight. You have position, an ace blocker, a suited hand with straight and flush potential, and you are against a wide CO opening range. This hand is a clear 3-bet jam — folding it is a significant strategic error.',
      [R]: 'A small 3-bet with A5s at 25bb does not work well. If the CO 4-bets, you are stuck — A5s is not strong enough to call a 4-bet but too strong to fold if you have already committed 6-7bb. Jamming avoids this trap by putting the decision back on the opener. Go all-in or fold — no in-between.',
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
    actionExplanations: {
      [F]: 'Correct. KJo on the BTN facing a CO open at 20bb is a fold. It feels like a good hand, but the CO opening range contains AK, AJ, KQ — all of which dominate you. At 20bb, your options are limited postflop if you call. And jamming puts you at risk against the top of their range. Best to let this one go.',
      [C]: 'Acceptable but risky. Calling the CO open with KJo at 20bb invites the blinds to squeeze behind you, and you are playing a dominated hand postflop. If you hit a king, you lose to AK/KQ. If you hit a jack, you lose to AJ/QJ. The hand makes a lot of second-best pairs that cost you chips.',
      [J]: 'Jamming 20bb with KJo over a CO open is too loose. The CO calls with a range that crushes you: AK, AQ, TT+, KQs all have you dominated or in a coinflip at best. You are risking your tournament life with a hand that has ~35% equity against the calling range.',
      [R]: 'A small 3-bet with KJo at 20bb does not make sense. It commits too much of your stack, and if the CO 4-bets you have to fold. If they call you play a bloated pot out of position (if blinds are in) with a dominated hand. There is no good outcome from a small 3-bet here.',
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
    actionExplanations: {
      [C]: 'Correct. Q9s in the BB facing a BTN open at 25bb is a textbook defend. You already have 1bb invested, so you only need to call ~1.2bb to see a flop in a pot of ~3.7bb — that is excellent pot odds. Q9s has flush and straight potential, making it a profitable call.',
      [F]: 'Folding Q9s in the BB to a BTN open at 25bb is too tight. You are getting nearly 3:1 on a call and you close the action (no one can squeeze behind you). The button opens very wide, so Q9s has good relative strength here. Folding this hand means you are defending your blind far too little.',
      [J]: 'Jamming 25bb with Q9s over a BTN open from the BB is too aggressive. Q9s does not have enough raw equity to jam profitably here. It is a playable hand, not a premium. Calling lets you see a flop at a great price; jamming risks your tournament life with a marginal holding.',
      [R]: 'A 3-bet with Q9s from the BB at 25bb is awkward. If the BTN 4-bets, you have to fold Q9s. If they call, you are playing an inflated pot out of position with a speculative hand. Calling gives you the best price and lets you play poker postflop with good pot odds.',
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
    actionExplanations: {
      [J]: 'Correct. ATo from the SB at 20bb facing a BTN open is a clear 3-bet jam. The button opens extremely wide, so AT has ~52% equity against their range. At 20bb, calling out of position creates nightmare postflop scenarios. Jamming leverages fold equity and your hand strength simultaneously.',
      [C]: 'Calling the BTN open with ATo from the SB at 20bb is a mistake. You will be out of position for every street postflop, the BTN has a wider range that plays better multiway, and at 20bb you do not have the stack depth to maneuver. The SB is the worst seat for flatting — jam or fold.',
      [F]: 'Folding ATo from the SB at 20bb facing a BTN open is too tight. The button opens very wide (often 40%+ of hands), and ATo has excellent equity against that range. This is a profitable 3-bet jam by a large margin. Folding here means you are missing one of your best spots to pick up chips.',
      [R]: 'A small 3-bet from the SB at 20bb with ATo is suboptimal. It commits ~30% of your stack, and if the BTN 4-bets or calls, you are stuck in a bloated pot out of position. At 20bb, simplify: jam the hands worth playing, fold the rest. No small 3-bets from the SB at this depth.',
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
    actionExplanations: {
      [J]: 'Correct. 77 on the BTN at 15bb facing an HJ open is a clear jam. A pocket pair has ~55% equity against a typical HJ opening range, and the fold equity is significant. At 15bb, you cannot afford to set mine (you need 15:1 implied odds, you have about 7:1). Jam and let fold equity work for you.',
      [C]: 'Acceptable but suboptimal. Calling 77 at 15bb to "set mine" is a stack-depth mistake. You need roughly 15:1 implied odds to set mine profitably, and at 15bb you have about 7:1. Most of the time you miss the set, see overcards on the flop, and have to give up. Jamming is more profitable.',
      [F]: 'Folding pocket sevens on the button at 15bb facing an HJ open is much too tight. Any pocket pair 55+ is profitable to jam here. You have a pair that is ahead of most unpaired hands, position, and fold equity. Folding gives up a very profitable spot.',
      [R]: 'A small 3-bet with 77 at 15bb commits too much of your stack without resolving the hand. If the HJ 4-bets you are stuck. If they call, you play a bloated pot that you cannot navigate well with an underpair to most flops. At 15bb, simplify to jam or fold.',
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
    actionExplanations: {
      [J]: 'Correct. AJo from CO at 20bb facing an MP open is a clear 3-bet jam. AJ has ~50% equity against a typical MP calling range, and many hands in the MP opening range (KQ, QJ, small pairs, suited connectors) will fold to your jam. The combination of fold equity and hand strength makes this highly profitable.',
      [C]: 'Calling the MP open with AJo at 20bb creates stack-to-pot ratio problems. After calling ~2.2bb, you have ~18bb behind in a pot of ~5.5bb. You cannot fold on most flops because you are committed, but you also cannot comfortably play a short-stacked pot out of position with top-pair-decent-kicker. Jamming simplifies everything.',
      [F]: 'Folding AJo to an MP open from the CO at 20bb is far too tight. AJ is a strong hand that has good equity against MP opening ranges. At this stack depth, AJo is squarely in your 3-bet jam range. Folding here means you are passing up a very profitable spot.',
      [R]: 'A small 3-bet with AJo at 20bb does not work. If you 3-bet to ~5.5bb and MP 4-bets, you are committed with only ~14.5bb behind. Since you are getting it in regardless, jam from the start to maximize fold equity. There is no room for a small 3-bet at this stack depth.',
    },
  },
];

export const SPOT_TEMPLATES = templates;

export function getTemplate(id: string): SpotTemplate | undefined {
  return templates.find(t => t.id === id);
}
