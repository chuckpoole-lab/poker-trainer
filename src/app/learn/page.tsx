'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';

// Phases whose content is hidden from non-admins while the modules are rebuilt.
// See WORK-PLAN.md Priority 1e (2026-04-16).
const ADMIN_ONLY_PHASE_IDS = new Set(['facing_limpers', 'three_betting']);

type Phase = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  href: string;
  count: number;
  unit: 'questions' | 'sections';
  estimate: string;
};

const PHASES: Phase[] = [
  {
    id: 'foundations',
    title: 'Poker Foundations',
    subtitle: 'Phase 1',
    description: 'Positions, terminology, and core concepts every player needs.',
    icon: '🧠',
    href: '/learn/foundations',
    count: 14,
    unit: 'questions',
    estimate: '5 min',
  },
  {
    id: 'early',
    title: 'Early Position',
    subtitle: 'Phase 2a',
    description: 'UTG and UTG+1: why tight is right when you act first.',
    icon: '🔒',
    href: '/learn/positions?group=early',
    count: 7,
    unit: 'questions',
    estimate: '5 min',
  },
  {
    id: 'middle',
    title: 'Middle Position',
    subtitle: 'Phase 2b',
    description: 'MP, LJ, and HJ: the transition zone where ranges expand.',
    icon: '↔️',
    href: '/learn/positions?group=middle',
    count: 7,
    unit: 'questions',
    estimate: '5 min',
  },
  {
    id: 'late',
    title: 'Late Position',
    subtitle: 'Phase 2c',
    description: 'CO and BTN: the profit seats. Steal blinds and play wide.',
    icon: '💰',
    href: '/learn/positions?group=late',
    count: 7,
    unit: 'questions',
    estimate: '5 min',
  },
  {
    id: 'blinds',
    title: 'Blind Play',
    subtitle: 'Phase 2d',
    description: 'SB aggression and BB defense from the toughest seats.',
    icon: '🛡️',
    href: '/learn/positions?group=blinds',
    count: 7,
    unit: 'questions',
    estimate: '5 min',
  },
  {
    id: 'facing_limpers',
    title: 'Facing Limpers',
    subtitle: 'Phase 3a',
    description: 'Isolate, limp behind, or jam — exploit the most common play in bar poker.',
    icon: '🎯',
    href: '/learn/facing-limpers',
    count: 6,
    unit: 'sections',
    estimate: '4 min',
  },
  {
    id: 'three_betting',
    title: '3-Betting Strategy',
    subtitle: 'Phase 3b',
    description: 'When to re-raise, 4-bet jam, or fold — value, bluffs, and positional adjustments.',
    icon: '🔥',
    href: '/learn/three-betting',
    count: 6,
    unit: 'sections',
    estimate: '4 min',
  },
];

export default function LearnPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  const visiblePhases = isAdmin
    ? PHASES
    : PHASES.filter(p => !ADMIN_ONLY_PHASE_IDS.has(p.id));

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Learn
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
          Build your foundation before the assessment
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visiblePhases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => router.push(phase.href)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '16px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {phase.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {phase.title}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--color-accent)',
                  background: 'rgba(56,189,248,0.12)', padding: '2px 7px', borderRadius: 6,
                }}>
                  {phase.subtitle}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {phase.description}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0', opacity: 0.7 }}>
                {phase.count} {phase.unit} &middot; ~{phase.estimate}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Assessment link after completing learn */}
      <div style={{
        marginTop: 28,
        padding: '16px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Already know the basics?
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push('/assessment')}
          style={{ width: '100%' }}
        >
          Skip to Assessment
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
          20 hands &middot; About 7 minutes
        </p>
      </div>
    </div>
  );
}
