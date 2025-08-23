import type { Question } from '@/types/question';

interface RenderOptions {
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
  reviewMode?: boolean;
  userAnswer?: string;
}

interface QuestionRenderer {
  initPdfViewer(): void;
  renderQuestion(question: Question, config?: RenderOptions): void;
}

function sanitize(content: string, inline: boolean = false): string {
  if (typeof (window as any).DOMPurify !== 'undefined' && typeof (window as any).marked !== 'undefined') {
    try {
      const rawHtml = inline ? 
        (window as any).marked.parseInline(content) : 
        (window as any).marked.parse(content);
      return (window as any).DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.warn('Error processing markdown:', e);
      return content;
    }
  }
  return content;
}

function get(selector?: string): HTMLElement | null {
  return selector ? document.querySelector(selector) : null;
}

function enhanceLinksAndImages(element: HTMLElement): void {
  // Handle internal resource images
  const images = element.querySelectorAll('img[src^="resources/"]');
  images.forEach((img) => {
    const imgEl = img as HTMLImageElement;
    imgEl.style.cursor = 'pointer';
    imgEl.onclick = () => window.open(imgEl.src, '_blank');
  });

  // Handle links that should open PDFs
  const links = element.querySelectorAll('a[href$=".pdf"]');
  links.forEach((link) => {
    const linkEl = link as HTMLAnchorElement;
    linkEl.target = '_blank';
  });
}

// Main render function
function renderQuestion(question: Question, config: RenderOptions = {}): void {
  const {
    text: textSelector = '#questionText',
    title: titleSelector = '#questionTitle',
    img: imgSelector = '#questionImage',
    options: optionsSelector = '#answerOptions',
    input: inputSelector = '#calculatorInput',
    unit: unitSelector = '#answerUnit',
    feedback: feedbackSelector = '#feedback',
    answer: answerSelector = '#answer',
    explanation: explanationSelector = '#explanation'
  } = config;

  const textEl = get(textSelector);
  const titleEl = get(titleSelector);
  const imgEl = get(imgSelector);
  const optionsEl = get(optionsSelector);
  const inputEl = get(inputSelector);
  const unitEl = get(unitSelector);
  const feedbackEl = get(feedbackSelector);
  const answerEl = get(answerSelector);
  const explanationEl = get(explanationSelector);
  const showInput = config.showInput !== false;
  const reviewMode = config.reviewMode || false;
  const userAnswer = config.userAnswer || '';

  if (titleEl) {
    const rawTitle = question.title || '';
    const needsBlock = /\n/.test(rawTitle) || /(^|\n)\s*\*\s/.test(rawTitle);
    const title = sanitize(rawTitle, !needsBlock);
    if (typeof (window as any).DOMPurify !== 'undefined' && typeof (window as any).marked !== 'undefined') {
      titleEl.innerHTML = title;
    } else {
      titleEl.textContent = title;
    }
    enhanceLinksAndImages(titleEl);
  }
  
  if (textEl) {
    const txt = sanitize(question.text || '', false);
    if (typeof (window as any).DOMPurify !== 'undefined' && typeof (window as any).marked !== 'undefined') {
      textEl.innerHTML = txt;
    } else {
      textEl.textContent = txt;
    }
    enhanceLinksAndImages(textEl);
  }

  if (imgEl && question.resource_image) {
    (imgEl as HTMLImageElement).src = question.resource_image;
    imgEl.style.display = '';
    imgEl.style.cursor = 'pointer';
    (imgEl as HTMLImageElement).onclick = () => window.open(question.resource_image!, '_blank');
  } else if (imgEl) {
    imgEl.style.display = 'none';
  }

  if (optionsEl && question.answers && question.answers.length > 0) {
    optionsEl.innerHTML = '';
    optionsEl.style.display = '';
    
    question.answers.forEach((answer) => {
      const label = document.createElement('label');
      const span = document.createElement('span');
      span.textContent = answer.text;
      
      label.appendChild(span);
      
             if (reviewMode) {
         // In review mode, highlight answers based on user selection and correctness
         const isUserSelected = userAnswer === answer.answer_number.toString();
         const isCorrect = question.correct_answer_number === answer.answer_number;
         
         if (isUserSelected) {
           label.classList.add('user-selected');
         }
         
         if (isCorrect) {
           label.classList.add('correct-answer');
         } else if (isUserSelected) {
           label.classList.add('incorrect-answer');
         }
       } else {
        // Normal mode - add radio button and click handlers
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = answer.answer_number.toString();
        radio.dataset.answer = answer.text;
        
        label.insertBefore(radio, span);
        
        // Add click handler for the new styling with deselection
        label.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Check if this label is already selected
          const isCurrentlySelected = label.classList.contains('selected');
          
          // Remove selected class from all labels
          const allLabels = optionsEl.querySelectorAll('label');
          allLabels.forEach(l => l.classList.remove('selected'));
          
          if (!isCurrentlySelected) {
            // Add selected class to clicked label
            label.classList.add('selected');
            
            // Check the radio button (for compatibility with existing code)
            radio.checked = true;
            
            // Trigger change event for existing handlers
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Deselect the radio button
            radio.checked = false;
            
            // Trigger change event for existing handlers
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
      
      optionsEl!.appendChild(label);
    });
  }

  if (inputEl && question.is_calculation) {
    inputEl.style.display = showInput ? '' : 'none';
    if (showInput) {
      const input = inputEl.querySelector('input') as HTMLInputElement;
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }

  if (unitEl && question.answer_unit) {
    unitEl.textContent = question.answer_unit;
    unitEl.style.display = showInput ? '' : 'none';
  }

  // Reset feedback elements
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
  }
  if (answerEl) {
    answerEl.innerHTML = '';
    answerEl.className = 'answer';
  }
  if (explanationEl) {
    explanationEl.innerHTML = '';
    explanationEl.className = 'explanation';
  }
}



function initPdfViewer(): void {
  // Initialize PDF viewer functionality
  // This can be expanded based on your PDF viewing requirements
  console.log('PDF viewer initialized');
}

// Create the question renderer object
export const questionRenderer: QuestionRenderer = {
  initPdfViewer,
  renderQuestion
};
