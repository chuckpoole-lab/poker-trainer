'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';
import {
  saveDailyChallengeResult,
  getTodaysChallenge,
  getUserPokerIQ,
  getLeaderboard,
  getUserRankWithCount,
  getDailyChallengeHistory,
  checkAndAwardBadges,
  saveGuestData,
  loadGuestData,
  type LeaderboardEntry,
} from '@/lib/services/play-storage';
import { getStreak } from '@/lib/services/cloud-storage';
import {
  generateDailyHands,
  generateBonusHand,
  type PlayHandScenario,
} from '@/lib/services/play-scenario-generator';
import { trackHandPlayed } from '@/lib/services/session-tracker';
import Onboarding from '@/components/play/Onboarding';
import { FeedbackSurvey, WelcomeToast, FeedbackButton, type FeedbackData } from '@/components/play/FeedbackSurvey';
import { submitFeedback, flagHand, type FlaggedHandData } from '@/lib/services/play-storage';

const SUIT_SYM: Record<string, string> = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
const DAILY_COUNT = 5;

// ── Playing card component ──
function PlayingCard({ rank, suit, delay = 0 }: { rank: string; suit: string; delay?: number }) {
  const col = suit === 'h' || suit === 'd' ? '#dc2626' : '#1e293b';
  return (
    <div style={{
      width: 64, height: 90, borderRadius: 12, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      background: '#ffffff', border: '2px solid #d1d5db',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      animation: `cardIn 0.3s ease ${delay}s both`,
    }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: col, lineHeight: 1 }}>{rank}</span>
      <span style={{ fontSize: 24, color: col, lineHeight: 1 }}>{SUIT_SYM[suit]}</span>
    </div>
  );
}

// ── Stat pill ──
function StatPill({ icon, value, label, bg, borderColor, color }: {
  icon: string; value: string; label: string; bg: string; borderColor: string; color: string;
}) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12,
      background: bg, border: `1.5px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Daily Hands Game component ──
function DailyHandsGame({ hands, iq, streak, rank, isBonus, userId, onComplete, onBonusResult }: {
  hands: PlayHandScenario[]; iq: number; streak: number; rank: number;
  isBonus: boolean; userId: string | null;
  onComplete: (score: number, results: boolean[], newIq: number) => void;
  onBonusResult: (correct: boolean) => void;
}) {
  // Freeze the hands array on first render so parent re-renders can't swap hands mid-game
  const frozenHands = useRef(hands);
  const [handIdx, setHandIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [currentIq, setCurrentIq] = useState(iq);
  const [flagged, setFlagged] = useState(false);
  const [showFlagNote, setShowFlagNote] = useState(false);
  const [flagNote, setFlagNote] = useState('');

  const hand = frozenHands.current[handIdx];

  // Integrity check: catch any card/handCode/explanation drift in production.
  // This fires once per rendered hand and auto-flags to Supabase if the hand object
  // reaching the UI doesn't match itself (cards vs handCode, or explanation vs handCode).
  // Exists because Chris saw A♦3♦ shown alongside "AA at 20bb" explanation — we could
  // not reproduce locally and the v2 generator validates every scenario, so the culprit
  // is either a stale bundle/cache or a mutation after return. This captures real data.
  const [integrityFail, setIntegrityFail] = useState<string | null>(null);
  useEffect(() => {
    if (!hand) return;
    const r1 = hand.handCode[0];
    const r2 = hand.handCode.length >= 2 ? hand.handCode[1] : r1;
    const cardMismatch =
      !hand.cards || hand.cards.length !== 2 ||
      hand.cards[0]?.rank !== r1 ||
      hand.cards[1]?.rank !== r2;
    const tipMismatch =
      !hand.tipRight?.includes(hand.handCode) ||
      !hand.tipWrong?.includes(hand.handCode);

    if (cardMismatch || tipMismatch) {
      const reason = cardMismatch
        ? `cards ${hand.cards?.[0]?.rank ?? '?'}${hand.cards?.[1]?.rank ?? '?'} vs handCode ${hand.handCode}`
        : `explanation missing handCode "${hand.handCode}"`;
      console.error('[PokerTrainer] SCENARIO INTEGRITY FAIL at render:', reason, {
        id: hand.id,
        handCode: hand.handCode,
        position: hand.position,
        stack: hand.stack,
        situation: hand.situation,
        cards: hand.cards,
        tipRight: hand.tipRight,
        tipWrong: hand.tipWrong,
        handIdx,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ts: new Date().toISOString(),
      });
      setIntegrityFail(reason);
      // Auto-flag to Supabase so we have a reproducible record with real user context.
      flagHand(userId, {
        handCode: hand.handCode,
        position: hand.position,
        stack: hand.stack,
        situation: hand.situation,
        cards: hand.cards,
        appAction: hand.choices?.[hand.correct] ?? '',
        userAction: null,
        explanation: `tipRight="${hand.tipRight}" | tipWrong="${hand.tipWrong}"`,
        note: `AUTO_INTEGRITY_FAIL: ${reason} | handIdx=${handIdx} | id=${hand.id}`,
        isBonus,
      }).catch(() => { /* already logged by flagHand */ });
    } else {
      setIntegrityFail(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handIdx]);

  if (!hand) return null;
  const isCorrect = selected === hand.correct;

  const handleChoice = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowTip(true);
    const correct = idx === hand.correct;
    setResults(prev => [...prev, correct]);
    if (correct) setCurrentIq(prev => prev + 2);
    if (isBonus) onBonusResult(correct);
  };

  const handleFlag = async () => {
    const data: FlaggedHandData = {
      handCode: hand.handCode,
      position: hand.position,
      stack: hand.stack,
      situation: hand.situation,
      cards: hand.cards,
      appAction: hand.choices[hand.correct],
      userAction: selected !== null ? hand.choices[selected] : null,
      explanation: hand.tipWrong,
      note: flagNote,
      isBonus,
    };
    await flagHand(userId, data);
    setFlagged(true);
    setShowFlagNote(false);
  };

  const nextHand = () => {
    if (handIdx >= hands.length - 1) {
      onComplete(results.filter(Boolean).length, results, currentIq);
    } else {
      setHandIdx(prev => prev + 1);
      setSelected(null);
      setShowTip(false);
      setFlagged(false);
      setShowFlagNote(false);
      setFlagNote('');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes cardIn { from { transform: translateY(20px) rotateY(90deg); opacity: 0; } to { transform: translateY(0) rotateY(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      `}</style>

      {/* Top stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 20, padding: '5px 14px 5px 10px' }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>{streak}</span>
        </div>
        <div style={{ background: isBonus ? '#fef3c7' : '#ede9fe', border: `1.5px solid ${isBonus ? '#f59e0b' : '#8b5cf6'}`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: isBonus ? '#92400e' : '#5b21b6' }}>
          {isBonus ? 'Bonus Round' : `IQ ${currentIq}`}
        </div>
        <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: '#065f46' }}>#{rank || '—'}</div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 18 }}>
        {hands.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < handIdx ? (results[i] ? '#10b981' : '#ef4444') : i === handIdx ? '#cbd5e1' : '#e5e7eb',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Hand card */}
      <div style={{
        background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
        borderRadius: 16, padding: '22px 20px', marginBottom: 14,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          {isBonus ? `Bonus Hand ${handIdx + 1}` : `Hand ${handIdx + 1} of ${hands.length}`}
        </div>

        <div style={{ fontSize: 15, color: 'var(--on-surface, #1a1a1a)', lineHeight: 1.7, marginBottom: 18 }}>
          You&apos;re on the <strong style={{ color: '#10b981' }}>{hand.position}</strong> with <strong style={{ color: '#10b981' }}>{hand.stack}</strong>.
          <br />{hand.situation}
        </div>

        {integrityFail && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 10,
            background: '#fef2f2', border: '1.5px solid #fca5a5',
            fontSize: 12, color: '#991b1b', fontWeight: 600,
          }}>
            This hand has a data mismatch ({integrityFail}). It has been auto-flagged for review.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {hand.cards.map((c, i) => <PlayingCard key={i} rank={c.rank} suit={c.suit} delay={i * 0.1} />)}
        </div>

        {/* Choice buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hand.choices.map((choice, i) => {
            const isThis = selected === i;
            const wasCorrect = i === hand.correct;
            let btnBg = 'var(--surface-container, #fff)';
            let btnBorder = 'var(--outline-variant, #e2e8f0)';
            let btnColor = 'var(--on-surface, #1a1a1a)';
            let letterBg = '#f1f5f9';
            let letterColor = '#64748b';

            if (selected !== null) {
              if (isThis && isCorrect) { btnBg = '#ecfdf5'; btnBorder = '#a7f3d0'; btnColor = '#065f46'; letterBg = '#10b981'; letterColor = '#fff'; }
              else if (isThis && !isCorrect) { btnBg = '#fef2f2'; btnBorder = '#fca5a5'; btnColor = '#991b1b'; letterBg = '#ef4444'; letterColor = '#fff'; }
              else if (wasCorrect) { btnBg = '#ecfdf5'; btnBorder = '#a7f3d0'; btnColor = '#065f46'; letterBg = '#10b981'; letterColor = '#fff'; }
              else { btnColor = '#94a3b8'; }
            }

            return (
              <button key={i} onClick={() => handleChoice(i)} style={{
                width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 600,
                background: btnBg, border: `2px solid ${btnBorder}`, borderRadius: 12,
                color: btnColor, cursor: selected !== null ? 'default' : 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s', opacity: selected !== null && !isThis && !wasCorrect ? 0.35 : 1,
                fontFamily: 'var(--font-body, inherit)',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  background: letterBg, color: letterColor, transition: 'all 0.15s',
                }}>{String.fromCharCode(65 + i)}</span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Feedback tip */}
        {showTip && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              marginTop: 16, padding: '14px 16px', borderRadius: 12,
              background: isCorrect ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${isCorrect ? '#a7f3d0' : '#fca5a5'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isCorrect ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                {isCorrect ? 'Nailed it!' : 'Not quite \u2014 here\u2019s the play'}
              </div>
              <div style={{ fontSize: 14, color: isCorrect ? '#065f46' : '#991b1b', lineHeight: 1.6 }}>
                {isCorrect ? hand.tipRight : hand.tipWrong}
              </div>

              {/* Flag this hand button */}
              {!flagged && !showFlagNote && (
                <button onClick={() => setShowFlagNote(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  fontSize: 12, fontWeight: 600, color: '#94a3b8',
                  fontFamily: 'var(--font-body, inherit)',
                }}>
                  <span style={{ fontSize: 14 }}>{'\u{1F6A9}'}</span> Challenge this recommendation
                </button>
              )}
              {showFlagNote && !flagged && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Why do you disagree? (optional)"
                    value={flagNote}
                    onChange={e => setFlagNote(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8,
                      border: '1.5px solid #e2e8f0', background: '#fff', color: '#1a1a1a',
                      fontFamily: 'var(--font-body, inherit)', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleFlag} style={{
                      flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 700,
                      background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8,
                      cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
                    }}>Flag for review</button>
                    <button onClick={() => setShowFlagNote(false)} style={{
                      padding: '8px 12px', fontSize: 13, fontWeight: 600,
                      background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8,
                      cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
                    }}>Cancel</button>
                  </div>
                </div>
              )}
              {flagged && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                  {'\u{1F6A9}'} Flagged for review — thanks!
                </div>
              )}
            </div>
            <button onClick={nextHand} style={{
              width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
              background: '#10b981', color: '#fff', border: 'none', borderRadius: 12,
              cursor: 'pointer', marginTop: 10, animation: 'pop 0.3s ease 0.2s both',
              fontFamily: 'var(--font-body, inherit)',
            }}>
              {handIdx >= hands.length - 1 ? (isBonus ? 'Done' : 'See results') : 'Next hand \u2192'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Results screen ──
function ResultsScreen({ score, total, results, iq, iqChange, streak, rank, onBack, onKeepPlaying, feedbackDone, onQuickFeedback, onOpenFullSurvey }: {
  score: number; total: number; results: boolean[]; iq: number; iqChange: number;
  streak: number; rank: number; onBack: () => void; onKeepPlaying: () => void;
  feedbackDone: boolean; onQuickFeedback: (emoji: string) => void; onOpenFullSurvey: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [quickDone, setQuickDone] = useState(false);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const shareText = `Daily Hands \u2014 ${dateStr}\n${results.map(r => r ? '\uD83D\uDFE9' : '\uD83D\uDFE5').join('')}\n${score}/${total} \u2014 IQ ${iq}\npokertrain.app/daily`;

  const handleShare = () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes scoreIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes dotIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Today&apos;s score</div>
        <div style={{
          fontSize: 64, fontWeight: 800, lineHeight: 1, animation: 'scoreIn 0.4s ease',
          color: score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444',
        }}>
          {score}/{total}
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 20 }}>
          {score === 5 ? 'Perfect! You\u2019re a shark.' : score >= 4 ? 'Strong session. One to review.' : score >= 3 ? 'Solid. Room to sharpen up.' : 'Tough day. You\u2019ll bounce back.'}
        </div>

        {/* Result dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {results.map((r, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, animation: `dotIn 0.2s ease ${i * 0.08}s both`,
              background: r ? '#ecfdf5' : '#fef2f2', border: `2px solid ${r ? '#a7f3d0' : '#fca5a5'}`,
              color: r ? '#065f46' : '#991b1b',
            }}>{i + 1}</div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, fontSize: 13, color: '#64748b' }}>
          <span>Poker IQ: <strong style={{ color: '#10b981' }}>{iq}</strong> (+{iqChange})</span>
          <span>Streak: <strong style={{ color: '#f59e0b' }}>{streak}</strong> days</span>
        </div>

        {/* Shareable card */}
        <div style={{
          background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
          borderRadius: 16, padding: '20px 16px', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>DAILY HANDS &mdash; {dateStr}</div>
          <div style={{ fontSize: 22, letterSpacing: 4, marginBottom: 8 }}>
            {results.map((r, i) => <span key={i} style={{ color: r ? '#10b981' : '#ef4444' }}>{'\u25A0'} </span>)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface, #1a1a1a)' }}>{score}/5 &mdash; IQ {iq}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>pokertrain.app/daily</div>
        </div>

        {/* Quick feedback nudge */}
        {!feedbackDone && !quickDone && (
          <div style={{
            background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14,
            padding: '14px 16px', marginBottom: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
              How was that experience?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              {[
                { emoji: '\uD83D\uDE0D', label: 'Loved it' },
                { emoji: '\uD83D\uDC4D', label: 'Good' },
                { emoji: '\uD83D\uDE10', label: 'Meh' },
                { emoji: '\uD83D\uDC4E', label: 'Needs work' },
              ].map(({ emoji, label }) => (
                <button key={label} onClick={() => { onQuickFeedback(emoji); setQuickDone(true); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px',
                  borderRadius: 12, fontSize: 28, transition: 'transform 0.15s',
                }} title={label}>{emoji}</button>
              ))}
            </div>
            <button onClick={onOpenFullSurvey} style={{
              background: 'none', border: 'none', fontSize: 12, fontWeight: 600,
              color: '#8b5cf6', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
            }}>or give detailed feedback</button>
          </div>
        )}
        {quickDone && (
          <div style={{
            background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 14,
            padding: '12px 16px', marginBottom: 14, textAlign: 'center',
            fontSize: 14, color: '#065f46', fontWeight: 600,
          }}>
            Thanks! Want to tell us more?{' '}
            <button onClick={onOpenFullSurvey} style={{
              background: 'none', border: 'none', fontSize: 14, fontWeight: 700,
              color: '#8b5cf6', cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
              textDecoration: 'underline',
            }}>Quick survey</button>
          </div>
        )}

        <button onClick={handleShare} style={{
          width: '100%', padding: 14, fontSize: 15, fontWeight: 700, background: '#10b981', color: '#fff',
          border: 'none', borderRadius: 12, cursor: 'pointer', marginBottom: 10,
          fontFamily: 'var(--font-body, inherit)',
        }}>{copied ? 'Copied!' : 'Share result'}</button>

        <button onClick={onKeepPlaying} style={{
          width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
          background: 'transparent', color: '#10b981',
          border: '2px solid #10b981', borderRadius: 12, cursor: 'pointer', marginBottom: 10,
          fontFamily: 'var(--font-body, inherit)',
        }}>Keep playing</button>

        <button onClick={onBack} style={{
          width: '100%', padding: 14, fontSize: 15, fontWeight: 600, background: 'transparent',
          color: '#64748b', border: '1.5px solid var(--outline-variant, #e2e8f0)', borderRadius: 12,
          cursor: 'pointer', fontFamily: 'var(--font-body, inherit)',
        }}>Back to home</button>
      </div>
    </div>
  );
}


// ── Main Play Page ──
export default function PlayPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [screen, setScreen] = useState<'home' | 'game' | 'results' | 'bonus' | 'onboarding'>('home');
  const [iq, setIq] = useState(100);
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [iqHistory, setIqHistory] = useState<{ date: string; iq: number }[]>([]);
  const [todayDone, setTodayDone] = useState(false);
  const [resultData, setResultData] = useState<{ score: number; results: boolean[]; newIq: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyHands, setDailyHands] = useState<PlayHandScenario[]>([]);
  const [bonusHands, setBonusHands] = useState<PlayHandScenario[]>([]);
  const [bonusCorrect, setBonusCorrect] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(true); // default true, set false if new player
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Generate daily hands on mount
  useEffect(() => {
    setDailyHands(generateDailyHands());
  }, []);

  // Load user data on mount
  useEffect(() => {
    async function load() {
      if (user && profile) {
        const [userIq, streakData, todayResult, board, rankData, history] = await Promise.all([
          getUserPokerIQ(user.id),
          getStreak(user.id),
          getTodaysChallenge(user.id),
          getLeaderboard(profile.league_slug, 10),
          getUserRankWithCount(user.id, profile.league_slug),
          getDailyChallengeHistory(user.id, 14),
        ]);
        setIq(userIq);
        setStreak(streakData.current_streak);
        setLeaderboard(board);
        setRank(rankData.rank);
        setTotalPlayers(rankData.total);
        // Build IQ history from daily challenge results (oldest first for chart)
        if (history.length > 0) {
          const pts = history
            .filter((h: { challenge_date: string; iq_after: number }) => h.iq_after != null)
            .map((h: { challenge_date: string; iq_after: number }) => ({ date: h.challenge_date, iq: h.iq_after }))
            .reverse();
          setIqHistory(pts);
        }
        if (todayResult) {
          setTodayDone(true);
          setResultData({ score: todayResult.score, results: todayResult.hand_results, newIq: todayResult.iq_after });
        }
        // New player: no challenge history means show onboarding
        if (!todayResult && userIq <= 100 && streakData.current_streak === 0) {
          setOnboardingDone(false);
          setShowWelcome(true);
        }
        // Check if feedback already submitted
        const fbDone = loadGuestData('feedback-submitted', false);
        setFeedbackSubmitted(fbDone);
      } else {
        const guestData = loadGuestData('play-stats', { iq: 100, streak: 0 });
        setIq(guestData.iq);
        setStreak(guestData.streak);
        // Guest: check if they've done onboarding
        const guestOnboarded = loadGuestData('onboarding-done', false);
        if (!guestOnboarded && guestData.streak === 0) {
          setOnboardingDone(false);
          setShowWelcome(true);
        }
        const fbDone = loadGuestData('feedback-submitted', false);
        setFeedbackSubmitted(fbDone);
      }
      setLoading(false);
    }
    load();
  }, [user, profile]);

  // Handle daily challenge completion
  const handleDailyComplete = useCallback(async (score: number, results: boolean[], newIq: number) => {
    setResultData({ score, results, newIq });
    setIq(newIq);
    setScreen('results');

    // Track hands played for session analytics
    trackHandPlayed(DAILY_COUNT);

    if (user) {
      await saveDailyChallengeResult(user.id, score, DAILY_COUNT, results, iq, newIq);
      await checkAndAwardBadges(user.id);
      // Refresh EVERYTHING that's shown on the home screen so stats don't go stale.
      // Previously we only refreshed streak, which left rank stuck at "#1 of 1",
      // the IQ history chart missing today's data point, and the leaderboard showing
      // pre-completion standings. All of these update in the background after
      // saveDailyChallengeResult runs — we just have to re-fetch them.
      const [newStreak, rankData, board, history] = await Promise.all([
        getStreak(user.id),
        getUserRankWithCount(user.id, profile?.league_slug ?? null),
        getLeaderboard(profile?.league_slug ?? null, 10),
        getDailyChallengeHistory(user.id, 14),
      ]);
      setStreak(newStreak.current_streak);
      setRank(rankData.rank);
      setTotalPlayers(rankData.total);
      setLeaderboard(board);
      if (history.length > 0) {
        const pts = history
          .filter((h: { challenge_date: string; iq_after: number }) => h.iq_after != null)
          .map((h: { challenge_date: string; iq_after: number }) => ({ date: h.challenge_date, iq: h.iq_after }))
          .reverse();
        setIqHistory(pts);
      }
      setTodayDone(true);
    } else {
      saveGuestData('play-stats', { iq: newIq, streak: streak + 1 });
      setStreak(prev => prev + 1);
    }
  }, [user, profile, iq, streak]);

  // Handle "Keep Playing" — generate 5 bonus hands
  const handleKeepPlaying = useCallback(() => {
    const bonus = Array.from({ length: 5 }, () => generateBonusHand());
    setBonusHands(bonus);
    setBonusCorrect(0);
    setBonusTotal(0);
    setScreen('bonus');
  }, []);

  // Track bonus hand results
  const handleBonusResult = useCallback((correct: boolean) => {
    setBonusTotal(prev => prev + 1);
    if (correct) {
      setBonusCorrect(prev => prev + 1);
      setIq(prev => {
        const newIq = prev + 1;
        if (user) { getUserPokerIQ(user.id).then(() => {}); }
        return newIq;
      });
    }
  }, [user]);

  // Handle bonus round completion
  const handleBonusComplete = useCallback(async (score: number, results: boolean[], newIq: number) => {
    setIq(newIq);
    // Track bonus hands for session analytics
    trackHandPlayed(results.length);
    if (user) {
      const { updateUserPokerIQ } = await import('@/lib/services/play-storage');
      await updateUserPokerIQ(user.id, newIq);
    } else {
      saveGuestData('play-stats', { iq: newIq, streak });
    }
    // Go back to home — bonus rounds don't have a results screen
    setScreen('home');
  }, [user, streak]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted, #94a3b8)' }}>Loading...</p>
      </div>
    );
  }

  // Onboarding for new players
  if (!onboardingDone && screen === 'home') {
    return (
      <Onboarding
        onComplete={() => {
          setOnboardingDone(true);
          saveGuestData('onboarding-done', true);
        }}
        onSkip={() => {
          setOnboardingDone(true);
          saveGuestData('onboarding-done', true);
        }}
      />
    );
  }

  // Quick feedback handler (emoji tap on results screen)
  const handleQuickFeedback = async (emoji: string) => {
    // Save quick reaction as lightweight feedback
    const quickData: FeedbackData = {
      q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
      freeform: `[Quick reaction: ${emoji}]`,
      name: '', email: '',
      submittedAt: new Date().toISOString(),
    };
    await submitFeedback(user?.id || null, quickData);
  };

  // Results screen (daily only)
  if (screen === 'results' && resultData) {
    return (
      <ResultsScreen
        score={resultData.score} total={DAILY_COUNT} results={resultData.results}
        iq={resultData.newIq} iqChange={resultData.score * 2}
        streak={streak} rank={rank} onBack={() => setScreen('home')}
        onKeepPlaying={handleKeepPlaying}
        feedbackDone={feedbackSubmitted}
        onQuickFeedback={handleQuickFeedback}
        onOpenFullSurvey={() => { setScreen('home'); setShowFeedback(true); }}
      />
    );
  }

  // Bonus game screen
  if (screen === 'bonus') {
    return (
      <DailyHandsGame
        key={`bonus-${bonusHands[0]?.id || Date.now()}`}
        hands={bonusHands} iq={iq} streak={streak} rank={rank}
        isBonus={true} userId={user?.id || null} onComplete={handleBonusComplete} onBonusResult={handleBonusResult}
      />
    );
  }

  // Daily game screen
  if (screen === 'game') {
    return (
      <DailyHandsGame
        key={`daily-${dailyHands[0]?.id || 'loading'}`}
        hands={dailyHands} iq={iq} streak={streak} rank={rank}
        isBonus={false} userId={user?.id || null} onComplete={handleDailyComplete} onBonusResult={() => {}}
      />
    );
  }

  // Feedback submit handler
  const handleFeedbackSubmit = async (data: FeedbackData) => {
    // Save to Supabase
    await submitFeedback(user?.id || null, data);
    // Also save locally as backup
    saveGuestData('feedback-submitted', true);
    saveGuestData('feedback-data', data);
    setFeedbackSubmitted(true);
  };

  // Home screen
  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      {/* Welcome toast for first-time testers */}
      {showWelcome && <WelcomeToast onDismiss={() => setShowWelcome(false)} />}

      {/* Feedback modal */}
      {showFeedback && (
        <FeedbackSurvey
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Floating feedback button — show after welcome dismissed, before feedback submitted */}
      {/* Pulses after user has completed the daily challenge to draw attention */}
      {!showWelcome && !feedbackSubmitted && !showFeedback && (
        <FeedbackButton onClick={() => setShowFeedback(true)} pulse={todayDone} />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>{'\u2660'}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--on-surface, #1a1a1a)', letterSpacing: -0.3 }}>Daily Hands</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>5 hands. 60 seconds. How good are you?</div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <StatPill icon="🔥" value={String(streak)} label="Streak" bg="#fef3c7" borderColor="#f59e0b" color="#92400e" />
        <StatPill icon="🧠" value={String(iq)} label="IQ" bg="#ede9fe" borderColor="#8b5cf6" color="#5b21b6" />
        <StatPill icon="🏆" value={rank > 0 ? `#${rank}` : '—'} label={totalPlayers > 0 ? `of ${totalPlayers}` : 'Rank'} bg="#ecfdf5" borderColor="#10b981" color="#065f46" />
      </div>

      {/* IQ Trend */}
      {iqHistory.length >= 2 && (() => {
        const iqs = iqHistory.map(h => h.iq);
        const minIq = Math.min(...iqs);
        const maxIq = Math.max(...iqs);
        const range = maxIq - minIq || 1;
        const w = 280;
        const h = 48;
        const pad = 4;
        const points = iqs.map((val, i) => {
          const x = pad + (i / (iqs.length - 1)) * (w - pad * 2);
          const y = h - pad - ((val - minIq) / range) * (h - pad * 2);
          return `${x},${y}`;
        }).join(' ');
        const iqChange = iqs[iqs.length - 1] - iqs[0];
        const changeColor = iqChange >= 0 ? '#10b981' : '#ef4444';
        const changeText = iqChange >= 0 ? `+${iqChange}` : `${iqChange}`;
        return (
          <div style={{
            background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
            borderRadius: 16, padding: '12px 16px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                IQ Trend ({iqHistory.length}d)
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: changeColor }}>
                {changeText} IQ
              </span>
            </div>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
              <polyline
                points={points}
                fill="none"
                stroke={changeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End dot */}
              {(() => {
                const lastX = pad + ((iqs.length - 1) / (iqs.length - 1)) * (w - pad * 2);
                const lastY = h - pad - ((iqs[iqs.length - 1] - minIq) / range) * (h - pad * 2);
                return <circle cx={lastX} cy={lastY} r="4" fill={changeColor} />;
              })()}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              <span>{iqHistory[0].date.slice(5)}</span>
              <span>{iqHistory[iqHistory.length - 1].date.slice(5)}</span>
            </div>
          </div>
        );
      })()}

      {/* Daily challenge CTA */}
      <button onClick={() => todayDone ? setScreen('results') : setScreen('game')} style={{
        width: '100%', padding: '22px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
        background: todayDone ? '#f1f5f9' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        textAlign: 'center', marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: todayDone ? '#94a3b8' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          {todayDone ? 'Completed today' : "Today\u2019s challenge"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: todayDone ? '#64748b' : '#fff', marginBottom: 4 }}>
          {todayDone ? `You scored ${resultData?.score ?? 0}/${DAILY_COUNT}` : `Play ${DAILY_COUNT} hands`}
        </div>
        <div style={{ fontSize: 14, color: todayDone ? '#94a3b8' : 'rgba(255,255,255,0.8)' }}>
          {todayDone ? 'Tap to see your results' : 'Same hands for everyone. Compare with your league.'}
        </div>
      </button>

      {/* Keep Playing CTA — always available */}
      <button onClick={handleKeepPlaying} style={{
        width: '100%', padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
        background: 'var(--surface-container, #fff)', border: '1.5px solid var(--outline-variant, #e2e8f0)',
        textAlign: 'left', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 32 }}>{'\u267B'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface, #1a1a1a)' }}>Keep Playing</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>5 more random hands. Still counts toward your IQ.</div>
        </div>
        <div style={{ fontSize: 18, color: '#94a3b8' }}>{'\u203A'}</div>
      </button>

      {/* Basics refresher link */}
      <button onClick={() => setOnboardingDone(false)} style={{
        width: '100%', padding: '14px 20px', borderRadius: 16, cursor: 'pointer',
        background: 'var(--surface-container, #fff)', border: '1.5px solid var(--outline-variant, #e2e8f0)',
        textAlign: 'left', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 28 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface, #1a1a1a)' }}>Learn the Basics</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Positions, terminology, and key concepts</div>
        </div>
        <div style={{ fontSize: 18, color: '#94a3b8' }}>{'\u203A'}</div>
      </button>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{
          background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Leaderboard
          </div>
          {leaderboard.map((p, idx) => {
            const isYou = p.user_id === user?.id;
            return (
              <div key={p.user_id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderTop: idx > 0 ? '1px solid var(--outline-variant, #f1f5f9)' : 'none',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: idx < 3 ? '#fef3c7' : '#f1f5f9',
                  color: idx < 3 ? '#92400e' : '#94a3b8',
                }}>{idx + 1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: isYou ? 700 : 400, color: isYou ? '#10b981' : 'var(--on-surface, #1a1a1a)' }}>
                  {isYou ? 'You' : (p.display_name || 'Player')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{p.poker_iq}</span>
              </div>
            );
          })}
          {/* Rank summary footer */}
          {rank > 0 && totalPlayers > 0 && (
            <div style={{
              textAlign: 'center', paddingTop: 10, marginTop: 4,
              borderTop: '1px solid var(--outline-variant, #f1f5f9)',
              fontSize: 13, color: '#64748b',
            }}>
              You{'\u2019'}re <span style={{ fontWeight: 700, color: '#10b981' }}>#{rank}</span> of {totalPlayers} players
            </div>
          )}
        </div>
      )}

      {/* What's New & Coming Soon */}
      <div style={{
        background: 'var(--surface-container, #fff)', border: '1px solid var(--outline-variant, #e2e8f0)',
        borderRadius: 16, padding: '16px 18px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface, #1a1a1a)', marginBottom: 12 }}>
          {'\u2728'} What&apos;s new &amp; coming soon
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>New</div>
        {['Facing limpers \u2014 isolate, limp behind, or jam over weak limps', '3-bet training \u2014 know when to call, fold, or 4-bet jam', 'Challenge any hand \u2014 flag recommendations you disagree with', 'Daily Hands challenge with Poker IQ scoring', 'Unlimited bonus rounds after daily challenge', 'Position-aware coaching tips on every hand'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: 'var(--on-surface, #1a1a1a)' }}>
            <span style={{ color: '#10b981', fontSize: 14 }}>{'\u2713'}</span> {f}
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 }}>Coming soon</div>
        {['Survival Mode \u2014 how many hands can you survive?', 'Raise sizing strategy training', 'League leaderboards and weekly rankings', 'Hand logger for tracking your live sessions'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#64748b' }}>
            <span style={{ color: '#8b5cf6', fontSize: 14 }}>{'\u25CB'}</span> {f}
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--outline-variant, #e2e8f0)', marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface, #1a1a1a)', marginBottom: 6 }}>
            What feature would you love to see?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="feature-input"
              type="text"
              placeholder="Your idea..."
              style={{
                flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 10,
                border: '1.5px solid var(--outline-variant, #e2e8f0)',
                background: 'var(--surface-container, #fff)', color: 'var(--on-surface, #1a1a1a)',
                fontFamily: 'var(--font-body, inherit)', outline: 'none',
              }}
            />
            <button onClick={() => {
              const input = document.getElementById('feature-input') as HTMLInputElement;
              if (input?.value.trim()) {
                submitFeedback(user?.id || null, { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, freeform: 'FEATURE REQUEST: ' + input.value.trim(), name: '', email: '' });
                input.value = '';
                input.placeholder = 'Thanks! Submitted.';
              }
            }} style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body, inherit)', whiteSpace: 'nowrap',
            }}>Send</button>
          </div>
        </div>
      </div>

      {/* Switch to Train mode */}
      <button onClick={() => router.push('/learn')} style={{
        width: '100%', padding: 12, borderRadius: 12, cursor: 'pointer',
        background: 'transparent', border: '1px solid var(--outline-variant, #e2e8f0)',
        fontSize: 13, fontWeight: 600, color: '#94a3b8', textAlign: 'center',
        fontFamily: 'var(--font-body, inherit)',
      }}>
        Switch to Train Mode
      </button>
    </div>
  );
}
