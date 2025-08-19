// Timer Module - Countdown Timer for Practice Tests
class PracticeTimer {
  constructor(totalQuestions, onTimeUp, onWarning) {
    this.totalQuestions = totalQuestions;
    this.timePerQuestion = 180; // 3 minutes = 180 seconds
    this.totalTime = totalQuestions * this.timePerQuestion;
    this.remainingTime = this.totalTime;
    this.startTime = Date.now();
    this.actualStartTime = this.startTime;
    this.timerElement = null;
    this.timerId = null;
    this.isRunning = false;
    this.isPaused = false;
    this.onTimeUp = onTimeUp || (() => {});
    this.onWarning = onWarning || (() => {});
    
    // Warning thresholds in minutes
    this.warnings = [
      { threshold: 10, shown: false, type: 'warning', message: '10 minutes remaining' },
      { threshold: 5, shown: false, type: 'warning', message: '5 minutes remaining' },
      { threshold: 1, shown: false, type: 'danger', message: '1 minute remaining - Final warning!' }
    ];
    
    this.initializeTimer();
  }

  initializeTimer() {
    this.timerElement = document.querySelector('.timer');
    if (!this.timerElement) {
      console.warn('Timer element not found');
      return;
    }
    
    this.updateDisplay();
  }

  start(savedStartTime = null) {
    if (savedStartTime) {
      this.startTime = savedStartTime;
      this.actualStartTime = savedStartTime;
      const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
      this.remainingTime = Math.max(0, this.totalTime - elapsed);
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.updateDisplay();
    
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 1000);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reset() {
    this.stop();
    this.remainingTime = this.totalTime;
    this.startTime = Date.now();
    this.actualStartTime = this.startTime;
    this.resetWarnings();
    this.updateDisplay();
  }

  tick() {
    if (this.remainingTime <= 0) {
      this.handleTimeUp();
      return;
    }

    this.remainingTime--;
    this.updateDisplay();
    this.checkWarnings();
  }

  updateDisplay() {
    if (!this.timerElement) return;

    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;
    
    const timeString = hours > 0 
      ? `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
      : `${this.pad(minutes)}:${this.pad(seconds)}`;
    
    this.timerElement.textContent = timeString;
    
    // Update timer styling based on remaining time
    this.updateTimerStyling();
  }

  updateTimerStyling() {
    if (!this.timerElement) return;

    const minutes = Math.floor(this.remainingTime / 60);
    
    // Remove existing warning classes
    this.timerElement.classList.remove('timer-warning', 'timer-danger', 'timer-critical');
    
    if (minutes <= 1) {
      this.timerElement.classList.add('timer-critical');
    } else if (minutes <= 5) {
      this.timerElement.classList.add('timer-danger');
    } else if (minutes <= 10) {
      this.timerElement.classList.add('timer-warning');
    }
  }

  checkWarnings() {
    const minutes = Math.floor(this.remainingTime / 60);
    
    for (const warning of this.warnings) {
      if (minutes <= warning.threshold && !warning.shown) {
        warning.shown = true;
        this.onWarning(warning);
        break;
      }
    }
  }

  handleTimeUp() {
    this.remainingTime = 0;
    this.stop();
    this.updateDisplay();
    this.onTimeUp();
  }

  resetWarnings() {
    this.warnings.forEach(warning => {
      warning.shown = false;
    });
  }

  pad(num) {
    return num.toString().padStart(2, '0');
  }

  // Get timer statistics
  getStats() {
    const currentTime = Date.now();
    const totalElapsedMs = currentTime - this.actualStartTime;
    const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);
    const allocatedTime = this.totalTime; // in seconds
    const actualTime = Math.min(totalElapsedSeconds, allocatedTime);
    const timeUsed = allocatedTime - this.remainingTime;
    
    return {
      allocatedTimeMs: allocatedTime * 1000,
      allocatedTimeSeconds: allocatedTime,
      allocatedTimeMinutes: Math.floor(allocatedTime / 60),
      actualTimeMs: totalElapsedMs,
      actualTimeSeconds: totalElapsedSeconds,
      actualTimeMinutes: Math.floor(totalElapsedSeconds / 60),
      timeUsedSeconds: timeUsed,
      timeUsedMinutes: Math.floor(timeUsed / 60),
      remainingTimeSeconds: this.remainingTime,
      remainingTimeMinutes: Math.floor(this.remainingTime / 60),
      timeSavedSeconds: Math.max(0, this.remainingTime),
      timeSavedMinutes: Math.max(0, Math.floor(this.remainingTime / 60)),
      efficiency: Math.round((timeUsed / allocatedTime) * 100),
      isFinishedEarly: this.remainingTime > 0 && !this.isRunning,
      timeExpired: this.remainingTime === 0 && !this.isRunning
    };
  }

  // Format time for display
  formatTime(seconds, includeHours = false) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (includeHours && hours > 0) {
      return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`;
    }
    return `${this.pad(minutes)}:${this.pad(secs)}`;
  }

  // Get serializable state for saving
  getState() {
    return {
      totalQuestions: this.totalQuestions,
      totalTime: this.totalTime,
      remainingTime: this.remainingTime,
      startTime: this.startTime,
      actualStartTime: this.actualStartTime,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      warnings: this.warnings.map(w => ({ ...w }))
    };
  }

  // Restore state from saved data
  setState(state) {
    this.totalQuestions = state.totalQuestions || this.totalQuestions;
    this.totalTime = state.totalTime || this.totalTime;
    this.remainingTime = state.remainingTime || this.remainingTime;
    this.startTime = state.startTime || this.startTime;
    this.actualStartTime = state.actualStartTime || this.actualStartTime;
    this.isRunning = state.isRunning || false;
    this.isPaused = state.isPaused || false;
    
    if (state.warnings && Array.isArray(state.warnings)) {
      this.warnings = state.warnings.map(w => ({ ...w }));
    }
    
    this.updateDisplay();
  }
}

// Timer Warning/Notification System
class TimerNotification {
  static show(message, type = 'info', duration = 3000) {
    // Remove existing notifications of the same type
    const existing = document.querySelectorAll(`.timer-notification.notification-${type}`);
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `timer-notification notification-${type}`;
    notification.textContent = message;
    
    // Styling
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;

    // Set colors based on type
    switch (type) {
      case 'warning':
        notification.style.backgroundColor = '#f59e0b';
        notification.style.borderLeft = '4px solid #d97706';
        break;
      case 'danger':
      case 'critical':
        notification.style.backgroundColor = '#ef4444';
        notification.style.borderLeft = '4px solid #dc2626';
        break;
      case 'success':
        notification.style.backgroundColor = '#10b981';
        notification.style.borderLeft = '4px solid #059669';
        break;
      default:
        notification.style.backgroundColor = '#3b82f6';
        notification.style.borderLeft = '4px solid #2563eb';
    }

    document.body.appendChild(notification);

    // Auto-remove
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
}

// Timer Expiry Modal
class TimerExpiryModal {
  constructor(onFinish) {
    this.onFinish = onFinish || (() => {});
    this.modal = null;
    this.createModal();
  }

  createModal() {
    // Remove existing modal if any
    const existing = document.getElementById('timerExpiryModal');
    if (existing) {
      existing.remove();
    }

    this.modal = document.createElement('div');
    this.modal.id = 'timerExpiryModal';
    this.modal.className = 'timer-modal-overlay';
    
    this.modal.innerHTML = `
      <div class="timer-modal-content">
        <div class="timer-modal-header">
          <div class="timer-modal-icon">⏰</div>
          <h2>Time's Up!</h2>
        </div>
        <div class="timer-modal-body">
          <p>The practice test time has expired.</p>
          <p>Your answers have been automatically submitted for review.</p>
        </div>
        <div class="timer-modal-footer">
          <button class="btn btn-primary" id="viewResults">View Results</button>
        </div>
      </div>
    `;
    
    // Styling
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .timer-modal-content {
        background: white;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: scaleIn 0.3s ease-out;
      }
      
      .timer-modal-header {
        text-align: center;
        padding: 30px 30px 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .timer-modal-icon {
        font-size: 48px;
        margin-bottom: 10px;
      }
      
      .timer-modal-header h2 {
        margin: 0;
        color: #1f2937;
        font-size: 24px;
        font-weight: 700;
      }
      
      .timer-modal-body {
        padding: 20px 30px;
        text-align: center;
        color: #6b7280;
        line-height: 1.6;
      }
      
      .timer-modal-footer {
        padding: 20px 30px 30px;
        text-align: center;
      }
      
      .timer-modal-footer .btn {
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .timer-modal-footer .btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .timer-modal-footer .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { 
          opacity: 0;
          transform: scale(0.9) translateY(-10px);
        }
        to { 
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
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
      
      /* Timer styling classes */
      .timer-warning {
        color: #f59e0b !important;
        font-weight: 600;
      }
      
      .timer-danger {
        color: #ef4444 !important;
        font-weight: 700;
        animation: pulse 1s infinite;
      }
      
      .timer-critical {
        color: #dc2626 !important;
        font-weight: 700;
        animation: pulse 0.5s infinite;
        background: rgba(239, 68, 68, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    
    if (!document.getElementById('timerModalStyles')) {
      style.id = 'timerModalStyles';
      document.head.appendChild(style);
    }

    document.body.appendChild(this.modal);
    
    // Add event listener
    const viewResultsBtn = this.modal.querySelector('#viewResults');
    viewResultsBtn.addEventListener('click', () => {
      this.close();
      this.onFinish();
    });
  }

  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
    }
  }

  close() {
    if (this.modal) {
      this.modal.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
      }, 300);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PracticeTimer, TimerNotification, TimerExpiryModal };
}
