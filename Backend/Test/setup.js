// Global test setup
process.env.NODE_ENV = 'test';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Increase timeout for async operations
jest.setTimeout(10000);
