# GPhC Question Bank

A question bank application for GPhC exam preparation. Built with TypeScript and Vite.

All changes/improvements should be aim to keep code base lean and code lines minimal and avoid overcomplicating/overengineering things or removing large features/functionality unless clear functional and fundamental errors or improvments are identified.

## Features

- Multiple question categories (calculations, clinical therapeutics, etc.)
- Practice mode with timed sessions
- Performance tracking
- Offline capable
- Clean, modern test summary with focus on user experience

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Question Banks

- **Calculations** - Mathematical and dosage calculations
- **Clinical MEP** - Clinical mixed exam preparation
- **Clinical Mixed** - Mixed difficulty clinical questions
- **Clinical OTC** - Over-the-counter medication questions
- **Clinical Therapeutics** - Therapeutic drug questions

Front End:
- `index.html`: Main page for viewing single questions, reviewing stats on previously attempted questions and tests, starting new practice sessions.
- `practice.html`: Dedicated page for timed practice sessions replicating the real GPhC exam format. 
## Usage

### Single Question Mode
1. Select a question bank
2. Click "Load Random Question"
3. Answer and click "Check"
4. Click "Reveal" for explanation

### Practice Mode
1. Select bank and question count
2. Click "Start Practice"
3. Navigate through questions
4. Flag questions for review
5. Click "Finish Test" for results

### Test Summary
After completing a practice test, users see a clean, focused summary:
- **Immediate score feedback** with pass/fail indicator (70% threshold)
- **Visual score circle** with percentage and fraction display
- **Quick stats** showing correct, incorrect, and unanswered counts
- **Detailed table** with question number, your answer, correct answer, result, and review button
- **Simple actions** to review wrong answers or go home

## Adding Questions

All questions based on topic are loaded in `question_banks/` with this format:

```javascript
window.newBank = [
  {
    id: 1,
    bank: "new_bank",
    title: "Question title",
    text: "Question text",
    why: "Explanation",
    correct_answer: "Answer",
    answers: [
      { text: "Option A", answer_number: 1 },
      { text: "Option B", answer_number: 2 }
    ]
  }
];
```
Calculation questions are in different format supporting answer entries, all other questions are multiple choice questions.