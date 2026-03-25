import {
  SimplifiedAction,
  ResultClass,
  LeakCategoryId,
  ScoreBand,
  ComplexityMode,
} from '../types/enums';
import type {
  SpotDecision,
  AssessmentResponse,
  LeakScore,
  LeakCategory,
  AssessmentResult,
} from '../types/models';

const LEAK_DISPLAY_NAMES: Record<LeakCategoryId, string> = {
  [LeakCategoryId.POSITION_KNOWLEDGE]: 'Position Knowledge',
  [LeakCategoryId.EP_DISCIPLINE]: 'Early Position Discipline',
  [LeakCategoryId.LP_PRESSURE]: 'Late Position Pressure',
  [LeakCategoryId.TWENTY_BB_COMMITMENT]: '20bb Commitment Logic',
  [LeakCategoryId.FIFTEEN_BB_RAISE_JAM]: '15bb Raise/Fold vs Jam',
  [LeakCategoryId.TEN_BB_PUSH_FOLD]: '10bb Push/Fold',
  [LeakCategoryId.SB_FUNDAMENTALS]: 'Small Blind Fundamentals',
  [LeakCategoryId.FACING_3BETS]: 'Facing 3-Bets',
  [LeakCategoryId.FACING_OPENS]: 'Facing Opens',
};

/**
 * Normalize universal button actions to match spot-specific actions.
 * The UI always shows Fold / Raise / Call / All In, but spots may use
 * OPEN, LIMP, RAISE_FOLD, RAISE_CALL internally.
 */
function actionsMatch(userAction: SimplifiedAction, spotAction: SimplifiedAction): boolean {
  if (userAction === spotAction) return true;
  // "Raise" button (OPEN) matches any raise variant
  if (userAction === SimplifiedAction.OPEN &&
    (spotAction === SimplifiedAction.RAISE_FOLD || spotAction === SimplifiedAction.RAISE_CALL)) return true;
  // "Call" button matches LIMP (calling the BB in an unopened pot)
  if (userAction === SimplifiedAction.CALL && spotAction === SimplifiedAction.LIMP) return true;
  if (userAction === SimplifiedAction.LIMP && spotAction === SimplifiedAction.CALL) return true;
  return false;
}

export function scoreSpot(
  userAction: SimplifiedAction,
  spot: SpotDecision,
): AssessmentResponse {
  let result: ResultClass;
  let score: number;

  if (actionsMatch(userAction, spot.baselineAction)) {
    result = ResultClass.CORRECT;
    score = 1.0;
  } else if (spot.acceptableActions.some(a => actionsMatch(userAction, a))) {
    result = ResultClass.ACCEPTABLE;
    score = 0.7;
  } else {
    result = ResultClass.LEAK;
    score = 0.0;
  }

  return {
    spotId: spot.id,
    userAction,
    result,
    score,
  };
}

/** Convenience wrapper: (spot, action) order for page components */
export function scoreResponse(
  spot: SpotDecision,
  action: SimplifiedAction,
): AssessmentResponse {
  return scoreSpot(action, spot);
}

function getScoreBand(score: number): ScoreBand {
  if (score >= 0.85) return ScoreBand.STRONG;
  if (score >= 0.65) return ScoreBand.NEEDS_WORK;
  return ScoreBand.CRITICAL_LEAK;
}

/** Calculate per-category leak scores from assessment responses */
export function calculateLeakScores(
  responses: AssessmentResponse[],
  spots: SpotDecision[],
  categories: LeakCategory[],
): LeakScore[] {
  const byCategory = new Map<LeakCategoryId, { total: number; sum: number }>();

  for (const resp of responses) {
    const spot = spots.find(s => s.id === resp.spotId);
    if (!spot) continue;
    const cat = spot.leakCategory;
    const entry = byCategory.get(cat) ?? { total: 0, sum: 0 };
    entry.total += 1;
    entry.sum += resp.score;
    byCategory.set(cat, entry);
  }

  return categories
    .filter(cat => byCategory.has(cat.id))
    .map(cat => {
      const entry = byCategory.get(cat.id)!;
      const avg = entry.total > 0 ? entry.sum / entry.total : 0;
      return {
        categoryId: cat.id,
        displayName: cat.displayName,
        score: avg,
        band: getScoreBand(avg),
        spotCount: entry.total,
      };
    });
}
