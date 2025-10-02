import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeveloperDatabaseService {
  constructor(private prisma: PrismaService) {}

  async getCompleteSchema(): Promise<any> {
    // Get the DMMF from Prisma
    const dmmf = Prisma.dmmf;

    return {
      models: dmmf.datamodel.models.map((model) => ({
        name: model.name,
        dbName: model.dbName || model.name,
        fields: model.fields.map((field) => ({
          name: field.name,
          type: field.type,
          kind: field.kind,
          isList: field.isList,
          isRequired: field.isRequired,
          isUnique: field.isUnique,
          isId: field.isId,
          isReadOnly: field.isReadOnly,
          hasDefaultValue: field.hasDefaultValue,
          default: field.default,
          relationName: field.relationName,
          relationFromFields: field.relationFromFields,
          relationToFields: field.relationToFields,
        })),
        primaryKey: model.primaryKey,
        uniqueFields: model.uniqueFields,
        uniqueIndexes: model.uniqueIndexes,
      })),
      enums: dmmf.datamodel.enums,
    };
  }

  async getTables(): Promise<any> {
    // Get the DMMF from Prisma
    const dmmf = Prisma.dmmf;

    return dmmf.datamodel.models.map((model) => ({
      name: model.name,
      fieldsCount: model.fields.length,
      hasRelations: model.fields.some((field) => field.kind === 'object'),
    }));
  }

  async getTableDetails(tableName: string): Promise<any> {
    // Get the DMMF from Prisma
    const dmmf = Prisma.dmmf;

    const model = dmmf.datamodel.models.find(
      (m) => m.name.toLowerCase() === tableName.toLowerCase(),
    );

    if (!model) {
      return null;
    }

    // Get count of records
    let recordCount = 0;
    try {
      recordCount = (await this.prisma[model.name]?.count()) || 0;
    } catch (error) {
      // Table might not exist or be accessible
      console.error(`Failed to get count for ${model.name}:`, error);
    }

    return {
      name: model.name,
      dbName: model.dbName || model.name,
      recordCount,
      fields: model.fields.map((field) => ({
        name: field.name,
        type: field.type,
        kind: field.kind,
        isList: field.isList,
        isRequired: field.isRequired,
        isUnique: field.isUnique,
        isId: field.isId,
        isReadOnly: field.isReadOnly,
        hasDefaultValue: field.hasDefaultValue,
        default: field.default,
        relationName: field.relationName,
        relationFromFields: field.relationFromFields,
        relationToFields: field.relationToFields,
      })),
      primaryKey: model.primaryKey,
      uniqueFields: model.uniqueFields,
      uniqueIndexes: model.uniqueIndexes,
      relations: model.fields
        .filter((field) => field.kind === 'object')
        .map((field) => ({
          name: field.name,
          type: field.type,
          isList: field.isList,
          relationName: field.relationName,
          relationFromFields: field.relationFromFields,
          relationToFields: field.relationToFields,
        })),
    };
  }

  async getRelationships(): Promise<any> {
    // Get the DMMF from Prisma
    const dmmf = Prisma.dmmf;

    const relationships = [];

    dmmf.datamodel.models.forEach((model) => {
      model.fields
        .filter((field) => field.kind === 'object')
        .forEach((field) => {
          relationships.push({
            from: model.name,
            to: field.type,
            field: field.name,
            relationName: field.relationName,
            isList: field.isList,
            relationFromFields: field.relationFromFields,
            relationToFields: field.relationToFields,
          });
        });
    });

    return relationships;
  }

  async getTableData(
    tableName: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    filters?: any,
  ): Promise<any> {
    // Get the DMMF from Prisma
    const dmmf = Prisma.dmmf;

    const model = dmmf.datamodel.models.find(
      (m) => m.name.toLowerCase() === tableName.toLowerCase(),
    );

    if (!model) {
      throw new Error(`Table ${tableName} not found`);
    }

    // Build where clause from filters
    const where: any = {};
    let globalSearch: string | undefined;
    let relationshipSource: any;

    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
          // Handle global search separately
          if (key === '_global_search') {
            globalSearch = value as string;
            continue;
          }

          // Handle relationship source for one-to-many navigation
          if (key === '_relationship_source' && typeof value === 'object') {
            relationshipSource = value as {
              table: string;
              field: string;
              value: any;
            };
            continue;
          }

          // Check if value is an object with operator (advanced filter)
          if (
            typeof value === 'object' &&
            'operator' in value &&
            'value' in value
          ) {
            const field = model.fields.find((f) => f.name === key);
            if (field) {
              const filterObj = value as { operator: string; value: any };
              const filterValue = filterObj.value;
              const operator = filterObj.operator;

              // Convert value based on field type
              let convertedValue: any = filterValue;
              if (
                field.type === 'Int' ||
                field.type === 'Float' ||
                field.type === 'Decimal' ||
                field.type === 'BigInt'
              ) {
                convertedValue = Number(filterValue);
              } else if (field.type === 'Boolean') {
                convertedValue = filterValue === 'true' || filterValue === true;
              }

              // Apply operator
              if (operator === 'eq') {
                where[key] = convertedValue;
              } else if (operator === 'contains' && field.type === 'String') {
                where[key] = { contains: convertedValue, mode: 'insensitive' };
              } else if (operator === 'gt') {
                where[key] = { gt: convertedValue };
              } else if (operator === 'gte') {
                where[key] = { gte: convertedValue };
              } else if (operator === 'lt') {
                where[key] = { lt: convertedValue };
              } else if (operator === 'lte') {
                where[key] = { lte: convertedValue };
              } else {
                // Default to equals
                where[key] = convertedValue;
              }
            }
          } else {
            // Simple filter value
            const field = model.fields.find((f) => f.name === key);
            if (field) {
              if (field.type === 'String') {
                // Use contains for string fields
                where[key] = { contains: value as string, mode: 'insensitive' };
              } else if (
                field.type === 'Int' ||
                field.type === 'Float' ||
                field.type === 'Decimal' ||
                field.type === 'BigInt'
              ) {
                // Use equals for numeric fields
                where[key] = Number(value);
              } else if (field.type === 'Boolean') {
                // Convert to boolean
                where[key] = value === 'true' || value === true;
              } else if (field.type === 'DateTime') {
                // For DateTime, you might want to implement date range filtering
                where[key] = value;
              } else {
                // For other types, use direct equality
                where[key] = value;
              }
            }
          }
        }
      }
    }

    // Handle relationship source filtering
    if (relationshipSource) {
      // Find the field in this model that references the source table
      const sourceModel = dmmf.datamodel.models.find(
        (m) => m.name === relationshipSource.table,
      );
      if (sourceModel) {
        // Find the field that references the source table
        const relationField = model.fields.find(
          (field) =>
            field.kind === 'object' &&
            field.type === relationshipSource.table &&
            field.relationName,
        );

        if (
          relationField &&
          relationField.relationFromFields &&
          relationField.relationFromFields.length > 0
        ) {
          // This model has the foreign key
          const foreignKeyField = relationField.relationFromFields[0];
          where[foreignKeyField] = relationshipSource.value;
        }
      }
    }

    // Handle global search across all string fields
    if (globalSearch) {
      const stringFields = model.fields.filter(
        (f) => f.type === 'String' && f.kind === 'scalar',
      );
      if (stringFields.length > 0) {
        const orConditions = stringFields.map((field) => ({
          [field.name]: { contains: globalSearch, mode: 'insensitive' },
        }));

        // If there are existing where conditions, combine them with AND
        if (Object.keys(where).length > 0) {
          where.AND = [{ ...where }, { OR: orConditions }];
          // Remove the original conditions from where since they're now in AND
          Object.keys(where).forEach((key) => {
            if (key !== 'AND') delete where[key];
          });
        } else {
          where.OR = orConditions;
        }
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    }

    try {
      const totalCount = (await this.prisma[model.name]?.count({ where })) || 0;

      const data =
        (await this.prisma[model.name]?.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        })) || [];

      return {
        data,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error(`Error fetching data from ${model.name}:`, error);
      throw new Error(
        `Failed to fetch data from ${model.name}: ${error.message}`,
      );
    }
  }

  async getRelationshipCounts(
    tableName: string,
    rowId: string,
  ): Promise<Record<string, number>> {
    const dmmf = Prisma.dmmf;
    const model = dmmf.datamodel.models.find((m) => m.name === tableName);

    if (!model) {
      throw new Error(`Table ${tableName} not found`);
    }

    // First, get the actual row to check if it exists
    try {
      // Find the ID field and its type
      const idField =
        model.fields.find((f) => f.isId) ||
        model.fields.find((f) => f.name === 'id');
      const whereClause: any = {};

      if (idField) {
        // Convert rowId to the appropriate type based on the field type
        if (idField.type === 'Int' || idField.type === 'BigInt') {
          whereClause[idField.name] = parseInt(rowId, 10);
        } else if (idField.type === 'Float' || idField.type === 'Decimal') {
          whereClause[idField.name] = parseFloat(rowId);
        } else {
          whereClause[idField.name] = rowId;
        }
      } else {
        // Fallback to 'id' field with string value
        whereClause.id = rowId;
      }

      const row = await this.prisma[model.name]?.findUnique({
        where: whereClause,
      });

      if (!row) {
        throw new Error(`Row with id ${rowId} not found in ${tableName}`);
      }

      const counts: Record<string, number> = {};

      // Process each field
      for (const field of model.fields) {
        if (field.kind === 'object') {
          // This is a relationship field
          if (field.relationFromFields && field.relationFromFields.length > 0) {
            // This model has the foreign key (many-to-one or one-to-one)
            const foreignKeyField = field.relationFromFields[0];
            const foreignKeyValue = row[foreignKeyField];

            if (foreignKeyValue !== null && foreignKeyValue !== undefined) {
              // Check if the related record exists
              const relatedModel = dmmf.datamodel.models.find(
                (m) => m.name === field.type,
              );
              if (relatedModel) {
                const targetField = field.relationToFields?.[0] || 'id';
                const count = await this.prisma[field.type]?.count({
                  where: { [targetField]: foreignKeyValue },
                });
                counts[field.name] = count || 0;
              }
            } else {
              counts[field.name] = 0;
            }
          } else {
            // The other model has the foreign key (one-to-many)
            // Find the opposite relation field
            const relatedModel = dmmf.datamodel.models.find(
              (m) => m.name === field.type,
            );
            if (relatedModel && field.relationName) {
              // Find the field in the related model that points back to this model
              const oppositeField = relatedModel.fields.find(
                (f) =>
                  f.relationName === field.relationName &&
                  f.type === model.name,
              );

              if (
                oppositeField &&
                oppositeField.relationFromFields &&
                oppositeField.relationFromFields.length > 0
              ) {
                const foreignKeyField = oppositeField.relationFromFields[0];
                const targetField = oppositeField.relationToFields?.[0] || 'id';

                // Count related records
                const count = await this.prisma[field.type]?.count({
                  where: { [foreignKeyField]: row[targetField] },
                });
                counts[field.name] = count || 0;
              } else {
                // If it's a list, try to count with the relation
                if (field.isList) {
                  // For array relations, we need to use the actual relation
                  // This is a simplification - in reality, we'd need to handle this differently
                  counts[field.name] = 0; // Default to 0 for now
                } else {
                  counts[field.name] = 0;
                }
              }
            }
          }
        }
      }

      return counts;
    } catch (error) {
      console.error(
        `Error getting relationship counts for ${tableName}#${rowId}:`,
        error,
      );
      throw new Error(`Failed to get relationship counts: ${error.message}`);
    }
  }
}
