import os
import json
from collections import defaultdict

OUTPUT_DIR = "output"

def count_questions_in_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return len(data)
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return None

def main():
    question_bank_totals = defaultdict(int)
    file_counts = []

    for filename in sorted(os.listdir(OUTPUT_DIR)):
        if filename.endswith(".json"):
            filepath = os.path.join(OUTPUT_DIR, filename)
            count = count_questions_in_file(filepath)
            if count is not None:
                file_counts.append((filename, count))
                bank_name = filename.split("_questions")[0]
                question_bank_totals[bank_name] += count

    print("\n🧮 Total questions by bank (by file):\n")
    for bank_name in sorted(question_bank_totals):
        print(f"{bank_name}: {question_bank_totals[bank_name]} questions")

    # Combine weightings into base bank categories
    combined_totals = defaultdict(int)
    for bank_name, count in question_bank_totals.items():
        base_bank = (
            bank_name.replace("_low", "")
                     .replace("_medium", "")
                     .replace("_high", "")
                     .replace("_questions", "")
        )
        combined_totals[base_bank] += count

    print("\n📦 Combined total questions per bank:\n")
    for base_bank in sorted(combined_totals):
        print(f"{base_bank}: {combined_totals[base_bank]} questions")

if __name__ == "__main__":
    main()
