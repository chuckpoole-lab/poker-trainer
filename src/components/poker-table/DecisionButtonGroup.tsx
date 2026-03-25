'use client';

import { SimplifiedAction, ACTION_LABELS } from '@/lib/types';

interface DecisionButtonGroupProps {
  onSelect: (action: SimplifiedAction) => void;
  disabled?: boolean;
}

// Always show these four actions in this exact order
const UNIFORM_ACTIONS: SimplifiedAction[] = [
  SimplifiedAction.CALL,
  SimplifiedAction.OPEN,  // Labeled "Raise" via ACTION_LABELS
  SimplifiedAction.JAM,
  SimplifiedAction.FOLD,
];

const ACTION_STYLES: Record<string, string> = {
  [SimplifiedAction.FOLD]: 'action-btn-fold',
  [SimplifiedAction.OPEN]: 'action-btn-open',
  [SimplifiedAction.CALL]: 'action-btn-call',
  [SimplifiedAction.JAM]: 'action-btn-jam',
  [SimplifiedAction.RAISE_FOLD]: 'action-btn-raise-fold',
  [SimplifiedAction.RAISE_CALL]: 'action-btn-raise-call',
  [SimplifiedAction.LIMP]: 'action-btn-limp',
};

export default function DecisionButtonGroup({ onSelect, disabled }: DecisionButtonGroupProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      padding: '16px 0',
      maxWidth: 340,
      margin: '0 auto',
    }}>
      {UNIFORM_ACTIONS.map((action) => (
        <button
          key={action}
          className={`action-btn ${ACTION_STYLES[action]}`}
          onClick={() => onSelect(action)}
          disabled={disabled}
          style={{
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {ACTION_LABELS[action]}
        </button>
      ))}
    </div>
  );
}
