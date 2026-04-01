'use client';

import { useState, useCallback } from 'react';
import { FOUNDATIONS_QUESTIONS } from '@/lib/data/foundations';

// Pick the most impactful questions for a quick onboarding
const ONBOARDING_QUESTIONS = [
  FOUNDATIONS_QUESTIONS[0],  // Which position acts first?
  FOUNDATIONS_QUESTIONS[1],  // Which position has biggest advantage?
  FOUNDATIONS_QUESTIONS[2],  // What does "having position" mean?
  FOUNDATIONS_QUESTIONS[10], // Play more hands from late position?
  FOUNDATIONS_QUESTIONS[11], // On BTN, mediocre hand - what to do?
  FOUNDATIONS_QUESTIONS[4],  // Why is it called the Cutoff?
  FOUNDATIONS_QUESTIONS[9],  // What does "fold equity" mean?
];

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);

  const q = ONBOARDING_QUESTIONS[idx];
  const total = ONBOARDING_QUESTIONS.length;
  const isCorrect = selected === q.correctIndex;

  const handleSelect = useCallback((optIdx: number) => {
    if (showFeedback) return;
    setSelected(optIdx);
    setShowFeedback(true);
    if (optIdx === q.correctIndex) setCorrect(prev => prev + 1);
  }, [q, showFeedback]);

  const handleNext = useCallback(() => {
    if (idx >= total - 1) {
      onComplete();
    } else {
      setIdx(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  }, [idx, total, onComplete]);

  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes fadeUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>🎓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface, #0f172a)' }}>Learn the Table</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Quick basics before you play</div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {ONBOARDING_QUESTIONS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i < idx ? '#10b981' : i === idx ? '#cbd5e1' : '#e5e7eb',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
        borderRadius: 16, padding: '22px 20px', flex: 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          {idx + 1} of {total}
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface, #0f172a)', lineHeight: 1.6, marginBottom: 20 }}>
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let bg = 'var(--surface-container, #fff)';
            let border = 'var(--outline-variant, #e2e8f0)';
            let color = 'var(--on-surface, #0f172a)';

            if (showFeedback) {
              if (i === q.correctIndex) { bg = '#ecfdf5'; border = '#a7f3d0'; color = '#065f46'; }
              else if (i === selected && !isCorrect) { bg = '#fef2f2'; border = '#fca5a5'; color = '#991b1b'; }
              else { color = '#94a3b8'; }
            }

            return (
              <button key={i} onClick={() => handleSelect(i)} style={{
                width: '100%', padding: '14px 16px', fontSize: 14, fontWeight: 600,
                background: bg, border: `2px solid ${border}`, borderRadius: 12,
                color, cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                opacity: showFeedback && i !== selected && i !== q.correctIndex ? 0.35 : 1,
                fontFamily: 'var(--font-body, inherit)',
              }}>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              marginTop: 16, padding: '14px 16px', borderRadius: 12,
              background: isCorrect ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${isCorrect ? '#a7f3d0' : '#fca5a5'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isCorrect ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </div>
              <div style={{ fontSize: 14, color: isCorrect ? '#065f46' : '#991b1b', lineHeight: 1.6 }}>
                {q.explanation}
              </div>
            </div>
            <button onClick={handleNext} style={{
              width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
              background: '#10b981', color: '#fff', border: 'none', borderRadius: 12,
              cursor: 'pointer', marginTop: 10, fontFamily: 'var(--font-body, inherit)',
            }}>
              {idx >= total - 1 ? 'Start playing!' : 'Next \u2192'}
            </button>
          </div>
        )}
      </div>

      {/* Skip link */}
      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
          color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
        }}>
          I already know this — skip to playing
        </button>
      </div>
    </div>
  );
}
