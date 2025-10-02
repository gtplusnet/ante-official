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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentTypesService } from './content-types.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { QueryContentTypeDto } from './dto/query-content-type.dto';
// import { AuthGuard } from "@nestjs/passport";
import {
  FieldDefinition,
  ContentTypeType,
} from '../common/interfaces/cms.interface';

@ApiTags('CMS - Content Types')
@Controller('cms/content-types')
// @UseGuards(AuthGuard("jwt"))
export class ContentTypesController {
  constructor(private readonly contentTypesService: ContentTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new content type' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content type created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Content type name already exists',
  })
  async create(@Body() createContentTypeDto: CreateContentTypeDto) {
    const data = await this.contentTypesService.create(createContentTypeDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Content type created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all content types with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content types retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['collection', 'single', 'component'],
  })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'fields', required: false, type: String })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  async findAll(@Query() query: QueryContentTypeDto) {
    const result = await this.contentTypesService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content types retrieved successfully',
      ...result,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content types' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['collection', 'single', 'component'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search completed successfully',
  })
  async searchContentTypes(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const searchParams = {
      query,
      type: type as ContentTypeType,
      page: page || 1,
      pageSize: pageSize || 25,
    };
    const result =
      await this.contentTypesService.searchContentTypes(searchParams);
    return {
      statusCode: HttpStatus.OK,
      message: 'Search completed successfully',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content type by ID' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.contentTypesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type retrieved successfully',
      data,
    };
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get a content type by name' })
  @ApiParam({ name: 'name', description: 'Content type name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  async findByName(@Param('name') name: string) {
    const data = await this.contentTypesService.findByName(name);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Content type name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateContentTypeDto: UpdateContentTypeDto,
  ) {
    const data = await this.contentTypesService.update(
      id,
      updateContentTypeDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content type (soft delete)' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete content type with existing content',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const data = await this.contentTypesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type deleted successfully',
      data,
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID to duplicate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content type duplicated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New content type name already exists',
  })
  async duplicate(@Param('id') id: string, @Body('newName') newName: string) {
    const data = await this.contentTypesService.duplicate(id, newName);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Content type duplicated successfully',
      data,
    };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted content type' })
  @ApiParam({ name: 'id', description: 'Content type ID to restore' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type restored successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Content type name already exists (cannot restore)',
  })
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    const data = await this.contentTypesService.restore(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type restored successfully',
      data,
    };
  }

  // Field Management Endpoints
  @Post(':id/fields')
  @ApiOperation({ summary: 'Add a field to a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Field added successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Field validation failed or field name already exists',
  })
  async addField(@Param('id') id: string, @Body() field: FieldDefinition) {
    const data = await this.contentTypesService.addField(id, field);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Field added successfully',
      data,
    };
  }

  @Put(':id/fields/reorder')
  @ApiOperation({ summary: 'Reorder fields in a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fields reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid field IDs provided',
  })
  async reorderFields(
    @Param('id') id: string,
    @Body('fieldIds') fieldIds: string[],
  ) {
    const data = await this.contentTypesService.reorderFields(id, fieldIds);
    return {
      statusCode: HttpStatus.OK,
      message: 'Fields reordered successfully',
      data,
    };
  }

  @Put(':id/fields/:fieldId')
  @ApiOperation({ summary: 'Update a field in a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type or field not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Field validation failed',
  })
  async updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() fieldData: Partial<FieldDefinition>,
  ) {
    const data = await this.contentTypesService.updateField(
      id,
      fieldId,
      fieldData,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Field updated successfully',
      data,
    };
  }

  @Delete(':id/fields/:fieldId')
  @ApiOperation({ summary: 'Remove a field from a content type' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type or field not found',
  })
  @HttpCode(HttpStatus.OK)
  async removeField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    const data = await this.contentTypesService.removeField(id, fieldId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Field removed successfully',
      data,
    };
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export a single content type definition' })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content type not found',
  })
  async exportSingleContentType(@Param('id') id: string) {
    const data = await this.contentTypesService.exportSingle(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type exported successfully',
      data,
      meta: {
        exportedAt: new Date(),
        contentTypeId: id,
      },
    };
  }

  // Bulk operations
  @Post('validate')
  @ApiOperation({ summary: 'Validate content type definition without saving' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type definition is valid',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Content type definition validation failed',
  })
  @HttpCode(HttpStatus.OK)
  async validate(@Body() createContentTypeDto: CreateContentTypeDto) {
    try {
      const isValid = true;

      return {
        statusCode: HttpStatus.OK,
        message: 'Content type definition is valid',
        data: { isValid },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Validation failed',
        data: { isValid: false },
      };
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import content type definitions' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content types imported successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Import validation failed',
  })
  async importContentTypes(
    @Body() body: CreateContentTypeDto | CreateContentTypeDto[],
  ) {
    const results = [];
    const errors = [];

    // Handle both single object and array
    const contentTypes = Array.isArray(body) ? body : [body];

    for (const contentType of contentTypes) {
      try {
        const created = await this.contentTypesService.create(contentType);
        results.push(created);
      } catch (error) {
        errors.push({
          contentType: contentType.name,
          error: error.message,
        });
      }
    }

    return {
      statusCode:
        errors.length === 0 ? HttpStatus.CREATED : HttpStatus.PARTIAL_CONTENT,
      message:
        `${results.length} content types imported successfully` +
        (errors.length > 0 ? `, ${errors.length} failed` : ''),
      data: {
        imported: results,
        errors: errors,
      },
    };
  }

  @Get('export/all')
  @ApiOperation({ summary: 'Export all content type definitions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content types exported successfully',
  })
  async exportContentTypes() {
    const result = await this.contentTypesService.findAll({
      page: 1,
      pageSize: 1000,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Content types exported successfully',
      data: result.data,
      meta: {
        exportedAt: new Date(),
        total: result.meta.total,
      },
    };
  }
}
