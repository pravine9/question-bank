import React, { useEffect, useState } from 'react';
import type { PracticeResult } from '@/types/question';

export default function SummaryApp() {
  const [result, setResult] = useState<PracticeResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('latest_result');
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        setResult(null);
      }
    }
  }, []);

  if (!result) {
    return <div>No summary available.</div>;
  }

  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

  return (
    <div className="summary">
      <h1>Test Complete!</h1>
      <div className="score">{result.correctAnswers}/{result.totalQuestions} ({percentage}%)</div>
      <button onClick={() => (window.location.href = 'index.html')}>Go Home</button>
    </div>
  );
}
