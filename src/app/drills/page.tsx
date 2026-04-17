'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MODULES } from '@/lib/data/categories';
import { useAuth } from '@/lib/services/auth-context';
import { Card, Button, Icon, Badge } from '@/components/ui';

const DRILL_SIZES = [10, 15, 25, 50];
const DEFAULT_DRILL_SIZE = 15;

// Drill modules hidden from the "By Category" list for non-admins while the
// content is rebuilt. See WORK-PLAN.md Priority 1e (2026-04-16).
const ADMIN_ONLY_MODULE_IDS = new Set(['mod_facing_limpers', 'mod_facing_3bets']);

export default function DrillsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  const sortedModules = [...MODULES]
    .filter(m => m.spotPoolSize > 0)
    .filter(m => isAdmin || !ADMIN_ONLY_MODULE_IDS.has(m.id))
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

  const handleSizeChange = (size: number) => {
    setDrillSize(size);
    try { localStorage.setItem('poker-trainer-drill-size', String(size)); } catch { /* noop */ }
  };

  const startDrill = (moduleId: string) => {
    router.push(`/drills/session?module=${moduleId}&count=${drillSize}`);
  };

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 800,
        marginBottom: 4,
        fontFamily: 'var(--font-display)',
        color: 'var(--on-surface)',
      }}>
        Drills
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
        Practice specific spots to fix your leaks.
      </p>

      {/* Drill size stepper — inline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 20,
        fontFamily: 'var(--font-body)',
      }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
          Hands:
        </span>
        {DRILL_SIZES.map(size => (
          <button
            key={size}
            onClick={() => handleSizeChange(size)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              border: 'none',
              cursor: 'pointer',
              background: size === drillSize ? 'var(--primary)' : 'var(--surface-high)',
              color: size === drillSize ? 'var(--surface)' : 'var(--on-surface-variant)',
              transition: 'all var(--duration-fast) var(--ease-out)',
              minHeight: 36,
            }}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Quick Mix card */}
      <Card elevation="floating" style={{
        marginBottom: 24,
        textAlign: 'center',
        padding: 'var(--space-6)',
        background: 'linear-gradient(145deg, var(--surface-container) 0%, var(--surface-high) 100%)',
      }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Icon name="zap" size={32} color="var(--gold)" />
        </div>
        <h2 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: 'var(--font-display)',
          color: 'var(--on-surface)',
        }}>
          Quick Mix
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
          {drillSize} mixed spots across all categories.
        </p>
        <Button variant="primary" block onClick={() => startDrill('mixed')}>
          Start Quick Drill
        </Button>
      </Card>

      {/* Module drills */}
      <h2 style={{
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        marginBottom: 12,
        color: 'var(--on-surface)',
        fontFamily: 'var(--font-body)',
      }}>
        By Category
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedModules.map((mod) => (
          <Card
            key={mod.id}
            elevation="raised"
            style={{
              padding: 16,
              cursor: 'pointer',
              transition: 'background var(--duration-fast) var(--ease-out)',
            }}
            onClick={() => startDrill(mod.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  marginBottom: 4,
                  color: 'var(--on-surface)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {mod.displayName}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}>
                  <Badge variant="neutral" size="sm">
                    {mod.spotPoolSize}+ hands
                  </Badge>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    {mod.positions.join(', ')}
                  </span>
                </div>
              </div>
              <Icon name="chevron-right" size={20} color="var(--muted)" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
