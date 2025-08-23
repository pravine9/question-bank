import type { TimerStats } from '../src/types/question';
import { TIMER_CONSTANTS } from '../src/utils/constants';

interface TimerWarning {
  threshold: number;
  shown: boolean;
  type: 'warning' | 'danger';
  message: string;
}



// Timer Module - Countdown Timer for Practice Tests
export class PracticeTimer {
  private timePerQuestion: number;
  private totalTime: number;
  private remainingTime: number;
  private startTime: number;
  private timerElement: HTMLElement | null;
  private timerId: NodeJS.Timeout | null;
  private isPaused: boolean;
  private onTimeUp: () => void;
  private onWarning: () => void;
  private warnings: TimerWarning[];

  constructor(totalQuestions: number, onTimeUp?: () => void, onWarning?: () => void) {
    this.timePerQuestion = TIMER_CONSTANTS.TIME_PER_QUESTION;
    this.totalTime = totalQuestions * this.timePerQuestion;
    this.remainingTime = this.totalTime;
    this.startTime = Date.now();
    this.timerElement = null;
    this.timerId = null;
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

  private initializeTimer(): void {
    this.timerElement = document.querySelector('.timer');
    if (!this.timerElement) {
      console.warn('Timer element not found');
      return;
    }
    
    this.updateDisplay();
  }

  start(savedStartTime?: number): void {
    if (savedStartTime) {
      this.startTime = savedStartTime;
      const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
      this.remainingTime = Math.max(0, this.totalTime - elapsed);
    }
    
    this.isPaused = false;
    this.updateDisplay();
    
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 1000);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reset(): void {
    this.stop();
    this.remainingTime = this.totalTime;
    this.startTime = Date.now();
    this.resetWarnings();
    this.updateDisplay();
  }

  private tick(): void {
    if (this.remainingTime <= 0) {
      this.handleTimeUp();
      return;
    }

    this.remainingTime--;
    this.updateDisplay();
    this.checkWarnings();
  }

  private updateDisplay(): void {
    if (!this.timerElement) return;

    this.timerElement.textContent = this.formatTime(this.remainingTime);
    
    // Update color based on remaining time
    this.timerElement.className = 'timer';
    if (this.remainingTime <= TIMER_CONSTANTS.WARNING_THRESHOLDS.DANGER) {
      this.timerElement.classList.add('danger');
    } else if (this.remainingTime <= TIMER_CONSTANTS.WARNING_THRESHOLDS.WARNING) {
      this.timerElement.classList.add('warning');
    }
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return hours > 0 
      ? `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`
      : `${this.pad(minutes)}:${this.pad(secs)}`;
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private checkWarnings(): void {
    const remainingMinutes = Math.floor(this.remainingTime / 60);
    
    this.warnings.forEach(warning => {
      if (!warning.shown && remainingMinutes <= warning.threshold) {
        warning.shown = true;
        this.showWarning(warning.message, warning.type);
        this.onWarning();
      }
    });
  }

  private showWarning(message: string, type: 'warning' | 'danger'): void {
    const warningEl = document.createElement('div');
    warningEl.className = `timer-warning ${type}`;
    warningEl.textContent = message;
    
    document.body.appendChild(warningEl);
    
    // Auto-remove after warning display time
    setTimeout(() => {
      if (warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }, TIMER_CONSTANTS.WARNING_DISPLAY_TIME);
  }

  private resetWarnings(): void {
    this.warnings.forEach(warning => {
      warning.shown = false;
    });
  }

  private handleTimeUp(): void {
    this.remainingTime = 0;
    this.stop();
    this.updateDisplay();
    this.onTimeUp();
  }

  getRemainingTime(): number {
    return this.remainingTime;
  }

  getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getStats(): TimerStats {
    const allocatedTimeMs = this.totalTime * TIMER_CONSTANTS.MILLISECONDS_PER_SECOND;
    const actualTimeMs = this.getElapsedTime() * TIMER_CONSTANTS.MILLISECONDS_PER_SECOND;
    const remainingTimeMs = Math.max(0, allocatedTimeMs - actualTimeMs);
    const elapsedTime = this.getElapsedTime();
    
    return {
      allocatedTimeMs,
      allocatedTimeSeconds: this.totalTime,
      allocatedTimeMinutes: Math.floor(this.totalTime / TIMER_CONSTANTS.SECONDS_PER_MINUTE),
      actualTimeMs,
      actualTimeSeconds: elapsedTime,
      actualTimeMinutes: Math.floor(elapsedTime / TIMER_CONSTANTS.SECONDS_PER_MINUTE),
      timeUsedSeconds: elapsedTime,
      timeUsedMinutes: Math.floor(elapsedTime / TIMER_CONSTANTS.SECONDS_PER_MINUTE),
      remainingTimeSeconds: Math.floor(remainingTimeMs / TIMER_CONSTANTS.MILLISECONDS_PER_SECOND),
      remainingTimeMinutes: Math.floor(remainingTimeMs / TIMER_CONSTANTS.MILLISECONDS_PER_MINUTE),
      timeSavedSeconds: Math.floor(remainingTimeMs / TIMER_CONSTANTS.MILLISECONDS_PER_SECOND),
      timeSavedMinutes: Math.floor(remainingTimeMs / TIMER_CONSTANTS.MILLISECONDS_PER_MINUTE),
      efficiency: (actualTimeMs / allocatedTimeMs) * 100,
      isFinishedEarly: remainingTimeMs > 0,
      timeExpired: remainingTimeMs <= 0
    };
  }
}

// Timer Expiry Modal Class
export class TimerExpiryModal {
  private modal: HTMLDivElement;
  private onConfirm: () => void;

  constructor(onConfirm: () => void) {
    this.onConfirm = onConfirm;
    this.modal = this.createModal();
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'modal timer-expiry-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>⏰ Time's Up!</h2>
        <p>Your practice test time has expired. The test will now be submitted automatically.</p>
        <div class="modal-actions">
          <button class="btn btn-primary" id="confirmTimerExpiry">Continue to Results</button>
        </div>
      </div>
    `;

    const confirmBtn = modal.querySelector('#confirmTimerExpiry');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.hide();
        this.onConfirm();
      });
    }

    return modal;
  }

  show(): void {
    document.body.appendChild(this.modal);
    setTimeout(() => this.modal.classList.add('show'), 10);
  }

  hide(): void {
    this.modal.classList.remove('show');
    setTimeout(() => {
      if (this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
    }, 300);
  }
}
