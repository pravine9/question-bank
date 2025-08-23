import type { Question } from '../src/types/question';

interface RenderConfig {
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

interface QuestionRenderer {
  initPdfViewer(): void;
  renderQuestion(question: Question, config?: RenderConfig): void;
}

function sanitize(text: string, inline: boolean): string {
  text = (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .trim();

  // Strip unmatched leading/trailing asterisks
  let prev: string;
  do {
    prev = text;
    if (text.startsWith('**') && !text.slice(2).includes('**')) {
      text = text.slice(2).trim();
    } else if (text.startsWith('*') && !text.slice(1).includes('*')) {
      text = text.slice(1).trim();
    } else if (text.endsWith('**') && !text.slice(0, -2).includes('**')) {
      text = text.slice(0, -2).trim();
    } else if (text.endsWith('*') && !text.slice(0, -1).includes('*')) {
      text = text.slice(0, -1).trim();
    }
  } while (text !== prev);
  
  if (typeof (window as any).DOMPurify !== 'undefined' && typeof (window as any).marked !== 'undefined') {
    (window as any).marked.setOptions({ breaks: true });
    const parsed = inline ? (window as any).marked.parseInline(text) : (window as any).marked.parse(text);
    return (window as any).DOMPurify.sanitize(parsed);
  }
  return text;
}

function enhanceLinksAndImages(el: HTMLElement): void {
  if (!el) return;
  
  el.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  
  el.querySelectorAll('img').forEach((img: HTMLImageElement) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      window.open(img.src, '_blank', 'noopener,noreferrer');
    });
  });
}



function renderQuestion(question: Question, config: RenderConfig = {}): void {
  const get = (sel?: string): HTMLElement | null => (sel ? document.querySelector(sel) : null);

  const textEl = get(config.text);
  const titleEl = get(config.title);
  const imgEl = get(config.img);
  const optionsEl = get(config.options);
  const inputEl = get(config.input);
  const unitEl = get(config.unit);
  const feedbackEl = get(config.feedback);
  const answerEl = get(config.answer);
  const explanationEl = get(config.explanation);
  const showInput = config.showInput !== false;

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
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = answer.answer_number.toString();
      radio.dataset.answer = answer.text;
      
      const span = document.createElement('span');
      span.textContent = answer.text;
      
      label.appendChild(radio);
      label.appendChild(span);
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
  if (feedbackEl) feedbackEl.textContent = '';
  if (answerEl) answerEl.style.display = 'none';
  if (explanationEl) explanationEl.style.display = 'none';
}



function initPdfViewer(): void {
  // Initialize PDF viewer functionality
  // This can be expanded based on your PDF viewing requirements
  console.log('PDF viewer initialized');
}

// Export the question renderer object
export const questionRenderer: QuestionRenderer = {
  initPdfViewer,
  renderQuestion
};



window.questionRenderer = questionRenderer;
