'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button } from '@/components/ui';
import {
  getAllLeagues,
  createLeague,
  updateLeague,
  deleteLeague,
  toggleLeagueActive,
  uploadLeagueLogo,
  type LeagueRow,
} from '@/lib/services/league-storage';

/* ═══════════════════════════════════════════════════════════════════
   LeagueManager — Admin component for managing league partners
   ═══════════════════════════════════════════════════════════════════ */

const EMPTY_LEAGUE: Partial<LeagueRow> = {
  slug: '',
  name: '',
  tagline: '',
  welcome_text: '',
  website_url: '',
  copyright: '',
  color_primary: '#a6d1b2',
  color_primary_dim: '#40674e',
  color_gold: '#e9c349',
  color_surface: '',
  color_surface_container: '',
  color_felt_base: '',
  color_felt_light: '',
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function ColorField({ label, value, onChange, placeholder }: ColorFieldProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 32, height: 32, padding: 0, border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none',
        }}
      />
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
          {label}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '#000000'}
          style={{
            width: '100%', padding: '4px 8px', fontSize: 'var(--text-sm)',
            background: 'var(--surface-high)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
          }}
        />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (val: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const inputStyle = {
    width: '100%', padding: '6px 10px', fontSize: 'var(--text-sm)',
    background: 'var(--surface-high)', color: 'var(--on-surface)',
    border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)', resize: 'none' as const,
  };

  return (
    <div>
      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {multiline ? (
        <textarea rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} style={inputStyle} />
      ) : (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

export default function LeagueManager() {
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LeagueRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLeagues();
  }, []);

  async function loadLeagues() {
    setLoading(true);
    const data = await getAllLeagues();
    setLeagues(data);
    setLoading(false);
  }

  function startNew() {
    setEditing({ ...EMPTY_LEAGUE });
    setIsNew(true);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function startEdit(league: LeagueRow) {
    setEditing({ ...league });
    setIsNew(false);
    setLogoFile(null);
    setLogoPreview(league.logo_url || null);
  }

  function cancelEdit() {
    setEditing(null);
    setIsNew(false);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function updateField(field: string, value: string) {
    setEditing(prev => prev ? { ...prev, [field]: value } : null);
  }

  async function handleSave() {
    if (!editing?.slug || !editing?.name) return;
    setSaving(true);

    try {
      let logoUrl = editing.logo_url || null;

      // Upload logo if a new file was selected
      if (logoFile && editing.slug) {
        const url = await uploadLeagueLogo(editing.slug, logoFile);
        if (url) logoUrl = url;
      }

      if (isNew) {
        const created = await createLeague({ ...editing, logo_url: logoUrl });
        if (created) {
          setLeagues(prev => [...prev, created]);
        }
      } else if (editing.id) {
        const success = await updateLeague(editing.id, { ...editing, logo_url: logoUrl });
        if (success) {
          setLeagues(prev => prev.map(l =>
            l.id === editing.id ? { ...l, ...editing, logo_url: logoUrl, updated_at: new Date().toISOString() } as LeagueRow : l
          ));
        }
      }

      cancelEdit();
    } catch (err) {
      console.error('Save failed:', err);
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this league?')) return;
    const success = await deleteLeague(id);
    if (success) setLeagues(prev => prev.filter(l => l.id !== id));
  }

  async function handleToggle(id: string, currentlyActive: boolean) {
    const success = await toggleLeagueActive(id, !currentlyActive);
    if (success) {
      setLeagues(prev => prev.map(l =>
        l.id === id ? { ...l, is_active: !currentlyActive } : l
      ));
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>Loading leagues...</p>;
  }

  // ── Editor form ──
  if (editing) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const previewUrl = editing.slug ? `${origin}?league=${editing.slug}` : '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--on-surface)',
            fontFamily: 'var(--font-display)', margin: 0,
          }}>
            {isNew ? 'New League Partner' : `Edit: ${editing.name}`}
          </h2>
          <button onClick={cancelEdit} style={{
            background: 'none', color: 'var(--muted)', fontSize: 'var(--text-sm)', padding: '4px 8px',
          }}>
            Cancel
          </button>
        </div>

        {/* Logo upload */}
        <Card elevation="raised" style={{ padding: 16 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            League Logo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--radius-md)',
              background: 'var(--surface-high)', border: '2px dashed var(--outline-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
            }}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 28, color: 'var(--muted)' }}>+</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600,
                  background: 'var(--surface-high)', color: 'var(--on-surface)',
                  border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>
                PNG or SVG, square, at least 200×200px
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
          </div>
        </Card>

        {/* Basic info */}
        <Card elevation="raised" style={{ padding: 16 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            League Info
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TextField label="League Name *" value={editing.name || ''} onChange={v => updateField('name', v)} placeholder="Ace City Poker League" />
              <TextField label="URL Slug *" value={editing.slug || ''} onChange={v => updateField('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="acpl" />
            </div>
            <TextField label="Tagline" value={editing.tagline || ''} onChange={v => updateField('tagline', v)} placeholder="Official Training Platform" />
            <TextField label="Welcome Message" value={editing.welcome_text || ''} onChange={v => updateField('welcome_text', v)} placeholder="Welcome, league members!" multiline />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TextField label="Website URL" value={editing.website_url || ''} onChange={v => updateField('website_url', v)} placeholder="https://..." />
              <TextField label="Copyright Line" value={editing.copyright || ''} onChange={v => updateField('copyright', v)} placeholder="© 2026 League Name" />
            </div>
          </div>
        </Card>

        {/* Brand colors */}
        <Card elevation="raised" style={{ padding: 16 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Brand Colors
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ColorField label="Primary *" value={editing.color_primary || '#a6d1b2'} onChange={v => updateField('color_primary', v)} />
            <ColorField label="Primary Dim *" value={editing.color_primary_dim || '#40674e'} onChange={v => updateField('color_primary_dim', v)} />
            <ColorField label="Gold / Highlight *" value={editing.color_gold || '#e9c349'} onChange={v => updateField('color_gold', v)} />
            <ColorField label="Background" value={editing.color_surface || ''} onChange={v => updateField('color_surface', v)} placeholder="Optional" />
            <ColorField label="Card Background" value={editing.color_surface_container || ''} onChange={v => updateField('color_surface_container', v)} placeholder="Optional" />
            <ColorField label="Table Felt" value={editing.color_felt_base || ''} onChange={v => updateField('color_felt_base', v)} placeholder="Optional" />
          </div>
        </Card>

        {/* Live preview */}
        <Card elevation="raised" style={{ padding: 16 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Preview
          </label>
          <div style={{
            background: editing.color_surface || 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            textAlign: 'center',
            border: '1px solid var(--outline-variant)',
          }}>
            {/* Preview logo */}
            <div style={{
              width: 56, height: 56, borderRadius: 12, margin: '0 auto 12px',
              overflow: 'hidden',
              background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #1e6b43 0%, #0d3321 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: logoPreview ? 'none' : '2px solid rgba(56, 189, 248, 0.3)',
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 28, color: '#1a1a1a' }}>&#9824;</span>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#e8ecf1', marginBottom: 4 }}>
              {editing.name || 'League Name'}
            </div>
            {editing.tagline && (
              <div style={{ fontSize: 11, color: editing.color_primary || '#a6d1b2', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>
                {editing.tagline}
              </div>
            )}
            {/* Preview button */}
            <button style={{
              background: editing.color_primary || '#a6d1b2',
              color: editing.color_surface || '#121411',
              padding: '8px 24px', borderRadius: 'var(--radius-md)',
              fontWeight: 700, fontSize: 13, border: 'none',
            }}>
              Start Learning
            </button>
          </div>
          {previewUrl && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
              Share URL: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{previewUrl}</span>
            </p>
          )}
        </Card>

        {/* Save / Cancel */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="primary" onClick={handleSave} disabled={saving || !editing.slug || !editing.name}
            style={{ flex: 1 }}>
            {saving ? 'Saving...' : (isNew ? 'Create League' : 'Save Changes')}
          </Button>
          <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
        </div>
      </div>
    );
  }

  // ── League list ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{
          fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--on-surface)',
          fontFamily: 'var(--font-display)', margin: 0,
        }}>
          League Partners
        </h2>
        <Button variant="primary" onClick={startNew} style={{ padding: '6px 16px', fontSize: 'var(--text-sm)' }}>
          + Add League
        </Button>
      </div>

      {leagues.length === 0 ? (
        <Card elevation="raised" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            No league partners yet. Add your first league to start white-labeling.
          </p>
          <Button variant="primary" onClick={startNew}>Add First League</Button>
        </Card>
      ) : (
        leagues.map((league) => {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return (
            <Card key={league.id} elevation="raised" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Logo thumbnail */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: league.logo_url ? 'transparent' : `linear-gradient(135deg, ${league.color_primary}33, ${league.color_primary}11)`,
                  border: `2px solid ${league.color_primary}44`,
                }}>
                  {league.logo_url ? (
                    <img src={league.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 20, color: league.color_primary }}>♠</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--on-surface)' }}>
                      {league.name}
                    </span>
                    {/* Color dots */}
                    <span style={{ display: 'inline-flex', gap: 3 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: league.color_primary, display: 'inline-block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: league.color_gold, display: 'inline-block' }} />
                    </span>
                    {!league.is_active && (
                      <span style={{
                        fontSize: 'var(--text-xs)', background: 'var(--surface-high)',
                        color: 'var(--muted)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {origin}?league={league.slug}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleToggle(league.id, league.is_active)} style={{
                    padding: '4px 10px', fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: league.is_active ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
                    color: league.is_active ? 'var(--color-acceptable)' : 'var(--color-correct)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}>
                    {league.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => startEdit(league)} style={{
                    padding: '4px 10px', fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: 'var(--surface-high)', color: 'var(--on-surface)',
                    border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(league.id)} style={{
                    padding: '4px 10px', fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: 'rgba(239,68,68,0.1)', color: 'var(--color-leak)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
