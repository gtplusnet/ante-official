# TableHandlerService Documentation

## Overview
The TableHandlerService is a core service in the Ante application that standardizes table data handling across the backend. It works in conjunction with the frontend GTable component to provide consistent table functionality including filtering, sorting, searching, and pagination.

## Purpose
This service abstracts the complexity of building database queries for table operations, allowing controllers to focus on business logic rather than query construction. It provides a standardized interface for table operations across the entire application.

## Integration with Frontend
The TableHandlerService is designed to work seamlessly with the frontend GTable component. The service processes requests from GTable and returns data in a format that GTable can directly render.

## Usage Guidelines

### Basic Implementation in a Controller

```typescript
@Controller('your-endpoint')
export class YourController {
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private prisma: PrismaService;

  @Put('table')
  async getTableData(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
    // Initialize the table handler with query, body, and table reference key
    this.tableHandler.initialize(query, body, 'yourTableKey');
    
    // Construct the table query based on filters, search, and sort parameters
    const tableQuery = this.tableHandler.constructTableQuery();
    
    // Add any custom includes or relations needed
    tableQuery.include = {
      relatedEntity: true,
      // other relations as needed
    };
    
    // Get and return the table data
    return this.tableHandler.getTableData(this.prisma.yourModel, query, tableQuery);
  }
}
```

### Key Methods

#### `initialize(query: TableQueryDTO, body: TableBodyDTO, tableReferenceKey: string)`
Initializes the table handler with the request data and table configuration.

- **query**: Contains pagination, sorting, and other query parameters
- **body**: Contains filters, search terms, and table settings
- **tableReferenceKey**: The key to look up table configuration in the frontend's table.reference.ts

#### `constructTableQuery()`
Builds a Prisma query object based on the initialized data, handling:
- Pagination (skip/take)
- Sorting (orderBy)
- Filtering (where conditions)
- Searching (text search on specified columns)

#### `getTableData<T>(model, query, tableQuery): Promise<TableResponse<T>>`
Executes the query against the specified Prisma model and formats the response with:
- List of table data
- Pagination information
- Current page
- Total count

### Data Transfer Objects

#### TableQueryDTO
```typescript
export class TableQueryDTO {
    @IsNotEmpty()
    readonly page: number;         // Current page number

    @IsNotEmpty()
    readonly perPage: number;      // Items per page
    readonly search?: string;      // Search term
    readonly isLead?: boolean;     // Example of a specific filter
    readonly format?: string;      // Output format (e.g., for exports)
    readonly status?: string;      // Status filter
    // Additional query parameters as needed
}
```

#### TableBodyDTO
```typescript
export class TableBodyDTO {
    readonly filters: Array<Object>;    // Array of filter objects
    readonly settings: Object;          // Table settings from frontend
}
```

#### TableResponse
```typescript
export interface TableResponse<T> {
    list: T[];                // Array of data items
    pagination: number[];     // Pagination array (page numbers or dots)
    currentPage: number;      // Current page number
    totalCount: number;       // Total count of items (before pagination)
}
```

## Advanced Usage

### Custom Filtering
For complex filtering requirements, you can modify the query before passing it to getTableData:

```typescript
@Put('table')
async getCustomFilteredTable(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
  this.tableHandler.initialize(query, body, 'yourTableKey');
  const tableQuery = this.tableHandler.constructTableQuery();
  
  // Add custom filter logic
  if (body.customFilter) {
    tableQuery.where = {
      ...tableQuery.where,
      // Add custom where conditions
      customField: {
        in: body.customFilter.values
      }
    };
  }
  
  return this.tableHandler.getTableData(this.prisma.yourModel, query, tableQuery);
}
```

### Handling Relations
For tables with related data, include the necessary relations:

```typescript
tableQuery.include = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  },
  category: true,
  tags: true
};
```

### Custom Response Transformation
If you need to transform the data before returning it:

```typescript
@Put('table')
async getTransformedTable(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
  this.tableHandler.initialize(query, body, 'yourTableKey');
  const tableQuery = this.tableHandler.constructTableQuery();
  
  const result = await this.tableHandler.getTableData(this.prisma.yourModel, query, tableQuery);
  
  // Transform the data
  result.list = result.list.map(item => ({
    ...item,
    computedField: this.computeValue(item),
    formattedDate: this.formatDate(item.createdAt)
  }));
  
  return result;
}
```

## Best Practices

1. **Table Reference Consistency**: Ensure the table reference key used in `initialize()` matches a configuration in the frontend's table.reference.ts.

2. **Error Handling**: Implement proper error handling to gracefully handle database errors.

```typescript
try {
  return this.tableHandler.getTableData(this.prisma.yourModel, query, tableQuery);
} catch (error) {
  this.logger.error('Error fetching table data', error);
  throw new InternalServerErrorException('Failed to fetch table data');
}
```

3. **Performance Optimization**: For large tables, consider:
   - Adding database indexes for frequently filtered/sorted columns
   - Using `select` to limit returned fields
   - Implementing caching for frequently accessed tables

4. **Security**: Validate and sanitize all user inputs to prevent SQL injection and other security issues.

5. **Pagination Limits**: Set reasonable limits for `perPage` to prevent performance issues.

```typescript
if (query.perPage > 100) {
  query.perPage = 100; // Limit maximum items per page
}
```

## Troubleshooting

### Common Issues

1. **Incorrect Filtering**:
   - Verify filter keys in the frontend match the expected keys in the backend
   - Check that column names in table.reference.ts match your database schema

2. **Performance Issues**:
   - Add database indexes for frequently filtered/sorted columns
   - Limit the fields returned using `select`
   - Optimize related data loading with appropriate `include` statements

3. **Inconsistent Results**:
   - Ensure consistent sorting by adding secondary sort criteria
   - Verify that default values are set for all required query parameters

## Example Implementation

### Controller Example

```typescript
@Controller('projects')
export class ProjectsController {
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private prisma: PrismaService;
  @Inject() private logger: LoggerService;

  @Put('table')
  async getProjectsTable(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
    try {
      this.tableHandler.initialize(query, body, 'project');
      const tableQuery = this.tableHandler.constructTableQuery();
      
      // Add relations
      tableQuery.include = {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        projectBoardStage: true
      };
      
      // Add custom filters
      if (query.assignedToMe && query.currentUserId) {
        tableQuery.where = {
          ...tableQuery.where,
          assigneeId: query.currentUserId
        };
      }
      
      const result = await this.tableHandler.getTableData(this.prisma.project, query, tableQuery);
      
      // Add computed fields
      result.list = result.list.map(project => ({
        ...project,
        daysRemaining: this.calculateDaysRemaining(project.dueDate),
        isOverdue: this.isProjectOverdue(project)
      }));
      
      return result;
    } catch (error) {
      this.logger.error('Error fetching projects table', error);
      throw new InternalServerErrorException('Failed to fetch projects data');
    }
  }
  
  private calculateDaysRemaining(dueDate: Date): number {
    // Implementation
  }
  
  private isProjectOverdue(project): boolean {
    // Implementation
  }
}
```

## Maintenance and Updates

When updating the TableHandlerService, ensure backward compatibility or provide clear migration paths for existing implementations throughout the application. Document any changes to the API or behavior to ensure all teams are aware of the changes.
