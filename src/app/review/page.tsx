'use client';

import { useRouter } from 'next/navigation';
import { ASSESSMENT_SPOTS, getTemplate } from '@/lib/data/assessment-spots';
import { ACTION_LABELS, ResultClass } from '@/lib/types';

export default function ReviewPage() {
  const router = useRouter();

  // In a full app this would read from stored assessment results.
  // For V1 we show all spots with their correct answers as a study reference.
  const spots = ASSESSMENT_SPOTS;

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Spot Review</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Review each assessment spot with the correct answer and explanation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {spots.map((spot, i) => {
          const tpl = getTemplate(spot.spotTemplateId)!;
          return (
            <div key={spot.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginRight: 8 }}>
                    #{i + 1}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{spot.handCode}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {tpl.position.toUpperCase()} &middot; {tpl.stackDepthBb}bb
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="badge-correct">
                  Best: {ACTION_LABELS[spot.simplifiedAction]}
                </span>
                {spot.acceptableActions.length > 0 && (
                  <span className="badge-acceptable">
                    Also OK: {spot.acceptableActions.map(a => ACTION_LABELS[a]).join(', ')}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {spot.explanation.poker}
              </p>
            </div>
          );
        })}
      </div>

      <button
        className="btn-secondary"
        onClick={() => router.push('/assessment')}
        style={{ width: '100%', marginTop: 20 }}
      >
        Retake Assessment
      </button>
    </div>
  );
}
