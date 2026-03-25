'use client';

import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

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
      {/* Logo area */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1e6b43 0%, #0d3321 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '2px solid rgba(56, 189, 248, 0.3)',
        }}>
          <span style={{ fontSize: 36, color: '#1a1a1a' }}>&#9824;</span>
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          color: '#e8ecf1',
        }}>
          Poker Trainer
        </h1>
        <p style={{
          fontSize: 14,
          color: '#64748b',
          marginTop: 4,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          MTT Decision Training
        </p>
      </div>

      {/* Value proposition */}
      <div style={{ maxWidth: 340 }}>
        <p style={{
          fontSize: 18,
          color: '#94a3b8',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Learn positions, build strategy, and train the decisions that matter most in live tournament poker.
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
          &copy; {new Date().getFullYear()}{' '}Chuck Poole &amp; Chris Thatcher. All rights reserved.
        </p>
        <p style={{ fontSize: 11, color: '#3b4555', margin: 0 }}>
          Developed by White Rabbit Advisory Group
        </p>
      </div>
    </div>
  );
}
