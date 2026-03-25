import {
  Position,
  SimplifiedAction,
  SpotType,
  DifficultyBand,
  ResultClass,
  LeakCategoryId,
  ScoreBand,
  ComplexityMode,
  CurriculumPhase,
  QuestionType,
} from './enums';

// Core poker content types

export interface SpotTemplate {
  id: string;
  stackDepthBb: number;
  position: Position;
  spotType: SpotType;
  actionHistory: string;
}

export interface Explanation {
  plain: string;
  poker: string;
  pattern: string;
  advanced?: string;
}

/**
 * Per-action "why" explanations that address the specific choice the user made.
 * Keys are SimplifiedAction values. Each string explains why that action is
 * correct, acceptable, or a mistake for the given spot.
 */
export interface ActionExplanations {
  [action: string]: string;
}

export interface SpotDecision {
  id: string;
  spotTemplateId: string;
  handCode: string;
  baselineAction: SimplifiedAction;
  simplifiedAction: SimplifiedAction;
  acceptableActions: SimplifiedAction[];
  difficultyBand: DifficultyBand;
  leakCategory: LeakCategoryId;
  explanation: Explanation;
  /** Per-action "why" explanations — keyed by the universal button action (fold/open/call/jam) */
  actionExplanations?: ActionExplanations;
  assessmentOrder?: number;
}

export interface LeakCategory {
  id: LeakCategoryId;
  name: string;
  displayName: string;
  description: string;
  importanceWeight: number;
  studyPriorityOrder: number;
}

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  curriculumPhase: CurriculumPhase;
  curriculumOrder: number;
  primaryLeakCategory: LeakCategoryId;
  spotPoolSize: number;
  positions: string[];
}

// Conceptual question types for Foundations & Position Mastery phases

export interface ConceptQuestion {
  id: string;
  questionType: QuestionType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string; // grouping: 'positions', 'terminology', 'strategy', 'position_utg', etc.
  phase: CurriculumPhase;
}

export interface PositionLesson {
  positionGroup: string; // 'early', 'middle', 'late', 'blinds'
  positions: Position[];
  title: string;
  description: string;
  keyPoints: string[];
  generalStrategy: string;
  rangeDescription: string; // e.g. "Top 10-12% of hands: big pairs, AK, AQ"
  quizQuestions: ConceptQuestion[];
  handQuizSpotFilters: {
    positions: Position[];
    stackBb: number;
  };
}

// Assessment types

export interface AssessmentSpot {
  spotDecision: SpotDecision;
  template: SpotTemplate;
}

export interface AssessmentResponse {
  spotId: string;
  userAction: SimplifiedAction;
  result: ResultClass;
  score: number;
}

export interface LeakScore {
  categoryId: LeakCategoryId;
  displayName: string;
  score: number;
  band: ScoreBand;
  spotCount: number;
}

export interface AssessmentResult {
  leakScores: LeakScore[];
  overallScore: number;
  suggestedMode: ComplexityMode;
  responses: AssessmentResponse[];
}

export interface StudyPlanItem {
  moduleId: string;
  module: Module;
  priority: number;
  reason: string;
  leakScore: LeakScore;
}

// Drill types

export interface DrillResponse {
  spotId: string;
  userAction: SimplifiedAction;
  result: ResultClass;
  timestamp: Date;
}

export interface DrillSession {
  id: string;
  moduleId: string;
  spots: AssessmentSpot[];
  responses: DrillResponse[];
  startedAt: Date;
  completedAt?: Date;
}

export interface UserSettings {
  complexityMode: ComplexityMode;
  showExploitNotes: boolean;
  showPokerExplanation: boolean;
  showPlainExplanation: boolean;
}

// Concept quiz response tracking

export interface ConceptResponse {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

// User progress through the 4-phase curriculum

export interface UserProgress {
  foundationsComplete: boolean;
  positionMasteryComplete: Record<string, boolean>; // keyed by positionGroup
  assessmentComplete: boolean;
  currentPhase: CurriculumPhase;
}
