import type { Question, QuestionBank } from '@/types/question';
import { formatBankName } from '@/utils/bankNames';
import { questionRenderer } from '../../static/question_renderer';

interface QuestionStatistics {
  questionId: string;
  question: Question;
  attempts: number;
  correct: number;
  wrong: number;
  accuracyRate: number;
}

interface BankStatistics {
  bank: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  questionStats: QuestionStatistics[];
}

export class QuestionStatisticsComponent {
  private container: HTMLDivElement | null;
  private bankFiles: QuestionBank;
  private currentStats: BankStatistics | null = null;
  private currentModalQuestion: Question | null = null;

  constructor(bankFiles: QuestionBank) {
    this.container = null;
    this.bankFiles = bankFiles;
    this.currentStats = null;
  }

  render(containerId: string): void {
    this.container = document.getElementById(containerId) as HTMLDivElement | null;
    if (!this.container) {
      console.warn('Question statistics container not found:', containerId);
      return;
    }

    this.container.innerHTML = this.generateHTML();
    this.attachEventListeners();
    this.populateBankSelect();
  }

  private generateHTML(): string {
    return `
      <div class="question-statistics">
        <h2>📊 Question Statistics</h2>
        <div class="form-group">
          <label for="statsBankSelect">Select Question Bank:</label>
          <select id="statsBankSelect" class="form-select">
            <option value="">-- Choose a question bank --</option>
          </select>
        </div>
        <button id="loadStatsBtn" class="btn btn-primary">Load Statistics</button>
        
        <div id="statsContainer" class="stats-container" style="display:none;">
          <div class="stats-summary">
            <div class="summary-cards">
              <div class="summary-card">
                <span class="summary-number" id="totalQuestions">0</span>
                <span class="summary-label">Total Questions</span>
              </div>
              <div class="summary-card">
                <span class="summary-number" id="attemptedQuestions">0</span>
                <span class="summary-label">Attempted</span>
              </div>
              <div class="summary-card">
                <span class="summary-number" id="correctAnswers">0</span>
                <span class="summary-label">Correct</span>
              </div>
              <div class="summary-card">
                <span class="summary-number" id="accuracyRate">0%</span>
                <span class="summary-label">Accuracy</span>
              </div>
            </div>
          </div>
          
          <table id="statsTable" class="stats-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Attempts</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <!-- Modal for displaying a single stats question -->
        <div id="statsModal" class="review-modal" style="display:none">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Question Review</h3>
              <button id="sqCloseBtn" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="sqText" class="question-text"></div>
              <div id="sqTitle" class="question-title"></div>
              <img id="sqImg" class="question-image" alt="Question image" style="display:none;">
              <div id="sqOptions" class="question-options"></div>
              <div class="review-answers">
                <div id="sqAnswer" class="answer"></div>
                <div id="sqExplanation" class="explanation"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="sqRevealBtn" class="btn btn-primary">Show Answer</button>
              <button id="sqCloseReviewBtn" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private populateBankSelect(): void {
    const statsSelect = document.getElementById('statsBankSelect') as HTMLSelectElement | null;
    if (!statsSelect) {
      console.warn('Stats bank select element not found');
      return;
    }

    // Clear existing options except the first one
    statsSelect.innerHTML = '<option value="">-- Choose a question bank --</option>';

    const names = Object.keys(this.bankFiles)
      .filter(k => Array.isArray(this.bankFiles[k]))
      .sort();

    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = formatBankName(name);
      statsSelect.appendChild(option);
    });
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
    
    // Load statistics button
    if (target.id === 'loadStatsBtn') {
      this.handleLoadStatistics();
      return;
    }

    // Close modal buttons
    if (target.id === 'sqCloseBtn' || target.id === 'sqCloseReviewBtn') {
      this.closeModal();
      return;
    }

    // Reveal answer button in modal
    if (target.id === 'sqRevealBtn') {
      this.handleRevealAnswer();
      return;
    }

    // View question button in table
    if (target.classList.contains('view-question-btn')) {
      const questionId = target.dataset.questionId;
      if (questionId) {
        this.handleViewQuestion(questionId);
      }
      return;
    }

    // Reset question stats button
    if (target.classList.contains('reset-question-btn')) {
      const questionId = target.dataset.questionId;
      if (questionId) {
        this.handleResetQuestionStats(questionId);
      }
      return;
    }

    // Modal backdrop click (clicking outside the modal content)
    if (target.classList.contains('review-modal')) {
      this.closeModal();
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

    // Handle Escape key to close modal
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  private handleLoadStatistics(): void {
    const bankSelect = document.getElementById('statsBankSelect') as HTMLSelectElement;
    if (!bankSelect || !bankSelect.value) {
      alert('Please select a question bank first');
      return;
    }

    const selectedBank = bankSelect.value;
    this.loadBankStatistics(selectedBank);
  }

  private loadBankStatistics(bankName: string): void {
    try {
      const bankData = this.bankFiles[bankName];
      
      if (!bankData || !Array.isArray(bankData)) {
        this.showError('Invalid bank data');
        return;
      }

      const bankStats = this.calculateBankStatistics(bankName, bankData);
      this.currentStats = bankStats;
      this.displayStatistics(bankStats);
    } catch (error) {
      console.error('Failed to load bank statistics:', error);
      this.showError('Failed to load statistics. Please try again.');
    }
  }

  private calculateBankStatistics(bankName: string, bankData: Question[][]): BankStatistics {
    const questionStats: QuestionStatistics[] = [];
    
    // Get both individual question data AND practice history data
    const questionUserData = this.getQuestionUserData(bankName);
    const practiceHistoryData = this.extractFromPracticeHistory(bankName);
    
    let totalQuestions = 0;
    let attemptedQuestions = 0;
    let totalAttempts = 0;
    let correctAnswers = 0;

    // Flatten all questions from all files
    bankData.forEach((file) => {
      file.forEach((question) => {
        totalQuestions++;
        
        // Generate consistent question ID based on content
        const questionId = this.generateQuestionId(question);
        
        // Combine data from both individual attempts and practice history
        const individualData = questionUserData[questionId] || { attempts: 0, correct: 0, wrong: 0 };
        const practiceData = practiceHistoryData[questionId] || { attempts: 0, correct: 0, wrong: 0 };
        
        const attempts = individualData.attempts + practiceData.attempts;
        const correct = individualData.correct + practiceData.correct;
        const wrong = individualData.wrong + practiceData.wrong;
        const accuracyRate = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

        if (attempts > 0) {
          attemptedQuestions++;
          totalAttempts += attempts;
          correctAnswers += correct;
        }

        questionStats.push({
          questionId,
          question,
          attempts,
          correct,
          wrong,
          accuracyRate
        });
      });
    });

    const overallAccuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    return {
      bank: bankName,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      accuracyRate: overallAccuracy,
      questionStats
    };
  }

  private getQuestionUserData(bankName: string): Record<string, { attempts: number; correct: number; wrong: number }> {
    try {
      const key = `question_stats_${bankName}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to load question user data:', error);
      return {};
    }
  }

  private displayStatistics(stats: BankStatistics): void {
    // Update summary cards
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const attemptedQuestionsEl = document.getElementById('attemptedQuestions');
    const correctAnswersEl = document.getElementById('correctAnswers');
    const accuracyRateEl = document.getElementById('accuracyRate');

    if (totalQuestionsEl) {
      totalQuestionsEl.textContent = stats.totalQuestions.toString();
    }
    if (attemptedQuestionsEl) {
      attemptedQuestionsEl.textContent = stats.attemptedQuestions.toString();
    }
    if (correctAnswersEl) {
      correctAnswersEl.textContent = stats.correctAnswers.toString();
    }
    if (accuracyRateEl) {
      accuracyRateEl.textContent = `${stats.accuracyRate}%`;
    }

    // Update table
    this.populateStatsTable(stats.questionStats);

    // Show stats container
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
      statsContainer.style.display = 'block';
    }
  }

  private populateStatsTable(questionStats: QuestionStatistics[]): void {
    const tbody = document.querySelector('#statsTable tbody') as HTMLTableSectionElement;
    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    questionStats.forEach((stat, index) => {
      const row = tbody.insertRow();
      
      // Question number
      const questionCell = row.insertCell();
      questionCell.textContent = `Question ${index + 1}`;
      
      // Attempts
      const attemptsCell = row.insertCell();
      attemptsCell.textContent = stat.attempts.toString();
      
      // Correct
      const correctCell = row.insertCell();
      correctCell.textContent = stat.correct.toString();
      correctCell.className = stat.correct > 0 ? 'positive' : '';
      
      // Wrong
      const wrongCell = row.insertCell();
      wrongCell.textContent = stat.wrong.toString();
      wrongCell.className = stat.wrong > 0 ? 'negative' : '';
      
      // Actions
      const actionsCell = row.insertCell();
      actionsCell.innerHTML = `
        <button class="btn btn-sm btn-secondary view-question-btn" data-question-id="${stat.questionId}">
          View
        </button>
        ${stat.attempts > 0 ? `
          <button class="btn btn-sm btn-danger reset-question-btn" data-question-id="${stat.questionId}" title="Reset statistics for this question">
            Reset
          </button>
        ` : ''}
      `;
    });
  }

  private handleViewQuestion(questionId: string): void {
    if (!this.currentStats) {
      return;
    }

    const questionStat = this.currentStats.questionStats.find(stat => stat.questionId === questionId);
    if (!questionStat) {
      return;
    }

    this.showQuestionModal(questionStat.question);
  }

  private showQuestionModal(question: Question): void {
    const modal = document.getElementById('statsModal');
    if (!modal) {
      return;
    }

    // Store the current question for the modal
    this.currentModalQuestion = question;

    // Render question using the question renderer
    if (questionRenderer) {
      questionRenderer.renderQuestion(question, {
        text: '#sqText',
        title: '#sqTitle',
        img: '#sqImg',
        options: '#sqOptions',
        answer: '#sqAnswer',
        explanation: '#sqExplanation',
        showInput: false, // Don't show input in stats mode
        reviewMode: true
      });
    }

    // Reset answer display
    const answerEl = document.getElementById('sqAnswer');
    const explanationEl = document.getElementById('sqExplanation');
    const revealBtn = document.getElementById('sqRevealBtn');
    
    if (answerEl) {
      answerEl.style.display = 'none';
      answerEl.innerHTML = '';
    }
    if (explanationEl) {
      explanationEl.style.display = 'none';
      explanationEl.innerHTML = '';
    }
    if (revealBtn) {
      revealBtn.textContent = 'Show Answer';
      revealBtn.dataset.revealed = 'false';
    }

    // Show modal
    modal.style.display = 'block';
  }

  private handleRevealAnswer(): void {
    const revealBtn = document.getElementById('sqRevealBtn') as HTMLButtonElement;
    if (!revealBtn) {
      return;
    }

    const isRevealed = revealBtn.dataset.revealed === 'true';
    
    if (isRevealed) {
      // Hide answer
      const answerEl = document.getElementById('sqAnswer');
      const explanationEl = document.getElementById('sqExplanation');
      
      if (answerEl) {
        answerEl.style.display = 'none';
        answerEl.innerHTML = '';
      }
      if (explanationEl) {
        explanationEl.style.display = 'none';
        explanationEl.innerHTML = '';
      }
      
      revealBtn.textContent = 'Show Answer';
      revealBtn.dataset.revealed = 'false';
    } else {
      // Show answer and explanation
      if (this.currentModalQuestion) {
        const answerEl = document.getElementById('sqAnswer');
        const explanationEl = document.getElementById('sqExplanation');
        
        // Show correct answer
        if (answerEl) {
          const correctAnswerText = (window as any).getCorrectAnswerText?.(this.currentModalQuestion) ?? 'Unknown';
          answerEl.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswerText}${this.currentModalQuestion.answer_unit ? ' ' + this.currentModalQuestion.answer_unit : ''}`;
          answerEl.style.display = 'block';
        }

        // Show explanation
        if (explanationEl && this.currentModalQuestion.why) {
          const formattedExplanation = (window as any).formatExplanation?.(this.currentModalQuestion.why) ?? this.currentModalQuestion.why;
          explanationEl.innerHTML = `<strong>Explanation:</strong> ${formattedExplanation}`;
          explanationEl.style.display = 'block';
        }
      }
      
      revealBtn.textContent = 'Hide Answer';
      revealBtn.dataset.revealed = 'true';
    }
  }

  private handleResetQuestionStats(questionId: string): void {
    if (!this.currentStats) {
      return;
    }

    const confirmReset = confirm('Are you sure you want to reset the statistics for this question? This cannot be undone.');
    if (!confirmReset) {
      return;
    }

    try {
      const key = `question_stats_${this.currentStats.bank}`;
      const userData = this.getQuestionUserData(this.currentStats.bank);
      
      // Remove the specific question data
      delete userData[questionId];
      
      // Save updated data
      localStorage.setItem(key, JSON.stringify(userData));
      
      // Reload statistics
      this.loadBankStatistics(this.currentStats.bank);
    } catch (error) {
      console.error('Failed to reset question statistics:', error);
      this.showError('Failed to reset statistics. Please try again.');
    }
  }

  private closeModal(): void {
    const modal = document.getElementById('statsModal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Clear the current modal question
    this.currentModalQuestion = null;
  }

  private showError(message: string): void {
    console.error(message);
    alert(message);
  }

  // Public method to record a question attempt (called from practice mode)
  recordQuestionAttempt(bankName: string, questionId: string, isCorrect: boolean): void {
    try {
      const key = `question_stats_${bankName}`;
      const userData = this.getQuestionUserData(bankName);
      
      if (!userData[questionId]) {
        userData[questionId] = { attempts: 0, correct: 0, wrong: 0 };
      }
      
      userData[questionId].attempts++;
      if (isCorrect) {
        userData[questionId].correct++;
      } else {
        userData[questionId].wrong++;
      }
      
      localStorage.setItem(key, JSON.stringify(userData));
    } catch (error) {
      console.warn('Failed to record question attempt:', error);
    }
  }

  refresh(): void {
    if (this.container && this.currentStats) {
      this.loadBankStatistics(this.currentStats.bank);
    }
  }

  private generateQuestionId(question: Question): string {
    // Create a consistent ID based on question content (first 50 chars of question text + calculation flag)
    const questionText = question.text || '';
    const prefix = questionText.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
    const suffix = question.is_calculation ? '_calc' : '_mcq';
    return `${prefix}${suffix}`;
  }

  private extractFromPracticeHistory(bankName: string): Record<string, { attempts: number; correct: number; wrong: number }> {
    try {
      const history = localStorage.getItem('practice_history');
      if (!history) {
        return {};
      }

      const parsedHistory = JSON.parse(history);
      const results = parsedHistory.results || [];
      
      // Filter results for the specific bank
      const bankResults = results.filter((result: any) => result.bank === bankName);
      
      const aggregatedData: Record<string, { attempts: number; correct: number; wrong: number }> = {};

      // Process each practice test result
      bankResults.forEach((result: any) => {
        if (!result.questions || !result.answers) {
          return; // Skip invalid results
        }

        // Process each question in the test
        result.questions.forEach((question: Question, index: number) => {
          const userAnswer = result.answers[index];
          if (!userAnswer) {
            return; // Skip unanswered questions
          }

          const questionId = this.generateQuestionId(question);
          
          // Initialize if not exists
          if (!aggregatedData[questionId]) {
            aggregatedData[questionId] = { attempts: 0, correct: 0, wrong: 0 };
          }

          // Count the attempt
          aggregatedData[questionId].attempts++;

          // Check if answer was correct using the evaluateAnswer function
          // We'll use a simple check since we can't import evaluateAnswer here
          const isCorrect = this.isAnswerCorrect(question, userAnswer);
          if (isCorrect) {
            aggregatedData[questionId].correct++;
          } else {
            aggregatedData[questionId].wrong++;
          }
        });
      });

      return aggregatedData;
    } catch (error) {
      console.warn('Failed to extract data from practice history:', error);
      return {};
    }
  }

  private isAnswerCorrect(question: Question, userAnswer: string): boolean {
    // Simple answer checking logic (replicated from evaluateAnswer)
    if (question.is_calculation) {
      // For calculation questions, compare against correct_answer field
      const userNum = parseFloat(userAnswer);
      const correctAnswer = parseFloat(question.correct_answer);
      return !isNaN(userNum) && !isNaN(correctAnswer) && Math.abs(userNum - correctAnswer) < 0.01;
    } else {
      // For MCQ questions, compare against correct_answer_number
      const correctNum = question.correct_answer_number;
      return correctNum !== null && correctNum !== undefined && parseInt(userAnswer) === correctNum;
    }
  }
}

