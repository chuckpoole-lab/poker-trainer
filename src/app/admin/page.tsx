'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';
import { getAllUsersStats, toggleUserAdmin } from '@/lib/services/cloud-storage';
import { getAllFeedback, getAllFlaggedHands, updateFlaggedHandStatus, type TesterFeedback, type FlaggedHand } from '@/lib/services/play-storage';
import { getDailyStats, getStatsRange, type DailyStatsResult } from '@/lib/services/session-tracker';
import { Card, Badge, Button } from '@/components/ui';
import LeagueManager from '@/components/admin/LeagueManager';

interface UserStat {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  pokerIq: number;
  preferred_mode: string | null;
  league_slug: string | null;
  drillsCompleted: number;
  spotsPracticed: number;
  accuracy: number;
  currentStreak: number;
  latestScore: number | null;
  lastActive: string;
  dailyChallengesPlayed: number;
  dailySpotsPlayed: number;
  dailyAccuracy: number;
  latestChallengeDate: string | null;
  todayCompleted: boolean;
}

type AdminTab = 'stats' | 'users' | 'leagues' | 'feedback' | 'flags';

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [feedback, setFeedback] = useState<TesterFeedback[]>([]);
  const [flaggedHands, setFlaggedHands] = useState<FlaggedHand[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStatsResult | null>(null);
  const [yesterdayStats, setYesterdayStats] = useState<DailyStatsResult | null>(null);
  const [weekStats, setWeekStats] = useState<DailyStatsResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  useEffect(() => {
    if (!loading && profile?.is_admin) {
      Promise.all([
        getAllUsersStats(),
        getAllFeedback(),
        getAllFlaggedHands(),
        getDailyStats(),
        getStatsRange(7),
      ]).then(([userData, feedbackData, flagsData, todayStats, rangeStats]) => {
        setUsers(userData as UserStat[]);
        setFeedback(feedbackData);
        setFlaggedHands(flagsData);
        setDailyStats(todayStats);
        setYesterdayStats(rangeStats.length > 1 ? rangeStats[1] : null);
        setWeekStats(rangeStats);
        setLoadingData(false);
      });
    } else if (!loading) {
      setLoadingData(false);
    }
  }, [loading, profile]);

  if (loading || loadingData) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--on-surface)',
          marginBottom: 12,
        }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
          This page is only available to administrators.
        </p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  async function handleToggleAdmin(targetId: string, currentlyAdmin: boolean) {
    const newStatus = !currentlyAdmin;
    const success = await toggleUserAdmin(targetId, newStatus);
    if (success) {
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_admin: newStatus } : u));
    }
  }

  const totalUsers = users.length;
  // "Active" now counts anyone with ANY activity signal — daily challenges, drills, or assessments.
  // Previously this missed the majority of Play-mode users who had never touched drills.
  const activeUsers = users.filter(u =>
    u.dailyChallengesPlayed > 0 || u.drillsCompleted > 0 || u.latestScore !== null
  ).length;
  const avgAccuracy = users.filter(u => u.spotsPracticed > 0).length > 0
    ? Math.round(users.filter(u => u.spotsPracticed > 0).reduce((s, u) => s + u.accuracy, 0) / users.filter(u => u.spotsPracticed > 0).length)
    : 0;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'stats', label: 'Stats', icon: '📈' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'leagues', label: 'Leagues', icon: '🏆' },
    { key: 'feedback', label: `Feedback (${feedback.length})`, icon: '💬' },
    { key: 'flags', label: `Flags (${flaggedHands.filter(f => f.status === 'open').length})`, icon: '🚩' },
  ];

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        color: 'var(--on-surface)',
        marginBottom: 4,
      }}>
        Coach Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', marginBottom: 16 }}>
        Manage users and league partners
      </p>

      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '1px solid var(--outline-variant)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stats Tab ── */}
      {activeTab === 'stats' && dailyStats && (() => {
        const formatDuration = (secs: number) => {
          if (secs < 60) return `${secs}s`;
          const mins = Math.floor(secs / 60);
          const rem = Math.round(secs % 60);
          return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
        };

        const trend = (today: number, yesterday: number) => {
          if (yesterday === 0) return today > 0 ? '+' : '';
          const diff = today - yesterday;
          if (diff > 0) return `+${diff}`;
          if (diff < 0) return `${diff}`;
          return '';
        };

        const trendColor = (today: number, yesterday: number) => {
          if (today > yesterday) return 'var(--color-correct, #10b981)';
          if (today < yesterday) return 'var(--color-leak, #ef4444)';
          return 'var(--muted)';
        };

        const yd = yesterdayStats || { total_sessions: 0, registered_sessions: 0, guest_sessions: 0, unique_devices: 0, returning_devices: 0, total_hands: 0, avg_hands: 0, avg_duration_seconds: 0, play_sessions: 0, train_sessions: 0 };

        // 7-day totals
        const week7 = weekStats.reduce((acc, d) => ({
          sessions: acc.sessions + d.total_sessions,
          hands: acc.hands + d.total_hands,
          guests: acc.guests + d.guest_sessions,
          registered: acc.registered + d.registered_sessions,
        }), { sessions: 0, hands: 0, guests: 0, registered: 0 });

        return (
          <>
            {/* Today's headline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                  {dailyStats.total_sessions}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Sessions Today
                </div>
                {yesterdayStats && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: trendColor(dailyStats.total_sessions, yd.total_sessions), marginTop: 2 }}>
                    {trend(dailyStats.total_sessions, yd.total_sessions)} vs yesterday
                  </div>
                )}
              </Card>
              <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-correct)', fontFamily: 'var(--font-display)' }}>
                  {dailyStats.registered_sessions}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Registered
                </div>
              </Card>
              <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                  {dailyStats.guest_sessions}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Guests
                </div>
              </Card>
            </div>

            {/* Engagement stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                  {dailyStats.total_hands}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Hands Played
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  avg {dailyStats.avg_hands}/session
                </div>
              </Card>
              <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                  {formatDuration(dailyStats.avg_duration_seconds)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Avg Session
                </div>
              </Card>
            </div>

            {/* Visitor insights */}
            <Card elevation="raised" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                Visitor Insights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Unique devices today</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}>{dailyStats.unique_devices}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Returning visitors</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-correct)', fontFamily: 'var(--font-body)' }}>{dailyStats.returning_devices}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Play mode sessions</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}>{dailyStats.play_sessions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Train mode sessions</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}>{dailyStats.train_sessions}</span>
                </div>
              </div>
            </Card>

            {/* 7-day summary */}
            <Card elevation="raised" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                Last 7 Days
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, background: 'var(--surface-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                    {week7.sessions}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sessions
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                    {week7.hands}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Hands
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-correct)', fontFamily: 'var(--font-display)' }}>
                    {week7.registered}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Registered
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                    {week7.guests}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Guests
                  </div>
                </div>
              </div>

              {/* Daily breakdown */}
              <div style={{ marginTop: 12 }}>
                {weekStats.map((day, i) => {
                  const d = new Date(day.date);
                  const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const maxSessions = Math.max(...weekStats.map(s => s.total_sessions), 1);
                  const barWidth = Math.max((day.total_sessions / maxSessions) * 100, 2);
                  return (
                    <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', width: 70, flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-high)' }}>
                        <div style={{
                          width: `${barWidth}%`, height: '100%', borderRadius: 4,
                          background: i === 0 ? 'var(--primary)' : 'var(--primary-dim, #6366f1)',
                          opacity: i === 0 ? 1 : 0.5 + (0.5 * (weekStats.length - i) / weekStats.length),
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface)', fontFamily: 'var(--font-body)', width: 24, textAlign: 'right' }}>{day.total_sessions}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        );
      })()}

      {activeTab === 'stats' && !dailyStats && (
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 40 }}>
          No session data yet. Stats will appear once users start visiting the app.
        </p>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                {totalUsers}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                Total Users
              </div>
            </Card>
            <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-correct)', fontFamily: 'var(--font-display)' }}>
                {activeUsers}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                Active
              </div>
            </Card>
            <Card elevation="raised" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                {avgAccuracy}%
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                Avg Accuracy
              </div>
            </Card>
          </div>

          {/* User list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 40 }}>
                No users have signed up yet.
              </p>
            ) : (
              users
                .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                .map((u) => (
                  <Card key={u.id} elevation="raised" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--primary)', color: 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                        }}>
                          {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 700,
                          color: 'var(--on-surface)',
                          fontFamily: 'var(--font-body)',
                          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
                        }}>
                          <span>{u.display_name || u.email?.split('@')[0] || 'Unknown'}</span>
                          {u.is_admin && (
                            <Badge variant="neutral" size="sm">Admin</Badge>
                          )}
                          {u.todayCompleted && (
                            <Badge variant="correct" size="sm">Played today</Badge>
                          )}
                          {u.preferred_mode && (
                            <Badge variant="neutral" size="sm">{u.preferred_mode}</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                          {u.email} &middot; Last active {formatDate(u.lastActive)}
                          {u.currentStreak > 0 && ` · 🔥 ${u.currentStreak}-day streak`}
                        </div>
                      </div>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 600,
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: u.is_admin ? 'var(--color-leak)' : 'var(--primary)',
                            color: 'var(--surface)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </div>

                    {/* Stats row — Play-mode stats first since most users are on Play */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                      gap: 8,
                      background: 'var(--surface-high)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                          {u.pokerIq}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          IQ
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                          {u.dailyChallengesPlayed}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Dailies
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)',
                          color: u.dailyAccuracy >= 80 ? 'var(--color-correct)' : u.dailyAccuracy >= 60 ? 'var(--color-acceptable)' : u.dailyAccuracy > 0 ? 'var(--color-leak)' : 'var(--muted)',
                        }}>
                          {u.dailySpotsPlayed > 0 ? `${u.dailyAccuracy}%` : '—'}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Daily Acc
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                          {u.drillsCompleted}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Drills
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)',
                          color: u.latestScore !== null
                            ? (u.latestScore >= 80 ? 'var(--color-correct)' : u.latestScore >= 60 ? 'var(--color-acceptable)' : 'var(--color-leak)')
                            : 'var(--muted)',
                        }}>
                          {u.latestScore !== null ? `${Math.round(u.latestScore)}%` : '—'}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Assess
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </>
      )}

      {/* ── Leagues Tab ── */}
      {activeTab === 'leagues' && <LeagueManager />}

      {/* ── Feedback Tab ── */}
      {activeTab === 'feedback' && (
        <>
          {feedback.length > 0 && (() => {
            const avg = (key: string) => {
              const vals = feedback.map(f => Number((f as unknown as Record<string, unknown>)[key])).filter(n => n > 0);
              return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '\u2014';
            };
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Fun', key: 'q1_fun' },
                  { label: 'Easy', key: 'q2_ease' },
                  { label: 'Tips', key: 'q3_tips' },
                  { label: 'Recommend', key: 'q4_recommend' },
                  { label: 'Return', key: 'q5_return' },
                ].map(item => (
                  <Card key={item.label} elevation="raised" style={{ padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{avg(item.key)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                  </Card>
                ))}
              </div>
            );
          })()}
          {feedback.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 40 }}>No feedback submitted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedback.map((fb) => (
                <Card key={fb.id} elevation="raised" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}>{fb.tester_name || 'Anonymous'}</span>
                      {fb.tester_email && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)', marginLeft: 8 }}>{fb.tester_email}</span>}
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{new Date(fb.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6, background: 'var(--surface-high)', borderRadius: 'var(--radius-md)', padding: '8px 10px', marginBottom: 10 }}>
                    {[{ label: 'Fun', val: fb.q1_fun }, { label: 'Easy', val: fb.q2_ease }, { label: 'Tips', val: fb.q3_tips }, { label: 'Rec', val: fb.q4_recommend }, { label: 'Return', val: fb.q5_return }].map(item => (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: item.val >= 4 ? 'var(--color-correct)' : item.val >= 3 ? 'var(--color-acceptable)' : 'var(--color-leak)' }}>{item.val}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  {fb.freeform && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--on-surface)', fontFamily: 'var(--font-body)', lineHeight: 1.6, fontStyle: 'italic', padding: '8px 0', borderTop: '1px solid var(--outline-variant)' }}>
                      &ldquo;{fb.freeform}&rdquo;
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Flagged Hands Tab ── */}
      {activeTab === 'flags' && (
        <>
          {flaggedHands.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 40 }}>No hands flagged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Open', count: flaggedHands.filter(f => f.status === 'open').length, color: '#f59e0b' },
                  { label: 'Agreed', count: flaggedHands.filter(f => f.status === 'agreed').length, color: '#10b981' },
                  { label: 'Adjusted', count: flaggedHands.filter(f => f.status === 'adjusted').length, color: '#8b5cf6' },
                  { label: 'Dismissed', count: flaggedHands.filter(f => f.status === 'dismissed').length, color: '#94a3b8' },
                ].map(s => (
                  <Card key={s.label} elevation="raised" style={{ padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{s.label}</div>
                  </Card>
                ))}
              </div>

              {/* Flagged hand cards */}
              {flaggedHands.map((flag) => {
                const SUIT_SYM: Record<string, string> = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
                const statusColors: Record<string, string> = {
                  open: '#f59e0b', agreed: '#10b981', adjusted: '#8b5cf6', dismissed: '#94a3b8',
                };
                return (
                  <Card key={flag.id} elevation="raised" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}>
                          {flag.card1_rank}{SUIT_SYM[flag.card1_suit] || ''} {flag.card2_rank}{SUIT_SYM[flag.card2_suit] || ''}
                        </span>
                        <Badge variant="neutral" style={{ fontSize: 11 }}>{flag.hand_code}</Badge>
                      </div>
                      <Badge variant="neutral" style={{
                        fontSize: 10, background: statusColors[flag.status] || '#94a3b8', color: '#fff',
                      }}>{flag.status}</Badge>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                      {flag.position} &middot; {flag.stack} &middot; {flag.is_bonus ? 'Bonus' : 'Daily'}
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--on-surface)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: 6 }}>
                      <strong>App says:</strong> {flag.app_action}
                      {flag.user_action && <span> &middot; <strong>User chose:</strong> {flag.user_action}</span>}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: 6, fontStyle: 'italic' }}>
                      {flag.explanation.substring(0, 200)}{flag.explanation.length > 200 ? '...' : ''}
                    </div>

                    {flag.note && (
                      <div style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                        {'\u{1F6A9}'} &ldquo;{flag.note}&rdquo;
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                      {new Date(flag.flagged_at).toLocaleDateString()} {new Date(flag.flagged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Review actions for open flags */}
                    {flag.status === 'open' && user && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {(['agreed', 'adjusted', 'dismissed'] as const).map(action => (
                          <button
                            key={action}
                            onClick={async () => {
                              const note = action === 'adjusted'
                                ? prompt('What was adjusted?') || ''
                                : action === 'dismissed'
                                  ? prompt('Why dismissed?') || ''
                                  : 'Confirmed — range needs fixing';
                              await updateFlaggedHandStatus(flag.id, action, note, user.id);
                              setFlaggedHands(prev => prev.map(f =>
                                f.id === flag.id ? { ...f, status: action, reviewer_note: note } : f
                              ));
                            }}
                            style={{
                              padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                              background: statusColors[action], color: '#fff',
                            }}
                          >
                            {action === 'agreed' ? 'Agree (needs fix)' : action === 'adjusted' ? 'Adjusted' : 'Dismiss'}
                          </button>
                        ))}
                      </div>
                    )}

                    {flag.reviewer_note && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--on-surface)', fontFamily: 'var(--font-body)', background: 'var(--surface-high)', borderRadius: 6, padding: '6px 10px' }}>
                        <strong>Review note:</strong> {flag.reviewer_note}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
