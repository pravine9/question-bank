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
  console.log('Initializing banks...');
  console.log('window.calculations:', window.calculations);
  console.log('window.clinicalMepLow:', window.clinicalMepLow);
  
  const banks: QuestionBank = {
    calculations: [window.calculations || []],
    clinical_mep: [window.clinicalMepLow || []],
    clinical_mixed: [window.clinicalMixedHigh || [], window.clinicalMixedLow || [], window.clinicalMixedMedium || []],
    clinical_otc: [window.clinicalOtcLow || []],
    clinical_therapeutics: [window.clinicalTherapeuticsHigh || [], window.clinicalTherapeuticsLow || [], window.clinicalTherapeuticsMedium || []]
  };

  console.log('Banks object:', banks);
  window.banks = banks;
  
  // Try to populate banks immediately if function is available
  if (window.populateBankSelects) {
    console.log('Calling populateBankSelects immediately...');
    window.populateBankSelects(banks);
  } else {
    console.log('populateBankSelects not available yet, will retry...');
    // Retry after a short delay to allow main.ts to load
    setTimeout(() => {
      if (window.populateBankSelects) {
        console.log('Calling populateBankSelects after delay...');
        window.populateBankSelects(banks);
      } else {
        console.log('populateBankSelects still not available');
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
