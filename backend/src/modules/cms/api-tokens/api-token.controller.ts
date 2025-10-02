import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTokenService,
  CreateApiTokenDto,
  UpdateApiTokenDto,
  QueryApiTokenDto,
} from './api-token.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
// import { AuthGuard } from '@shared/guards/auth.guard';

@ApiTags('API Tokens')
@Controller('cms/api-tokens')
// @UseGuards(AuthGuard)
export class ApiTokenController {
  constructor(private readonly apiTokenService: ApiTokenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API token' })
  @ApiResponse({ status: 201, description: 'API token created successfully' })
  async create(@Body() createApiTokenDto: CreateApiTokenDto) {
    const result = await this.apiTokenService.create(createApiTokenDto);

    // Return token info and raw token (only shown once)
    return {
      token: result.token,
      rawToken: result.rawToken,
      warning:
        'This is the only time the raw token will be shown. Store it securely.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all API tokens' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['read-only', 'full-access', 'custom'],
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() query: QueryApiTokenDto) {
    const result = await this.apiTokenService.findAll(query);
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API token usage statistics' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async getStats(@Query() query: any) {
    const dateRange =
      query.fromDate || query.toDate
        ? {
            ...(query.fromDate && { from: new Date(query.fromDate) }),
            ...(query.toDate && { to: new Date(query.toDate) }),
          }
        : undefined;

    const stats = await this.apiTokenService.getUsageStats(dateRange);
    return stats;
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current API token' })
  @ApiResponse({
    status: 200,
    description: 'Current API token retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No API token found' })
  async getCurrentToken() {
    const token = await this.apiTokenService.getCurrentToken();
    if (!token) {
      return { message: 'No API token found', data: null };
    }
    return { message: 'Current API token retrieved successfully', data: token };
  }

  @Get('current-tokens')
  @ApiOperation({
    summary: 'Get both current API tokens (read-only and full-access)',
  })
  @ApiResponse({
    status: 200,
    description: 'Current API tokens retrieved successfully',
  })
  async getCurrentTokens() {
    const tokens = await this.apiTokenService.getCurrentTokens();
    return {
      message: 'Current API tokens retrieved successfully',
      data: tokens,
    };
  }

  @Get('scopes')
  @ApiOperation({ summary: 'Get available token scopes' })
  @ApiResponse({
    status: 200,
    description: 'Available scopes retrieved successfully',
  })
  async getScopes() {
    // Return available scopes for API tokens
    const scopes = [
      { name: 'read', description: 'Read access to content' },
      { name: 'write', description: 'Write access to content' },
      { name: 'admin', description: 'Full administrative access' },
    ];
    return { message: 'Available scopes retrieved successfully', data: scopes };
  }

  @Get('documentation')
  @ApiOperation({ summary: 'Get API documentation' })
  @ApiResponse({
    status: 200,
    description: 'API documentation generated successfully',
  })
  async getDocumentation(@Query() query: any) {
    // Generate basic API documentation
    const documentation = {
      baseUrl: process.env.API_BASE_URL || 'https://backend-ante.geertest.com',
      endpoints: [
        {
          method: 'GET',
          path: '/api/public/{contentType}',
          description: 'List all entries for a content type',
          parameters: [],
          responses: [],
        },
        {
          method: 'GET',
          path: '/api/public/{contentType}/:id',
          description: 'Get single entry by ID',
          parameters: [],
          responses: [],
        },
        {
          method: 'POST',
          path: '/api/public/{contentType}',
          description: 'Create new entry',
          parameters: [],
          responses: [],
        },
      ],
    };
    return {
      message: 'API documentation generated successfully',
      data: documentation,
    };
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate API token' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Token regenerated successfully' })
  async regenerate(@Param('id') id: string) {
    const result = await this.apiTokenService.regenerate(id);

    return {
      token: result.token,
      rawToken: result.rawToken,
      warning:
        'This is the only time the new token will be shown. Store it securely.',
    };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new API token (alias for POST /)' })
  @ApiResponse({ status: 201, description: 'API token generated successfully' })
  async generate(@Body() createDto: any) {
    // This is an alias for the main create endpoint
    return this.create(createDto);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API token (alias for DELETE)' })
  @ApiResponse({ status: 200, description: 'API token revoked successfully' })
  async revoke(@Param('id') id: string) {
    // This is an alias for the delete endpoint
    return this.remove(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get API token usage (alias for stats)' })
  @ApiResponse({
    status: 200,
    description: 'Token usage retrieved successfully',
  })
  async getUsage(@Param('id') id: string, @Query() query: any) {
    // This is an alias for the stats endpoint
    return this.getStats(query);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test API token validity (alias for validate)' })
  @ApiResponse({ status: 200, description: 'Token validation completed' })
  async test(@Body() testDto: any) {
    // This is an alias for the validate endpoint
    return this.validate(testDto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an API token (for testing)' })
  async validate(@Body() body: { token: string }) {
    const token = await this.apiTokenService.validateToken(body.token);

    if (!token) {
      return { valid: false, message: 'Invalid or expired token' };
    }

    return {
      valid: true,
      token: {
        id: token._id,
        name: token.name,
        type: token.type,
        companyId: token.companyId,
        permissions: token.permissions,
        expiresAt: token.expiresAt,
      },
    };
  }

  // Basic CRUD routes with :id parameter - MUST be at the end to avoid route conflicts
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific API token' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const token = await this.apiTokenService.findOne(id);
    return token;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an API token' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() updateApiTokenDto: UpdateApiTokenDto,
  ) {
    const updated = await this.apiTokenService.update(id, updateApiTokenDto);
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API token' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const deleted = await this.apiTokenService.remove(id);
    return { message: 'API token deleted successfully', token: deleted };
  }
}
