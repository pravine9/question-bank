import type { QuestionStats, PracticeState, PracticeResult, PracticeHistory } from '../types/question';

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
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getQuestionStats(): QuestionStats {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const stats = localStorage.getItem(STORAGE_KEYS.QUESTION_STATS);
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.warn('Failed to load question stats:', error);
      return {};
    }
  }

  saveQuestionStats(stats: QuestionStats): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.QUESTION_STATS, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save question stats:', error);
    }
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
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const state = localStorage.getItem(STORAGE_KEYS.PRACTICE_STATE);
      if (!state) return null;

      const parsedState = JSON.parse(state);
      // Convert flagged array back to Set
      parsedState.flagged = new Set(parsedState.flagged);
      return parsedState;
    } catch (error) {
      console.warn('Failed to load practice state:', error);
      return null;
    }
  }

  savePracticeState(state: PracticeState): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      // Convert Set to array for JSON serialization
      const serializableState = {
        ...state,
        flagged: Array.from(state.flagged)
      };
      localStorage.setItem(STORAGE_KEYS.PRACTICE_STATE, JSON.stringify(serializableState));
    } catch (error) {
      console.warn('Failed to save practice state:', error);
    }
  }

  clearPracticeState(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.PRACTICE_STATE);
    } catch (error) {
      console.warn('Failed to clear practice state:', error);
    }
  }

  // New methods for practice history
  getPracticeHistory(): PracticeHistory {
    if (!this.isStorageAvailable()) {
      return {
        results: [],
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTime: 0
      };
    }

    try {
      const history = localStorage.getItem(STORAGE_KEYS.PRACTICE_HISTORY);
      if (!history) {
        return {
          results: [],
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          totalTime: 0
        };
      }

      const parsedHistory = JSON.parse(history);
      return this.calculateHistoryStats(parsedHistory.results || []);
    } catch (error) {
      console.warn('Failed to load practice history:', error);
      return {
        results: [],
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTime: 0
      };
    }
  }

  savePracticeResult(result: PracticeResult): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const history = this.getPracticeHistory();
      history.results.unshift(result); // Add to beginning of array
      
      // Keep only last 50 results to prevent storage bloat
      if (history.results.length > 50) {
        history.results = history.results.slice(0, 50);
      }

      const updatedHistory = this.calculateHistoryStats(history.results);
      localStorage.setItem(STORAGE_KEYS.PRACTICE_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save practice result:', error);
    }
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
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.PRACTICE_HISTORY);
    } catch (error) {
      console.warn('Failed to clear practice history:', error);
    }
  }

  getLastBank(): string | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_BANK);
    } catch (error) {
      console.warn('Failed to load last bank:', error);
      return null;
    }
  }

  saveLastBank(bank: string): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.LAST_BANK, bank);
    } catch (error) {
      console.warn('Failed to save last bank:', error);
    }
  }

  getSettings(): Record<string, any> {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.warn('Failed to load settings:', error);
      return {};
    }
  }

  saveSettings(settings: Record<string, any>): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
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
