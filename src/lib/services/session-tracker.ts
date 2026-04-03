/**
 * Session tracker — logs every app visit (guest + registered) to Supabase.
 * Provides admin visibility into daily usage: who's connecting, how long, how much they play.
 *
 * Usage: call startSession() once on app mount (in layout.tsx AuthGate).
 * It handles heartbeat updates and hand counting automatically.
 */

import { supabase } from './supabase';

let currentSessionId: string | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// ── Device fingerprint (anonymous, non-identifying) ──
function getDeviceFingerprint(): string {
  // Check for a stored fingerprint first (persists across visits)
  const stored = typeof window !== 'undefined' ? localStorage.getItem('poker-trainer-device-fp') : null;
  if (stored) return stored;

  // Generate a simple fingerprint from browser characteristics
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const scr = typeof screen !== 'undefined' ? screen : null;

  const raw = [
    nav?.userAgent || '',
    nav?.language || '',
    scr?.width || 0,
    scr?.height || 0,
    scr?.colorDepth || 0,
    Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || '',
  ].join('|');

  // Simple hash (djb2)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) & 0xffffffff;
  }
  const fp = 'fp_' + Math.abs(hash).toString(36);

  // Store for future visits
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('poker-trainer-device-fp', fp); } catch { /* ok */ }
  }

  return fp;
}

// ── Start a session ──
export async function startSession(userId: string | null, isGuest: boolean): Promise<void> {
  // Don't double-start
  if (currentSessionId) return;

  const fingerprint = getDeviceFingerprint();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

  const { data, error } = await supabase
    .from('app_sessions')
    .insert({
      user_id: userId || null,
      device_fingerprint: fingerprint,
      is_guest: isGuest || !userId,
      mode: 'play',
      hands_played: 0,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Session tracking: insert failed', error.message);
    return;
  }

  currentSessionId = data.id;

  // Heartbeat: update last_active_at every 60 seconds
  heartbeatInterval = setInterval(() => {
    if (currentSessionId) {
      supabase
        .from('app_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', currentSessionId)
        .then(({ error }) => {
          if (error) console.error('Session heartbeat failed:', error.message);
        });
    }
  }, 60000);

  // Stop heartbeat when page unloads
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', endSession);
    // Also send a final update via sendBeacon for reliability
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && currentSessionId) {
        // Use sendBeacon as a last-resort update — heartbeat covers most cases
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/app_sessions?id=eq.${currentSessionId}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Prefer': 'return=minimal',
        };
        try {
          navigator.sendBeacon(url, new Blob(
            [JSON.stringify({ last_active_at: new Date().toISOString() })],
            { type: 'application/json' }
          ));
        } catch { /* sendBeacon not available — heartbeat already covered this */ }
      }
    });
  }
}

// ── End the session (cleanup) ──
export function endSession(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  currentSessionId = null;
}

// ── Increment hands played for current session ──
export async function trackHandPlayed(count: number = 1): Promise<void> {
  if (!currentSessionId) return;

  // Use raw SQL increment to avoid race conditions
  const { error } = await supabase.rpc('increment_session_hands', {
    session_id: currentSessionId,
    hand_count: count,
  });

  // Fallback: if RPC doesn't exist yet, do a read-then-write
  if (error) {
    const { data } = await supabase
      .from('app_sessions')
      .select('hands_played')
      .eq('id', currentSessionId)
      .single();

    if (data) {
      await supabase
        .from('app_sessions')
        .update({
          hands_played: (data.hands_played || 0) + count,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);
    }
  }
}

// ── Update the current session's mode ──
export async function updateSessionMode(mode: 'play' | 'train'): Promise<void> {
  if (!currentSessionId) return;

  await supabase
    .from('app_sessions')
    .update({ mode, last_active_at: new Date().toISOString() })
    .eq('id', currentSessionId);
}

// ── Admin: get daily stats ──
export async function getDailyStats(date?: string): Promise<DailyStatsResult> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .rpc('get_daily_stats', { target_date: targetDate });

  if (error || !data) {
    console.error('Failed to fetch daily stats:', error?.message);
    return getEmptyStats(targetDate);
  }

  return data as DailyStatsResult;
}

// ── Admin: get stats for multiple days (for trends) ──
export async function getStatsRange(days: number = 7): Promise<DailyStatsResult[]> {
  const results: DailyStatsResult[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const stats = await getDailyStats(dateStr);
    results.push(stats);
  }

  return results;
}

// ── Types ──
export interface DailyStatsResult {
  date: string;
  total_sessions: number;
  registered_sessions: number;
  guest_sessions: number;
  unique_devices: number;
  returning_devices: number;
  total_hands: number;
  avg_hands: number;
  avg_duration_seconds: number;
  play_sessions: number;
  train_sessions: number;
}

function getEmptyStats(date: string): DailyStatsResult {
  return {
    date,
    total_sessions: 0,
    registered_sessions: 0,
    guest_sessions: 0,
    unique_devices: 0,
    returning_devices: 0,
    total_hands: 0,
    avg_hands: 0,
    avg_duration_seconds: 0,
    play_sessions: 0,
    train_sessions: 0,
  };
}
