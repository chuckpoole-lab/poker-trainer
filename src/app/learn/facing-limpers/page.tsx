'use client';

import { useRouter } from 'next/navigation';
import { FACING_LIMPERS_MODULE } from '@/lib/data/training-modules-prototype';

export default function FacingLimpersLessonPage() {
  const router = useRouter();
  const mod = FACING_LIMPERS_MODULE;

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => router.push('/learn')}
          style={{
            fontSize: 13,
            color: 'var(--color-accent)',
            background: 'none',
            padding: 0,
            marginBottom: 8,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          ← Back to Learn
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {mod.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {mod.title}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {mod.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Overview intro */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{
          fontSize: 17, fontWeight: 700, margin: '0 0 4px',
          color: 'var(--text-primary)',
        }}>
          {mod.overview.title}
        </h2>
      </div>

      {/* Overview sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {mod.overview.sections.map((section, idx) => (
          <div key={idx} className="card">
            <h3 style={{
              fontSize: 15, fontWeight: 700, margin: '0 0 8px',
              color: 'var(--text-primary)',
            }}>
              {section.heading}
            </h3>
            <p style={{
              fontSize: 14, lineHeight: 1.6, margin: 0,
              color: 'var(--text-secondary)',
            }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>

      {/* Start drill CTA */}
      <div style={{
        padding: '16px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Ready to practice? Drill real spots against limpers.
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push('/drills/session?module=mod_facing_limpers&count=15')}
          style={{ width: '100%' }}
        >
          Start Facing Limpers Drill
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
          15 hands &middot; ~5 minutes
        </p>
      </div>
    </div>
  );
}
