// Range tables for dynamic spot generation
// Based on publicly available GTO push/fold and opening range charts for MTT play
// Ranges use standard poker notation: 22+ means all pairs, A2s+ means all suited aces, etc.

import { Position, SimplifiedAction, SpotType } from '@/lib/types';

// All 169 starting hands in standard grid order
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];

export interface HandCombo {
  code: string;     // e.g. "AKs", "QTo", "88"
  rank1: string;
  rank2: string;
  suited: boolean;
  isPair: boolean;
}

// Generate all 169 combos
function generateAllHands(): HandCombo[] {
  const hands: HandCombo[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      if (i === j) {
        hands.push({ code: `${RANKS[i]}${RANKS[j]}`, rank1: RANKS[i], rank2: RANKS[j], suited: false, isPair: true });
      } else {
        hands.push({ code: `${RANKS[i]}${RANKS[j]}s`, rank1: RANKS[i], rank2: RANKS[j], suited: true, isPair: false });
        hands.push({ code: `${RANKS[i]}${RANKS[j]}o`, rank1: RANKS[i], rank2: RANKS[j], suited: false, isPair: false });
      }
    }
  }
  return hands;
}

export const ALL_HANDS = generateAllHands();

// Rank value for comparison
const RANK_VAL: Record<string, number> = {
  'A':14,'K':13,'Q':12,'J':11,'T':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2
};

export function handStrength(h: HandCombo): number {
  const hi = RANK_VAL[h.rank1];
  const lo = RANK_VAL[h.rank2];
  let score = hi * 15 + lo;
  if (h.isPair) score += 200;
  if (h.suited) score += 30;
  return score;
}

// Parse range notation like "22+, A2s+, K8s+, Q9s+, ATo+, KJo+"
// Also handles dash ranges: "22-99", "A2s-ATs", "A2o-AJo"
function parseRange(notation: string): Set<string> {
  const result = new Set<string>();
  const parts = notation.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      // Dash range: e.g. "22-99", "A2s-ATs", "A2o-AJo"
      const [low, high] = part.split('-');

      if (low.length === 2 && low[0] === low[1] && high.length === 2 && high[0] === high[1]) {
        // Pair range: e.g. "22-99" means 22,33,44,...,99
        const minVal = RANK_VAL[low[0]];
        const maxVal = RANK_VAL[high[0]];
        for (const r of RANKS) {
          if (RANK_VAL[r] >= minVal && RANK_VAL[r] <= maxVal) result.add(`${r}${r}`);
        }
      } else if (low.length === 3 && high.length === 3) {
        // Suited/offsuit range: e.g. "A2s-ATs" or "A2o-AJo"
        const r1 = low[0]; // High card (should be same for both)
        const type = low[2]; // 's' or 'o'
        const minR2Val = RANK_VAL[low[1]];
        const maxR2Val = RANK_VAL[high[1]];
        for (const r of RANKS) {
          if (RANK_VAL[r] >= minR2Val && RANK_VAL[r] <= maxR2Val) {
            result.add(`${r1}${r}${type}`);
          }
        }
      }
    } else if (part.endsWith('+')) {
      const base = part.slice(0, -1);

      if (base.length === 2 && base[0] === base[1]) {
        // Pair+: e.g. "22+" means 22,33,...,AA
        const minVal = RANK_VAL[base[0]];
        for (const r of RANKS) {
          if (RANK_VAL[r] >= minVal) result.add(`${r}${r}`);
        }
      } else if (base.length === 3) {
        const r1 = base[0];
        const r2 = base[1];
        const type = base[2]; // 's' or 'o'
        const r1Val = RANK_VAL[r1];
        const minR2Val = RANK_VAL[r2];
        // e.g. "K8s+" means K8s, K9s, KTs, KJs, KQs
        for (const r of RANKS) {
          if (RANK_VAL[r] >= minR2Val && RANK_VAL[r] < r1Val) {
            result.add(`${r1}${r}${type}`);
          }
        }
      }
    } else if (part === 'Ax' || part === 'Kx' || part === 'Qx' || part === 'Jx') {
      // Any hand with this high card
      const hi = part[0];
      for (const r of RANKS) {
        if (r !== hi && RANK_VAL[r] < RANK_VAL[hi]) {
          result.add(`${hi}${r}s`);
          result.add(`${hi}${r}o`);
        }
      }
    } else {
      // Specific hand
      result.add(part);
    }
  }
  return result;
}

// ======= OPENING RANGES (RFI - Raise First In) =======
// Stack depths: 10, 15, 20, 25, 30bb
// Action: hands in range = OPEN (or JAM at short stacks), hands not in range = FOLD

export interface RangeEntry {
  openRange: Set<string>;    // Hands to open/raise
  jamRange: Set<string>;     // Hands to jam (at short stacks, may overlap or replace open)
}

type PositionRanges = Partial<Record<Position, RangeEntry>>;
type StackRanges = Record<number, PositionRanges>;

const OPENING_RANGES_RAW: Record<number, Record<string, { open: string; jam: string }>> = {
  10: {
    [Position.UTG]: { open: '', jam: '22+, A2s+, A7o+, K9s+, KTo+, QTs+, JTs' },
    [Position.HJ]:  { open: '', jam: '22+, A2s+, A2o+, K4s+, K9o+, Q8s+, QTo+, J8s+, JTo, T8s+, 98s' },
    [Position.CO]:  { open: '', jam: '22+, A2s+, A2o+, K2s+, K5o+, Q5s+, Q9o+, J7s+, J9o+, T7s+, T9o, 97s+, 87s, 76s' },
    [Position.BTN]: { open: '', jam: '22+, A2s+, A2o+, K2s+, K2o+, Q2s+, Q5o+, J4s+, J8o+, T6s+, T8o+, 96s+, 86s+, 76s, 65s' },
    [Position.SB]:  { open: '', jam: '22+, A2s+, A2o+, K2s+, K2o+, Q2s+, Q3o+, J2s+, J5o+, T4s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 54s' },
  },
  15: {
    [Position.UTG]: { open: '', jam: '22+, A2s+, A9o+, K9s+, KTo+, QTs+, JTs' },
    [Position.HJ]:  { open: '99+, AJs+, AQo+, KQs', jam: '22+, A2s+, A5o+, K8s+, KTo+, Q9s+, QJo, J9s+, T9s' },
    [Position.CO]:  { open: 'TT+, ATs+, AJo+, KTs+, KQo, QJs', jam: '22+, A2s+, A2o+, K5s+, K9o+, Q8s+, QTo+, J8s+, JTo, T8s+, 98s, 87s' },
    [Position.BTN]: { open: 'TT+, A9s+, ATo+, KTs+, KJo+, QTs+, JTs', jam: '22+, A2s+, A2o+, K2s+, K5o+, Q6s+, Q9o+, J7s+, J9o+, T7s+, 97s+, 87s, 76s' },
    [Position.SB]:  { open: '', jam: '22+, A2s+, A2o+, K2s+, K3o+, Q2s+, Q7o+, J4s+, J8o+, T6s+, T8o+, 96s+, 85s+, 75s+, 64s+, 54s' },
  },
  20: {
    [Position.UTG]: { open: '66+, A3s+, K8s+, Q9s+, J9s+, T9s, ATo+, KTo+, QJo', jam: '' },
    [Position.HJ]:  { open: '44+, A2s+, K6s+, Q8s+, J8s+, T8s+, 98s, A8o+, KTo+, QTo+, JTo', jam: '22, 33, A5o, A4o, A3o, A2o' },
    [Position.CO]:  { open: '22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 97s+, 87s, 76s, A5o+, K9o+, QTo+, JTo', jam: '' },
    [Position.BTN]: { open: '22+, A2s+, K2s+, Q3s+, J5s+, T6s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K7o+, Q9o+, J9o+, T8o+, 98o', jam: '' },
    [Position.SB]:  { open: '22+, A2s+, K2s+, Q4s+, J7s+, T7s+, 97s+, 86s+, 76s, 65s, A2o+, K5o+, Q8o+, J9o+, T9o', jam: '' },
  },
  25: {
    [Position.UTG]: { open: '55+, A3s+, K8s+, Q9s+, J9s+, T9s, ATo+, KJo+', jam: '' },
    [Position.HJ]:  { open: '44+, A2s+, K6s+, Q8s+, J8s+, T8s+, 98s, A9o+, KTo+, QTo+, JTo', jam: '' },
    [Position.CO]:  { open: '22+, A2s+, K4s+, Q7s+, J7s+, T7s+, 97s+, 87s, 76s, A7o+, K9o+, QTo+, JTo', jam: '' },
    [Position.BTN]: { open: '22+, A2s+, K2s+, Q2s+, J4s+, T5s+, 95s+, 85s+, 75s+, 64s+, 54s, 43s, A2o+, K5o+, Q8o+, J8o+, T8o+, 97o+, 87o', jam: '' },
    [Position.SB]:  { open: '22+, A2s+, K2s+, Q3s+, J5s+, T6s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K4o+, Q7o+, J8o+, T8o+, 98o', jam: '' },
  },
  30: {
    [Position.UTG]: { open: '66+, A2s+, K9s+, QTs+, JTs, T9s, ATo+, KJo+, QJo', jam: '' },
    [Position.HJ]:  { open: '44+, A2s+, K7s+, Q9s+, J9s+, T8s+, 98s, 87s, A9o+, KTo+, QTo+, JTo', jam: '' },
    [Position.CO]:  { open: '22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 97s+, 86s+, 76s, 65s, A5o+, K9o+, Q9o+, J9o+, T9o', jam: '' },
    [Position.BTN]: { open: '22+, A2s+, K2s+, Q2s+, J3s+, T4s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K5o+, Q8o+, J8o+, T7o+, 97o+, 87o, 76o', jam: '' },
    [Position.SB]:  { open: '22+, A2s+, K2s+, Q2s+, J4s+, T5s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K3o+, Q6o+, J8o+, T8o+, 97o+, 87o', jam: '' },
  },
};

// ======= FACING OPEN RANGES =======
// When a player opens ahead of hero: 3bet(jam)/call/fold decisions
// Key format: "openerPosition_heroPosition_stackBb"

interface FacingOpenEntry {
  jamRange: string;   // 3-bet jam
  callRange: string;  // Flat call
  // Everything else = fold
}

const FACING_OPEN_RAW: Record<string, FacingOpenEntry> = {
  // ============================================================
  // UTG opens — tight range, defenders must be selective
  // ============================================================

  // UTG opens, hero in HJ
  'utg_hj_15': { jamRange: '99+, AQs+, AQo+', callRange: '' },
  'utg_hj_20': { jamRange: 'TT+, AQs+, AQo+', callRange: '99, AJs, KQs' },
  'utg_hj_25': { jamRange: 'QQ+, AKs, AKo', callRange: '77-JJ, ATs+, AJo+, KQs, QJs, JTs' },
  'utg_hj_30': { jamRange: 'QQ+, AKs', callRange: '55-JJ, ATs+, AJo+, KJs+, KQo, QJs, JTs, T9s' },

  // UTG opens, hero in CO
  'utg_co_15': { jamRange: '99+, AQs+, AQo+', callRange: '' },
  'utg_co_20': { jamRange: 'TT+, AJs+, AQo+', callRange: '77-99, ATs, KQs' },
  'utg_co_25': { jamRange: 'TT+, AJs+, AQo+, KQs', callRange: '66-99, ATs, AJo, KJs+, KQo, QJs, JTs, T9s' },
  'utg_co_30': { jamRange: 'TT+, AQs+, AKo', callRange: '55-99, ATs+, AJo+, KJs+, KQo, QJs, JTs, T9s' },

  // UTG opens, hero on BTN
  'utg_btn_15': { jamRange: '77+, A9s+, ATo+, KTs+, KQo, QJs', callRange: '' },
  'utg_btn_20': { jamRange: 'TT+, AJs+, AQo+', callRange: '66-99, ATs, KQs, QJs' },
  'utg_btn_25': { jamRange: 'QQ+, AKs, AKo', callRange: '44-JJ, ATs+, AJo+, KJs+, KQo, QTs+, JTs, T9s' },
  'utg_btn_30': { jamRange: 'QQ+, AKs', callRange: '33-JJ, A9s+, ATo+, KTs+, KJo+, QTs+, JTs, T9s, 98s' },

  // UTG opens, hero in SB
  'utg_sb_15': { jamRange: 'TT+, AQs+, AQo+', callRange: '' },
  'utg_sb_20': { jamRange: 'TT+, AQs+, AQo+', callRange: '' },
  'utg_sb_25': { jamRange: 'QQ+, AKs, AKo', callRange: '88-JJ, AJs+, AQo, KQs' },
  'utg_sb_30': { jamRange: 'QQ+, AKs', callRange: '77-JJ, ATs+, AJo+, KQs' },

  // UTG opens, hero in BB (wider defense due to pot odds)
  'utg_bb_15': { jamRange: '99+, AQs+, AQo+', callRange: '' },
  'utg_bb_20': { jamRange: 'TT+, AQs+, AQo+', callRange: '22-99, ATs+, AJo, KJs+, KQo, QJs, JTs' },
  'utg_bb_25': { jamRange: 'QQ+, AKs, AKo', callRange: '22-JJ, A2s+, ATo+, K9s+, KTo+, Q9s+, J9s+, T9s, 98s, 87s' },
  'utg_bb_30': { jamRange: 'QQ+, AKs', callRange: '22-JJ, A4s+, A8o+, K7s+, KTo+, Q8s+, QTo+, J8s+, JTo, T8s+, 97s+, 87s, 76s, 65s' },

  // ============================================================
  // HJ opens — moderate range
  // ============================================================

  // HJ opens, hero in CO
  'hj_co_15': { jamRange: '88+, ATs+, AJo+, KQs, A5s', callRange: '' },
  'hj_co_20': { jamRange: 'TT+, AJs+, AQo+, KQs', callRange: '77-99, ATs, KJs' },
  'hj_co_25': { jamRange: 'QQ+, AKs, AKo', callRange: '55-JJ, ATs+, AJo+, KJs+, KQo, QJs, JTs, T9s' },
  'hj_co_30': { jamRange: 'QQ+, AKs', callRange: '44-JJ, A9s+, ATo+, KTs+, KJo+, QTs+, JTs, T9s, 98s' },

  // HJ opens, hero on BTN
  'hj_btn_15': { jamRange: '55+, A2s+, A7o+, K9s+, KTo+, QTs+, JTs', callRange: '' },
  'hj_btn_20': { jamRange: '88+, A9s+, ATo+, KQs, A5s', callRange: '22-77, KJs, QJs, JTs' },
  'hj_btn_25': { jamRange: '99+, ATs+, AJo+, KQs, A5s', callRange: '22-88, A2s-A9s, ATo, K9s+, KJo+, QTs+, JTs, T9s, 98s' },
  'hj_btn_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s-AJs, ATo+, K9s+, KJo+, QTs+, QJo, JTs, T9s, 98s, 87s' },

  // HJ opens, hero in SB
  'hj_sb_15': { jamRange: '99+, ATs+, AQo+, KQs', callRange: '' },
  'hj_sb_20': { jamRange: 'TT+, AQs+, AKo', callRange: '' },
  'hj_sb_25': { jamRange: 'QQ+, AKs, AKo', callRange: '77-JJ, AJs+, AQo, KQs' },
  'hj_sb_30': { jamRange: 'QQ+, AKs', callRange: '66-JJ, ATs+, AJo+, KJs+, KQo, QJs' },

  // HJ opens, hero in BB
  'hj_bb_15': { jamRange: '77+, ATs+, AJo+, KQs', callRange: '' },
  'hj_bb_20': { jamRange: '99+, ATs+, AJo+, KQs', callRange: '22-88, A2s-A9s, KTs+, KQo, QTs+, JTs, T9s' },
  'hj_bb_25': { jamRange: 'TT+, AQs+, AKo, A5s', callRange: '22-99, A2s-AJs, A9o-AJo, K8s+, KTo+, Q9s+, J9s+, T8s+, 98s, 87s' },
  'hj_bb_30': { jamRange: 'QQ+, AKs', callRange: '22-JJ, A2s+, A7o+, K6s+, K9o+, Q8s+, QTo+, J8s+, JTo, T7s+, 97s+, 86s+, 76s, 65s' },

  // ============================================================
  // CO opens — wider range, defenders widen accordingly
  // ============================================================

  // CO opens, hero on BTN
  'co_btn_15': { jamRange: '55+, A2s+, A7o+, KTs+, KJo+, QTs+', callRange: '' },
  'co_btn_20': { jamRange: '88+, ATs+, AJo+, KQs, A5s', callRange: '22-77, A8s-A9s, KTs+, QJs, JTs' },
  'co_btn_25': { jamRange: '99+, ATs+, AJo+, KQs, A5s, A4s', callRange: '22-88, A2s-A9s, ATo, K9s+, KJo+, QTs+, QJo, JTs, T9s, 98s, 87s' },
  'co_btn_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s+, ATo+, K8s+, KTo+, Q9s+, QJo, J9s+, T9s, 98s, 87s' },

  // CO opens, hero in SB
  'co_sb_15': { jamRange: '66+, A2s+, A7o+, KTs+, KJo+, QTs+', callRange: '' },
  'co_sb_20': { jamRange: '99+, ATs+, AJo+, KQs, A5s', callRange: '' },
  'co_sb_25': { jamRange: 'TT+, AQs+, AKo, A5s, A4s', callRange: '22-99, A2s-A9s, ATo+, KTs+, KJo+, QTs+, JTs, T9s' },
  'co_sb_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s+, ATo+, KTs+, KJo+, QTs+, JTs, T9s, 98s' },

  // CO opens, hero in BB (wide defense)
  'co_bb_15': { jamRange: '55+, A2s+, A5o+, K9s+, KTo+, QTs+, JTs', callRange: '' },
  'co_bb_20': { jamRange: '99+, ATs+, AJo+, KQs, A5s', callRange: '22-88, A2s-A9s, K8s+, KTo+, Q9s+, J9s+, T8s+, 98s, 87s' },
  'co_bb_25': { jamRange: 'TT+, AQs+, AKo, A5s', callRange: '22-99, A2s-AJs, A8o-AJo, K5s+, K9o+, Q7s+, QTo+, J7s+, JTo, T7s+, 97s+, 86s+, 76s, 65s' },
  'co_bb_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s+, A2o-AJo, K2s+, K7o+, Q5s+, Q9o+, J6s+, J9o+, T6s+, T9o, 96s+, 85s+, 75s+, 65s, 54s' },

  // ============================================================
  // BTN opens — wide range, blinds defend accordingly
  // ============================================================

  // BTN opens, hero in SB
  'btn_sb_15': { jamRange: '44+, A2s+, A5o+, K9s+, KTo+, QTs+, JTs', callRange: '' },
  'btn_sb_20': { jamRange: '88+, A9s+, ATo+, KJs+, KQo, A5s', callRange: '' },
  'btn_sb_25': { jamRange: 'TT+, ATs+, AJo+, KQs, A5s, A4s', callRange: '22-99, A2s-A9s, ATo, K8s+, KTo+, Q9s+, J9s+, T9s, 98s' },
  'btn_sb_30': { jamRange: 'TT+, AQs+, AKo, A5s', callRange: '33-99, A2s-A9s, ATo, K9s+, KTo+, Q9s+, J9s+, T9s, 98s, 87s' },

  // BTN opens, hero in BB (widest defense spot in poker)
  'btn_bb_15': { jamRange: '44+, A2s+, A5o+, K9s+, KTo+, QTs+, JTs', callRange: '' },
  'btn_bb_20': { jamRange: '99+, ATs+, AJo+, KQs', callRange: '22-88, A2s-A9s, K5s+, KTo+, Q8s+, J8s+, T8s+, 98s, 87s' },
  'btn_bb_25': { jamRange: 'TT+, AJs+, AQo+, A5s', callRange: '22-99, A2s-ATs, A2o-AJo, K2s+, K9o+, Q5s+, QTo+, J7s+, JTo, T7s+, 97s+, 87s, 76s, 65s' },
  'btn_bb_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s+, A2o-AJo, K2s+, K7o+, Q4s+, Q9o+, J6s+, J9o+, T6s+, T9o, 96s+, 86s+, 75s+, 65s, 54s' },

  // ============================================================
  // SB opens — widest opening range, BB defends very wide
  // ============================================================

  // SB opens, hero in BB
  'sb_bb_15': { jamRange: '44+, A2s+, A5o+, K8s+, KTo+, Q9s+, J9s+, T9s', callRange: '' },
  'sb_bb_20': { jamRange: '77+, A2s+, A7o+, K9s+, KTo+, QTs+, JTs', callRange: '22-66, A2o-A6o, K2s-K8s, K9o, Q8s, J8s+, T8s+, 98s' },
  'sb_bb_25': { jamRange: '99+, ATs+, AJo+, KQs, A5s, A4s', callRange: '22-88, A2s-A9s, A2o-ATo, K2s+, K5o+, Q5s+, Q9o+, J7s+, J9o+, T7s+, T9o, 97s+, 86s+, 76s, 65s' },
  'sb_bb_30': { jamRange: 'TT+, AQs+, AKo', callRange: '22-99, A2s+, A2o-AJo, K2s+, K3o+, Q3s+, Q7o+, J5s+, J8o+, T6s+, T8o+, 96s+, 85s+, 75s+, 64s+, 54s, 43s' },

  // ============================================================
  // MP opens (legacy compatibility), hero in CO
  // ============================================================
  'mp_co_15': { jamRange: '99+, AQs+, AKo', callRange: '' },
  'mp_co_20': { jamRange: 'TT+, AJs+, AQo+', callRange: '77-99, ATs, KQs' },
  'mp_co_25': { jamRange: 'TT+, AQs+, AKo', callRange: '55-99, ATs+, AJo, KJs+, KQo, QJs, JTs, T9s' },
  'mp_co_30': { jamRange: 'QQ+, AKs', callRange: '44-JJ, A9s+, ATo+, KTs+, KJo+, QTs+, JTs, T9s, 98s' },
};

// ======= PARSED/COMPILED RANGE DATA =======

export interface CompiledRanges {
  opening: Map<string, { open: Set<string>; jam: Set<string> }>;
  facingOpen: Map<string, { jam: Set<string>; call: Set<string> }>;
}

function compileRanges(): CompiledRanges {
  const opening = new Map<string, { open: Set<string>; jam: Set<string> }>();
  const facingOpen = new Map<string, { jam: Set<string>; call: Set<string> }>();

  for (const [stackStr, positions] of Object.entries(OPENING_RANGES_RAW)) {
    for (const [pos, ranges] of Object.entries(positions)) {
      const key = `${pos}_${stackStr}`;
      opening.set(key, {
        open: parseRange(ranges.open),
        jam: parseRange(ranges.jam),
      });
    }
  }

  for (const [key, entry] of Object.entries(FACING_OPEN_RAW)) {
    facingOpen.set(key, {
      jam: parseRange(entry.jamRange),
      call: parseRange(entry.callRange),
    });
  }

  return { opening, facingOpen };
}

export const COMPILED_RANGES = compileRanges();

// Lookup functions
export function getOpeningAction(position: Position, stackBb: number, handCode: string): SimplifiedAction {
  // Find closest stack depth
  const stacks = [10, 15, 20, 25, 30];
  const closest = stacks.reduce((prev, curr) =>
    Math.abs(curr - stackBb) < Math.abs(prev - stackBb) ? curr : prev
  );

  const key = `${position}_${closest}`;
  const ranges = COMPILED_RANGES.opening.get(key);
  if (!ranges) return SimplifiedAction.FOLD;

  if (ranges.jam.has(handCode)) return SimplifiedAction.JAM;
  if (ranges.open.has(handCode)) return SimplifiedAction.OPEN;
  return SimplifiedAction.FOLD;
}

export function getFacingOpenAction(
  openerPos: Position,
  heroPos: Position,
  stackBb: number,
  handCode: string,
): SimplifiedAction {
  const stacks = [15, 20, 25, 30];
  const closest = stacks.reduce((prev, curr) =>
    Math.abs(curr - stackBb) < Math.abs(prev - stackBb) ? curr : prev
  );

  const key = `${openerPos}_${heroPos}_${closest}`;
  const ranges = COMPILED_RANGES.facingOpen.get(key);
  if (!ranges) return SimplifiedAction.FOLD;

  if (ranges.jam.has(handCode)) return SimplifiedAction.JAM;
  if (ranges.call.has(handCode)) return SimplifiedAction.CALL;
  return SimplifiedAction.FOLD;
}

// Get all hands that have a specific action for a given scenario
export function getHandsForAction(
  position: Position,
  stackBb: number,
  action: SimplifiedAction,
): HandCombo[] {
  return ALL_HANDS.filter(h => getOpeningAction(position, stackBb, h.code) === action);
}
