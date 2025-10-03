# Database Schema Documentation

## Overview

The GEER-ANTE ERP backend uses a dual-database architecture with PostgreSQL as the primary relational database and MongoDB for specific features requiring document storage. This document outlines the database schema, relationships, and best practices.

## Database Architecture

### Primary Database (PostgreSQL)
- **Purpose**: Core business data, transactional operations
- **ORM**: Prisma
- **Version**: PostgreSQL 14.x
- **Features**: ACID compliance, complex relationships, strong consistency

### Secondary Database (MongoDB)
- **Purpose**: Action logs, scheduler history, real-time data
- **ODM**: Mongoose
- **Version**: MongoDB 6.x
- **Features**: Flexible schema, horizontal scaling, high write throughput

## Core Schema Models

### Account Management

#### Account Model
```prisma
model Account {
  id                String      @id @default(uuid())
  email             String      @unique @db.VarChar(100)
  firstName         String      @db.VarChar(100)
  lastName          String      @db.VarChar(100)
  middleName        String      @default("") @db.VarChar(100)
  username          String      @db.VarChar(100)
  password          String?     @db.VarChar(200)
  contactNumber     String      @db.VarChar(100)
  image             String?     @default("/images/person01.webp")
  status            Status      @default(FLOATING)
  accountType       AccountType @default(STAFF)
  roleId            String
  companyId         Int?
  parentAccountId   String?
  isDeleted         Boolean     @default(false)
  isDeveloper       Boolean     @default(false)
  isEmailVerified   Boolean     @default(false)
  authProvider      AuthProvider @default(LOCAL)
  lastLogin         DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  role              Role        @relation(fields: [roleId], references: [id])
  company           Company?    @relation(fields: [companyId], references: [id])
  tokens            AccountToken[]
  employees         Employee[]
  notifications     AccountNotifications[]
}
```

#### AccountToken Model
```prisma
model AccountToken {
  id        Int      @id @default(autoincrement())
  accountId String
  token     String   @unique
  userAgent String?
  ipAddress String?
  createdAt DateTime @default(now())
  expiresAt DateTime?
  
  account   Account  @relation(fields: [accountId], references: [id])
  
  @@index([token])
  @@index([accountId])
}
```

### Company & Organization

#### Company Model
```prisma
model Company {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  code            String?  @unique
  address         String?
  phone           String?
  email           String?
  website         String?
  logo            String?
  industryType    String?
  businessType    String?
  taxId           String?
  registrationNo  String?
  establishedDate DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  accounts        Account[]
  employees       Employee[]
  projects        Project[]
  branches        Branch[]
}
```

### Human Resources

#### Employee Model
```prisma
model Employee {
  id                  String      @id @default(uuid())
  employeeNumber      String      @unique
  accountId           String?
  companyId           Int
  firstName           String
  lastName            String
  middleName          String?
  email              String      @unique
  contactNumber       String?
  dateOfBirth        DateTime?
  gender             String?
  civilStatus        String?
  address            String?
  emergencyContact   String?
  emergencyPhone     String?
  position           String?
  department         String?
  employmentStatus   EmploymentStatus @default(ACTIVE)
  employmentType     EmploymentType   @default(REGULAR)
  hireDate           DateTime
  regularizationDate DateTime?
  resignationDate    DateTime?
  basicSalary        Decimal     @db.Decimal(10, 2)
  salaryRateType     SalaryRateType @default(MONTHLY)
  bankAccountNumber  String?
  bankName           String?
  sssNumber          String?
  philhealthNumber   String?
  pagibigNumber      String?
  tinNumber          String?
  isDeleted          Boolean     @default(false)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  
  // Relations
  account            Account?    @relation(fields: [accountId], references: [id])
  company            Company     @relation(fields: [companyId], references: [id])
  timeLogs           TimeLog[]
  leaves             Leave[]
  payrollRecords     PayrollRecord[]
  schedules          EmployeeSchedule[]
}
```

#### TimeLog Model
```prisma
model TimeLog {
  id            Int         @id @default(autoincrement())
  employeeId    String
  logDate       DateTime
  logTime       DateTime
  logType       LogType     // IN, OUT, BREAK_START, BREAK_END
  source        TimekeepingSource @default(MANUAL)
  deviceId      String?
  location      String?
  remarks       String?
  isProcessed   Boolean     @default(false)
  createdAt     DateTime    @default(now())
  
  employee      Employee    @relation(fields: [employeeId], references: [id])
  
  @@index([employeeId, logDate])
  @@index([logDate])
}
```

#### Payroll Models
```prisma
model PayrollPeriod {
  id            Int         @id @default(autoincrement())
  companyId     Int
  periodStart   DateTime
  periodEnd     DateTime
  cutoffType    CutoffType  // SEMI_MONTHLY, MONTHLY, WEEKLY
  status        PayrollStatus @default(DRAFT)
  processedBy   String?
  approvedBy    String?
  processedAt   DateTime?
  approvedAt    DateTime?
  totalAmount   Decimal     @db.Decimal(12, 2)
  
  company       Company     @relation(fields: [companyId], references: [id])
  records       PayrollRecord[]
}

model PayrollRecord {
  id                Int         @id @default(autoincrement())
  payrollPeriodId   Int
  employeeId        String
  basicPay          Decimal     @db.Decimal(10, 2)
  overtime          Decimal     @db.Decimal(10, 2) @default(0)
  allowances        Decimal     @db.Decimal(10, 2) @default(0)
  deductions        Decimal     @db.Decimal(10, 2) @default(0)
  governmentContrib Decimal     @db.Decimal(10, 2) @default(0)
  tax               Decimal     @db.Decimal(10, 2) @default(0)
  netPay            Decimal     @db.Decimal(10, 2)
  status            PayslipStatus @default(DRAFT)
  
  payrollPeriod     PayrollPeriod @relation(fields: [payrollPeriodId], references: [id])
  employee          Employee    @relation(fields: [employeeId], references: [id])
  details           PayrollDetail[]
}
```

### Project Management

#### Project Model
```prisma
model Project {
  id              Int         @id @default(autoincrement())
  companyId       Int
  clientId        Int?
  name            String
  code            String      @unique
  description     String?
  status          ProjectStatus @default(PLANNING)
  startDate       DateTime?
  endDate         DateTime?
  budget          Decimal?    @db.Decimal(12, 2)
  actualCost      Decimal?    @db.Decimal(12, 2)
  progress        Int         @default(0)
  priority        Priority    @default(MEDIUM)
  isDeleted       Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  company         Company     @relation(fields: [companyId], references: [id])
  client          Client?     @relation(fields: [clientId], references: [id])
  tasks           Task[]
  boqs            BillOfQuantity[]
  members         ProjectMember[]
}
```

#### Task Model
```prisma
model Task {
  id              String      @id @default(uuid())
  projectId       Int
  boardLaneId     String?
  title           String
  description     String?
  status          TaskStatus  @default(TODO)
  priority        TaskPriority @default(MEDIUM)
  difficulty      TaskDifficulty @default(MEDIUM)
  assigneeId      String?
  reporterId      String
  dueDate         DateTime?
  estimatedHours  Float?
  actualHours     Float?
  completedAt     DateTime?
  isDeleted       Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  project         Project     @relation(fields: [projectId], references: [id])
  boardLane       BoardLane?  @relation(fields: [boardLaneId], references: [id])
  assignee        Account?    @relation("TaskAssignee", fields: [assigneeId], references: [id])
  reporter        Account     @relation("TaskReporter", fields: [reporterId], references: [id])
  collaborators   TaskCollaborator[]
  comments        TaskComment[]
  attachments     TaskAttachment[]
}
```

### Inventory Management

#### Warehouse Model
```prisma
model Warehouse {
  id              Int         @id @default(autoincrement())
  name            String
  code            String      @unique
  type            WarehouseType @default(MAIN)
  address         String
  contactPerson   String?
  contactNumber   String?
  capacity        Float?
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  inventories     Inventory[]
  transfers       WarehouseTransfer[]
}
```

#### Item Model
```prisma
model Item {
  id              Int         @id @default(autoincrement())
  code            String      @unique
  name            String
  description     String?
  category        String?
  brand           String?
  unit            String
  minimumStock    Float       @default(0)
  maximumStock    Float?
  reorderPoint    Float?
  unitCost        Decimal     @db.Decimal(10, 2)
  sellingPrice    Decimal?    @db.Decimal(10, 2)
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  inventories     Inventory[]
  variants        ItemVariant[]
  suppliers       ItemSupplier[]
}
```

#### Inventory Model
```prisma
model Inventory {
  id              Int         @id @default(autoincrement())
  warehouseId     Int
  itemId          Int
  quantity        Float       @default(0)
  reservedQty     Float       @default(0)
  availableQty    Float       @default(0)
  lastRestocked   DateTime?
  expiryDate      DateTime?
  batchNumber     String?
  location        String?     // Rack/Shelf location
  
  warehouse       Warehouse   @relation(fields: [warehouseId], references: [id])
  item            Item        @relation(fields: [itemId], references: [id])
  history         InventoryHistory[]
  
  @@unique([warehouseId, itemId, batchNumber])
  @@index([itemId])
  @@index([warehouseId])
}
```

### Financial Management

#### FundAccount Model
```prisma
model FundAccount {
  id              Int         @id @default(autoincrement())
  accountName     String
  accountNumber   String      @unique
  accountType     FundAccountType
  bankName        String?
  balance         Decimal     @db.Decimal(12, 2) @default(0)
  currency        String      @default("PHP")
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  transactions    Transaction[]
  payments        Payment[]
}
```

#### Transaction Model
```prisma
model Transaction {
  id              Int         @id @default(autoincrement())
  fundAccountId   Int
  type            TransactionType // DEBIT, CREDIT
  category        String
  amount          Decimal     @db.Decimal(12, 2)
  balance         Decimal     @db.Decimal(12, 2)
  reference       String?
  description     String?
  transactionDate DateTime    @default(now())
  createdBy       String
  approvedBy      String?
  status          TransactionStatus @default(PENDING)
  
  fundAccount     FundAccount @relation(fields: [fundAccountId], references: [id])
  
  @@index([fundAccountId, transactionDate])
}
```

### Purchase & Supply Chain

#### Supplier Model
```prisma
model Supplier {
  id              Int         @id @default(autoincrement())
  code            String      @unique
  name            String
  contactPerson   String?
  email           String?
  phone           String?
  address         String?
  taxId           String?
  paymentTerms    PaymentTerms @default(NET_30)
  creditLimit     Decimal?    @db.Decimal(12, 2)
  rating          Int?        // 1-5 rating
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  items           ItemSupplier[]
  purchaseOrders  PurchaseOrder[]
}
```

#### PurchaseOrder Model
```prisma
model PurchaseOrder {
  id              Int         @id @default(autoincrement())
  poNumber        String      @unique
  supplierId      Int
  requesterId     String
  orderDate       DateTime    @default(now())
  expectedDate    DateTime?
  status          POStatus    @default(DRAFT)
  totalAmount     Decimal     @db.Decimal(12, 2)
  terms           String?
  notes           String?
  approvedBy      String?
  approvedAt      DateTime?
  receivedBy      String?
  receivedAt      DateTime?
  
  supplier        Supplier    @relation(fields: [supplierId], references: [id])
  items           PurchaseOrderItem[]
  receipts        ItemReceipt[]
  
  @@index([supplierId])
  @@index([status])
}
```

## Enums and Types

### Common Enums

```prisma
enum Status {
  ACTIVE
  INACTIVE
  PENDING
  SUSPENDED
  DELETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AccountType {
  ADMIN
  STAFF
  CLIENT
  VENDOR
}

enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
}
```

### HR Enums

```prisma
enum EmploymentStatus {
  ACTIVE
  RESIGNED
  TERMINATED
  ON_LEAVE
  SUSPENDED
}

enum EmploymentType {
  REGULAR
  PROBATIONARY
  CONTRACTUAL
  PART_TIME
  CONSULTANT
}

enum SalaryRateType {
  HOURLY
  DAILY
  MONTHLY
}

enum LogType {
  IN
  OUT
  BREAK_START
  BREAK_END
  OVERTIME_IN
  OVERTIME_OUT
}
```

### Project Enums

```prisma
enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## Database Relationships

### One-to-Many Relationships

```
Company → Employees
Company → Projects
Project → Tasks
Employee → TimeLogs
Employee → Leaves
Warehouse → Inventories
Supplier → PurchaseOrders
```

### Many-to-Many Relationships

```
Project ←→ Members (through ProjectMember)
Task ←→ Collaborators (through TaskCollaborator)
Item ←→ Suppliers (through ItemSupplier)
Role ←→ Scopes (through RoleScope)
```

### Self-Referential Relationships

```
Account → parentAccountId (hierarchical accounts)
Task → parentTaskId (subtasks)
Category → parentCategoryId (category tree)
```

## Indexes and Optimization

### Primary Indexes

All models have primary key indexes automatically created:
- UUID for entities requiring global uniqueness
- Auto-incrementing integers for internal references

### Secondary Indexes

```prisma
// Performance-critical queries
@@index([employeeId, logDate]) // TimeLog
@@index([warehouseId, itemId])  // Inventory
@@index([projectId, status])    // Task
@@index([companyId, periodStart]) // PayrollPeriod
```

### Unique Constraints

```prisma
@@unique([email])                // Account, Employee
@@unique([code])                 // Project, Warehouse, Item
@@unique([warehouseId, itemId, batchNumber]) // Inventory
```

## Migration Best Practices

### Creating Migrations

```bash
# Development migration
npx prisma migrate dev --name descriptive_migration_name

# Example names:
npx prisma migrate dev --name add_employee_table
npx prisma migrate dev --name add_index_to_timelogs
npx prisma migrate dev --name update_account_add_phone
```

### Migration Guidelines

1. **Always backup before production migrations**
2. **Test migrations on staging first**
3. **Keep migrations small and focused**
4. **Never edit existing migrations**
5. **Document breaking changes**

### Migration Rollback

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back

# Restore from backup if needed
psql ante_db < backup.sql
```

## Data Seeding

### Seed Structure

```typescript
// prisma/seed/index.ts
async function main() {
  // 1. Create default company
  await createDefaultCompany();
  
  // 2. Create super admin account
  await createSuperAdmin();
  
  // 3. Create default roles and permissions
  await createDefaultRoles();
  
  // 4. Create reference data
  await createReferenceData();
  
  // 5. Create sample data (development only)
  if (process.env.NODE_ENV === 'development') {
    await createSampleData();
  }
}
```

### Running Seeds

```bash
# Run seed
yarn seed

# Or directly
npx ts-node prisma/seed/index.ts
```

## Query Patterns

### Efficient Queries

```typescript
// Use select to limit fields
const users = await prisma.account.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  },
});

// Use include for relations
const projectWithTasks = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    tasks: {
      where: { isDeleted: false },
      orderBy: { priority: 'desc' },
    },
  },
});

// Use pagination
const items = await prisma.item.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

### Transaction Patterns

```typescript
// Multiple operations in transaction
const result = await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.purchaseOrder.create({
    data: orderData,
  });
  
  // Update inventory
  await tx.inventory.updateMany({
    where: { itemId: { in: itemIds } },
    data: { reservedQty: { increment: quantity } },
  });
  
  // Create audit log
  await tx.auditLog.create({
    data: {
      action: 'ORDER_CREATED',
      entityId: order.id,
      userId: currentUserId,
    },
  });
  
  return order;
});
```

## MongoDB Schema (Secondary Database)

### Action Log Schema

```javascript
// MongoDB schema for action logs
const ActionLogSchema = new Schema({
  accountId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  module: { type: String, required: true, index: true },
  entityId: String,
  entityType: String,
  metadata: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true },
});

// Compound indexes
ActionLogSchema.index({ accountId: 1, timestamp: -1 });
ActionLogSchema.index({ module: 1, action: 1, timestamp: -1 });
```

### Scheduler History Schema

```javascript
const SchedulerHistorySchema = new Schema({
  taskName: { type: String, required: true, index: true },
  executionId: { type: String, unique: true },
  status: {
    type: String,
    enum: ['RUNNING', 'COMPLETED', 'FAILED'],
    required: true,
  },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number,
  output: Schema.Types.Mixed,
  error: String,
  nextRun: Date,
});
```

## Performance Considerations

### Query Optimization

1. **Use appropriate indexes**
   - Index frequently queried fields
   - Composite indexes for multiple field queries
   - Avoid over-indexing

2. **Limit data retrieval**
   - Use `select` to fetch only needed fields
   - Implement pagination for large datasets
   - Use `where` clauses effectively

3. **Optimize relationships**
   - Lazy load relations when possible
   - Use `include` judiciously
   - Consider denormalization for read-heavy operations

### Connection Pooling

```javascript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  // connection_limit = 10
  // pool_timeout = 10
}
```

## Backup and Recovery

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
pg_dump -U postgres ante_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Point-in-time recovery
pg_dump -U postgres -Fc ante_db > backup_pitr.dump
```

### Recovery Procedures

```bash
# Restore from backup
gunzip < backup_20240101.sql.gz | psql -U postgres ante_db

# Restore specific tables
pg_restore -U postgres -d ante_db -t employees backup.dump
```

## Database Security

### Access Control

```sql
-- Create read-only user
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ante_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Create application user
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ante_db TO app_user;
```

### Data Encryption

```typescript
// Encrypt sensitive data at application level
import { EncryptionService } from '@common/encryption.service';

// Before saving
const encrypted = encryptionService.encrypt(sensitiveData);

// After retrieval
const decrypted = encryptionService.decrypt(encryptedData);
```

## Monitoring and Maintenance

### Database Health Checks

```sql
-- Check database size
SELECT pg_database_size('ante_db');

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Maintenance Tasks

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE ante_db;

-- Update statistics
ANALYZE;
```