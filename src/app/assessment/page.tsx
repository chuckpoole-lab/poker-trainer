'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PokerTableLayout, DecisionButtonGroup } from '@/components/poker-table';
import { ASSESSMENT_SPOTS, getTemplate } from '@/lib/data/assessment-spots';
import { SimplifiedAction, ResultClass, ACTION_LABELS } from '@/lib/types';
import type { AssessmentResponse } from '@/lib/types';
import { scoreResponse } from '@/lib/services/scoring';

function PositionGuideModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 16,
        padding: '28px 24px 24px',
        maxWidth: 380,
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>&#9824;</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Before You Start</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            A quick guide to reading the table.
          </p>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            marginBottom: 12,
          }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Positions (clockwise from first to act):</strong>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 2 }}>
              <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>UTG</span> Under the Gun (first)
              <br />
              <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>HJ</span> Hijack
              <br />
              <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>CO</span> Cutoff
              <br />
              <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>BTN</span> Button (dealer)
              <br />
              <span style={{ display: 'inline-block', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>SB / BB</span> Small &amp; Big Blind
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            marginBottom: 12,
          }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Reading the table:</strong>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.8 }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>&#10005;</span> Red X = player folded
              <br />
              <span style={{ color: '#eab308', fontWeight: 700 }}>R</span> Yellow chip = player raised
              <br />
              <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>&#9679;</span> Blue seat = you (hero)
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
          }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Your job:</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Look at your cards, your position, and the stack size. Then pick your action: <strong>Call</strong>, <strong>Raise</strong>, <strong>All In</strong>, or <strong>Fold</strong>.
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={onDismiss}
          style={{ width: '100%', marginTop: 20, fontSize: 16, padding: '14px 0' }}
        >
          Got It, Let&apos;s Go
        </button>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const [showLearnPrompt, setShowLearnPrompt] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ result: ResultClass; explanation: string; correctAction: string } | null>(null);

  const spot = ASSESSMENT_SPOTS[currentIdx];
  const template = getTemplate(spot.spotTemplateId)!;
  const totalSpots = ASSESSMENT_SPOTS.length;
  const progress = ((currentIdx) / totalSpots) * 100;

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

  const resultBadgeClass = lastResult
    ? lastResult.result === ResultClass.CORRECT ? 'badge-correct'
    : lastResult.result === ResultClass.ACCEPTABLE ? 'badge-acceptable'
    : 'badge-leak'
    : '';

  const resultLabel = lastResult
    ? lastResult.result === ResultClass.CORRECT ? 'Correct!'
    : lastResult.result === ResultClass.ACCEPTABLE ? 'Acceptable'
    : 'Leak Found'
    : '';

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {showLearnPrompt && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-card)',
            borderRadius: 16, padding: '28px 24px 24px', maxWidth: 380, width: '100%',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📖</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ready for the Assessment?</h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 20px' }}>
              The assessment tests your decision-making at the poker table. If you have not yet completed
              the <strong>Learn</strong> section, we recommend starting there first to build a solid foundation
              in positions and strategy.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" onClick={() => router.push('/learn')} style={{ width: '100%' }}>
                Start with Learn
              </button>
              <button onClick={() => { setShowLearnPrompt(false); setShowGuide(true); }}
                style={{ fontSize: 14, color: 'var(--color-accent)', background: 'none', padding: '10px 0', width: '100%' }}>
                I know the basics. Start Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && <PositionGuideModal onDismiss={() => setShowGuide(false)} />}

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            Spot {currentIdx + 1} of {totalSpots}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-accent)' }} />
        </div>
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
      <div style={{ textAlign: 'center', margin: '16px 0 8px', color: 'var(--text-secondary)', fontSize: 14 }}>
        <strong>{spot.handCode}</strong> at <strong>{template.stackDepthBb}bb</strong>
      </div>

      {/* Decision or Feedback */}
      {!showFeedback ? (
        <div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, margin: '8px 0 4px' }}>
            What is your play?
          </p>
          <DecisionButtonGroup onSelect={handleSelect} />
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
          <span className={resultBadgeClass}>{resultLabel}</span>
          {lastResult?.result !== ResultClass.CORRECT && (
            <p style={{ color: 'var(--color-accent)', fontSize: 14, fontWeight: 600, marginTop: 10, marginBottom: 0 }}>
              Best play: {lastResult?.correctAction}
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
            {lastResult?.explanation}
          </p>
          <button className="btn-primary" onClick={handleNext} style={{ marginTop: 16, width: '100%' }}>
            {currentIdx + 1 >= totalSpots ? 'See Results' : 'Next Spot'}
          </button>
        </div>
      )}
    </div>
  );
}
