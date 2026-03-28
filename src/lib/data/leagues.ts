/* ═══════════════════════════════════════════════════════════════════
   League Branding Configuration
   ═══════════════════════════════════════════════════════════════════
   Add a new league partner by copying one of the entries below and
   customizing the colors, logo, and text. The slug is used in the
   URL query parameter, e.g. ?league=acpl
   ═══════════════════════════════════════════════════════════════════ */

export interface LeagueConfig {
  /** URL-safe identifier — used in ?league= query param */
  slug: string;
  /** Display name shown in the app */
  name: string;
  /** Optional tagline below the logo */
  tagline?: string;
  /** URL to the league's logo image (PNG/SVG recommended) */
  logoUrl?: string;
  /** Brand colors that override CSS variables */
  colors: {
    /** Main brand color — buttons, accents, active states */
    primary: string;
    /** Dimmed version of primary — hover states */
    primaryDim: string;
    /** Gold/highlight color — badges, streaks */
    gold: string;
    /** Dark surface — app background */
    surface?: string;
    /** Card/container background */
    surfaceContainer?: string;
    /** Felt color on poker table */
    feltBase?: string;
    /** Lighter felt color */
    feltLight?: string;
  };
  /** Optional custom welcome text on the home page */
  welcomeText?: string;
  /** Optional link to the league's website */
  websiteUrl?: string;
  /** Copyright line override */
  copyright?: string;
}

/**
 * Master list of league configurations.
 * Add new league partners here.
 */
export const LEAGUES: Record<string, LeagueConfig> = {
  /* ── Default (no league) ── */
  default: {
    slug: 'default',
    name: 'Poker Trainer',
    tagline: 'MTT Decision Training',
    colors: {
      primary: '#a6d1b2',
      primaryDim: '#40674e',
      gold: '#e9c349',
    },
  },

  /* ── Example: Ace City Poker League ── */
  acpl: {
    slug: 'acpl',
    name: 'Ace City Poker League',
    tagline: 'Official Training Platform',
    logoUrl: '/leagues/acpl-logo.png',
    colors: {
      primary: '#e74c3c',
      primaryDim: '#c0392b',
      gold: '#f1c40f',
      surface: '#1a1012',
      surfaceContainer: '#241a1e',
      feltBase: '#2d0a0a',
      feltLight: '#3d1414',
    },
    welcomeText: 'Train smarter with the official Ace City Poker League training platform.',
    websiteUrl: 'https://acecitypokerlague.com',
    copyright: '© 2026 Ace City Poker League. Powered by Poker Trainer.',
  },

  /* ── Example: South Florida Hold\'em ── */
  sfh: {
    slug: 'sfh',
    name: "South Florida Hold'em",
    tagline: 'Level Up Your Game',
    logoUrl: '/leagues/sfh-logo.png',
    colors: {
      primary: '#38bdf8',
      primaryDim: '#0284c7',
      gold: '#fbbf24',
      surface: '#0c1220',
      surfaceContainer: '#131d2e',
      feltBase: '#0a2540',
      feltLight: '#0e3358',
    },
    welcomeText: "Welcome, South Florida Hold'em members! Sharpen your tournament skills here.",
    websiteUrl: 'https://southfloridaholdem.com',
    copyright: "© 2026 South Florida Hold'em. Powered by Poker Trainer.",
  },

  /* ── Example: Vegas Grinders Club ── */
  vgc: {
    slug: 'vgc',
    name: 'Vegas Grinders Club',
    tagline: 'Grind. Study. Win.',
    logoUrl: '/leagues/vgc-logo.png',
    colors: {
      primary: '#d4af37',
      primaryDim: '#a8892b',
      gold: '#ffd700',
      surface: '#141210',
      surfaceContainer: '#1e1c18',
      feltBase: '#1a2e1a',
      feltLight: '#243a24',
    },
    welcomeText: 'The official training hub for Vegas Grinders Club members.',
    websiteUrl: 'https://vegasgrindersclub.com',
    copyright: '© 2026 Vegas Grinders Club. Powered by Poker Trainer.',
  },
};

/** Get a league config by slug, falling back to default */
export function getLeagueConfig(slug?: string | null): LeagueConfig {
  if (!slug || !LEAGUES[slug]) return LEAGUES.default;
  return LEAGUES[slug];
}
