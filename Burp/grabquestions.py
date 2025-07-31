import subprocess
import json
import time
import hashlib
from pathlib import Path

BANK_CHOICES = [
    "Calculations",
    "Clinical Therapeutics",
    "Clinical MEP",
    "Clinical OTC",
    "Clinical Mixed"
]

WEIGHTING_CHOICES = ["Low", "Medium", "High"]

def prompt_for_bank():
    print("Select a question bank:")
    for i, name in enumerate(BANK_CHOICES, 1):
        print(f"{i}. {name}")
    while True:
        try:
            choice = int(input("Enter number: "))
            if 1 <= choice <= len(BANK_CHOICES):
                return BANK_CHOICES[choice - 1]
        except ValueError:
            pass
        print("Invalid input. Try again.")

def prompt_for_weighting():
    print("Select a weighting:")
    for i, name in enumerate(WEIGHTING_CHOICES, 1):
        print(f"{i}. {name}")
    while True:
        try:
            choice = int(input("Enter number: "))
            if 1 <= choice <= len(WEIGHTING_CHOICES):
                return WEIGHTING_CHOICES[choice - 1]
        except ValueError:
            pass
        print("Invalid input. Try again.")

# Define hash function early
def hash_question(q):
    return hashlib.sha256((q.get("title", "") + q.get("text", "")).encode()).hexdigest()

# Constants
BATCH_LIMIT = 20
SLEEP_SECONDS = 2
THRESHOLD_NEW_UNIQUES = 0.9  # If fewer than 90% of a batch are new, stop
OUTPUT_DIR = "output"

def fetch_batch(curl_command):
    result = subprocess.run(curl_command, capture_output=True, text=True)
    try:
        json_data = json.loads(result.stdout)
        return json_data
    except json.JSONDecodeError:
        print("❌ Failed to decode JSON")
        return []

def main():
    bank_name = prompt_for_bank()
    if bank_name == "Calculations":
        weighting = None
        print(f"\n📥 Scraping '{bank_name}' questions (no weighting)...\n")
        output_file = Path(OUTPUT_DIR) / f"{bank_name.lower().replace(' ', '_')}_questions.json"
        url = f"https://www.preregshortcuts.com/api/questions/get/?bank={bank_name.replace(' ', '+')}&num_questions=40"
    else:
        weighting = prompt_for_weighting()
        print(f"\n📥 Scraping '{bank_name}' questions with '{weighting}' weighting...\n")
        output_file = Path(OUTPUT_DIR) / f"{bank_name.lower().replace(' ', '_')}_{weighting.lower()}_questions.json"
        url = f"https://www.preregshortcuts.com/api/questions/get/?bank={bank_name.replace(' ', '+')}&num_questions=40&weighting={weighting}"

    Path(OUTPUT_DIR).mkdir(exist_ok=True)

    curl_command = [
        "curl", "--path-as-is", "-s", "-k", "-X", "GET",
        "-H", "Host: www.preregshortcuts.com",
        "-H", "Sec-Ch-Ua-Platform: \"macOS\"",
        "-H", "X-Csrftoken: fdwcLsSXop1Bpzupit3KItF6cDNVSJ7S",
        "-H", "Accept-Language: en-GB,en;q=0.9",
        "-H", "Accept: application/json, text/plain, */*",
        "-H", "Sec-Ch-Ua: \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\"",
        "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "-H", "Sec-Ch-Ua-Mobile: ?0",
        "-H", "Sec-Fetch-Site: same-origin",
        "-H", "Sec-Fetch-Mode: cors",
        "-H", "Sec-Fetch-Dest: empty",
        "-H", f"Referer: https://www.preregshortcuts.com/question-bank/quiz/{bank_name.lower().replace(' ', '-')}/",
        "-H", "Accept-Encoding: gzip, deflate, br",
        "-H", "Priority: u=1, i",
        "-H", "Connection: keep-alive",
        "-b", "cookies_accepted_categories=technically_required,analytics; _ga=GA1.1.1762998342.1753816009; csrftoken=fdwcLsSXop1Bpzupit3KItF6cDNVSJ7S; sessionid=mqloafb1vcqt00hspwv4eg681kl87t4m; __stripe_mid=d458e04e-aee5-4ea2-a54e-137944451c30d2a9de; __stripe_sid=04313b41-ba0c-4c48-b748-baaf406d6083d6e8b9",
        url
    ]

    seen_hashes = set()
    unique_questions = []

    weighting_text = f" with weighting '{weighting}'" if weighting else ""

    # Load existing data if available
    if output_file.exists():
        with open(output_file, "r") as f:
            try:
                unique_questions = json.load(f)
                seen_hashes = {hash_question(q) for q in unique_questions}
                print(f"🔁 Loaded {len(unique_questions)} existing unique questions for bank '{bank_name}'{weighting_text}.")
            except json.JSONDecodeError:
                print("⚠️ Failed to load existing data — starting fresh.")

    no_new_count = 0
    batch_num = 0

    while True:
        batch_num += 1
        print(f"\n🔄 Batch {batch_num} for bank '{bank_name}'{weighting_text}...")
        batch = fetch_batch(curl_command)
        if not batch:
            break

        added = 0
        for q in batch:
            h = hash_question(q)
            if h not in seen_hashes:
                seen_hashes.add(h)
                unique_questions.append(q)
                added += 1

        print(f"✅ Added {added} unique of {len(batch)}")
        print(f"📊 Total unique questions so far for bank '{bank_name}'{weighting_text}: {len(unique_questions)}")

        if added == 0:
            no_new_count += 1
            print(f"⚠️ No new questions found. ({no_new_count}/10)")
        else:
            no_new_count = 0

        if no_new_count >= 10:
            print(f"🛑 No new questions for 10 batches for bank '{bank_name}'{weighting_text} — stopping.")
            break

        time.sleep(SLEEP_SECONDS)

    output_file.write_text(json.dumps(unique_questions, indent=2))
    print(f"\n💾 Saved {len(unique_questions)} unique questions to {output_file}")

if __name__ == "__main__":
    main()
