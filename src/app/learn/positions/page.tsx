'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { POSITION_LESSONS } from '@/lib/data/foundations';
import type { ConceptResponse } from '@/lib/types/models';

function PositionLessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const group = searchParams.get('group') || 'early';

  const lesson = useMemo(
    () => POSITION_LESSONS.find(l => l.positionGroup === group) || POSITION_LESSONS[0],
    [group]
  );

  const [phase, setPhase] = useState<'lesson' | 'quiz' | 'done'>('lesson');
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [responses, setResponses] = useState<ConceptResponse[]>([]);

  const question = lesson.quizQuestions[quizIdx];
  const isCorrect = selectedIndex === question?.correctIndex;

  const handleQuizSelect = useCallback((idx: number) => {
    if (showFeedback || !question) return;
    setSelectedIndex(idx);
    setResponses(prev => [...prev, {
      questionId: question.id,
      selectedIndex: idx,
      correct: idx === question.correctIndex,
    }]);
    setShowFeedback(true);
  }, [question, showFeedback]);

  const handleQuizNext = useCallback(() => {
    setShowFeedback(false);
    setSelectedIndex(null);
    if (quizIdx + 1 >= lesson.quizQuestions.length) {
      setPhase('done');
    } else {
      setQuizIdx(prev => prev + 1);
    }
  }, [quizIdx, lesson.quizQuestions.length]);

  // Groups for navigation
  const groups = ['early', 'middle', 'late', 'blinds'];
  const currentGroupIdx = groups.indexOf(group);
  const nextGroup = currentGroupIdx < groups.length - 1 ? groups[currentGroupIdx + 1] : null;

  // ==================== LESSON VIEW ====================
  if (phase === 'lesson') {
    return (
      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
        <button
          onClick={() => router.push('/learn')}
          style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', padding: 0, marginBottom: 8 }}
        >
          ← Back to Learn
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          {lesson.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
          {lesson.description}
        </p>

        {/* Key Points */}
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-accent)' }}>
            Key Points
          </h3>
          {lesson.keyPoints.map((point, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 8,
              fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>&#x2022;</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* General Strategy */}
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-accent)' }}>
            Strategy
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {lesson.generalStrategy}
          </p>
        </div>

        {/* Range Description */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-accent)' }}>
            What to Play
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {lesson.rangeDescription}
          </p>
        </div>

        {/* Start Quiz */}
        <button
          className="btn-primary"
          onClick={() => setPhase('quiz')}
          style={{ width: '100%', fontSize: 16, padding: '14px 0' }}
        >
          Test Your Knowledge ({lesson.quizQuestions.length} questions)
        </button>
      </div>
    );
  }

  // ==================== QUIZ VIEW ====================
  if (phase === 'quiz' && question) {
    return (
      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {lesson.title} Quiz
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Question {quizIdx + 1} of {lesson.quizQuestions.length}
          </p>
        </div>

        <div className="score-bar-track" style={{ marginBottom: 20 }}>
          <div className="score-bar-fill" style={{
            width: `${(quizIdx / lesson.quizQuestions.length) * 100}%`,
            background: 'var(--color-accent)',
          }} />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: 'var(--text-primary)', margin: '0 0 20px' }}>
            {question.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((option, idx) => {
              let borderColor = 'var(--border-card)';
              let bgColor = 'var(--bg-elevated)';
              let textColor = 'var(--text-secondary)';
              if (showFeedback) {
                if (idx === question.correctIndex) {
                  borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.12)'; textColor = '#22c55e';
                } else if (idx === selectedIndex && !isCorrect) {
                  borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.12)'; textColor = '#ef4444';
                }
              }
              return (
                <button key={idx} onClick={() => handleQuizSelect(idx)} disabled={showFeedback}
                  style={{
                    padding: '12px 14px', border: `2px solid ${borderColor}`, borderRadius: 10,
                    background: bgColor, color: textColor, fontSize: 14, fontWeight: 500,
                    textAlign: 'left', lineHeight: 1.5,
                    cursor: showFeedback ? 'default' : 'pointer',
                    opacity: showFeedback && idx !== question.correctIndex && idx !== selectedIndex ? 0.4 : 1,
                  }}
                >{option}</button>
              );
            })}
          </div>
        </div>

        {/* Quiz Feedback */}
        {showFeedback && (
          <div className="card" style={{ textAlign: 'center' }}>
            <span className={isCorrect ? 'badge-correct' : 'badge-leak'}>
              {isCorrect ? 'Correct!' : 'Not Quite'}
            </span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
              {question.explanation}
            </p>
            <button className="btn-primary" onClick={handleQuizNext} style={{ marginTop: 16, width: '100%' }}>
              {quizIdx + 1 >= lesson.quizQuestions.length ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================== DONE VIEW ====================
  const correctCount = responses.filter(r => r.correct).length;
  const totalQ = lesson.quizQuestions.length;
  const pct = Math.round((correctCount / totalQ) * 100);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>
        {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📖'}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        {lesson.title} Complete
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        You got {correctCount} of {totalQ} correct ({pct}%)
      </p>

      {pct < 80 && (
        <div className="card" style={{ marginBottom: 16, textAlign: 'left' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Consider re-reading the lesson material before moving on. Understanding these
            concepts will make the assessment much easier.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pct < 80 && (
          <button
            className="btn-primary"
            onClick={() => { setPhase('lesson'); setQuizIdx(0); setResponses([]); setSelectedIndex(null); setShowFeedback(false); }}
            style={{ width: '100%' }}
          >
            Review Lesson
          </button>
        )}

        {nextGroup ? (
          <button
            className="btn-primary"
            onClick={() => router.push(`/learn/positions?group=${nextGroup}`)}
            style={{ width: '100%' }}
          >
            Next: {POSITION_LESSONS.find(l => l.positionGroup === nextGroup)?.title || 'Next Position'}
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => router.push('/assessment')}
            style={{ width: '100%' }}
          >
            Ready for the Assessment
          </button>
        )}

        <button
          onClick={() => router.push('/learn')}
          style={{ fontSize: 14, color: 'var(--color-accent)', background: 'none', padding: '10px 0' }}
        >
          Back to Learn
        </button>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 14+
export default function PositionsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    }>
      <PositionLessonContent />
    </Suspense>
  );
}
