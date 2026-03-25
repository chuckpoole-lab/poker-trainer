'use client';

import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'action';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Full width */
  block?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%)',
    color: 'var(--surface)',
    fontWeight: 'var(--font-bold)' as unknown as number,
  },
  secondary: {
    background: 'var(--surface-high)',
    color: 'var(--on-surface)',
    fontWeight: 'var(--font-semibold)' as unknown as number,
  },
  ghost: {
    background: 'transparent',
    color: 'var(--on-surface-variant)',
    fontWeight: 'var(--font-semibold)' as unknown as number,
  },
  action: {
    background: 'var(--surface-container)',
    color: 'var(--on-surface)',
    fontWeight: 'var(--font-bold)' as unknown as number,
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)' },
  md: { padding: '12px 24px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-md)' },
  lg: { padding: '16px 32px', fontSize: 'var(--text-lg)', borderRadius: 'var(--radius-md)' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
        transition: `all var(--duration-fast) var(--ease-out)`,
        opacity: disabled ? 0.45 : 1,
        width: block ? '100%' : undefined,
        minHeight: 44, /* WCAG touch target */
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="28" strokeDashoffset="8" opacity="0.7" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
