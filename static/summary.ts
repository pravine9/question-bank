// Summary Page Logic - Dedicated Implementation

import type { PracticeResult } from '@/types/question';
import { EMPTY_HISTORY } from '@/utils/history';
import { evaluateAnswer, getCorrectAnswerText } from '@/utils/answers';
import { questionRenderer } from './question_renderer';

export class SummaryManager {
  private testResult: PracticeResult | null = null;
  private currentReviewQuestion: number = 0;
  private reviewMode: 'all' | 'incorrect' | 'flagged' = 'all';

  constructor() {
    this.init();
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
    const scoreDisplay = document.getElementById('scoreDisplay') as HTMLElement;
    const percentageDisplay = document.getElementById('percentageDisplay') as HTMLElement;
    const correctCountEl = document.getElementById('correctCount') as HTMLElement;
    const incorrectCountEl = document.getElementById('incorrectCount') as HTMLElement;
    const unansweredCountEl = document.getElementById('unansweredCount') as HTMLElement;
    const passFailEl = document.getElementById('passFail') as HTMLElement;

    if (!tbody) return;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    tbody.innerHTML = '';

    for (let i = 0; i < this.testResult.questions.length; i++) {
      const question = this.testResult.questions[i];
      const userAnswer = this.testResult.answers[i] || 'No answer';
      const isCorrect =
        userAnswer !== 'No answer' && evaluateAnswer(question, userAnswer);
      const isFlagged = this.testResult.flagged.includes(i);
      
      if (isCorrect) {
        correctCount++;
      } else if (userAnswer !== 'No answer') {
        incorrectCount++;
      } else {
        unansweredCount++;
      }

      const row = tbody.insertRow();
      const statusClass = isCorrect ? 'correct' : (userAnswer !== 'No answer' ? 'incorrect' : 'unanswered');
      const statusText = isCorrect ? '✓ Correct' : (userAnswer !== 'No answer' ? '✗ Incorrect' : '○ Unanswered');
      const flagIcon = isFlagged ? ' ⚑' : '';
      
      row.innerHTML = `
        <td>
          <div class="question-number">${i + 1}</div>
          ${isFlagged ? '<div class="flag-indicator">⚑</div>' : ''}
        </td>
        <td class="answer-cell">${userAnswer}</td>
        <td class="correct-answer-cell">${getCorrectAnswerText(question)}</td>
        <td class="status-cell ${statusClass}">${statusText}${flagIcon}</td>
        <td>
          <button class="btn btn-sm review-question" data-question="${i}">
            <span class="review-icon">👁️</span> Review
          </button>
        </td>
      `;
    }

    const score = Math.round((correctCount / this.testResult.totalQuestions) * 100);
    const isPass = score >= 70; // 70% pass threshold

    // Update score display
    if (scoreDisplay) scoreDisplay.textContent = `${correctCount}/${this.testResult.totalQuestions}`;
    if (percentageDisplay) percentageDisplay.textContent = `${score}%`;
    if (correctCountEl) correctCountEl.textContent = correctCount.toString();
    if (incorrectCountEl) incorrectCountEl.textContent = incorrectCount.toString();
    if (unansweredCountEl) unansweredCountEl.textContent = unansweredCount.toString();
    
    // Update pass/fail indicator
    if (passFailEl) {
      passFailEl.textContent = isPass ? 'Pass' : 'Fail';
      passFailEl.className = `pass-fail ${isPass ? 'pass' : 'fail'}`;
    }

    // Add review handlers
    tbody.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.review-question') as HTMLButtonElement;
      if (btn) {
        const questionNum = parseInt(btn.dataset.question || '0');
        this.openReviewModal(questionNum);
      }
    });
  }

  private setupEventListeners(): void {
    const reviewWrongBtn = document.getElementById('reviewWrongBtn');
    const goHomeBtn = document.getElementById('goHomeBtn');
    const modalClose = document.querySelector('.modal-close');
    const closeReviewBtn = document.getElementById('closeReviewBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');

    if (reviewWrongBtn) {
      reviewWrongBtn.addEventListener('click', () => this.startReviewMode('incorrect'));
    }
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
        showInput: false // Don't show input in review mode
      });
    }

    // Show user's answer
    const reviewYourAnswer = document.getElementById('reviewYourAnswer');
    if (reviewYourAnswer) {
      if (question.is_calculation) {
        reviewYourAnswer.textContent = userAnswer !== 'No answer' ? userAnswer : 'No answer provided';
      } else {
        const selectedAnswer = question.answers.find(a => a.answer_number.toString() === userAnswer);
        reviewYourAnswer.textContent = selectedAnswer ? selectedAnswer.text : 'No answer provided';
      }
    }

    // Show correct answer
    const reviewCorrectAnswer = document.getElementById('reviewCorrectAnswer');
    if (reviewCorrectAnswer) {
      reviewCorrectAnswer.textContent = getCorrectAnswerText(question);
    }

    // Show explanation
    const reviewExplanation = document.getElementById('reviewExplanation');
    if (reviewExplanation) {
      reviewExplanation.innerHTML = question.why || 'No explanation available';
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
}

// SummaryManager is exported and should be instantiated by the page script
