'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/services/auth-context';
import { Button } from '@/components/ui';

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  // Detect common in-app browsers that block Google OAuth
  return /FBAN|FBAV|Instagram|Messenger|Twitter|Line|Snapchat|WeChat|MicroMessenger/i.test(ua);
}

export default function SignInScreen() {
  const { signInWithGoogle, continueAsGuest, loading } = useAuth();
  const [inApp, setInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

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
        {/* In-app browser warning */}
        {inApp && (
          <div style={{
            background: '#FFF3CD',
            border: '1px solid #FFCB2F',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 4,
            textAlign: 'center',
          }}>
            <p style={{
              color: '#664D03',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              marginBottom: 8,
              lineHeight: 1.4,
            }}>
              Google sign-in doesn&apos;t work in this browser
            </p>
            <p style={{
              color: '#664D03',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-body)',
              marginBottom: 12,
              lineHeight: 1.5,
            }}>
              Tap the button below to copy the link, then paste it in Safari or Chrome to sign in.
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                background: '#664D03',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        )}

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
