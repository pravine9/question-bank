// Practice Mode Logic - Full Implementation

import type {
  Question,
  PracticeState,
  PracticeResult,
} from '@/types/question';
import { formatBankName } from '@/utils/bankNames';
import { EMPTY_HISTORY } from '@/utils/history';
import { evaluateAnswer, getCorrectAnswerText, formatExplanation } from '@/utils/answers';
import { banks } from './banks';
import { questionRenderer } from './question_renderer';

// Timer functionality removed - practice mode runs without time constraints

export class PracticeManager {
  private state: PracticeState | null = null;
  private isFinished: boolean = false;
  private sessionKey: string = '';

  constructor() {
    // Timer functionality removed
  }

  init(): void {
    const params = new URLSearchParams(window.location.search);
    const bank = params.get('bank');
    const numQuestions = parseInt(params.get('num') || '10');
    const resume = params.get('resume') === 'true';

    if (!bank || !banks || !banks[bank]) {
      alert('No valid question bank selected');
      window.location.href = 'index.html';
    return;
  }
  
    this.sessionKey = `practice_session_${bank}_${numQuestions}`;
    
    // Try to resume existing session
    if (resume || this.loadExistingSession()) {
      console.log('Resuming existing practice session');
    } else {
      this.setupPracticeSession(bank, numQuestions);
    }
    
    this.setupEventListeners();
    this.renderCurrentQuestion();
    
    // Add auto-save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveSession();
    });
  }

  private setupPracticeSession(bank: string, numQuestions: number): void {
    const bankData = banks[bank];
    if (!bankData || !bankData.length) {
      alert('Question bank is empty');
    return;
  }
  
    // Validate numQuestions
    if (numQuestions <= 0 || numQuestions > 100) {
      alert('Invalid number of questions. Using default of 10.');
      numQuestions = 10;
    }

    // Flatten all questions from all files in the bank
    const allQuestions: Question[] = [];
    bankData.forEach((questionArray: Question[]) => {
      allQuestions.push(...questionArray);
    });

    // Shuffle and select questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(numQuestions, shuffled.length));

    this.state = {
      currentQuestion: 0,
      questions: selectedQuestions,
      answers: {},
      flagged: new Set(),
      startTime: Date.now(),
      bank,
      totalQuestions: selectedQuestions.length
    };
  
  // Update UI
    const titleEl = document.querySelector('.test-title');
    if (titleEl) {
      titleEl.textContent = `${formatBankName(bank)} - ${selectedQuestions.length} Questions`;
    }

    this.setupNavigation();
    this.updateProgress();
  }

  private setupNavigation(): void {
    if (!this.state) {return;}

    const nav = document.querySelector('.sidebar .nav');
    if (!nav) {return;}

    nav.innerHTML = '';
    for (let i = 0; i < this.state.totalQuestions; i++) {
      const li = document.createElement('li');
      li.dataset.question = i.toString();
      li.textContent = (i + 1).toString();
      nav.appendChild(li);
    }

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest('li') as HTMLLIElement;
      if (li && li.dataset.question) {
        const questionNum = parseInt(li.dataset.question);
        this.goToQuestion(questionNum);
      }
    });
  }

  private setupEventListeners(): void {
    // Navigation buttons
    const backBtn = document.querySelector('.back-btn') as HTMLButtonElement;
    const nextBtn = document.querySelector('.next-btn') as HTMLButtonElement;
    const flagBtn = document.querySelector('.flag-current-btn') as HTMLButtonElement;
    const finishBtn = document.querySelector('.finish-btn') as HTMLButtonElement;
    const checkBtn = document.getElementById('checkBtn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.addEventListener('click', () => this.previousQuestion());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }
    if (flagBtn) {
      flagBtn.addEventListener('click', () => this.toggleFlag());
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.finishTest());
    }
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkAnswer());
    }

    // Answer selection handling
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'answer' || target.id === 'calcInput') {
        this.saveAnswer();
      }
    });

    // Review status modal
    const reviewBtn = document.querySelector('.review-status-btn') as HTMLButtonElement;
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.showReviewModal());
    }

    const modalClose = document.querySelector('.modal-close') as HTMLButtonElement;
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideReviewModal());
    }
  }

  private renderCurrentQuestion(): void {
    if (!this.state || this.state.currentQuestion >= this.state.questions.length) {return;}

    const question = this.state.questions[this.state.currentQuestion];
    
    // Update question number
    const qNumEl = document.querySelector('.q-number');
    if (qNumEl) {
      qNumEl.textContent = `Question ${this.state.currentQuestion + 1}`;
    }

    // Render question using global renderer
    if (questionRenderer) {
      questionRenderer.renderQuestion(question, {
        text: '#qText',
        title: '#qTitle',
        img: '#qImg',
        options: '#answerOptions',
        input: '.calculator',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation'
      });
    }

    // Restore saved answer
    const savedAnswer = this.state.answers[this.state.currentQuestion];
    if (savedAnswer) {
      if (question.is_calculation) {
        const input = document.getElementById('calcInput') as HTMLInputElement;
        if (input) {input.value = savedAnswer;}
      } else {
        const radio = document.querySelector(`input[name="answer"][value="${savedAnswer}"]`) as HTMLInputElement;
        if (radio) {
          radio.checked = true;
          // Also update the visual selected state
          const label = radio.closest('label');
          if (label) {
            label.classList.add('selected');
          }
        }
      }
    }

    // Update flag icon visibility
    const questionFlag = document.getElementById('questionFlag');
    if (questionFlag) {
      if (this.state.flagged.has(this.state.currentQuestion)) {
        questionFlag.style.display = 'inline';
      } else {
        questionFlag.style.display = 'none';
      }
    }

    this.updateNavigation();
    this.updateProgress();
    this.saveSession(); // Auto-save on question change
  }

  private saveAnswer(): void {
    if (!this.state) {return;}

    const question = this.state.questions[this.state.currentQuestion];
    let answer = '';

    if (question.is_calculation) {
      const input = document.getElementById('calcInput') as HTMLInputElement;
      answer = input?.value || '';
    } else {
      const selected = document.querySelector('input[name="answer"]:checked') as HTMLInputElement;
      answer = selected?.value || '';
    }

    if (answer) {
      this.state.answers[this.state.currentQuestion] = answer;
      this.updateNavigation();
      this.updateProgress();
      this.saveSession(); // Auto-save when answer changes
    } else {
      // If answer is empty, remove it from answers
      delete this.state.answers[this.state.currentQuestion];
      this.updateNavigation();
      this.updateProgress();
      this.saveSession(); // Auto-save when answer changes
    }
  }

  private updateProgress(): void {
    if (!this.state) {return;}

    const progressBar = document.querySelector('.progress .bar') as HTMLElement;
    const answeredCount = Object.keys(this.state.answers).length;
    const progress = (answeredCount / this.state.totalQuestions) * 100;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  private updateNavigation(): void {
    if (!this.state) {return;}

    // Update navigation buttons
    const backBtn = document.querySelector('.back-btn') as HTMLButtonElement;
    const nextBtn = document.querySelector('.next-btn') as HTMLButtonElement;
    const flagBtn = document.querySelector('.flag-current-btn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.disabled = this.state.currentQuestion === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.state.currentQuestion === this.state.totalQuestions - 1;
    }
    if (flagBtn) {
      flagBtn.classList.toggle('active', this.state.flagged.has(this.state.currentQuestion));
    }

    // Update sidebar navigation
    const navItems = document.querySelectorAll('.sidebar .nav li');
    navItems.forEach((item, index) => {
      const li = item as HTMLLIElement;
      li.classList.remove('active', 'answered', 'flagged');
      
      // Set base content with flag icon if flagged
      const questionNumber = index + 1;
      if (this.state!.flagged.has(index)) {
        li.innerHTML = `${questionNumber} <span class="flag-btn">⚑</span>`;
        li.classList.add('flagged');
      } else {
        li.textContent = questionNumber.toString();
      }
      
      if (index === this.state!.currentQuestion) {
        li.classList.add('active');
      }
      if (this.state!.answers[index]) {
        li.classList.add('answered');
      }
    });
  }

  private goToQuestion(questionNum: number): void {
    if (!this.state || questionNum < 0 || questionNum >= this.state.totalQuestions) {return;}

    this.state.currentQuestion = questionNum;
    this.renderCurrentQuestion();
  }

  private previousQuestion(): void {
    if (!this.state || this.state.currentQuestion <= 0) {return;}
    this.goToQuestion(this.state.currentQuestion - 1);
  }

  private nextQuestion(): void {
    if (!this.state || this.state.currentQuestion >= this.state.totalQuestions - 1) {return;}
    this.goToQuestion(this.state.currentQuestion + 1);
  }

  private toggleFlag(): void {
    if (!this.state) {return;}

    const questionNum = this.state.currentQuestion;
    const questionFlag = document.getElementById('questionFlag');
    
    if (this.state.flagged.has(questionNum)) {
      this.state.flagged.delete(questionNum);
      if (questionFlag) {
        questionFlag.style.display = 'none';
      }
    } else {
      this.state.flagged.add(questionNum);
      if (questionFlag) {
        questionFlag.style.display = 'inline';
      }
    }

    this.updateNavigation();
    this.saveSession(); // Auto-save when flag changes
  }

  private checkAnswer(): void {
    if (!this.state) {return;}

    const question = this.state.questions[this.state.currentQuestion];
    const userAnswer = this.state.answers[this.state.currentQuestion];

    if (!userAnswer) {
      alert('Please select an answer first');
      return;
    }

    const isCorrect = evaluateAnswer(question, userAnswer);
    this.revealAnswer(question, isCorrect);
  }

  private revealAnswer(question: Question, isCorrect: boolean): void {
    const feedbackEl = document.getElementById('feedback');
    const answerEl = document.getElementById('answer');
    const explanationEl = document.getElementById('explanation');

    if (feedbackEl) {
      feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
      feedbackEl.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
    }

    if (answerEl) {
      const correctAnswerText = getCorrectAnswerText(question);
      answerEl.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswerText}${question.answer_unit ? ' ' + question.answer_unit : ''}`;
      answerEl.style.display = 'block';
    }

    if (explanationEl && question.why) {
      explanationEl.innerHTML = `<strong>Explanation:</strong> ${formatExplanation(question.why)}`;
      explanationEl.style.display = 'block';
    }
  }

  private finishTest(): void {
    if (!this.state) {return;}

    const answeredCount = Object.keys(this.state.answers).length;
    const unanswered = this.state.totalQuestions - answeredCount;

    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered questions. Are you sure you want to finish the test?`
      );
      if (!confirm) {return;}
    }

    this.calculateResults();
    this.clearSession(); // Clear session when test is completed
    this.showSummary();
  }

  // Timer functionality removed - handleTimeUp method no longer needed

  private calculateResults(): void {
    if (!this.state) {return;}

    let correctCount = 0;
    const duration = Math.floor((Date.now() - this.state.startTime) / 60000); // Calculate elapsed minutes

    // Check answers
    for (let i = 0; i < this.state.questions.length; i++) {
      const question = this.state.questions[i];
      const userAnswer = this.state.answers[i];
      
      if (userAnswer && evaluateAnswer(question, userAnswer)) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / this.state.totalQuestions) * 100);
    const resultId = Date.now().toString();

    // Save complete test result to history
    this.savePracticeResult({
      id: resultId,
      bank: this.state.bank,
      totalQuestions: this.state.totalQuestions,
      correctAnswers: correctCount,
      score,
      duration,
      date: new Date().toISOString(),
      flaggedQuestions: this.state.flagged.size,
      questions: this.state.questions,
      answers: this.state.answers,
      flagged: Array.from(this.state.flagged)
    } as PracticeResult);

    this.isFinished = true;
    
    // Redirect to summary page
    window.location.href = `summary.html?resultId=${resultId}`;
  }

  private showSummary(): void {
    // This method is no longer needed as we redirect to a separate summary page
    // The summary functionality is now handled by summary.ts
  }


  private showReviewModal(): void {
    if (!this.state) {return;}

    const modal = document.getElementById('reviewModal');
    if (!modal) {return;}

    // Setup filter functionality
    this.setupFilterHandlers();

    // Generate question grid
    this.updateQuestionGrid();

    modal.style.display = 'block';
  }

  private setupFilterHandlers(): void {
    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;
    const clearBtn = document.querySelector('.clear-filter-btn') as HTMLButtonElement;

    if (filterUnattempted) {
      filterUnattempted.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (filterAttempted) {
      filterAttempted.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (filterFlagged) {
      filterFlagged.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  private clearFilters(): void {
    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;

    if (filterUnattempted) filterUnattempted.checked = true;
    if (filterAttempted) filterAttempted.checked = true;
    if (filterFlagged) filterFlagged.checked = true;

    this.updateQuestionGrid();
  }

  private updateQuestionGrid(): void {
    if (!this.state) {return;}

    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;

    const gridEl = document.getElementById('questionGridReview');
    if (!gridEl) {return;}

    gridEl.innerHTML = '';

    for (let i = 0; i < this.state.totalQuestions; i++) {
      const isAttempted = !!this.state.answers[i];
      const isFlagged = this.state.flagged.has(i);
      const isCurrent = i === this.state.currentQuestion;

      // Check if question should be shown based on filters
      let shouldShow = false;
      if (isAttempted && filterAttempted?.checked) shouldShow = true;
      if (!isAttempted && filterUnattempted?.checked) shouldShow = true;
      if (isFlagged && filterFlagged?.checked) shouldShow = true;

      if (!shouldShow) continue;

      const btn = document.createElement('button');
      btn.className = 'grid-item';
      btn.textContent = (i + 1).toString();
      btn.dataset.question = i.toString();

      if (isAttempted) btn.classList.add('attempted');
      if (isFlagged) btn.classList.add('flagged');
      if (isCurrent) btn.classList.add('current');

      btn.addEventListener('click', () => {
        this.goToQuestion(i);
        this.hideReviewModal();
      });

      gridEl.appendChild(btn);
    }
  }

  private hideReviewModal(): void {
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private savePracticeResult(result: PracticeResult): void {
    try {
      const existingHistory = localStorage.getItem('practice_history');
      const history = existingHistory ? JSON.parse(existingHistory) : { ...EMPTY_HISTORY };
      
      history.results.unshift(result);
      
      // Keep only last 50 results
      if (history.results.length > 50) {
        history.results = history.results.slice(0, 50);
      }
      
      localStorage.setItem('practice_history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save practice result:', error);
    }
  }

  private saveSession(): void {
    if (!this.state || this.isFinished) {
      return;
    }
    
    try {
      const sessionData = {
        currentQuestion: this.state.currentQuestion,
        answers: this.state.answers,
        flagged: Array.from(this.state.flagged),
        startTime: this.state.startTime,
        bank: this.state.bank,
        totalQuestions: this.state.totalQuestions,
        questions: this.state.questions.map((q: Question) => q.id), // Store only IDs to save space
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      console.log('Session saved:', this.sessionKey);
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  private loadExistingSession(): boolean {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      if (!sessionData) {
        return false;
      }
      
      const data = JSON.parse(sessionData);
      
      // Check if session is too old (more than 24 hours)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(this.sessionKey);
        return false;
      }
      
      // Reconstruct questions from IDs
    const bankData = banks[data.bank];
      const allQuestions: Question[] = [];
      bankData.forEach((questionArray: Question[]) => {
        allQuestions.push(...questionArray);
      });
      
        const questions = data.questions
          .map((id: number) => allQuestions.find((q: Question) => q.id === id))
          .filter((q: Question | undefined): q is Question => q !== undefined);
      
      if (questions.length !== data.totalQuestions) {
        console.warn('Question mismatch, starting new session');
        return false;
      }
      
      this.state = {
        currentQuestion: data.currentQuestion,
        questions: questions,
        answers: data.answers || {},
        flagged: new Set(data.flagged || []),
        startTime: data.startTime,
        bank: data.bank,
        totalQuestions: data.totalQuestions
      };
      
      // Update UI
      const titleEl = document.querySelector('.test-title');
      if (titleEl) {
        titleEl.textContent = `${formatBankName(data.bank)} - ${questions.length} Questions`;
      }
      
      this.setupNavigation();
      console.log('Session loaded successfully');
      return true;
    } catch (error) {
      console.warn('Failed to load session:', error);
      return false;
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem(this.sessionKey);
      console.log('Session cleared:', this.sessionKey);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }
}

// Timer class removed - no longer needed
