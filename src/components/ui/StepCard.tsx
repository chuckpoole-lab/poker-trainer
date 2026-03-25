'use client';

import { useState } from 'react';
import Button from './Button';

interface Step {
  title: string;
  content: React.ReactNode;
}

interface StepCardProps {
  steps: Step[];
  /** Called when user completes the final step */
  onComplete: () => void;
  /** Label for the final step's button */
  completeLabel?: string;
  /** Optional skip link */
  onSkip?: () => void;
  skipLabel?: string;
}

export default function StepCard({
  steps,
  onComplete,
  completeLabel = "Let's Go",
  onSkip,
  skipLabel = 'Skip intro',
}: StepCardProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === steps.length - 1;
  const step = steps[current];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      {/* backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(18,20,17,0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />

      {/* panel */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        maxHeight: '85vh',
        overflowY: 'auto',
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-xl)',
        animation: 'stepCardIn 0.25s var(--ease-out)',
      }}>
        {/* step title */}
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-display)',
          margin: '0 0 var(--space-4)',
          textAlign: 'center',
        }}>
          {step.title}
        </h2>

        {/* step content */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {step.content}
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {isLast ? (
            <Button variant="primary" block onClick={onComplete}>
              {completeLabel}
            </Button>
          ) : (
            <Button variant="primary" block onClick={() => setCurrent(c => c + 1)}>
              Next
            </Button>
          )}

          {current > 0 && (
            <Button variant="ghost" block onClick={() => setCurrent(c => c - 1)}>
              Back
            </Button>
          )}

          {onSkip && (
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
                padding: 'var(--space-2)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'center',
              }}
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes stepCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
