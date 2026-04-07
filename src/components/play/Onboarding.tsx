'use client';

import { useState, useCallback } from 'react';
import { FOUNDATIONS_QUESTIONS } from '@/lib/data/foundations';

const ONBOARDING_QUESTIONS = [
  FOUNDATIONS_QUESTIONS[0],  // Which position acts first?
  FOUNDATIONS_QUESTIONS[1],  // Which position has biggest advantage?
  FOUNDATIONS_QUESTIONS[2],  // What does "having position" mean?
  FOUNDATIONS_QUESTIONS[10], // Play more hands from late position?
  FOUNDATIONS_QUESTIONS[11], // On BTN, mediocre hand - what to do?
  FOUNDATIONS_QUESTIONS[4],  // Why is it called the Cutoff?
  FOUNDATIONS_QUESTIONS[9],  // What does "fold equity" mean?
];

// Position data for the table map
const POSITIONS = [
  { abbr: 'SB', name: 'Small Blind', color: '#ef4444',
    desc: 'Posts half a blind. Worst position — acts first after the flop.',
    approach: 'When folded to you, raise or shove. Never limp.' },
  { abbr: 'BB', name: 'Big Blind', color: '#ef4444',
    desc: 'Posts a full blind. Gets a discount to see flops.',
    approach: 'Defend wide against late position raises. Tighten up against early position.' },
  { abbr: 'UTG', name: 'Under the Gun', color: '#f59e0b',
    desc: 'First to act preflop. 8-9 players behind you.',
    approach: 'Play tight. Only premium hands. Fold everything marginal.' },
  { abbr: 'HJ', name: 'Hijack', color: '#f59e0b',
    desc: 'Middle position. 4-5 players behind you.',
    approach: 'Open up slightly. Add suited connectors and broadways.' },
  { abbr: 'CO', name: 'Cutoff', color: '#10b981',
    desc: 'Second-best position. Only 3 players behind you.',
    approach: 'Play wide. Steal the blinds. Raise most playable hands.' },
  { abbr: 'BTN', name: 'Button', color: '#10b981',
    desc: 'Best position. Acts last after the flop. Only 2 players to beat.',
    approach: 'Play very wide. Any ace, any suited king, most pairs. Steal aggressively.' },
];

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 'welcome' | 'table' | 'quiz';

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // ── Phase 1: Welcome ──
  if (phase === 'welcome') {
    return (
      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u2660'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--on-surface, #1a1a1a)', margin: '0 0 8px' }}>
            Welcome to Daily Hands
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Before you play, would you like a quick tour of the poker table positions?
          </p>
        </div>

        <button onClick={() => setPhase('table')} style={{
          width: '100%', padding: '18px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          textAlign: 'center', marginBottom: 12,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Show me the positions</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>2 minute overview</div>
        </button>

        <button onClick={onSkip} style={{
          width: '100%', padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
          background: 'transparent', border: '1.5px solid var(--outline-variant, #e2e8f0)',
          fontSize: 15, fontWeight: 600, color: '#64748b', textAlign: 'center',
          fontFamily: 'var(--font-body, inherit)',
        }}>
          I know the positions — let me play
        </button>
      </div>
    );
  }

  // ── Phase 2: Table Map ──
  if (phase === 'table') {
    return (
      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface, #1a1a1a)' }}>The Poker Table</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Positions determine your strategy. Learn the table, then test yourself.</div>
        </div>

        {/* Visual table — oval with positions */}
        <div style={{
          position: 'relative', width: '100%', maxWidth: 340, height: 200,
          margin: '0 auto 24px', borderRadius: '50%',
          background: 'var(--surface-container, #065f46)',
          border: '4px solid var(--outline-variant, #047857)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 }}>DEALER</div>
          {/* Position badges around the table */}
          {[
            { abbr: 'UTG', top: '8%', left: '25%' },
            { abbr: 'HJ', top: '8%', left: '55%' },
            { abbr: 'CO', top: '25%', left: '82%' },
            { abbr: 'BTN', top: '60%', left: '85%' },
            { abbr: 'SB', top: '80%', left: '60%' },
            { abbr: 'BB', top: '80%', left: '30%' },
          ].map((p) => {
            const posData = POSITIONS.find(pos => pos.abbr === p.abbr);
            return (
              <div key={p.abbr} style={{
                position: 'absolute', top: p.top, left: p.left, transform: 'translate(-50%,-50%)',
                background: posData?.color || '#64748b', color: '#fff',
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
              }}>
                {p.abbr}
              </div>
            );
          })}
        </div>

        {/* Color legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20, fontSize: 12, color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginRight: 4, verticalAlign: 'middle' }}></span>Blinds (tough spots)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', marginRight: 4, verticalAlign: 'middle' }}></span>Early/Mid (play tight)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginRight: 4, verticalAlign: 'middle' }}></span>Late (profit seats)</span>
        </div>

        {/* Position cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {POSITIONS.map((pos, i) => (
            <div key={pos.abbr} style={{
              background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
              borderRadius: 12, padding: '14px 16px', animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
              borderLeft: `4px solid ${pos.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ background: pos.color, color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>{pos.abbr}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface, #1a1a1a)' }}>{pos.name}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 4 }}>{pos.desc}</div>
              <div style={{ fontSize: 13, color: 'var(--on-surface, #1a1a1a)', fontWeight: 600, lineHeight: 1.5 }}>{pos.approach}</div>
            </div>
          ))}
        </div>

        {/* Key takeaway */}
        <div style={{
          background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 12,
          padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Key takeaway</div>
          <div style={{ fontSize: 14, color: '#065f46', lineHeight: 1.6 }}>
            Position is the most important concept in poker. The closer you are to the Button, the more hands you can play profitably. Late position = more hands. Early position = fewer hands.
          </div>
        </div>

        <button onClick={() => setPhase('quiz')} style={{
          width: '100%', padding: 16, fontSize: 15, fontWeight: 700,
          background: '#10b981', color: '#fff', border: 'none', borderRadius: 12,
          cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
        }}>
          Test what you learned
        </button>

        <div style={{ textAlign: 'center', paddingTop: 12 }}>
          <button onClick={onSkip} style={{
            background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
            color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
          }}>
            Skip to playing
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 3: Quiz ──
  const q = ONBOARDING_QUESTIONS[quizIdx];
  const total = ONBOARDING_QUESTIONS.length;
  const isCorrect = selected === q.correctIndex;

  const handleSelect = (optIdx: number) => {
    if (showFeedback) return;
    setSelected(optIdx);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (quizIdx >= total - 1) {
      onComplete();
    } else {
      setQuizIdx(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes fadeUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface, #1a1a1a)' }}>Quick Quiz</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Test what you just learned</div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {ONBOARDING_QUESTIONS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i < quizIdx ? '#10b981' : i === quizIdx ? '#cbd5e1' : '#e5e7eb',
          }} />
        ))}
      </div>

      <div style={{
        background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
        borderRadius: 16, padding: '22px 20px', flex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          {quizIdx + 1} of {total}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface, #1a1a1a)', lineHeight: 1.6, marginBottom: 20 }}>
          {q.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let bg = 'var(--surface-container, #fff)';
            let border = 'var(--outline-variant, #e2e8f0)';
            let color = 'var(--on-surface, #1a1a1a)';
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
              }}>{opt}</button>
            );
          })}
        </div>

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
              {quizIdx >= total - 1 ? 'Start playing!' : 'Next \u2192'}
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
          color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
        }}>
          Skip to playing
        </button>
      </div>
    </div>
  );
}
