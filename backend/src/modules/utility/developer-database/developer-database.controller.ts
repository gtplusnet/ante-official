import { Controller, Get, Param, Res, Inject, Query } from '@nestjs/common';
import { DeveloperDatabaseService } from './developer-database.service';
import { UtilityService } from '@common/utility.service';

@Controller('developer-database')
export class DeveloperDatabaseController {
  @Inject() public developerDatabaseService: DeveloperDatabaseService;
  @Inject() public utility: UtilityService;

  @Get('schema')
  async getCompleteSchema(@Res() response) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database schema');
      }

      const schemaPromise = this.developerDatabaseService.getCompleteSchema();
      return this.utility.responseHandler(schemaPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve database schema',
      );
    }
  }

  @Get('tables')
  async getTables(@Res() response) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database schema');
      }
      const tablesPromise = this.developerDatabaseService.getTables();
      return this.utility.responseHandler(tablesPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve tables',
      );
    }
  }

  @Get('table/:tableName')
  async getTableDetails(
    @Param('tableName') tableName: string,
    @Res() response,
  ) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database schema');
      }
      const tableDetailsPromise =
        this.developerDatabaseService.getTableDetails(tableName);
      return this.utility.responseHandler(tableDetailsPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve table details',
      );
    }
  }

  @Get('relationships')
  async getRelationships(@Res() response) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database schema');
      }
      const relationshipsPromise =
        this.developerDatabaseService.getRelationships();
      return this.utility.responseHandler(relationshipsPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve relationships',
      );
    }
  }

  @Get('table-data/:tableName')
  async getTableData(
    @Res() response,
    @Param('tableName') tableName: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('filters') filters?: string,
  ) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database data');
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;
      const parsedFilters = filters ? JSON.parse(filters) : {};

      const dataPromise = this.developerDatabaseService.getTableData(
        tableName,
        pageNum,
        limitNum,
        sortBy,
        sortOrder,
        parsedFilters,
      );
      return this.utility.responseHandler(dataPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve table data',
      );
    }
  }

  @Get('table/:tableName/row/:rowId/relationship-counts')
  async getRelationshipCounts(
    @Res() response,
    @Param('tableName') tableName: string,
    @Param('rowId') rowId: string,
  ) {
    try {
      // Check if current user is a developer
      const currentAccount = this.utility.accountInformation;
      if (!currentAccount?.isDeveloper) {
        throw new Error('Only developer accounts can access database data');
      }

      const countsPromise = this.developerDatabaseService.getRelationshipCounts(
        tableName,
        rowId,
      );

      return this.utility.responseHandler(countsPromise, response);
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to retrieve relationship counts',
      );
    }
  }
}
