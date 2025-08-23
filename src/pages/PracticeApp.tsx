import React, { useState } from 'react';
import type { Question, PracticeResult } from '@/types/question';

function loadQuestions(): Question[] {
  const questions = (window as any).calculations as Question[] | undefined;
  return questions ? questions.slice(0, 5) : [];
}

export default function PracticeApp() {
  const [questions] = useState<Question[]>(loadQuestions());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const question = questions[index];

  const selectAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const next = () => setIndex(i => Math.min(i + 1, questions.length - 1));
  const back = () => setIndex(i => Math.max(i - 1, 0));

  const finish = () => {
    const correct = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const result: PracticeResult = {
      id: String(Date.now()),
      bank: 'calculations',
      totalQuestions: questions.length,
      correctAnswers: correct,
      score: Math.round((correct / questions.length) * 100),
      duration: 0,
      date: new Date().toISOString(),
      flaggedQuestions: 0,
      questions,
      answers,
      flagged: []
    };

    try {
      localStorage.setItem('latest_result', JSON.stringify(result));
      const historyStr = localStorage.getItem('practice_history');
      const history = historyStr ? JSON.parse(historyStr) : { results: [] };
      history.results.push(result);
      localStorage.setItem('practice_history', JSON.stringify(history));
    } catch {
      // ignore storage errors
    }

    window.location.href = 'summary.html';
  };

  if (!question) {
    return <div>No questions available.</div>;
  }

  return (
    <div className="practice-app">
      <h2>Question {index + 1} of {questions.length}</h2>
      <div className="question-text" dangerouslySetInnerHTML={{ __html: question.text }} />
      <div className="options">
        {question.answers.map(ans => (
          <label key={ans.answer_number}>
            <input
              type="radio"
              name="answer"
              value={ans.answer_number}
              checked={answers[question.id] === String(ans.answer_number)}
              onChange={() => selectAnswer(String(ans.answer_number))}
            />
            {ans.text}
          </label>
        ))}
      </div>
      <div className="nav">
        <button onClick={back} disabled={index === 0}>Back</button>
        {index < questions.length - 1 ? (
          <button onClick={next}>Next</button>
        ) : (
          <button onClick={finish}>Finish</button>
        )}
      </div>
    </div>
  );
}
