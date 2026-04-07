'use client';

import { useState } from 'react';

interface FeedbackProps {
  onClose: () => void;
  onSubmit: (responses: FeedbackData) => void;
}

export interface FeedbackData {
  q1: number; // First time? (1=Yes, 2=No)
  q2: number; // Fun? (1=Meh, 2=Yeah!, 3=Loved it)
  q3: number; // Coming back? (1=Probably not, 2=Maybe, 3=Definitely)
  q4: number; // unused (0)
  q5: number; // unused (0)
  freeform: string;
  name: string;
  email: string;
  submittedAt: string;
}

export function FeedbackSurvey({ onClose, onSubmit }: FeedbackProps) {
  const [firstTime, setFirstTime] = useState<number | null>(null);
  const [fun, setFun] = useState<number | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const [freeform, setFreeform] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const anyContent = firstTime !== null || fun !== null || returning !== null || freeform.trim().length > 0;

  const handleSubmit = () => {
    const data: FeedbackData = {
      q1: firstTime || 0,
      q2: fun || 0,
      q3: returning || 0,
      q4: 0,
      q5: 0,
      freeform: freeform.trim(),
      name: '',
      email: '',
      submittedAt: new Date().toISOString(),
    };
    onSubmit(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: 'var(--surface-container, #fff)', borderRadius: 20, padding: '32px 24px',
          maxWidth: 400, width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--on-surface, #0f172a)', marginBottom: 8 }}>Thank you!</div>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
            Your feedback helps us make this better for everyone.
          </div>
          <button onClick={onClose} style={{
            width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
            background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body, inherit)',
          }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--surface-container, #fff)', borderRadius: 20, padding: '24px 20px',
        maxWidth: 400, width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface, #0f172a)' }}>Quick feedback</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Takes less than 30 seconds</div>
        </div>

        {/* Q1: First time? */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 10 }}>
            Is this your first time using the app?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: 1, label: 'Yes' }, { val: 2, label: 'No' }].map(opt => (
              <button key={opt.val} onClick={() => setFirstTime(opt.val)} style={{
                flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 700,
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body, inherit)',
                background: firstTime === opt.val ? '#10b981' : 'var(--surface-container, #f1f5f9)',
                color: firstTime === opt.val ? '#fff' : '#64748b',
                border: firstTime === opt.val ? '2px solid #10b981' : '2px solid var(--outline-variant, #e2e8f0)',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Q2: Fun? */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 10 }}>
            Did you have fun?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: 1, label: 'Meh', emoji: '😐' }, { val: 2, label: 'Yeah!', emoji: '😊' }, { val: 3, label: 'Loved it', emoji: '🤩' }].map(opt => (
              <button key={opt.val} onClick={() => setFun(opt.val)} style={{
                flex: 1, padding: '12px 4px', fontSize: 14, fontWeight: 700,
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body, inherit)',
                background: fun === opt.val ? '#10b981' : 'var(--surface-container, #f1f5f9)',
                color: fun === opt.val ? '#fff' : '#64748b',
                border: fun === opt.val ? '2px solid #10b981' : '2px solid var(--outline-variant, #e2e8f0)',
              }}>{opt.emoji} {opt.label}</button>
            ))}
          </div>
        </div>

        {/* Q3: Coming back? */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 10 }}>
            Will you be back?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: 1, label: 'Probably not', emoji: '👋' }, { val: 2, label: 'Maybe', emoji: '🤔' }, { val: 3, label: 'Definitely', emoji: '🔥' }].map(opt => (
              <button key={opt.val} onClick={() => setReturning(opt.val)} style={{
                flex: 1, padding: '12px 4px', fontSize: 13, fontWeight: 700,
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body, inherit)',
                background: returning === opt.val ? '#10b981' : 'var(--surface-container, #f1f5f9)',
                color: returning === opt.val ? '#fff' : '#64748b',
                border: returning === opt.val ? '2px solid #10b981' : '2px solid var(--outline-variant, #e2e8f0)',
              }}>{opt.emoji} {opt.label}</button>
            ))}
          </div>
        </div>

        {/* Q4: Suggestions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 10 }}>
            Any suggestions? <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
          </div>
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            placeholder="What would make this better for you?"
            style={{
              width: '100%', minHeight: 70, padding: '12px 14px', fontSize: 14,
              borderRadius: 12, border: '2px solid var(--outline-variant, #e2e8f0)',
              background: 'var(--surface-container, #fff)', color: 'var(--on-surface, #0f172a)',
              fontFamily: 'var(--font-body, inherit)', resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        <button onClick={handleSubmit} disabled={!anyContent} style={{
          width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
          background: anyContent ? '#10b981' : '#94a3b8', color: '#fff',
          border: 'none', borderRadius: 12, cursor: anyContent ? 'pointer' : 'default',
          fontFamily: 'var(--font-body, inherit)', opacity: anyContent ? 1 : 0.5,
        }}>Submit</button>

        <div style={{ textAlign: 'center', paddingTop: 12 }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
            color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
          }}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

// ── Welcome Toast for first-time testers ──
export function WelcomeToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      padding: '12px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      animation: 'slideDown 0.4s ease',
    }}>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Welcome to Poker Trainer!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Thanks for testing our app. Your feedback helps us make it better for everyone.
          </div>
        </div>
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#fff',
          cursor: 'pointer', fontFamily: 'var(--font-body, inherit)', whiteSpace: 'nowrap',
        }}>Got it</button>
      </div>
    </div>
  );
}

// ── Floating feedback button ──
export function FeedbackButton({ onClick, pulse }: { onClick: () => void; pulse?: boolean }) {
  return (
    <>
      {pulse && (
        <style>{`@keyframes feedbackPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(139,92,246,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 6px 20px rgba(139,92,246,0.6); }
        }`}</style>
      )}
      <button onClick={onClick} style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 998,
        background: '#8b5cf6', color: '#fff', border: 'none',
        borderRadius: 28, padding: '10px 16px', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-body, inherit)',
        animation: pulse ? 'feedbackPulse 1.5s ease-in-out 3' : 'none',
      }}>
        💬 Feedback
      </button>
    </>
  );
}
