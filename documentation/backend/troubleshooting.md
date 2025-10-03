# Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps developers diagnose and resolve common issues encountered while developing, deploying, and maintaining the GEER-ANTE ERP backend.

## Quick Diagnostics

### System Health Check

Run these commands to quickly assess system health:

```bash
# Check if server is running
curl http://localhost:3000/health

# Check database connection
psql -U postgres -d ante_db -c "SELECT 1"

# Check Node.js version
node --version

# Check available memory
free -h

# Check disk space
df -h

# Check running processes
pm2 status
# or
ps aux | grep node
```

## Common Development Issues

### 1. Application Won't Start

#### Symptoms
- Server fails to start
- Process exits immediately
- No response on port 3000

#### Diagnosis
```bash
# Check for port conflicts
lsof -i :3000
netstat -tulpn | grep 3000

# Check Node.js errors
yarn dev 2>&1 | tee error.log

# Check environment variables
printenv | grep DATABASE_URL
```

#### Solutions

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# or
kill -9 $(lsof -t -i:3000)

# Change port in .env
PORT=3001
```

**Missing environment variables:**
```bash
# Copy example environment file
cp .env.example .env

# Verify required variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET|NODE_ENV"
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# Clear yarn cache if needed
yarn cache clean
```

### 2. Database Connection Issues

#### Symptoms
- "Connection refused" errors
- "Database does not exist" errors
- Timeout errors

#### Diagnosis
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# or
brew services list | grep postgresql

# Test connection
psql -U postgres -h localhost -p 5432

# Check database exists
psql -U postgres -l | grep ante_db
```

#### Solutions

**PostgreSQL not running:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql
# or on macOS
brew services start postgresql@14

# Enable auto-start
sudo systemctl enable postgresql
```

**Database doesn't exist:**
```bash
# Create database
createdb ante_db
# or
psql -U postgres -c "CREATE DATABASE ante_db;"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ante_db TO your_user;"
```

**Wrong connection string:**
```bash
# Update .env file
DATABASE_URL="postgresql://username:password@localhost:5432/ante_db"

# Test connection
npx prisma db pull
```

### 3. Prisma Issues

#### Symptoms
- "Prisma client is not generated" errors
- Migration failures
- Schema out of sync

#### Diagnosis
```bash
# Check Prisma client
ls node_modules/.prisma/client

# Validate schema
npx prisma validate

# Check migration status
npx prisma migrate status
```

#### Solutions

**Generate Prisma client:**
```bash
npx prisma generate

# Force regeneration
rm -rf node_modules/.prisma
npx prisma generate
```

**Fix migration issues:**
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Mark migration as applied
npx prisma migrate resolve --applied "migration_name"

# Create new migration
npx prisma migrate dev --name fix_issue
```

**Schema drift:**
```bash
# Pull current database schema
npx prisma db pull

# Compare with schema.prisma
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

### 4. Module Import Errors

#### Symptoms
- "Cannot find module" errors
- "Module not found" errors
- TypeScript path alias issues

#### Diagnosis
```bash
# Check TypeScript configuration
cat tsconfig.json | grep -A 10 "paths"

# Verify module exists
ls src/modules/*/

# Check for circular dependencies
npx madge --circular src/
```

#### Solutions

**Fix path aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@infrastructure/*": ["src/infrastructure/*"]
    }
  }
}
```

**Rebuild project:**
```bash
# Clean build
rm -rf dist
yarn build

# Type check
yarn ts-check
```

### 5. Authentication Issues

#### Symptoms
- "Unauthorized" responses
- Token validation failures
- Login not working

#### Diagnosis
```bash
# Check token in database
psql -U postgres -d ante_db -c "SELECT * FROM AccountToken WHERE token='your_token';"

# Test authentication endpoint
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

#### Solutions

**Invalid token:**
```typescript
// Clear expired tokens
await prisma.accountToken.deleteMany({
  where: {
    expiresAt: {
      lt: new Date()
    }
  }
});
```

**Password hashing issues:**
```bash
# Verify bcrypt rounds in .env
BCRYPT_ROUNDS=10

# Reset user password
npx ts-node scripts/reset-password.ts user@example.com newpassword
```

## Production Issues

### 6. High Memory Usage

#### Symptoms
- Server crashes with "JavaScript heap out of memory"
- Slow performance
- PM2 restarts frequently

#### Diagnosis
```bash
# Check memory usage
pm2 monit
free -h
top -o %MEM

# Check for memory leaks
node --inspect dist/main.js
# Then use Chrome DevTools Memory Profiler
```

#### Solutions

**Increase Node.js memory:**
```bash
# In ecosystem.config.js
node_args: '--max-old-space-size=2048'

# Or when starting
node --max-old-space-size=2048 dist/main.js
```

**Fix memory leaks:**
```typescript
// Close connections properly
afterEach(async () => {
  await prisma.$disconnect();
});

// Clear intervals and timeouts
clearInterval(intervalId);
clearTimeout(timeoutId);

// Remove event listeners
emitter.removeAllListeners();
```

### 7. Slow API Response Times

#### Symptoms
- Requests taking > 1 second
- Database queries slow
- Timeouts

#### Diagnosis
```bash
# Enable query logging
export DEBUG=prisma:query

# Monitor slow queries
psql -U postgres -d ante_db -c "
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Check indexes
psql -U postgres -d ante_db -c "\di"
```

#### Solutions

**Optimize queries:**
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
});

// Add pagination
const users = await prisma.user.findMany({
  take: 20,
  skip: (page - 1) * 20
});

// Use indexes
// In schema.prisma
@@index([email, createdAt])
```

**Add caching:**
```typescript
import { caching } from 'cache-manager';

const cache = await caching('memory', {
  ttl: 600, // 10 minutes
});

const cachedData = await cache.get(key);
if (cachedData) return cachedData;

const data = await expensive Operation();
await cache.set(key, data);
```

### 8. File Upload Issues

#### Symptoms
- "File too large" errors
- Uploads failing
- Files not saving

#### Diagnosis
```bash
# Check disk space
df -h

# Check upload directory permissions
ls -la uploads/

# Check Nginx client_max_body_size
grep client_max_body_size /etc/nginx/nginx.conf
```

#### Solutions

**Increase file size limits:**
```typescript
// In main.ts
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
```

**Fix permissions:**
```bash
# Create upload directory
mkdir -p uploads
chmod 755 uploads
chown -R node:node uploads
```

**Update Nginx:**
```nginx
# In nginx.conf
client_max_body_size 50M;
```

## Docker Issues

### 9. Container Won't Start

#### Symptoms
- Container exits immediately
- "No such file or directory" errors
- Permission denied

#### Diagnosis
```bash
# Check container logs
docker logs ante-backend

# Inspect container
docker inspect ante-backend

# Run in interactive mode
docker run -it ante-backend:latest /bin/sh
```

#### Solutions

**Fix entrypoint:**
```dockerfile
# Ensure executable
RUN chmod +x /app/entrypoint.sh

# Use proper shell
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["node", "dist/main.js"]
```

**Fix permissions:**
```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 10. Docker Network Issues

#### Symptoms
- Cannot connect to database from container
- Service discovery not working
- Connection refused between containers

#### Diagnosis
```bash
# List networks
docker network ls

# Inspect network
docker network inspect bridge

# Test connectivity
docker exec backend ping postgres
```

#### Solutions

**Use service names:**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/db
      #                                     ^^^^^^^^ service name
```

**Create custom network:**
```bash
docker network create ante-network
docker run --network ante-network backend
```

## Database Issues

### 11. Migration Failures

#### Symptoms
- "Migration failed" errors
- Schema drift warnings
- Constraint violations

#### Diagnosis
```bash
# Check migration status
npx prisma migrate status

# View migration files
ls prisma/migrations/

# Check database schema
psql -U postgres -d ante_db -c "\dt"
```

#### Solutions

**Reset migrations (Development only):**
```bash
# Backup data first!
pg_dump ante_db > backup.sql

# Reset
npx prisma migrate reset

# Restore data if needed
psql ante_db < backup.sql
```

**Fix failed migration:**
```bash
# Mark as rolled back
npx prisma migrate resolve --rolled-back

# Edit migration file if needed
vi prisma/migrations/20240101_migration/migration.sql

# Reapply
npx prisma migrate deploy
```

### 12. Database Performance

#### Symptoms
- Slow queries
- High CPU usage on database
- Lock timeouts

#### Diagnosis
```sql
-- Find slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;
```

#### Solutions

**Add indexes:**
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1
ORDER BY n_distinct DESC;

-- Create index
CREATE INDEX idx_user_email ON users(email);
```

**Optimize queries:**
```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM large_table WHERE condition;

-- Vacuum and analyze
VACUUM ANALYZE table_name;
```

## Testing Issues

### 13. Test Failures

#### Symptoms
- Tests passing locally but failing in CI
- Timeout errors
- Database connection errors in tests

#### Diagnosis
```bash
# Run tests verbosely
yarn test --verbose

# Run single test file
yarn test path/to/test.spec.ts

# Check test database
psql -U postgres -l | grep test
```

#### Solutions

**Fix test database:**
```bash
# Create test database
createdb ante_test

# Update test environment
echo "DATABASE_URL=postgresql://localhost/ante_test" > .env.test
```

**Fix async issues:**
```typescript
// Increase timeout
jest.setTimeout(30000);

// Proper cleanup
afterEach(async () => {
  await prisma.$disconnect();
});

// Wait for async operations
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});
```

## Monitoring & Logging

### 14. Missing Logs

#### Symptoms
- No log output
- Logs not persisting
- Can't find error details

#### Diagnosis
```bash
# Check log files
ls -la logs/

# Check PM2 logs
pm2 logs backend

# Check system logs
journalctl -u ante-backend
```

#### Solutions

**Configure logging:**
```typescript
// winston configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

**Fix log rotation:**
```bash
# /etc/logrotate.d/ante
/app/logs/*.log {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 node node
  postrotate
    pm2 reloadLogs
  endscript
}
```

## Performance Optimization

### 15. Memory Leaks

#### Symptoms
- Memory usage constantly increasing
- Server crashes after running for days
- Performance degradation over time

#### Diagnosis
```bash
# Monitor memory
pm2 monit

# Use heap snapshots
node --inspect dist/main.js
# Navigate to chrome://inspect

# Check for event listener leaks
```

#### Solutions

**Fix common leaks:**
```typescript
// Clear timers
const timer = setInterval(...);
// Later:
clearInterval(timer);

// Remove event listeners
emitter.on('event', handler);
// Later:
emitter.off('event', handler);

// Close connections
finally {
  await prisma.$disconnect();
  await redisClient.quit();
}
```

## Emergency Procedures

### System Recovery

```bash
#!/bin/bash
# emergency-recovery.sh

# 1. Stop services
pm2 stop all

# 2. Backup current state
tar -czf emergency-backup-$(date +%Y%m%d-%H%M%S).tar.gz /app

# 3. Restore from last known good
git fetch origin
git reset --hard origin/main

# 4. Reinstall dependencies
rm -rf node_modules
yarn install --frozen-lockfile

# 5. Rebuild
yarn build

# 6. Restart services
pm2 restart all

# 7. Verify
curl http://localhost:3000/health
```

### Database Recovery

```bash
#!/bin/bash
# db-recovery.sh

# 1. Stop application
pm2 stop backend

# 2. Backup corrupted database
pg_dump ante_db > corrupted-$(date +%Y%m%d).sql

# 3. Restore from backup
psql -U postgres -c "DROP DATABASE IF EXISTS ante_db"
psql -U postgres -c "CREATE DATABASE ante_db"
psql -U postgres ante_db < last-good-backup.sql

# 4. Run migrations
npx prisma migrate deploy

# 5. Restart application
pm2 start backend
```

## Getting Help

### Collecting Diagnostic Information

When reporting issues, include:

```bash
# System information
uname -a
node --version
yarn --version
npx prisma --version

# Error logs
tail -n 100 logs/error.log

# Environment (sanitized)
printenv | grep -E "NODE_ENV|DATABASE" | sed 's/password=.*/password=***/'

# Recent commits
git log --oneline -10

# Dependencies
yarn list --depth=0
```

### Support Channels

1. **Internal Wiki**: Check documentation first
2. **Team Slack**: #backend-support channel  
3. **Issue Tracker**: Create detailed bug report
4. **Emergency**: Contact DevOps team

### Debug Mode

Enable debug mode for detailed output:

```bash
# Enable all debug output
DEBUG=* yarn dev

# Enable specific debug output
DEBUG=prisma:query yarn dev
DEBUG=express:* yarn dev
DEBUG=socket.io:* yarn dev
```

## Prevention Tips

1. **Always backup before major changes**
2. **Test in staging environment first**
3. **Monitor logs regularly**
4. **Keep dependencies updated**
5. **Document unusual fixes**
6. **Use health checks**
7. **Implement proper error handling**
8. **Set up alerts for critical errors**
9. **Regular database maintenance**
10. **Load test before deployment**