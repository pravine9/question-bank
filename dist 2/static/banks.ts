interface QuestionBank {
  [key: string]: any[][];
}

export const banks: QuestionBank = {
  calculations: [ (window as any).calculations || [] ],
  clinical_mep: [ (window as any).clinicalMepLow || [] ],
  clinical_mixed: [
    (window as any).clinicalMixedHigh || [],
    (window as any).clinicalMixedLow || [],
    (window as any).clinicalMixedMedium || [],
  ],
  clinical_otc: [ (window as any).clinicalOtcLow || [] ],
  clinical_therapeutics: [
    (window as any).clinicalTherapeuticsHigh || [],
    (window as any).clinicalTherapeuticsLow || [],
    (window as any).clinicalTherapeuticsMedium || [],
  ],
};
