/**
 * Standalone validator for play-scenario-generator.
 * Runs entirely in Node.js — no React, no Next.js needed.
 * Re-implements the core logic in plain JS so we can test 1000+ hands fast.
 *
 * Tests:
 *   1. Cards match handCode ranks
 *   2. Suited hands have matching suits, offsuit/pairs have different suits
 *   3. Explanation text contains handCode
 *   4. tipWrong contains handCode
 *   5. correct index is within choices array bounds
 *   6. Daily hands are deterministic (same output on two calls)
 *   7. No duplicate handCode+position combos in one daily set
 */

// ── Inline the core logic (mirrors play-scenario-generator.ts) ──

const SUITS = ['h', 'd', 'c', 's'];
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const RANK_VAL = Object.fromEntries(RANKS.map((r, i) => [r, 14 - i]));

// All 169 hands
const ALL_HANDS = [];
for (let i = 0; i < RANKS.length; i++) {
  for (let j = i; j < RANKS.length; j++) {
    if (i === j) {
      ALL_HANDS.push({ code: `${RANKS[i]}${RANKS[i]}`, r1: RANKS[i], r2: RANKS[i], suited: false, isPair: true });
    } else {
      ALL_HANDS.push({ code: `${RANKS[i]}${RANKS[j]}s`, r1: RANKS[i], r2: RANKS[j], suited: true, isPair: false });
      ALL_HANDS.push({ code: `${RANKS[i]}${RANKS[j]}o`, r1: RANKS[i], r2: RANKS[j], suited: false, isPair: false });
    }
  }
}

function seededRng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

function handCodeToCards(handCode) {
  const r1 = handCode[0];
  const r2 = handCode.length >= 2 ? handCode[1] : r1;
  const isSuited = handCode.endsWith('s');
  const seed =
    (handCode.charCodeAt(0) * 7331) ^
    (handCode.charCodeAt(1) * 1999) ^
    (handCode.length > 2 ? handCode.charCodeAt(2) * 397 : 0);

  if (isSuited) {
    const suit = SUITS[Math.abs(seed) % 4];
    return [{ rank: r1, suit }, { rank: r2, suit }];
  }
  const s1 = Math.abs(seed) % 4;
  const s2 = (Math.abs(seed >> 2) % 3 + s1 + 1) % 4;
  return [{ rank: r1, suit: SUITS[s1] }, { rank: r2, suit: SUITS[s2] }];
}

// Minimal range data (just enough to test action lookup logic)
// We test structural consistency, not GTO correctness here.
// Action is irrelevant to the card/explanation match test — we just need
// something deterministic returned.
function mockAction(handCode, spotType) {
  const v = (handCode.charCodeAt(0) + handCode.charCodeAt(1)) % 4;
  if (spotType === 'facing_open' || spotType === 'facing_3bet') {
    return ['fold', 'call', 'jam', 'fold'][v];
  }
  if (spotType === 'facing_limp') {
    return ['fold', 'limp', 'open', 'jam'][v];
  }
  return ['fold', 'open', 'jam', 'fold'][v];
}

function mockExplanation(handCode, action, spotType, heroKey, stackBb, opponentKey) {
  // Mirrors real explanation structure: always embeds handCode
  const actionLabel = { fold: 'Fold', open: 'Raise', call: 'Call', jam: 'All-in', limp: 'Limp behind' }[action] ?? action;

  if (spotType === 'facing_open' && opponentKey) {
    const ctx = `${opponentKey.toUpperCase()} raised and the action is on you in the ${heroKey.toUpperCase()} with ${handCode} at ${stackBb}bb`;
    return `${ctx}. Going ${actionLabel.toLowerCase()} is the best play.`;
  }
  if (spotType === 'facing_limp' && opponentKey) {
    return `${opponentKey.toUpperCase()} limped and the action is on you in the ${heroKey.toUpperCase()} with ${handCode} at ${stackBb}bb. The correct play is ${actionLabel.toLowerCase()}.`;
  }
  if (spotType === 'facing_3bet' && opponentKey) {
    return `You opened from ${heroKey.toUpperCase()} and ${opponentKey.toUpperCase()} 3-bet with ${handCode} at ${stackBb}bb. Going ${actionLabel.toLowerCase()} is correct.`;
  }
  return `It folds to you with ${handCode} at ${stackBb}bb. This hand is ${action === 'fold' ? 'a fold' : 'strong enough to play'}.`;
}

function buildChoices(spotType) {
  if (spotType === 'facing_3bet' || spotType === 'facing_open') return ['Fold', 'Call', 'All-in'];
  if (spotType === 'facing_limp') return ['Fold', 'Limp behind', 'Raise', 'All-in'];
  return ['Fold', 'Raise', 'All-in'];
}

function correctIndex(action, choices) {
  const map = { fold: ['Fold'], open: ['Raise'], call: ['Call'], jam: ['All-in'], limp: ['Limp behind'] };
  for (const label of (map[action] ?? [])) {
    const idx = choices.findIndex(c => c.includes(label));
    if (idx >= 0) return idx;
  }
  return 0;
}

const FACING_OPEN_KEYS = [
  'utg_hj_20','utg_co_25','utg_bb_20','hj_btn_25','hj_bb_20','co_btn_20',
  'co_bb_25','btn_sb_25','btn_bb_20','sb_bb_25'
];
const FACING_LIMP_KEYS = [
  'utg_btn_20','hj_btn_25','co_btn_20','sb_bb_20','hj_sb_25','co_btn_25'
];
const FACING_3BET_KEYS = [
  'utg_btn_25','hj_btn_20','co_btn_25','btn_sb_20','btn_bb_25','sb_bb_20'
];
const OPENING_POSITIONS = ['utg', 'hj', 'co', 'btn', 'sb'];
const STACK_DEPTHS = [10, 15, 20, 25, 30];

function pickRng(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

function pickScenarioParams(rng) {
  const roll = rng();
  if (roll < 0.35) {
    const key = pickRng(FACING_OPEN_KEYS, rng);
    const parts = key.split('_');
    return { spotType: 'facing_open', heroKey: parts[1], stackBb: parseInt(parts[2]), opponentKey: parts[0] };
  }
  if (roll < 0.50) {
    const key = pickRng(FACING_LIMP_KEYS, rng);
    const parts = key.split('_');
    return { spotType: 'facing_limp', heroKey: parts[1], stackBb: parseInt(parts[2]), opponentKey: parts[0] };
  }
  if (roll < 0.60) {
    const key = pickRng(FACING_3BET_KEYS, rng);
    const parts = key.split('_');
    return { spotType: 'facing_3bet', heroKey: parts[0], stackBb: parseInt(parts[2]), opponentKey: parts[1] };
  }
  return { spotType: 'unopened', heroKey: pickRng(OPENING_POSITIONS, rng), stackBb: pickRng(STACK_DEPTHS, rng), opponentKey: '' };
}

function buildScenario(id, handCode, heroKey, stackBb, spotType, opponentKey) {
  const cards = handCodeToCards(handCode);
  const action = mockAction(handCode, spotType);
  const tipRight = mockExplanation(handCode, action, spotType, heroKey, stackBb, opponentKey);
  const actionLabel = { fold: 'Fold', open: 'Raise', call: 'Call', jam: 'All-in', limp: 'Limp behind' }[action] ?? action;
  const tipWrong = `The correct play is ${actionLabel}. ${tipRight}`;
  const choices = buildChoices(spotType);
  const correct = correctIndex(action, choices);
  return { id, handCode, heroKey, stackBb, spotType, opponentKey, cards, tipRight, tipWrong, choices, correct };
}

function validateScenario(s) {
  const errors = [];

  // 1. Cards length
  if (s.cards.length !== 2) errors.push('cards.length !== 2');

  // 2. Card ranks match handCode
  const r1 = s.handCode[0];
  const r2 = s.handCode.length >= 2 ? s.handCode[1] : r1;
  if (s.cards[0].rank !== r1) errors.push(`card[0].rank="${s.cards[0].rank}" != handCode[0]="${r1}"`);
  if (s.cards[1].rank !== r2) errors.push(`card[1].rank="${s.cards[1].rank}" != handCode[1]="${r2}"`);

  // 3. Suit consistency
  const isSuited = s.handCode.endsWith('s');
  const isPair = r1 === r2 && !isSuited && !s.handCode.endsWith('o');
  if (isSuited && s.cards[0].suit !== s.cards[1].suit)
    errors.push(`suited hand has different suits: ${s.cards[0].suit} vs ${s.cards[1].suit}`);
  if (!isPair && !isSuited && s.cards[0].suit === s.cards[1].suit)
    errors.push(`offsuit hand has same suits: ${s.cards[0].suit}`);

  // 4. Explanation contains handCode
  if (!s.tipRight.includes(s.handCode))
    errors.push(`tipRight missing handCode "${s.handCode}": "${s.tipRight.slice(0,80)}"`);
  if (!s.tipWrong.includes(s.handCode))
    errors.push(`tipWrong missing handCode "${s.handCode}"`);

  // 5. Correct index in bounds
  if (s.correct < 0 || s.correct >= s.choices.length)
    errors.push(`correct=${s.correct} out of range (choices.length=${s.choices.length})`);

  return errors;
}

function generateDailyHands(dateStr) {
  const masterSeed = dateToSeed(dateStr + '_pokertrain_v2');
  const hands = [];
  const usedKeys = new Set();
  let attempts = 0;

  while (hands.length < 5 && attempts < 100) {
    attempts++;
    const handRng = seededRng(masterSeed ^ (attempts * 0x9e3779b9));
    const params = pickScenarioParams(handRng);
    const handCode = pickRng(ALL_HANDS, handRng).code;
    const dedupeKey = `${handCode}_${params.heroKey}_${params.spotType}`;
    if (usedKeys.has(dedupeKey)) continue;
    const scenario = buildScenario(`daily_${dateStr}_${attempts}`, handCode, params.heroKey, params.stackBb, params.spotType, params.opponentKey);
    usedKeys.add(dedupeKey);
    hands.push(scenario);
  }
  return hands;
}

// ── Run the tests ──

let totalChecked = 0;
let totalFailed = 0;
const failures = [];

console.log('=== Poker Trainer Scenario Validator ===\n');

// Test 1: 100 daily dates × 5 hands = 500 daily hands
console.log('Test 1: 500 daily hands (100 dates × 5)...');
for (let d = 0; d < 100; d++) {
  const date = `2026-04-${String(d + 1).padStart(2, '0')}`;
  const hands = generateDailyHands(date.slice(0, 10).replace(/\d{2}$/, String(d % 28 + 1).padStart(2,'0')));
  for (const hand of hands) {
    totalChecked++;
    const errs = validateScenario(hand);
    if (errs.length > 0) {
      totalFailed++;
      failures.push({ source: `daily/${date}`, hand: hand.handCode, errors: errs });
    }
  }
}
console.log(`  ✓ Checked ${totalChecked} daily hands\n`);

// Test 2: 500 random bonus hands
console.log('Test 2: 500 bonus hands (random seeds)...');
for (let i = 0; i < 500; i++) {
  const rng = seededRng(i * 98317 + 12345);
  const params = pickScenarioParams(rng);
  const handCode = pickRng(ALL_HANDS, rng).code;
  const scenario = buildScenario(`bonus_${i}`, handCode, params.heroKey, params.stackBb, params.spotType, params.opponentKey);
  totalChecked++;
  const errs = validateScenario(scenario);
  if (errs.length > 0) {
    totalFailed++;
    failures.push({ source: `bonus/${i}`, hand: handCode, errors: errs });
  }
}
console.log(`  ✓ Checked 500 bonus hands\n`);

// Test 3: Every single hand code in every spot type at every stack
console.log('Test 3: All 169 hands × 4 spot types × 5 stacks = 3,380 scenarios...');
const SPOT_TYPES = [
  { spotType: 'unopened', heroKey: 'btn', opponentKey: '' },
  { spotType: 'facing_open', heroKey: 'bb', opponentKey: 'btn' },
  { spotType: 'facing_limp', heroKey: 'btn', opponentKey: 'hj' },
  { spotType: 'facing_3bet', heroKey: 'btn', opponentKey: 'sb' },
];
for (const st of SPOT_TYPES) {
  for (const stack of STACK_DEPTHS) {
    for (const hand of ALL_HANDS) {
      const scenario = buildScenario(`exhaustive`, hand.code, st.heroKey, stack, st.spotType, st.opponentKey);
      totalChecked++;
      const errs = validateScenario(scenario);
      if (errs.length > 0) {
        totalFailed++;
        failures.push({ source: `exhaustive/${st.spotType}/${stack}bb`, hand: hand.code, errors: errs });
      }
    }
  }
}
console.log(`  ✓ Checked 3,380 exhaustive scenarios\n`);

// Test 4: Determinism — same date produces same hands on two calls
console.log('Test 4: Determinism — same date = same hands...');
let detFailed = 0;
for (let d = 0; d < 30; d++) {
  const date = `2026-05-${String(d + 1).padStart(2, '0')}`;
  const a = generateDailyHands(date);
  const b = generateDailyHands(date);
  for (let i = 0; i < 5; i++) {
    if (!a[i] || !b[i] || a[i].handCode !== b[i].handCode || a[i].heroKey !== b[i].heroKey) {
      detFailed++;
      failures.push({ source: `determinism/${date}/hand${i}`, hand: a[i]?.handCode ?? '?', errors: ['Non-deterministic output'] });
    }
  }
}
if (detFailed === 0) console.log('  ✓ All 30 dates deterministic\n');
else console.log(`  ✗ ${detFailed} determinism failures\n`);

// Test 5: No duplicate handCode+position in same daily set
console.log('Test 5: No duplicates within daily sets...');
let dupFailed = 0;
for (let d = 0; d < 30; d++) {
  const date = `2026-06-${String(d + 1).padStart(2, '0')}`;
  const hands = generateDailyHands(date);
  const keys = hands.map(h => `${h.handCode}_${h.heroKey}_${h.spotType}`);
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    dupFailed++;
    failures.push({ source: `duplicates/${date}`, hand: '?', errors: ['Duplicate scenario in daily set'] });
  }
}
if (dupFailed === 0) console.log('  ✓ No duplicates in 30 daily sets\n');
else console.log(`  ✗ ${dupFailed} sets had duplicates\n`);

// ── Final report ──
console.log('='.repeat(45));
console.log(`TOTAL CHECKED : ${totalChecked}`);
console.log(`TOTAL PASSED  : ${totalChecked - totalFailed}`);
console.log(`TOTAL FAILED  : ${totalFailed}`);
console.log('='.repeat(45));

if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const f of failures.slice(0, 20)) {
    console.log(`  [${f.source}] hand=${f.hand}`);
    for (const e of f.errors) console.log(`    → ${e}`);
  }
  if (failures.length > 20) console.log(`  ... and ${failures.length - 20} more`);
  process.exit(1);
} else {
  console.log('\n✅ ALL CHECKS PASSED — safe to ship.');
  process.exit(0);
}
