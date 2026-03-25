// Progress persistence layer — localStorage-backed
// Stores drill results, assessment results, and streak tracking

import type { AssessmentResponse, LeakScore } from '@/lib/types/models';
import { ResultClass } from '@/lib/types/enums';

// ── Storage keys ──
const KEYS = {
  DRILL_HISTORY: 'poker-trainer-drill-history',
  ASSESSMENT_HISTORY: 'poker-trainer-assessment-history',
  STREAK: 'poker-trainer-streak',
} as const;

// ── Types ──
export interface DrillRecord {
  id: string;
  moduleId: string;
  correct: number;
  total: number;
  accuracy: number;
  timestamp: string; // ISO
}

export interface AssessmentRecord {
  id: string;
  overallScore: number;
  responses: AssessmentResponse[];
  leakScores: LeakScore[];
  timestamp: string; // ISO
}

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface ProgressStats {
  drillsCompleted: number;
  spotsPracticed: number;
  accuracyRate: number | null; // null = no data
  streakDays: number;
  drillHistory: DrillRecord[];
  assessmentHistory: AssessmentRecord[];
  /** Best leak scores from most recent assessment */
  latestLeakScores: LeakScore[] | null;
}

// ── Helpers ──
function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private browsing — silently fail
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Public API ──

/** Save a completed drill session */
export function saveDrillResult(moduleId: string, correct: number, total: number): DrillRecord {
  const record: DrillRecord = {
    id: uuid(),
    moduleId,
    correct,
    total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    timestamp: new Date().toISOString(),
  };

  const history = safeGet<DrillRecord[]>(KEYS.DRILL_HISTORY) ?? [];
  history.push(record);
  safeSet(KEYS.DRILL_HISTORY, history);

  // Update streak
  updateStreak();

  return record;
}

/** Save a completed assessment */
export function saveAssessmentResult(
  responses: AssessmentResponse[],
  leakScores: LeakScore[],
  overallScore: number
): AssessmentRecord {
  const record: AssessmentRecord = {
    id: uuid(),
    overallScore,
    responses,
    leakScores,
    timestamp: new Date().toISOString(),
  };

  const history = safeGet<AssessmentRecord[]>(KEYS.ASSESSMENT_HISTORY) ?? [];
  history.push(record);
  safeSet(KEYS.ASSESSMENT_HISTORY, history);

  // Update streak
  updateStreak();

  return record;
}

/** Update the daily streak */
function updateStreak(): void {
  const today = todayStr();
  const data = safeGet<StreakData>(KEYS.STREAK);

  if (!data) {
    safeSet(KEYS.STREAK, { currentStreak: 1, lastActiveDate: today });
    return;
  }

  if (data.lastActiveDate === today) return; // already counted today

  // Check if yesterday was active
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (data.lastActiveDate === yesterdayStr) {
    // Consecutive day
    safeSet(KEYS.STREAK, { currentStreak: data.currentStreak + 1, lastActiveDate: today });
  } else {
    // Streak broken, restart
    safeSet(KEYS.STREAK, { currentStreak: 1, lastActiveDate: today });
  }
}

/** Get aggregated progress stats for the Progress page */
export function getProgressStats(): ProgressStats {
  const drillHistory = safeGet<DrillRecord[]>(KEYS.DRILL_HISTORY) ?? [];
  const assessmentHistory = safeGet<AssessmentRecord[]>(KEYS.ASSESSMENT_HISTORY) ?? [];
  const streakData = safeGet<StreakData>(KEYS.STREAK);

  // Total spots practiced (drills + assessment hands)
  const drillSpots = drillHistory.reduce((sum, d) => sum + d.total, 0);
  const assessmentSpots = assessmentHistory.reduce((sum, a) => sum + a.responses.length, 0);

  // Overall accuracy across all drills
  const totalCorrect = drillHistory.reduce((sum, d) => sum + d.correct, 0);
  const totalAnswered = drillHistory.reduce((sum, d) => sum + d.total, 0);

  // Include assessment accuracy too
  const assessCorrect = assessmentHistory.reduce((sum, a) =>
    sum + a.responses.filter(r => r.result === ResultClass.CORRECT).length, 0);
  const assessTotal = assessmentHistory.reduce((sum, a) => sum + a.responses.length, 0);

  const allCorrect = totalCorrect + assessCorrect;
  const allTotal = totalAnswered + assessTotal;

  // Streak: check if still active
  let streakDays = 0;
  if (streakData) {
    const today = todayStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (streakData.lastActiveDate === today || streakData.lastActiveDate === yesterdayStr) {
      streakDays = streakData.currentStreak;
    }
    // else streak has expired
  }

  // Latest leak scores from most recent assessment
  const latestAssessment = assessmentHistory.length > 0
    ? assessmentHistory[assessmentHistory.length - 1]
    : null;

  return {
    drillsCompleted: drillHistory.length,
    spotsPracticed: drillSpots + assessmentSpots,
    accuracyRate: allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : null,
    streakDays,
    drillHistory,
    assessmentHistory,
    latestLeakScores: latestAssessment?.leakScores ?? null,
  };
}
