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

const mockElement = {
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
  loading: ''
};

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
      correct_answer: 'Test answer',
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
    it('should render question text and title', () => {
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

      const result = renderer.renderQuestion(mockQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qText');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qTitle');
      expect(result.buttons).toBeInstanceOf(Array);
      expect(result.input).toBeNull();
    });

    it('should handle calculation questions', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true };
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

      const result = renderer.renderQuestion(calcQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('.calculator');
      expect(result.input).toBeDefined();
    });

    it('should handle questions with images', () => {
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

      renderer.renderQuestion(mockQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qImg');
    });

    it('should handle questions without images', () => {
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

      renderer.renderQuestion(questionWithoutImage, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#qImg');
    });
  });

  describe('evaluateAnswer', () => {
    it('should evaluate calculation questions correctly', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true, correct_answer: '25.5' };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(calcQuestion, '25.5', options);
      expect(result).toBe(true);
    });

    it('should evaluate calculation questions with tolerance', () => {
      const calcQuestion = { ...mockQuestion, is_calculation: true, correct_answer: '25.5' };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(calcQuestion, '25.49', options);
      expect(result).toBe(true);
    });

    it('should evaluate multiple choice questions correctly', () => {
      const options = {
        options: {
          querySelector: vi.fn().mockReturnValue({
            getAttribute: vi.fn().mockReturnValue('1')
          })
        },
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(mockQuestion, '', options);
      expect(result).toBe(true);
    });

    it('should evaluate free text questions correctly', () => {
      const freeTextQuestion = { ...mockQuestion, answers: [], is_free: true };
      const options = {
        options: mockElement,
        feedback: mockElement
      };

      const result = renderer.evaluateAnswer(freeTextQuestion, 'Test answer', options);
      expect(result).toBe(true);
    });

    it('should handle case-insensitive comparison for free text', () => {
      const freeTextQuestion = { ...mockQuestion, answers: [], is_free: true };
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
      const calcQuestion = { ...mockQuestion, is_calculation: true };
      const options = {
        answer: '#answer',
        explanation: '#explanation'
      };

      renderer.revealAnswer(calcQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#answer');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#explanation');
    });

    it('should reveal multiple choice answer', () => {
      const options = {
        answer: '#answer',
        explanation: '#explanation'
      };

      renderer.revealAnswer(mockQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#answer');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#explanation');
    });

    it('should reveal free text answer', () => {
      const freeTextQuestion = { ...mockQuestion, answers: [], is_free: true };
      const options = {
        answer: '#answer',
        explanation: '#explanation'
      };

      renderer.revealAnswer(freeTextQuestion, options);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('#answer');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#explanation');
    });
  });

  describe('clearQuestion', () => {
    it('should clear all question elements', () => {
      renderer.clearQuestion();

      const expectedSelectors = [
        '#qText', '#qTitle', '#qImg', '#answerOptions', 
        '#feedback', '#answer', '#explanation'
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
