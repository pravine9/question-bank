// Main entry point for the application
import { init } from './pages/main';
import { PracticeHistoryComponent } from './components/practiceHistory';

// Initialize the main application
export function initializeApp() {
  // Initialize main functionality
  init();
  
  // Initialize practice history component
  const practiceHistory = new PracticeHistoryComponent();
  practiceHistory.render('practiceHistory');
}

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initializeApp();
  });
}