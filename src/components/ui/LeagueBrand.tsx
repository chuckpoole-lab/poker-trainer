'use client';

import { useLeague } from '@/lib/services/league-context';

/* ═══════════════════════════════════════════════════════════════════
   LeagueBrand — Reusable brand block (logo + name + tagline)
   ═══════════════════════════════════════════════════════════════════
   Drop this into any page to show the active league's branding.
   Falls back to the default Poker Trainer spade icon when no
   league is active.
   ═══════════════════════════════════════════════════════════════════ */

interface LeagueBrandProps {
  /** Logo size in px (default 72) */
  size?: number;
  /** Show the tagline below the name (default true) */
  showTagline?: boolean;
  /** Show the name text (default true) */
  showName?: boolean;
}

export default function LeagueBrand({
  size = 72,
  showTagline = true,
  showName = true,
}: LeagueBrandProps) {
  const { league, isWhiteLabel } = useLeague();

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Logo */}
      <div style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: isWhiteLabel && league.logoUrl
          ? 'transparent'
          : 'linear-gradient(135deg, #1e6b43 0%, #0d3321 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        border: isWhiteLabel && league.logoUrl
          ? 'none'
          : '2px solid rgba(56, 189, 248, 0.3)',
        overflow: 'hidden',
      }}>
        {isWhiteLabel && league.logoUrl ? (
          <img
            src={league.logoUrl}
            alt={`${league.name} logo`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <span style={{ fontSize: size * 0.5, color: '#1a1a1a' }}>&#9824;</span>
        )}
      </div>

      {/* Name */}
      {showName && (
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          color: '#e8ecf1',
        }}>
          {league.name}
        </h1>
      )}

      {/* Tagline */}
      {showTagline && league.tagline && (
        <p style={{
          fontSize: 14,
          color: isWhiteLabel ? league.colors.primary : '#64748b',
          marginTop: 4,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {league.tagline}
        </p>
      )}
    </div>
  );
}
