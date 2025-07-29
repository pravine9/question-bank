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


@app.route("/question")
def question():
    bank = request.args.get("bank")
    if bank not in BANKS:
        return jsonify({"error": "unknown bank"}), 404
    file = random.choice(BANKS[bank])
    data = _load(file)
    q = random.choice(data)
    return jsonify(q)


if __name__ == "__main__":
    app.run(debug=True)
