'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MODULES } from '@/lib/data/categories';

const DEFAULT_DRILL_SIZE = 15;

export default function DrillsPage() {
  const router = useRouter();
  const sortedModules = [...MODULES]
    .filter(m => m.spotPoolSize > 0)
    .sort((a, b) => a.curriculumOrder - b.curriculumOrder);
  const [drillSize, setDrillSize] = useState(DEFAULT_DRILL_SIZE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('poker-trainer-drill-size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed > 0 && parsed <= 100) setDrillSize(parsed);
      }
    } catch { /* noop */ }
  }, []);

  const startDrill = (moduleId: string) => {
    router.push(`/drills/session?module=${moduleId}&count=${drillSize}`);
  };

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Drills</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Practice specific spots to fix your leaks. Each drill runs <strong>{drillSize} hands</strong>.
        <br />
        <span
          onClick={() => router.push('/settings')}
          style={{ color: 'var(--color-accent)', cursor: 'pointer', fontSize: 13 }}
        >
          Change in Settings
        </span>
      </p>

      {/* Quick drill */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#9889;</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Quick Drill</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          A mixed set of {drillSize} spots across all categories.
        </p>
        <button
          className="btn-primary"
          onClick={() => startDrill('mixed')}
          style={{ width: '100%' }}
        >
          Start Quick Drill
        </button>
      </div>

      {/* Module drills */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>By Module</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedModules.map((mod) => (
          <button
            key={mod.id}
            className="card"
            onClick={() => startDrill(mod.id)}
            style={{
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              border: '1px solid var(--border-card)',
              transition: 'border-color 0.2s',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{mod.displayName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {mod.spotPoolSize}+ hands &middot; {mod.positions.join(', ')}
              </div>
            </div>
            <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>&#8250;</span>
          </button>
        ))}
      </div>
    </div>
  );
}
