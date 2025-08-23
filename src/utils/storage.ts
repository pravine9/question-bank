import type { QuestionStats, PracticeState, PracticeResult, PracticeHistory } from '../types/question';
import { STORAGE_LIMITS } from './constants';

const STORAGE_KEYS = {
  QUESTION_STATS: 'questionStats',
  PRACTICE_STATE: 'practice_state',
  PRACTICE_HISTORY: 'practice_history',
  LAST_BANK: 'lastBank',
  SETTINGS: 'settings'
} as const;

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private isStorageAvailable(): boolean {
    try {
      const test = STORAGE_LIMITS.STORAGE_TEST_KEY;
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Generic storage methods to reduce repetition
  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isStorageAvailable()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  private setItem(key: string, value: any): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key}:`, error);
    }
  }

  getQuestionStats(): QuestionStats {
    return this.getItem(STORAGE_KEYS.QUESTION_STATS, {});
  }

  saveQuestionStats(stats: QuestionStats): void {
    this.setItem(STORAGE_KEYS.QUESTION_STATS, stats);
  }

  updateQuestionStat(questionId: number, isCorrect: boolean): void {
    const stats = this.getQuestionStats();
    
    if (!stats[questionId]) {
      stats[questionId] = { attempts: 0, right: 0, wrong: 0 };
    }

    stats[questionId].attempts++;
    if (isCorrect) {
      stats[questionId].right++;
    } else {
      stats[questionId].wrong++;
    }

    this.saveQuestionStats(stats);
  }

  getPracticeState(): PracticeState | null {
    const state = this.getItem(STORAGE_KEYS.PRACTICE_STATE, null);
    if (!state) return null;

    try {
      // Convert flagged array back to Set
      state.flagged = new Set(state.flagged);
      return state;
    } catch (error) {
      console.warn('Failed to parse practice state:', error);
      return null;
    }
  }

  savePracticeState(state: PracticeState): void {
    // Convert Set to array for JSON serialization
    const serializableState = {
      ...state,
      flagged: Array.from(state.flagged)
    };
    this.setItem(STORAGE_KEYS.PRACTICE_STATE, serializableState);
  }

  clearPracticeState(): void {
    if (this.isStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEYS.PRACTICE_STATE);
      } catch (error) {
        console.warn('Failed to clear practice state:', error);
      }
    }
  }

  // New methods for practice history
  getPracticeHistory(): PracticeHistory {
    const defaultHistory: PracticeHistory = {
      results: [],
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      totalTime: 0
    };

    const history = this.getItem(STORAGE_KEYS.PRACTICE_HISTORY, null);
    if (!history) return defaultHistory;

    try {
      return this.calculateHistoryStats(history.results || []);
    } catch (error) {
      console.warn('Failed to parse practice history:', error);
      return defaultHistory;
    }
  }

  savePracticeResult(result: PracticeResult): void {
    const history = this.getPracticeHistory();
    history.results.unshift(result); // Add to beginning of array
    
    // Keep only last results to prevent storage bloat
    if (history.results.length > STORAGE_LIMITS.MAX_PRACTICE_RESULTS) {
      history.results = history.results.slice(0, STORAGE_LIMITS.MAX_PRACTICE_RESULTS);
    }

    const updatedHistory = this.calculateHistoryStats(history.results);
    this.setItem(STORAGE_KEYS.PRACTICE_HISTORY, updatedHistory);
  }

  private calculateHistoryStats(results: PracticeResult[]): PracticeHistory {
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

  clearPracticeHistory(): void {
    if (this.isStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEYS.PRACTICE_HISTORY);
      } catch (error) {
        console.warn('Failed to clear practice history:', error);
      }
    }
  }

  getLastBank(): string | null {
    return this.getItem(STORAGE_KEYS.LAST_BANK, null);
  }

  saveLastBank(bank: string): void {
    this.setItem(STORAGE_KEYS.LAST_BANK, bank);
  }

  getSettings(): Record<string, any> {
    return this.getItem(STORAGE_KEYS.SETTINGS, {});
  }

  saveSettings(settings: Record<string, any>): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  clearAll(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}

export const storage = StorageManager.getInstance();
