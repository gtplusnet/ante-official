# GTable Component Documentation

## Overview

The GTable component is a reusable table component that integrates with the backend TableHandlerService to provide a standardized way of displaying tabular data with sorting, filtering, and pagination capabilities across the Ante application.

## Connection with Backend

The GTable component communicates with the backend through the TableHandlerService, which processes table queries and returns formatted data responses. Table configuration (columns, filters, sorts, etc.) is defined in dedicated files within the `@/references/table` directory (not a single file). Each table in the application has its own configuration file, e.g., `account.table.reference.ts`, `userLevel.table.reference.ts`, etc. This modular approach allows for easier maintenance and scalability.

## Table Reference Files (Frontend)

Table reference configurations are located in `@/references/table/`. Each file exports a default object containing the configuration for a specific table. For example:

```typescript
// src/references/table/account.table.reference.ts
const account = {
  // ...table config...
};
export default account;
```

To use a table reference in your frontend code, import it directly from its file:

```typescript
import accountTable from '@/references/table/account.table.reference';
```

The `tableKey` prop you pass to GTable should match the key used in the backend and the table reference file.

## Usage Guidelines

### Basic Implementation

```vue
<template>
  <GTable apiUrl="/api/endpoint" tableKey="keyFromTableReference" :isRowActionEnabled="true" :isClickableRow="true" @row-click="handleRowClick">
    <template #actions>
      <q-btn label="Add New" color="primary" @click="addNew" />
    </template>

    <template #row-actions="{ data }">
      <q-btn icon="edit" flat round dense @click.stop="editItem(data)" />
      <q-btn icon="delete" flat round dense @click.stop="deleteItem(data)" />
    </template>

    <!-- Custom column slots if needed -->
    <template #custom-column="{ data }">
      <div class="custom-format">{{ data.customValue }}</div>
    </template>
  </GTable>
</template>
```

### Required Props

| Prop       | Type   | Description                                                                                 |
| ---------- | ------ | ------------------------------------------------------------------------------------------- |
| `apiUrl`   | String | The backend API endpoint to fetch table data                                                |
| `tableKey` | String | The key that corresponds to a table configuration in one of the files in @/references/table |

### Optional Props

| Prop                 | Type    | Default | Description                                       |
| -------------------- | ------- | ------- | ------------------------------------------------- |
| `noFilter`           | Boolean | false   | Disables the filter section if set to true        |
| `isRowActionEnabled` | Boolean | false   | Adds an Actions column if set to true             |
| `isClickableRow`     | Boolean | false   | Makes rows clickable if set to true               |
| `apiFilters`         | Array   | []      | Additional filters to be sent to the API          |
| `query`              | Object  | {}      | Additional query parameters to be sent to the API |

### Events

| Event       | Parameters | Description                                               |
| ----------- | ---------- | --------------------------------------------------------- |
| `row-click` | row data   | Emitted when a row is clicked (if isClickableRow is true) |

### Slots

| Slot          | Props    | Description                                                    |
| ------------- | -------- | -------------------------------------------------------------- |
| `actions`     | none     | Content to be displayed in the top-right corner of the table   |
| `row-actions` | { data } | Content for the Actions column (if isRowActionEnabled is true) |
| Custom slots  | { data } | Named slots matching column.slot values in table configuration |

## Backend Configuration

### Table Reference Configuration

Each table in the application should have a configuration file in `@/references/table/` (e.g., `account.table.reference.ts`, `userLevel.table.reference.ts`, etc.) with the following structure:

```typescript
const exampleTable = {
  defaultOrderBy: 'createdAt',
  defaultOrderType: 'desc',
  perPage: 10,
  columns: [
    // ...
  ],
  sort: [
    // ...
  ],
  filter: [
    // ...
  ],
  search: [
    // ...
  ],
};
export default exampleTable;
```

### Backend Controller Implementation

In your backend controller, implement a table endpoint like this:

```typescript
@Controller('your-endpoint')
export class YourController {
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private prisma: PrismaService;

  @Put('table')
  async getTableData(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'exampleTable');
    const tableQuery = this.tableHandler.constructTableQuery();

    // Add any custom includes or relations needed
    tableQuery.include = {
      category: true,
      // other relations as needed
    };

    return this.tableHandler.getTableData(this.prisma.yourModel, query, tableQuery);
  }
}
```

## Best Practices

1. **Consistent Naming**: Use the same key names in your frontend and backend for filters, sorts, and search fields.

2. **Nested Properties**: For accessing nested properties in your data, use dot notation in the column key (e.g., 'user.name').

3. **Custom Formatting**: Use slots for custom column formatting rather than trying to format data in the backend.

4. **Reusable Filters**: For common filters used across multiple tables, consider creating reusable filter components.

5. **Error Handling**: Implement proper error handling in both frontend and backend to gracefully handle API failures.

6. **Pagination Limits**: Set reasonable per-page limits to avoid performance issues with large datasets.

7. **Caching**: Consider implementing caching for frequently accessed table data to improve performance.

## Troubleshooting

### Common Issues

1. **Table Not Displaying Data**:

   - Verify the API endpoint is correct
   - Check that the `tableKey` exists in the appropriate file in `@/references/table`
   - Inspect network requests for errors

2. **Filters Not Working**:

   - Ensure filter keys in the frontend match the expected keys in the backend
   - Verify the filter column names match your database schema

3. **Sorting Issues**:

   - Check that the sort column exists in your database schema
   - Verify the sort key is properly defined in the relevant file in `@/references/table`

4. **Custom Slots Not Rendering**:
   - Confirm the slot name in your template matches the slot name in the column definition
   - Ensure you're passing the data correctly in the slot template

## Example Implementation

### Frontend Component

```vue
<template>
  <div>
    <h1>Users</h1>
    <GTable apiUrl="/api/users/table" tableKey="users" :isRowActionEnabled="true" :isClickableRow="true" @row-click="viewUserDetails">
      <template #actions>
        <q-btn label="Add User" color="primary" @click="addUser" />
      </template>

      <template #status="{ data }">
        <q-badge :color="getStatusColor(data.status)">
          {{ data.status }}
        </q-badge>
      </template>

      <template #row-actions="{ data }">
        <q-btn icon="edit" flat round dense @click.stop="editUser(data)" />
        <q-btn icon="delete" flat round dense @click.stop="deleteUser(data)" />
      </template>
    </GTable>
  </div>
</template>

<script>
export default {
  methods: {
    viewUserDetails(user) {
      this.$router.push(`/users/${user.id}`);
    },
    addUser() {
      this.$router.push('/users/new');
    },
    editUser(user) {
      this.$router.push(`/users/${user.id}/edit`);
    },
    deleteUser(user) {
      // Implement delete logic
    },
    getStatusColor(status) {
      const colors = {
        active: 'green',
        inactive: 'grey',
        suspended: 'red',
      };
      return colors[status] || 'grey';
    },
  },
};
</script>
```

### Backend Controller

```typescript
@Controller('users')
export class UsersController {
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private prisma: PrismaService;

  @Put('table')
  async getUsersTable(@Query() query: TableQueryDTO, @Body() body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'users');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery.include = {
      role: true,
      department: true,
    };

    return this.tableHandler.getTableData(this.prisma.user, query, tableQuery);
  }
}
```

## Maintenance and Updates

When updating the GTable component or TableHandlerService, ensure backward compatibility or provide clear migration paths for existing implementations throughout the application.
