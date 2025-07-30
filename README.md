# Question Bank

This project provides a small web interface for practising questions from JSON files.

## Setup

1. Create and activate a virtual environment (optional but recommended):

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Running the app

Start the Flask development server by executing `app.py`:

```bash
python app.py
```

By default the server loads question files from the `cleaned/` folder if it exists, otherwise it uses `output/`.

Open a browser to `http://localhost:5000/` to view the interface.

## Helper scripts

### `Burp/`

* `grabquetions.py` – interactively scrape questions from preregshortcuts.com using `curl` and save them into the `output/` directory. It prompts for a question bank and weighting and repeats requests until no new questions are found.
* `checkquestions.py` – count the number of questions in each JSON file within `output/` and print totals per bank.

### `scripts/`

* `clean_questions.py` – normalise whitespace and punctuation in the scraped JSON files and write the cleaned versions to `cleaned/`.

