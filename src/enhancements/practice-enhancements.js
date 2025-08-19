// Practice Test Enhancements - Maintaining Real Exam Format
class PracticeTestEnhancements {
  constructor() {
    this.currentQuestionIndex = 0;
    this.totalQuestions = 0;
    this.answeredQuestions = new Set();
    this.flaggedQuestions = new Set();
    this.startTime = Date.now();
    this.timerInterval = null;
    this.isTestActive = false;
    
    this.initializeEnhancements();
  }

  initializeEnhancements() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
    this.setupTimerWarnings();
  }

  setupEventListeners() {
    // Image zoom functionality
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('image-zoom-btn')) {
        this.openImageModal(e.target.closest('.question-image-container').querySelector('img'));
      }
    });

    // Question grid navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('question-number')) {
        const questionIndex = parseInt(e.target.dataset.index);
        this.navigateToQuestion(questionIndex);
      }
    });

    // Flag button functionality
    document.addEventListener('click', (e) => {
      if (e.target.closest('.flag-btn')) {
        this.toggleFlag();
      }
    });

    // Enhanced summary actions
    document.addEventListener('click', (e) => {
      if (e.target.id === 'downloadResults') {
        this.downloadResults();
      } else if (e.target.id === 'newTest') {
        this.startNewTest();
      } else if (e.target.id === 'goHome') {
        this.goHome();
      }
    });

    // Prevent accidental navigation
    window.addEventListener('beforeunload', (e) => {
      if (this.isTestActive && !this.isTestFinished) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
        return e.returnValue;
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.isTestActive) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateNext();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this.toggleFlag();
          break;
        case 'Enter':
          e.preventDefault();
          this.checkAnswer();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          this.selectOption(parseInt(e.key) - 1);
          break;
      }
    });
  }

  setupAccessibility() {
    // Add ARIA labels and roles
    const questionArea = document.querySelector('.question-area');
    if (questionArea) {
      questionArea.setAttribute('role', 'main');
      questionArea.setAttribute('aria-label', 'Question content area');
    }

    // Add live regions for screen readers
    this.createLiveRegion('timer', 'Timer updates');
    this.createLiveRegion('progress', 'Progress updates');
    this.createLiveRegion('feedback', 'Answer feedback');
  }

  createLiveRegion(id, label) {
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-label', label);
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
  }

  setupTimerWarnings() {
    // Timer warning thresholds (in minutes)
    const warnings = [
      { threshold: 30, class: 'warning', message: '30 minutes remaining' },
      { threshold: 15, class: 'warning', message: '15 minutes remaining' },
      { threshold: 5, class: 'danger', message: '5 minutes remaining - Final warning!' }
    ];

    this.timerWarnings = warnings;
  }

  // Enhanced timer functionality
  updateTimer(remainingTime) {
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    const hoursEl = document.querySelector('.timer-hours');
    const minutesEl = document.querySelector('.timer-minutes');
    const secondsEl = document.querySelector('.timer-seconds');

    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

    // Check for warnings
    const totalMinutes = Math.floor(remainingTime / 60);
    this.checkTimerWarnings(totalMinutes);

    // Update live region for screen readers
    this.updateLiveRegion('timer', `${hours}:${minutes}:${seconds} remaining`);
  }

  checkTimerWarnings(totalMinutes) {
    const timerDisplay = document.querySelector('.timer-display');
    if (!timerDisplay) return;

    for (const warning of this.timerWarnings) {
      if (totalMinutes <= warning.threshold && !warning.shown) {
        timerDisplay.classList.add(warning.class);
        this.showNotification(warning.message, warning.class);
        warning.shown = true;
        break;
      }
    }
  }

  // Enhanced progress tracking
  updateProgress(currentIndex, totalQuestions) {
    const progress = (currentIndex / totalQuestions) * 100;
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-percentage');
    const currentQuestionEl = document.querySelector('.current-question');
    const totalQuestionsEl = document.querySelector('.total-questions');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    if (currentQuestionEl) currentQuestionEl.textContent = currentIndex + 1;
    if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;

    this.updateLiveRegion('progress', `Question ${currentIndex + 1} of ${totalQuestions}`);
  }

  // Enhanced question grid
  updateQuestionGrid(questions, currentIndex, answeredQuestions, flaggedQuestions) {
    const grid = document.querySelector('.question-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.totalQuestions = questions.length;

    questions.forEach((question, index) => {
      const questionNumber = document.createElement('div');
      questionNumber.className = 'question-number';
      questionNumber.textContent = index + 1;
      questionNumber.dataset.index = index;
      questionNumber.setAttribute('role', 'button');
      questionNumber.setAttribute('tabindex', '0');
      questionNumber.setAttribute('aria-label', `Question ${index + 1}`);

      // Set status classes
      if (index === currentIndex) {
        questionNumber.classList.add('current');
        questionNumber.setAttribute('aria-current', 'true');
      } else if (answeredQuestions.has(index)) {
        questionNumber.classList.add('answered');
        questionNumber.setAttribute('aria-label', `Question ${index + 1} - Answered`);
      } else {
        questionNumber.classList.add('unanswered');
      }

      if (flaggedQuestions.has(index)) {
        questionNumber.classList.add('flagged');
        questionNumber.setAttribute('aria-label', `${questionNumber.getAttribute('aria-label')} - Flagged`);
      }

      grid.appendChild(questionNumber);
    });

    this.updateSidebarStats(answeredQuestions.size, flaggedQuestions.size);
  }

  updateSidebarStats(answeredCount, flaggedCount) {
    const answeredEl = document.querySelector('.answered-count');
    const flaggedEl = document.querySelector('.flagged-count');

    if (answeredEl) answeredEl.textContent = answeredCount;
    if (flaggedEl) flaggedEl.textContent = flaggedCount;
  }

  // Enhanced question type display
  updateQuestionType(question) {
    const calculationType = document.querySelector('.calculation-type');
    const mcqType = document.querySelector('.mcq-type');

    if (calculationType) calculationType.style.display = 'none';
    if (mcqType) mcqType.style.display = 'none';

    if (question.is_calculation) {
      if (calculationType) calculationType.style.display = 'flex';
    } else {
      if (mcqType) mcqType.style.display = 'flex';
    }
  }

  // Enhanced image handling
  updateQuestionImage(imageSrc) {
    const container = document.getElementById('qImgContainer');
    const img = document.getElementById('qImg');

    if (imageSrc && img) {
      img.src = imageSrc;
      img.alt = 'Question image';
      container.style.display = 'block';
      
      // Add loading state
      img.onload = () => {
        img.style.opacity = '1';
      };
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
    } else if (container) {
      container.style.display = 'none';
    }
  }

  openImageModal(imgElement) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    if (modal && modalImg) {
      modalImg.src = imgElement.src;
      modalImg.alt = imgElement.alt;
      modal.style.display = 'flex';
    }
  }

  // Enhanced flagging system
  toggleFlag() {
    const flagBtn = document.querySelector('.flag-btn');
    const isFlagged = flagBtn.classList.contains('flagged');

    if (isFlagged) {
      flagBtn.classList.remove('flagged');
      this.flaggedQuestions.delete(this.currentQuestionIndex);
    } else {
      flagBtn.classList.add('flagged');
      this.flaggedQuestions.add(this.currentQuestionIndex);
    }

    // Update question grid
    this.updateQuestionGrid(
      window.questions || [],
      this.currentQuestionIndex,
      this.answeredQuestions,
      this.flaggedQuestions
    );

    // Update live region
    this.updateLiveRegion('feedback', isFlagged ? 'Question unflagged' : 'Question flagged for review');
  }

  // Enhanced answer selection
  selectOption(optionIndex) {
    const options = document.querySelectorAll('.option-btn');
    if (optionIndex >= 0 && optionIndex < options.length) {
      options.forEach(option => option.classList.remove('selected'));
      options[optionIndex].classList.add('selected');
      options[optionIndex].focus();
    }
  }

  // Enhanced feedback system
  showFeedback(isCorrect, message) {
    const feedbackArea = document.getElementById('feedback');
    const feedbackContent = feedbackArea.querySelector('.feedback-content');

    if (feedbackArea && feedbackContent) {
      feedbackArea.className = `feedback-area ${isCorrect ? 'correct' : 'incorrect'}`;
      feedbackContent.textContent = message;
      feedbackArea.style.display = 'block';

      // Update live region
      this.updateLiveRegion('feedback', message);
    }
  }

  // Enhanced navigation
  navigateToQuestion(index) {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentQuestionIndex = index;
      
      // Update UI
      this.updateProgress(index, this.totalQuestions);
      this.updateQuestionGrid(
        window.questions || [],
        index,
        this.answeredQuestions,
        this.flaggedQuestions
      );

      // Trigger question render (this will be handled by the main practice.js)
      if (window.renderQuestion) {
        window.renderQuestion();
      }
    }
  }

  navigatePrevious() {
    if (this.currentQuestionIndex > 0) {
      this.navigateToQuestion(this.currentQuestionIndex - 1);
    }
  }

  navigateNext() {
    if (this.currentQuestionIndex < this.totalQuestions - 1) {
      this.navigateToQuestion(this.currentQuestionIndex + 1);
    }
  }

  // Enhanced summary display
  showEnhancedSummary(summaryData) {
    const summarySection = document.querySelector('.exam-summary');
    if (!summarySection) return;

    // Update summary stats
    const finalScore = document.getElementById('finalScore');
    const correctAnswers = document.getElementById('correctAnswers');
    const totalQuestions = document.getElementById('totalQuestions');
    const timeTaken = document.getElementById('timeTaken');

    if (finalScore) finalScore.textContent = summaryData.score || 0;
    if (correctAnswers) correctAnswers.textContent = summaryData.correctCount || 0;
    if (totalQuestions) totalQuestions.textContent = summaryData.totalQuestions || 0;
    if (timeTaken) timeTaken.textContent = this.formatTime(summaryData.elapsed || 0);

    // Show summary
    summarySection.style.display = 'block';
    document.querySelector('.main').style.display = 'none';
    document.querySelector('.exam-footer').style.display = 'none';
  }

  // Enhanced results download
  downloadResults() {
    const results = this.generateResultsData();
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gphc-practice-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateResultsData() {
    return {
      testDate: new Date().toISOString(),
      bank: window.bank || 'Unknown',
      totalQuestions: this.totalQuestions,
      answeredQuestions: Array.from(this.answeredQuestions),
      flaggedQuestions: Array.from(this.flaggedQuestions),
      duration: Date.now() - this.startTime,
      // Add more data as needed
    };
  }

  // Utility functions
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  updateLiveRegion(id, message) {
    const region = document.getElementById(id);
    if (region) {
      region.textContent = message;
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;

    // Set background color based on type
    switch (type) {
      case 'warning':
        notification.style.backgroundColor = '#f59e0b';
        break;
      case 'danger':
        notification.style.backgroundColor = '#ef4444';
        break;
      default:
        notification.style.backgroundColor = '#3b82f6';
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Test lifecycle management
  startTest() {
    this.isTestActive = true;
    this.startTime = Date.now();
    this.answeredQuestions.clear();
    this.flaggedQuestions.clear();
  }

  finishTest() {
    this.isTestActive = false;
    this.isTestFinished = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startNewTest() {
    window.location.reload();
  }

  goHome() {
    window.location.href = 'index.html';
  }
}

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.practiceEnhancements = new PracticeTestEnhancements();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
