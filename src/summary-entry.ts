// Summary entry point
import { SummaryManager } from './pages/summary';

// Initialize summary manager
export function initializeSummary() {
  new SummaryManager();
}

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initializeSummary();
  });
}