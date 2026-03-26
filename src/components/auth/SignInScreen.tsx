'use client';

import { useAuth } from '@/lib/services/auth-context';
import { Button } from '@/components/ui';

export default function SignInScreen() {
  const { signInWithGoogle, continueAsGuest, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
      }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'var(--surface)',
    }}>
      {/* Logo / Title */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: 'var(--primary)',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Poker Trainer
        </div>
        <p style={{
          color: 'var(--muted)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          maxWidth: 280,
          margin: '0 auto',
        }}>
          Master preflop strategy. Track your leaks. Sharpen your game.
        </p>
      </div>

      {/* Sign in card */}
      <div style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Google sign-in */}
        <button
          onClick={signInWithGoogle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px 20px',
            background: '#fff',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '4px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Guest mode */}
        <Button
          variant="secondary"
          block
          onClick={continueAsGuest}
        >
          Continue as Guest
        </Button>

        <p style={{
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          marginTop: 4,
          lineHeight: 1.5,
        }}>
          Guest progress is saved on this device only.
          <br />
          Sign in to sync across devices.
        </p>
      </div>
    </div>
  );
}
