import type { Question } from '@/types/question';

export function evaluateAnswer(question: Question, userAnswer: string): boolean {
  if (!question || !userAnswer) {
    return false;
  }

  if (question.is_free) {
    return (
      userAnswer.toLowerCase().trim() ===
      question.correct_answer.toLowerCase().trim()
    );
  }

  if (question.is_calculation) {
    const userNum = parseFloat(userAnswer);
    const correctNum =
      question.correct_answer_number ?? parseFloat(question.correct_answer);
    if (isNaN(userNum) || isNaN(correctNum)) {
      return false;
    }
    const tolerance = Math.abs(correctNum * 0.05); // 5% tolerance
    return Math.abs(userNum - correctNum) <= tolerance;
  }

  const correctAnswerNumber = question.correct_answer_number;
  if (correctAnswerNumber === undefined || correctAnswerNumber === null) {
    return false;
  }
  return parseInt(userAnswer) === correctAnswerNumber;
}

export function getCorrectAnswerText(question: Question): string {
  if (question.is_calculation) {
    return question.correct_answer || 'Calculation required';
  }

  const correctAnswerNumber = question.correct_answer_number;
  if (
    correctAnswerNumber !== undefined &&
    correctAnswerNumber !== null &&
    question.answers
  ) {
    const correctAnswer = question.answers.find(
      a => a.answer_number === correctAnswerNumber
    );
    return correctAnswer ? correctAnswer.text : question.correct_answer || 'Unknown';
  }

  return question.correct_answer || 'Unknown';
}

