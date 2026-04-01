'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';
import {
  saveDailyChallengeResult,
  getTodaysChallenge,
  getUserPokerIQ,
  getLeaderboard,
  getUserRank,
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
function DailyHandsGame({ hands, iq, streak, rank, isBonus, onComplete, onBonusResult }: {
  hands: PlayHandScenario[]; iq: number; streak: number; rank: number;
  isBonus: boolean;
  onComplete: (score: number, results: boolean[], newIq: number) => void;
  onBonusResult: (correct: boolean) => void;
}) {
  const [handIdx, setHandIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [currentIq, setCurrentIq] = useState(iq);

  const hand = hands[handIdx];
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

  const nextHand = () => {
    if (handIdx >= hands.length - 1) {
      onComplete(results.filter(Boolean).length, results, currentIq);
    } else {
      setHandIdx(prev => prev + 1);
      setSelected(null);
      setShowTip(false);
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

        <div style={{ fontSize: 15, color: 'var(--on-surface, #0f172a)', lineHeight: 1.7, marginBottom: 18 }}>
          You&apos;re on the <strong style={{ color: '#10b981' }}>{hand.position}</strong> with <strong style={{ color: '#10b981' }}>{hand.stack}</strong>.
          <br />{hand.situation}
        </div>

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
            let btnColor = 'var(--on-surface, #0f172a)';
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
function ResultsScreen({ score, total, results, iq, iqChange, streak, rank, onBack, onKeepPlaying }: {
  score: number; total: number; results: boolean[]; iq: number; iqChange: number;
  streak: number; rank: number; onBack: () => void; onKeepPlaying: () => void;
}) {
  const [copied, setCopied] = useState(false);
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
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface, #0f172a)' }}>{score}/5 &mdash; IQ {iq}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>pokertrain.app/daily</div>
        </div>

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
  const [screen, setScreen] = useState<'home' | 'game' | 'results' | 'bonus'>('home');
  const [iq, setIq] = useState(100);
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [todayDone, setTodayDone] = useState(false);
  const [resultData, setResultData] = useState<{ score: number; results: boolean[]; newIq: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyHands, setDailyHands] = useState<PlayHandScenario[]>([]);
  const [bonusHands, setBonusHands] = useState<PlayHandScenario[]>([]);
  const [bonusCorrect, setBonusCorrect] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);

  // Generate daily hands on mount
  useEffect(() => {
    setDailyHands(generateDailyHands());
  }, []);

  // Load user data on mount
  useEffect(() => {
    async function load() {
      if (user && profile) {
        const [userIq, streakData, todayResult, board, userRank] = await Promise.all([
          getUserPokerIQ(user.id),
          getStreak(user.id),
          getTodaysChallenge(user.id),
          getLeaderboard(profile.league_slug, 10),
          getUserRank(user.id, profile.league_slug),
        ]);
        setIq(userIq);
        setStreak(streakData.current_streak);
        setLeaderboard(board);
        setRank(userRank);
        if (todayResult) {
          setTodayDone(true);
          setResultData({ score: todayResult.score, results: todayResult.hand_results, newIq: todayResult.iq_after });
        }
      } else {
        const guestData = loadGuestData('play-stats', { iq: 100, streak: 0 });
        setIq(guestData.iq);
        setStreak(guestData.streak);
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

    if (user) {
      await saveDailyChallengeResult(user.id, score, DAILY_COUNT, results, iq, newIq);
      await checkAndAwardBadges(user.id);
      const newStreak = await getStreak(user.id);
      setStreak(newStreak.current_streak);
      setTodayDone(true);
    } else {
      saveGuestData('play-stats', { iq: newIq, streak: streak + 1 });
      setStreak(prev => prev + 1);
    }
  }, [user, iq, streak]);

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

  // Results screen (daily only)
  if (screen === 'results' && resultData) {
    return (
      <ResultsScreen
        score={resultData.score} total={DAILY_COUNT} results={resultData.results}
        iq={resultData.newIq} iqChange={resultData.score * 2}
        streak={streak} rank={rank} onBack={() => setScreen('home')}
        onKeepPlaying={handleKeepPlaying}
      />
    );
  }

  // Bonus game screen
  if (screen === 'bonus') {
    return (
      <DailyHandsGame
        hands={bonusHands} iq={iq} streak={streak} rank={rank}
        isBonus={true} onComplete={handleBonusComplete} onBonusResult={handleBonusResult}
      />
    );
  }

  // Daily game screen
  if (screen === 'game') {
    return (
      <DailyHandsGame
        hands={dailyHands} iq={iq} streak={streak} rank={rank}
        isBonus={false} onComplete={handleDailyComplete} onBonusResult={() => {}}
      />
    );
  }

  // Home screen
  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>{'\u2660'}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--on-surface, #0f172a)', letterSpacing: -0.3 }}>Daily Hands</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>5 hands. 60 seconds. How good are you?</div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <StatPill icon="🔥" value={String(streak)} label="Streak" bg="#fef3c7" borderColor="#f59e0b" color="#92400e" />
        <StatPill icon="🧠" value={String(iq)} label="IQ" bg="#ede9fe" borderColor="#8b5cf6" color="#5b21b6" />
        <StatPill icon="🏆" value={rank > 0 ? `#${rank}` : '—'} label="Rank" bg="#ecfdf5" borderColor="#10b981" color="#065f46" />
      </div>

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
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface, #0f172a)' }}>Keep Playing</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>5 more random hands. Still counts toward your IQ.</div>
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
                <span style={{ flex: 1, fontSize: 14, fontWeight: isYou ? 700 : 400, color: isYou ? '#10b981' : 'var(--on-surface, #0f172a)' }}>
                  {isYou ? 'You' : (p.display_name || 'Player')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{p.poker_iq}</span>
              </div>
            );
          })}
        </div>
      )}

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
