'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PokerTableLayout, ActionBar, FeedbackCard, SpotContextBar } from '@/components/poker-table';
import { ProgressBar, StepCard, Badge } from '@/components/ui';
import { ASSESSMENT_SPOTS, getTemplate } from '@/lib/data/assessment-spots';
import { SimplifiedAction, ResultClass, ACTION_LABELS } from '@/lib/types';
import type { AssessmentResponse } from '@/lib/types';
import { scoreResponse } from '@/lib/services/scoring';
import { getActionExplanation } from '@/lib/data/action-explanations';

/* ── Onboarding step content ── */
function ReadyStep() {
  return (
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
      <p style={{ margin: '0 0 var(--space-4)', textAlign: 'center' }}>
        The assessment tests your decision-making across 20 hands.
        If you haven&apos;t completed the <strong style={{ color: 'var(--primary)' }}>Learn</strong> section
        yet, we recommend starting there first.
      </p>
    </div>
  );
}

function GuideStep() {
  const items: { label: string; desc: string }[] = [
    { label: 'UTG', desc: 'Under the Gun (first to act)' },
    { label: 'UTG+1', desc: 'Under the Gun +1' },
    { label: 'MP',  desc: 'Middle Position' },
    { label: 'LJ',  desc: 'Lojack' },
    { label: 'HJ',  desc: 'Hijack' },
    { label: 'CO',  desc: 'Cutoff' },
    { label: 'BTN', desc: 'Button (dealer, best position)' },
    { label: 'SB / BB', desc: 'Small & Big Blind' },
  ];

  return (
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
      {/* positions */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--surface-high)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-3)',
      }}>
        <strong style={{ color: 'var(--on-surface)', fontSize: 'var(--text-sm)' }}>
          Positions (clockwise):
        </strong>
        <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(({ label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Badge variant="neutral" size="sm">{label}</Badge>
              <span style={{ fontSize: 'var(--text-xs)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* reading the table */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--surface-high)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-3)',
      }}>
        <strong style={{ color: 'var(--on-surface)', fontSize: 'var(--text-sm)' }}>
          Reading the table:
        </strong>
        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--color-leak)' }}>━</span> Red line = folded
          <br />
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>R</span> Gold chip = raised
          <br />
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>●</span> Green seat = you (hero)
        </div>
      </div>

      {/* instructions */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--surface-high)',
        borderRadius: 'var(--radius-md)',
      }}>
        <strong style={{ color: 'var(--on-surface)', fontSize: 'var(--text-sm)' }}>Your job:</strong>
        <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)' }}>
          Look at your cards, position, and stack size. Then pick the best action.
          The buttons will show only the moves that make sense for each situation.
        </p>
      </div>
    </div>
  );
}

const ONBOARDING_STEPS = [
  { title: 'Ready for the Assessment?', content: <ReadyStep /> },
  { title: 'Before You Start', content: <GuideStep /> },
];

/* ── Main assessment page ── */
export default function AssessmentPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ result: ResultClass; explanation: string; correctAction: string; whyExplanation: string } | null>(null);

  const spot = ASSESSMENT_SPOTS[currentIdx];
  const template = getTemplate(spot.spotTemplateId)!;
  const totalSpots = ASSESSMENT_SPOTS.length;
  const progress = (currentIdx / totalSpots) * 100;

  const handleSelect = useCallback((action: SimplifiedAction) => {
    const result = scoreResponse(spot, action);
    const response: AssessmentResponse = {
      spotId: spot.id,
      userAction: action,
      result: result.result,
      score: result.score,
    };

    setResponses(prev => [...prev, response]);
    setLastResult({
      result: result.result,
      explanation: spot.explanation.plain,
      correctAction: ACTION_LABELS[spot.simplifiedAction],
      whyExplanation: getActionExplanation(spot, template, action),
    });
    setShowFeedback(true);
  }, [spot]);

  const handleNext = useCallback(() => {
    setShowFeedback(false);
    setLastResult(null);

    if (currentIdx + 1 >= totalSpots) {
      const encoded = encodeURIComponent(JSON.stringify(responses));
      router.push(`/results?data=${encoded}`);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, totalSpots, responses, router]);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Exit button */}
      <button onClick={() => router.push('/')} style={{
        background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
        color: 'var(--muted)', cursor: 'pointer', padding: '4px 0', marginBottom: 12,
        fontFamily: 'var(--font-body)',
      }}>
        &larr; Exit assessment
      </button>

      {/* Onboarding — single StepCard replaces two separate modals */}
      {showOnboarding && (
        <StepCard
          steps={ONBOARDING_STEPS}
          onComplete={() => setShowOnboarding(false)}
          completeLabel="Got It, Let's Go"
          onSkip={() => setShowOnboarding(false)}
          skipLabel="Skip intro"
        />
      )}

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Spot {currentIdx + 1} of {totalSpots}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={progress} color="var(--primary)" height={6} />
      </div>

      {/* Table */}
      <PokerTableLayout
        key={spot.id}
        heroPosition={template.position}
        heroHand={spot.handCode}
        stackDepthBb={template.stackDepthBb}
        actionHistory={template.actionHistory}
      />

      {/* Spot context */}
      <SpotContextBar
        handCode={spot.handCode}
        stackDepthBb={template.stackDepthBb}
        prompt={!showFeedback ? 'What is your play?' : undefined}
      />

      {/* Decision or Feedback */}
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
          nextLabel={currentIdx + 1 >= totalSpots ? 'See Results' : 'Next Spot'}
          onNext={handleNext}
        />
      ) : null}
    </div>
  );
}
