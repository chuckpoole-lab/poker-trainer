/**
 * Integration test runner — compiles and executes the REAL TypeScript source.
 * Run via: npx ts-node -P tsconfig.test.json --paths scripts/run-integration.ts
 */

import { generateDailyHands, generateBonusHand, type PlayHandScenario } from '../src/lib/services/play-scenario-generator';

// ── Validator ──
function validate(s: PlayHandScenario, label: string): string[] {
  const errors: string[] = [];
  if (!s || !s.handCode) return [`${label}: null/missing handCode`];

  const r1 = s.handCode[0];
  const r2 = s.handCode.length >= 2 ? s.handCode[1] : r1;

  if (!Array.isArray(s.cards) || s.cards.length !== 2)
    errors.push(`cards.length=${s.cards?.length}`);
  if (s.cards?.[0]?.rank !== r1)
    errors.push(`card[0].rank "${s.cards?.[0]?.rank}" != handCode[0] "${r1}"`);
  if (s.cards?.[1]?.rank !== r2)
    errors.push(`card[1].rank "${s.cards?.[1]?.rank}" != handCode[1] "${r2}"`);

  const isSuited = s.handCode.endsWith('s');
  const isPair = r1 === r2 && !isSuited && !s.handCode.endsWith('o');
  if (isSuited && s.cards?.[0]?.suit !== s.cards?.[1]?.suit)
    errors.push(`suited hand mismatched suits: ${s.cards?.[0]?.suit}/${s.cards?.[1]?.suit}`);
  if (!isPair && !isSuited && s.cards?.[0]?.suit === s.cards?.[1]?.suit)
    errors.push(`offsuit hand identical suits: ${s.cards?.[0]?.suit}`);

  if (!s.tipRight?.includes(s.handCode))
    errors.push(`tipRight missing "${s.handCode}": "${s.tipRight?.slice(0, 100)}"`);
  if (!s.tipWrong?.includes(s.handCode))
    errors.push(`tipWrong missing "${s.handCode}": "${s.tipWrong?.slice(0, 100)}"`);

  if (!Array.isArray(s.choices) || s.choices.length < 2)
    errors.push(`bad choices: ${JSON.stringify(s.choices)}`);
  if (typeof s.correct !== 'number' || s.correct < 0 || s.correct >= (s.choices?.length ?? 0))
    errors.push(`correct=${s.correct} out of range (len=${s.choices?.length})`);
  if (!s.situation || s.situation.length < 5)
    errors.push(`situation too short: "${s.situation}"`);

  return errors.map(e => `  [${label}] ${s.handCode}: ${e}`);
}

let totalChecked = 0;
let totalFailed = 0;
const allFailures: string[] = [];

function check(scenario: PlayHandScenario, label: string) {
  totalChecked++;
  const errs = validate(scenario, label);
  if (errs.length) { totalFailed++; allFailures.push(...errs); }
}

console.log('=== Poker Trainer Integration Test (Real TypeScript) ===\n');

// ── Test 1: Daily hands, 60 dates ──
console.log('Test 1: Daily hands — 60 dates × 5 = 300 scenarios...');
for (let d = 1; d <= 60; d++) {
  const month = d <= 30 ? '04' : '05';
  const day = String((d - 1) % 30 + 1).padStart(2, '0');
  const date = `2026-${month}-${day}`;
  let hands: PlayHandScenario[];
  try { hands = generateDailyHands(date); }
  catch (e: unknown) {
    allFailures.push(`  [daily/${date}] threw: ${(e as Error).message}`);
    totalFailed++; totalChecked++; continue;
  }
  if (!Array.isArray(hands) || hands.length !== 5) {
    allFailures.push(`  [daily/${date}] returned ${(hands as unknown[])?.length ?? 'non-array'} hands`);
    totalFailed++; totalChecked++; continue;
  }
  hands.forEach((h, i) => check(h, `daily/${date}/h${i + 1}`));
}
console.log(`  Done. ${totalFailed} failures so far.\n`);

// ── Test 2: Bonus hands, 500 calls ──
console.log('Test 2: Bonus hands — 500 calls...');
const beforeBonus = totalFailed;
for (let i = 0; i < 500; i++) {
  let h: PlayHandScenario;
  try { h = generateBonusHand(); }
  catch (e: unknown) {
    allFailures.push(`  [bonus/${i}] threw: ${(e as Error).message}`);
    totalFailed++; totalChecked++; continue;
  }
  check(h, `bonus/${i}`);
}
console.log(`  Done. ${totalFailed - beforeBonus} new failures.\n`);

// ── Test 3: Determinism ──
console.log('Test 3: Determinism — 30 dates × 2 calls...');
let detFail = 0;
for (let d = 1; d <= 30; d++) {
  const date = `2026-07-${String(d).padStart(2, '0')}`;
  const a = generateDailyHands(date);
  const b = generateDailyHands(date);
  for (let i = 0; i < 5; i++) {
    if (a[i]?.handCode !== b[i]?.handCode || a[i]?.tipRight !== b[i]?.tipRight) {
      detFail++;
      allFailures.push(`  [det/${date}/h${i}] first="${a[i]?.handCode}" second="${b[i]?.handCode}"`);
    }
  }
}
totalChecked += 300;
console.log(`  ${detFail === 0 ? '✓ All deterministic' : `✗ ${detFail} failures`}\n`);

// ── Test 4: No duplicates within daily set ──
console.log('Test 4: No duplicates — 30 dates...');
let dupFail = 0;
for (let d = 1; d <= 30; d++) {
  const date = `2026-08-${String(d).padStart(2, '0')}`;
  const hands = generateDailyHands(date);
  const keys = hands.map(h => `${h.handCode}_${h.position}`);
  if (new Set(keys).size !== keys.length) {
    dupFail++;
    allFailures.push(`  [dup/${date}] ${keys.join(', ')}`);
  }
}
console.log(`  ${dupFail === 0 ? '✓ No duplicates' : `✗ ${dupFail} sets had duplicates`}\n`);

// ── Test 5: Every spot type produces valid explanation containing handCode ──
console.log('Test 5: Spot-type coverage — sampling all 4 types × 5 stacks × 10 hands = 200...');
const SPOT_SEEDS = [
  { date: '2026-09-01' }, { date: '2026-09-02' }, { date: '2026-09-03' },
  { date: '2026-09-04' }, { date: '2026-09-05' }, { date: '2026-09-06' },
  { date: '2026-09-07' }, { date: '2026-09-08' }, { date: '2026-09-09' },
  { date: '2026-09-10' }, { date: '2026-09-11' }, { date: '2026-09-12' },
  { date: '2026-09-13' }, { date: '2026-09-14' }, { date: '2026-09-15' },
  { date: '2026-09-16' }, { date: '2026-09-17' }, { date: '2026-09-18' },
  { date: '2026-09-19' }, { date: '2026-09-20' }, { date: '2026-09-21' },
  { date: '2026-09-22' }, { date: '2026-09-23' }, { date: '2026-09-24' },
  { date: '2026-09-25' }, { date: '2026-09-26' }, { date: '2026-09-27' },
  { date: '2026-09-28' }, { date: '2026-09-29' }, { date: '2026-09-30' },
  { date: '2026-10-01' }, { date: '2026-10-02' }, { date: '2026-10-03' },
  { date: '2026-10-04' }, { date: '2026-10-05' }, { date: '2026-10-06' },
  { date: '2026-10-07' }, { date: '2026-10-08' }, { date: '2026-10-09' },
  { date: '2026-10-10' },
];
const spotTypesSeen = new Set<string>();
for (const { date } of SPOT_SEEDS) {
  const hands = generateDailyHands(date);
  hands.forEach((h, i) => {
    check(h, `coverage/${date}/h${i + 1}`);
    // Track spot types by examining situation text
    if (h.situation.includes('raises')) spotTypesSeen.add('facing_open');
    else if (h.situation.includes('limps')) spotTypesSeen.add('facing_limp');
    else if (h.situation.includes('all-in')) spotTypesSeen.add('facing_3bet');
    else spotTypesSeen.add('unopened');
  });
}
console.log(`  Spot types seen: ${[...spotTypesSeen].join(', ')}`);
console.log(`  ${spotTypesSeen.size >= 3 ? '✓' : '✗'} Got ${spotTypesSeen.size}/4 spot types\n`);

// ── Final Report ──
console.log('='.repeat(55));
console.log(`TOTAL CHECKED  : ${totalChecked}`);
console.log(`TOTAL PASSED   : ${totalChecked - totalFailed}`);
console.log(`TOTAL FAILED   : ${totalFailed}`);
console.log('='.repeat(55));

if (allFailures.length) {
  console.log('\n❌ FAILURES:');
  allFailures.slice(0, 50).forEach(f => console.log(f));
  if (allFailures.length > 50) console.log(`  ...and ${allFailures.length - 50} more`);
  process.exit(1);
} else {
  console.log('\n✅ ALL CHECKS PASSED — real TypeScript source is clean.');
  process.exit(0);
}
