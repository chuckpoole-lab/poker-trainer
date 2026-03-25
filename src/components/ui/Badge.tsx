'use client';

import { HTMLAttributes } from 'react';

type BadgeVariant = 'correct' | 'acceptable' | 'leak' | 'neutral' | 'gold';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Smaller label size */
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  correct:    { bg: 'rgba(34,197,94,0.15)',  color: 'var(--color-correct)' },
  acceptable: { bg: 'rgba(234,179,8,0.15)',  color: 'var(--color-acceptable)' },
  leak:       { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-leak)' },
  neutral:    { bg: 'var(--surface-high)',    color: 'var(--on-surface-variant)' },
  gold:       { bg: 'rgba(233,195,73,0.15)', color: 'var(--gold)' },
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  style,
  children,
  ...rest
}: BadgeProps) {
  const v = VARIANT_STYLES[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: v.bg,
        color: v.color,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--font-semibold)' as unknown as number,
        fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
