import json
import unicodedata
import re
from unidecode import unidecode
from pathlib import Path

INPUT_DIR = Path("output")
OUTPUT_DIR = Path("cleaned")


def clean_text(text: str) -> str:
    """Normalize whitespace and punctuation."""
    if not isinstance(text, str):
        return text
    # Replace newlines encoded in json
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Normalize unicode characters
    text = unicodedata.normalize("NFKC", text)
    text = unidecode(text)
    # Replace non-breaking spaces
    text = text.replace("\u00a0", " ")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def process_file(path: Path) -> list:
    data = json.loads(path.read_text())
    for q in data:
        for key in ("title", "text", "why", "correct_answer"):
            if key in q and q[key]:
                q[key] = clean_text(q[key])
        if "answers" in q:
            for ans in q["answers"]:
                if "text" in ans and ans["text"]:
                    ans["text"] = clean_text(ans["text"])
    return data


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    for file in INPUT_DIR.glob("*.json"):
        cleaned = process_file(file)
        out_path = OUTPUT_DIR / file.name
        out_path.write_text(json.dumps(cleaned, indent=2, ensure_ascii=False))
        print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()

