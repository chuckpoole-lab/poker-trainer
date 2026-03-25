'use client';

import { useState, useEffect } from 'react';
import { LEAK_CATEGORIES } from '@/lib/data/categories';
import { getProgressStats, type ProgressStats } from '@/lib/services/progress-storage';
import { ScoreBand } from '@/lib/types/enums';

const BAND_COLORS: Record<string, string> = {
  [ScoreBand.STRONG]: 'var(--color-correct)',
  [ScoreBand.NEEDS_WORK]: 'var(--color-acceptable)',
  [ScoreBand.CRITICAL_LEAK]: 'var(--color-leak)',
};

const BAND_LABELS: Record<string, string> = {
  [ScoreBand.STRONG]: 'Strong',
  [ScoreBand.NEEDS_WORK]: 'Needs Work',
  [ScoreBand.CRITICAL_LEAK]: 'Critical Leak',
};

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    setStats(getProgressStats());
  }, []);

  // Show skeleton while loading from localStorage
  if (!stats) {
    return (
      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Progress</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  const hasAnyData = stats.drillsCompleted > 0 || stats.assessmentHistory.length > 0;

  const statCards = [
    { label: 'Drills Completed', value: String(stats.drillsCompleted), icon: '⚡' },
    { label: 'Spots Practiced', value: String(stats.spotsPracticed), icon: '🎯' },
    { label: 'Accuracy Rate', value: stats.accuracyRate !== null ? `${stats.accuracyRate}%` : '--', icon: '📊' },
    { label: 'Streak', value: `${stats.streakDays} day${stats.streakDays !== 1 ? 's' : ''}`, icon: '🔥' },
  ];

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Progress</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Track your improvement over time.
      </p>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {statCards.map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-accent)' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Leak progress */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Leak Categories</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEAK_CATEGORIES.map(cat => {
          const leakScore = stats.latestLeakScores?.find(ls => ls.categoryId === cat.id);
          const score = leakScore ? Math.round(leakScore.score * 100) : null;
          const band = leakScore?.band;
          const barColor = band ? BAND_COLORS[band] : 'var(--bg-elevated)';
          const label = band ? `${score}% — ${BAND_LABELS[band]}` : 'No data yet';
          const labelColor = band ? BAND_COLORS[band] : 'var(--text-muted)';

          return (
            <div key={cat.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.displayName}</span>
                <span style={{ fontSize: 13, color: labelColor }}>{label}</span>
              </div>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{
                  width: score !== null ? `${score}%` : '0%',
                  background: barColor,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {!hasAnyData && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
          Complete a drill or assessment to start tracking your progress.
        </p>
      )}
    </div>
  );
}
