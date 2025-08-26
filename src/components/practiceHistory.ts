import { EMPTY_HISTORY } from '../utils/history';
import type { PracticeHistory, PracticeResult } from '@/types/question';

export class PracticeHistoryComponent {
  private container: HTMLDivElement | null;
  private history: PracticeHistory;
  private cachedStats: PracticeHistory | null = null;
  private dateFormatter: Intl.DateTimeFormat;

  constructor() {
    this.container = null;
    this.history = this.getPracticeHistory();
    
    // Cache date formatter for better performance
    this.dateFormatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

    const testResultsHTML = this.history.results
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(result => this.generateTestResultHTML(result))
      .join('');

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

        <div class="test-results-list">
          <h3>Recent Tests</h3>
          <div class="test-results-container" role="list" aria-label="List of practice test results">
            ${testResultsHTML}
          </div>
        </div>
      </div>
    `;
  }

  private generateTestResultHTML(result: PracticeResult): string {
    const formattedDate = this.dateFormatter.format(new Date(result.date));
    const duration = Math.round(result.duration);
    const scorePercentage = Math.round(result.score); // Score is already a percentage (0-100)
    const scoreClass = this.getScoreClass(scorePercentage);
    const scoreDescription = this.getScoreDescription(scorePercentage);

    return `
      <div class="test-result-item" role="listitem" data-test-id="${result.id}">
        <div class="test-result-header">
          <div class="test-info">
            <div class="test-bank">${this.formatBankName(result.bank)}</div>
            <div class="test-meta">
              <span class="test-date" aria-label="Test taken on ${formattedDate}">${formattedDate}</span>
              <span class="test-duration" aria-label="Duration: ${duration} minutes">${duration}m</span>
            </div>
          </div>
          <div class="test-header-actions">
            <div class="test-score ${scoreClass}" aria-label="Score: ${scorePercentage}% - ${scoreDescription}">
              ${scorePercentage}%
            </div>
            <button class="btn-icon delete-test-btn" data-test-id="${result.id}" aria-label="Delete this test result" title="Delete test">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="test-result-details">
          <div class="test-stats" role="group" aria-label="Test details">
            <span class="stat" aria-label="${result.correctAnswers} correct out of ${result.totalQuestions} questions">
              ${result.correctAnswers}/${result.totalQuestions} correct
            </span>
          </div>
          <button class="btn btn-primary btn-sm review-test-btn" data-test-id="${result.id}" aria-label="Review test results for ${this.formatBankName(result.bank)}">
            Review Test
          </button>
        </div>
      </div>
    `;
  }

  private getScoreClass(scorePercentage: number): string {
    if (scorePercentage >= 70) return 'score-good';
    if (scorePercentage >= 50) return 'score-average';
    return 'score-poor';
  }

  private getScoreDescription(scorePercentage: number): string {
    if (scorePercentage >= 70) return 'Good performance';
    if (scorePercentage >= 50) return 'Average performance';
    return 'Needs improvement';
  }

  private formatBankName(bank: string): string {
    // Convert bank name to display format
    return bank
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private attachEventListeners(): void {
    if (!this.container) {
      return;
    }

    // Use event delegation for better performance
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Clear history button
    if (target.id === 'clearHistory') {
      this.handleClearHistory();
      return;
    }

    // Start first test button
    if (target.id === 'startFirstTest') {
      this.handleStartFirstTest();
      return;
    }

    // Review test button
    if (target.classList.contains('review-test-btn')) {
      const testId = target.dataset.testId;
      if (testId) {
        this.handleReviewTest(testId);
      }
      return;
    }

    // Delete test button (including SVG inside button)
    if (target.classList.contains('delete-test-btn') || target.closest('.delete-test-btn')) {
      const button = target.classList.contains('delete-test-btn') ? target : target.closest('.delete-test-btn') as HTMLElement;
      const testId = button?.dataset.testId;
      if (testId) {
        this.handleDeleteTest(testId);
      }
      return;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle Enter and Space for buttons
    if ((event.key === 'Enter' || event.key === ' ') && target.tagName === 'BUTTON') {
      event.preventDefault();
      target.click();
    }
  }

  private handleClearHistory(): void {
    if (confirm('Are you sure you want to clear all practice history? This cannot be undone.')) {
      this.clearPracticeHistory();
      this.refresh();
    }
  }

  private handleStartFirstTest(): void {
    const practiceBtn = document.getElementById('practiceBtn') as HTMLButtonElement | null;
    if (practiceBtn) {
      practiceBtn.scrollIntoView({ behavior: 'smooth' });
      practiceBtn.focus();
    }
  }

  private handleReviewTest(testId: string): void {
    window.location.href = `summary.html?resultId=${testId}`;
  }

  private handleDeleteTest(testId: string): void {
    if (confirm('Are you sure you want to delete this test result? This cannot be undone.')) {
      this.deleteTestResult(testId);
      this.refresh();
    }
  }

  private deleteTestResult(testId: string): void {
    try {
      const history = localStorage.getItem('practice_history');
      if (history) {
        const parsedHistory = JSON.parse(history);
        parsedHistory.results = parsedHistory.results.filter((result: PracticeResult) => result.id !== testId);
        localStorage.setItem('practice_history', JSON.stringify(parsedHistory));
        
        // Clear cache to force recalculation
        this.cachedStats = null;
      }
    } catch (error) {
      console.warn('Failed to delete test result:', error);
      this.showError('Failed to delete test result. Please try again.');
    }
  }

  private showError(message: string): void {
    // Simple error display - could be enhanced with a toast notification
    console.error(message);
    alert(message);
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
    // Use cached stats if available and results haven't changed
    if (this.cachedStats && this.cachedStats.results.length === results.length) {
      return this.cachedStats;
    }

    const totalTests = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0; // Score is already a percentage
    const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const totalTime = results.reduce((sum, result) => sum + result.duration, 0);

    const stats = {
      results,
      totalTests,
      averageScore,
      bestScore,
      totalTime,
    };

    // Cache the calculated stats
    this.cachedStats = stats;
    return stats;
  }

  private clearPracticeHistory(): void {
    try {
      localStorage.removeItem('practice_history');
      this.history = { ...EMPTY_HISTORY };
      this.cachedStats = null;
    } catch (error) {
      console.warn('Failed to clear practice history:', error);
      this.showError('Failed to clear practice history. Please try again.');
    }
  }

  refresh(): void {
    this.history = this.getPracticeHistory();
    if (this.container) {
      this.render(this.container.id);
    }
  }
}