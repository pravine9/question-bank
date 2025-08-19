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

export interface QuestionStats {
  [questionId: number]: {
    attempts: number;
    right: number;
    wrong: number;
  };
}

export interface PracticeState {
  bank: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<number, string>;
  flagged: Set<number>;
  startTime: number;
  endTime?: number;
  isFinished: boolean;
}

export interface TimerStats {
  allocatedTimeMs: number;
  allocatedTimeSeconds: number;
  allocatedTimeMinutes: number;
  actualTimeMs: number;
  actualTimeSeconds: number;
  actualTimeMinutes: number;
  timeUsedSeconds: number;
  timeUsedMinutes: number;
  remainingTimeSeconds: number;
  remainingTimeMinutes: number;
  timeSavedSeconds: number;
  timeSavedMinutes: number;
  efficiency: number;
  isFinishedEarly: boolean;
  timeExpired: boolean;
}

export interface PracticeResult {
  id: string;
  bank: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers?: number;
  notAnswered?: number;
  score: number;
  startTime: number;
  endTime: number;
  duration: number; // in minutes
  date: string;
  flaggedQuestions: number;
  timerStats?: TimerStats;
  questions: {
    id: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    flagged: boolean;
  }[];
}

export interface PracticeHistory {
  results: PracticeResult[];
  totalTests: number;
  averageScore: number;
  bestScore: number;
  totalTime: number; // in minutes
}

export interface RenderOptions {
  text: string;
  options: string;
  input: string;
  unit: string;
  feedback: string;
  answer: string;
  explanation: string;
  showInput: boolean;
}
