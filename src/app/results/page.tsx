'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ASSESSMENT_SPOTS } from '@/lib/data/assessment-spots';
import { LEAK_CATEGORIES } from '@/lib/data/categories';
import { calculateLeakScores } from '@/lib/services/scoring';
import { ScoreBand } from '@/lib/types';
import type { AssessmentResponse } from '@/lib/types';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get('data');

  if (!raw) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No assessment data found.</p>
        <button className="btn-primary" onClick={() => router.push('/assessment')} style={{ marginTop: 16 }}>
          Take Assessment
        </button>
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
  const overall = responses.length > 0
    ? Math.round(responses.reduce((s, r) => s + r.score, 0) / responses.length * 100)
    : 0;

  const bandColor = (band: ScoreBand) =>
    band === ScoreBand.STRONG ? 'var(--color-correct)'
    : band === ScoreBand.NEEDS_WORK ? 'var(--color-acceptable)'
    : 'var(--color-leak)';

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Assessment Results</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        {responses.length} spots completed
      </p>

      {/* Overall score */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--color-accent)' }}>{overall}%</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Overall Score</div>
      </div>

      {/* Leak breakdown */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Leak Breakdown</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {leakScores.map((ls) => (
          <div key={ls.categoryId} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{ls.displayName}</span>
              <span className={
                ls.band === ScoreBand.STRONG ? 'badge-correct'
                : ls.band === ScoreBand.NEEDS_WORK ? 'badge-acceptable'
                : 'badge-leak'
              }>
                {ls.band === ScoreBand.STRONG ? 'Strong' : ls.band === ScoreBand.NEEDS_WORK ? 'Needs Work' : 'Critical Leak'}
              </span>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{
                width: `${Math.round(ls.score * 100)}%`,
                background: bandColor(ls.band),
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {ls.spotCount} spot{ls.spotCount !== 1 ? 's' : ''} tested
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn-primary" onClick={() => router.push('/study-plan')} style={{ flex: 1 }}>
          View Study Plan
        </button>
        <button className="btn-secondary" onClick={() => router.push('/review')} style={{ flex: 1 }}>
          Review Spots
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
