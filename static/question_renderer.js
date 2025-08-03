function sanitize(text, inline) {
  text = (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .trim();

  // Strip unmatched leading/trailing asterisks
  let prev;
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
  if (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true });
    const parsed = inline ? marked.parseInline(text) : marked.parse(text);
    return DOMPurify.sanitize(parsed);
  }
  return text;
}

function enhanceLinksAndImages(el) {
  if (!el) return;
  el.querySelectorAll('a').forEach(a => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  el.querySelectorAll('img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      window.open(img.src, '_blank', 'noopener,noreferrer');
    });
  });
}

function resetUI({ feedbackEl, answerEl, explanationEl, optionsEl, inputEl, unitEl }) {
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct', 'incorrect');
  }
  if (answerEl) {
    answerEl.textContent = '';
    answerEl.style.display = 'none';
  }
  if (explanationEl) {
    explanationEl.innerHTML = '';
    explanationEl.style.display = 'none';
  }

  if (optionsEl) {
    optionsEl.textContent = '';
    optionsEl.style.display = '';
  }
  if (inputEl) {
    inputEl.style.display = 'none';
  }
  if (unitEl) {
    unitEl.style.display = 'none';
  }
}

function renderQuestion(question, config) {
  config = config || {};
  const get = sel => (sel ? document.querySelector(sel) : null);

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
    const title = sanitize(question.title || '', true);
    if (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') {
      titleEl.innerHTML = title;
    } else {
      titleEl.textContent = title;
    }
    enhanceLinksAndImages(titleEl);
  }
  if (textEl) {
    const txt = sanitize(question.text || '');
    if (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') {
      textEl.innerHTML = txt;
    } else {
      textEl.textContent = txt;
    }
    enhanceLinksAndImages(textEl);
  }

  if (imgEl) {
    if (question.resource_image) {
      imgEl.src = question.resource_image;
      imgEl.style.display = 'block';
      imgEl.style.cursor = 'pointer';
      imgEl.onclick = () => {
        window.open(imgEl.src, '_blank', 'noopener,noreferrer');
      };
    } else {
      imgEl.style.display = 'none';
      imgEl.onclick = null;
    }
  }

  resetUI({ feedbackEl, answerEl, explanationEl, optionsEl, inputEl, unitEl });

  let buttons = [];

  if (showInput) {
    if (question.answers && question.answers.length) {
      if (optionsEl) {
        question.answers.forEach(a => {
          const btn = document.createElement('button');
          btn.innerHTML = sanitize(a.text, true);
          enhanceLinksAndImages(btn);
          btn.dataset.num = a.answer_number;
          optionsEl.appendChild(btn);
          buttons.push(btn);
        });
      }
    } else {
      if (optionsEl) optionsEl.style.display = 'none';
      if (inputEl) {
        inputEl.value = '';
        inputEl.style.display = 'inline-block';
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

  return { buttons, input: inputEl };
}

function updateStats(id, correct) {
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  if (!data[id]) data[id] = { right: 0, wrong: 0, saved: false };
  if (correct) data[id].right++;
  else data[id].wrong++;
  localStorage.setItem('questionStats', JSON.stringify(data));
}

function evaluateAnswer(question, value, hooks) {
  hooks = hooks || {};
  const optionsEl = hooks.options;
  const feedbackEl = hooks.feedback;

  let correct = false;
  if (question.answers && question.answers.length) {
    correct = String(value) == String(question.correct_answer_number);
    if (optionsEl) {
      optionsEl.querySelectorAll('button').forEach(b => (b.disabled = true));
      const correctBtn = optionsEl.querySelector(`button[data-num='${question.correct_answer_number}']`);
      if (correctBtn) correctBtn.classList.add('correct');
    }
  } else {
    correct = String(value).trim() === String(question.correct_answer || '');
  }

  if (feedbackEl) {
    feedbackEl.textContent = correct ? 'Correct!' : 'Incorrect';
    feedbackEl.className = (feedbackEl.className || '').replace(/\b(correct|incorrect)\b/g, '').trim();
    feedbackEl.classList.add(correct ? 'correct' : 'incorrect');
  }

  updateStats(question.id, correct);
  return correct;
}

function revealAnswer(question, targets) {
  targets = targets || {};
  const get = sel => {
    if (!sel) return null;
    return typeof sel === 'string' ? document.querySelector(sel) : sel;
  };

  const answerEl = get(targets.answer);
  const explanationEl = get(targets.explanation);
  const prefix = targets.prefix || 'Answer';

  let answerText = '';
  if (question.answers && question.answers.length) {
    const obj = question.answers.find(a => a.answer_number == question.correct_answer_number);
    answerText = obj ? obj.text : '';
  } else {
    answerText = question.correct_answer || '';
    if (question.answer_unit) answerText += ' ' + question.answer_unit;
  }

  if (answerEl) {
    answerEl.textContent = answerText ? `${prefix}: ${answerText}` : '';
    answerEl.style.display = 'block';
  }

  if (explanationEl) {
    explanationEl.innerHTML = sanitize(question.why || 'No explanation');
    explanationEl.style.display = 'block';
    enhanceLinksAndImages(explanationEl);
  }

  return { answerText };
}

// ----- PDF handling utilities -----
let pdfPane, pdfFrame, pdfZoom = 1;

function initPdfViewer() {
  pdfPane = document.getElementById('pdfPane');
  pdfFrame = document.getElementById('pdfFrame');
  document.querySelector('.pdf-close')?.addEventListener('click', closePdf);
  document.querySelector('.pdf-zoom-in')?.addEventListener('click', () => {
    pdfZoom += 0.1;
    if (pdfFrame) pdfFrame.style.transform = `scale(${pdfZoom})`;
  });
  document.querySelector('.pdf-zoom-out')?.addEventListener('click', () => {
    pdfZoom = Math.max(0.1, pdfZoom - 0.1);
    if (pdfFrame) pdfFrame.style.transform = `scale(${pdfZoom})`;
  });
}

function openPdf(url) {
  if (!pdfPane || !pdfFrame) initPdfViewer();
  if (!pdfPane || !pdfFrame) return;
  pdfFrame.src = url;
  pdfZoom = 1;
  pdfFrame.style.transform = 'scale(1)';
  pdfPane.style.display = 'flex';
}

function closePdf() {
  if (!pdfPane || !pdfFrame) initPdfViewer();
  if (!pdfPane || !pdfFrame) return;
  pdfPane.style.display = 'none';
  pdfFrame.src = '';
}

function convertPdfLinks(el) {
  if (!el) return;
  el.querySelectorAll('a[href$=".pdf"]').forEach(a => {
    const btn = document.createElement('button');
    btn.textContent = 'Open PDF';
    btn.className = 'pdf-btn';
    btn.onclick = e => { e.preventDefault(); openPdf(a.href); };
    a.replaceWith(btn);
  });
}

const questionRendererObj = {
  renderQuestion,
  updateStats,
  sanitize,
  evaluateAnswer,
  revealAnswer,
  openPdf,
  closePdf,
  convertPdfLinks,
  initPdfViewer
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = questionRendererObj;
} else {
  window.questionRenderer = questionRendererObj;
}

