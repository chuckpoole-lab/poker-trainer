'use client';

import { LEAK_CATEGORIES } from '@/lib/data/categories';

export default function ProgressPage() {
  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Progress</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Track your improvement over time.
      </p>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Drills Completed', value: '0', icon: '⚡' },
          { label: 'Spots Practiced', value: '0', icon: '🎯' },
          { label: 'Accuracy Rate', value: '--', icon: '📊' },
          { label: 'Streak', value: '0 days', icon: '🔥' },
        ].map((stat, i) => (
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
        {LEAK_CATEGORIES.map(cat => (
          <div key={cat.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.displayName}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data yet</span>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width: '0%', background: 'var(--bg-elevated)' }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
        Progress tracking will populate as you complete drills and assessments.
      </p>
    </div>
  );
}
