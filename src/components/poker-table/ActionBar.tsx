'use client';

import {
  SimplifiedAction,
  SpotType,
  ACTION_LABELS,
  VALID_ACTIONS_BY_SPOT_TYPE,
} from '@/lib/types';

interface ActionBarProps {
  spotType: SpotType;
  onSelect: (action: SimplifiedAction) => void;
  disabled?: boolean;
}

/* Grandmaster's Lounge action button palette */
const ACTION_COLORS: Record<SimplifiedAction, { bg: string; color: string; hoverBg: string }> = {
  [SimplifiedAction.FOLD]:       { bg: 'rgba(56,58,54,0.6)',     color: '#c1c8c0',  hoverBg: 'rgba(56,58,54,0.85)' },
  [SimplifiedAction.OPEN]:       { bg: 'rgba(166,209,178,0.18)', color: '#a6d1b2',  hoverBg: 'rgba(166,209,178,0.3)' },
  [SimplifiedAction.CALL]:       { bg: 'rgba(34,197,94,0.18)',   color: '#86efac',   hoverBg: 'rgba(34,197,94,0.3)' },
  [SimplifiedAction.JAM]:        { bg: 'rgba(239,68,68,0.18)',   color: '#fca5a5',   hoverBg: 'rgba(239,68,68,0.3)' },
  [SimplifiedAction.RAISE_FOLD]: { bg: 'rgba(233,195,73,0.18)',  color: '#e9c349',   hoverBg: 'rgba(233,195,73,0.3)' },
  [SimplifiedAction.RAISE_CALL]: { bg: 'rgba(166,209,178,0.14)', color: '#a6d1b2',  hoverBg: 'rgba(166,209,178,0.25)' },
  [SimplifiedAction.LIMP]:       { bg: 'rgba(56,58,54,0.5)',     color: '#e3e3de',   hoverBg: 'rgba(56,58,54,0.75)' },
};

/** Fallback if spot type is somehow not in the map */
const FALLBACK_ACTIONS: SimplifiedAction[] = [
  SimplifiedAction.FOLD,
  SimplifiedAction.OPEN,
  SimplifiedAction.CALL,
  SimplifiedAction.JAM,
];

export default function ActionBar({ spotType, onSelect, disabled }: ActionBarProps) {
  const actions = VALID_ACTIONS_BY_SPOT_TYPE[spotType] ?? FALLBACK_ACTIONS;

  /* Determine grid columns: 2-col for ≤4 buttons, 3-col for 5+ */
  const cols = actions.length <= 4 ? 2 : 3;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 10,
      padding: '16px 0',
      maxWidth: 420,
      margin: '0 auto',
    }}>
      {actions.map((action) => {
        const c = ACTION_COLORS[action];
        return (
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
              background: c.bg,
              color: c.color,
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.45 : 1,
              transition: 'all var(--duration-fast) var(--ease-out)',
              minHeight: 48,
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!disabled) (e.currentTarget.style.background = c.hoverBg);
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.background = c.bg);
            }}
          >
            {ACTION_LABELS[action]}
          </button>
        );
      })}
    </div>
  );
}
