import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-characters';
process.env.BCRYPT_ROUNDS = '4'; // Faster for tests

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set longer timeout for integration tests
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Add cleanup logic here if needed
  await new Promise((resolve) => setTimeout(resolve, 500));
});