import type { Question, RenderOptions } from '../types/question';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
      // Render question text
      const textElement = document.querySelector(options.text);
      if (textElement) {
        textElement.innerHTML = await this.renderMarkdown(question.text);
      }

      // Render question title
      const titleElement = document.querySelector('#qTitle');
      if (titleElement) {
        titleElement.innerHTML = await this.renderMarkdown(question.title);
      }

      // Handle question image
      const imgElement = document.querySelector('#qImg') as HTMLImageElement;
      if (imgElement && question.resource_image) {
        imgElement.src = question.resource_image;
        imgElement.style.display = 'block';
        imgElement.alt = 'Question resource image';
        imgElement.loading = 'lazy';
      } else if (imgElement) {
        imgElement.style.display = 'none';
      }

      // Render answer options for multiple choice
      const optionsElement = document.querySelector(options.options);
      if (optionsElement && question.answers && question.answers.length > 0) {
        optionsElement.innerHTML = '';
        question.answers.forEach((answer, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'option-btn';
          button.textContent = answer.text;
          button.dataset.value = answer.answer_number.toString();
          button.dataset.value = answer.answer_number.toString();
          optionsElement.appendChild(button);
          buttons.push(button);
        });
      } else if (optionsElement) {
        optionsElement.innerHTML = '';
      }

      // Handle calculation questions
      if (question.is_calculation) {
        const calculatorElement = document.querySelector('.calculator');
        if (calculatorElement) {
          input = document.createElement('input');
          input.type = 'text';
          input.className = 'calc-input';
          input.placeholder = 'Enter your answer';

          calculatorElement.appendChild(input);
        }
      }

      // Handle free text questions
      if (question.is_free) {
        const freeTextElement = document.querySelector('.free-text-input');
        if (freeTextElement) {
          const textarea = document.createElement('textarea');
          textarea.className = 'free-text-area';
          textarea.placeholder = 'Enter your answer';

          textarea.rows = 4;
          freeTextElement.appendChild(textarea);
          input = textarea;
        }
      }

      // Handle unit display for calculation questions
      if (question.answer_unit && question.is_calculation) {
        const unitElement = document.querySelector('.unit-display') as HTMLElement;
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

      // Handle multiple choice questions
      if (question.answers && question.answers.length > 0) {
        const selectedAnswer = question.answers.find(a => 
          a.answer_number.toString() === userAnswer
        );
        return selectedAnswer ? selectedAnswer.text.toLowerCase() === cleanCorrectAnswer : false;
      }

      // Handle free text questions (case-insensitive)
      if (question.is_free) {
        return cleanUserAnswer === cleanCorrectAnswer;
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
      // Clear question text
      const textElement = document.querySelector('#qText');
      if (textElement) textElement.innerHTML = '';

      // Clear title
      const titleElement = document.querySelector('#qTitle');
      if (titleElement) titleElement.innerHTML = '';

      // Clear image
      const imgElement = document.querySelector('#qImg') as HTMLImageElement;
      if (imgElement) {
        imgElement.src = '';
        imgElement.style.display = 'none';
      }

      // Clear options
      const optionsElement = document.querySelector('#answerOptions');
      if (optionsElement) optionsElement.innerHTML = '';

      // Clear calculator
      const calculatorElement = document.querySelector('.calculator');
      if (calculatorElement) calculatorElement.innerHTML = '';

      // Clear free text input
      const freeTextElement = document.querySelector('.free-text-input');
      if (freeTextElement) freeTextElement.innerHTML = '';

      // Clear unit display
      const unitElement = document.querySelector('.unit-display') as HTMLElement;
      if (unitElement) unitElement.style.display = 'none';

      // Clear correct answer
      const answerElement = document.querySelector('#correctAnswer') as HTMLElement;
      if (answerElement) answerElement.style.display = 'none';

      // Clear explanation
      const explanationElement = document.querySelector('#explanation') as HTMLElement;
      if (explanationElement) explanationElement.style.display = 'none';

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
