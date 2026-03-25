import { LeakCategoryId, CurriculumPhase } from '@/lib/types/enums';
import type { LeakCategory, Module } from '@/lib/types/models';

export const LEAK_CATEGORIES: LeakCategory[] = [
  { id: LeakCategoryId.POSITION_KNOWLEDGE, name: 'position_knowledge', displayName: 'Position Knowledge', description: 'Foundational understanding of table positions, terminology, and general strategy concepts.', importanceWeight: 0.5, studyPriorityOrder: 0 },
  { id: LeakCategoryId.EP_DISCIPLINE, name: 'early_position_discipline', displayName: 'Early Position Discipline', description: 'Tests whether the player opens too loose or too tight from early positions.', importanceWeight: 1.0, studyPriorityOrder: 4 },
  { id: LeakCategoryId.LP_PRESSURE, name: 'late_position_pressure', displayName: 'Late Position Pressure', description: 'Tests whether the player misses profitable steals from CO and BTN.', importanceWeight: 1.0, studyPriorityOrder: 3 },
  { id: LeakCategoryId.TWENTY_BB_COMMITMENT, name: '20bb_commitment_logic', displayName: '20bb Commitment Logic', description: 'Tests understanding of raise/fold thresholds and commitment decisions at 20bb.', importanceWeight: 1.3, studyPriorityOrder: 2 },
  { id: LeakCategoryId.FIFTEEN_BB_RAISE_JAM, name: '15bb_raise_fold_vs_jam', displayName: '15bb Raise/Fold vs Jam', description: 'Tests whether the player understands that the raise/fold line bleeds chips at 15bb.', importanceWeight: 1.3, studyPriorityOrder: 1 },
  { id: LeakCategoryId.TEN_BB_PUSH_FOLD, name: '10bb_push_fold', displayName: '10bb Push/Fold', description: 'Tests basic push/fold fundamentals.', importanceWeight: 1.3, studyPriorityOrder: 1 },
  { id: LeakCategoryId.SB_FUNDAMENTALS, name: 'small_blind_fundamentals', displayName: 'Small Blind Fundamentals', description: 'Tests SB-specific aggression and avoiding passive play.', importanceWeight: 1.0, studyPriorityOrder: 6 },
  { id: LeakCategoryId.FACING_3BETS, name: 'facing_3bets', displayName: 'Facing 3-Bets', description: 'Tests continue/fold logic after opening and getting 3-bet.', importanceWeight: 1.0, studyPriorityOrder: 5 },
  { id: LeakCategoryId.FACING_OPENS, name: 'facing_opens', displayName: 'Facing Opens', description: 'Tests 3-bet, call, and fold decisions when another player has already raised.', importanceWeight: 1.2, studyPriorityOrder: 3 },
];

export const MODULES: Module[] = [
  // Phase 1: Foundations (conceptual)
  { id: 'mod_foundations', name: 'poker_foundations', displayName: 'Poker Foundations', description: 'Positions, terminology, and core concepts every player needs to know.', curriculumPhase: CurriculumPhase.FOUNDATIONS, curriculumOrder: 0, primaryLeakCategory: LeakCategoryId.POSITION_KNOWLEDGE, spotPoolSize: 0, positions: [] },

  // Phase 2: Position Mastery (conceptual + hand quizzes)
  { id: 'mod_pos_early', name: 'position_early', displayName: 'Early Position Mastery', description: 'Learn why UTG and UTG+1 demand tight play, then test your hand selection.', curriculumPhase: CurriculumPhase.POSITION_MASTERY, curriculumOrder: 1, primaryLeakCategory: LeakCategoryId.EP_DISCIPLINE, spotPoolSize: 169, positions: ['UTG', 'UTG+1'] },
  { id: 'mod_pos_middle', name: 'position_middle', displayName: 'Middle Position Mastery', description: 'The transition zone: MP, LJ, and HJ strategy with graduated hand ranges.', curriculumPhase: CurriculumPhase.POSITION_MASTERY, curriculumOrder: 2, primaryLeakCategory: LeakCategoryId.EP_DISCIPLINE, spotPoolSize: 169, positions: ['MP', 'LJ', 'HJ'] },
  { id: 'mod_pos_late', name: 'position_late', displayName: 'Late Position Mastery', description: 'CO and BTN are your profit centers. Learn to steal blinds and play wide.', curriculumPhase: CurriculumPhase.POSITION_MASTERY, curriculumOrder: 3, primaryLeakCategory: LeakCategoryId.LP_PRESSURE, spotPoolSize: 169, positions: ['CO', 'BTN'] },
  { id: 'mod_pos_blinds', name: 'position_blinds', displayName: 'Blind Play Mastery', description: 'SB aggression and BB defense: how to play from the worst seats at the table.', curriculumPhase: CurriculumPhase.POSITION_MASTERY, curriculumOrder: 4, primaryLeakCategory: LeakCategoryId.SB_FUNDAMENTALS, spotPoolSize: 169, positions: ['SB', 'BB'] },

  // Phase 3: Assessment-driven modules (existing, renumbered)
  { id: 'mod_facing_opens', name: 'facing_opens', displayName: 'Facing Opens', description: '3-bet, call, or fold vs opens at multiple stack depths and positions.', curriculumPhase: CurriculumPhase.ASSESSMENT, curriculumOrder: 5, primaryLeakCategory: LeakCategoryId.FACING_OPENS, spotPoolSize: 250, positions: ['CO', 'BTN', 'SB', 'BB'] },
  { id: 'mod_facing_3bets', name: 'facing_3bets', displayName: 'Facing 3-Bets', description: 'Responding when your open gets 3-bet at various stack depths.', curriculumPhase: CurriculumPhase.ASSESSMENT, curriculumOrder: 6, primaryLeakCategory: LeakCategoryId.FACING_3BETS, spotPoolSize: 169, positions: ['UTG', 'HJ', 'CO', 'BTN'] },
  { id: 'mod_lp_pressure', name: 'late_position_pressure', displayName: 'Late Position Pressure', description: 'Steal opportunities from CO and BTN at 20-30bb.', curriculumPhase: CurriculumPhase.ASSESSMENT, curriculumOrder: 7, primaryLeakCategory: LeakCategoryId.LP_PRESSURE, spotPoolSize: 169, positions: ['CO', 'BTN'] },

  // Phase 4: Stack Depth modules (existing, pushed later)
  { id: 'mod_10bb_jam', name: '10bb_jam_fundamentals', displayName: '10bb Jam Fundamentals', description: 'Push/fold from HJ, CO, BTN, SB at 10bb.', curriculumPhase: CurriculumPhase.STACK_DEPTH, curriculumOrder: 8, primaryLeakCategory: LeakCategoryId.TEN_BB_PUSH_FOLD, spotPoolSize: 169, positions: ['HJ', 'CO', 'BTN', 'SB'] },
  { id: 'mod_15bb_jam', name: '15bb_raise_fold_basics', displayName: '15bb Raise/Fold vs Jam', description: 'Jam vs raise/fold from HJ, CO, BTN, SB at 15bb.', curriculumPhase: CurriculumPhase.STACK_DEPTH, curriculumOrder: 9, primaryLeakCategory: LeakCategoryId.FIFTEEN_BB_RAISE_JAM, spotPoolSize: 169, positions: ['HJ', 'CO', 'BTN', 'SB'] },
  { id: 'mod_20bb_opening', name: '20bb_opening_discipline', displayName: '20bb Opening Discipline', description: 'Opening ranges and commitment at 20bb across all positions.', curriculumPhase: CurriculumPhase.STACK_DEPTH, curriculumOrder: 10, primaryLeakCategory: LeakCategoryId.TWENTY_BB_COMMITMENT, spotPoolSize: 169, positions: ['UTG', 'HJ', 'CO', 'BTN'] },
  { id: 'mod_30bb_position', name: '30bb_position_fundamentals', displayName: '30bb Position Fundamentals', description: 'Position-aware ranges at 25-30bb from EP through BTN.', curriculumPhase: CurriculumPhase.STACK_DEPTH, curriculumOrder: 11, primaryLeakCategory: LeakCategoryId.EP_DISCIPLINE, spotPoolSize: 169, positions: ['UTG', 'HJ'] },
  { id: 'mod_sb_system', name: 'small_blind_system', displayName: 'Small Blind System', description: 'SB jam ranges and open strategies at 15-25bb.', curriculumPhase: CurriculumPhase.STACK_DEPTH, curriculumOrder: 12, primaryLeakCategory: LeakCategoryId.SB_FUNDAMENTALS, spotPoolSize: 169, positions: ['SB'] },
];
