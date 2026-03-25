'use client';

import { useState, useEffect } from 'react';
import { ComplexityMode } from '@/lib/types';

const DRILL_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50];
const DEFAULT_DRILL_SIZE = 15;

export default function SettingsPage() {
  const [mode, setMode] = useState<ComplexityMode>(ComplexityMode.CORE);
  const [showPoker, setShowPoker] = useState(true);
  const [showPlain, setShowPlain] = useState(true);
  const [showExploit, setShowExploit] = useState(false);
  const [drillSize, setDrillSize] = useState<number>(DEFAULT_DRILL_SIZE);

  // Load saved drill size on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('poker-trainer-drill-size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (DRILL_SIZE_OPTIONS.includes(parsed)) setDrillSize(parsed);
      }
    } catch { /* SSR or storage unavailable */ }
  }, []);

  // Persist drill size changes
  const handleDrillSizeChange = (size: number) => {
    setDrillSize(size);
    try { localStorage.setItem('poker-trainer-drill-size', String(size)); } catch { /* noop */ }
  };

  const modes = [
    { value: ComplexityMode.CORE, label: 'Core', desc: 'Simplified decisions for tournament fundamentals' },
    { value: ComplexityMode.COACH, label: 'Coach', desc: 'Adds context and nuance to each decision' },
    { value: ComplexityMode.ADVANCED, label: 'Advanced', desc: 'Full solver-level detail and exploit notes' },
  ];

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Customize your training experience.
      </p>

      {/* Drill Length */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Drill Length</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
        Number of hands per drill session.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {DRILL_SIZE_OPTIONS.map(size => (
          <button
            key={size}
            onClick={() => handleDrillSizeChange(size)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              minWidth: 56,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: drillSize === size
                ? '2px solid var(--color-accent)'
                : '1px solid var(--border-card)',
              background: drillSize === size ? 'var(--color-accent)' : 'var(--bg-card)',
              color: drillSize === size ? '#fff' : 'var(--text-primary)',
            }}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Complexity mode */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Complexity Mode</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {modes.map(m => (
          <button
            key={m.value}
            className="card"
            onClick={() => setMode(m.value)}
            style={{
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              border: mode === m.value
                ? '2px solid var(--color-accent)'
                : '1px solid var(--border-card)',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{m.label}</span>
              {mode === m.value && (
                <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 700 }}>ACTIVE</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Explanation toggles */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Explanations</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Plain English', desc: 'Simple explanations anyone can follow', value: showPlain, set: setShowPlain },
          { label: 'Poker Strategy', desc: 'Standard poker terminology and reasoning', value: showPoker, set: setShowPoker },
          { label: 'Exploit Notes', desc: 'Notes on when to deviate from baseline', value: showExploit, set: setShowExploit },
        ].map((toggle, i) => (
          <div key={i} className="card" style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{toggle.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{toggle.desc}</div>
            </div>
            <button
              onClick={() => toggle.set(!toggle.value)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: toggle.value ? 'var(--color-accent)' : 'var(--bg-elevated)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: toggle.value ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="card" style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Poker Trainer v1.0</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>MTT Decision Training</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Built for live tournament players who want to make better decisions at the table.
        </div>
      </div>
    </div>
  );
}
