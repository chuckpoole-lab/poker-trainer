'use client';

/**
 * Lightweight inline SVG icon component.
 * All icons are 24×24 viewBox, stroke-based (Lucide style), rendered inline.
 * No icon library dependency — just the ~15 icons the app actually needs.
 */

export type IconName =
  | 'home' | 'book' | 'target' | 'zap' | 'bar-chart'
  | 'settings' | 'chevron-right' | 'chevron-left' | 'check'
  | 'x' | 'play' | 'trophy' | 'cards' | 'refresh' | 'info';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

/* Each path is a standard 24×24 SVG path, stroke-linecap/linejoin round */
const PATHS: Record<IconName, string> = {
  home:
    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  book:
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  target:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  zap:
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'bar-chart':
    'M12 20V10 M18 20V4 M6 20v-4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  'chevron-right':
    'M9 18l6-6-6-6',
  'chevron-left':
    'M15 18l-6-6 6-6',
  check:
    'M20 6L9 17l-5-5',
  x:
    'M18 6L6 18 M6 6l12 12',
  play:
    'M5 3l14 9-14 9V3z',
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.08 1.08 0 0 1 14 17v-2.34 M18 2H6v7a6 6 0 0 0 12 0V2z',
  cards:
    'M16 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M9 7h0.01 M15 17h0.01',
  refresh:
    'M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10 M23 14l-4.64 4.36A9 9 0 0 1 3.51 15',
  info:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 16v-4 M12 8h0.01',
};

export default function Icon({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}: IconProps) {
  const pathData = PATHS[name];
  if (!pathData) return null;

  /* Split multi-path strings (separated by ' M') into individual <path> elements */
  const segments = pathData.split(/(?= M)/);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {segments.map((d, i) => (
        <path key={i} d={d.trim()} />
      ))}
    </svg>
  );
}
