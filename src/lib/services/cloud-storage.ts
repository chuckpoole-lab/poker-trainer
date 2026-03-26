/**
 * Cloud storage layer — syncs data to Supabase for signed-in users.
 * Falls back to localStorage for guests (via existing progress-storage.ts).
 */

import { supabase } from './supabase';

// ============ ASSESSMENT RESULTS ============

export async function saveAssessmentToCloud(
  userId: string,
  responses: unknown[],
  leakScores: unknown[],
  overallScore: number,
): Promise<void> {
  const { error } = await supabase.from('assessment_results').insert({
    user_id: userId,
    responses,
    leak_scores: leakScores,
    overall_score: overallScore,
  });
  if (error) console.error('Failed to save assessment:', error.message);
}

export async function getAssessmentHistory(userId: string) {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) { console.error('Failed to fetch assessments:', error.message); return []; }
  return data ?? [];
}

export async function getLatestAssessment(userId: string) {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

// ============ DRILL RESULTS ============

export async function saveDrillToCloud(
  userId: string,
  moduleId: string,
  correct: number,
  total: number,
): Promise<void> {
  const { error } = await supabase.from('drill_results').insert({
    user_id: userId,
    module_id: moduleId,
    correct,
    total,
  });
  if (error) console.error('Failed to save drill:', error.message);

  // Update streak
  await updateStreak(userId);
}

export async function getDrillHistory(userId: string) {
  const { data, error } = await supabase
    .from('drill_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) { console.error('Failed to fetch drills:', error.message); return []; }
  return data ?? [];
}

// ============ STREAKS ============

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    // First time
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    return;
  }

  const lastDate = existing.last_activity_date;
  if (lastDate === today) return; // Already recorded today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    newStreak = existing.current_streak + 1;
  } else {
    newStreak = 1; // streak broken
  }

  const longestStreak = Math.max(newStreak, existing.longest_streak);

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_activity_date: today,
  }).eq('user_id', userId);
}

export async function getStreak(userId: string) {
  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null };
}

// ============ CLOUD PROGRESS STATS ============

export async function getCloudProgressStats(userId: string) {
  const [drills, assessments, streak] = await Promise.all([
    getDrillHistory(userId),
    getAssessmentHistory(userId),
    getStreak(userId),
  ]);

  const totalDrills = drills.length;
  const totalSpots = drills.reduce((sum: number, d: { total: number }) => sum + d.total, 0);
  const totalCorrect = drills.reduce((sum: number, d: { correct: number }) => sum + d.correct, 0);
  const accuracy = totalSpots > 0 ? Math.round((totalCorrect / totalSpots) * 100) : 0;

  // Get latest assessment leak scores
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return {
    drillsCompleted: totalDrills,
    spotsPracticed: totalSpots,
    accuracyRate: accuracy,
    streakDays: streak.current_streak,
    longestStreak: streak.longest_streak,
    latestLeakScores: latestAssessment?.leak_scores ?? [],
    latestOverallScore: latestAssessment?.overall_score ?? 0,
    totalAssessments: assessments.length,
  };
}

// ============ ADMIN: ALL USERS ============

export async function getAllUsersStats() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url, is_admin, created_at');

  if (error || !profiles) return [];

  // Fetch stats for all users in parallel
  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      const [drills, assessments, streak] = await Promise.all([
        getDrillHistory(profile.id),
        getAssessmentHistory(profile.id),
        getStreak(profile.id),
      ]);

      const totalSpots = drills.reduce((sum: number, d: { total: number }) => sum + d.total, 0);
      const totalCorrect = drills.reduce((sum: number, d: { correct: number }) => sum + d.correct, 0);
      const latestAssessment = assessments.length > 0 ? assessments[0] : null;

      return {
        ...profile,
        drillsCompleted: drills.length,
        spotsPracticed: totalSpots,
        accuracy: totalSpots > 0 ? Math.round((totalCorrect / totalSpots) * 100) : 0,
        currentStreak: streak.current_streak,
        latestScore: latestAssessment?.overall_score ?? null,
        lastActive: drills[0]?.completed_at ?? assessments[0]?.completed_at ?? profile.created_at,
      };
    })
  );

  return usersWithStats;
}

// ============ GUEST DATA MIGRATION ============

export async function migrateGuestDataToCloud(userId: string): Promise<void> {
  try {
    // Read guest data from localStorage
    const drillHistoryRaw = localStorage.getItem('poker-trainer-drill-history');
    const assessmentHistoryRaw = localStorage.getItem('poker-trainer-assessment-history');
    const streakRaw = localStorage.getItem('poker-trainer-streak');

    // Migrate drill history
    if (drillHistoryRaw) {
      const drills = JSON.parse(drillHistoryRaw);
      for (const drill of drills) {
        await supabase.from('drill_results').insert({
          user_id: userId,
          module_id: drill.moduleId ?? 'mixed',
          correct: drill.correct ?? 0,
          total: drill.total ?? 0,
          completed_at: drill.timestamp ?? new Date().toISOString(),
        });
      }
    }

    // Migrate assessment history
    if (assessmentHistoryRaw) {
      const assessments = JSON.parse(assessmentHistoryRaw);
      for (const assessment of assessments) {
        await supabase.from('assessment_results').insert({
          user_id: userId,
          responses: assessment.responses ?? [],
          leak_scores: assessment.leakScores ?? [],
          overall_score: assessment.overall ?? 0,
          completed_at: assessment.timestamp ?? new Date().toISOString(),
        });
      }
    }

    // Migrate streak
    if (streakRaw) {
      const streak = JSON.parse(streakRaw);
      await supabase.from('user_streaks').upsert({
        user_id: userId,
        current_streak: streak.currentStreak ?? 0,
        longest_streak: streak.longestStreak ?? 0,
        last_activity_date: streak.lastActivityDate ?? null,
      });
    }

    // Clear guest data after successful migration
    localStorage.removeItem('poker-trainer-drill-history');
    localStorage.removeItem('poker-trainer-assessment-history');
    localStorage.removeItem('poker-trainer-streak');
    localStorage.removeItem('poker-trainer-guest');

    console.log('Guest data migrated to cloud successfully');
  } catch (err) {
    console.error('Failed to migrate guest data:', err);
  }
}
