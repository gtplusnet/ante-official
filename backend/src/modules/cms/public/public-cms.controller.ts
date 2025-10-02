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
  UseInterceptors,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { ContentService } from '../content/content.service';
import { ContentTypesService } from '../content-types/content-types.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { PublicQueryDto, PublicContentStatus } from './dto/public-query.dto';
import {
  PublicContentResponseDto,
  PublicListResponseDto,
} from './dto/public-response.dto';
import { PublicResponseFormatterService } from './public-response-formatter.service';
import { ApiTrackingInterceptor } from '../interceptors/api-tracking.interceptor';

@ApiTags('Public CMS API')
@Controller('api/public/cms')
@UseGuards(ApiKeyGuard)
@UseInterceptors(ApiTrackingInterceptor)
@ApiSecurity('ApiKeyAuth')
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for authentication',
  required: true,
})
@UsePipes(new ValidationPipe({ transform: true }))
export class PublicCmsController {
  constructor(
    private readonly contentService: ContentService,
    private readonly contentTypesService: ContentTypesService,
    private readonly formatter: PublicResponseFormatterService,
  ) {}

  // Single Type Endpoints (must come before generic collection routes)

  @Get('single/:contentType')
  @ApiOperation({
    summary: 'Get single-type content',
    description:
      'Retrieve content for a single-type content type (e.g., homepage, settings)',
  })
  @ApiParam({
    name: 'contentType',
    description:
      'Name of the single-type content type (e.g., "homepage", "settings")',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single-type content retrieved successfully',
    type: PublicContentResponseDto,
  })
  async getSingleType(@Param('contentType') contentType: string) {
    const rawData = await this.contentService.getSingleTypeContent(contentType);
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedData = this.formatter.formatContentEntry(
      rawData,
      contentTypeDefinition.fields,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} content retrieved successfully`,
      data: formattedData,
    };
  }

  @Put('single/:contentType')
  @ApiOperation({
    summary: 'Update single-type content',
    description:
      'Update content for a single-type content type. Requires full-access API key.',
  })
  @ApiParam({
    name: 'contentType',
    description: 'Name of the single-type content type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Single-type content updated successfully',
    type: PublicContentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Read-only API key cannot update content',
  })
  async updateSingleType(
    @Param('contentType') contentType: string,
    @Body() updateDto: any,
  ) {
    const rawData = await this.contentService.updateSingleTypeContent(
      contentType,
      updateDto,
    );
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedData = this.formatter.formatContentEntry(
      rawData,
      contentTypeDefinition.fields,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} content updated successfully`,
      data: formattedData,
    };
  }

  // Collection Type Endpoints

  @Get(':contentType')
  @ApiOperation({
    summary: 'Get all entries for a content type',
    description:
      'Retrieve all entries for a collection-type content type with pagination and filtering',
  })
  @ApiParam({
    name: 'contentType',
    description: 'Name of the content type (e.g., "articles", "products")',
  })
  @ApiQuery({ type: PublicQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entries retrieved successfully',
    type: PublicListResponseDto,
  })
  async findAll(
    @Param('contentType') contentType: string,
    @Query() query: PublicQueryDto,
  ) {
    // Transform query to internal format matching QueryContentDto
    const internalQuery: any = {
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      search: query.search,
      status: query.status,
      sort: query.sort ? this.parseSortString(query.sort) : { createdAt: -1 },
      fields: undefined,
      filters: undefined,
      populate: undefined,
      dateRange: undefined,
    };

    const result = await this.contentService.findAll(
      contentType,
      internalQuery,
    );
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedResult = this.formatter.formatContentList(
      result.data,
      contentTypeDefinition.fields,
      result.meta,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} entries retrieved successfully`,
      ...formattedResult,
    };
  }

  @Get(':contentType/:id')
  @ApiOperation({
    summary: 'Get a single entry by ID',
    description: 'Retrieve a specific entry by its ID',
  })
  @ApiParam({ name: 'contentType', description: 'Name of the content type' })
  @ApiParam({ name: 'id', description: 'ID of the entry' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entry retrieved successfully',
    type: PublicContentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entry not found',
  })
  async findOne(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    const rawData = await this.contentService.findOne(contentType, id);
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedData = this.formatter.formatContentEntry(
      rawData,
      contentTypeDefinition.fields,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} entry retrieved successfully`,
      data: formattedData,
    };
  }

  @Post(':contentType')
  @ApiOperation({
    summary: 'Create a new entry',
    description:
      'Create a new entry for a collection-type content type. Requires full-access API key.',
  })
  @ApiParam({ name: 'contentType', description: 'Name of the content type' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entry created successfully',
    type: PublicContentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Read-only API key cannot create entries',
  })
  async create(
    @Param('contentType') contentType: string,
    @Body() createDto: any,
  ) {
    const rawData = await this.contentService.create(contentType, createDto);
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedData = this.formatter.formatContentEntry(
      rawData,
      contentTypeDefinition.fields,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: `${contentType} entry created successfully`,
      data: formattedData,
    };
  }

  @Put(':contentType/:id')
  @ApiOperation({
    summary: 'Update an entry',
    description: 'Update an existing entry. Requires full-access API key.',
  })
  @ApiParam({ name: 'contentType', description: 'Name of the content type' })
  @ApiParam({ name: 'id', description: 'ID of the entry' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entry updated successfully',
    type: PublicContentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entry not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Read-only API key cannot update entries',
  })
  async update(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const rawData = await this.contentService.update(
      contentType,
      id,
      updateDto,
    );
    const contentTypeDefinition =
      await this.contentTypesService.findByName(contentType);

    const formattedData = this.formatter.formatContentEntry(
      rawData,
      contentTypeDefinition.fields,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} entry updated successfully`,
      data: formattedData,
    };
  }

  @Delete(':contentType/:id')
  @ApiOperation({
    summary: 'Delete an entry',
    description: 'Delete an existing entry. Requires full-access API key.',
  })
  @ApiParam({ name: 'contentType', description: 'Name of the content type' })
  @ApiParam({ name: 'id', description: 'ID of the entry' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entry deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entry not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Read-only API key cannot delete entries',
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
  ) {
    await this.contentService.remove(contentType, id);

    return {
      statusCode: HttpStatus.OK,
      message: `${contentType} entry deleted successfully`,
    };
  }

  // Helper method to parse sort string
  private parseSortString(sortStr: string): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};

    if (sortStr.startsWith('-')) {
      sort[sortStr.substring(1)] = -1;
    } else {
      sort[sortStr] = 1;
    }

    return sort;
  }
}
