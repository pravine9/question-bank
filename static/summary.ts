// Summary Page Logic - Dedicated Implementation

import type { PracticeResult } from '@/types/question';
import { EMPTY_HISTORY } from '@/utils/history';
import { evaluateAnswer, getCorrectAnswerText, formatExplanation } from '@/utils/answers';
import { questionRenderer } from './question_renderer';

export class SummaryManager {
  private testResult: PracticeResult | null = null;
  private currentReviewQuestion: number = 0;
  private reviewMode: 'all' | 'incorrect' | 'flagged' = 'all';
  private filteredRows: HTMLTableRowElement[] = [];

  constructor() {
    this.init();
    this.setupBackButtonHandling();
  }

  init(): void {
    this.loadTestResult();
    this.setupEventListeners();
  }

  private loadTestResult(): void {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get('resultId');
    
    if (!resultId) {
      alert('No test result found');
      window.location.href = 'index.html';
      return;
    }

    try {
      const existingHistory = localStorage.getItem('practice_history');
      const history = existingHistory ? JSON.parse(existingHistory) : { ...EMPTY_HISTORY };
      
      const result = history.results.find((r: any) => r.id === resultId);
      if (!result) {
        alert('Test result not found');
        window.location.href = 'index.html';
        return;
      }

      this.testResult = result;
      this.populateSummary();
    } catch (error) {
      console.error('Failed to load test result:', error);
      alert('Failed to load test result');
      window.location.href = 'index.html';
    }
  }

  private populateSummary(): void {
    if (!this.testResult) return;

    const tbody = document.querySelector('.summary-table tbody') as HTMLTableSectionElement;
    const scoreText = document.getElementById('scoreText') as HTMLElement;

    if (!tbody) return;

    let correctCount = 0;
    tbody.innerHTML = '';
    this.filteredRows = [];

    for (let i = 0; i < this.testResult.questions.length; i++) {
      const question = this.testResult.questions[i];
      const userAnswer = this.testResult.answers[i] || 'No answer';
      const isCorrect =
        userAnswer !== 'No answer' && evaluateAnswer(question, userAnswer);
      
      if (isCorrect) {
        correctCount++;
      }

      const row = tbody.insertRow();
      this.filteredRows.push(row);
      
      const statusClass = isCorrect ? 'correct' : 'incorrect';
      const statusText = isCorrect ? '✓ Correct' : '✗ Incorrect';
      
      // Get the actual answer text instead of just the number
      let userAnswerText = userAnswer;
      if (userAnswer !== 'No answer' && !question.is_calculation) {
        const selectedAnswer = question.answers.find(a => a.answer_number.toString() === userAnswer);
        userAnswerText = selectedAnswer ? selectedAnswer.text : userAnswer;
      }
      
      row.innerHTML = `
        <td>
          <div class="question-number">${i + 1}</div>
        </td>
        <td class="answer-cell">${userAnswerText}</td>
        <td class="correct-answer-cell">${getCorrectAnswerText(question)}</td>
        <td class="status-cell ${statusClass}">${statusText}</td>
        <td class="review-cell">
          <button class="review-question" data-question="${i}">Review</button>
        </td>
      `;
    }

    const score = Math.round((correctCount / this.testResult.totalQuestions) * 100);

    // Update score display
    if (scoreText) scoreText.textContent = `You scored ${correctCount}/${this.testResult.totalQuestions} (${score}%)`;

    // Add review handlers
    tbody.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.review-question') as HTMLButtonElement;
      if (btn) {
        const questionNum = parseInt(btn.dataset.question || '0');
        this.openReviewModal(questionNum);
      }
    });

    // Apply initial filter (show all questions by default)
    this.applyFilters();
  }

  private setupEventListeners(): void {
    const goHomeBtn = document.getElementById('goHomeBtn');
    const modalClose = document.querySelector('.modal-close');
    const closeReviewBtn = document.getElementById('closeReviewBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const clearFilterBtn = document.querySelector('.clear-filter-btn');
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeReviewModal());
    }
    if (closeReviewBtn) {
      closeReviewBtn.addEventListener('click', () => this.closeReviewModal());
    }
    if (prevQuestionBtn) {
      prevQuestionBtn.addEventListener('click', () => this.navigateReviewQuestion(-1));
    }
    if (nextQuestionBtn) {
      nextQuestionBtn.addEventListener('click', () => this.navigateReviewQuestion(1));
    }
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => this.clearFilters());
    }

    // Filter event listeners
    const filterCorrect = document.getElementById('filterCorrect') as HTMLInputElement;
    const filterIncorrect = document.getElementById('filterIncorrect') as HTMLInputElement;
    const filterUnanswered = document.getElementById('filterUnanswered') as HTMLInputElement;

    if (filterCorrect) {
      filterCorrect.addEventListener('change', () => this.applyFilters());
    }
    if (filterIncorrect) {
      filterIncorrect.addEventListener('change', () => this.applyFilters());
    }
    if (filterUnanswered) {
      filterUnanswered.addEventListener('change', () => this.applyFilters());
    }

    // Close modal on outside click
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeReviewModal();
        }
      });
    }
  }

  private applyFilters(): void {
    const filterCorrect = document.getElementById('filterCorrect') as HTMLInputElement;
    const filterIncorrect = document.getElementById('filterIncorrect') as HTMLInputElement;
    const filterUnanswered = document.getElementById('filterUnanswered') as HTMLInputElement;

    if (!this.testResult) return;

    // If no filters are selected, show all questions
    const hasActiveFilters = (filterCorrect?.checked || filterIncorrect?.checked || filterUnanswered?.checked);

    this.filteredRows.forEach((row, index) => {
      const question = this.testResult!.questions[index];
      const userAnswer = this.testResult!.answers[index] || 'No answer';
      const isCorrect = userAnswer !== 'No answer' && evaluateAnswer(question, userAnswer);
      
      let shouldShow = false;
      
      if (!hasActiveFilters) {
        // If no filters are selected, show all questions
        shouldShow = true;
      } else {
        // Apply selected filters
        if (isCorrect && filterCorrect?.checked) {
          shouldShow = true;
        } else if (!isCorrect && filterIncorrect?.checked) {
          shouldShow = true;
        } else if (userAnswer === 'No answer' && filterUnanswered?.checked) {
          shouldShow = true;
        }
      }
      
      row.style.display = shouldShow ? '' : 'none';
    });
  }

  private clearFilters(): void {
    const filterCorrect = document.getElementById('filterCorrect') as HTMLInputElement;
    const filterIncorrect = document.getElementById('filterIncorrect') as HTMLInputElement;
    const filterUnanswered = document.getElementById('filterUnanswered') as HTMLInputElement;

    if (filterCorrect) filterCorrect.checked = false;
    if (filterIncorrect) filterIncorrect.checked = false;
    if (filterUnanswered) filterUnanswered.checked = false;

    this.applyFilters();
  }

  private startReviewMode(mode: 'all' | 'incorrect' | 'flagged'): void {
    if (!this.testResult) return;

    this.reviewMode = mode;
    
    // Find first question to review based on mode
    let firstQuestion = 0;
    
    if (mode === 'incorrect') {
      for (let i = 0; i < this.testResult.questions.length; i++) {
        const userAnswer = this.testResult.answers[i];
        if (userAnswer && !evaluateAnswer(this.testResult.questions[i], userAnswer)) {
          firstQuestion = i;
          break;
        }
      }
    } else if (mode === 'flagged') {
      for (let i = 0; i < this.testResult.questions.length; i++) {
        if (this.testResult.flagged.includes(i)) {
          firstQuestion = i;
          break;
        }
      }
    }

    this.openReviewModal(firstQuestion);
  }

  private openReviewModal(questionNum: number): void {
    if (!this.testResult || questionNum < 0 || questionNum >= this.testResult.questions.length) return;

    this.currentReviewQuestion = questionNum;
    const question = this.testResult.questions[questionNum];
    const userAnswer = this.testResult.answers[questionNum] || 'No answer';

    // Update modal title
    const modalTitle = document.getElementById('reviewQuestionTitle');
    if (modalTitle) {
      modalTitle.textContent = `Question ${questionNum + 1} Review`;
    }

    // Render question using renderer
    if (questionRenderer) {
      questionRenderer.renderQuestion(question, {
        text: '#reviewQuestionText',
        title: '#reviewQuestionTitle',
        img: '#reviewQuestionImage',
        options: '#reviewAnswerOptions',
        showInput: false, // Don't show input in review mode
        reviewMode: true,
        userAnswer: userAnswer
      });
    }



    // Show correct answer
    const reviewCorrectAnswer = document.getElementById('reviewCorrectAnswer');
    if (reviewCorrectAnswer) {
      reviewCorrectAnswer.textContent = getCorrectAnswerText(question);
    }

    // Show explanation
    const reviewExplanation = document.getElementById('reviewExplanation');
    if (reviewExplanation) {
      reviewExplanation.innerHTML = formatExplanation(question.why) || 'No explanation available';
    }

    // Update navigation buttons
    this.updateReviewNavigation();

    // Show modal
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  private closeReviewModal(): void {
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private updateReviewNavigation(): void {
    if (!this.testResult) return;

    const prevQuestionBtn = document.getElementById('prevQuestionBtn') as HTMLButtonElement;
    const nextQuestionBtn = document.getElementById('nextQuestionBtn') as HTMLButtonElement;

    if (prevQuestionBtn) {
      prevQuestionBtn.disabled = this.currentReviewQuestion === 0;
    }
    if (nextQuestionBtn) {
      nextQuestionBtn.disabled = this.currentReviewQuestion === this.testResult.questions.length - 1;
    }
  }

  private navigateReviewQuestion(direction: number): void {
    if (!this.testResult) return;

    let nextQuestion = this.currentReviewQuestion + direction;
    
    // Find next question based on mode
    if (this.reviewMode === 'incorrect') {
      while (nextQuestion >= 0 && nextQuestion < this.testResult.questions.length) {
        const userAnswer = this.testResult.answers[nextQuestion];
        if (userAnswer && !evaluateAnswer(this.testResult.questions[nextQuestion], userAnswer)) {
          break;
        }
        nextQuestion += direction;
      }
    } else if (this.reviewMode === 'flagged') {
      while (nextQuestion >= 0 && nextQuestion < this.testResult.questions.length) {
        if (this.testResult.flagged.includes(nextQuestion)) {
          break;
        }
        nextQuestion += direction;
      }
    }

    // Ensure we stay within bounds
    if (nextQuestion >= 0 && nextQuestion < this.testResult.questions.length) {
      this.openReviewModal(nextQuestion);
    }
  }

  private setupBackButtonHandling(): void {
    // Prevent back button navigation
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('popstate', () => {
      // Show confirmation dialog
      const confirmNavigation = confirm(
        'Are you sure you want to leave this page? Your test results will be lost.'
      );
      
      if (confirmNavigation) {
        // User confirmed, navigate to home
        window.location.href = 'index.html';
      } else {
        // User cancelled, prevent navigation and restore state
        window.history.pushState(null, '', window.location.href);
      }
    });

    // Also handle beforeunload for page refresh/close
    window.addEventListener('beforeunload', (event) => {
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave this page? Your test results will be lost.';
      return event.returnValue;
    });
  }
}

// SummaryManager is exported and should be instantiated by the page script
