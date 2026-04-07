'use client';

import './globals.css';
import { Component, useEffect, useRef } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/services/auth-context';
import { LeagueProvider, useLeague } from '@/lib/services/league-context';
import { startSession } from '@/lib/services/session-tracker';
import SignInScreen from '@/components/auth/SignInScreen';
import UserMenu from '@/components/auth/UserMenu';

/** Global error boundary — shows friendly message if anything crashes */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f0ebe3', padding: 24, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u2660'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: '#999', marginBottom: 24, lineHeight: 1.6 }}>
              We{'\u2019'}re working on a fix. Try refreshing the page.
            </div>
            <button onClick={() => window.location.reload()} style={{
              padding: '12px 32px', fontSize: 15, fontWeight: 700, background: '#4a7c59', color: '#fff',
              border: 'none', borderRadius: 12, cursor: 'pointer',
            }}>Refresh</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_ITEMS = [
  { href: '/', label: '🏠', title: 'Home' },
  { href: '/play', label: '🃏', title: 'Play' },
  { href: '/train', label: '💪', title: 'Train' },
  { href: '/progress', label: '📊', title: 'Progress' },
  { href: '/more', label: '⚙️', title: 'More' },
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
      background: '#faf8f5',
      borderTop: '1px solid #e8e2d9',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
          || (item.href !== '/' && pathname.startsWith(item.href))
          // Map old routes into the new Train tab
          || (item.href === '/train' && (pathname.startsWith('/learn') || pathname.startsWith('/assessment') || pathname.startsWith('/drills')))
          // Map old routes into the new More tab
          || (item.href === '/more' && (pathname.startsWith('/settings') || pathname.startsWith('/admin')));
        return (
          <button
            key={item.href}
            onClick={() => { if (pathname !== item.href) router.push(item.href); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              padding: '4px 12px',
              minWidth: 52,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.label}</span>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#4a7c59' : '#999',
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
        <ErrorBoundary>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
