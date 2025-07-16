module.exports = {
  testEnvironment: 'node',
  preset: null,
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  transform: {
    '^.+\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: false
        }]
      ],
      plugins: [['@babel/plugin-syntax-import-meta', { version: '2023-11' }]]
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(your-es-module-package)/)',
  ],
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