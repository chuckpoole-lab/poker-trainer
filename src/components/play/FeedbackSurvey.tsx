'use client';

import { useState, useEffect } from 'react';

interface FeedbackProps {
  onClose: () => void;
  onSubmit: (responses: FeedbackData) => void;
}

export interface FeedbackData {
  q1: number; // Fun factor
  q2: number; // Ease of use
  q3: number; // Coaching tips
  q4: number; // Would recommend
  q5: number; // Come back tomorrow
  freeform: string;
  name: string;
  email: string;
  submittedAt: string;
}

const QUESTIONS = [
  { id: 'q1', text: 'How fun was the Daily Hands challenge?' },
  { id: 'q2', text: 'How easy was the app to use?' },
  { id: 'q3', text: 'How helpful were the coaching tips after each hand?' },
  { id: 'q4', text: 'How likely are you to recommend this to someone in your league?' },
  { id: 'q5', text: 'How likely are you to come back and play again tomorrow?' },
];

export function FeedbackSurvey({ onClose, onSubmit }: FeedbackProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [freeform, setFreeform] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const anyContent = freeform.trim().length > 0 || Object.keys(ratings).length > 0 || name.trim().length > 0 || email.trim().length > 0;

  const handleSubmit = () => {
    const data: FeedbackData = {
      q1: ratings.q1 || 0, q2: ratings.q2 || 0, q3: ratings.q3 || 0,
      q4: ratings.q4 || 0, q5: ratings.q5 || 0,
      freeform: freeform.trim(),
      name: name.trim(),
      email: email.trim(),
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
            Your feedback helps us make this better for everyone. We really appreciate you taking the time.
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
        maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface, #0f172a)' }}>Tell us what you think</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Even one sentence helps us make this better.</div>
        </div>

        {/* Lead with freeform — lowest friction */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 8, lineHeight: 1.5 }}>
            What{'\u2019'}s one thing you{'\u2019'}d change or improve?
          </div>
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            placeholder="Be honest — what worked, what didn't, what confused you..."
            autoFocus
            style={{
              width: '100%', minHeight: 80, padding: '12px 14px', fontSize: 14,
              borderRadius: 12, border: '2px solid var(--outline-variant, #e2e8f0)',
              background: 'var(--surface-container, #fff)', color: 'var(--on-surface, #0f172a)',
              fontFamily: 'var(--font-body, inherit)', resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Ratings — optional, shown after freeform */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Quick ratings (optional)
          </div>
          {QUESTIONS.map((q) => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 6, lineHeight: 1.5 }}>
                {q.text}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRatings(prev => ({ ...prev, [q.id]: n }))} style={{
                    flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 700,
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'var(--font-body, inherit)',
                    background: ratings[q.id] === n ? '#10b981' : 'var(--surface-container, #f1f5f9)',
                    color: ratings[q.id] === n ? '#fff' : '#64748b',
                    border: ratings[q.id] === n ? '2px solid #10b981' : '2px solid var(--outline-variant, #e2e8f0)',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optional contact info */}
        <div style={{
          background: 'var(--surface-container, #f8fafc)', border: '1px solid var(--outline-variant, #e2e8f0)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface, #0f172a)', marginBottom: 4 }}>
            Want to stay in the loop? (optional)
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
            Leave your name and email to get notified about updates and early access when we launch.
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 10,
              border: '2px solid var(--outline-variant, #e2e8f0)',
              background: 'var(--surface-container, #fff)', color: 'var(--on-surface, #0f172a)',
              fontFamily: 'var(--font-body, inherit)', outline: 'none', marginBottom: 8,
            }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            type="email"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 10,
              border: '2px solid var(--outline-variant, #e2e8f0)',
              background: 'var(--surface-container, #fff)', color: 'var(--on-surface, #0f172a)',
              fontFamily: 'var(--font-body, inherit)', outline: 'none',
            }}
          />
        </div>

        <button onClick={handleSubmit} disabled={!anyContent} style={{
          width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
          background: anyContent ? '#10b981' : '#94a3b8', color: '#fff',
          border: 'none', borderRadius: 12, cursor: anyContent ? 'pointer' : 'default',
          fontFamily: 'var(--font-body, inherit)', opacity: anyContent ? 1 : 0.5,
        }}>Submit feedback</button>

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
