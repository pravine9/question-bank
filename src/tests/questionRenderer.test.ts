import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionRenderer } from '../utils/questionRenderer';
import type { Question } from '../types/question';

// Mock DOM environment
const mockDocument = {
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  createElement: vi.fn(),
  getElementById: vi.fn()
};

// Create a proper HTMLElement mock
const mockElement = {
  // HTMLElement properties
  accessKey: '',
  accessKeyLabel: '',
  autocapitalize: 'off',
  dir: 'ltr',
  draggable: false,
  hidden: false,
  inert: false,
  innerText: '',
  lang: '',
  offsetHeight: 0,
  offsetLeft: 0,
  offsetParent: null,
  offsetTop: 0,
  offsetWidth: 0,
  outerHTML: '',
  outerText: '',
  spellcheck: true,
  title: '',
  translate: true,
  
  // Element properties
  innerHTML: '',
  style: { display: 'none' },
  setAttribute: vi.fn(),
  appendChild: vi.fn(),
  addEventListener: vi.fn(),
  textContent: '',
  value: '',
  placeholder: '',
  src: '',
  alt: '',
  loading: '',
  
  // Mock methods
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  getAttribute: vi.fn(),
  hasAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn()
  }
} as unknown as HTMLElement;

// Mock window object
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    open: vi.fn()
  },
  writable: true
});

describe('QuestionRenderer', () => {
  let renderer: QuestionRenderer;
  let mockQuestion: Question;

  beforeEach(() => {
    vi.clearAllMocks();
    renderer = QuestionRenderer.getInstance();
    
    mockQuestion = {
      id: 1,
      bank: 'test',
      title: 'Test Question Title',
      text: 'Test question text with **bold** and *italic*',
      why: 'Test explanation',
      resource_image: 'https://example.com/image.jpg',
      visible: true,
      is_calculation: false,
      correct_answer: 'Option A',
      answer_unit: 'mg',
      correct_answer_number: 1,
      weighting: 1,
      answers: [
        { text: 'Option A', answer_number: 1 },
        { text: 'Option B', answer_number: 2 }
      ],
      is_free: false
    };

    // Setup default mock returns
    mockDocument.querySelector.mockReturnValue(mockElement);
    mockDocument.getElementById.mockReturnValue(mockElement);
    mockDocument.createElement.mockReturnValue(mockElement);
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = QuestionRenderer.getInstance();
      const instance2 = QuestionRenderer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('renderQuestion', () => {
    it('should render question text and title', async () => {
      const options = {
        text: '#qText',
        title: '#qTitle',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation',
        showInput: false
      };

      const result = await renderer.renderQuestion(mockQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qText');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qTitle');
      expect(result.buttons).toBeInstanceOf(Array);
      expect(result.input).toBeNull();
    });

    it('should handle calculation questions', async () => {
      const calcQuestion = { 
        ...mockQuestion, 
        is_calculation: true, 
        answers: [], // Remove answers for calculation questions
        correct_answer: '25.5',
        correct_answer_number: 25.5
      };
      const options = {
        text: '#qText',
        title: '#qTitle',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation',
        showInput: true
      };

      const result = await renderer.renderQuestion(calcQuestion, options);

      // Check that all expected selectors were called (order doesn't matter)
      const calls = mockDocument.querySelector.mock.calls.map(call => call[0]);
      expect(calls).toContain('#qText');
      expect(calls).toContain('#qTitle');
      expect(calls).toContain('#qImg');
      expect(calls).toContain('#answerOptions');
      expect(calls).toContain('.calculator');
      expect(result.input).toBeDefined();
    });

    it('should handle questions with images', async () => {
      const options = {
        text: '#qText',
        title: '#qTitle',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation',
        showInput: false
      };

      await renderer.renderQuestion(mockQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qImg');
    });

    it('should handle questions without images', async () => {
      const questionWithoutImage = { ...mockQuestion, resource_image: null };
      const options = {
        text: '#qText',
        title: '#qTitle',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation',
        showInput: false
      };

      await renderer.renderQuestion(questionWithoutImage, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qImg');
    });
  });

  describe('evaluateAnswer', () => {
    it('should evaluate calculation questions correctly', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true, correct_answer: '25.5', correct_answer_number: 25.5 };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(calcQuestion, '25.5', options);
      expect(result).toBe(true);
    });

    it('should evaluate calculation questions with tolerance', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true, correct_answer: '25.5', correct_answer_number: 25.5 };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(calcQuestion, '25.49', options);
      expect(result).toBe(true);
    });

    it('should evaluate multiple choice questions correctly', () => {
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(mockQuestion, '1', options);
      expect(result).toBe(true);
    });

    it('should evaluate free text questions correctly', () => {
      const freeTextQuestion = { ...mockQuestion, is_free: true, correct_answer: 'Test answer' };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(freeTextQuestion, 'Test answer', options);
      expect(result).toBe(true);
    });

    it('should handle case-insensitive comparison for free text', () => {
      const freeTextQuestion = { ...mockQuestion, is_free: true, correct_answer: 'Test answer' };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(freeTextQuestion, 'TEST ANSWER', options);
      expect(result).toBe(true);
    });
  });

  describe('revealAnswer', () => {
    it('should reveal calculation answer with unit', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true, answer_unit: 'mg' };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      renderer.revealAnswer(calcQuestion, options);
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#correctAnswer');
    });

    it('should reveal multiple choice answer', () => {
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      renderer.revealAnswer(mockQuestion, options);
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#correctAnswer');
    });

    it('should reveal free text answer', () => {
      const freeTextQuestion = { ...mockQuestion, is_free: true };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      renderer.revealAnswer(freeTextQuestion, options);
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#correctAnswer');
    });
  });

  describe('clearQuestion', () => {
    it('should clear all question elements', () => {
      renderer.clearQuestion();

      const expectedSelectors = [
        '#qText', '#qTitle', '#answerOptions', '.calculator', '.free-text-input',
        '#qImg', '.unit-display', '#correctAnswer', '#explanation'
      ];

      expectedSelectors.forEach(selector => {
        expect(mockDocument.querySelector).toHaveBeenCalledWith(selector);
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing elements gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const options = {
        text: '#qText',
        title: '#qTitle',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation',
        showInput: false
      };

      expect(() => {
        renderer.renderQuestion(mockQuestion, options);
      }).not.toThrow();
    });

    it('should handle evaluation errors gracefully', () => {
      const options = {
        options: null,
        feedback: null
      };

      const result = renderer.evaluateAnswer(mockQuestion, 'test', options);
      expect(result).toBe(false);
    });
  });
});
