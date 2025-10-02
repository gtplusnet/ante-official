# GEER-ANTE ERP Development Workflows

This directory contains workflow guides for common development tasks in the GEER-ANTE ERP system.

## Available Workflows

### Development Workflows
- **API Development**: Creating new endpoints, services, and controllers
- **Frontend Development**: Adding new pages, components, and features
- **Database Changes**: Schema updates and migrations
- **Testing**: Writing and running tests

### Deployment Workflows
- **Staging Deployment**: Using Docker containers
- **Production Deployment**: Release process
- **Rollback Procedures**: Reverting deployments

## Quick Start Workflows

### 1. Adding a New API Endpoint

```bash
# 1. Create the module (if new)
cd backend
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module

# 2. Add endpoint in controller
# 3. Implement service logic
# 4. Create DTOs for validation
# 5. Add tests
# 6. Test with Postman
```

### 2. Adding a New Frontend Page

```bash
# 1. Create page component
cd frontend/src/pages
# Create YourPage.vue

# 2. Add route in router/routes.ts
# 3. Add navigation item if needed
# 4. Implement page logic
# 5. Test navigation
```

### 3. Database Schema Changes

```bash
# 1. Edit backend/prisma/schema.prisma
# 2. STOP - Ask user to run migration
# User runs: npx prisma migrate dev --name your_change
# 3. Continue after confirmation
```

## Common Development Tasks

### Backend Development Workflow

1. **Module Creation**
   - Use NestJS CLI for consistency
   - Follow module structure in `/backend/src/modules/`
   - Include: module, controller, service, dto, interface

2. **Service Implementation**
   - Inject PrismaService for database
   - Use UtilityService for common operations
   - Handle errors with proper exceptions

3. **API Testing**
   - Create Postman collection
   - Test all CRUD operations
   - Verify error handling

### Frontend Development Workflow

1. **Component Creation**
   - Use Vue 3 Composition API
   - Follow naming conventions (PascalCase)
   - Place in appropriate directory

2. **State Management**
   - Use Pinia stores (`/frontend/src/stores/`)
   - Keep stores focused and modular

3. **API Integration**
   - Use `$api` from Vue instance
   - Handle errors with `handleAxiosError`
   - Show loading states

### Testing Workflow

#### Backend Testing
```bash
# Run all tests
yarn test

# Run specific test file
yarn test path/to/file.spec.ts

# Run with coverage
yarn test:coverage

# Run E2E tests
yarn test:e2e
```

#### Frontend Testing
```bash
# Run Playwright tests
yarn test:e2e

# Run specific test
yarn playwright test tests/e2e/login.spec.ts

# Debug mode
yarn playwright test --debug
```

## Deployment Workflows

### Staging Deployment (Docker)

1. **Prepare Changes**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin your-branch
   ```

2. **Deploy to Staging**
   ```bash
   ./deploy-staging.sh
   ```

3. **Verify Deployment**
   - Check health endpoints
   - Test critical functionality
   - Monitor logs

### Production Deployment

1. **Merge to Main**
   ```bash
   git checkout main
   git merge your-branch
   git push origin main
   ```

2. **Create Release**
   - Tag version in GitHub
   - Document changes
   - Deploy automatically triggers

## API Development Workflow

### Creating a New Endpoint

1. **Define Route** in Controller
```typescript
@Post('your-endpoint')
async yourMethod(@Body() dto: YourDto) {
  return this.service.yourMethod(dto);
}
```

2. **Create DTO** for Validation
```typescript
export class YourDto {
  @IsString()
  @IsNotEmpty()
  field: string;
}
```

3. **Implement Service Logic**
```typescript
async yourMethod(data: YourDto) {
  // Business logic here
  return this.prisma.model.create({ data });
}
```

4. **Add Tests**
```typescript
describe('YourService', () => {
  it('should create record', async () => {
    // Test implementation
  });
});
```

## Git Workflow

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# 3. Commit regularly
git add .
git commit -m "feat: add your feature"

# 4. Push to remote
git push origin feature/your-feature

# 5. Create Pull Request
```

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

## Troubleshooting Workflows

### Build Issues
1. Check TypeScript errors: `yarn build`
2. Verify imports and aliases
3. Clear node_modules if needed
4. Check environment variables

### Database Issues
1. Check connection: `npx prisma db pull`
2. Verify migrations: `npx prisma migrate status`
3. Reset if needed: `npx prisma migrate reset` (CAUTION)

### Deployment Issues
1. Check Docker logs: `docker logs container-name`
2. Verify environment variables
3. Check nginx configuration
4. Monitor system resources

## Best Practices

1. **Always test locally** before pushing
2. **Write tests** for new features
3. **Document** complex logic
4. **Use meaningful** commit messages
5. **Keep PRs focused** and small
6. **Review** your own code first
7. **Update documentation** for changes

## Resources

- Backend Documentation: `/backend/CLAUDE.md`
- Frontend Documentation: `/frontend/CLAUDE.md`
- API Testing: `/backend/postman/`
- Standards: `/documentation/standards/`

---

*This documentation provides general workflows. For specific module workflows, refer to module-specific documentation.*