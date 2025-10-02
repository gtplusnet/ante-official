---
description: Rules for creating controllers following best practices
globs: backend/**/*.controller.ts
alwaysApply: false
---
# Controller Creation Pattern

This pattern should be followed for all new backend controllers. It is based on the best practices observed in `role.controller.ts`.

---

## 1. Import Statements
Import all necessary decorators, DTOs, services, and utilities at the top of the file.

```typescript
import { Inject, Controller, Get, Patch, Post, Put, Delete, Body, Res, Query, UsePipes } from '@nestjs/common';
import { CreateFeatureDto, UpdateFeatureDto, QueryFeatureDto } from './dto';
import { FeatureService } from './feature.service';
import { UtilityService } from '@common/services/utility.service';
import { TableQueryDto, TableBodyDto } from '@common/dto/table.dto';
import { CustomValidationPipe } from '@common/pipes/custom-validation.pipe';
```

---

## 2. Controller Class Structure

- Use the `@Controller('route')` decorator to define the base route.
- Inject required services using `@Inject()` or constructor injection.

```typescript
@Controller('your-route')
export class YourController {
  @Inject() public yourService: YourService;
  @Inject() public utility: UtilityService;
  // ... other injections
}
```

---

## 3. Endpoint Methods

- Use appropriate HTTP method decorators (`@Get`, `@Post`, etc.).
- Use DTOs for request validation (place in `dto/` subfolder).
- Always use `this.utility.responseHandler` to handle responses.
- Add JSDoc-style comments above each method.
- Use custom pipes if needed.

### Example:

```typescript
/**
 * Get a list of items by group.
 * @param response Express response object
 * @param params Query parameters validated by YourCustomDTO
 * @returns List of items in the group
 */
@Get('by-group')
async getByGroup(@Res() response, @Query() params: YourCustomDTO) {
  return this.utility.responseHandler(this.yourService.getByGroup(params), response);
}

/**
 * Get a tree structure of items.
 * @param response Express response object
 * @returns Tree structure data
 */
@Get('tree')
async getTree(@Res() response) {
  return this.utility.responseHandler(this.yourService.getTree(), response);
}

/**
 * Get a single item or list based on query.
 * @param response Express response object
 * @param params Query parameters validated by YourGetDTO
 * @returns Item(s) data
 */
@Get()
async get(@Res() response, @Query() params: YourGetDTO) {
  return this.utility.responseHandler(this.yourService.get(params), response);
}

/**
 * Table endpoint for paginated data.
 * @param response Express response object
 * @param query Table query DTO
 * @param body Table body DTO
 * @returns Paginated table data
 */
@Put()
async table(@Res() response, @Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
  return this.utility.responseHandler(this.yourService.table(query, body), response);
}

/**
 * Create a new item. Uses a custom pipe for validation if needed.
 * @param response Express response object
 * @param params Body parameters validated by YourCreateDTO
 * @returns Created item data
 */
@UsePipes(YourCustomPipe)
@Post()
async add(@Res() response, @Body() params: YourCreateDTO) {
  // Example: calculate additional fields before passing to service
  const newLevel = await this.yourService.calculateLevel(params.parentId);
  const adjustedParams = { ...params, level: newLevel };
  return this.utility.responseHandler(this.yourService.add(adjustedParams), response);
}

/**
 * Update an existing item.
 * @param response Express response object
 * @param params Body parameters validated by YourUpdateDTO
 * @returns Updated item data
 */
@Patch()
async update(@Res() response, @Body() params: YourUpdateDTO) {
  return this.utility.responseHandler(this.yourService.update(params), response);
}

/**
 * Delete an item.
 * @param response Express response object
 * @param params Query parameters validated by YourDeleteDTO
 * @returns Deletion result
 */
@Delete()
async delete(@Res() response, @Query() params: YourDeleteDTO) {
  return this.utility.responseHandler(this.yourService.delete(params), response);
}

/**
 * Populate default data (example custom endpoint).
 * @param response Express response object
 * @returns Result of population
 */
@Post('populate-default')
async populateDefault(@Res() response) {
  return this.utility.responseHandler(this.yourService.populateDefault(), response);
}
```

---

## 4. Best Practices
- Use DTOs for all request validation.
- Use JSDoc comments for every endpoint.
- Always use `this.utilityService.responseHandler` for responses.
- Use dependency injection for all services/utilities.
- Use custom pipes for advanced validation if needed.
- Keep controller methods thin; business logic should be in the service layer.
- Use clear and consistent naming for methods and routes.

---

## 5. Example Controller Skeleton

```typescript
import { Inject, Controller, Get, Patch, Post, Put, Delete, Body, Res, Query, UsePipes } from '@nestjs/common';
import { CreateFeatureDto, UpdateFeatureDto, QueryFeatureDto } from './dto';
import { FeatureService } from './feature.service';
import { UtilityService } from '@common/services/utility.service';
import { TableQueryDto, TableBodyDto } from '@common/dto/table.dto';
import { CustomValidationPipe } from '@common/pipes/custom-validation.pipe';

@Controller('your-route')
export class YourController {
  @Inject() public yourService: YourService;
  @Inject() public utility: UtilityService;

  // ...endpoint methods as shown above
}
```
