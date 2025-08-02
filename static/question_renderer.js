(function(global){
  function sanitize(text){
    text = (text || '').replace(/\u2028/g, '\n').replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
    if (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') {
      return DOMPurify.sanitize(marked.parse(text));
    }
    return text;
  }

  function renderQuestion(question, config){
    config = config || {};
    const get = sel => sel ? document.querySelector(sel) : null;

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

    if (titleEl) titleEl.textContent = question.title || '';
    if (textEl) {
      const txt = sanitize(question.text || '');
      if (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') {
        textEl.innerHTML = txt;
      } else {
        textEl.textContent = txt;
      }
    }

    if (imgEl) {
      if (question.resource_image) {
        imgEl.src = question.resource_image;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }
    }

    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.classList.remove('correct', 'incorrect');
    }
    if (answerEl) { answerEl.textContent = ''; answerEl.style.display = 'none'; }
    if (explanationEl) { explanationEl.innerHTML = ''; explanationEl.style.display = 'none'; }

    let buttons = [];
    if (optionsEl) { optionsEl.textContent = ''; optionsEl.style.display = ''; }
    if (inputEl) { inputEl.style.display = 'none'; }
    if (unitEl) { unitEl.style.display = 'none'; }

    if (showInput) {
      if (question.answers && question.answers.length) {
        if (optionsEl) {
          question.answers.forEach(a => {
            const btn = document.createElement('button');
            btn.textContent = a.text;
            btn.dataset.num = a.answer_number;
            optionsEl.appendChild(btn);
            buttons.push(btn);
          });
        }
      } else {
        if (optionsEl) optionsEl.style.display = 'none';
        if (inputEl) {
          inputEl.value = '';
          inputEl.style.display = 'block';
        }
        if (unitEl) {
          if (question.answer_unit) {
            unitEl.textContent = question.answer_unit;
            unitEl.style.display = 'inline';
          } else {
            unitEl.style.display = 'none';
          }
        }
      }
    } else {
      if (optionsEl) optionsEl.style.display = 'none';
      if (inputEl) inputEl.style.display = 'none';
      if (unitEl) unitEl.style.display = 'none';
    }

    return {buttons, input: inputEl};
  }

  function updateStats(id, correct){
    const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
    if(!data[id]) data[id] = {right:0, wrong:0, saved:false};
    if(correct) data[id].right++; else data[id].wrong++;
    localStorage.setItem('questionStats', JSON.stringify(data));
  }

  function evaluateAnswer(question, selected, config){
    config = config || {};
    const get = sel => {
      if (!sel) return null;
      return typeof sel === 'string' ? document.querySelector(sel) : sel;
    };

    const optionsEl = get(config.options);
    const feedbackEl = get(config.feedback);
    const inputEl = get(config.input); // currently unused but kept for future

    let correct = false;
    if (question.answers && question.answers.length){
      correct = String(selected) === String(question.correct_answer_number);
      if (optionsEl){
        optionsEl.querySelectorAll('button').forEach(b => b.disabled = true);
        const correctBtn = optionsEl.querySelector(`button[data-num='${question.correct_answer_number}']`);
        if (correctBtn) correctBtn.classList.add('correct');
      }
    } else {
      const value = (selected || '').trim();
      correct = value === (question.correct_answer || '');
      if (inputEl) {
        // allow future behaviour like disabling input if needed
      }
    }

    if (feedbackEl){
      feedbackEl.textContent = correct ? 'Correct!' : 'Incorrect';
      feedbackEl.classList.remove('correct', 'incorrect');
      feedbackEl.classList.add(correct ? 'correct' : 'incorrect');
    }

    updateStats(question.id, correct);
    return correct;
  }

  global.questionRenderer = { renderQuestion, evaluateAnswer, updateStats };
})(this);
