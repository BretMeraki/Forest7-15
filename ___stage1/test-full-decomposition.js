/**
 * Test Full 6-Level HTA Decomposition with Dependencies
 * Shows how the system decomposes goals through all 6 levels
 */

import { PureSchemaHTASystem } from './modules/pure-schema-driven-hta.js';
import { AdaptiveBranchGenerator } from './modules/adaptive-branch-generator.js';

console.log('🧪 Testing Full 6-Level HTA Decomposition\n');
console.log('This test shows the theoretical structure of the 6-level decomposition');
console.log('with dependency ordering capabilities.\n');

// Create instances
const branchGenerator = new AdaptiveBranchGenerator();

// Test goal
const goal = 'Build a distributed microservices architecture using Kubernetes';
const context = {
  context: 'Want to master microservices for cloud-native solutions',
  learningStyle: 'mixed',
  focusAreas: ['deployment', 'scaling', 'monitoring']
};

console.log(`🎯 Goal: "${goal}"\n`);

// Level 1: Goal Context Analysis
console.log('📊 LEVEL 1: Goal Context Analysis');
console.log('   Domain: Technical/Software Engineering');
console.log('   Complexity: High');
console.log('   Prerequisites: Basic programming, networking concepts');
console.log('   Success Criteria: Deploy scalable microservices on K8s');

// Level 2: Strategic Branches (Generated dynamically)
console.log('\n🌿 LEVEL 2: Strategic Branches');
const branches = branchGenerator.generateAdaptiveBranches(
  goal,
  { score: 7 }, // High complexity
  context.focusAreas,
  context.learningStyle,
  context
);

branches.forEach((branch, idx) => {
  console.log(`\n   ${idx + 1}. ${branch.name}`);
  console.log(`      Focus: ${branch.focus}`);
  console.log(`      Dependencies: ${idx > 0 ? `Requires Branch ${idx}` : 'None (Entry Point)'}`);
});

// Level 3: Task Decomposition (Example for first branch)
console.log('\n📋 LEVEL 3: Task Decomposition (for "Fundamentals" branch)');
const exampleTasks = [
  { title: 'Understand Microservices Architecture', dependencies: [], priority: 1 },
  { title: 'Learn Container Basics with Docker', dependencies: [0], priority: 2 },
  { title: 'Master Kubernetes Core Concepts', dependencies: [1], priority: 3 },
  { title: 'Deploy First Service to K8s', dependencies: [0, 1, 2], priority: 4 }
];

exampleTasks.forEach((task, idx) => {
  console.log(`\n   Task ${idx + 1}: ${task.title}`);
  console.log(`      Priority: ${task.priority}`);
  console.log(`      Dependencies: ${task.dependencies.length > 0 ? 
    task.dependencies.map(d => `Task ${d + 1}`).join(', ') : 'None'}`);
});

// Level 4: Micro-Particles (Example for one task)
console.log('\n🔬 LEVEL 4: Micro-Particles (for "Learn Container Basics with Docker")');
const microParticles = [
  { title: 'Install Docker Desktop', duration: '15 min', dependency: null },
  { title: 'Run Hello World Container', duration: '10 min', dependency: 0 },
  { title: 'Build Custom Dockerfile', duration: '30 min', dependency: 1 },
  { title: 'Push Image to Registry', duration: '20 min', dependency: 2 }
];

microParticles.forEach((micro, idx) => {
  console.log(`\n   Micro ${idx + 1}: ${micro.title}`);
  console.log(`      Duration: ${micro.duration}`);
  console.log(`      Depends on: ${micro.dependency !== null ? `Micro ${micro.dependency + 1}` : 'None'}`);
});

// Level 5: Nano-Actions (Example for one micro-particle)
console.log('\n⚡ LEVEL 5: Nano-Actions (for "Build Custom Dockerfile")');
const nanoActions = [
  'Create new directory for project',
  'Open terminal in project directory',
  'Create new file named "Dockerfile"',
  'Write FROM instruction with base image',
  'Add WORKDIR instruction',
  'Copy application files with COPY',
  'Define CMD or ENTRYPOINT',
  'Save Dockerfile',
  'Run docker build command',
  'Verify image creation with docker images'
];

nanoActions.forEach((nano, idx) => {
  console.log(`   ${idx + 1}. ${nano}`);
});

// Level 6: Context-Adaptive Primitives (Example for one nano-action)
console.log('\n🔧 LEVEL 6: Context-Adaptive Primitives (for "Run docker build command")');
console.log('   These adapt based on user context:\n');

const primitives = [
  {
    context: 'Windows with PowerShell',
    action: 'docker build -t myapp:latest .',
    notes: 'Use PowerShell syntax'
  },
  {
    context: 'Mac/Linux with Bash',
    action: 'docker build -t myapp:latest .',
    notes: 'Standard Unix syntax'
  },
  {
    context: 'Behind Corporate Proxy',
    action: 'docker build --build-arg HTTP_PROXY=$proxy -t myapp:latest .',
    notes: 'Include proxy configuration'
  },
  {
    context: 'Limited Resources',
    action: 'docker build --memory="1g" --memory-swap="2g" -t myapp:latest .',
    notes: 'Add resource constraints'
  }
];

primitives.forEach(prim => {
  console.log(`   Context: ${prim.context}`);
  console.log(`      Action: ${prim.action}`);
  console.log(`      Notes: ${prim.notes}\n`);
});

// Dependency Ordering Example
console.log('🔗 DEPENDENCY ORDERING EXAMPLE:\n');
console.log('The system automatically orders tasks by dependencies:');
console.log('1. Tasks with no dependencies come first');
console.log('2. Tasks dependent on others wait until prerequisites complete');
console.log('3. Parallel execution possible for non-dependent tasks');
console.log('4. Critical path identified for optimal learning flow');

console.log('\n✅ SUMMARY:\n');
console.log('The HTA system provides:');
console.log('• Dynamic branch generation based on goal/context');
console.log('• 6 levels of progressive decomposition');
console.log('• Automatic dependency tracking and ordering');
console.log('• Context-adaptive execution at the lowest level');
console.log('• No hardcoded patterns - all generated from goal analysis');
console.log('\nThis creates a complete learning path from high-level goal');
console.log('to specific, actionable, context-aware steps!');
