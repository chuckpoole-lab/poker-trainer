'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useRef } from 'react';
import { ASSESSMENT_SPOTS } from '@/lib/data/assessment-spots';
import { LEAK_CATEGORIES } from '@/lib/data/categories';
import { calculateLeakScores } from '@/lib/services/scoring';
import { saveAssessmentResult } from '@/lib/services/progress-storage';
import { ScoreBand } from '@/lib/types';
import type { AssessmentResponse, LeakScore } from '@/lib/types';
import { DonutChart, Card, Badge, ProgressBar, Button } from '@/components/ui';

const BAND_COLORS: Record<ScoreBand, string> = {
  [ScoreBand.STRONG]: 'var(--color-correct)',
  [ScoreBand.NEEDS_WORK]: 'var(--color-acceptable)',
  [ScoreBand.CRITICAL_LEAK]: 'var(--color-leak)',
};

const BAND_LABELS: Record<ScoreBand, string> = {
  [ScoreBand.STRONG]: 'Strong',
  [ScoreBand.NEEDS_WORK]: 'Needs Work',
  [ScoreBand.CRITICAL_LEAK]: 'Critical Leak',
};

const BAND_BADGE: Record<ScoreBand, 'correct' | 'acceptable' | 'leak'> = {
  [ScoreBand.STRONG]: 'correct',
  [ScoreBand.NEEDS_WORK]: 'acceptable',
  [ScoreBand.CRITICAL_LEAK]: 'leak',
};

/** Sort severity: critical > needs work > strong */
const BAND_PRIORITY: Record<ScoreBand, number> = {
  [ScoreBand.CRITICAL_LEAK]: 0,
  [ScoreBand.NEEDS_WORK]: 1,
  [ScoreBand.STRONG]: 2,
};

function sortBySeverity(scores: LeakScore[]): LeakScore[] {
  return [...scores].sort((a, b) => BAND_PRIORITY[a.band] - BAND_PRIORITY[b.band]);
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get('data');
  const savedRef = useRef(false);

  if (!raw) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>No assessment data found.</p>
        <Button variant="primary" onClick={() => router.push('/assessment')} style={{ marginTop: 16 }}>
          Take Assessment
        </Button>
      </div>
    );
  }

  let responses: AssessmentResponse[];
  try {
    responses = JSON.parse(decodeURIComponent(raw));
  } catch {
    responses = [];
  }

  const leakScores = calculateLeakScores(responses, ASSESSMENT_SPOTS, LEAK_CATEGORIES);
  const sorted = sortBySeverity(leakScores);
  const overall = responses.length > 0
    ? Math.round(responses.reduce((s, r) => s + r.score, 0) / responses.length * 100)
    : 0;

  // Persist assessment results (once per page load)
  if (responses.length > 0 && !savedRef.current) {
    savedRef.current = true;
    saveAssessmentResult(responses, leakScores, overall);
  }

  const donutColor = overall >= 80
    ? 'var(--color-correct)'
    : overall >= 60
      ? 'var(--color-acceptable)'
      : 'var(--color-leak)';

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 800,
        marginBottom: 4,
        fontFamily: 'var(--font-display)',
        color: 'var(--on-surface)',
      }}>
        Assessment Results
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 24, fontFamily: 'var(--font-body)' }}>
        {responses.length} spots completed
      </p>

      {/* Overall score — DonutChart hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <DonutChart
          value={overall}
          color={donutColor}
          size={170}
          strokeWidth={14}
          subLabel="Overall Score"
        />
      </div>

      {/* Leak breakdown — sorted by severity */}
      <h2 style={{
        fontSize: 'var(--text-base)',
        fontWeight: 700,
        marginBottom: 12,
        color: 'var(--on-surface)',
        fontFamily: 'var(--font-body)',
      }}>
        Leak Breakdown
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((ls) => (
          <Card key={ls.categoryId} accent={BAND_BADGE[ls.band]} elevation="raised" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-body)',
              }}>
                {ls.displayName}
              </span>
              <Badge variant={BAND_BADGE[ls.band]} size="sm">
                {BAND_LABELS[ls.band]}
              </Badge>
            </div>
            <ProgressBar
              value={Math.round(ls.score * 100)}
              color={BAND_COLORS[ls.band]}
              height={6}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                {ls.spotCount} spot{ls.spotCount !== 1 ? 's' : ''} tested
              </span>
              {ls.band !== ScoreBand.STRONG && (
                <button
                  onClick={() => router.push(`/drills/session?module=${ls.categoryId}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 0',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Drill This →
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button variant="primary" onClick={() => router.push('/study-plan')} style={{ flex: 1 }}>
          View Study Plan
        </Button>
        <Button variant="secondary" onClick={() => router.push('/review')} style={{ flex: 1 }}>
          Review Spots
        </Button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        Loading results...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
