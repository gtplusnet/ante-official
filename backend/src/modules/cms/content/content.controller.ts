import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ContentService,
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
} from './content.service';
// import { AuthGuard } from '@nestjs/passport';
import { ContentStatus } from '../common/interfaces/cms.interface';

@ApiTags('CMS - Content')
@Controller('cms/content')
// @UseGuards(AuthGuard('jwt'))
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // Single Type endpoints - for content types that have only one instance
  @Get('single/:contentType')
  @ApiOperation({
    summary: 'Get single type content (returns existing or creates default)',
  })
  @ApiParam({
    name: 'contentType',
    description: 'Single type content type name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single type content retrieved successfully',
  })
  async getSingleType(@Param('contentType') contentType: string) {
    const data = await this.contentService.getSingleTypeContent(contentType);
    return {
      statusCode: HttpStatus.OK,
      message: 'Single type content retrieved successfully',
      data,
    };
  }

  @Put('single/:contentType')
  @ApiOperation({ summary: 'Update single type content (upsert operation)' })
  @ApiParam({
    name: 'contentType',
    description: 'Single type content type name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single type content updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async updateSingleType(
    @Param('contentType') contentType: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    const data = await this.contentService.updateSingleTypeContent(
      contentType,
      updateContentDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Single type content updated successfully',
      data,
    };
  }

  @Post('single/:contentType/publish')
  @ApiOperation({ summary: 'Publish single type content' })
  @ApiParam({
    name: 'contentType',
    description: 'Single type content type name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single type content published successfully',
  })
  @HttpCode(HttpStatus.OK)
  async publishSingleType(@Param('contentType') contentType: string) {
    const data = await this.contentService.publishSingleType(contentType);
    return {
      statusCode: HttpStatus.OK,
      message: 'Single type content published successfully',
      data,
    };
  }

  @Post('single/:contentType/unpublish')
  @ApiOperation({ summary: 'Unpublish single type content (set to draft)' })
  @ApiParam({
    name: 'contentType',
    description: 'Single type content type name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single type content unpublished successfully',
  })
  @HttpCode(HttpStatus.OK)
  async unpublishSingleType(@Param('contentType') contentType: string) {
    const data = await this.contentService.unpublishSingleType(contentType);
    return {
      statusCode: HttpStatus.OK,
      message: 'Single type content unpublished successfully',
      data,
    };
  }

  @Post(':contentType')
  @ApiOperation({ summary: 'Create a new content entry' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async create(
    @Param('contentType') contentType: string,
    @Body() createContentDto: CreateContentDto,
  ) {
    const data = await this.contentService.create(
      contentType,
      createContentDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Content created successfully',
      data,
    };
  }

  @Get(':contentType')
  @ApiOperation({ summary: 'Get all content entries with advanced filtering' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entries retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ContentStatus })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'fields', required: false, type: String })
  @ApiQuery({ name: 'populate', required: false, type: String })
  async findAll(
    @Param('contentType') contentType: string,
    @Query() query: any,
  ) {
    // Parse query parameters
    const parsedQuery: QueryContentDto = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      search: query.search,
      status: query.status,
      locale: query.locale,
      sort: query.sort ? JSON.parse(query.sort) : undefined,
      fields: query.fields ? query.fields.split(',') : undefined,
      populate: query.populate ? query.populate.split(',') : undefined,
      filters: this.parseFilters(query),
      dateRange: this.parseDateRange(query),
    };

    const result = await this.contentService.findAll(contentType, parsedQuery);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entries retrieved successfully',
      ...result,
    };
  }

  @Get(':contentType/:id')
  @ApiOperation({ summary: 'Get a content entry by ID' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entry retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  async findOne(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.findOne(contentType, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entry retrieved successfully',
      data,
    };
  }

  @Put(':contentType/:id')
  @ApiOperation({ summary: 'Update a content entry' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entry updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async update(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    const data = await this.contentService.update(
      contentType,
      id,
      updateContentDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entry updated successfully',
      data,
    };
  }

  @Delete(':contentType/:id')
  @ApiOperation({ summary: 'Delete a content entry (soft delete)' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entry deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.remove(contentType, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entry deleted successfully',
      data,
    };
  }

  // Publishing workflows
  @Post(':contentType/:id/publish')
  @ApiOperation({ summary: 'Publish a content entry' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entry published successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.publish(contentType, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entry published successfully',
      data,
    };
  }

  @Post(':contentType/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish a content entry (set to draft)' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entry unpublished successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  @HttpCode(HttpStatus.OK)
  async unpublish(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.unpublish(contentType, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content entry unpublished successfully',
      data,
    };
  }

  @Post(':contentType/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a content entry' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID to duplicate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content entry duplicated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content entry not found',
  })
  async duplicate(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.duplicate(contentType, id);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Content entry duplicated successfully',
      data,
    };
  }

  // Version management
  @Get(':contentType/:id/versions')
  @ApiOperation({ summary: 'Get version history of a content entry' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiParam({ name: 'id', description: 'Content entry ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version history retrieved successfully',
  })
  async getVersions(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const data = await this.contentService.getVersions(contentType, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Version history retrieved successfully',
      data,
    };
  }

  // Bulk operations
  @Post(':contentType/bulk-delete')
  @ApiOperation({ summary: 'Bulk delete content entries' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk delete completed',
  })
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @Param('contentType') contentType: string,
    @Body() bulkDeleteDto: { ids: string[] },
  ) {
    const results = [];
    const errors = [];

    for (const id of bulkDeleteDto.ids) {
      try {
        const deleted = await this.contentService.remove(contentType, id);
        results.push({ id, success: true, data: deleted });
      } catch (error) {
        errors.push({ id, success: false, error: error.message });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Bulk delete completed: ${results.length} succeeded, ${errors.length} failed`,
      data: {
        succeeded: results,
        failed: errors,
      },
    };
  }

  @Post(':contentType/bulk-publish')
  @ApiOperation({ summary: 'Bulk publish content entries' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk publish completed',
  })
  @HttpCode(HttpStatus.OK)
  async bulkPublish(
    @Param('contentType') contentType: string,
    @Body() bulkPublishDto: { ids: string[] },
  ) {
    const results = [];
    const errors = [];

    for (const id of bulkPublishDto.ids) {
      try {
        const published = await this.contentService.publish(contentType, id);
        results.push({ id, success: true, data: published });
      } catch (error) {
        errors.push({ id, success: false, error: error.message });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Bulk publish completed: ${results.length} succeeded, ${errors.length} failed`,
      data: {
        succeeded: results,
        failed: errors,
      },
    };
  }

  @Post(':contentType/bulk-unpublish')
  @ApiOperation({ summary: 'Bulk unpublish content entries' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk unpublish completed',
  })
  @HttpCode(HttpStatus.OK)
  async bulkUnpublish(
    @Param('contentType') contentType: string,
    @Body() bulkUnpublishDto: { ids: string[] },
  ) {
    const results = [];
    const errors = [];

    for (const id of bulkUnpublishDto.ids) {
      try {
        const unpublished = await this.contentService.unpublish(
          contentType,
          id,
        );
        results.push({ id, success: true, data: unpublished });
      } catch (error) {
        errors.push({ id, success: false, error: error.message });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Bulk unpublish completed: ${results.length} succeeded, ${errors.length} failed`,
      data: {
        succeeded: results,
        failed: errors,
      },
    };
  }

  // Advanced querying
  @Post(':contentType/query')
  @ApiOperation({ summary: 'Advanced content querying with complex filters' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query executed successfully',
  })
  @HttpCode(HttpStatus.OK)
  async advancedQuery(
    @Param('contentType') contentType: string,
    @Body() queryDto: QueryContentDto,
  ) {
    const result = await this.contentService.findAll(contentType, queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Query executed successfully',
      ...result,
    };
  }

  @Get(':contentType/count')
  @ApiOperation({ summary: 'Get content entry count with optional filters' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Count retrieved successfully',
  })
  async getCount(
    @Param('contentType') contentType: string,
    @Query() query: any,
  ) {
    const parsedQuery: QueryContentDto = {
      status: query.status,
      locale: query.locale,
      filters: this.parseFilters(query),
      dateRange: this.parseDateRange(query),
    };

    const result = await this.contentService.findAll(contentType, {
      ...parsedQuery,
      pageSize: 1,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Count retrieved successfully',
      data: {
        total: result.meta.total,
        filters: parsedQuery,
      },
    };
  }

  // Import/Export functionality
  @Post(':contentType/import')
  @ApiOperation({ summary: 'Import content entries' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content entries imported successfully',
  })
  async importContent(
    @Param('contentType') contentType: string,
    @Body() importDto: { entries: CreateContentDto[] },
  ) {
    const results = [];
    const errors = [];

    for (const entry of importDto.entries) {
      try {
        const created = await this.contentService.create(contentType, entry);
        results.push(created);
      } catch (error) {
        errors.push({
          entry: entry,
          error: error.message,
        });
      }
    }

    return {
      statusCode:
        errors.length === 0 ? HttpStatus.CREATED : HttpStatus.PARTIAL_CONTENT,
      message:
        `${results.length} content entries imported successfully` +
        (errors.length > 0 ? `, ${errors.length} failed` : ''),
      data: {
        imported: results,
        errors: errors,
      },
    };
  }

  @Get(':contentType/export')
  @ApiOperation({ summary: 'Export content entries' })
  @ApiParam({ name: 'contentType', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content entries exported successfully',
  })
  async exportContent(
    @Param('contentType') contentType: string,
    @Query() query: any,
  ) {
    const parsedQuery: QueryContentDto = {
      page: 1,
      pageSize: 1000, // Large page size to export all
      status: query.status,
      locale: query.locale,
      filters: this.parseFilters(query),
      dateRange: this.parseDateRange(query),
    };

    const result = await this.contentService.findAll(contentType, parsedQuery);

    return {
      statusCode: HttpStatus.OK,
      message: 'Content entries exported successfully',
      data: result.data,
      meta: {
        exportedAt: new Date(),
        total: result.meta.total,
        contentType: contentType,
      },
    };
  }

  // Helper methods for parsing query parameters
  private parseFilters(query: any): Record<string, any> {
    const filters: Record<string, any> = {};

    Object.keys(query).forEach((key) => {
      if (key.startsWith('filter.')) {
        const filterKey = key.replace('filter.', '');
        const dataKey = filterKey.startsWith('data.')
          ? filterKey
          : `data.${filterKey}`;
        filters[dataKey] = query[key];
      }
    });

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private parseDateRange(query: any): any {
    if (!query.dateRangeField) return undefined;

    return {
      field: query.dateRangeField,
      from: query.dateRangeFrom ? new Date(query.dateRangeFrom) : undefined,
      to: query.dateRangeTo ? new Date(query.dateRangeTo) : undefined,
    };
  }
}
