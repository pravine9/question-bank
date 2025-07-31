# Question Bank

This project provides a lightweight Flask app for revising question banks.
The questions are scraped from an external site and saved as JSON.  A
few helper scripts take care of collecting and cleaning this data.  The web
interface then lets you practise a subset of questions entirely in the
browser, storing your progress locally.


Open `templates/index.html` in your browser to use the interface.


## Practice overview

1. **Start practice from `index.html`** – choose a bank, enter the number of
   questions and hit **Start Practice** to open the dedicated test page.
2. **Navigation** – move through questions using the **Back** and **Next**
   buttons. A flag icon next to each number lets you mark items for review.
3. **Finish and review** – click **Finish Test** to see your results. From the
   summary screen you can **Review** individual questions and use the **Home**
   link to return to the start page.
4. **Question statistics** – right/wrong counts and flagged status are stored
   in `localStorage` under `questionStats`. The index page provides a "Check
   Question Stats" form for looking up stats by question ID.
5. **Folder structure** – raw question JSON files live in `output/` while
   cleaned versions created by `scripts/clean_questions.py` are stored in
   `cleaned/` if that directory exists. The server automatically prefers the
   cleaned copies when available.

## Repository layout

```
Burp/            # Scripts for scraping and analysing question data
output/          # Raw question JSON files downloaded from the web
cleaned/         # Normalised versions of the JSON files (generated)
scripts/         # Helper utilities such as data cleaning
static/          # Client-side JS and CSS
templates/       # Jinja2 templates for the Flask app
```

`cleaned/` is ignored by git and may not exist initially. The application
prefers this folder when present, otherwise it loads data directly from
`output/`.

## Application structure

The backend lives in **app.py** and exposes a few routes:

* `/` – landing page where you choose a bank and number of questions
* `/practice` – renders `practice.html` with the chosen questions
* `/question` – API endpoint returning a random question in JSON
* `/htmlDelivery/index.html` – alias used by `launch.html`
* `/launch.html` – simple wrapper that embeds the interface in an iframe

`app.py` reads all JSON files from `cleaned/` or `output/` and builds a map
of available banks. Question selection happens server‑side before the
template is rendered.

Client logic is contained in `static/main.js` (for the landing page) and
inline scripts within `practice.html`. CSS files in `static/` style both
pages.

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

Questions scraped from the web live under `output/`. Running
`scripts/clean_questions.py` writes cleaned versions into `cleaned/`. If the
`cleaned/` directory exists, the app loads questions from there; otherwise it
falls back to `output/`.

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

## Helper scripts

### `Burp/`

* `grabquetions.py` – interactively scrape questions from preregshortcuts.com using `curl` and save them into the `output/` directory. It prompts for a question bank and weighting and repeats requests until no new questions are found.
* `checkquestions.py` – count the number of questions in each JSON file within `output/` and print totals per bank.

### `scripts/`

* `clean_questions.py` – normalise whitespace and punctuation in the scraped JSON files and write the cleaned versions to `cleaned/`.

