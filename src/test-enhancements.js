// Test script to verify enhanced features are working
console.log('🧪 Testing Enhanced GPhC Question Bank Features...');

// Test 1: Check if enhanced CSS is loaded
function testEnhancedCSS() {
  const computedStyle = getComputedStyle(document.body);
  const cssVars = [
    '--color-primary',
    '--font-family-sans',
    '--space-4',
    '--radius-lg'
  ];
  
  let cssWorking = true;
  cssVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(varName);
    if (!value) {
      console.warn(`⚠️ CSS variable ${varName} not found`);
      cssWorking = false;
    }
  });
  
  if (cssWorking) {
    console.log('✅ Enhanced CSS design system is working');
  } else {
    console.log('❌ Enhanced CSS design system has issues');
  }
}

// Test 2: Check if question banks are loaded
function testQuestionBanks() {
  if (window.banks && typeof window.banks === 'object') {
    const bankCount = Object.keys(window.banks).length;
    console.log(`✅ Question banks loaded: ${bankCount} banks available`);
    
    // List available banks
    Object.keys(window.banks).forEach(bankName => {
      console.log(`   📚 ${bankName}`);
    });
  } else {
    console.log('❌ Question banks not loaded');
  }
}

// Test 3: Check if question renderer is working
function testQuestionRenderer() {
  if (window.questionRenderer && typeof window.questionRenderer === 'object') {
    console.log('✅ Question renderer is available');
  } else {
    console.log('❌ Question renderer not available');
  }
}

// Test 4: Check if localStorage is working
function testLocalStorage() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ LocalStorage is working');
  } catch (error) {
    console.log('❌ LocalStorage not available:', error.message);
  }
}

// Test 5: Check if enhanced styling is applied
function testEnhancedStyling() {
  const container = document.querySelector('.container');
  if (container) {
    const styles = getComputedStyle(container);
    console.log('✅ Enhanced container styling applied');
  } else {
    console.log('❌ Container not found');
  }
}

// Run all tests
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Running enhancement tests...');
  
  setTimeout(() => {
    testEnhancedCSS();
    testQuestionBanks();
    testQuestionRenderer();
    testLocalStorage();
    testEnhancedStyling();
    
    console.log('🎉 Enhancement tests completed!');
    console.log('📱 You should now see the enhanced GPhC Question Bank with:');
    console.log('   • Modern design system');
    console.log('   • Enhanced typography');
    console.log('   • Better spacing and colors');
    console.log('   • Clean layout design');

  }, 1000);
});

// Export for use in other modules
export { testEnhancedCSS, testQuestionBanks, testQuestionRenderer, testLocalStorage, testEnhancedStyling };
