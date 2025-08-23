import type { BankLabels } from '@/types/question';

export const bankNames: BankLabels = {
  calculations: 'Calculations',
  clinical_mep: 'Clinical MEP',
  clinical_mixed: 'Clinical Mixed',
  clinical_otc: 'Clinical OTC',
  clinical_therapeutics: 'Clinical Therapeutics'
};

export function formatBankName(bank: string): string {
  return bankNames[bank] || bank;
}

