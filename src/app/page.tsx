'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LeagueBrand from '@/components/ui/LeagueBrand';
import { useLeague } from '@/lib/services/league-context';
import { useAuth } from '@/lib/services/auth-context';
import { getTodaysChallenge, setUserPreferredMode } from '@/lib/services/play-storage';

export default function WelcomePage() {
  const router = useRouter();
  const { league, isWhiteLabel } = useLeague();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyDone, setDailyDone] = useState(false);
  const [preferredMode, setPreferredMode] = useState<string | null>(null);

  // Resolve user state: preferred mode (for "continue" hint) and whether today's Daily 5 is done.
  // We do NOT auto-redirect anymore — Home is a real home page for everyone, so train users see Daily 5.
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      // Preferred mode (for the "Continue to your mode" hint)
      let pref: string | null = profile?.preferred_mode ?? null;
      if (!pref) {
        try { pref = localStorage.getItem('poker-trainer-preferred-mode'); } catch { /* noop */ }
      }
      if (!cancelled) setPreferredMode(pref);

      // Today's Daily 5 status (only for signed-in users; guests always see the CTA fresh)
      if (user) {
        try {
          const today = await getTodaysChallenge(user.id);
          if (!cancelled) setDailyDone(!!today);
        } catch { /* noop */ }
      }
      if (!cancelled) setLoading(false);
    }
    resolve();
    return () => { cancelled = true; };
  }, [user, profile]);

  const goToMode = async (mode: 'play' | 'train') => {
    // Persist the preference so future visits can surface the right "continue" hint
    if (user) {
      await setUserPreferredMode(user.id, mode);
    } else {
      try { localStorage.setItem('poker-trainer-preferred-mode', mode); } catch { /* noop */ }
    }
    router.push(mode === 'play' ? '/play' : '/learn');
  };

  const goToDaily5 = () => {
    router.push('/play');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted, #94a3b8)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', minHeight: '100vh', textAlign: 'center',
      padding: '32px 16px 40px', maxWidth: 440, margin: '0 auto',
    }}>
      {/* League / default brand */}
      <div style={{ marginBottom: 14 }}>
        <LeagueBrand size={64} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: '0 0 6px', color: 'var(--on-surface, #1a1a1a)' }}>
        {dailyDone ? 'Welcome back' : "Today's Daily 5"}
      </h1>
      <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 22px' }}>
        {dailyDone
          ? 'You finished today\u2019s Daily 5. Grab your bonus hand or jump back in.'
          : 'Five hands. Sixty seconds. Test your instincts.'}
      </p>

      {/* Daily 5 card — the hero CTA for everyone */}
      <button onClick={goToDaily5} style={{
        width: '100%', padding: '22px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
        background: dailyDone
          ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        marginBottom: 20, textAlign: 'left',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>
          {dailyDone ? '\u2714 Completed today' : '\u2b50 Daily challenge'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          {dailyDone ? 'Open Play mode' : 'Play Daily 5'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          {dailyDone
            ? 'See today\u2019s score, streak, and bonus hand.'
            : 'Quick decisions on five real scenarios. 60 seconds, then back to your day.'}
        </div>
      </button>

      {/* Mode navigation */}
      <div style={{ width: '100%', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', marginBottom: 8 }}>
        Choose your mode
      </div>

      {/* Play mode */}
      <button onClick={() => goToMode('play')} style={{
        width: '100%', padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
        background: 'var(--surface-container, #ffffff)',
        border: preferredMode === 'play'
          ? '2px solid #10b981'
          : '1px solid var(--outline-variant, #e8e2d9)',
        textAlign: 'left', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--on-surface, #e2e8f0)' }}>Play mode</div>
          {preferredMode === 'play' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 10 }}>Your mode</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          Daily challenges, leaderboard, league trash talk.
        </div>
      </button>

      {/* Train mode */}
      <button onClick={() => goToMode('train')} style={{
        width: '100%', padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
        background: 'var(--surface-container, #ffffff)',
        border: preferredMode === 'train'
          ? '2px solid #10b981'
          : '1px solid var(--outline-variant, #e8e2d9)',
        textAlign: 'left', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--on-surface, #e2e8f0)' }}>Train mode</div>
          {preferredMode === 'train' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 10 }}>Your mode</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          Learn the tracks, drill your weak spots, log hands and review.
        </div>
      </button>

      <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
        You can switch modes anytime
      </div>

      {/* Copyright */}
      <div style={{ marginTop: 28, textAlign: 'center', lineHeight: 1.8 }}>
        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
          {league.copyright || (
            <>&copy; {new Date().getFullYear()} Chuck Poole &amp; Chris Thatcher. All rights reserved.</>
          )}
        </p>
        {!isWhiteLabel && (
          <p style={{ fontSize: 11, color: '#3b4555', margin: 0 }}>
            Developed by White Rabbit Advisory Group
          </p>
        )}
        {isWhiteLabel && league.websiteUrl && (
          <p style={{ fontSize: 11, color: '#3b4555', margin: 0 }}>
            <a href={league.websiteUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: league.colors.primary, textDecoration: 'none' }}>
              Visit {league.name} &rarr;
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
