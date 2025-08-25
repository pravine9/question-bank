import { EMPTY_HISTORY } from '../utils/history';
import type { PracticeHistory, PracticeResult } from '@/types/question';

export class PracticeHistoryComponent {
  private container: HTMLDivElement | null;
  private history: PracticeHistory;

  constructor() {
    this.container = null;
    this.history = this.getPracticeHistory();
  }

  render(containerId: string): void {
    this.container = document.getElementById(containerId) as HTMLDivElement | null;
    if (!this.container) {
      console.warn('Practice history container not found:', containerId);
      return;
    }

    this.container.innerHTML = this.generateHTML();
    this.attachEventListeners();
  }

  private generateHTML(): string {
    if (this.history.totalTests === 0) {
      return `
        <div class="practice-history-empty">
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>No Practice Tests Yet</h3>
            <p>Complete your first practice test to see your results here!</p>
            <button class="btn btn-primary" id="startFirstTest">Start Your First Test</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="practice-history">
        <div class="history-header">
          <h2>📊 Practice Test History</h2>
          <button class="btn btn-secondary btn-sm" id="clearHistory">Clear History</button>
        </div>

        <div class="history-stats">
          <div class="stat-card">
            <div class="stat-number">${this.history.totalTests}</div>
            <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.history.averageScore}%</div>
            <div class="stat-label">Average Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.history.bestScore}%</div>
            <div class="stat-label">Best Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round(this.history.totalTime)}m</div>
            <div class="stat-label">Total Time</div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    if (!this.container) {
      return;
    }

    // Clear history button
    const clearBtn = this.container.querySelector<HTMLButtonElement>('#clearHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all practice history? This cannot be undone.')) {
          this.clearPracticeHistory();
          this.history = this.getPracticeHistory();
          this.render(this.container!.id);
        }
      });
    }

    // Start first test button
    const startFirstBtn = this.container.querySelector<HTMLButtonElement>('#startFirstTest');
    if (startFirstBtn) {
      startFirstBtn.addEventListener('click', () => {
        const practiceBtn = document.getElementById('practiceBtn') as HTMLButtonElement | null;
        if (practiceBtn) {
          practiceBtn.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  // Storage methods
  private getPracticeHistory(): PracticeHistory {
    try {
      const history = localStorage.getItem('practice_history');
      if (!history) {
        return { ...EMPTY_HISTORY };
      }

      const parsedHistory = JSON.parse(history);
      return this.calculateHistoryStats(parsedHistory.results || []);
    } catch (error) {
      console.warn('Failed to load practice history:', error);
      return { ...EMPTY_HISTORY };
    }
  }

  private calculateHistoryStats(results: PracticeResult[]): PracticeHistory {
    const totalTests = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 100) / 100 : 0;
    const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const totalTime = results.reduce((sum, result) => sum + result.duration, 0);

    return {
      results,
      totalTests,
      averageScore,
      bestScore,
      totalTime,
    };
  }

  private clearPracticeHistory(): void {
    try {
      localStorage.removeItem('practice_history');
      this.history = { ...EMPTY_HISTORY };
    } catch (error) {
      console.warn('Failed to clear practice history:', error);
    }
  }

  refresh(): void {
    this.history = this.getPracticeHistory();
    if (this.container) {
      this.render(this.container.id);
    }
  }
}
