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
- `summary.html`: Dedicated page for displaying test results with detailed review functionality. 
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
After completing a practice test, users are redirected to a dedicated summary page (`summary.html`) that provides:
- **Immediate score feedback** with pass/fail indicator (70% threshold)
- **Visual score circle** with percentage and fraction display
- **Quick stats** showing correct, incorrect, and unanswered counts
- **Detailed table** with question number, your answer, correct answer, result, and review button
- **Review modal** that shows the original question with your answer, correct answer, and explanation
- **Navigation controls** to move between questions during review
- **Simple actions** to review wrong answers or go home

The summary page loads test results from localStorage and provides a read-only review experience without the ability to change answers.

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

## GitHub Pages Deployment

This project is configured to work with GitHub Pages. To deploy:

### Option 1: Using the deployment script
```bash
./deploy.sh
```

### Option 2: Manual deployment
1. Build the project:
   ```bash
   npm run build
   ```

2. Configure GitHub Pages:
   - Go to your repository settings on GitHub
   - Navigate to 'Pages' in the left sidebar
   - Set source to 'Deploy from a branch'
   - Select 'main' branch and '/docs' folder
   - Click 'Save'

3. Copy build files to docs folder:
   ```bash
   cp -r dist/* docs/
   ```

4. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

Your site will be available at: `https://[username].github.io/question-bank/`

### Important Notes
- The base path is configured as `/question-bank/` in `vite.config.ts`
- All assets are properly configured for GitHub Pages deployment
- Question bank files are excluded from bundling and served as static files
- The application works offline and stores data in localStorage

### Automatic Deployment with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the site to GitHub Pages when you push to the main branch.

To enable automatic deployment:
1. Go to your repository settings on GitHub
2. Navigate to 'Pages' in the left sidebar
3. Set source to 'GitHub Actions'
4. The workflow will automatically deploy when you push to main

This eliminates the need to manually copy files to the docs folder.