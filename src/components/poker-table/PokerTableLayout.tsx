'use client';

import { useState, useEffect } from 'react';
import { Position, POSITION_LABELS, POSITION_FULL_NAMES } from '@/lib/types';

interface PokerTableLayoutProps {
  heroPosition: Position;
  heroHand: string;
  stackDepthBb: number;
  actionHistory: string;
  showLegend?: boolean;
}

/* ── The Grandmaster's Lounge — Color Palette ── */
const C = {
  surface: '#121411',
  surfaceLow: '#1a1c19',
  surfaceContainer: '#1e201d',
  surfaceHigh: '#292b27',
  surfaceBright: '#383a36',
  feltBase: '#0e3621',
  feltLight: '#14492e',
  mahogany: '#673f33',
  mahoganyDark: '#4a271c',
  mahoganyDeep: '#311309',
  gold: '#e9c349',
  goldDim: '#cca72f',
  primary: '#a6d1b2',
  onSurface: '#e3e3de',
  onSurfaceVariant: '#c1c8c0',
  outlineVariant: '#414943',
  error: '#ef4444',
};

/* ── seat coordinates: positioned on the RAIL (not felt) to avoid clipping.
   Coordinates are % of the full rail container.
   BB alone on left, 3 top, 2 right, 3 bottom — evenly spaced. */
/* Equal arc-length spacing around the rounded-rectangle perimeter.
   Calculated for 500×250 rail with 90px corner radius, then pulled
   inward ~5-8 % so seats sit visibly on the rail surface. */
const SEAT_POSITIONS: { pos: Position; x: number; y: number }[] = [
  { pos: Position.UTG,  x: 15, y: 7  },
  { pos: Position.UTG1, x: 43, y: 5  },
  { pos: Position.MP,   x: 72, y: 7  },
  { pos: Position.LJ,   x: 92, y: 25 },
  { pos: Position.HJ,   x: 92, y: 75 },
  { pos: Position.CO,   x: 72, y: 93 },
  { pos: Position.BTN,  x: 43, y: 95 },
  { pos: Position.SB,   x: 15, y: 93 },
  { pos: Position.BB,   x: 8,  y: 50 },
];

const DEAL_ORDER: Position[] = [
  Position.UTG, Position.UTG1, Position.MP, Position.LJ,
  Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB,
];

const POS_MAP: Record<string, Position> = {
  utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
  lj: Position.LJ, hj: Position.HJ, co: Position.CO,
  btn: Position.BTN, sb: Position.SB, bb: Position.BB,
};

/* ── action history parser ── */
interface ActionInfo {
  readableText: string;
  foldedSeats: Position[];
  openerSeat: Position | null;
  openerSize: string;
}

function parseActionHistory(actionHistory: string, heroPosition: Position): ActionInfo {
  const heroIdx = DEAL_ORDER.indexOf(heroPosition);

  const openMatch = actionHistory.match(/^(\w+)_opens_([\d.]+x)/);
  if (openMatch) {
    const openerPos = POS_MAP[openMatch[1]];
    const openerSize = openMatch[2];
    if (openerPos !== undefined) {
      const openerIdx = DEAL_ORDER.indexOf(openerPos);
      const foldedBefore = DEAL_ORDER.slice(0, openerIdx);
      const foldedBetween = DEAL_ORDER.slice(openerIdx + 1, heroIdx);
      const sbFolded = actionHistory.includes('sb_folds');
      const foldedSeats = [...foldedBefore, ...foldedBetween];
      if (sbFolded && !foldedSeats.includes(Position.SB)) foldedSeats.push(Position.SB);
      return {
        readableText: `${POSITION_LABELS[openerPos]} raised to ${openerSize}. Action is on you.`,
        foldedSeats, openerSeat: openerPos, openerSize,
      };
    }
  }

  if (actionHistory.includes('folded_to_hero')) {
    const foldedSeats = DEAL_ORDER.slice(0, heroIdx);
    const readableText = heroIdx === 0
      ? 'You are first to act.'
      : heroIdx <= 2
        ? `${foldedSeats.length} player${foldedSeats.length > 1 ? 's' : ''} folded. Action is on you.`
        : 'Everyone has folded to you.';
    return { readableText, foldedSeats, openerSeat: null, openerSize: '' };
  }

  if (actionHistory.includes('hero_opened') && actionHistory.includes('3bet')) {
    return {
      readableText: 'You raised, and a player behind you re-raised (3-bet).',
      foldedSeats: [], openerSeat: null, openerSize: '',
    };
  }

  return {
    readableText: actionHistory.replace(/_/g, ' '),
    foldedSeats: [], openerSeat: null, openerSize: '',
  };
}

/* ── hand → suit parsing ── */
function parseSuits(handCode: string) {
  const rank1 = handCode[0];
  const rank2 = handCode.length > 1 ? handCode[1] : rank1;
  const suited = handCode.length > 2 && handCode[2] === 's';
  if (rank1 === rank2 && handCode.length <= 2) return { rank1, suit1: '♠', rank2, suit2: '♥' };
  if (suited) return { rank1, suit1: '♠', rank2, suit2: '♠' };
  return { rank1, suit1: '♠', rank2, suit2: '♦' };
}
function suitColor(suit: string) { return suit === '♥' || suit === '♦' ? '#c41e1e' : '#1a1a1a'; }

/* ───────────────────────────── COMPONENT ───────────────────────────── */
export default function PokerTableLayout({
  heroPosition, heroHand, stackDepthBb, actionHistory, showLegend = false,
}: PokerTableLayoutProps) {
  const hand = parseSuits(heroHand);
  const action = parseActionHistory(actionHistory, heroPosition);
  const foldedSet = new Set(action.foldedSeats);

  const [showActions, setShowActions] = useState(false);
  const totalAnimated = action.foldedSeats.length + (action.openerSeat ? 1 : 0);

  useEffect(() => {
    setShowActions(false);
    if (totalAnimated === 0) return;
    const t = setTimeout(() => setShowActions(true), 100);
    return () => clearTimeout(t);
  }, [heroPosition, actionHistory, totalAnimated]);

  return (
    <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
      {/* ── context bar ── */}
      <div style={{
        textAlign: 'center', marginBottom: 14, padding: '10px 16px',
        background: C.surfaceContainer, borderRadius: 12,
      }}>
        <span style={{ fontSize: 14, color: C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif' }}>
          You are in the{' '}
          <strong style={{ color: C.primary, letterSpacing: '0.03em' }}>
            {POSITION_LABELS[heroPosition]}
          </strong>{' '}
          <span style={{ color: '#7a8279', fontSize: 12 }}>
            ({POSITION_FULL_NAMES[heroPosition]})
          </span>
        </span>
      </div>

      {/* ── 3D perspective wrapper ── */}
      <div style={{ perspective: '1200px', perspectiveOrigin: '50% 35%' }}>
        <div style={{
          position: 'relative', width: '100%',
          transform: 'rotateX(18deg)', transformStyle: 'preserve-3d',
        }}>
          {/* ── mahogany rail ── */}
          <div style={{
            width: '100%', aspectRatio: '2.0',
            borderRadius: 90,
            background: `linear-gradient(145deg, ${C.mahogany} 0%, ${C.mahoganyDark} 50%, ${C.mahoganyDeep} 100%)`,
            border: `10px solid ${C.mahoganyDark}`,
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.8), 0 16px 44px rgba(0,0,0,0.6), inset 0 2px 4px rgba(242,185,169,0.08)`,
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* wood grain */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 80, opacity: 0.08, pointerEvents: 'none',
              background: `repeating-linear-gradient(95deg,transparent 0px,transparent 4px,rgba(242,185,169,0.12) 4px,rgba(242,185,169,0.12) 5px,transparent 5px,transparent 10px)`,
            }} />
            {/* rail top light */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '15%',
              borderRadius: '90px 90px 0 0', pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(242,185,169,0.06) 0%, transparent 100%)',
            }} />

            {/* ── felt ── */}
            <div style={{
              width: 'calc(100% - 20px)', height: 'calc(100% - 20px)',
              borderRadius: 80,
              background: `radial-gradient(ellipse at 45% 40%, ${C.feltLight} 0%, ${C.feltBase} 35%, #0a2e1a 70%, #071f12 100%)`,
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5), inset 0 -2px 10px rgba(0,0,0,0.3)',
              border: '2px solid rgba(0,0,0,0.2)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* felt texture */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 78, opacity: 0.04, pointerEvents: 'none',
                background: `repeating-linear-gradient(0deg,transparent 0px,transparent 1px,rgba(166,209,178,0.15) 1px,rgba(166,209,178,0.15) 2px),repeating-linear-gradient(90deg,transparent 0px,transparent 1px,rgba(166,209,178,0.08) 1px,rgba(166,209,178,0.08) 2px)`,
              }} />
              {/* ambient light */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 78, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 45% 30%, rgba(166,209,178,0.07) 0%, transparent 60%)',
              }} />
              {/* top shadow */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 78, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 18%)',
              }} />

              {/* ── center info ── */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 2,
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: `${C.surfaceBright}73`, backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: 28, padding: '7px 22px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  <span style={{
                    fontSize: 26, fontWeight: 800, color: C.onSurface,
                    fontFamily: 'Noto Serif, Georgia, serif',
                    textShadow: '0 1px 4px rgba(0,0,0,0.6)', letterSpacing: '-0.02em',
                  }}>
                    {stackDepthBb}
                    <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6, fontFamily: 'Manrope, sans-serif' }}>bb</span>
                  </span>
                </div>
                <div style={{
                  fontSize: 12, color: `${C.onSurface}b3`, marginTop: 10,
                  maxWidth: 200, lineHeight: 1.4,
                  fontFamily: 'Manrope, sans-serif',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}>
                  {action.readableText}
                </div>
              </div>

            </div>

            {/* ── seats — positioned on the RAIL so they don't get clipped ── */}
            {SEAT_POSITIONS.map(({ pos, x, y }) => {
              const isHero = pos === heroPosition;
              const isOpener = pos === action.openerSeat;
              const isFolded = foldedSet.has(pos);
              const showFoldX = isFolded && showActions;
              const showOpenerChip = isOpener && showActions;

              const size = isHero ? 46 : (isOpener ? 44 : 42);

              return (
                <div key={pos} style={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`,
                  transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5,
                }}>
                  <div style={{
                    width: size, height: size, borderRadius: '50%',
                    background: isHero
                      ? `linear-gradient(135deg, ${C.primary} 0%, #40674e 100%)`
                      : showOpenerChip
                        ? `${C.gold}33`
                        : showFoldX
                          ? `${C.surfaceLow}cc`
                          : `${C.surfaceHigh}cc`,
                    border: isHero
                      ? `2px solid ${C.primary}cc`
                      : showOpenerChip
                        ? `2px solid ${C.gold}8c`
                        : showFoldX
                          ? `1px solid ${C.error}33`
                          : `1px solid ${C.outlineVariant}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isHero ? 12 : 11,
                    fontWeight: 800,
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '-0.02em',
                    color: isHero ? C.surface
                      : showOpenerChip ? C.gold
                      : showFoldX ? `${C.onSurfaceVariant}80`
                      : C.onSurface,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    position: 'relative',
                    backdropFilter: (!isHero && !showFoldX) ? 'blur(8px)' : 'none',
                    WebkitBackdropFilter: (!isHero && !showFoldX) ? 'blur(8px)' : 'none',
                    boxShadow: isHero
                      ? `0 0 20px ${C.primary}50, 0 0 40px ${C.primary}20, 0 4px 12px rgba(0,0,0,0.3)`
                      : showOpenerChip
                        ? `0 0 16px ${C.gold}33, 0 2px 8px rgba(0,0,0,0.2)`
                        : '0 2px 8px rgba(0,0,0,0.25)',
                    textShadow: isHero ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}>
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {POSITION_LABELS[pos]}
                    </span>

                    {isHero && (
                      <div style={{
                        position: 'absolute', inset: -5, borderRadius: '50%',
                        border: `2px solid ${C.primary}55`,
                        animation: 'heroPulse 2.5s ease-in-out infinite',
                      }} />
                    )}

                    {showFoldX && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        overflow: 'hidden', pointerEvents: 'none',
                        animation: 'foldIn 0.35s cubic-bezier(0.16,1,0.3,1)',
                      }}>
                        {/* diagonal strikethrough line — sits behind the label (z-index 0 vs label z-index 1) */}
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          width: '120%', height: 2,
                          background: `linear-gradient(90deg, transparent 0%, ${C.error}99 20%, ${C.error}99 80%, transparent 100%)`,
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                          boxShadow: `0 0 4px ${C.error}40`,
                        }} />
                      </div>
                    )}

                    {showOpenerChip && (
                      <div style={{
                        position: 'absolute', top: -7, right: -7,
                        width: 20, height: 20, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDim} 100%)`,
                        border: `2px solid ${C.surface}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 900, color: C.surface,
                        animation: 'chipIn 0.3s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 10px ${C.gold}33`,
                      }}>
                        R
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* rail inner shadow */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 80, pointerEvents: 'none',
              boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.3), inset 0 -2px 12px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
      </div>

      {/* ── hero hand — traditional white cards ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        {[
          { rank: hand.rank1, suit: hand.suit1, delay: '0s' },
          { rank: hand.rank2, suit: hand.suit2, delay: '0.08s' },
        ].map((card, i) => (
          <div key={i} style={{
            width: 62, height: 88, borderRadius: 8,
            background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f4 50%, #ececea 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
            position: 'relative', overflow: 'hidden',
            animation: `cardDealIn 0.4s cubic-bezier(0.16,1,0.3,1) ${card.delay} both`,
          }}>
            <div style={{
              position: 'absolute', inset: 3, borderRadius: 5,
              border: '1px solid rgba(0,0,0,0.06)', pointerEvents: 'none',
            }} />
            <span style={{
              fontSize: 28, fontWeight: 800, color: suitColor(card.suit),
              lineHeight: 1, letterSpacing: '-0.02em',
              fontFamily: 'Noto Serif, Georgia, serif',
            }}>
              {card.rank}
            </span>
            <span style={{ fontSize: 22, color: suitColor(card.suit), lineHeight: 1, marginTop: -2 }}>
              {card.suit}
            </span>
            <div style={{
              position: 'absolute', top: 4, left: 5,
              display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: suitColor(card.suit) }}>{card.rank}</span>
              <span style={{ fontSize: 8, color: suitColor(card.suit), marginTop: -1 }}>{card.suit}</span>
            </div>
            <div style={{
              position: 'absolute', bottom: 4, right: 5,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              lineHeight: 1, transform: 'rotate(180deg)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: suitColor(card.suit) }}>{card.rank}</span>
              <span style={{ fontSize: 8, color: suitColor(card.suit), marginTop: -1 }}>{card.suit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── seat legend ── */}
      {showLegend && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: C.surfaceContainer, borderRadius: 8,
          fontSize: 12, color: '#7a8279', lineHeight: 1.6,
          fontFamily: 'Manrope, sans-serif',
        }}>
          <strong style={{ color: C.onSurfaceVariant, fontSize: 12 }}>Position Guide:</strong>{' '}
          UTG = Under the Gun (first) &middot; HJ = Hijack &middot; CO = Cutoff &middot; BTN = Button (dealer) &middot; SB/BB = Blinds
          <br />
          <span style={{ fontSize: 11 }}>
            Action moves clockwise. Red line = folded.
            Yellow <span style={{ color: C.gold }}>R</span> = raised.
          </span>
        </div>
      )}

      <style>{`
        @keyframes foldIn {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
        @keyframes chipIn {
          0%   { transform: scale(0);   opacity: 0; }
          60%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes heroPulse {
          0%, 100% { transform: scale(1);    opacity: 0.5; }
          50%      { transform: scale(1.2);  opacity: 0; }
        }
        @keyframes cardDealIn {
          0%   { transform: translateY(24px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0)    scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
