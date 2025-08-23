import React, { useEffect, useState } from 'react';
import { EMPTY_HISTORY } from '../utils/history';
import type { PracticeHistory, PracticeResult } from '@/types/question';

function calculateHistoryStats(results: PracticeResult[]): PracticeHistory {
  const totalTests = results.length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 100) / 100 : 0;
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  return { results, totalTests, averageScore, bestScore, totalTime };
}

export default function PracticeHistoryView() {
  const [history, setHistory] = useState<PracticeHistory>(EMPTY_HISTORY);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('practice_history');
      if (!stored) {
        setHistory({ ...EMPTY_HISTORY });
        return;
      }
      const parsed = JSON.parse(stored);
      const stats = calculateHistoryStats(parsed.results || []);
      setHistory(stats);
    } catch {
      setHistory({ ...EMPTY_HISTORY });
    }
  }, []);

  if (history.totalTests === 0) {
    return (
      <div className="practice-history-empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Practice Tests Yet</h3>
          <p>Complete your first practice test to see your results here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-history">
      <div className="history-header">
        <h2>📊 Practice Test History</h2>
      </div>
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-number">{history.totalTests}</div>
          <div className="stat-label">Total Tests</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{history.averageScore}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{history.bestScore}%</div>
          <div className="stat-label">Best Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round(history.totalTime)}m</div>
          <div className="stat-label">Total Time</div>
        </div>
      </div>
    </div>
  );
}
