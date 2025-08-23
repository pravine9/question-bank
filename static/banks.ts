// Type definitions moved inline to avoid import issues
interface QuestionBank {
  [key: string]: any[][];
}

// Extend window interface
declare global {
  interface Window {
    populateBankSelects?: (banks: QuestionBank) => void;
  }
}

function initializeBanks(): void {
  const banks: QuestionBank = {
    calculations: [window.calculations || []],
    clinical_mep: [window.clinicalMepLow || []],
    clinical_mixed: [
      window.clinicalMixedHigh || [],
      window.clinicalMixedLow || [],
      window.clinicalMixedMedium || [],
    ],
    clinical_otc: [window.clinicalOtcLow || []],
    clinical_therapeutics: [
      window.clinicalTherapeuticsHigh || [],
      window.clinicalTherapeuticsLow || [],
      window.clinicalTherapeuticsMedium || [],
    ],
  };
  window.banks = banks;

  // Try to populate banks immediately if function is available
  if (window.populateBankSelects) {
    window.populateBankSelects(banks);
  } else {
    // Retry after a short delay to allow main.ts to load
    setTimeout(() => {
      if (window.populateBankSelects) {
        window.populateBankSelects(banks);
      } else {
        console.warn('populateBankSelects not available');
      }
    }, 100);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBanks);
} else {
  initializeBanks();
}
