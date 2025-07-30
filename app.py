from flask import Flask, render_template, jsonify, request
import json
from pathlib import Path
import random

app = Flask(__name__)

DATA_DIR = Path("cleaned") if Path("cleaned").exists() else Path("output")


def _list_files():
    return [p for p in DATA_DIR.glob("*.json")]


def _bank_mapping():
    banks = {}
    for p in _list_files():
        base = p.stem.replace("_questions", "")
        base = base.replace("_low", "").replace("_medium", "").replace("_high", "")
        banks.setdefault(base, []).append(p)
    return banks

BANKS = _bank_mapping()


def _load(path: Path):
    return json.loads(path.read_text())


@app.route("/")
def index():
    return render_template("index.html", banks=sorted(BANKS))


@app.route("/launch.html")
def launch():
    """Serve a simple launch page with an embedded practice interface."""
    return render_template("launch.html")


def get_questions(bank: str, num: int):
    """Return ``num`` random questions from the files for ``bank``."""
    if bank not in BANKS:
        return []
    questions = []
    for p in BANKS[bank]:
        questions.extend(_load(p))
    random.shuffle(questions)
    return questions[:num]


@app.route("/practice")
def practice_page():
    """Serve the practice interface with a set of questions."""
    bank = request.args.get("bank")
    num = request.args.get("num", default=10, type=int)
    if bank not in BANKS:
        return render_template("practice.html", questions=[], bank=None)
    questions = get_questions(bank, num)
    return render_template("practice.html", questions=questions, bank=bank)


@app.route("/htmlDelivery/index.html")
def html_delivery():
    """Alias path used by the launch page for the practice interface."""
    return render_template("index.html", banks=sorted(BANKS))


@app.route("/question")
def question():
    bank = request.args.get("bank")
    if bank not in BANKS:
        return jsonify({"error": "unknown bank"}), 404
    file = random.choice(BANKS[bank])
    data = _load(file)
    q = random.choice(data)
    return jsonify(q)


@app.route("/bank_questions")
def bank_questions():
    """Return all questions for a given bank."""
    bank = request.args.get("bank")
    if bank not in BANKS:
        return jsonify({"error": "unknown bank"}), 404
    questions = []
    for p in BANKS[bank]:
        questions.extend(_load(p))
    questions.sort(key=lambda q: q.get("id", 0))
    return jsonify(questions)


if __name__ == "__main__":
    app.run(debug=True)

