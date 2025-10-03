# Development Workflow

## Getting Started

This guide covers the development workflow for the GEER-ANTE ERP backend, including setup, coding standards, best practices, and common development tasks.

## Development Environment Setup

### Prerequisites Installation

1. **Node.js 20.x**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **Yarn Package Manager**
   ```bash
   npm install -g yarn
   ```

3. **PostgreSQL 14.x**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   ```

4. **MongoDB 6.x** (Optional)
   ```bash
   # Ubuntu/Debian
   sudo apt install mongodb

   # macOS
   brew tap mongodb/brew
   brew install mongodb-community@6.0
   ```

5. **Docker** (Optional but recommended)
   ```bash
   # Install Docker Desktop from https://www.docker.com/products/docker-desktop
   ```

### Project Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ante/backend
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb ante_db

   # Run migrations
   npx prisma migrate dev

   # Seed initial data
   yarn seed
   ```

5. **Start Development Server**
   ```bash
   yarn dev
   ```

## Development Scripts

### Core Commands

```bash
# Development server with hot reload
yarn dev

# Development with debug mode
yarn start:debug

# Type checking without building
yarn ts-check

# Build the application
yarn build

# Run production build locally
yarn start:prod
```

### Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (CAUTION: deletes all data)
yarn migrate:reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (GUI for database)
npx prisma studio

# Seed database
yarn seed
```

### Testing Commands

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test suites
yarn test:services
yarn test:controllers
yarn test:middleware

# Run E2E tests
yarn test:e2e

# Run API tests
yarn test:api
```

### Code Quality Commands

```bash
# Run linter
yarn lint

# Format code with Prettier
yarn format

# Type check
yarn ts-check
```

## Code Style Guide

### TypeScript Guidelines

1. **Use TypeScript Strictly**
   ```typescript
   // Good
   interface UserData {
     id: string;
     email: string;
     name: string;
   }

   function processUser(user: UserData): void {
     // Implementation
   }

   // Bad
   function processUser(user: any) {
     // Avoid 'any' type
   }
   ```

2. **Prefer Interfaces over Types**
   ```typescript
   // Good
   interface User {
     id: string;
     email: string;
   }

   // Use type only for unions or specific needs
   type Status = 'active' | 'inactive' | 'pending';
   ```

3. **Use Async/Await**
   ```typescript
   // Good
   async function fetchData(): Promise<Data> {
     try {
       const result = await this.prisma.data.findMany();
       return result;
     } catch (error) {
       this.logger.error('Failed to fetch data', error);
       throw error;
     }
   }

   // Avoid callback hell and promise chains
   ```

### NestJS Patterns

1. **Module Structure**
   ```typescript
   @Module({
     imports: [CommonModule],
     controllers: [UserController],
     providers: [UserService, UserRepository],
     exports: [UserService], // Export if needed by other modules
   })
   export class UserModule {}
   ```

2. **Service Pattern**
   ```typescript
   @Injectable()
   export class UserService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly utility: UtilityService,
     ) {}

     async findAll(filters?: UserFilters): Promise<User[]> {
       // Business logic here
       return this.prisma.user.findMany({
         where: filters,
       });
     }
   }
   ```

3. **Controller Pattern**
   ```typescript
   @Controller('users')
   @UseGuards(AuthGuard)
   export class UserController {
     constructor(private readonly userService: UserService) {}

     @Get()
     async findAll(@Query() query: UserQueryDto) {
       const users = await this.userService.findAll(query);
       return this.utility.responseHandler(users, 'Users fetched successfully');
     }

     @Post()
     @UsePipes(ValidationPipe)
     async create(@Body() createUserDto: CreateUserDto) {
       const user = await this.userService.create(createUserDto);
       return this.utility.responseHandler(user, 'User created successfully', 201);
     }
   }
   ```

4. **DTO Validation**
   ```typescript
   import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

   export class CreateUserDto {
     @IsEmail()
     @IsNotEmpty()
     email: string;

     @IsNotEmpty()
     @MinLength(8)
     password: string;

     @IsNotEmpty()
     firstName: string;

     @IsNotEmpty()
     lastName: string;

     @IsOptional()
     phoneNumber?: string;
   }
   ```

### Database Patterns

1. **Prisma Queries**
   ```typescript
   // Use select for performance
   const users = await this.prisma.user.findMany({
     select: {
       id: true,
       email: true,
       profile: {
         select: {
           firstName: true,
           lastName: true,
         },
       },
     },
   });

   // Use transactions for data consistency
   const result = await this.prisma.$transaction(async (tx) => {
     const user = await tx.user.create({ data: userData });
     const profile = await tx.profile.create({ 
       data: { ...profileData, userId: user.id },
     });
     return { user, profile };
   });
   ```

2. **Error Handling**
   ```typescript
   try {
     const result = await this.prisma.user.create({ data });
     return result;
   } catch (error) {
     if (error.code === 'P2002') {
       throw new ConflictException('User already exists');
     }
     throw new InternalServerErrorException('Failed to create user');
   }
   ```

## Git Workflow

### Branch Naming Convention

```bash
# Feature branches
feature/add-user-authentication
feature/implement-payroll-processing

# Bug fixes
bugfix/fix-login-validation
bugfix/correct-calculation-error

# Hotfixes (urgent production fixes)
hotfix/security-patch
hotfix/critical-payment-fix

# Refactoring
refactor/improve-query-performance
refactor/restructure-auth-module
```

### Commit Message Format

```bash
# Format: <type>(<scope>): <subject>

# Examples
feat(auth): add Google OAuth integration
fix(payroll): correct tax calculation formula
docs(api): update authentication documentation
refactor(hr): improve employee service performance
test(inventory): add unit tests for item service
chore(deps): update NestJS to version 10.x
```

### Pull Request Process

1. **Create feature branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(module): description"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub/GitLab
   ```

4. **PR Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass locally
   - [ ] Added/updated tests for changes
   - [ ] Updated documentation if needed
   - [ ] No console.log statements
   - [ ] Migrations created if schema changed

## Common Development Tasks

### Creating a New Module

1. **Generate module structure**
   ```bash
   nest g module modules/your-module
   nest g controller modules/your-module
   nest g service modules/your-module
   ```

2. **Create supporting files**
   ```typescript
   // your-module.validator.ts
   export class CreateYourModuleDto {
     // Validation rules
   }

   // your-module.interface.ts
   export interface YourModuleInterface {
     // Type definitions
   }
   ```

3. **Register in app.module.ts**
   ```typescript
   imports: [
     // ... other modules
     YourModuleModule,
   ]
   ```

### Adding a New API Endpoint

1. **Define DTO**
   ```typescript
   // dto/create-resource.dto.ts
   export class CreateResourceDto {
     @IsNotEmpty()
     name: string;

     @IsOptional()
     description?: string;
   }
   ```

2. **Implement service method**
   ```typescript
   // resource.service.ts
   async create(data: CreateResourceDto): Promise<Resource> {
     return this.prisma.resource.create({ data });
   }
   ```

3. **Add controller endpoint**
   ```typescript
   // resource.controller.ts
   @Post()
   @UseGuards(AuthGuard)
   async create(@Body() dto: CreateResourceDto) {
     const resource = await this.service.create(dto);
     return this.utility.responseHandler(resource, 'Resource created');
   }
   ```

4. **Write tests**
   ```typescript
   // resource.service.spec.ts
   describe('create', () => {
     it('should create a resource', async () => {
       const data = { name: 'Test Resource' };
       const result = await service.create(data);
       expect(result).toBeDefined();
       expect(result.name).toBe(data.name);
     });
   });
   ```

### Database Schema Changes

1. **Modify schema.prisma**
   ```prisma
   model Resource {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_resource_table
   ```

3. **Update seed data if needed**
   ```typescript
   // prisma/seed/index.ts
   await prisma.resource.create({
     data: { name: 'Default Resource' },
   });
   ```

### Adding Background Jobs

1. **Create task service**
   ```typescript
   @Injectable()
   export class ReportGenerationTask {
     @Cron('0 0 * * *') // Daily at midnight
     async generateDailyReports() {
       // Implementation
     }
   }
   ```

2. **Register in module**
   ```typescript
   providers: [ReportGenerationTask]
   ```

### Implementing WebSocket Features

1. **Create gateway**
   ```typescript
   @WebSocketGateway()
   export class ChatGateway {
     @SubscribeMessage('message')
     handleMessage(client: Socket, payload: any) {
       // Handle message
       this.server.emit('message', payload);
     }
   }
   ```

2. **Register in module**
   ```typescript
   providers: [ChatGateway]
   ```

## Debugging

### Using VSCode Debugger

1. **Create launch.json**
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Nest",
         "runtimeExecutable": "yarn",
         "runtimeArgs": ["start:debug"],
         "console": "integratedTerminal",
         "restart": true,
         "protocol": "inspector",
         "autoAttachChildProcesses": true
       }
     ]
   }
   ```

2. **Set breakpoints and start debugging**

### Logging

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findAll() {
    this.logger.log('Fetching all users');
    this.logger.debug('Debug information');
    this.logger.warn('Warning message');
    this.logger.error('Error message', stack);
  }
}
```

### Database Debugging

```bash
# View SQL queries
export DEBUG=prisma:query

# Open Prisma Studio
npx prisma studio

# Check database directly
psql -U username -d ante_db
```

## Performance Optimization

### Query Optimization

1. **Use select to limit fields**
   ```typescript
   const users = await this.prisma.user.findMany({
     select: { id: true, email: true },
   });
   ```

2. **Use pagination**
   ```typescript
   const users = await this.prisma.user.findMany({
     skip: (page - 1) * limit,
     take: limit,
   });
   ```

3. **Use indexes**
   ```prisma
   model User {
     email String @unique
     @@index([createdAt])
   }
   ```

### Caching Strategies

```typescript
@Injectable()
export class CachedService {
  private cache = new Map();

  async getData(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const data = await this.fetchData(key);
    this.cache.set(key, data);
    return data;
  }
}
```

## Security Best Practices

### Input Validation

Always validate and sanitize input:

```typescript
@Post()
async create(@Body(ValidationPipe) dto: CreateUserDto) {
  // DTO is automatically validated
}
```

### SQL Injection Prevention

Prisma automatically prevents SQL injection, but be careful with raw queries:

```typescript
// Good
const users = await this.prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// Bad - vulnerable to SQL injection
const users = await this.prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Authentication Checks

```typescript
@UseGuards(AuthGuard)
@Controller('protected')
export class ProtectedController {
  // All endpoints require authentication
}
```

## Environment Management

### Local Development (.env)
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost/ante_dev
```

### Testing (.env.test)
```env
NODE_ENV=test
DATABASE_URL=postgresql://localhost/ante_test
```

### Staging (.env.staging)
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging_server/ante_staging
```

## Troubleshooting Development Issues

### Common Problems and Solutions

1. **Port already in use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or find and kill manually
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Prisma client out of sync**
   ```bash
   npx prisma generate
   yarn install
   ```

3. **Module import errors**
   - Check tsconfig.json paths
   - Verify exports in module files
   - Rebuild: `yarn build`

4. **Database connection issues**
   - Check DATABASE_URL in .env
   - Verify PostgreSQL is running
   - Check credentials and permissions

## Resources

### Documentation
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Tools
- [Postman](https://www.postman.com) - API testing
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [pgAdmin](https://www.pgadmin.org) - PostgreSQL management
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI

### VS Code Extensions
- ESLint
- Prettier
- Prisma
- NestJS Files
- GitLens
- Thunder Client (API testing)