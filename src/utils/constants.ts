// Common constants used throughout the application
export const TIMER_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  MILLISECONDS_PER_SECOND: 1000,
  MILLISECONDS_PER_MINUTE: 60000,
  WARNING_THRESHOLDS: {
    DANGER: 60,    // 1 minute
    WARNING: 300   // 5 minutes
  },
  TIME_PER_QUESTION: 180, // 3 minutes per question
  WARNING_DISPLAY_TIME: 5000 // 5 seconds
} as const;

export const STORAGE_LIMITS = {
  MAX_PRACTICE_RESULTS: 50,
  STORAGE_TEST_KEY: '__storage_test__'
} as const;

export const DOM_SELECTORS = {
  QUESTION_TEXT: '#qText',
  QUESTION_TITLE: '#qTitle',
  QUESTION_IMAGE: '#qImg',
  ANSWER_OPTIONS: '#answerOptions',
  CALCULATOR: '.calculator',
  FREE_TEXT_INPUT: '.free-text-input',
  UNIT_DISPLAY: '.unit-display',
  CORRECT_ANSWER: '#correctAnswer',
  EXPLANATION: '#explanation',
  TIMER: '.timer'
} as const;

export const CSS_CLASSES = {
  OPTION_BUTTON: 'option-btn',
  CALC_INPUT: 'calc-input',
  FREE_TEXT_AREA: 'free-text-area',
  CORRECT_ANSWER: 'correct-answer',
  TIMER_WARNING: 'timer-warning',
  DANGER: 'danger',
  WARNING: 'warning'
} as const;

