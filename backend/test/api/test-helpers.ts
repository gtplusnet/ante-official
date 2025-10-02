import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Module,
  HttpException,
} from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Create a minimal test module to avoid complex dependencies
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [],
})
class TestModule {}

export class ApiTestHelper {
  private app: INestApplication;
  private moduleRef: TestingModule;
  private authToken: string;

  async initialize(imports: any[] = []) {
    // For now, use the test module. In a real implementation,
    // you would import specific modules for the tests
    this.moduleRef = await Test.createTestingModule({
      imports: [TestModule, ...imports],
    }).compile();

    this.app = this.moduleRef.createNestApplication();

    // Apply the same global pipes as in main.ts
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          // Return validation errors in the expected format
          const messages = errors
            .map((error) => Object.values(error.constraints || {}).join(', '))
            .filter((msg) => msg);
          return new HttpException(
            {
              success: false,
              message: messages.join('; '),
              statusCode: 400,
            },
            400,
          );
        },
      }),
    );

    await this.app.init();
  }

  async close() {
    await this.app.close();
  }

  getApp(): INestApplication {
    return this.app;
  }

  getRequest() {
    return request(this.app.getHttpServer());
  }

  // Generate a test JWT token for authenticated requests
  async generateAuthToken(userId: string, email: string) {
    const jwtService = this.moduleRef.get(JwtService);
    this.authToken = await jwtService.signAsync({
      sub: userId,
      email: email,
    });
    return this.authToken;
  }

  // Get authenticated request helper
  getAuthenticatedRequest() {
    if (!this.authToken) {
      throw new Error('No auth token available. Call generateAuthToken first.');
    }
    return request(this.app.getHttpServer()).set(
      'Authorization',
      `Bearer ${this.authToken}`,
    );
  }

  // Helper for POST requests
  async post(endpoint: string, data: any, authenticated = false) {
    const req = authenticated
      ? this.getAuthenticatedRequest()
      : this.getRequest();
    return req.post(endpoint).send(data);
  }

  // Helper for GET requests
  async get(endpoint: string, authenticated = false) {
    const req = authenticated
      ? this.getAuthenticatedRequest()
      : this.getRequest();
    return req.get(endpoint);
  }

  // Helper for PUT requests
  async put(endpoint: string, data: any, authenticated = false) {
    const req = authenticated
      ? this.getAuthenticatedRequest()
      : this.getRequest();
    return req.put(endpoint).send(data);
  }

  // Helper for PATCH requests
  async patch(endpoint: string, data: any, authenticated = false) {
    const req = authenticated
      ? this.getAuthenticatedRequest()
      : this.getRequest();
    return req.patch(endpoint).send(data);
  }

  // Helper for DELETE requests
  async delete(endpoint: string, authenticated = false) {
    const req = authenticated
      ? this.getAuthenticatedRequest()
      : this.getRequest();
    return req.delete(endpoint);
  }
}

// Test data factories
export const testDataFactory = {
  createUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'Test@123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  }),

  createDiscussion: (overrides = {}) => ({
    title: 'Test Discussion',
    content: 'This is a test discussion content',
    ...overrides,
  }),

  createComment: (overrides = {}) => ({
    content: 'This is a test comment',
    ...overrides,
  }),
};

// Common test assertions
export const assertSuccessResponse = (response: request.Response) => {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  expect(response.body).toHaveProperty('success', true);
};

export const assertErrorResponse = (
  response: request.Response,
  expectedStatus: number,
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
};

export const assertPaginatedResponse = (response: request.Response) => {
  assertSuccessResponse(response);
  expect(response.body.data).toHaveProperty('items');
  expect(response.body.data).toHaveProperty('total');
  expect(response.body.data).toHaveProperty('page');
  expect(response.body.data).toHaveProperty('pageSize');
};
