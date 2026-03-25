import {
  AssessmentResult,
  LeakScore,
  StudyPlanItem,
  ScoreBand,
} from '@/lib/types';
import { MODULES } from '@/lib/data/categories';

export function generateStudyPlan(result: AssessmentResult): StudyPlanItem[] {
  const { leakScores } = result;

  // Sort leak scores by severity (worst first), then by importance
  const sorted = [...leakScores].sort((a, b) => {
    const bandOrder = { critical_leak: 0, needs_work: 1, strong: 2 };
    const aBand = bandOrder[a.band];
    const bBand = bandOrder[b.band];
    if (aBand !== bBand) return aBand - bBand;
    return a.score - b.score;
  });

  const plan: StudyPlanItem[] = [];
  let priority = 1;

  for (const leak of sorted) {
    // Skip strong categories - no need to study them
    if (leak.band === ScoreBand.STRONG) continue;

    // Find matching modules for this leak category
    const matchingModules = MODULES.filter(
      m => m.primaryLeakCategory === leak.categoryId
    );

    for (const mod of matchingModules) {
      let reason: string;
      if (leak.band === ScoreBand.CRITICAL_LEAK) {
        reason = `Critical leak detected: ${leak.displayName} (${Math.round(leak.score * 100)}%). This needs immediate attention.`;
      } else {
        reason = `Needs work: ${leak.displayName} (${Math.round(leak.score * 100)}%). Targeted drilling will improve consistency.`;
      }

      plan.push({
        moduleId: mod.id,
        module: mod,
        priority: priority,
        reason,
        leakScore: leak,
      });
      priority++;
    }
  }

  return plan;
}
