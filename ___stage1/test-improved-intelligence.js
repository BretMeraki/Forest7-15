/**
 * Test improved intelligence responses
 */

import { RealLLMInterface } from './modules/real-llm-interface.js';

console.log('🧪 Testing Improved Intelligence Responses\n');

const llm = new RealLLMInterface();

// Test 1: Current behavior
console.log('Test 1: Current domain analysis for "Learn machine learning with scikit-learn"');
const currentAnalysis = llm.analyzeDomain('Learn machine learning with scikit-learn');
console.log('Current analysis:', JSON.stringify(currentAnalysis, null, 2));

// Test 2: What better analysis would look like
console.log('\nTest 2: What better domain analysis should produce:');
const betterAnalysis = {
  domain: 'machine_learning',
  complexity: 'medium',
  specificity: 'technical',
  terminology: ['machine learning', 'scikit-learn', 'algorithms', 'models', 'data analysis', 'Python'],
  learningStyle: 'hands-on',
  progressionType: 'learn-apply-refine',
  keywords: ['machine', 'learning', 'scikit-learn'],
  complexityScore: 1
};
console.log('Better analysis:', JSON.stringify(betterAnalysis, null, 2));

// Test 3: Generate branches with better analysis
console.log('\nTest 3: Branches with better domain analysis:');
const betterBranches = llm.createDomainSpecificBranches('Learn machine learning with scikit-learn', betterAnalysis);
console.log('Better branches:', JSON.stringify(betterBranches, null, 2));

// Test 4: Show what good ML-specific branches should look like
console.log('\nTest 4: What ML-specific branches should really look like:');
const idealBranches = [
  {
    name: "Python Data Analysis with NumPy & Pandas",
    description: "Master data manipulation, cleaning, and exploratory analysis using Python's core data science libraries",
    priority: 1,
    rationale: "Essential data handling skills form the foundation for all ML work",
    duration: "2-3 weeks"
  },
  {
    name: "Supervised Learning with Scikit-Learn",
    description: "Build classification and regression models using scikit-learn's algorithms and evaluation tools",
    priority: 2,
    rationale: "Core ML algorithms provide practical predictive modeling skills",
    duration: "4-6 weeks"
  },
  {
    name: "Model Validation & Feature Engineering",
    description: "Implement cross-validation, hyperparameter tuning, and feature selection techniques",
    priority: 3,
    rationale: "Professional ML requires robust validation and optimization practices",
    duration: "3-4 weeks"
  }
];
console.log('Ideal ML branches:', JSON.stringify(idealBranches, null, 2));

// Test 5: Compare task generation
console.log('\nTest 5: Task generation comparison');
const currentTasks = llm.createDomainSpecificTasks('Learn machine learning with scikit-learn', currentAnalysis);
console.log('Current tasks (first 2):', JSON.stringify(currentTasks.slice(0, 2), null, 2));

const betterTasks = llm.createDomainSpecificTasks('Learn machine learning with scikit-learn', betterAnalysis);
console.log('\nBetter tasks (first 2):', JSON.stringify(betterTasks.slice(0, 2), null, 2));

console.log('\n=== Analysis Summary ===');
console.log('Current system issues:');
console.log('1. Domain detected as:', currentAnalysis.domain, '(should be "machine_learning")');
console.log('2. Terminology:', currentAnalysis.terminology.join(', '), '(too generic)');
console.log('3. Branch names use single words instead of meaningful phrases');
console.log('\nRecommendations:');
console.log('1. Improve domain detection to recognize compound terms like "machine learning"');
console.log('2. Use domain-specific terminology databases');
console.log('3. Generate meaningful, actionable branch names');
console.log('4. Include specific tools, libraries, and techniques in descriptions');
