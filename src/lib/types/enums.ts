// Poker domain enums - the controlled vocabulary for the entire app

export enum Position {
  UTG = 'utg',
  UTG1 = 'utg1',
  MP = 'mp',
  LJ = 'lj',
  HJ = 'hj',
  CO = 'co',
  BTN = 'btn',
  SB = 'sb',
  BB = 'bb',
}

export enum StackDepth {
  TEN_BB = 10,
  FIFTEEN_BB = 15,
  TWENTY_BB = 20,
  TWENTY_FIVE_BB = 25,
  THIRTY_BB = 30,
}

export enum SimplifiedAction {
  FOLD = 'fold',
  OPEN = 'open',
  CALL = 'call',
  JAM = 'jam',
  RAISE_FOLD = 'raise_fold',
  RAISE_CALL = 'raise_call',
  LIMP = 'limp',
}

export enum SpotType {
  UNOPENED = 'unopened',
  FACING_OPEN = 'facing_open',
  FACING_3BET = 'facing_3bet',
  SB_UNOPENED = 'sb_unopened',
  SB_LIMP_BRANCH = 'sb_limp_branch',
  BB_VS_SB = 'bb_vs_sb',
  // V2: multi-way and limped pot scenarios
  LIMPED_POT = 'limped_pot',
  FACING_LIMP = 'facing_limp',
  MULTI_WAY = 'multi_way',
}

export enum CurriculumPhase {
  FOUNDATIONS = 'foundations',
  POSITION_MASTERY = 'position_mastery',
  ASSESSMENT = 'assessment',
  STACK_DEPTH = 'stack_depth',
}

export enum QuestionType {
  HAND_DECISION = 'hand_decision',
  CONCEPT_MULTIPLE_CHOICE = 'concept_multiple_choice',
  POSITION_IDENTIFY = 'position_identify',
  TRUE_FALSE = 'true_false',
}

export enum DifficultyBand {
  EASY = 'easy',
  MEDIUM = 'medium',
  THRESHOLD = 'threshold',
}

export enum ResultClass {
  CORRECT = 'correct',
  ACCEPTABLE = 'acceptable',
  LEAK = 'leak',
}

export enum LeakCategoryId {
  POSITION_KNOWLEDGE = 'position_knowledge',
  EP_DISCIPLINE = 'early_position_discipline',
  LP_PRESSURE = 'late_position_pressure',
  TWENTY_BB_COMMITMENT = '20bb_commitment_logic',
  FIFTEEN_BB_RAISE_JAM = '15bb_raise_fold_vs_jam',
  TEN_BB_PUSH_FOLD = '10bb_push_fold',
  SB_FUNDAMENTALS = 'small_blind_fundamentals',
  FACING_3BETS = 'facing_3bets',
  FACING_OPENS = 'facing_opens',
}

export enum ComplexityMode {
  CORE = 'core',
  COACH = 'coach',
  ADVANCED = 'advanced',
}

export enum ScoreBand {
  STRONG = 'strong',
  NEEDS_WORK = 'needs_work',
  CRITICAL_LEAK = 'critical_leak',
}

// Display helpers

export const POSITION_LABELS: Record<Position, string> = {
  [Position.UTG]: 'UTG',
  [Position.UTG1]: 'UTG+1',
  [Position.MP]: 'MP',
  [Position.LJ]: 'LJ',
  [Position.HJ]: 'HJ',
  [Position.CO]: 'CO',
  [Position.BTN]: 'BTN',
  [Position.SB]: 'SB',
  [Position.BB]: 'BB',
};

export const POSITION_FULL_NAMES: Record<Position, string> = {
  [Position.UTG]: 'Under the Gun (first to act)',
  [Position.UTG1]: 'Under the Gun +1 (second to act)',
  [Position.MP]: 'Middle Position',
  [Position.LJ]: 'Lojack (middle-late position)',
  [Position.HJ]: 'Hijack (two before the button)',
  [Position.CO]: 'Cutoff (one before the button)',
  [Position.BTN]: 'Button (best position, last to act)',
  [Position.SB]: 'Small Blind',
  [Position.BB]: 'Big Blind',
};

export const ACTION_LABELS: Record<SimplifiedAction, string> = {
  [SimplifiedAction.FOLD]: 'Fold',
  [SimplifiedAction.OPEN]: 'Raise',
  [SimplifiedAction.CALL]: 'Call',
  [SimplifiedAction.JAM]: 'All In',
  [SimplifiedAction.RAISE_FOLD]: 'Raise / Fold',
  [SimplifiedAction.RAISE_CALL]: 'Raise / Call',
  [SimplifiedAction.LIMP]: 'Limp',
};
