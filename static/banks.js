import calculations from '../question_banks/calculations_questions.js';
import clinicalMepLow from '../question_banks/clinical_mep_low_questions.js';
import clinicalMixedHigh from '../question_banks/clinical_mixed_high_questions.js';
import clinicalMixedLow from '../question_banks/clinical_mixed_low_questions.js';
import clinicalMixedMedium from '../question_banks/clinical_mixed_medium_questions.js';
import clinicalOtcLow from '../question_banks/clinical_otc_low_questions.js';
import clinicalTherapeuticsHigh from '../question_banks/clinical_therapeutics_high_questions.js';
import clinicalTherapeuticsLow from '../question_banks/clinical_therapeutics_low_questions.js';
import clinicalTherapeuticsMedium from '../question_banks/clinical_therapeutics_medium_questions.js';
import clinicalTherapeuticsQuestionsLow from '../question_banks/clinical_therapeutics_questions_low.js';

export default {
  _info: "Populate the question_banks/ directory with JavaScript modules exporting question arrays before using the interface",
  calculations: [calculations],
  clinical_mep: [clinicalMepLow],
  clinical_mixed: [clinicalMixedHigh, clinicalMixedLow, clinicalMixedMedium],
  clinical_otc: [clinicalOtcLow],
  clinical_therapeutics: [clinicalTherapeuticsHigh, clinicalTherapeuticsLow, clinicalTherapeuticsMedium, clinicalTherapeuticsQuestionsLow]
};
