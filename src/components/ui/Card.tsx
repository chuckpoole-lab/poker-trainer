'use client';

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Colored left accent border */
  accent?: 'correct' | 'acceptable' | 'leak' | 'gold' | 'primary' | 'none';
  /** Elevation level */
  elevation?: 'flat' | 'raised' | 'floating';
}

const ACCENT_COLORS: Record<string, string> = {
  correct: 'var(--color-correct)',
  acceptable: 'var(--color-acceptable)',
  leak: 'var(--color-leak)',
  gold: 'var(--gold)',
  primary: 'var(--primary)',
};

const ELEVATION_SHADOWS: Record<string, string> = {
  flat: 'none',
  raised: 'var(--shadow-md)',
  floating: 'var(--shadow-lg)',
};

export default function Card({
  accent = 'none',
  elevation = 'raised',
  style,
  children,
  ...rest
}: CardProps) {
  const accentColor = accent !== 'none' ? ACCENT_COLORS[accent] : undefined;

  return (
    <div
      style={{
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        boxShadow: ELEVATION_SHADOWS[elevation],
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
        transition: `box-shadow var(--duration-normal) var(--ease-out)`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
