'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PokerTableLayout, DecisionButtonGroup } from '@/components/poker-table';
import { MODULES } from '@/lib/data/categories';
import { SimplifiedAction, ResultClass, ACTION_LABELS, LeakCategoryId } from '@/lib/types';
import { scoreResponse } from '@/lib/services/scoring';
import { generateDrillSet, type GeneratedSpot } from '@/lib/services/spot-generator';

const DEFAULT_DRILL_SIZE = 15;
const MAX_DRILL_SIZE = 100;

function DrillSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleId = searchParams.get('module') ?? 'mixed';

  // Read drill size from URL param, then localStorage fallback, then default
  const drillSize = useMemo(() => {
    const urlCount = searchParams.get('count');
    if (urlCount) {
      const parsed = parseInt(urlCount, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_DRILL_SIZE) return parsed;
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('poker-trainer-drill-size');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (parsed > 0 && parsed <= MAX_DRILL_SIZE) return parsed;
        }
      } catch { /* noop */ }
    }
    return DEFAULT_DRILL_SIZE;
  }, [searchParams]);

  // Resolve module to leak category
  const preferredCategory = useMemo<LeakCategoryId | undefined>(() => {
    if (moduleId === 'mixed') return undefined;
    const mod = MODULES.find(m => m.id === moduleId);
    if (mod) return mod.primaryLeakCategory;
    if (Object.values(LeakCategoryId).includes(moduleId as LeakCategoryId)) {
      return moduleId as LeakCategoryId;
    }
    return undefined;
  }, [moduleId]);

  // Generate drill set
  const [drillSet, setDrillSet] = useState<GeneratedSpot[]>(() =>
    generateDrillSet(drillSize, preferredCategory)
  );

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ result: ResultClass; explanation: string; correctAction: string } | null>(null);
  const [done, setDone] = useState(false);

  const current = drillSet[idx];
  const spot = current?.spot;
  const template = current?.template;

  const handleSelect = useCallback((action: SimplifiedAction) => {
    if (!spot) return;
    const result = scoreResponse(spot, action);
    setTotal(p => p + 1);
    if (result.result === ResultClass.CORRECT) setCorrect(p => p + 1);
    setLastResult({
      result: result.result,
      explanation: spot.explanation.plain,
      correctAction: ACTION_LABELS[spot.simplifiedAction],
    });
    setShowFeedback(true);
  }, [spot]);

  const handleNext = useCallback(() => {
    setShowFeedback(false);
    setLastResult(null);
    if (idx + 1 >= drillSet.length) {
      setDone(true);
    } else {
      setIdx(p => p + 1);
    }
  }, [idx, drillSet.length]);

  const handleRestart = useCallback(() => {
    setDrillSet(generateDrillSet(drillSize, preferredCategory));
    setIdx(0);
    setCorrect(0);
    setTotal(0);
    setDone(false);
    setShowFeedback(false);
    setLastResult(null);
  }, [drillSize, preferredCategory]);

  if (done || !spot || !template) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const emoji = pct >= 80 ? '\u{1F3C6}' : pct >= 60 ? '\u{1F4AA}' : '\u{1F4D6}';
    const message = pct >= 80
      ? 'Crushing it. Your reads are sharp.'
      : pct >= 60
        ? 'Solid session. A few leaks to patch up.'
        : 'Good practice. Keep drilling to tighten up.';

    return (
      <div style={{ padding: '40px 16px 100px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Drill Complete</h1>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 4 }}>
          {pct}%
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
          {correct} of {total} correct
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-primary" onClick={handleRestart}>
            New Drill ({drillSize} hands)
          </button>
          <button className="btn-secondary" onClick={() => router.push('/drills')}>
            Back to Drills
          </button>
        </div>
      </div>
    );
  }

  const progress = (idx / drillSet.length) * 100;

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          Hand {idx + 1} of {drillSet.length}
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-correct)', fontWeight: 600 }}>
          {correct}/{total} correct
        </span>
      </div>
      <div className="score-bar-track" style={{ marginBottom: 20 }}>
        <div className="score-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-accent)' }} />
      </div>

      <PokerTableLayout
        key={`drill-${idx}-${spot.id}`}
        heroPosition={template.position}
        heroHand={spot.handCode}
        stackDepthBb={template.stackDepthBb}
        actionHistory={template.actionHistory}
      />

      <div style={{ textAlign: 'center', margin: '16px 0 8px', color: 'var(--text-secondary)', fontSize: 14 }}>
        <strong>{spot.handCode}</strong> at <strong>{template.stackDepthBb}bb</strong>
      </div>

      {!showFeedback ? (
        <DecisionButtonGroup onSelect={handleSelect} />
      ) : (
        <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
          <span className={
            lastResult?.result === ResultClass.CORRECT ? 'badge-correct'
            : lastResult?.result === ResultClass.ACCEPTABLE ? 'badge-acceptable'
            : 'badge-leak'
          }>
            {lastResult?.result === ResultClass.CORRECT ? 'Correct!'
            : lastResult?.result === ResultClass.ACCEPTABLE ? 'Acceptable'
            : 'Leak Found'}
          </span>
          {lastResult?.result !== ResultClass.CORRECT && (
            <p style={{ color: 'var(--color-accent)', fontSize: 14, fontWeight: 600, marginTop: 10, marginBottom: 0 }}>
              Best play: {lastResult?.correctAction}
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
            {lastResult?.explanation}
          </p>
          <button className="btn-primary" onClick={handleNext} style={{ marginTop: 16, width: '100%' }}>
            {idx + 1 >= drillSet.length ? 'See Results' : 'Next Hand'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DrillSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading drill...</div>}>
      <DrillSessionContent />
    </Suspense>
  );
}
