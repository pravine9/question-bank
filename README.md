# Question Bank

This project provides a lightweight web interface for revising question banks.
The questions are scraped from an external site and saved as JavaScript module files.
A few helper scripts take care of collecting this data. The web
interface then lets you practise a subset of questions entirely in the
browser, storing your progress locally.


Open `templates/index.html` directly in your browser to use the interface—no web server required. This repo is designed to run offline without any localhosting required.


## Practice overview

1. **Start practice from `index.html`** – choose a bank, enter the number of
   questions and hit **Start Practice** to open the dedicated test page.
2. **Navigation** – move through questions using the **Back** and **Next**
   buttons. Use the flag button to mark items for review for the current test session.
3. **Finish and review** – click **Finish Test** to see your results. From the
   summary screen you can **Review** individual questions with feedback shown on each one and use the **Home**
   link to return to the start page.
4. **Question statistics** – right/wrong counts are stored
   in `localStorage` under `questionStats`. Flagged status should not be stored after test ends. The index page provides a "Check
   Question Stats" form for looking up stats by question ID.
5. **Folder structure** – question bank JavaScript modules live in `question_banks/`.
   The available banks are registered in `static/banks.js`.

## Repository layout

```
Burp/            # Scripts for scraping and analysing question data
question_banks/  # Question bank JavaScript module files
static/          # Client-side JS and CSS (includes banks registry in banks.js)
templates/       # HTML templates for the interface
```

Available banks are listed in `static/banks.js` which maps to modules in
`question_banks/`.

## Code reuse

Common browser-side logic lives in `static/question_renderer.js`. This module
sanitises question text, builds the UI, checks answers and reveals
explanations. Reuse these utilities instead of re‑implementing them:

```javascript
// Render a question
const { buttons, input } = questionRenderer.renderQuestion(question, {
  text: '#qText',
  options: '#answerOptions',
  input: '#calcInput',
  unit: '#answerUnit',
  feedback: '#feedback',
  answer: '#answer',
  explanation: '#explanation',
  showInput: true
});

// Evaluate a user response
const ok = questionRenderer.evaluateAnswer(question, input.value, {
  options: document.querySelector('#answerOptions'),
  feedback: document.querySelector('#feedback')
});

// Reveal the correct answer and explanation
questionRenderer.revealAnswer(question, {
  answer: '#answer',
  explanation: '#explanation'
});

// Toggle flagged status for review
const flagged = toggleFlag(question.id); // true when flagged
```

Both `static/main.js` and `static/practice.js` call these helpers so the
single‑question view and practice interface behave consistently.

When updating the question markup, mirror changes in both
`templates/index.html` and `templates/practice.html` so they render the
answer field identically (a simple "Answer" label and input without
preceding icons). Keeping these pages in sync avoids confusing
differences between the single question view and the practice test.

## Burp scripts

Two helper scripts in `Burp/` operate directly on the JavaScript question modules:

* `node Burp/checkquestions.js` – dynamically imports each file in `question_banks/` and prints question totals by bank.
* `node Burp/grabquestions.js` – interactively fetches questions from the external API and saves them to `question_banks/` as ES modules. Existing files are imported to prevent duplicate entries.

These scripts no longer read or write JSON; all data is handled as JavaScript modules.


## Using the interface

### Starting practice

The landing page (`index.html`) lets you experiment with a single question or
start a full practice session:

* Select a bank and click **Load Question** to fetch one random question.
  Use **Check** to mark your answer as right or wrong and **Reveal** to see the
  explanation.
* Enter a number of questions and click **Start Practice** to launch the
  dedicated practice interface with that many questions.

### Navigation

A fixed footer holds the navigation controls: a 🚩 **Flag Question** button for
the current item alongside **Back** and **Next**. The sidebar still lists each
question number with its own flag icon. A **Home** button sits in the
top‑right of the header.

### External links

Links inside questions open in a new tab with `noopener noreferrer` to keep the
test page focused. Links to PDFs are replaced with an **Open PDF** button that
shows the document in an overlay, and clicking images opens them in a new tab.

### Finishing a test

Press **Finish Test** in the header when you reach the end. A summary table
lists every question with your response and the correct answer. Use the
**Review** buttons to revisit a specific question. The **Home** button in the
header returns you to the start page and resets the session.

### Session saving and resuming

The practice page saves its state in `localStorage` under `practice_state`. If
you refresh or close the page, reopening `practice.html` with the same bank will
pick up where you left off. After finishing a test the summary and timer are
also stored, allowing you to reopen the page later and continue reviewing with
the **Review** buttons. Use the **Back to Summary** button to return from a
reviewed question, or **Home** at any time to clear the saved state and start a
new session.

### Question statistics

The browser keeps track of how often you answer each question correctly or
incorrectly. These counts are stored in `localStorage` under the key
`questionStats`. Flagged status is tracked in-memory for the current session and
is discarded when the test ends. Use the "Check Question Stats" form on the
index page to look up your history for a given question ID.

### Folder structure

Questions live under `question_banks/` as JavaScript modules. Available banks
are listed in `static/banks.js`, which the interface uses to locate the modules.

### Question format

Each question is represented as a JavaScript object. Key fields include:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier used for statistics |
| `title` / `text` | Markdown text for the question prompt |
| `answers` | Optional list of multiple choice answers. Each has `text` and `answer_number` |
| `correct_answer` | Text of the correct free-text answer (if not multiple choice) |
| `correct_answer_number` | Number of the correct choice when `answers` are present |
| `why` | Explanation shown when revealing the answer |
| `answer_unit` | Unit to display for calculation questions |

Additional fields like `bank`, `resource_image` and `weighting` may also be present.

Other optional fields control how the question is displayed:

* `bank` – identifies which question bank or topic the item belongs to.
* `weighting` – difficulty rating where `1` is high, `2` is medium and `3` is low.
* `resource_image` – URL of an image that will be shown inside the question. Images are scaled to fit within the question window.
* `visible` – set to `true` for questions that should appear in practice tests.
* `is_calculation` – `true` when the question expects a numeric calculation.
* `correct_answer` – correct free text answer for non‑multiple choice questions.
* `answer_unit` – unit label shown next to numeric answers.

### Unicode characters in question data

The question data uses escaped Unicode sequences for punctuation and symbols. Common examples include:

| Escape | Character | Description |
|--------|-----------|-------------|
| `\u00a0` |   | Non‑breaking space |
| `\u2013` | – | En dash |
| `\u2014` | — | Em dash |
| `\u2018` | ‘ | Left single quote |
| `\u2019` | ’ | Right single quote |
| `\u201c` | “ | Left double quote |
| `\u201d` | ” | Right double quote |
| `\u00a3` | £ | Pound sign |
| `\u2192` | → | Right arrow |
| `\u2265` | ≥ | Greater‑than or equal |
| `\u2264` | ≤ | Less‑than or equal |
| `\u2714` | ✔ | Check mark |
| `\ud83e\udde0` | 🧠 | Brain emoji |
| `\ud83d\udccc` | 📌 | Pushpin emoji |
| `\ud83d\udd3a` | 🔺 | Red triangle |

These sequences are converted to their corresponding characters when the question text is rendered in the browser.

