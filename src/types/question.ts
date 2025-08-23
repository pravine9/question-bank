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
