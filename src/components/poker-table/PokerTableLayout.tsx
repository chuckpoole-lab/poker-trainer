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

// Seats arranged clockwise around the table
const SEAT_POSITIONS: { pos: Position; x: number; y: number }[] = [
  { pos: Position.UTG, x: 35, y: 8 },
  { pos: Position.UTG1, x: 58, y: 8 },
  { pos: Position.MP, x: 82, y: 20 },
  { pos: Position.LJ, x: 90, y: 45 },
  { pos: Position.HJ, x: 82, y: 72 },
  { pos: Position.CO, x: 58, y: 88 },
  { pos: Position.BTN, x: 28, y: 85 },
  { pos: Position.SB, x: 10, y: 55 },
  { pos: Position.BB, x: 15, y: 22 },
];

// Action order: UTG first, BB last preflop
const DEAL_ORDER: Position[] = [
  Position.UTG, Position.UTG1, Position.MP, Position.LJ,
  Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB,
];

// Map short position strings from action history to Position enum
const POS_MAP: Record<string, Position> = {
  utg: Position.UTG, utg1: Position.UTG1, mp: Position.MP,
  lj: Position.LJ, hj: Position.HJ, co: Position.CO,
  btn: Position.BTN, sb: Position.SB, bb: Position.BB,
};

interface ActionInfo {
  readableText: string;
  foldedSeats: Position[];
  openerSeat: Position | null;
  openerSize: string;
}

function parseActionHistory(actionHistory: string, heroPosition: Position): ActionInfo {
  const heroIdx = DEAL_ORDER.indexOf(heroPosition);

  // Pattern: "xxx_opens_Nx_..." (facing open)
  const openMatch = actionHistory.match(/^(\w+)_opens_([\d.]+x)/);
  if (openMatch) {
    const openerPos = POS_MAP[openMatch[1]];
    const openerSize = openMatch[2];
    if (openerPos !== undefined) {
      const openerIdx = DEAL_ORDER.indexOf(openerPos);
      // Seats before the opener folded
      const foldedBefore = DEAL_ORDER.slice(0, openerIdx);
      // Seats between opener and hero folded
      const foldedBetween = DEAL_ORDER.slice(openerIdx + 1, heroIdx);
      // SB folded in "sb_folds" patterns
      const sbFolded = actionHistory.includes('sb_folds');
      const foldedSeats = [...foldedBefore, ...foldedBetween];
      if (sbFolded && !foldedSeats.includes(Position.SB)) {
        foldedSeats.push(Position.SB);
      }

      const openerLabel = POSITION_LABELS[openerPos];
      return {
        readableText: `${openerLabel} raised to ${openerSize}. Action is on you.`,
        foldedSeats,
        openerSeat: openerPos,
        openerSize,
      };
    }
  }

  // Pattern: "folded_to_hero" (unopened pot)
  if (actionHistory.includes('folded_to_hero')) {
    const foldedSeats = DEAL_ORDER.slice(0, heroIdx);
    const readableText = heroIdx === 0
      ? 'You are first to act.'
      : heroIdx <= 2
        ? `${foldedSeats.length} player${foldedSeats.length > 1 ? 's' : ''} folded. Action is on you.`
        : 'Everyone has folded to you.';
    return {
      readableText,
      foldedSeats,
      openerSeat: null,
      openerSize: '',
    };
  }

  // Pattern: "hero_opened_...3bet" (facing 3-bet)
  if (actionHistory.includes('hero_opened') && actionHistory.includes('3bet')) {
    return {
      readableText: 'You raised, and a player behind you re-raised (3-bet).',
      foldedSeats: [],
      openerSeat: null,
      openerSize: '',
    };
  }

  return {
    readableText: actionHistory.replace(/_/g, ' '),
    foldedSeats: [],
    openerSeat: null,
    openerSize: '',
  };
}

function parseSuits(handCode: string): { rank1: string; suit1: string; rank2: string; suit2: string } {
  const rank1 = handCode[0];
  const rank2 = handCode.length > 1 ? handCode[1] : rank1;
  const suited = handCode.length > 2 && handCode[2] === 's';

  // Pocket pairs
  if (rank1 === rank2 && handCode.length <= 2) {
    return { rank1, suit1: '♠', rank2, suit2: '♥' };
  }
  if (suited) {
    return { rank1, suit1: '♠', rank2, suit2: '♠' };
  } else {
    return { rank1, suit1: '♠', rank2, suit2: '♦' };
  }
}

function suitColor(suit: string): string {
  return (suit === '♥' || suit === '♦') ? '#dc2626' : '#1e293b';
}

export default function PokerTableLayout({
  heroPosition,
  heroHand,
  stackDepthBb,
  actionHistory,
  showLegend = false,
}: PokerTableLayoutProps) {
  const hand = parseSuits(heroHand);
  const action = parseActionHistory(actionHistory, heroPosition);

  // Show fold/open indicators after a brief mount delay to trigger CSS animation
  const [showActions, setShowActions] = useState(false);
  const totalAnimated = action.foldedSeats.length + (action.openerSeat ? 1 : 0);

  useEffect(() => {
    setShowActions(false);
    if (totalAnimated === 0) return;

    // Brief delay so the CSS animation plays on mount
    const timer = setTimeout(() => setShowActions(true), 80);
    return () => clearTimeout(timer);
  }, [heroPosition, actionHistory, totalAnimated]);

  // Build fold/open lookup sets for O(1) checks
  const foldedSet = new Set(action.foldedSeats);

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {/* Context line */}
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        padding: '8px 16px',
        background: 'var(--bg-card)',
        borderRadius: 8,
        border: '1px solid var(--border-card)',
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          You are in the <strong style={{ color: 'var(--color-accent)' }}>{POSITION_LABELS[heroPosition]}</strong>
          {' '}<span style={{ color: 'var(--text-muted)' }}>({POSITION_FULL_NAMES[heroPosition]})</span>
        </span>
      </div>

      {/* Table felt */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{
          width: '100%',
          aspectRatio: '1.6',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, var(--bg-table-felt) 0%, var(--bg-table) 60%, var(--bg-table-rim) 100%)',
          border: '3px solid #0d3321',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(0,0,0,0.2)',
        }}>
          {/* Center info */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e8ecf1' }}>
              {stackDepthBb}bb
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 4,
              maxWidth: 180,
              lineHeight: 1.3,
            }}>
              {action.readableText}
            </div>
          </div>

          {/* Seats */}
          {SEAT_POSITIONS.map(({ pos, x, y }) => {
            const isHero = pos === heroPosition;
            const isOpener = pos === action.openerSeat;
            const isFolded = foldedSet.has(pos);

            const showFoldX = isFolded && showActions;
            const showOpenerChip = isOpener && showActions;

            return (
              <div
                key={pos}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: isHero ? 42 : isOpener ? 38 : 32,
                  height: isHero ? 42 : isOpener ? 38 : 32,
                  borderRadius: '50%',
                  background: isHero
                    ? 'var(--color-accent)'
                    : showOpenerChip
                      ? 'rgba(234, 179, 8, 0.25)'
                      : showFoldX
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(255,255,255,0.08)',
                  border: isHero
                    ? '2px solid #fff'
                    : showOpenerChip
                      ? '2px solid rgba(234, 179, 8, 0.7)'
                      : showFoldX
                        ? '2px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isHero ? 12 : 10,
                  fontWeight: 700,
                  color: isHero
                    ? '#0a0e17'
                    : showOpenerChip
                      ? '#eab308'
                      : showFoldX
                        ? 'rgba(239, 68, 68, 0.7)'
                        : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}>
                  {POSITION_LABELS[pos]}

                  {/* Red X for folded seats */}
                  {showFoldX && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isHero ? 28 : 22,
                      fontWeight: 900,
                      color: '#ef4444',
                      textShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
                      animation: 'foldIn 0.3s ease-out',
                    }}>
                      ✕
                    </div>
                  )}

                  {/* Chip icon for opener */}
                  {showOpenerChip && (
                    <div style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#eab308',
                      border: '2px solid #0a0e17',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 900,
                      color: '#0a0e17',
                      animation: 'chipIn 0.3s ease-out',
                    }}>
                      R
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero hand display with proper suits */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
      }}>
        {[
          { rank: hand.rank1, suit: hand.suit1 },
          { rank: hand.rank2, suit: hand.suit2 },
        ].map((card, i) => (
          <div key={i} style={{
            width: 58,
            height: 80,
            borderRadius: 8,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            gap: 0,
          }}>
            <span style={{
              fontSize: 26,
              fontWeight: 800,
              color: suitColor(card.suit),
              lineHeight: 1,
            }}>
              {card.rank}
            </span>
            <span style={{
              fontSize: 20,
              color: suitColor(card.suit),
              lineHeight: 1,
              marginTop: -2,
            }}>
              {card.suit}
            </span>
          </div>
        ))}
      </div>

      {/* Seat legend for first spot */}
      {showLegend && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border-card)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Position Guide:</strong>{' '}
          UTG = Under the Gun (first) &middot; HJ = Hijack &middot; CO = Cutoff &middot; BTN = Button (dealer) &middot; SB/BB = Blinds
          <br /><span style={{ fontSize: 11 }}>Action moves clockwise. Red ✕ = folded. Yellow <span style={{ color: '#eab308' }}>R</span> = raised.</span>
        </div>
      )}

      <style>{`
        @keyframes foldIn {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes chipIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
