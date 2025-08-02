function recordAnswer(showFeedback){
  const q = questions[index];
  const calc = document.querySelector('.calculator');
  const input = calc.querySelector('input');
  const opts = document.querySelector('.options');
  const fb = document.querySelector('.feedback');

  let userAns = null;
  let userText = '';
  if(q.answers && q.answers.length){
    userAns = selected;
    const obj = q.answers.find(a => a.answer_number == selected);
    userText = obj ? obj.text : '';
  } else {
    userAns = input.value.trim();
    userText = userAns ? userAns + (q.answer_unit ? ` ${q.answer_unit}` : '') : '';
  }

  let correctText = '';
  if(q.answers && q.answers.length){
    const obj = q.answers.find(a => a.answer_number == q.correct_answer_number);
    correctText = obj ? obj.text : '';
  } else {
    correctText = (q.correct_answer || '') + (q.answer_unit ? ` ${q.answer_unit}` : '');
  }

  const hooks = showFeedback ? { options: opts, feedback: fb } : undefined;
  const correct = questionRenderer.evaluateAnswer(q, userAns, hooks);

  responses[index] = { answer: userAns, text: userText, correctAnswer: correctText, correct };
  updateProgress();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { recordAnswer };
} else {
  window.recordAnswer = recordAnswer;
}
