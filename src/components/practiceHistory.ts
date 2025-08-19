import type { PracticeHistory, PracticeResult } from '../types/question';
import { storage } from '../utils/storage';

export class PracticeHistoryComponent {
  private container: HTMLElement | null = null;
  private history: PracticeHistory;

  constructor() {
    this.history = storage.getPracticeHistory();
  }

  render(containerId: string): void {
    this.container = document.getElementById(containerId);
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

        <div class="recent-results">
          <h3>Recent Results</h3>
          <div class="results-list">
            ${this.history.results.slice(0, 5).map(result => this.generateResultCard(result)).join('')}
          </div>
        </div>

        ${this.history.results.length > 5 ? `
          <div class="view-all-results">
            <button class="btn btn-secondary" id="viewAllResults">
              View All ${this.history.results.length} Results
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private generateResultCard(result: PracticeResult): string {
    const scoreClass = result.score >= 80 ? 'score-excellent' : 
                      result.score >= 60 ? 'score-good' : 
                      result.score >= 40 ? 'score-average' : 'score-poor';
    
    const date = new Date(result.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const time = new Date(result.date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="result-card" data-result-id="${result.id}">
        <div class="result-header">
          <div class="result-bank">${this.formatBankName(result.bank)}</div>
          <div class="result-date">${date} at ${time}</div>
        </div>
        <div class="result-details">
          <div class="result-score ${scoreClass}">
            <span class="score-number">${result.score}%</span>
            <span class="score-label">Score</span>
          </div>
          <div class="result-stats">
            <div class="stat">
              <span class="stat-value">${result.correctAnswers}/${result.totalQuestions}</span>
              <span class="stat-label">Correct</span>
            </div>
            <div class="stat">
              <span class="stat-value">${result.duration}m</span>
              <span class="stat-label">Time</span>
            </div>
            ${result.flaggedQuestions > 0 ? `
              <div class="stat">
                <span class="stat-value">${result.flaggedQuestions}</span>
                <span class="stat-label">Flagged</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-sm btn-primary review-result" data-result-id="${result.id}">
            Review Test
          </button>
        </div>
      </div>
    `;
  }

  private formatBankName(bank: string): string {
    const bankNames: Record<string, string> = {
      'calculations': 'Calculations',
      'clinical_mep': 'Clinical MEP',
      'clinical_mixed': 'Clinical Mixed',
      'clinical_otc': 'Clinical OTC',
      'clinical_therapeutics': 'Clinical Therapeutics'
    };
    return bankNames[bank] || bank;
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Clear history button
    const clearBtn = this.container.querySelector('#clearHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all practice history? This cannot be undone.')) {
          storage.clearPracticeHistory();
          this.history = storage.getPracticeHistory();
          this.render(this.container?.id || 'practiceHistory');
        }
      });
    }

    // Start first test button
    const startFirstBtn = this.container.querySelector('#startFirstTest');
    if (startFirstBtn) {
      startFirstBtn.addEventListener('click', () => {
        // Focus on the practice section
        const practiceBtn = document.getElementById('practiceBtn');
        if (practiceBtn) {
          practiceBtn.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // View all results button
    const viewAllBtn = this.container.querySelector('#viewAllResults');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.showAllResultsModal();
      });
    }

    // Review result buttons
    const reviewBtns = this.container.querySelectorAll('.review-result');
    reviewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resultId = (e.target as HTMLElement).getAttribute('data-result-id');
        if (resultId) {
          this.showResultDetails(resultId);
        }
      });
    });
  }

  private showAllResultsModal(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content large">
        <div class="modal-header">
          <h3>All Practice Test Results</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="all-results-list">
            ${this.history.results.map(result => this.generateResultCard(result)).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Attach event listeners to review buttons in modal
    const reviewBtns = modal.querySelectorAll('.review-result');
    reviewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resultId = (e.target as HTMLElement).getAttribute('data-result-id');
        if (resultId) {
          document.body.removeChild(modal);
          this.showResultDetails(resultId);
        }
      });
    });
  }

  private showResultDetails(resultId: string): void {
    const result = this.history.results.find(r => r.id === resultId);
    if (!result) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content large">
        <div class="modal-header">
          <h3>Test Result Details</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="result-summary">
            <div class="summary-stats">
              <div class="summary-stat">
                <span class="stat-label">Bank:</span>
                <span class="stat-value">${this.formatBankName(result.bank)}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Score:</span>
                <span class="stat-value">${result.score}%</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Questions:</span>
                <span class="stat-value">${result.totalQuestions}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Correct:</span>
                <span class="stat-value">${result.correctAnswers}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Duration:</span>
                <span class="stat-value">${result.duration} minutes</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Date:</span>
                <span class="stat-value">${new Date(result.date).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div class="question-results">
            <h4>Question Details</h4>
            <div class="questions-list">
              ${result.questions.map((q, index) => `
                <div class="question-result ${q.isCorrect ? 'correct' : 'incorrect'}">
                  <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="question-status ${q.isCorrect ? 'correct' : 'incorrect'}">
                      ${q.isCorrect ? '✓' : '✗'}
                    </span>
                    ${q.flagged ? '<span class="flagged">🚩</span>' : ''}
                  </div>
                  <div class="question-answers">
                    <div class="answer">
                      <span class="answer-label">Your Answer:</span>
                      <span class="answer-value">${q.userAnswer || 'No answer'}</span>
                    </div>
                    <div class="answer">
                      <span class="answer-label">Correct Answer:</span>
                      <span class="answer-value correct">${q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  refresh(): void {
    this.history = storage.getPracticeHistory();
    if (this.container) {
      this.render(this.container.id);
    }
  }
}

export const practiceHistoryComponent = new PracticeHistoryComponent();
