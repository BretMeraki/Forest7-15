module.exports = {
  testEnvironment: 'node',
  preset: null,
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  transform: {
    '^.+\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '___stage1/**/*.js',
    'modules/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/__tests__/**',
    '!**/*.test.js',
    '!**/coverage/**',
    '!**/scripts/**',
    '!**/*.config.js',
    '!**/forest-mcp-stderr.log',
    '!**/server_output.log',
    '!**/*.md'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
