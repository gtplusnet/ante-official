import * as dotenv from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenv.config({ path: join(__dirname, '../../.env.test') });

// Set test timeouts
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('Starting API tests...');
});

// Global test teardown
afterAll(() => {
  console.log('API tests completed.');
});
