// Timer Module - Practice Test Countdown Timer
// Uses EasyTimer.js for reliable countdown functionality

import Timer from 'easytimer.js';

export interface TimerWarning {
  timeLeft: number;
  message: string;
}

export interface TimerCallbacks {
  onUpdate?: (timeValues: any) => void;
  onWarning?: (warning: TimerWarning) => void;
  onComplete?: () => void;
}

export class PracticeTestTimer {
  private timer: Timer;
  private totalSeconds: number;
  private callbacks: TimerCallbacks;
  private warningsShown: Set<number> = new Set();

  constructor(numQuestions: number, callbacks: TimerCallbacks = {}) {
    this.timer = new Timer();
    this.totalSeconds = Math.max(60, numQuestions * 3 * 60); // Minimum 1 minute, 3 minutes per question
    this.callbacks = callbacks;
    this.setupEventListeners();
    
    // Failsafe: Set up interval to check timer health
    this.setupTimerHealthCheck();
  }

  private healthCheckInterval: number | null = null;

  private setupEventListeners(): void {
    // Update event - fires every second
    this.timer.addEventListener('secondsUpdated', () => {
      const timeValues = this.timer.getTimeValues();
      const totalTimeValues = this.timer.getTotalTimeValues();
      const remainingSeconds = totalTimeValues.seconds;

      // Call update callback if provided
      if (this.callbacks.onUpdate) {
        this.callbacks.onUpdate(timeValues);
      }

      // Check for warnings (5 minutes = 300 seconds, 1 minute = 60 seconds)
      this.checkWarnings(remainingSeconds);
    });

    // Timer completion event
    this.timer.addEventListener('targetAchieved', () => {
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    });
  }

  private checkWarnings(remainingSeconds: number): void {
    const fiveMinutes = 300;
    const oneMinute = 60;

    // 5-minute warning
    if (remainingSeconds === fiveMinutes && !this.warningsShown.has(fiveMinutes)) {
      this.warningsShown.add(fiveMinutes);
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning({
          timeLeft: fiveMinutes,
          message: '⚠️ 5 minutes remaining'
        });
      }
    }

    // 1-minute warning
    if (remainingSeconds === oneMinute && !this.warningsShown.has(oneMinute)) {
      this.warningsShown.add(oneMinute);
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning({
          timeLeft: oneMinute,
          message: '⚠️ 1 minute remaining'
        });
      }
    }
  }

  public start(): void {
    this.startWithTime(this.totalSeconds);
  }

  public startWithTime(remainingSeconds: number): void {
    try {
      this.timer.start({
        countdown: true,
        startValues: { seconds: remainingSeconds }
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
      // Failsafe: Try to restart after a brief delay
      setTimeout(() => {
        try {
          this.timer.start({
            countdown: true,
            startValues: { seconds: remainingSeconds }
          });
        } catch (retryError) {
          console.error('Timer restart failed:', retryError);
        }
      }, 100);
    }
  }

  private setupTimerHealthCheck(): void {
    // Check timer health every 30 seconds
    this.healthCheckInterval = window.setInterval(() => {
      if (this.timer.isRunning()) {
        const remainingSeconds = this.getTotalRemainingSeconds();
        
        // Failsafe: If timer shows negative or invalid time, trigger completion
        if (remainingSeconds <= 0) {
          console.warn('Timer health check: Timer expired, triggering completion');
          this.clearHealthCheck();
          if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
          }
        }
        
        // Failsafe: If timer appears stuck (same value for too long), restart it
        this.checkTimerStall(remainingSeconds);
      }
    }, 30000);
  }

  private lastHealthCheckTime: number = 0;
  private healthCheckStallCount: number = 0;

  private checkTimerStall(currentTime: number): void {
    if (this.lastHealthCheckTime === currentTime) {
      this.healthCheckStallCount++;
      
      // If timer hasn't changed for 3 consecutive checks (90 seconds), restart it
      if (this.healthCheckStallCount >= 3) {
        console.warn('Timer appears stalled, attempting restart');
        this.healthCheckStallCount = 0;
        
        const wasRunning = this.timer.isRunning();
        if (wasRunning) {
          this.timer.stop();
          this.timer.start({
            countdown: true,
            startValues: { seconds: currentTime }
          });
        }
      }
    } else {
      this.healthCheckStallCount = 0;
    }
    
    this.lastHealthCheckTime = currentTime;
  }

  private clearHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public pause(): void {
    this.timer.pause();
  }

  public resume(): void {
    if (this.timer.isPaused()) {
      this.timer.start();
    }
  }

  public stop(): void {
    this.timer.stop();
  }

  public reset(): void {
    this.timer.reset();
    this.warningsShown.clear();
  }

  public getRemainingTime(): any {
    return this.timer.getTimeValues();
  }

  public getTotalRemainingSeconds(): number {
    return this.timer.getTotalTimeValues().seconds;
  }

  public getFormattedTime(): string {
    const timeValues = this.timer.getTimeValues();
    const hours = timeValues.hours.toString().padStart(2, '0');
    const minutes = timeValues.minutes.toString().padStart(2, '0');
    const seconds = timeValues.seconds.toString().padStart(2, '0');
    
    if (timeValues.hours > 0) {
      return `${hours}:${minutes}:${seconds}`;
    } else {
      return `${minutes}:${seconds}`;
    }
  }

  public isRunning(): boolean {
    return this.timer.isRunning();
  }

  public isPaused(): boolean {
    return this.timer.isPaused();
  }

  public destroy(): void {
    this.clearHealthCheck();
    this.timer.removeAllEventListeners();
    this.timer.stop();
  }

  // Static utility method to format seconds into human-readable time
  public static formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // Static utility method to calculate total test time
  public static calculateTestDuration(numQuestions: number): number {
    return numQuestions * 3 * 60; // 3 minutes per question in seconds
  }
}

// Utility functions for showing warnings
export function showTimerWarning(warning: TimerWarning): void {
  // Create a non-intrusive warning notification
  const warningEl = document.createElement('div');
  warningEl.className = 'timer-warning';
  warningEl.textContent = warning.message;
  warningEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff9800;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
  `;

  // Add animation styles
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
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(warningEl);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    warningEl.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }, 300);
  }, 5000);
}

export default PracticeTestTimer;
