// Test the depth calculation for the fallback structure
const fallbackTree = {
  goal: 'Master data science and machine learning',
  level: 0,
  branches: [
    {
      id: 'branch_1',
      name: 'Foundation',
      description: 'Build foundational knowledge',
      level: 1,
      children: [
        {
          id: 'sub_branch_1_1',
          name: 'Basic Concepts',
          description: 'Learn fundamental concepts',
          level: 2,
          children: [
            { 
              id: 'task_1_1_1', 
              title: 'Study core principles', 
              level: 3,
              children: [
                { id: 'subtask_1_1_1_1', title: 'Read fundamental materials', level: 4 },
                { id: 'subtask_1_1_1_2', title: 'Take notes', level: 4 }
              ]
            },
            { 
              id: 'task_1_1_2', 
              title: 'Practice basic exercises', 
              level: 3,
              children: [
                { id: 'subtask_1_1_2_1', title: 'Complete exercise 1', level: 4 },
                { id: 'subtask_1_1_2_2', title: 'Complete exercise 2', level: 4 }
              ]
            },
            { 
              id: 'task_1_1_3', 
              title: 'Apply concepts', 
              level: 3,
              children: [
                { id: 'subtask_1_1_3_1', title: 'Mini project', level: 4 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Calculate actual depth using the same logic as the test
const calculateDepth = (node, level = 0) => {
  if (!node) return level;
  const children = node.children || node.branches || node.tasks || [];
  if (!Array.isArray(children) || children.length === 0) return level;
  return Math.max(...children.map(child => calculateDepth(child, level + 1)));
};

const actualDepth = calculateDepth(fallbackTree);
console.log('Calculated depth:', actualDepth);
console.log('Expected depth: 4');
console.log('Test would pass:', actualDepth >= 4);