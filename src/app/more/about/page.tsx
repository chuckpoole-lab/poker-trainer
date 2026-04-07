'use client';

export default function AboutPage() {
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
        marginBottom: 16,
      }}>
        About
      </h1>

      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e8e2d9',
        borderRadius: 14,
        padding: 20,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>♠️</div>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1a1a1a',
          textAlign: 'center',
          marginBottom: 4,
          fontFamily: 'var(--font-body)',
        }}>
          Poker Trainer
        </h2>
        <p style={{
          fontSize: 13,
          color: '#888',
          textAlign: 'center',
          marginBottom: 20,
          fontFamily: 'var(--font-body)',
        }}>
          GTO preflop training for bar poker players
        </p>

        <div style={{
          borderTop: '1px solid #f0ebe3',
          paddingTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            <span style={{ color: '#888' }}>Version</span>
            <span style={{ color: '#1a1a1a', fontWeight: 600 }}>2.0 beta</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            <span style={{ color: '#888' }}>Built by</span>
            <span style={{ color: '#1a1a1a', fontWeight: 600 }}>Chris Thatcher & Chuck Poole</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            <span style={{ color: '#888' }}>Range engine</span>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>23/23 GTO benchmarks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
