'use client';

import { ResultClass } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';

interface FeedbackCardProps {
  result: ResultClass;
  correctAction: string;
  explanation: string;
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
  nextLabel = 'Next Hand',
  onNext,
}: FeedbackCardProps) {
  const config = RESULT_CONFIG[result];

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
      `}</style>
    </Card>
  );
}
