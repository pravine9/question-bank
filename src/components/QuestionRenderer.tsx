import React, { useEffect, useRef, useState } from 'react';
import type { Question } from '@/types/question';

interface QuestionRendererProps {
  question: Question;
  variant: 'index' | 'practice';
  onAnswerChange?: (value: string) => void;
  selectedAnswer?: string;
}

function sanitize(content: string, inline = false): string {
  if (typeof (window as any).DOMPurify !== 'undefined' && typeof (window as any).marked !== 'undefined') {
    try {
      const rawHtml = inline
        ? (window as any).marked.parseInline(content)
        : (window as any).marked.parse(content);
      return (window as any).DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.warn('Error processing markdown:', e);
      return content;
    }
  }
  return content;
}

function enhanceLinksAndImages(element: HTMLElement): void {
  const images = element.querySelectorAll('img[src^="resources/"]');
  images.forEach(img => {
    const imgEl = img as HTMLImageElement;
    imgEl.style.cursor = 'pointer';
    imgEl.onclick = () => window.open(imgEl.src, '_blank');
  });

  const links = element.querySelectorAll('a[href$=".pdf"]');
  links.forEach(link => {
    const linkEl = link as HTMLAnchorElement;
    linkEl.target = '_blank';
  });
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  variant,
  onAnswerChange,
  selectedAnswer
}) => {
  const [selected, setSelected] = useState<string>(selectedAnswer || '');
  const textRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(selectedAnswer || '');
  }, [selectedAnswer, question]);

  useEffect(() => {
    if (textRef.current) enhanceLinksAndImages(textRef.current);
    if (titleRef.current) enhanceLinksAndImages(titleRef.current);
  }, [question]);

  const handleSelect = (value: string) => {
    const newValue = selected === value ? '' : value;
    setSelected(newValue);
    onAnswerChange?.(newValue);
  };

  const renderOptions = () => {
    if (!question.answers) return null;
    return (
      <div className={`question-options ${variant}`}>
        {question.answers.map(answer => {
          const value = String(answer.answer_number);
          const isSelected = selected === value;
          return (
            <label
              key={value}
              className={isSelected ? 'selected' : undefined}
              onClick={e => {
                e.preventDefault();
                handleSelect(value);
              }}
            >
              <input
                type="radio"
                name="answer"
                value={value}
                checked={isSelected}
                readOnly
              />
              <span>{answer.text}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const rawTitle = question.title || '';
  const needsBlock = /\n/.test(rawTitle) || /(^|\n)\s*\*\s/.test(rawTitle);
  const titleHtml = sanitize(rawTitle, !needsBlock);
  const textHtml = sanitize(question.text || '', false);

  return (
    <div className="question-renderer">
      {question.title && (
        <div
          ref={titleRef}
          className="question-title"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />
      )}
      {question.text && (
        <div
          ref={textRef}
          className="question-text"
          dangerouslySetInnerHTML={{ __html: textHtml }}
        />
      )}
      {question.resource_image && (
        <img
          src={question.resource_image}
          alt="Question image"
          className="question-image"
          onClick={() => window.open(question.resource_image!, '_blank')}
        />
      )}
      {renderOptions()}
      {question.is_calculation && (
        <div className="calculator">
          <label htmlFor="calcInput">Answer</label>
          <input type="number" id="calcInput" />
          {question.answer_unit && <span className="unit">{question.answer_unit}</span>}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;

