// Practice History Component - JavaScript Version
import { formatBankName } from '../utils/bankNames';
import { EMPTY_HISTORY } from '../utils/history';

class PracticeHistoryComponent {
  constructor() {
    this.container = null;
    this.history = this.getPracticeHistory();
    this.handleReviewClick = (e) => {
      const reviewBtn = e.target.closest('.review-result');
      if (reviewBtn) {
        const resultId = reviewBtn.getAttribute('data-result-id');
        if (resultId) {
          this.showResultDetails(resultId);
        }
      }
    };
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Practice history container not found:', containerId);
      return;
    }

    this.container.innerHTML = this.generateHTML();
    this.attachEventListeners();
  }

  generateHTML() {
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

  generateResultCard(result) {
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
          <div class="result-bank">${formatBankName(result.bank)}</div>
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

  attachEventListeners() {
    if (!this.container) {return;}

    // Clear history button
    const clearBtn = this.container.querySelector('#clearHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all practice history? This cannot be undone.')) {
          this.clearPracticeHistory();
          this.history = this.getPracticeHistory();
          this.render(this.container.id);
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

    // Delegate review button clicks to the container
    this.container.addEventListener('click', this.handleReviewClick);
  }

  attachBackToSummary() {
    if (!this.container) { return; }

    const backBtn = this.container.querySelector('#backToSummary');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.render(this.container.id);
      });
    }
  }

  showAllResultsModal() {
    // Simplified: just show all results in the main area
    if (this.container) {
      this.container.innerHTML = `
        <div class="practice-history">
          <div class="history-header">
            <h2>📊 All Practice Test Results</h2>
            <button class="btn btn-secondary btn-sm" id="backToSummary">Back to Summary</button>
          </div>
          <div class="all-results-list">
            ${this.history.results.map(result => this.generateResultCard(result)).join('')}
          </div>
        </div>
      `;

      this.attachBackToSummary();
    }
  }

  showResultDetails(resultId) {
    const result = this.history.results.find(r => r.id === resultId);
    if (!result) {return;}

    // Simplified: show basic result info in the main area
    if (this.container) {
      this.container.innerHTML = `
        <div class="practice-history">
          <div class="history-header">
            <h2>📊 Test Result Details</h2>
            <button class="btn btn-secondary btn-sm" id="backToSummary">Back to Summary</button>
          </div>
          <div class="result-summary">
            <div class="summary-stats">
              <div class="summary-stat">
                <span class="stat-label">Bank:</span>
                <span class="stat-value">${formatBankName(result.bank)}</span>
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
          <div class="button-row">
            <button class="btn btn-primary" id="backToSummary">Back to Summary</button>
          </div>
        </div>
      `;

      this.attachBackToSummary();
    }
  }

  // Storage methods
  getPracticeHistory() {
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

  calculateHistoryStats(results) {
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
      totalTime
    };
  }

  clearPracticeHistory() {
    try {
      localStorage.removeItem('practice_history');
      this.history = { ...EMPTY_HISTORY };
    } catch (error) {
      console.warn('Failed to clear practice history:', error);
    }
  }

  refresh() {
    this.history = this.getPracticeHistory();
    if (this.container) {
      this.render(this.container.id);
    }
  }
}

// Make it available globally
window.practiceHistoryComponent = new PracticeHistoryComponent();
