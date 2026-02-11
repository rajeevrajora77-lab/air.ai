import { db } from '../database/postgres';
import { redis } from '../database/redis';

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  await db.connect();
  await redis.connect();
});

// Cleanup after all tests
afterAll(async () => {
  await db.disconnect();
  await redis.disconnect();
});

// Clear database before each test
beforeEach(async () => {
  // Truncate tables
  await db.query('TRUNCATE users CASCADE');
});