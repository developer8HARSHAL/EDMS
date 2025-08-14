process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/dms_test';

// Increase timeout for database operations
jest.setTimeout(30000);