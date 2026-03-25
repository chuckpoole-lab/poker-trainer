'use client';

import { useState } from 'react';
import { ResultClass } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';

interface FeedbackCardProps {
  result: ResultClass;
  correctAction: string;
  explanation: string;
  /** Targeted "why" explanation for the specific action the user chose */
  whyExplanation?: string;
  /** Button label — e.g. "Next Hand" or "See Results" */
  nextLabel?: string;
  onNext: () => void;
}

const RESULT_CONFIG: Record<ResultClass, {
  badge: 'correct' | 'acceptable' | 'leak';
  label: string;
  accentColor: string;
}> = {
  [ResultClass.CORRECT]:    { badge: 'correct',    label: 'Correct!',   accentColor: 'var(--color-correct)' },
  [ResultClass.ACCEPTABLE]: { badge: 'acceptable', label: 'Acceptable', accentColor: 'var(--color-acceptable)' },
  [ResultClass.LEAK]:       { badge: 'leak',       label: 'Leak Found', accentColor: 'var(--color-leak)' },
};

export default function FeedbackCard({
  result,
  correctAction,
  explanation,
  whyExplanation,
  nextLabel = 'Next Hand',
  onNext,
}: FeedbackCardProps) {
  const config = RESULT_CONFIG[result];
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Card
      accent={config.badge}
      elevation="floating"
      style={{
        marginTop: 16,
        textAlign: 'center',
        animation: 'feedbackSlideUp 0.3s var(--ease-out)',
      }}
    >
      <Badge variant={config.badge} size="md">
        {config.label}
      </Badge>

      {result !== ResultClass.CORRECT && (
        <p style={{
          color: 'var(--primary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          marginTop: 12,
          marginBottom: 0,
        }}>
          Best play: <span style={{ color: config.accentColor }}>{correctAction}</span>
        </p>
      )}

      <p style={{
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.6,
        marginTop: 12,
        fontFamily: 'var(--font-body)',
      }}>
        {explanation}
      </p>

      {/* ── Why? expandable section ── */}
      {whyExplanation && (
        <>
          {!showWhy ? (
            <button
              onClick={() => setShowWhy(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-high)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                padding: '8px 16px',
                cursor: 'pointer',
                marginTop: 8,
                transition: 'background 0.15s ease',
              }}
            >
              <span style={{ fontSize: 16 }}>?</span>
              {result === ResultClass.CORRECT ? 'Why is this correct?' : 'Why was my choice wrong?'}
            </button>
          ) : (
            <div
              style={{
                marginTop: 8,
                padding: '12px 14px',
                background: 'var(--surface-high)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                textAlign: 'left',
                animation: 'whySlideDown 0.25s var(--ease-out)',
              }}
            >
              <div style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}>
                {result === ResultClass.CORRECT ? 'Why this is the right play' : 'Detailed analysis'}
              </div>
              <p style={{
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.7,
                margin: 0,
                fontFamily: 'var(--font-body)',
              }}>
                {whyExplanation}
              </p>
            </div>
          )}
        </>
      )}

      <Button
        variant="primary"
        block
        onClick={onNext}
        style={{ marginTop: 16 }}
      >
        {nextLabel}
      </Button>

      <style>{`
        @keyframes feedbackSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes whySlideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-4px); }
          to   { opacity: 1; max-height: 500px; transform: translateY(0); }
        }
      `}</style>
    </Card>
  );
}
