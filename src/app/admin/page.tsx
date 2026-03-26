'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';
import { getAllUsersStats } from '@/lib/services/cloud-storage';
import { Card, Badge, Button } from '@/components/ui';

interface UserStat {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  drillsCompleted: number;
  spotsPracticed: number;
  accuracy: number;
  currentStreak: number;
  latestScore: number | null;
  lastActive: string;
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && profile?.is_admin) {
      getAllUsersStats().then((data) => {
        setUsers(data as UserStat[]);
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

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.drillsCompleted > 0 || u.latestScore !== null).length;
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
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
        All registered users and their progress
      </p>

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
                    }}>
                      {u.display_name || u.email?.split('@')[0] || 'Unknown'}
                      {u.is_admin && (
                        <Badge variant="neutral" size="sm" style={{ marginLeft: 8 }}>Admin</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                      {u.email} &middot; Last active {formatDate(u.lastActive)}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 8,
                  background: 'var(--surface-high)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                      {u.drillsCompleted}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Drills
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
                      {u.spotsPracticed}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Spots
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)',
                      color: u.accuracy >= 80 ? 'var(--color-correct)' : u.accuracy >= 60 ? 'var(--color-acceptable)' : u.accuracy > 0 ? 'var(--color-leak)' : 'var(--muted)',
                    }}>
                      {u.spotsPracticed > 0 ? `${u.accuracy}%` : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Accuracy
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
    </div>
  );
}
