import {
  Controller,
  Post,
  Body,
  Module,
  Injectable,
  HttpException,
  HttpStatus,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  ValidateNested,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiTestHelper,
  assertSuccessResponse,
  assertErrorResponse,
} from './test-helpers';

// Enums
enum BusinessType {
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  PARTNERSHIP = 'PARTNERSHIP',
  CORPORATION = 'CORPORATION',
  OTHERS = 'OTHERS',
}

enum Industry {
  CONSTRUCTION = 'CONSTRUCTION',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  SERVICES = 'SERVICES',
  OTHERS = 'OTHERS',
}

// DTOs
class AccountLoginDTO {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

class CompanyInformationDTO {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  domainPrefix: string;

  @IsNotEmpty()
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsNotEmpty()
  @IsEnum(Industry)
  industry: Industry;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tinNo?: string;
}

class AccountInformationDTO {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase, lowercase, number and special character',
  })
  password: string;
}

class SignUpDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompanyInformationDTO)
  companyInformation: CompanyInformationDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AccountInformationDTO)
  accountInformation: AccountInformationDTO;

  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

// Mock Service
@Injectable()
class MockAuthService {
  private accounts = new Map<string, any>();
  private tokens = new Map<string, any>();

  async login(loginDto: AccountLoginDTO, headers: any, ip: string) {
    // Find account by username or email
    const account = Array.from(this.accounts.values()).find(
      (acc) =>
        acc.username === loginDto.username || acc.email === loginDto.username,
    );

    if (!account) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (account.password !== loginDto.password) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate token
    const token = `test-token-${Date.now()}-${Math.random()}`;
    this.tokens.set(token, {
      accountId: account.id,
      userAgent: headers['user-agent'],
      ip: ip,
      createdAt: new Date(),
    });

    return {
      token,
      accountInformation: this.formatAccountResponse(account),
    };
  }

  async signup(signupDto: SignUpDTO, headers: any, ip: string) {
    const { companyInformation, accountInformation, sourceUrl } = signupDto;

    // Check if email or username already exists
    const existingAccount = Array.from(this.accounts.values()).find(
      (acc) =>
        acc.email === accountInformation.email ||
        acc.username === accountInformation.username,
    );

    if (existingAccount) {
      if (existingAccount.email === accountInformation.email) {
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create account
    const accountId = `account-${Date.now()}`;
    const account = {
      id: accountId,
      ...accountInformation,
      company: companyInformation,
      role: { name: 'Developer', level: 1 },
      status: 'ACTIVE',
      sourceUrl: sourceUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(accountId, account);

    // Generate token
    const token = `test-token-${Date.now()}-${Math.random()}`;
    this.tokens.set(token, {
      accountId: account.id,
      userAgent: headers['user-agent'],
      ip: ip,
      createdAt: new Date(),
    });

    return {
      token,
      accountInformation: this.formatAccountResponse(account),
    };
  }

  private formatAccountResponse(account: any) {
    return {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      middleName: account.middleName || null,
      lastName: account.lastName,
      fullName: `${account.firstName} ${account.lastName}`,
      contactNumber: account.contactNumber,
      username: account.username,
      role: account.role,
      company: account.company,
      status: account.status,
      isDeveloper: true,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      profileImageUrl: null,
    };
  }

  // Helper method for tests
  clearData() {
    this.accounts.clear();
    this.tokens.clear();
  }
}

// Mock Controller
@Controller('auth')
class MockAuthController {
  constructor(private readonly authService: MockAuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: AccountLoginDTO,
    @Headers() headers: any,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.authService.login(loginDto, headers, ip);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || 500,
      };
    }
  }

  @Post('signup')
  async signup(
    @Body() signupDto: SignUpDTO,
    @Headers() headers: any,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.authService.signup(signupDto, headers, ip);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        statusCode: error.status || 500,
      };
    }
  }
}

// Mock Module
@Module({
  controllers: [MockAuthController],
  providers: [MockAuthService],
  exports: [MockAuthService],
})
class MockAuthModule {}

// Tests
describe('Auth API - Login & Registration', () => {
  let testHelper: ApiTestHelper;
  let authService: MockAuthService;

  beforeAll(async () => {
    testHelper = new ApiTestHelper();
    await testHelper.initialize([MockAuthModule]);

    // Get service instance for test helpers
    authService = testHelper['moduleRef'].get(MockAuthService);
  });

  afterAll(async () => {
    await testHelper.close();
  });

  beforeEach(() => {
    // Clear data before each test
    authService.clearData();
  });

  describe('POST /auth/signup - Registration', () => {
    const validSignupData = {
      companyInformation: {
        companyName: 'Test Company Inc',
        domainPrefix: 'testcompany',
        businessType: BusinessType.CORPORATION,
        industry: Industry.SERVICES,
        registrationNo: 'REG123456',
        phone: '+1234567890',
        tinNo: 'TIN123456',
      },
      accountInformation: {
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '+1234567890',
        email: 'john.doe@testcompany.com',
        username: 'johndoe',
        password: 'Test@123456',
      },
    };

    it('should successfully register a new user with valid data', async () => {
      const response = await testHelper.post('/auth/signup', validSignupData);

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toMatch(/^test-token-/);

      const { accountInformation } = response.body.data;
      expect(accountInformation).toMatchObject({
        email: validSignupData.accountInformation.email,
        firstName: validSignupData.accountInformation.firstName,
        lastName: validSignupData.accountInformation.lastName,
        username: validSignupData.accountInformation.username,
        fullName: 'John Doe',
        isDeveloper: true,
        status: 'ACTIVE',
      });

      expect(accountInformation.company).toMatchObject({
        companyName: validSignupData.companyInformation.companyName,
        domainPrefix: validSignupData.companyInformation.domainPrefix,
      });

      expect(accountInformation.role).toMatchObject({
        name: 'Developer',
        level: 1,
      });
    });

    it('should fail with missing company information', async () => {
      const invalidData = {
        accountInformation: validSignupData.accountInformation,
      };

      const response = await testHelper.post('/auth/signup', invalidData);

      assertErrorResponse(response, 400);
    });

    it('should fail with missing account information', async () => {
      const invalidData = {
        companyInformation: validSignupData.companyInformation,
      };

      const response = await testHelper.post('/auth/signup', invalidData);

      assertErrorResponse(response, 400);
    });

    it('should fail with invalid email format', async () => {
      const invalidData = {
        ...validSignupData,
        accountInformation: {
          ...validSignupData.accountInformation,
          email: 'invalid-email',
        },
      };

      const response = await testHelper.post('/auth/signup', invalidData);

      assertErrorResponse(response, 400);
    });

    it('should fail with weak password', async () => {
      const invalidData = {
        ...validSignupData,
        accountInformation: {
          ...validSignupData.accountInformation,
          password: 'weak',
        },
      };

      const response = await testHelper.post('/auth/signup', invalidData);

      assertErrorResponse(response, 400);
    });

    it('should fail with invalid business type', async () => {
      const invalidData = {
        ...validSignupData,
        companyInformation: {
          ...validSignupData.companyInformation,
          businessType: 'INVALID_TYPE',
        },
      };

      const response = await testHelper.post('/auth/signup', invalidData);

      assertErrorResponse(response, 400);
    });

    it('should fail with duplicate email', async () => {
      // First signup
      await testHelper.post('/auth/signup', validSignupData);

      // Second signup with same email
      const duplicateData = {
        ...validSignupData,
        accountInformation: {
          ...validSignupData.accountInformation,
          username: 'different_username',
        },
      };

      const response = await testHelper.post('/auth/signup', duplicateData);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should fail with duplicate username', async () => {
      // First signup
      await testHelper.post('/auth/signup', validSignupData);

      // Second signup with same username
      const duplicateData = {
        ...validSignupData,
        accountInformation: {
          ...validSignupData.accountInformation,
          email: 'different@email.com',
        },
      };

      const response = await testHelper.post('/auth/signup', duplicateData);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should accept optional fields as null/undefined', async () => {
      const minimalData = {
        companyInformation: {
          companyName: 'Minimal Company',
          domainPrefix: 'minimal',
          businessType: BusinessType.SOLE_PROPRIETORSHIP,
          industry: Industry.RETAIL,
          // Optional fields omitted
        },
        accountInformation: validSignupData.accountInformation,
      };

      const response = await testHelper.post('/auth/signup', minimalData);

      assertSuccessResponse(response);
    });

    it('should successfully register with sourceUrl provided', async () => {
      const dataWithSourceUrl = {
        ...validSignupData,
        sourceUrl: 'https://example.com/signup?ref=marketing',
        accountInformation: {
          ...validSignupData.accountInformation,
          email: 'sourceurl@test.com',
          username: 'sourceurluser',
        },
      };

      const response = await testHelper.post('/auth/signup', dataWithSourceUrl);

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should successfully register without sourceUrl (optional field)', async () => {
      const dataWithoutSourceUrl = {
        ...validSignupData,
        accountInformation: {
          ...validSignupData.accountInformation,
          email: 'nosource@test.com',
          username: 'nosourceuser',
        },
      };

      const response = await testHelper.post(
        '/auth/signup',
        dataWithoutSourceUrl,
      );

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should validate sourceUrl as string when provided', async () => {
      const dataWithInvalidSourceUrl = {
        ...validSignupData,
        sourceUrl: 12345, // Invalid: should be string
        accountInformation: {
          ...validSignupData.accountInformation,
          email: 'invalidsource@test.com',
          username: 'invalidsourceuser',
        },
      };

      const response = await testHelper.post(
        '/auth/signup',
        dataWithInvalidSourceUrl,
      );

      assertErrorResponse(response, 400);
    });
  });

  describe('POST /auth/login - Login', () => {
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test@123456',
    };

    beforeEach(async () => {
      // Create a test user before each login test
      await testHelper.post('/auth/signup', {
        companyInformation: {
          companyName: 'Test Company',
          domainPrefix: 'test',
          businessType: BusinessType.CORPORATION,
          industry: Industry.SERVICES,
        },
        accountInformation: {
          firstName: 'Test',
          lastName: 'User',
          contactNumber: '+1234567890',
          ...testUser,
        },
      });
    });

    it('should login successfully with username', async () => {
      const response = await testHelper.post('/auth/login', {
        username: testUser.username,
        password: testUser.password,
      });

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toMatch(/^test-token-/);
      expect(response.body.data.accountInformation.username).toBe(
        testUser.username,
      );
    });

    it('should login successfully with email as username', async () => {
      const response = await testHelper.post('/auth/login', {
        username: testUser.email,
        password: testUser.password,
      });

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.accountInformation.email).toBe(testUser.email);
    });

    it('should fail with invalid username', async () => {
      const response = await testHelper.post('/auth/login', {
        username: 'nonexistent',
        password: testUser.password,
      });

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await testHelper.post('/auth/login', {
        username: testUser.username,
        password: 'WrongPassword123!',
      });

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with missing username', async () => {
      const response = await testHelper.post('/auth/login', {
        password: testUser.password,
      });

      assertErrorResponse(response, 400);
    });

    it('should fail with missing password', async () => {
      const response = await testHelper.post('/auth/login', {
        username: testUser.username,
      });

      assertErrorResponse(response, 400);
    });

    it('should fail with empty credentials', async () => {
      const response = await testHelper.post('/auth/login', {
        username: '',
        password: '',
      });

      assertErrorResponse(response, 400);
    });

    it('should return consistent account information structure', async () => {
      const response = await testHelper.post('/auth/login', {
        username: testUser.username,
        password: testUser.password,
      });

      assertSuccessResponse(response);

      const { accountInformation } = response.body.data;

      // Check all expected fields are present
      expect(accountInformation).toHaveProperty('id');
      expect(accountInformation).toHaveProperty('email');
      expect(accountInformation).toHaveProperty('firstName');
      expect(accountInformation).toHaveProperty('lastName');
      expect(accountInformation).toHaveProperty('fullName');
      expect(accountInformation).toHaveProperty('contactNumber');
      expect(accountInformation).toHaveProperty('username');
      expect(accountInformation).toHaveProperty('role');
      expect(accountInformation).toHaveProperty('company');
      expect(accountInformation).toHaveProperty('status');
      expect(accountInformation).toHaveProperty('isDeveloper');
      expect(accountInformation).toHaveProperty('createdAt');
      expect(accountInformation).toHaveProperty('updatedAt');
      expect(accountInformation).toHaveProperty('profileImageUrl');
    });
  });

  describe('Integration Tests - Signup & Login Flow', () => {
    it('should allow login after successful registration', async () => {
      const userData = {
        companyInformation: {
          companyName: 'Flow Test Company',
          domainPrefix: 'flowtest',
          businessType: BusinessType.PARTNERSHIP,
          industry: Industry.MANUFACTURING,
        },
        accountInformation: {
          firstName: 'Flow',
          lastName: 'Test',
          contactNumber: '+9876543210',
          email: 'flow@test.com',
          username: 'flowtest',
          password: 'Flow@Test123',
        },
      };

      // Step 1: Register
      const signupResponse = await testHelper.post('/auth/signup', userData);
      assertSuccessResponse(signupResponse);
      const signupToken = signupResponse.body.data.token;

      // Step 2: Login with username
      const loginResponse1 = await testHelper.post('/auth/login', {
        username: userData.accountInformation.username,
        password: userData.accountInformation.password,
      });
      assertSuccessResponse(loginResponse1);
      const loginToken1 = loginResponse1.body.data.token;

      // Step 3: Login with email
      const loginResponse2 = await testHelper.post('/auth/login', {
        username: userData.accountInformation.email,
        password: userData.accountInformation.password,
      });
      assertSuccessResponse(loginResponse2);
      const loginToken2 = loginResponse2.body.data.token;

      // Verify all tokens are different
      expect(signupToken).not.toBe(loginToken1);
      expect(signupToken).not.toBe(loginToken2);
      expect(loginToken1).not.toBe(loginToken2);

      // Verify account information is consistent
      expect(signupResponse.body.data.accountInformation.id).toBe(
        loginResponse1.body.data.accountInformation.id,
      );
      expect(loginResponse1.body.data.accountInformation.id).toBe(
        loginResponse2.body.data.accountInformation.id,
      );
    });
  });
});
