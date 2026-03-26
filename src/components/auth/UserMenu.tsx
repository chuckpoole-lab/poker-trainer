'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/services/auth-context';

export default function UserMenu() {
  const { user, profile, isGuest, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (isGuest) {
    return (
      <button
        onClick={signInWithGoogle}
        style={{
          background: 'var(--primary)',
          color: 'var(--surface)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        Sign In
      </button>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%' }}
          />
        ) : (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
          }}>
            {initial}
          </div>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            background: 'var(--surface-high)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 0',
            minWidth: 180,
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 4,
            }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-body)',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--muted)',
                fontFamily: 'var(--font-body)',
              }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); signOut(); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-leak)',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
