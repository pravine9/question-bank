import type { Question, RenderOptions } from '../types/question';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { domUtils } from './domUtils';
import { DOM_SELECTORS, CSS_CLASSES } from './constants';

export class QuestionRenderer {
  private static instance: QuestionRenderer;

  private constructor() {
    this.setupMarked();
  }

  static getInstance(): QuestionRenderer {
    if (!QuestionRenderer.instance) {
      QuestionRenderer.instance = new QuestionRenderer();
    }
    return QuestionRenderer.instance;
  }

  private setupMarked(): void {
    marked.setOptions({
      breaks: true,
      gfm: true
      // sanitize option removed in marked v12, using DOMPurify instead
    });
  }

  private sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'a'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
        'style', 'width', 'height'
      ],
      ALLOW_DATA_ATTR: false
    });
  }

  private async renderMarkdown(text: string): Promise<string> {
    try {
      const html = await marked(text);
      return this.sanitizeHtml(html);
    } catch (error) {
      console.warn('Failed to render markdown:', error);
      return this.sanitizeHtml(text);
    }
  }

  async renderQuestion(question: Question, options: RenderOptions): Promise<{
    buttons: HTMLButtonElement[];
    input: HTMLInputElement | HTMLTextAreaElement | null;
  }> {
    const buttons: HTMLButtonElement[] = [];
    let input: HTMLInputElement | HTMLTextAreaElement | null = null;

    try {
      // Render question text and title using utility functions
      domUtils.updateElement(options.text, await this.renderMarkdown(question.text));
      domUtils.updateElement(DOM_SELECTORS.QUESTION_TITLE, await this.renderMarkdown(question.title));

      // Handle question image
      const imgElement = document.querySelector(DOM_SELECTORS.QUESTION_IMAGE) as HTMLImageElement;
      if (imgElement) {
        if (question.resource_image) {
          imgElement.src = question.resource_image;
          imgElement.style.display = 'block';
          imgElement.alt = 'Question resource image';
          imgElement.loading = 'lazy';
        } else {
          imgElement.style.display = 'none';
        }
      }

      // Render answer options for multiple choice
      const optionsElement = document.querySelector(options.options);
      if (optionsElement) {
        if (question.answers && question.answers.length > 0) {
          domUtils.clearElement(options.options);
          question.answers.forEach((answer) => {
            const button = domUtils.createButton(answer.text, CSS_CLASSES.OPTION_BUTTON, {
              value: answer.answer_number.toString()
            });
            optionsElement.appendChild(button);
            buttons.push(button);
          });
        } else {
          domUtils.clearElement(options.options);
        }
      }

      // Handle calculation questions
      if (question.is_calculation) {
        const calculatorElement = document.querySelector(DOM_SELECTORS.CALCULATOR);
        if (calculatorElement) {
          input = domUtils.createInput('text', CSS_CLASSES.CALC_INPUT, 'Enter your answer');
          calculatorElement.appendChild(input);
        }
      }

      // Handle free text questions
      if (question.is_free) {
        const freeTextElement = document.querySelector(DOM_SELECTORS.FREE_TEXT_INPUT);
        if (freeTextElement) {
          input = domUtils.createTextarea(CSS_CLASSES.FREE_TEXT_AREA, 'Enter your answer', 4);
          freeTextElement.appendChild(input);
        }
      }

      // Handle unit display for calculation questions
      if (question.answer_unit && question.is_calculation) {
        const unitElement = document.querySelector(DOM_SELECTORS.UNIT_DISPLAY) as HTMLElement;
        if (unitElement) {
          unitElement.textContent = question.answer_unit;
          unitElement.style.display = 'block';
        }
      }

    } catch (error) {
      console.error('Error rendering question:', error);
    }

    return { buttons, input };
  }

  evaluateAnswer(question: Question, userAnswer: string, _options: { options: HTMLElement | null; feedback: HTMLElement | null }): boolean {
    try {
      if (!userAnswer || userAnswer.trim() === '') {
        return false;
      }

      const cleanUserAnswer = userAnswer.trim().toLowerCase();
      const cleanCorrectAnswer = question.correct_answer.toLowerCase();

      // Handle calculation questions with tolerance
      if (question.is_calculation && question.correct_answer_number !== null && question.correct_answer_number !== undefined) {
        const userNum = parseFloat(cleanUserAnswer);
        const correctNum = question.correct_answer_number;
        
        if (isNaN(userNum)) {
          return false;
        }

        // Use tolerance for calculation questions (0.1 by default)
        const tolerance = 0.1;
        return Math.abs(userNum - correctNum) <= tolerance;
      }

      // Handle free text questions (case-insensitive) - check this first
      if (question.is_free) {
        return cleanUserAnswer === cleanCorrectAnswer;
      }

      // Handle multiple choice questions
      if (question.answers && question.answers.length > 0) {
        const selectedAnswer = question.answers.find(a => 
          a.answer_number.toString() === userAnswer
        );
        return selectedAnswer ? selectedAnswer.text.toLowerCase() === cleanCorrectAnswer : false;
      }

      return false;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return false;
    }
  }

  revealAnswer(question: Question, options: { options: HTMLElement | null; feedback: HTMLElement | null }): void {
    try {
      // Show correct answer
      const answerElement = document.querySelector('#correctAnswer') as HTMLElement;
      if (answerElement) {
        let answerText = question.correct_answer;
        
        // Add unit for calculation questions
        if (question.is_calculation && question.answer_unit) {
          answerText += ` ${question.answer_unit}`;
        }
        
        answerElement.textContent = answerText;
        answerElement.style.display = 'block';
      }

      // Show explanation
      const explanationElement = document.querySelector('#explanation') as HTMLElement;
      if (explanationElement && question.why) {
        explanationElement.innerHTML = this.sanitizeHtml(question.why);
        explanationElement.style.display = 'block';
      }

      // Highlight correct option for multiple choice
      if (question.answers && question.answers.length > 0) {
        const correctAnswer = question.answers.find(a => 
          a.text.toLowerCase() === question.correct_answer.toLowerCase()
        );
        
        if (correctAnswer && options.options) {
          const optionButtons = options.options.querySelectorAll('.option-btn');
          optionButtons.forEach((button: Element) => {
            if (button instanceof HTMLButtonElement && 
                button.dataset.value === correctAnswer.answer_number.toString()) {
              button.classList.add('correct-answer');
            }
          });
        }
      }

    } catch (error) {
      console.error('Error revealing answer:', error);
    }
  }

  clearQuestion(): void {
    try {
      // Clear all elements using utility functions
      domUtils.clearElement(DOM_SELECTORS.QUESTION_TEXT);
      domUtils.clearElement(DOM_SELECTORS.QUESTION_TITLE);
      domUtils.clearElement(DOM_SELECTORS.ANSWER_OPTIONS);
      domUtils.clearElement(DOM_SELECTORS.CALCULATOR);
      domUtils.clearElement(DOM_SELECTORS.FREE_TEXT_INPUT);
      
      // Hide elements
      domUtils.hideElement(DOM_SELECTORS.QUESTION_IMAGE);
      domUtils.hideElement(DOM_SELECTORS.UNIT_DISPLAY);
      domUtils.hideElement(DOM_SELECTORS.CORRECT_ANSWER);
      domUtils.hideElement(DOM_SELECTORS.EXPLANATION);
      
      // Reset image src
      const imgElement = document.querySelector(DOM_SELECTORS.QUESTION_IMAGE) as HTMLImageElement;
      if (imgElement) {
        imgElement.src = '';
      }

    } catch (error) {
      console.error('Error clearing question:', error);
    }
  }

  // Method to initialize PDF viewer (placeholder for future implementation)
  initPdfViewer(): void {
    console.log('PDF viewer initialization not yet implemented');
  }
}

// Export singleton instance
export const questionRenderer = QuestionRenderer.getInstance();
