# Question Bank

This project provides a lightweight web interface for revising question banks.
The questions are scraped from an external site and saved as JSON.  A
few helper scripts take care of collecting and cleaning this data.  The web
interface then lets you practise a subset of questions entirely in the
browser, storing your progress locally.


Open `templates/index.html` in your browser to use the interface.


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
5. **Folder structure** – raw question JSON files live in `question_bank/` while
   cleaned versions created by `scripts/clean_questions.js` are stored in
   `cleaned/` if that directory exists. The interface uses the cleaned copies when available.

## Repository layout

```
Burp/            # Scripts for scraping and analysing question data
question_bank/   # Raw question JSON files downloaded from the web
cleaned/         # Normalised versions of the JSON files (generated)
scripts/         # Helper utilities such as data cleaning
static/          # Client-side JS and CSS
templates/       # HTML templates for the interface
```

`cleaned/` is ignored by git and may not exist initially. The interface
prefers this folder when present, otherwise it loads data directly from
`question_bank/`.


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

Use the **Back** and **Next** buttons at the bottom of the practice page to move
between questions. Each question number in the sidebar has a small flag icon—
click it to mark that question for review. Flagging and your answers are saved
in `localStorage` so you can revisit them later. The progress bar in the header
shows how far through the test you are.

### Finishing a test

Press **Finish Test** in the header when you reach the end. A summary table
lists every question with your response and the correct answer. Use the
**Review** buttons to revisit a specific question. A **Home** link at the top
of the summary screen returns you to the start page.

### Question statistics

The browser keeps track of how often you answer each question correctly or
incorrectly. These counts are stored in `localStorage` under the key
`questionStats` along with whether you flagged the question for review. Use the
"Check Question Stats" form on the index page to look up your history for a
given question ID.

### Folder structure

Questions live under `question_bank/`. Running
`scripts/clean_questions.js` writes cleaned versions into `cleaned/`. If the
`cleaned/` directory exists, the app loads questions from there; otherwise it
falls back to `output/`. (This may not be required if the JSON can be parsed without this extra folder/file creation step)

### Question format

Each question is represented as a JSON object. Key fields include:

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

### Unicode characters in JSON

The raw JSON uses escaped Unicode sequences for punctuation and symbols. Common examples include:

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

## Helper scripts

### `scripts/`

* `clean_questions.js` – normalise whitespace and punctuation in the scraped JSON files and write the cleaned versions to `cleaned/`.

