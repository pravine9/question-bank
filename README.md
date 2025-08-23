Note: After several changes and "enhancements" to the code base a lot of functionality has been broken and lots of new bugs introduced. The aim is to revert back to a simple working functional version with only the desired featured.



# GPhC Question Bank

A modern, offline-capable question bank application for GPhC (General Pharmaceutical Council) exam preparation. Built with TypeScript, Vite, and modern web technologies for optimal performance and developer experience.

## ✨ Features

- **📚 Comprehensive Question Banks** - Multiple question categories including calculations, clinical therapeutics, and more
- **🎯 Practice Mode** - Timed practice sessions with progress tracking
- **📊 Statistics & Analytics** - Track your performance across all questions
- **📚 Offline Capable** - Works without internet connection
- **🎨 UI** - Design of practice page replicating the real GPhC exam format.



## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gphc-scraper.git
cd gphc-scraper

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview

# Serve the production build
npm run serve
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking

# Analysis
npm run analyze      # Analyze bundle size
```

### Project Structure

```
gphc-scraper/
├── src/                    # Source code
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── styles/            # CSS and design system
│   └── tests/             # Unit tests
├── static/                # Static assets
│   ├── main.js           # Main application logic
│   ├── practice.js       # Practice mode logic
│   ├── question_renderer.js # Question rendering
│   └── banks.js          # Question bank registry
├── templates/             # HTML templates
│   ├── index.html        # Main page
│   └── practice.html     # Practice mode page
├── question_banks/        # Question data
├── public/               # Public assets
│   ├── sw.js            # Service worker
│   └── icons/           # Application icons
├── dist/                 # Build output
└── Burp/                 # Scraping scripts (legacy)
```

### Technology Stack

- **Frontend**: TypeScript, Vite, Modern CSS
- **Build Tool**: Vite
- **Testing**: Vitest with jsdom
- **Code Quality**: ESLint, Prettier, TypeScript
- **Offline**: Service Worker for offline functionality
- **Styling**: CSS Custom Properties, Utility Classes

## 📚 Question Banks

The application includes the following question categories:

- **Calculations** - Mathematical and dosage calculations
- **Clinical MEP** - Clinical mixed exam preparation
- **Clinical Mixed** - Mixed difficulty clinical questions
- **Clinical OTC** - Over-the-counter medication questions
- **Clinical Therapeutics** - Therapeutic drug questions

Each bank contains questions with:
- Multiple choice or calculation formats
- Detailed explanations
- Resource images when applicable
- Difficulty weighting

## 🎯 Usage

### Single Question Mode

1. Select a question bank from the dropdown
2. Click "Load Random Question" to get a practice question
3. Answer the question and click "Check" to verify
4. Click "Reveal" to see the explanation

### Practice Mode

1. Select a question bank and number of questions
2. Click "Start Practice" to begin a timed session
3. Navigate through questions using the controls
4. Flag questions for review during the session
5. Click "Finish Test" to see your results and review

### Statistics

- View your performance statistics for each question
- Track attempts, correct/incorrect answers
- Use the "Check Question Stats" feature to look up specific questions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development
VITE_APP_TITLE=GPhC Question Bank
VITE_APP_VERSION=2.0.0

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
```

### Customization

#### Adding New Question Banks

1. Create a new JavaScript file in `question_banks/`
2. Export an array of question objects
3. Add the bank to `static/banks.js`

Example question format:

```javascript
window.newBank = [
  {
    id: 1,
    bank: "new_bank",
    title: "Question title",
    text: "Question text with markdown support",
    why: "Detailed explanation",
    resource_image: "https://example.com/image.jpg",
    visible: true,
    is_calculation: false,
    correct_answer: "Correct answer",
    answer_unit: "mg",
    correct_answer_number: 1,
    weighting: 1,
    answers: [
      { text: "Option A", answer_number: 1 },
      { text: "Option B", answer_number: 2 }
    ],
    is_free: false
  }
];
```

#### Styling Customization

The application uses CSS Custom Properties for easy theming:

```css
:root {
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-error: #ef4444;
  /* ... more variables */
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 🔌 Offline Functionality

The application provides offline capabilities through:

- **Offline Support**: Works without internet connection
- **Local Storage**: All data stored locally in the browser
- **Caching**: Intelligent caching strategies for performance
