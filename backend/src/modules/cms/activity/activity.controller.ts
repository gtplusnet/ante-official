import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('cms/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.activityService.create(createDto);
  }

  @Get()
  findAll() {
    return this.activityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Get('entity/:type/:id')
  getActivitiesByEntity(
    @Param('type') entityType: string,
    @Param('id') entityId: string,
  ) {
    return this.activityService.getActivitiesByEntity(entityType, entityId);
  }
}
