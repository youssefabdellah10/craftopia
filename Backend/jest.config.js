module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/Test/setup.js'],
  testMatch: [
    '**/Test/**/*.test.js',
    '**/Test/**/*.spec.js'
  ],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
