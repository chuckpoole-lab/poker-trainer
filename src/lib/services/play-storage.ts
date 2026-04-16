/**
 * Play mode storage — Daily Hands results, Poker IQ, leaderboard, survival scores.
 * Follows the same patterns as cloud-storage.ts and league-storage.ts.
 */

import { supabase } from './supabase';

// Timezone: all daily/streak dates use Eastern Time (America/New_York) to match
// progress-storage.ts, session-tracker.ts, and the Supabase get_daily_stats function.
// Using UTC causes evening users' plays to log as tomorrow's date (7 PM ET = next-day
// UTC), which breaks streak continuity and hides today's challenge from the user.
function easternTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function easternYesterdayStr(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// ============ USER PREFERENCES ============

/** Get the user's preferred mode ('play' or 'train') */
export async function getUserPreferredMode(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('preferred_mode')
    .eq('id', userId)
    .single();
  return data?.preferred_mode ?? 'play';
}

/** Set the user's preferred mode */
export async function setUserPreferredMode(userId: string, mode: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ preferred_mode: mode })
    .eq('id', userId);
  if (error) console.error('Failed to set mode:', error.message);
}

/** Get user's Poker IQ */
export async function getUserPokerIQ(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('poker_iq')
    .eq('id', userId)
    .single();
  return data?.poker_iq ?? 100;
}

/** Update user's Poker IQ */
export async function updateUserPokerIQ(userId: string, newIQ: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ poker_iq: newIQ })
    .eq('id', userId);
  if (error) console.error('Failed to update IQ:', error.message);
}

/** Set user's league affiliation */
export async function setUserLeague(userId: string, leagueSlug: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ league_slug: leagueSlug })
    .eq('id', userId);
  if (error) console.error('Failed to set league:', error.message);
}

// ============ DAILY CHALLENGE RESULTS ============

export interface DailyChallengeResult {
  id: string;
  user_id: string;
  challenge_date: string;
  score: number;
  total: number;
  hand_results: boolean[];
  iq_before: number;
  iq_after: number;
  completed_at: string;
}

/** Check if user already completed today's challenge */
export async function getTodaysChallenge(userId: string): Promise<DailyChallengeResult | null> {
  const today = easternTodayStr();
  const { data, error } = await supabase
    .from('daily_challenge_results')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .single();

  if (error) return null;
  return data as DailyChallengeResult;
}

/** Save today's daily challenge result */
export async function saveDailyChallengeResult(
  userId: string,
  score: number,
  total: number,
  handResults: boolean[],
  iqBefore: number,
  iqAfter: number,
): Promise<DailyChallengeResult | null> {
  const today = easternTodayStr();

  const { data, error } = await supabase
    .from('daily_challenge_results')
    .upsert({
      user_id: userId,
      challenge_date: today,
      score,
      total,
      hand_results: handResults,
      iq_before: iqBefore,
      iq_after: iqAfter,
    }, { onConflict: 'user_id,challenge_date' })
    .select()
    .single();

  if (error) {
    console.error('Failed to save daily result:', error.message);
    return null;
  }

  // Update the user's IQ in their profile
  await updateUserPokerIQ(userId, iqAfter);

  // Update their streak
  await updatePlayStreak(userId);

  return data as DailyChallengeResult;
}

/** Get user's daily challenge history */
export async function getDailyChallengeHistory(userId: string, limit = 30): Promise<DailyChallengeResult[]> {
  const { data, error } = await supabase
    .from('daily_challenge_results')
    .select('*')
    .eq('user_id', userId)
    .order('challenge_date', { ascending: false })
    .limit(limit);

  if (error) { console.error('Failed to fetch daily history:', error.message); return []; }
  return (data ?? []) as DailyChallengeResult[];
}

// ============ STREAKS (reuses user_streaks table) ============

async function updatePlayStreak(userId: string): Promise<void> {
  const today = easternTodayStr();

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    return;
  }

  if (existing.last_activity_date === today) return;

  const yesterdayStr = easternYesterdayStr();

  const newStreak = existing.last_activity_date === yesterdayStr
    ? existing.current_streak + 1
    : 1;

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: Math.max(newStreak, existing.longest_streak),
    last_activity_date: today,
  }).eq('user_id', userId);
}

// ============ LEADERBOARD ============

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  poker_iq: number;
  current_streak: number;
}

/** Get league leaderboard (or global if no league specified) */
export async function getLeaderboard(leagueSlug?: string | null, limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .rpc('get_league_leaderboard', {
      league: leagueSlug ?? null,
      lim: limit,
    });

  if (error) {
    console.error('Failed to fetch leaderboard:', error.message);
    return [];
  }
  return (data ?? []) as LeaderboardEntry[];
}

/** Get user's rank in the leaderboard */
export async function getUserRank(userId: string, leagueSlug?: string | null): Promise<number> {
  const board = await getLeaderboard(leagueSlug, 100);
  const idx = board.findIndex(e => e.user_id === userId);
  return idx >= 0 ? idx + 1 : board.length + 1;
}

/** Get user's rank AND total player count */
export async function getUserRankWithCount(userId: string, leagueSlug?: string | null): Promise<{ rank: number; total: number }> {
  // Get a larger leaderboard to find the user and count players
  const board = await getLeaderboard(leagueSlug, 500);
  const idx = board.findIndex(e => e.user_id === userId);
  const rank = idx >= 0 ? idx + 1 : board.length + 1;
  const total = Math.max(board.length, rank);
  return { rank, total };
}

// ============ SURVIVAL MODE ============

/** Save a survival mode score */
export async function saveSurvivalScore(userId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from('survival_scores')
    .insert({ user_id: userId, score });
  if (error) console.error('Failed to save survival score:', error.message);
}

/** Get user's best survival score */
export async function getBestSurvivalScore(userId: string): Promise<number> {
  const { data } = await supabase
    .from('survival_scores')
    .select('score')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .single();

  return data?.score ?? 0;
}

// ============ BADGES ============

export interface UserBadge {
  badge_id: string;
  badge_label: string;
  earned_at: string;
}

/** Get user's earned badges */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, badge_label, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true });

  if (error) { console.error('Failed to fetch badges:', error.message); return []; }
  return (data ?? []) as UserBadge[];
}

/** Award a badge (idempotent — skips if already earned) */
export async function awardBadge(userId: string, badgeId: string, label: string): Promise<void> {
  const { error } = await supabase
    .from('user_badges')
    .upsert({ user_id: userId, badge_id: badgeId, badge_label: label },
      { onConflict: 'user_id,badge_id' });
  if (error) console.error('Failed to award badge:', error.message);
}

/** Check and award badges based on stats */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  const [history, streak, survivalBest] = await Promise.all([
    getDailyChallengeHistory(userId, 100),
    supabase.from('user_streaks').select('*').eq('user_id', userId).single().then(r => r.data),
    getBestSurvivalScore(userId),
  ]);

  const totalPlayed = history.length;
  const perfectGames = history.filter(h => h.score === h.total).length;
  const currentStreak = streak?.current_streak ?? 0;

  // Badge definitions
  const badges: Array<{ id: string; label: string; condition: boolean }> = [
    { id: 'first_daily', label: 'First daily challenge', condition: totalPlayed >= 1 },
    { id: 'daily_10', label: 'Ten days strong', condition: totalPlayed >= 10 },
    { id: 'daily_30', label: 'Monthly grinder', condition: totalPlayed >= 30 },
    { id: 'perfect_score', label: 'Perfect 5/5', condition: perfectGames >= 1 },
    { id: 'perfect_5', label: 'Five perfect games', condition: perfectGames >= 5 },
    { id: 'streak_7', label: 'Week-long streak', condition: currentStreak >= 7 },
    { id: 'streak_30', label: 'Monthly streak', condition: currentStreak >= 30 },
    { id: 'survival_10', label: 'Survived 10 hands', condition: survivalBest >= 10 },
    { id: 'survival_25', label: 'Survived 25 hands', condition: survivalBest >= 25 },
    { id: 'iq_150', label: 'IQ 150 club', condition: false }, // checked separately with profile data
  ];

  for (const badge of badges) {
    if (badge.condition) {
      await awardBadge(userId, badge.id, badge.label);
    }
  }
}

// ============ HAND LOGGER (Train Mode) ============

export interface HandLogSession {
  id: string;
  user_id: string;
  session_date: string;
  format: string;
  game_name: string | null;
  venue: string | null;
  created_at: string;
}

/** Create a hand log session */
export async function createHandLogSession(
  userId: string,
  sessionDate: string,
  format: string,
  gameName?: string,
  venue?: string,
): Promise<HandLogSession | null> {
  const { data, error } = await supabase
    .from('hand_log_sessions')
    .insert({
      user_id: userId,
      session_date: sessionDate,
      format,
      game_name: gameName || null,
      venue: venue || null,
    })
    .select()
    .single();

  if (error) { console.error('Failed to create session:', error.message); return null; }
  return data as HandLogSession;
}

/** Get user's hand log sessions */
export async function getHandLogSessions(userId: string, limit = 20): Promise<HandLogSession[]> {
  const { data, error } = await supabase
    .from('hand_log_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) { console.error('Failed to fetch sessions:', error.message); return []; }
  return (data ?? []) as HandLogSession[];
}

/** Save a hand log entry */
export async function saveHandLogEntry(
  sessionId: string,
  userId: string,
  mode: string,
  handData: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('hand_log_entries')
    .insert({
      session_id: sessionId,
      user_id: userId,
      mode,
      hand_data: handData,
    });
  if (error) console.error('Failed to save hand log:', error.message);
}

/** Get hand log entries for a session */
export async function getHandLogEntries(sessionId: string): Promise<Array<{ id: string; mode: string; hand_data: Record<string, unknown>; created_at: string }>> {
  const { data, error } = await supabase
    .from('hand_log_entries')
    .select('id, mode, hand_data, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) { console.error('Failed to fetch hand logs:', error.message); return []; }
  return data ?? [];
}

/** Get all hand log entries for a user (for analytics) */
export async function getAllHandLogEntries(userId: string): Promise<Array<{ id: string; mode: string; hand_data: Record<string, unknown>; created_at: string }>> {
  const { data, error } = await supabase
    .from('hand_log_entries')
    .select('id, mode, hand_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('Failed to fetch all hand logs:', error.message); return []; }
  return data ?? [];
}

// ============ GUEST FALLBACK ============

const GUEST_PREFIX = 'poker-trainer-';

/** Save data to localStorage for guest users */
export function saveGuestData(key: string, data: unknown): void {
  try {
    localStorage.setItem(`${GUEST_PREFIX}${key}`, JSON.stringify(data));
  } catch { /* storage full or unavailable */ }
}

/** Load data from localStorage for guest users */
export function loadGuestData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${GUEST_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}


// ============ TESTER FEEDBACK ============

export interface TesterFeedback {
  id: string;
  user_id: string | null;
  q1_fun: number;
  q2_ease: number;
  q3_tips: number;
  q4_recommend: number;
  q5_return: number;
  freeform: string | null;
  tester_name: string | null;
  tester_email: string | null;
  submitted_at: string;
}

/** Submit tester feedback */
export async function submitFeedback(
  userId: string | null,
  data: {
    q1: number; q2: number; q3: number; q4: number; q5: number;
    freeform: string; name: string; email: string;
  },
): Promise<boolean> {
  const { error } = await supabase
    .from('tester_feedback')
    .insert({
      user_id: userId,
      q1_fun: data.q1,
      q2_ease: data.q2,
      q3_tips: data.q3,
      q4_recommend: data.q4,
      q5_return: data.q5,
      freeform: data.freeform || null,
      tester_name: data.name || null,
      tester_email: data.email || null,
    });
  if (error) {
    console.error('Failed to submit feedback:', error.message);
    return false;
  }
  return true;
}

/** Get all feedback (admin only) */
export async function getAllFeedback(): Promise<TesterFeedback[]> {
  const { data, error } = await supabase
    .from('tester_feedback')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) { console.error('Failed to fetch feedback:', error.message); return []; }
  return (data ?? []) as TesterFeedback[];
}

// ============ FLAGGED HANDS ============

export interface FlaggedHandData {
  handCode: string;
  position: string;
  stack: string;
  situation: string;
  cards: Array<{ rank: string; suit: string }>;
  appAction: string;
  userAction: string | null;
  explanation: string;
  note: string;
  isBonus: boolean;
}

export interface FlaggedHand {
  id: string;
  user_id: string | null;
  hand_code: string;
  position: string;
  stack: string;
  situation: string;
  card1_rank: string;
  card1_suit: string;
  card2_rank: string;
  card2_suit: string;
  app_action: string;
  user_action: string | null;
  explanation: string;
  note: string;
  is_bonus: boolean;
  flagged_at: string;
  status: string;
  reviewer_note: string;
  reviewed_at: string | null;
}

/** Flag a hand for review */
export async function flagHand(
  userId: string | null,
  data: FlaggedHandData,
): Promise<boolean> {
  const { error } = await supabase
    .from('flagged_hands')
    .insert({
      user_id: userId,
      hand_code: data.handCode,
      position: data.position,
      stack: data.stack,
      situation: data.situation,
      card1_rank: data.cards[0]?.rank || '',
      card1_suit: data.cards[0]?.suit || '',
      card2_rank: data.cards[1]?.rank || '',
      card2_suit: data.cards[1]?.suit || '',
      app_action: data.appAction,
      user_action: data.userAction,
      explanation: data.explanation,
      note: data.note,
      is_bonus: data.isBonus,
    });

  if (error) {
    console.error('Failed to flag hand:', error.message);
    // Fallback: save to localStorage for guests or if Supabase fails
    const flags = loadGuestData<FlaggedHandData[]>('flagged-hands', []);
    flags.push(data);
    saveGuestData('flagged-hands', flags);
    return false;
  }
  return true;
}

/** Get all flagged hands (admin only) */
export async function getAllFlaggedHands(): Promise<FlaggedHand[]> {
  const { data, error } = await supabase
    .from('flagged_hands')
    .select('*')
    .order('flagged_at', { ascending: false });

  if (error) { console.error('Failed to fetch flagged hands:', error.message); return []; }
  return (data ?? []) as FlaggedHand[];
}

/** Update flagged hand status (admin only) */
export async function updateFlaggedHandStatus(
  flagId: string,
  status: 'open' | 'agreed' | 'adjusted' | 'dismissed',
  reviewerNote: string,
  reviewerId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('flagged_hands')
    .update({
      status,
      reviewer_note: reviewerNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', flagId);

  if (error) { console.error('Failed to update flag:', error.message); return false; }
  return true;
}
