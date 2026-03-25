'use client';

interface ProgressBarProps {
  /** 0 – 100 */
  value: number;
  /** Bar color */
  color?: string;
  /** Track height in px */
  height?: number;
  /** Segmented mode: show discrete dots instead of a continuous bar */
  segments?: number;
  /** In segmented mode, which segments are complete/active */
  completedSegments?: number;
  /** Optional segment colors — array matching segment indices */
  segmentColors?: string[];
}

export default function ProgressBar({
  value,
  color = 'var(--primary)',
  height = 8,
  segments,
  completedSegments = 0,
  segmentColors,
}: ProgressBarProps) {
  /* ── Segmented mode ── */
  if (segments && segments > 0) {
    return (
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        alignItems: 'center',
      }}>
        {Array.from({ length: segments }, (_, i) => {
          const isComplete = i < completedSegments;
          const dotColor = segmentColors?.[i] ?? (isComplete ? color : 'var(--surface-high)');
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: dotColor,
                transition: `background var(--duration-fast) var(--ease-out)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  /* ── Continuous bar ── */
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{
      background: 'var(--surface-high)',
      borderRadius: 'var(--radius-sm)',
      height,
      width: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${clamped}%`,
        borderRadius: 'var(--radius-sm)',
        background: color,
        transition: `width 0.6s var(--ease-out)`,
      }} />
    </div>
  );
}
