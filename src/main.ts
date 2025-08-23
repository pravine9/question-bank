// Main entry point for the enhanced application
import { questionRenderer } from './utils/questionRenderer';
import { storage } from './utils/storage';

// Extend Window interface to include global variables
declare global {
  interface Window {
    questionRenderer?: any;
    toggleFlag?: (id: number) => boolean;
    banks?: any;
    calculations?: any[];
    clinicalMepLow?: any[];
    clinicalMixedHigh?: any[];
    clinicalMixedLow?: any[];
    clinicalMixedMedium?: any[];
    clinicalOtcLow?: any[];
    clinicalTherapeuticsHigh?: any[];
    clinicalTherapeuticsLow?: any[];
    clinicalTherapeuticsMedium?: any[];
  }
}

console.log('🚀 GPhC Question Bank Enhanced Version Loaded!');

// Test the new modules
console.log('✅ Question Renderer:', questionRenderer);
console.log('✅ Storage Manager:', storage);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM loaded, initializing enhanced features...');
  
  // Add enhanced styling classes
  document.body.classList.add('enhanced');
  
  // Test storage functionality
  const testStats = storage.getQuestionStats();
  console.log('📊 Current question stats:', testStats);
  
  // Initialize enhanced question renderer
  if (typeof window.questionRenderer !== 'undefined') {
    console.log('🔄 Initializing enhanced question renderer...');
    window.questionRenderer.initPdfViewer();
  }
  
  console.log('🎉 Enhanced features initialized successfully!');
});

// Export for use in other modules
export { questionRenderer, storage };
