/**
 * League management service — CRUD operations and logo uploads.
 * Used by the admin panel to manage league partner branding.
 */

import { supabase } from './supabase';

export interface LeagueRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  welcome_text: string | null;
  website_url: string | null;
  copyright: string | null;
  color_primary: string;
  color_primary_dim: string;
  color_gold: string;
  color_surface: string | null;
  color_surface_container: string | null;
  color_felt_base: string | null;
  color_felt_light: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ FETCH LEAGUES ============

/** Get all leagues (admin view — includes inactive) */
export async function getAllLeagues(): Promise<LeagueRow[]> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name');

  if (error) { console.error('Failed to fetch leagues:', error.message); return []; }
  return (data ?? []) as LeagueRow[];
}

/** Get a single league by slug */
export async function getLeagueBySlug(slug: string): Promise<LeagueRow | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as LeagueRow;
}

// ============ CREATE / UPDATE / DELETE ============

export async function createLeague(league: Partial<LeagueRow>): Promise<LeagueRow | null> {
  const { data, error } = await supabase
    .from('leagues')
    .insert({
      slug: league.slug,
      name: league.name,
      tagline: league.tagline || null,
      welcome_text: league.welcome_text || null,
      website_url: league.website_url || null,
      copyright: league.copyright || null,
      color_primary: league.color_primary || '#a6d1b2',
      color_primary_dim: league.color_primary_dim || '#40674e',
      color_gold: league.color_gold || '#e9c349',
      color_surface: league.color_surface || null,
      color_surface_container: league.color_surface_container || null,
      color_felt_base: league.color_felt_base || null,
      color_felt_light: league.color_felt_light || null,
    })
    .select()
    .single();

  if (error) { console.error('Failed to create league:', error.message); return null; }
  return data as LeagueRow;
}

export async function updateLeague(id: string, updates: Partial<LeagueRow>): Promise<boolean> {
  const { error } = await supabase
    .from('leagues')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) { console.error('Failed to update league:', error.message); return false; }
  return true;
}

export async function deleteLeague(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('leagues')
    .delete()
    .eq('id', id);

  if (error) { console.error('Failed to delete league:', error.message); return false; }
  return true;
}

export async function toggleLeagueActive(id: string, isActive: boolean): Promise<boolean> {
  return updateLeague(id, { is_active: isActive } as Partial<LeagueRow>);
}

// ============ LOGO UPLOAD ============

/** Upload a logo image to Supabase Storage and return the public URL */
export async function uploadLeagueLogo(
  slug: string,
  file: File,
): Promise<string | null> {
  // Create a unique filename based on slug
  const ext = file.name.split('.').pop() || 'png';
  const path = `${slug}/logo.${ext}`;

  // Upload (upsert to replace existing)
  const { error: uploadError } = await supabase.storage
    .from('league-logos')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('Failed to upload logo:', uploadError.message);
    return null;
  }

  // Get public URL
  const { data } = supabase.storage
    .from('league-logos')
    .getPublicUrl(path);

  return data.publicUrl;
}

/** Delete a logo from Supabase Storage */
export async function deleteLeagueLogo(slug: string): Promise<boolean> {
  // List files in the slug folder
  const { data: files } = await supabase.storage
    .from('league-logos')
    .list(slug);

  if (!files || files.length === 0) return true;

  const paths = files.map(f => `${slug}/${f.name}`);
  const { error } = await supabase.storage
    .from('league-logos')
    .remove(paths);

  if (error) { console.error('Failed to delete logo:', error.message); return false; }
  return true;
}
