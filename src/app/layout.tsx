'use client';

import './globals.css';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/services/auth-context';
import { LeagueProvider, useLeague } from '@/lib/services/league-context';
import { startSession } from '@/lib/services/session-tracker';
import SignInScreen from '@/components/auth/SignInScreen';
import UserMenu from '@/components/auth/UserMenu';

const NAV_ITEMS = [
  { href: '/', label: '♠', title: 'Home' },
  { href: '/play', label: '🃏', title: 'Play' },
  { href: '/learn', label: '📖', title: 'Learn' },
  { href: '/assessment', label: '🎯', title: 'Assess' },
  { href: '/drills', label: '⚡', title: 'Drills' },
  { href: '/progress', label: '📊', title: 'Progress' },
  { href: '/settings', label: '⚙️', title: 'Settings' },
];

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = profile?.is_admin
    ? [...NAV_ITEMS, { href: '/admin', label: '👑', title: 'Coach' }]
    : NAV_ITEMS;

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
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <button
            key={item.href}
            onClick={() => { if (pathname !== item.href) router.push(item.href); }}
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

/** Starts session tracking once user state is resolved */
function SessionTracker() {
  const { user, isGuest, loading } = useAuth();
  const sessionStarted = useRef(false);

  useEffect(() => {
    if (!loading && !sessionStarted.current) {
      sessionStarted.current = true;
      startSession(user?.id || null, isGuest || !user);
    }
  }, [user, isGuest, loading]);

  return null;
}

/** Auth gate — shows sign-in screen until user signs in or chooses guest */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
      }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
    );
  }

  // Not signed in and not a guest — show sign-in screen
  if (!user && !isGuest) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}

/** Top bar with user menu */
function TopBar() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      padding: '10px 16px',
      zIndex: 101,
    }}>
      <UserMenu />
    </div>
  );
}

/** Dynamic page title based on active league */
function LeagueTitle() {
  const { league } = useLeague();
  return <title>{league.name}</title>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Poker Trainer</title>
      </head>
      <body>
        <LeagueProvider>
          <AuthProvider>
            <LeagueTitle />
            <AuthGate>
              <SessionTracker />
              <TopBar />
              <main style={{ paddingBottom: 72, minHeight: '100vh' }}>
                {children}
              </main>
              <BottomNav />
            </AuthGate>
          </AuthProvider>
        </LeagueProvider>
      </body>
    </html>
  );
}
