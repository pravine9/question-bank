// Test script to add sample practice history data
console.log('🧪 Adding sample practice history data...');

// Sample practice results
const sampleResults = [
  {
    id: 'test_1',
    bank: 'calculations',
    totalQuestions: 10,
    correctAnswers: 8,
    score: 80,
    startTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    endTime: Date.now() - (7 * 24 * 60 * 60 * 1000) + (45 * 60 * 1000), // 45 minutes later
    duration: 45,
    date: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
    flaggedQuestions: 2,
    questions: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      userAnswer: `Answer ${i + 1}`,
      correctAnswer: `Correct ${i + 1}`,
      isCorrect: i < 8,
      flagged: i === 2 || i === 7
    }))
  },
  {
    id: 'test_2',
    bank: 'clinical_therapeutics',
    totalQuestions: 15,
    correctAnswers: 12,
    score: 80,
    startTime: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
    endTime: Date.now() - (3 * 24 * 60 * 60 * 1000) + (60 * 60 * 1000), // 60 minutes later
    duration: 60,
    date: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(),
    flaggedQuestions: 1,
    questions: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      userAnswer: `Answer ${i + 1}`,
      correctAnswer: `Correct ${i + 1}`,
      isCorrect: i < 12,
      flagged: i === 5
    }))
  },
  {
    id: 'test_3',
    bank: 'clinical_mixed',
    totalQuestions: 20,
    correctAnswers: 16,
    score: 80,
    startTime: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
    endTime: Date.now() - (1 * 24 * 60 * 60 * 1000) + (75 * 60 * 1000), // 75 minutes later
    duration: 75,
    date: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
    flaggedQuestions: 3,
    questions: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      userAnswer: `Answer ${i + 1}`,
      correctAnswer: `Correct ${i + 1}`,
      isCorrect: i < 16,
      flagged: i === 3 || i === 8 || i === 15
    }))
  },
  {
    id: 'test_4',
    bank: 'clinical_otc',
    totalQuestions: 8,
    correctAnswers: 6,
    score: 75,
    startTime: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
    endTime: Date.now() - (12 * 60 * 60 * 1000) + (30 * 60 * 1000), // 30 minutes later
    duration: 30,
    date: new Date(Date.now() - (12 * 60 * 60 * 1000)).toISOString(),
    flaggedQuestions: 0,
    questions: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      userAnswer: `Answer ${i + 1}`,
      correctAnswer: `Correct ${i + 1}`,
      isCorrect: i < 6,
      flagged: false
    }))
  },
  {
    id: 'test_5',
    bank: 'clinical_mep',
    totalQuestions: 12,
    correctAnswers: 10,
    score: 83,
    startTime: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
    endTime: Date.now() - (2 * 60 * 60 * 1000) + (40 * 60 * 1000), // 40 minutes later
    duration: 40,
    date: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
    flaggedQuestions: 1,
    questions: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      userAnswer: `Answer ${i + 1}`,
      correctAnswer: `Correct ${i + 1}`,
      isCorrect: i < 10,
      flagged: i === 6
    }))
  }
];

// Calculate stats
const totalTests = sampleResults.length;
const totalScore = sampleResults.reduce((sum, result) => sum + result.score, 0);
const averageScore = Math.round((totalScore / totalTests) * 100) / 100;
const bestScore = Math.max(...sampleResults.map(r => r.score));
const totalTime = sampleResults.reduce((sum, result) => sum + result.duration, 0);

const sampleHistory = {
  results: sampleResults,
  totalTests,
  averageScore,
  bestScore,
  totalTime
};

// Save to localStorage
try {
  localStorage.setItem('practice_history', JSON.stringify(sampleHistory));
  console.log('✅ Sample practice history data added successfully!');
  console.log('📊 Sample data includes:');
  console.log(`   • ${totalTests} practice tests`);
  console.log(`   • Average score: ${averageScore}%`);
  console.log(`   • Best score: ${bestScore}%`);
  console.log(`   • Total time: ${totalTime} minutes`);
  console.log('🔄 Refresh the page to see the practice history!');
} catch (error) {
  console.error('❌ Failed to add sample data:', error);
}

// Function to clear sample data (for testing)
window.clearSampleData = function() {
  try {
    localStorage.removeItem('practice_history');
    console.log('🗑️ Sample practice history data cleared!');
    location.reload();
  } catch (error) {
    console.error('❌ Failed to clear sample data:', error);
  }
};

console.log('💡 To clear sample data, run: clearSampleData()');
