# GEER-ANTE ERP Backend

## Overview

GEER-ANTE ERP is a comprehensive Enterprise Resource Planning system built with modern technologies to provide scalable, maintainable, and efficient business solutions. The backend serves as the core API layer for the entire ERP ecosystem, handling everything from human resources and project management to inventory control and financial operations.

### Key Features

- **Human Resources Management**: Complete HRIS with timekeeping, payroll, leave management, and employee lifecycle
- **Project Management**: Task tracking, board lanes, bill of quantities, and project collaboration
- **Inventory Management**: Warehouse management, stock control, purchase orders, and supplier management
- **Financial Management**: Fund accounts, petty cash, request for payment, and financial reporting
- **School Management**: Student attendance, guardian portal, and gate management systems
- **Communication Hub**: Real-time messaging, email integration, notifications, and announcements
- **CRM Capabilities**: Lead management, client tracking, and sales pipeline
- **Workflow Automation**: Configurable approval workflows and automated business processes

### Technology Stack

- **Framework**: NestJS 10.x (Node.js framework for scalable server-side applications)
- **Language**: TypeScript 5.x
- **Database**: 
  - PostgreSQL (Primary database)
  - MongoDB (For specific features like action center and scheduler)
  - Prisma ORM for database management
- **Authentication**: Custom token-based authentication (stored in AccountToken table)
- **Real-time**: Socket.io for WebSocket connections
- **File Storage**: AWS S3 integration
- **Email**: SMTP integration with template engine (Handlebars)
- **AI Integration**: OpenAI and Google Gemini APIs
- **Containerization**: Docker with multi-stage builds
- **Process Management**: PM2 for production

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- Yarn package manager (1.22.x or higher)
- PM2 (for process management): `npm install -g pm2`
- Docker and Docker Compose (for databases)
- PostgreSQL 14.x or higher (runs in Docker)
- MongoDB 6.x or higher (runs in Docker)
- Redis 6.x or higher (runs in Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ante/backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Run Prisma migrations
   npx prisma migrate dev

   # Seed the database with initial data
   yarn seed
   ```

5. **Start the development server**
   ```bash
   # From the project root (recommended - starts all services)
   cd ..
   yarn dev

   # Or run backend only (requires databases to be running)
   yarn dev
   # Server runs on http://localhost:3000
   # WebSocket server runs on http://localhost:4000
   ```

## PM2 Development (Recommended)

### PM2 Process Management

The backend now uses PM2 for development process management with databases running in Docker. This provides better process control and logging.

**From the project root directory:**

```bash
# Start all services (databases + applications)
yarn dev

# View all logs
yarn logs

# View backend logs only
yarn logs:backend

# Check service status
yarn status

# Stop all services
yarn stop

# Clean up (stop and remove all processes)
yarn clean
```

**Backend-specific PM2 commands:**

```bash
# Direct PM2 commands for backend only
pm2 start ecosystem.config.js --only ante-backend
pm2 stop ante-backend
pm2 restart ante-backend
pm2 logs ante-backend
```

### Database Services (Docker)

Databases run in Docker containers and are managed automatically:

```bash
# Start databases only
docker compose -f docker-compose-databases.yml up -d

# Stop databases
docker compose -f docker-compose-databases.yml down

# View database logs
docker compose -f docker-compose-databases.yml logs -f
```

## Docker Development (Legacy)

> **Note**: PM2 development is now the recommended approach. This section is kept for reference.

For full Docker development (if needed):

```bash
# Build development image
docker build --target development -t ante-backend:dev .

# Run development container
docker run -p 3000:3000 -p 4000:4000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env \
  ante-backend:dev
```

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root application module
│   ├── common/                 # Shared utilities and services
│   │   ├── encryption.service.ts
│   │   ├── logger.ts
│   │   ├── prisma.service.ts
│   │   └── utility.service.ts
│   ├── modules/                # Feature modules
│   │   ├── account/           # User account management
│   │   ├── auth/              # Authentication & authorization
│   │   ├── hr/                # Human resources modules
│   │   ├── project/           # Project management
│   │   ├── inventory/         # Inventory management
│   │   ├── finance/           # Financial modules
│   │   ├── communication/     # Email, notifications, chat
│   │   ├── school/            # School management
│   │   └── ...                # Other feature modules
│   ├── infrastructure/        # Infrastructure concerns
│   │   ├── queue/            # Job queue management
│   │   └── file-upload/      # File handling
│   ├── integrations/         # External service integrations
│   │   └── ai-chat/          # AI service integrations
│   ├── middleware/           # Express middleware
│   ├── guards/               # NestJS guards
│   ├── decorators/           # Custom decorators
│   ├── pipes/                # Validation pipes
│   ├── filters/              # Exception filters
│   └── reference/            # Reference data and constants
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed/                 # Database seeders
├── test/                     # Test configurations and utilities
├── templates/                # Service and module templates
├── logs/                     # Application logs
└── dist/                     # Compiled JavaScript output
```

## Development Workflow

### Available Scripts

```bash
# Development (PM2)
yarn dev                    # Start with PM2 (recommended)
yarn start                 # Direct Node.js start (legacy)
yarn start:debug           # Start with debugging enabled

# Process Management
yarn logs                  # View PM2 logs
yarn status               # Check PM2 status
yarn stop                 # Stop PM2 processes
yarn clean                # Clean up PM2 processes

# Building
yarn build                 # Build for production
yarn prebuild             # Clean dist folder before build

# Testing
yarn test                  # Run unit tests
yarn test:watch           # Run tests in watch mode
yarn test:coverage        # Generate coverage report
yarn test:e2e             # Run end-to-end tests
yarn test:api             # Run API tests

# Database
yarn migrate:dev          # Run migrations in development
yarn migrate:production   # Deploy migrations to production
yarn seed                 # Seed database with initial data

# Code Quality
yarn lint                 # Run ESLint
yarn format              # Format code with Prettier
yarn ts-check            # Type check without building
```

### Development Guidelines

1. **Module Structure**: Each feature should be organized as a NestJS module with:
   - `*.module.ts` - Module definition
   - `*.controller.ts` - HTTP endpoint handlers
   - `*.service.ts` - Business logic
   - `*.validator.ts` - DTO validation schemas
   - `*.interface.ts` - TypeScript interfaces

2. **Database Changes**: 
   - Never run `prisma db push` in production
   - Always create migrations: `npx prisma migrate dev --name <description>`
   - Document schema changes in migration notes

3. **API Design**:
   - Follow RESTful conventions
   - Use proper HTTP status codes
   - Implement comprehensive error handling
   - Document endpoints with clear request/response examples

4. **Authentication**:
   - All endpoints except `/auth/login` and `/auth/signup` require authentication
   - Token should be sent in header: `token: YOUR_TOKEN_HERE`
   - Tokens are stored in the `AccountToken` table

## API Documentation

### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "generated-token",
    "account": { ... }
  }
}
```

### Common Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "Optional message",
  "error": "Error details if success is false"
}
```

### Main API Modules

- `/auth` - Authentication and authorization
- `/accounts` - User account management
- `/hr` - Human resources endpoints
- `/projects` - Project management
- `/inventory` - Inventory and warehouse management
- `/finance` - Financial operations
- `/notifications` - Real-time notifications
- `/reports` - Reporting and analytics

For detailed API documentation, see [API Documentation](./documentation/api/README.md).

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **Account**: User accounts with roles and permissions
- **Company**: Multi-tenant company management
- **Employee**: HR employee records
- **Project**: Project management entities
- **Inventory**: Stock and warehouse management
- **Transaction**: Financial transactions

For complete schema documentation, see [Database Schema](./documentation/database/README.md).

## Testing

The project follows a comprehensive testing strategy:

- **Unit Tests**: Test individual services and utilities
- **Integration Tests**: Test module interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test HTTP endpoints

```bash
# Run all tests
yarn test:all

# Run specific test suites
yarn test:services
yarn test:controllers
yarn test:middleware

# Generate coverage report
yarn test:coverage
```

For detailed testing guidelines, see [Testing Documentation](./test/README.md).

## Deployment

### Staging Deployment

```bash
# Using deployment script
./deploy-staging.sh

# Or manual deployment
ssh jdev@157.230.246.107
cd /home/jdev/ante/backend
git pull
yarn install
yarn build
pm2 restart backend
```

### Production Deployment

```bash
# Using deployment script
./deploy-production.sh

# Or manual deployment
ssh jdev@178.128.49.38
cd /home/jdev/ante/backend
git pull
yarn install --production
yarn build
pm2 restart backend
```

### Docker Production Build

```bash
# Build production image
docker build --target production -t ante-backend:latest .

# Run production container
docker run -d \
  --name ante-backend \
  -p 3000:3000 \
  -p 4000:4000 \
  --env-file .env.production \
  ante-backend:latest
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Server
NODE_ENV=development|production
PORT=3000
SOCKET_PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ante_db
MONGODB_URI=mongodb://localhost:27017/ante

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=10

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running: `sudo service postgresql status`
   - Check DATABASE_URL in .env file
   - Ensure database exists: `createdb ante_db`

2. **Port Already in Use**
   - The dev script includes `npx kill-port 3000`
   - Or manually: `lsof -i :3000` and `kill -9 <PID>`

3. **Prisma Client Issues**
   - Regenerate client: `npx prisma generate`
   - Clear cache: `rm -rf node_modules/.prisma`

4. **Module Import Errors**
   - Check TypeScript path aliases in `tsconfig.json`
   - Verify module exports and imports
   - Rebuild: `yarn build`

5. **Docker Issues**
   - Check Docker daemon: `docker info`
   - Clean containers: `docker system prune`
   - Rebuild without cache: `docker build --no-cache`

For more troubleshooting tips, see [Troubleshooting Guide](./documentation/troubleshooting.md).

## Contributing

1. Create a feature branch from `main`
2. Follow the coding standards (see CLAUDE.md)
3. Write tests for new features
4. Ensure all tests pass
5. Create a pull request with clear description

## Security

- Never commit `.env` files
- Use environment variables for sensitive data
- Implement proper input validation
- Use parameterized queries (handled by Prisma)
- Keep dependencies updated
- Follow OWASP security guidelines

## Support

For questions or issues:
- Check the [documentation](./documentation/)
- Review existing issues in the repository
- Contact the development team

## License

Proprietary - GEER-ANTE ERP

---

Built with NestJS, TypeScript, and modern web technologies for enterprise-grade performance and reliability.