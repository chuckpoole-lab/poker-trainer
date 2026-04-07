'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';

const MENU_ITEMS = [
  { icon: '⚙️', title: 'Settings', desc: 'Drill length, complexity, preferences', href: '/settings' },
  { icon: '💬', title: 'Give Feedback', desc: 'Quick survey — takes 30 seconds', href: '/more/feedback' },
  { icon: 'ℹ️', title: 'About', desc: 'Version info and credits', href: '/more/about' },
];

export default function MorePage() {
  const router = useRouter();
  const { profile } = useAuth();

  const items = profile?.is_admin
    ? [...MENU_ITEMS, { icon: '👑', title: 'Coach Dashboard', desc: 'Stats, feedback, leaderboard', href: '/admin' }]
    : MENU_ITEMS;

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
        marginBottom: 20,
      }}>
        More
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <button
            key={item.title}
            onClick={() => router.push(item.href)}
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
              background: '#f0ebe3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: 2,
                fontFamily: 'var(--font-body)',
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: 12,
                color: '#888',
                lineHeight: 1.3,
                fontFamily: 'var(--font-body)',
              }}>
                {item.desc}
              </div>
            </div>
            <div style={{ color: '#ccc', fontSize: 20, flexShrink: 0 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
