# System Architecture

## Overview

The GEER-ANTE ERP backend follows a modular, layered architecture built on NestJS framework principles. The system is designed for scalability, maintainability, and clear separation of concerns.

## Architecture Principles

### 1. Domain-Driven Design (DDD)
- Business logic organized by domain modules
- Clear boundaries between different business contexts
- Each module encapsulates its own domain logic

### 2. Dependency Injection
- NestJS IoC container manages dependencies
- Services are injected rather than instantiated
- Promotes loose coupling and testability

### 3. SOLID Principles
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes are substitutable
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│         (Web App, Mobile App, Third-party APIs)         │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│                   (Controllers Layer)                    │
│  • HTTP endpoints      • WebSocket handlers             │
│  • Request validation  • Response formatting            │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│                     (Services Layer)                     │
│  • Core business rules    • Domain logic                │
│  • Data transformation    • External API integration    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│                 (Repositories/Prisma)                    │
│  • Database queries       • Data persistence            │
│  • Transaction management • Query optimization          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                     Database Layer                       │
│          (PostgreSQL Primary, MongoDB Secondary)         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Controllers
- Handle HTTP requests and responses
- Validate incoming data using DTOs
- Delegate business logic to services
- Apply guards, interceptors, and filters

Example structure:
```typescript
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}
  
  @Get()
  @UseGuards(AuthGuard)
  async findAll() {
    return this.resourceService.findAll();
  }
}
```

### 2. Services
- Contain business logic
- Interact with data layer through Prisma
- Handle complex operations and workflows
- Integrate with external services

Example structure:
```typescript
@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private utility: UtilityService
  ) {}
  
  async findAll() {
    // Business logic here
    return this.prisma.resource.findMany();
  }
}
```

### 3. Modules
- Organize related components
- Define dependency boundaries
- Configure providers and exports
- Enable feature encapsulation

Example structure:
```typescript
@Module({
  imports: [CommonModule],
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService]
})
export class ResourceModule {}
```

## Module Architecture

### Feature Modules

Each business domain has its own module:

```
modules/
├── account/          # User account management
├── auth/            # Authentication & authorization
├── hr/              # Human resources
│   ├── configuration/   # HR settings
│   ├── computation/     # Payroll calculations
│   ├── filing/         # Leave/OT requests
│   ├── processing/     # Payroll processing
│   └── timekeeping/    # Attendance tracking
├── project/         # Project management
│   ├── board/         # Kanban boards
│   ├── boq/          # Bill of quantities
│   ├── scope/        # Project scopes
│   └── task/         # Task management
├── inventory/       # Inventory management
│   ├── brand/        # Product brands
│   ├── delivery/     # Delivery tracking
│   ├── item/         # Item management
│   ├── supplier/     # Supplier management
│   └── warehouse/    # Warehouse operations
├── finance/         # Financial operations
│   ├── collection/   # Payment collections
│   ├── fund-account/ # Fund management
│   ├── petty-cash/   # Petty cash
│   ├── purchase-order/ # PO management
│   └── rfp/          # Request for payment
├── communication/   # Communication services
│   ├── email/        # Email service
│   ├── notification/ # Push notifications
│   ├── socket/       # WebSocket connections
│   └── telegram/     # Telegram integration
└── school/          # School management
    ├── attendance/   # Student attendance
    ├── guardian/     # Guardian portal
    └── student/      # Student management
```

### Shared Modules

Common functionality shared across features:

```
common/
├── encryption.service.ts  # Data encryption
├── logger.ts             # Logging service
├── prisma.service.ts     # Database client
└── utility.service.ts    # Helper functions

infrastructure/
├── queue/               # Job queue management
├── file-upload/         # File handling
└── cache/              # Caching layer

integrations/
├── ai-chat/            # AI services
├── aws/                # AWS services
└── payment/            # Payment gateways
```

## Data Flow

### Request Lifecycle

1. **Client Request** → API Gateway
2. **Middleware** → Authentication, logging, rate limiting
3. **Guards** → Authorization checks
4. **Pipes** → Input validation and transformation
5. **Controller** → Route handling
6. **Service** → Business logic execution
7. **Repository/Prisma** → Database operations
8. **Response** → Data transformation and return

### WebSocket Communication

```
Client ←→ Socket.io Gateway ←→ Service Layer ←→ Database
                    ↓
             Event Emitters → Other Services
```

## Database Architecture

### Primary Database (PostgreSQL)
- Transactional data
- User accounts and authentication
- Business entities (projects, inventory, HR)
- Financial records
- Audit trails

### Secondary Database (MongoDB)
- Action center logs
- Scheduler execution history
- Real-time collaboration data
- Temporary session data
- Analytics and metrics

### Database Patterns

1. **Repository Pattern** (via Prisma)
   - Abstraction over data access
   - Type-safe queries
   - Migration management

2. **Unit of Work** (via Prisma transactions)
   ```typescript
   await this.prisma.$transaction(async (tx) => {
     await tx.order.create({ ... });
     await tx.inventory.update({ ... });
   });
   ```

3. **Soft Deletes**
   - `isDeleted` flags preserve data
   - Audit trail maintenance
   - Recovery capabilities

## Security Architecture

### Authentication Flow
```
Login Request → Validate Credentials → Generate Token → Store in AccountToken
                                                ↓
Subsequent Requests → Token Validation → User Context → Authorized Access
```

### Authorization Layers
1. **Token Authentication** - API access control
2. **Role-Based Access Control (RBAC)** - Feature permissions
3. **Scope-Based Permissions** - Fine-grained access
4. **Company/Tenant Isolation** - Multi-tenancy support

### Security Measures
- Password hashing with bcrypt
- Token-based authentication (custom implementation)
- Input validation and sanitization
- SQL injection prevention (Prisma parameterized queries)
- XSS protection
- Rate limiting
- CORS configuration

## Integration Architecture

### External Service Integration

```
Application → Service Adapter → External API
                    ↓
            Response Handler → Data Mapper → Application
```

### Supported Integrations
- **AWS S3** - File storage
- **SMTP** - Email delivery
- **OpenAI/Gemini** - AI capabilities
- **Telegram Bot** - Notifications
- **Google OAuth** - Social login
- **Facebook OAuth** - Social login

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Database connection pooling
- Load balancer ready
- Distributed caching support

### Performance Optimization
- Query optimization with Prisma
- Lazy loading relationships
- Pagination for large datasets
- Caching strategies
- Background job processing

### Monitoring & Observability
- Structured logging with Winston
- Error tracking and reporting
- Performance metrics
- Health check endpoints
- Database query monitoring

## Event-Driven Architecture

### Event Emitters
Used for decoupling components:
```typescript
@Injectable()
export class OrderService {
  constructor(private eventEmitter: EventEmitter2) {}
  
  async createOrder(data: CreateOrderDto) {
    const order = await this.prisma.order.create({ data });
    this.eventEmitter.emit('order.created', order);
    return order;
  }
}
```

### Event Listeners
React to system events:
```typescript
@Injectable()
export class NotificationListener {
  @OnEvent('order.created')
  handleOrderCreated(order: Order) {
    // Send notification
  }
}
```

## Deployment Architecture

### Development Environment
- Local development with hot reload
- Docker containers for consistency
- Local database instances

### Staging Environment
- Mirrors production setup
- Separate database
- Testing ground for new features

### Production Environment
- PM2 process management
- Load balancing
- Database replication
- Backup strategies
- Monitoring and alerting

## Technology Stack Details

### Core Framework
- **NestJS 10.x** - Progressive Node.js framework
- **TypeScript 5.x** - Type safety and modern JavaScript
- **Node.js 20.x** - JavaScript runtime

### Data Layer
- **Prisma ORM** - Type-safe database client
- **PostgreSQL 14.x** - Primary relational database
- **MongoDB 6.x** - Document store for specific features

### Communication
- **Socket.io** - Real-time bidirectional communication
- **Express** - HTTP server (via NestJS)
- **Nodemailer** - Email delivery

### Security & Auth
- **bcrypt** - Password hashing
- **crypto-js** - Encryption utilities
- **Custom token auth** - Stateful authentication

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Containerization
- **PM2** - Process management

## Best Practices

### Code Organization
1. One class per file
2. Clear naming conventions
3. Consistent folder structure
4. Separation of concerns

### Error Handling
1. Global exception filters
2. Structured error responses
3. Proper error logging
4. Client-friendly error messages

### Testing Strategy
1. Unit tests for services
2. Integration tests for APIs
3. E2E tests for workflows
4. Minimum 80% code coverage

### Documentation
1. Code comments for complex logic
2. API documentation
3. Architecture decision records
4. Deployment guides

## Future Considerations

### Planned Improvements
- Microservices migration for specific domains
- GraphQL API layer
- Redis caching implementation
- Elasticsearch for advanced search
- Kubernetes orchestration
- Message queue implementation (RabbitMQ/Kafka)

### Technical Debt
- Refactor standalone controllers into modules
- Implement comprehensive API versioning
- Enhance monitoring and observability
- Improve test coverage in legacy modules
- Standardize error handling across all modules