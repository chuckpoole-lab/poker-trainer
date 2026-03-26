'use client';

import { useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PokerTableLayout, ActionBar, FeedbackCard, SpotContextBar } from '@/components/poker-table';
import { ProgressBar, Button } from '@/components/ui';
import { MODULES } from '@/lib/data/categories';
import { SimplifiedAction, ResultClass, ACTION_LABELS, LeakCategoryId } from '@/lib/types';
import { scoreResponse } from '@/lib/services/scoring';
import { generateDrillSet, type GeneratedSpot } from '@/lib/services/spot-generator';
import { saveDrillResult } from '@/lib/services/progress-storage';
import { saveDrillToCloud } from '@/lib/services/cloud-storage';
import { useAuth } from '@/lib/services/auth-context';
import { getActionExplanation } from '@/lib/data/action-explanations';

const DEFAULT_DRILL_SIZE = 15;
const MAX_DRILL_SIZE = 100;

function DrillSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = searchParams.get('module') ?? 'mixed';

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

  const preferredCategory = useMemo<LeakCategoryId | undefined>(() => {
    if (moduleId === 'mixed') return undefined;
    const mod = MODULES.find(m => m.id === moduleId);
    if (mod) return mod.primaryLeakCategory;
    if (Object.values(LeakCategoryId).includes(moduleId as LeakCategoryId)) {
      return moduleId as LeakCategoryId;
    }
    return undefined;
  }, [moduleId]);

  const [drillSet, setDrillSet] = useState<GeneratedSpot[]>(() =>
    generateDrillSet(drillSize, preferredCategory)
  );

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ result: ResultClass; explanation: string; correctAction: string; whyExplanation: string } | null>(null);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false); // prevent double-saving

  const current = drillSet[idx];
  const spot = current?.spot;
  const template = current?.template;

  const handleSelect = useCallback((action: SimplifiedAction) => {
    if (!spot) return;
    const result = scoreResponse(spot, action);
    const newTotal = total + 1;
    const newCorrect = result.result === ResultClass.CORRECT ? correct + 1 : correct;
    setTotal(newTotal);
    setCorrect(newCorrect);
    setLastResult({
      result: result.result,
      explanation: spot.explanation.plain,
      correctAction: ACTION_LABELS[spot.simplifiedAction],
      whyExplanation: getActionExplanation(spot, template, action),
    });
    setShowFeedback(true);

    // Save when this is the last hand
    if (idx + 1 >= drillSet.length && !savedRef.current) {
      savedRef.current = true;
      saveDrillResult(moduleId, newCorrect, newTotal);
      // Also save to cloud if signed in
      if (user) {
        saveDrillToCloud(user.id, moduleId, newCorrect, newTotal);
      }
    }
  }, [spot, total, correct, idx, drillSet.length, moduleId]);

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
    savedRef.current = false;
  }, [drillSize, preferredCategory]);

  /* ── Drill complete screen ── */
  if (done || !spot || !template) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const message = pct >= 80
      ? 'Crushing it. Your reads are sharp.'
      : pct >= 60
        ? 'Solid session. A few leaks to patch up.'
        : 'Good practice. Keep drilling to tighten up.';

    return (
      <div style={{ padding: '40px 16px 100px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: pct >= 80 ? 'var(--color-correct)' : pct >= 60 ? 'var(--color-acceptable)' : 'var(--color-leak)',
          fontFamily: 'var(--font-display)',
          marginBottom: 8,
        }}>
          {pct}%
        </div>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          marginBottom: 8,
          fontFamily: 'var(--font-display)',
          color: 'var(--on-surface)',
        }}>
          Drill Complete
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
          {correct} of {total} correct
        </p>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="primary" onClick={handleRestart}>
            New Drill ({drillSize} hands)
          </Button>
          <Button variant="secondary" onClick={() => router.push('/drills')}>
            Back to Drills
          </Button>
        </div>
      </div>
    );
  }

  /* ── Active drill screen ── */
  const progress = (idx / drillSet.length) * 100;

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Progress header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          Hand {idx + 1} of {drillSet.length}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-correct)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          {correct}/{total} correct
        </span>
      </div>
      <ProgressBar value={progress} color="var(--primary)" height={6} />

      {/* Table */}
      <div style={{ marginTop: 20 }}>
        <PokerTableLayout
          key={`drill-${idx}-${spot.id}`}
          heroPosition={template.position}
          heroHand={spot.handCode}
          stackDepthBb={template.stackDepthBb}
          actionHistory={template.actionHistory}
        />
      </div>

      {/* Hand + stack context */}
      <SpotContextBar
        handCode={spot.handCode}
        stackDepthBb={template.stackDepthBb}
        prompt={!showFeedback ? 'What is your play?' : undefined}
      />

      {/* Decision buttons or feedback */}
      {!showFeedback ? (
        <ActionBar
          spotType={template.spotType}
          onSelect={handleSelect}
        />
      ) : lastResult ? (
        <FeedbackCard
          result={lastResult.result}
          correctAction={lastResult.correctAction}
          explanation={lastResult.explanation}
          whyExplanation={lastResult.whyExplanation}
          nextLabel={idx + 1 >= drillSet.length ? 'See Results' : 'Next Hand'}
          onNext={handleNext}
        />
      ) : null}
    </div>
  );
}

export default function DrillSessionPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        Loading drill...
      </div>
    }>
      <DrillSessionContent />
    </Suspense>
  );
}
