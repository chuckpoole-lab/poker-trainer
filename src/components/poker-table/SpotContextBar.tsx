'use client';

interface SpotContextBarProps {
  handCode: string;
  stackDepthBb: number;
  /** Optional prompt text like "What is your play?" */
  prompt?: string;
}

export default function SpotContextBar({
  handCode,
  stackDepthBb,
  prompt,
}: SpotContextBarProps) {
  return (
    <div style={{
      textAlign: 'center',
      margin: '16px 0 8px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-lg)',
        padding: '8px 18px',
      }}>
        <span style={{
          fontSize: 'var(--text-base)',
          fontWeight: 800,
          color: 'var(--on-surface)',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-display)',
        }}>
          {handCode}
        </span>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          fontWeight: 600,
        }}>
          at
        </span>
        <span style={{
          fontSize: 'var(--text-base)',
          fontWeight: 800,
          color: 'var(--gold)',
          fontFamily: 'var(--font-display)',
        }}>
          {stackDepthBb}<span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.7 }}>bb</span>
        </span>
      </div>

      {prompt && (
        <p style={{
          color: 'var(--muted)',
          fontSize: 'var(--text-sm)',
          marginTop: 8,
          marginBottom: 0,
        }}>
          {prompt}
        </p>
      )}
    </div>
  );
}
