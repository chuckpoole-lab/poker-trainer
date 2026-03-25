'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FOUNDATIONS_QUESTIONS } from '@/lib/data/foundations';
import type { ConceptResponse } from '@/lib/types/models';

export default function FoundationsPage() {
  const router = useRouter();
  const questions = FOUNDATIONS_QUESTIONS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<ConceptResponse[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = questions[currentIdx];
  const totalQuestions = questions.length;
  const progress = (currentIdx / totalQuestions) * 100;
  const isCorrect = selectedIndex === question.correctIndex;

  // Group label based on category
  const categoryLabel: Record<string, string> = {
    positions: 'Position Knowledge',
    terminology: 'Poker Terminology',
    strategy: 'General Strategy',
  };

  const handleSelect = useCallback((idx: number) => {
    if (showFeedback) return; // prevent double-tap
    setSelectedIndex(idx);
    const correct = idx === question.correctIndex;
    setResponses(prev => [...prev, {
      questionId: question.id,
      selectedIndex: idx,
      correct,
    }]);
    setShowFeedback(true);
  }, [question, showFeedback]);

  const handleNext = useCallback(() => {
    setShowFeedback(false);
    setSelectedIndex(null);
    if (currentIdx + 1 >= totalQuestions) {
      // Show completion summary
      const score = responses.filter(r => r.correct).length;
      const encoded = encodeURIComponent(JSON.stringify({ score, total: totalQuestions }));
      router.push(`/learn?completed=foundations&score=${encoded}`);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, totalQuestions, responses, router]);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => router.push('/learn')}
          style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', padding: 0, marginBottom: 8 }}
        >
          ← Back to Learn
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Poker Foundations
        </h1>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            Question {currentIdx + 1} of {totalQuestions}
          </span>
          <span style={{
            fontSize: 12, color: 'var(--color-accent)',
            background: 'rgba(56,189,248,0.12)', padding: '2px 8px', borderRadius: 6,
          }}>
            {categoryLabel[question.category] || question.category}
          </span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-accent)' }} />
        </div>
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 16, fontWeight: 700, lineHeight: 1.5,
          color: 'var(--text-primary)', margin: '0 0 20px',
        }}>
          {question.question}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((option, idx) => {
            let borderColor = 'var(--border-card)';
            let bgColor = 'var(--bg-elevated)';
            let textColor = 'var(--text-secondary)';

            if (showFeedback) {
              if (idx === question.correctIndex) {
                borderColor = '#22c55e';
                bgColor = 'rgba(34,197,94,0.12)';
                textColor = '#22c55e';
              } else if (idx === selectedIndex && !isCorrect) {
                borderColor = '#ef4444';
                bgColor = 'rgba(239,68,68,0.12)';
                textColor = '#ef4444';
              }
            } else if (idx === selectedIndex) {
              borderColor = 'var(--color-accent)';
              bgColor = 'rgba(56,189,248,0.12)';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showFeedback}
                style={{
                  padding: '12px 14px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: 10,
                  background: bgColor,
                  color: textColor,
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'left',
                  lineHeight: 1.5,
                  cursor: showFeedback ? 'default' : 'pointer',
                  opacity: showFeedback && idx !== question.correctIndex && idx !== selectedIndex ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="card" style={{ textAlign: 'center' }}>
          <span className={isCorrect ? 'badge-correct' : 'badge-leak'}>
            {isCorrect ? 'Correct!' : 'Not Quite'}
          </span>
          <p style={{
            color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 12,
          }}>
            {question.explanation}
          </p>
          <button className="btn-primary" onClick={handleNext} style={{ marginTop: 16, width: '100%' }}>
            {currentIdx + 1 >= totalQuestions ? 'Complete Foundations' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
