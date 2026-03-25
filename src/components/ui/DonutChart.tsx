'use client';

interface DonutChartProps {
  /** 0–100 */
  value: number;
  /** Radius of the donut in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Color of the filled arc */
  color?: string;
  /** Color of the track */
  trackColor?: string;
  /** Center label (defaults to value%) */
  label?: string;
  /** Sub-label below the main label */
  subLabel?: string;
}

export default function DonutChart({
  value,
  size = 160,
  strokeWidth = 12,
  color = 'var(--primary)',
  trackColor = 'var(--surface-high)',
  label,
  subLabel,
}: DonutChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s var(--ease-out)',
          }}
        />
      </svg>

      {/* center label */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.22,
          fontWeight: 800,
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}>
          {label ?? `${Math.round(clamped)}%`}
        </span>
        {subLabel && (
          <span style={{
            fontSize: size * 0.085,
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
            marginTop: 4,
          }}>
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
