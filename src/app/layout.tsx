'use client';

import './globals.css';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '♠', title: 'Home' },
  { href: '/learn', label: '📖', title: 'Learn' },
  { href: '/assessment', label: '🎯', title: 'Assess' },
  { href: '/study-plan', label: '📋', title: 'Plan' },
  { href: '/drills', label: '⚡', title: 'Drills' },
  { href: '/progress', label: '📊', title: 'Progress' },
  { href: '/settings', label: '⚙️', title: 'Settings' },
];

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              padding: '4px 8px',
              minWidth: 44,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.label}</span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              {item.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Poker Trainer</title>
      </head>
      <body>
        <main style={{ paddingBottom: 72, minHeight: '100vh' }}>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
