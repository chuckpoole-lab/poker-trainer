'use client';

import { useRouter } from 'next/navigation';
import { LEAK_CATEGORIES, MODULES } from '@/lib/data/categories';
import { ScoreBand } from '@/lib/types';

export default function StudyPlanPage() {
  const router = useRouter();

  // Sort modules by curriculum order
  const sortedModules = [...MODULES]
    .filter(m => m.spotPoolSize > 0)
    .sort((a, b) => a.curriculumOrder - b.curriculumOrder);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Study Plan</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Your personalized training curriculum based on assessment results.
      </p>

      {/* Placeholder: will be dynamic once assessment data flows through */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
          Complete the assessment to generate your personalized study plan. The plan will prioritize your biggest leaks first.
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push('/assessment')}
          style={{ marginTop: 16 }}
        >
          Take Assessment
        </button>
      </div>

      {/* Module preview */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Available Modules</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedModules.map((mod, i) => {
          const cat = LEAK_CATEGORIES.find(c => c.id === mod.primaryLeakCategory);
          return (
            <div key={mod.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--color-accent)',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{mod.displayName}</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {mod.description}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {mod.spotPoolSize}+ hands &middot; {cat?.displayName ?? mod.primaryLeakCategory}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
