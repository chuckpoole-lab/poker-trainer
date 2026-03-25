'use client';

import { SimplifiedAction } from '@/lib/types';

interface ActionBarProps {
  spotType?: string; // kept for interface compat but no longer used for filtering
  onSelect: (action: SimplifiedAction) => void;
  disabled?: boolean;
}

/* Universal 4-button layout — same options every hand.
   Players should be able to pick the "wrong" action (e.g. Call in an unopened pot)
   so they can discover their leaks through feedback. */
const UNIVERSAL_ACTIONS: { action: SimplifiedAction; label: string; bg: string; color: string; hoverBg: string }[] = [
  { action: SimplifiedAction.FOLD, label: 'Fold',   bg: 'rgba(56,58,54,0.6)',     color: '#c1c8c0', hoverBg: 'rgba(56,58,54,0.85)' },
  { action: SimplifiedAction.OPEN, label: 'Raise',  bg: 'rgba(166,209,178,0.18)', color: '#a6d1b2', hoverBg: 'rgba(166,209,178,0.3)' },
  { action: SimplifiedAction.CALL, label: 'Call',    bg: 'rgba(34,197,94,0.18)',   color: '#86efac', hoverBg: 'rgba(34,197,94,0.3)' },
  { action: SimplifiedAction.JAM,  label: 'All In',  bg: 'rgba(239,68,68,0.18)',   color: '#fca5a5', hoverBg: 'rgba(239,68,68,0.3)' },
];

export default function ActionBar({ onSelect, disabled }: ActionBarProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      padding: '16px 0',
      maxWidth: 420,
      margin: '0 auto',
    }}>
      {UNIVERSAL_ACTIONS.map(({ action, label, bg, color, hoverBg }) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          style={{
            padding: '14px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.01em',
            background: bg,
            color,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.45 : 1,
            transition: 'all var(--duration-fast) var(--ease-out)',
            minHeight: 48,
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            if (!disabled) (e.currentTarget.style.background = hoverBg);
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style.background = bg);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
