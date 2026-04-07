'use client';

import { useRouter } from 'next/navigation';

const TRAIN_OPTIONS = [
  {
    icon: '🎯',
    iconBg: '#e8f5e9',
    title: 'Skills Assessment',
    desc: '20 spots across all positions — find your leaks',
    tag: '~10 min',
    tagType: 'time' as const,
    href: '/assessment',
  },
  {
    icon: '⚡',
    iconBg: '#fff8e1',
    title: 'Quick Mix Drill',
    desc: '15 random hands across all categories',
    tag: '~5 min',
    tagType: 'time' as const,
    href: '/drills',
  },
  {
    icon: '🔧',
    iconBg: '#ffebee',
    title: 'Fix My Leaks',
    desc: 'Drills targeting your weakest categories',
    tag: 'Recommended',
    tagType: 'rec' as const,
    href: '/drills',
  },
  {
    icon: '📍',
    iconBg: '#e3f2fd',
    title: 'Position Drills',
    desc: 'UTG, HJ, CO, BTN, SB, or BB — you pick',
    tag: '~5 min',
    tagType: 'time' as const,
    href: '/drills',
  },
  {
    icon: '💣',
    iconBg: '#f3e5f5',
    title: 'Short Stack Jam/Fold',
    desc: '10bb and 15bb push-or-fold decisions',
    tag: '~5 min',
    tagType: 'time' as const,
    href: '/drills',
  },
  {
    icon: '📘',
    iconBg: '#e8f5e9',
    title: 'Learn the Basics',
    desc: 'Positions, terminology, core concepts',
    tag: '~5 min each',
    tagType: 'time' as const,
    href: '/learn',
  },
];

export default function TrainPage() {
  const router = useRouter();

  return (
    <div style={{
      padding: '24px 20px 16px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#1a1a1a',
        fontFamily: 'var(--font-body)',
        marginBottom: 4,
      }}>
        Train
      </h1>
      <p style={{
        fontSize: 13,
        color: '#888',
        marginBottom: 20,
        fontFamily: 'var(--font-body)',
      }}>
        Pick your focus for the next 10–15 minutes
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TRAIN_OPTIONS.map((opt) => (
          <button
            key={opt.title}
            onClick={() => router.push(opt.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: '#ffffff',
              border: '1.5px solid #e8e2d9',
              borderRadius: 14,
              padding: '16px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#4a7c59';
              e.currentTarget.style.background = '#f5faf7';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e8e2d9';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: opt.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              {opt.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: 2,
                fontFamily: 'var(--font-body)',
              }}>
                {opt.title}
              </div>
              <div style={{
                fontSize: 12,
                color: '#888',
                lineHeight: 1.3,
                fontFamily: 'var(--font-body)',
              }}>
                {opt.desc}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 20,
                background: opt.tagType === 'rec' ? '#e8f5e9' : '#f0ebe3',
                color: opt.tagType === 'rec' ? '#2e7d32' : '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {opt.tag}
              </span>
            </div>
            <div style={{ color: '#ccc', fontSize: 20, flexShrink: 0 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
