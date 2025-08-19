import type { Question, RenderOptions } from '../types/question';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export class QuestionRenderer {
  private static instance: QuestionRenderer;
  private pdfViewer: any = null;

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
      gfm: true,
      sanitize: false // We'll use DOMPurify instead
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

  private renderMarkdown(text: string): string {
    try {
      const html = marked(text);
      return this.sanitizeHtml(html);
    } catch (error) {
      console.warn('Failed to render markdown:', error);
      return this.sanitizeHtml(text);
    }
  }

  renderQuestion(question: Question, options: RenderOptions): {
    buttons: HTMLButtonElement[];
    input: HTMLInputElement | null;
  } {
    const buttons: HTMLButtonElement[] = [];
    let input: HTMLInputElement | null = null;

    try {
      // Render question text
      const textElement = document.querySelector(options.text);
      if (textElement) {
        textElement.innerHTML = this.renderMarkdown(question.text);
      }

      // Render question title
      const titleElement = document.querySelector(options.title);
      if (titleElement) {
        titleElement.innerHTML = this.renderMarkdown(question.title);
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
          button.setAttribute('aria-label', `Option ${index + 1}: ${answer.text}`);
          button.setAttribute('role', 'radio');
          button.setAttribute('aria-checked', 'false');
          optionsElement.appendChild(button);
          buttons.push(button);
        });
      } else if (optionsElement) {
        optionsElement.innerHTML = '';
      }

      // Handle calculation input
      if (question.is_calculation && options.showInput) {
        const calcContainer = document.querySelector('.calculator') as HTMLElement;
        if (calcContainer) {
          calcContainer.style.display = 'block';
          input = document.querySelector(options.input) as HTMLInputElement;
          if (input) {
            input.value = '';
            input.placeholder = 'Enter your answer';
            input.setAttribute('aria-label', 'Answer input field');
          }

          const unitElement = document.querySelector(options.unit);
          if (unitElement && question.answer_unit) {
            unitElement.textContent = question.answer_unit;
          }
        }
      } else {
        const calcContainer = document.querySelector('.calculator') as HTMLElement;
        if (calcContainer) {
          calcContainer.style.display = 'none';
        }
      }

      // Setup external links
      this.setupExternalLinks();

    } catch (error) {
      console.error('Error rendering question:', error);
    }

    return { buttons, input };
  }

  evaluateAnswer(
    question: Question,
    userAnswer: string,
    options: {
      options: HTMLElement | null;
      feedback: HTMLElement | null;
    }
  ): boolean {
    try {
      let isCorrect = false;

      if (question.is_calculation) {
        // Handle calculation questions
        const correctAnswer = parseFloat(question.correct_answer);
        const userValue = parseFloat(userAnswer);
        
        if (!isNaN(correctAnswer) && !isNaN(userValue)) {
          isCorrect = Math.abs(correctAnswer - userValue) < 0.01;
        }
      } else if (question.answers && question.answers.length > 0) {
        // Handle multiple choice questions
        const selectedButton = options.options?.querySelector('.option-btn.selected');
        if (selectedButton) {
          const selectedValue = parseInt(selectedButton.getAttribute('data-value') || '0');
          isCorrect = selectedValue === question.correct_answer_number;
        }
      } else {
        // Handle free text questions
        isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
      }

      // Show feedback
      if (options.feedback) {
        options.feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect';
        options.feedback.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
        options.feedback.setAttribute('aria-live', 'polite');
      }

      return isCorrect;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return false;
    }
  }

  revealAnswer(
    question: Question,
    options: {
      answer: string;
      explanation: string;
    }
  ): void {
    try {
      // Show correct answer
      const answerElement = document.querySelector(options.answer);
      if (answerElement) {
        let answerText = '';
        if (question.is_calculation) {
          answerText = `${question.correct_answer} ${question.answer_unit || ''}`;
        } else if (question.answers && question.answers.length > 0) {
          const correctAnswer = question.answers.find(
            a => a.answer_number === question.correct_answer_number
          );
          answerText = correctAnswer ? correctAnswer.text : question.correct_answer;
        } else {
          answerText = question.correct_answer;
        }
        answerElement.innerHTML = this.renderMarkdown(`**Correct Answer:** ${answerText}`);
        answerElement.style.display = 'block';
      }

      // Show explanation
      const explanationElement = document.querySelector(options.explanation);
      if (explanationElement) {
        explanationElement.innerHTML = this.renderMarkdown(question.why);
        explanationElement.style.display = 'block';
      }
    } catch (error) {
      console.error('Error revealing answer:', error);
    }
  }

  private setupExternalLinks(): void {
    // Handle external links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // Handle PDF links
    document.querySelectorAll('a[href$=".pdf"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPdfViewer(link.getAttribute('href') || '');
      });
    });

    // Handle image clicks
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.classList.contains('question-image')) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          window.open(img.src, '_blank', 'noopener,noreferrer');
        });
      }
    });
  }

  openPdfViewer(url: string): void {
    const pdfPane = document.getElementById('pdfPane');
    const pdfFrame = document.getElementById('pdfFrame') as HTMLIFrameElement;
    
    if (pdfPane && pdfFrame) {
      pdfFrame.src = url;
      pdfPane.style.display = 'block';
      
      // Setup PDF controls
      this.setupPdfControls();
    }
  }

  private setupPdfControls(): void {
    const pdfPane = document.getElementById('pdfPane');
    if (!pdfPane) return;

    const closeBtn = pdfPane.querySelector('.pdf-close');
    const zoomInBtn = pdfPane.querySelector('.pdf-zoom-in');
    const zoomOutBtn = pdfPane.querySelector('.pdf-zoom-out');

    closeBtn?.addEventListener('click', () => {
      pdfPane.style.display = 'none';
    });

    zoomInBtn?.addEventListener('click', () => {
      const iframe = pdfPane.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        const currentScale = parseFloat(iframe.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
        iframe.style.transform = `scale(${Math.min(currentScale * 1.2, 3)})`;
      }
    });

    zoomOutBtn?.addEventListener('click', () => {
      const iframe = pdfPane.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        const currentScale = parseFloat(iframe.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
        iframe.style.transform = `scale(${Math.max(currentScale / 1.2, 0.5)})`;
      }
    });
  }

  initPdfViewer(): void {
    // Initialize PDF viewer if needed
    this.setupPdfControls();
  }

  clearQuestion(): void {
    // Clear all question elements
    const elements = [
      '#qText', '#qTitle', '#qImg', '#answerOptions', 
      '#feedback', '#answer', '#explanation'
    ];

    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = '';
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
        }
      }
    });

    // Hide calculator
    const calcContainer = document.querySelector('.calculator') as HTMLElement;
    if (calcContainer) {
      calcContainer.style.display = 'none';
    }
  }
}

export const questionRenderer = QuestionRenderer.getInstance();
