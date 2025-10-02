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
  WebhookService,
  CreateWebhookDto,
  UpdateWebhookDto,
  QueryWebhookDto,
} from './webhook.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
// import { AuthGuard } from '@shared/guards/auth.guard';

@ApiTags('Webhooks')
@Controller('cms/webhooks')
// @UseGuards(AuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async create(@Body() createWebhookDto: CreateWebhookDto) {
    const webhook = await this.webhookService.create(createWebhookDto);
    return webhook;
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'events', required: false, type: [String] })
  async findAll(@Query() query: QueryWebhookDto) {
    const result = await this.webhookService.findAll(query);
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  async getStats() {
    const stats = await this.webhookService.getStats();
    return stats;
  }

  @Get('events')
  @ApiOperation({ summary: 'Get available webhook events' })
  async getAvailableEvents() {
    return {
      events: [
        {
          name: 'entry.create',
          description: 'Triggered when a content entry is created',
        },
        {
          name: 'entry.update',
          description: 'Triggered when a content entry is updated',
        },
        {
          name: 'entry.delete',
          description: 'Triggered when a content entry is deleted',
        },
        {
          name: 'entry.publish',
          description: 'Triggered when a content entry is published',
        },
        {
          name: 'entry.unpublish',
          description: 'Triggered when a content entry is unpublished',
        },
        {
          name: 'content-type.create',
          description: 'Triggered when a content type is created',
        },
        {
          name: 'content-type.update',
          description: 'Triggered when a content type is updated',
        },
        {
          name: 'content-type.delete',
          description: 'Triggered when a content type is deleted',
        },
        {
          name: 'media.create',
          description: 'Triggered when media is uploaded',
        },
        {
          name: 'media.update',
          description: 'Triggered when media is updated',
        },
        {
          name: 'media.delete',
          description: 'Triggered when media is deleted',
        },
      ],
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific webhook' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const webhook = await this.webhookService.findOne(id);
    return webhook;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    const updated = await this.webhookService.update(id, updateWebhookDto);
    return updated;
  }

  /* @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const deleted = await this.webhookService.remove(id);
    return { message: 'Webhook deleted successfully', webhook: deleted };
  } */

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a webhook by sending a test payload' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Test webhook delivery result' })
  async testWebhook(@Param('id') id: string) {
    const delivery = await this.webhookService.testWebhook(id);

    return {
      message: 'Test webhook sent',
      delivery: {
        status: delivery.status,
        responseStatus: delivery.responseStatus,
        responseBody: delivery.responseBody,
        error: delivery.error,
        deliveredAt: delivery.deliveredAt,
      },
    };
  }

  @Post('validate-url')
  @ApiOperation({ summary: 'Validate a webhook URL' })
  async validateUrl(@Body() body: { url: string }) {
    try {
      const parsedUrl = new URL(body.url);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: 'Webhook URL must use HTTP or HTTPS protocol',
        };
      }

      // Additional validation could include checking if URL is reachable
      return {
        valid: true,
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }
}
