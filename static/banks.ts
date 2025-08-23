import type { QuestionBank } from '../src/types/question';

const banks: QuestionBank = {
  calculations: [window.calculations || []],
  clinical_mep: [window.clinicalMepLow || []],
  clinical_mixed: [window.clinicalMixedHigh || [], window.clinicalMixedLow || [], window.clinicalMixedMedium || []],
  clinical_otc: [window.clinicalOtcLow || []],
  clinical_therapeutics: [window.clinicalTherapeuticsHigh || [], window.clinicalTherapeuticsLow || [], window.clinicalTherapeuticsMedium || []]
};

window.banks = banks;
