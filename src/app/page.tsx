'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LeagueBrand from '@/components/ui/LeagueBrand';
import { useLeague } from '@/lib/services/league-context';
import { useAuth } from '@/lib/services/auth-context';
import { getUserPreferredMode, setUserPreferredMode } from '@/lib/services/play-storage';

export default function WelcomePage() {
  const router = useRouter();
  const { league, isWhiteLabel } = useLeague();
  const { user, profile, isGuest } = useAuth();
  const [checking, setChecking] = useState(true);

  // If user already has a preferred mode, redirect immediately
  useEffect(() => {
    async function checkMode() {
      // Check profile first (signed-in users)
      if (user && profile?.preferred_mode) {
        router.replace(profile.preferred_mode === 'play' ? '/play' : '/learn');
        return;
      }
      // Check localStorage for guests AND signed-in users without profile.preferred_mode
      try {
        const saved = localStorage.getItem('poker-trainer-preferred-mode');
        if (saved) { router.replace(saved === 'play' ? '/play' : '/learn'); return; }
      } catch { /* noop */ }
      setChecking(false);
    }
    checkMode();
  }, [user, profile, router]);

  const handleModeSelect = async (mode: 'play' | 'train') => {
    // Save preference
    if (user) {
      await setUserPreferredMode(user.id, mode);
    } else {
      try { localStorage.setItem('poker-trainer-preferred-mode', mode); } catch { /* noop */ }
    }
    router.push(mode === 'play' ? '/play' : '/learn');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted, #94a3b8)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', textAlign: 'center',
      padding: '40px 16px', maxWidth: 420, margin: '0 auto',
    }}>
      {/* League / default brand */}
      <div style={{ marginBottom: 16 }}>
        <LeagueBrand size={72} />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: '0 0 8px', color: 'var(--on-surface, #0f172a)' }}>
        How do you poker?
      </h1>
      <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 32px' }}>
        Pick the experience that fits you.<br />You can always switch later.
      </p>

      {/* Play mode card */}
      <button onClick={() => handleModeSelect('play')} style={{
        width: '100%', padding: '24px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        marginBottom: 14, textAlign: 'left',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 8 }}>
          ⭐ Most popular
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>I play for fun</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 12 }}>
          Quick daily challenges. Test your instincts, climb the leaderboard, trash talk your league.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['60 sec/day', 'Daily challenge', 'League ranks'].map(t => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>{t}</span>
          ))}
        </div>
      </button>

      {/* Train mode card */}
      <button onClick={() => handleModeSelect('train')} style={{
        width: '100%', padding: '24px 20px', borderRadius: 16, cursor: 'pointer',
        background: 'var(--surface-container, #0f172a)', border: '1px solid var(--outline-variant, #334155)',
        textAlign: 'left', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
          For grinders
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface, #e2e8f0)', marginBottom: 6 }}>I want to win more</div>
        <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
          Find your leaks, drill your weak spots, log hands and get coaching feedback.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Hand logger', 'Leak detection', 'Coaching'].map(t => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}>{t}</span>
          ))}
        </div>
      </button>

      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, textAlign: 'center' }}>You can switch modes anytime in settings</div>

      {/* Copyright */}
      <div style={{ marginTop: 32, textAlign: 'center', lineHeight: 1.8 }}>
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
