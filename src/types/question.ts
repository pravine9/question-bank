export interface QuestionAnswer {
  text: string;
  answer_number: number;
}

export interface Question {
  id: number;
  bank: string;
  title: string;
  text: string;
  why: string;
  resource_image?: string | null;
  visible: boolean;
  is_calculation: boolean;
  correct_answer: string;
  answer_unit?: string;
  correct_answer_number?: number | null;
  weighting?: number | null;
  answers: QuestionAnswer[];
  is_free: boolean;
}

export interface QuestionBank {
  [key: string]: Question[][];
}

export interface BankData {
  bank: string;
  files: Question[][];
}

export interface BankLabels {
  [key: string]: string;
}

// Global window interface extensions
declare global {
  interface Window {
    // Question bank data (loaded by question bank JS files)
    calculations?: Question[];
    clinicalMepLow?: Question[];
    clinicalMixedHigh?: Question[];
    clinicalMixedLow?: Question[];
    clinicalMixedMedium?: Question[];
    clinicalOtcLow?: Question[];
    clinicalTherapeuticsHigh?: Question[];
    clinicalTherapeuticsLow?: Question[];
    clinicalTherapeuticsMedium?: Question[];
    
    // Application state
    banks?: QuestionBank;
    populateBankSelects?: (banks: QuestionBank) => void;
    questionRenderer?: QuestionRenderer;
    toggleFlag?: (id: number) => boolean;
    practiceHistoryComponent?: any;
    // Timer functionality removed
  }
}

export interface QuestionStats {
  [questionId: number]: {
    attempts: number;
    right: number;
    wrong: number;
  };
}

export interface PracticeState {
  currentQuestion: number;
  questions: Question[];
  answers: Record<number, string>;
  flagged: Set<number>;
  startTime: number;
  bank: string;
  totalQuestions: number;
}

// TimerStats interface removed - timer functionality no longer needed

export interface PracticeResult {
  id: string;
  bank: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  duration: number;
  date: string;
  flaggedQuestions: number;
  questions: Question[];
  answers: Record<number, string>;
  flagged: number[];
}

export interface PracticeHistory {
  results: PracticeResult[];
  totalTests: number;
  averageScore: number;
  bestScore: number;
  totalTime: number; // in minutes
}

export interface RenderOptions {
  text?: string;
  title?: string;
  img?: string;
  options?: string;
  input?: string;
  unit?: string;
  feedback?: string;
  answer?: string;
  explanation?: string;
  showInput?: boolean;
}

export interface QuestionRenderer {
  initPdfViewer(): void;
  renderQuestion(question: Question, config?: RenderOptions): void;
}
