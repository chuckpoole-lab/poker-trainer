'use client';

interface SkeletonProps {
  /** Width — number for px, string for CSS value */
  width?: number | string;
  /** Height — number for px, string for CSS value */
  height?: number | string;
  /** Border radius */
  radius?: number | string;
  /** Display as a circle */
  circle?: boolean;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-sm)',
  circle = false,
  style,
}: SkeletonProps) {
  const size = circle ? (typeof width === 'number' ? width : 40) : undefined;

  return (
    <div
      aria-hidden="true"
      style={{
        width: circle ? size : width,
        height: circle ? size : height,
        borderRadius: circle ? '50%' : radius,
        background: 'var(--surface-high)',
        animation: 'skeletonPulse 1.5s var(--ease-in-out) infinite',
        ...style,
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
