// Practice entry point
import { PracticeManager } from './pages/practice';

// Initialize practice manager
export function initializePractice() {
  const practiceManager = new PracticeManager();
  practiceManager.init();
}

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initializePractice();
  });
}