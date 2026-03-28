'use client';

import { useRouter } from 'next/navigation';
import LeagueBrand from '@/components/ui/LeagueBrand';
import { useLeague } from '@/lib/services/league-context';

export default function WelcomePage() {
  const router = useRouter();
  const { league, isWhiteLabel } = useLeague();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      gap: 32,
      padding: '40px 0',
    }}>
      {/* League / default brand block */}
      <div style={{ marginBottom: 8 }}>
        <LeagueBrand size={72} />
      </div>

      {/* Value proposition */}
      <div style={{ maxWidth: 340 }}>
        <p style={{
          fontSize: 18,
          color: '#94a3b8',
          lineHeight: 1.6,
          margin: 0,
        }}>
          {league.welcomeText ||
            'Learn positions, build strategy, and train the decisions that matter most in live tournament poker.'}
        </p>
      </div>

      {/* Features list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 300,
      }}>
        {[
          { icon: '📖', text: 'Learn positions and core strategy' },
          { icon: '🎯', text: 'Test your knowledge at the table' },
          { icon: '📋', text: 'Get a personalized study plan' },
          { icon: '⚡', text: 'Train with fast, practical drills' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 15, color: '#94a3b8', textAlign: 'left' }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300, marginTop: 8 }}>
        <button
          className="btn-primary"
          onClick={() => router.push('/learn')}
          style={{ width: '100%' }}
        >
          Start Learning
        </button>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Foundations first &middot; Then assess your game
        </p>
      </div>

      {/* Copyright */}
      <div style={{ marginTop: 24, textAlign: 'center', lineHeight: 1.8 }}>
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
            <a
              href={league.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: league.colors.primary, textDecoration: 'none' }}
            >
              Visit {league.name} &rarr;
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
