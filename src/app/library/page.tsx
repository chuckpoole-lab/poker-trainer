'use client';

import { useState } from 'react';
import { ASSESSMENT_SPOTS, getTemplate } from '@/lib/data/assessment-spots';
import { LEAK_CATEGORIES } from '@/lib/data/categories';
import { ACTION_LABELS, LeakCategoryId } from '@/lib/types';

export default function LibraryPage() {
  const [filter, setFilter] = useState<LeakCategoryId | 'all'>('all');

  const filtered = filter === 'all'
    ? ASSESSMENT_SPOTS
    : ASSESSMENT_SPOTS.filter(s => s.leakCategory === filter);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Spot Library</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
        Browse all spots and their explanations.
      </p>

      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        <button
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('all')}
          style={{ padding: '6px 14px', fontSize: 13 }}
        >
          All
        </button>
        {LEAK_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={filter === cat.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter(cat.id)}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            {cat.displayName}
          </button>
        ))}
      </div>

      {/* Spot cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(spot => {
          const tpl = getTemplate(spot.spotTemplateId)!;
          const cat = LEAK_CATEGORIES.find(c => c.id === spot.leakCategory);
          return (
            <details key={spot.id} className="card" style={{ padding: 0, cursor: 'pointer' }}>
              <summary style={{
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                listStyle: 'none',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16, marginRight: 8 }}>{spot.handCode}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {tpl.position.toUpperCase()} &middot; {tpl.stackDepthBb}bb
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>
                  {ACTION_LABELS[spot.simplifiedAction]}
                </span>
              </summary>
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 8 }}>
                  {cat?.displayName} &middot; {spot.difficultyBand}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                  {spot.explanation.plain}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  {spot.explanation.pattern}
                </p>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
