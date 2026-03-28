'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getLeagueBySlug, type LeagueRow } from './league-storage';

/* ═══════════════════════════════════════════════════════════════════
   League Context
   ═══════════════════════════════════════════════════════════════════
   Detects the active league from the URL (?league=slug), fetches
   its config from Supabase, and applies brand colors as CSS variable
   overrides on <html>. Every component inherits the league's look.
   
   Falls back to the hardcoded defaults if the DB lookup fails,
   so the app works even without running the leagues SQL migration.
   ═══════════════════════════════════════════════════════════════════ */

interface LeagueBrand {
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  welcomeText: string | null;
  websiteUrl: string | null;
  copyright: string | null;
  colors: {
    primary: string;
    primaryDim: string;
    gold: string;
    surface?: string | null;
    surfaceContainer?: string | null;
    feltBase?: string | null;
    feltLight?: string | null;
  };
}

interface LeagueContextValue {
  league: LeagueBrand;
  leagueSlug: string | null;
  isWhiteLabel: boolean;
  loading: boolean;
}

const DEFAULT_LEAGUE: LeagueBrand = {
  slug: 'default',
  name: 'Poker Trainer',
  tagline: 'MTT Decision Training',
  logoUrl: null,
  welcomeText: null,
  websiteUrl: null,
  copyright: null,
  colors: {
    primary: '#a6d1b2',
    primaryDim: '#40674e',
    gold: '#e9c349',
  },
};

const LeagueContext = createContext<LeagueContextValue>({
  league: DEFAULT_LEAGUE,
  leagueSlug: null,
  isWhiteLabel: false,
  loading: false,
});

/** Convert a Supabase league row to our internal brand shape */
function rowToBrand(row: LeagueRow): LeagueBrand {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    welcomeText: row.welcome_text,
    websiteUrl: row.website_url,
    copyright: row.copyright,
    colors: {
      primary: row.color_primary,
      primaryDim: row.color_primary_dim,
      gold: row.color_gold,
      surface: row.color_surface,
      surfaceContainer: row.color_surface_container,
      feltBase: row.color_felt_base,
      feltLight: row.color_felt_light,
    },
  };
}

/** Read ?league= from the URL */
function getLeagueSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('league');
}

/** Apply league brand colors as CSS custom property overrides on <html> */
function applyLeagueColors(brand: LeagueBrand) {
  const root = document.documentElement;
  const { colors } = brand;

  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-dim', colors.primaryDim);
  root.style.setProperty('--gold', colors.gold);
  root.style.setProperty('--color-accent', colors.primary);
  root.style.setProperty('--color-accent-hover', colors.primaryDim);
  root.style.setProperty('--text-accent', colors.primary);

  if (colors.surface) {
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--bg-primary', colors.surface);
  }
  if (colors.surfaceContainer) {
    root.style.setProperty('--surface-container', colors.surfaceContainer);
    root.style.setProperty('--bg-card', colors.surfaceContainer);
  }
  if (colors.feltBase) {
    root.style.setProperty('--felt-base', colors.feltBase);
    root.style.setProperty('--bg-table', colors.feltBase);
  }
  if (colors.feltLight) {
    root.style.setProperty('--felt-light', colors.feltLight);
    root.style.setProperty('--bg-table-felt', colors.feltLight);
  }
}

/** Remove all inline style overrides from <html> */
function clearLeagueColors() {
  const root = document.documentElement;
  const props = [
    '--primary', '--primary-dim', '--gold',
    '--color-accent', '--color-accent-hover', '--text-accent',
    '--surface', '--bg-primary',
    '--surface-container', '--bg-card',
    '--felt-base', '--bg-table',
    '--felt-light', '--bg-table-felt',
  ];
  props.forEach((p) => root.style.removeProperty(p));
}

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [leagueSlug, setLeagueSlug] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueBrand>(DEFAULT_LEAGUE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeague() {
      // Check URL first, then sessionStorage
      const slug = getLeagueSlugFromUrl()
        || (typeof window !== 'undefined' ? sessionStorage.getItem('poker-trainer-league') : null);

      if (!slug || slug === 'default') {
        clearLeagueColors();
        setLoading(false);
        return;
      }

      setLeagueSlug(slug);
      sessionStorage.setItem('poker-trainer-league', slug);

      // Try to load from Supabase
      try {
        const row = await getLeagueBySlug(slug);
        if (row) {
          const brand = rowToBrand(row);
          setLeague(brand);
          applyLeagueColors(brand);
        }
      } catch (err) {
        console.warn('Could not load league from DB, using defaults:', err);
      }

      setLoading(false);
    }

    loadLeague();
  }, []);

  const isWhiteLabel = leagueSlug !== null && leagueSlug !== 'default';

  return (
    <LeagueContext.Provider value={{ league, leagueSlug, isWhiteLabel, loading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague(): LeagueContextValue {
  return useContext(LeagueContext);
}
