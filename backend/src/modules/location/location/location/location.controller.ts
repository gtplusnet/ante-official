import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { CreateLocationDTO } from '@modules/location/location/location/location.interface';
import { UtilityService } from '@common/utility.service';
import { LocationService } from './location.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('location')
export class LocationController {
  @Inject() public utility: UtilityService;
  @Inject() public locationService: LocationService;

  @Get('table')
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.locationService.locationTable(query, body),
      response,
    );
  }

  @Get(':id')
  async getLocationById(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.locationService.getLocationById(id),
      response,
    );
  }

  @Post()
  async createLocation(
    @Res() response,
    @Body() locationDto: CreateLocationDTO,
  ) {
    this.utility.responseHandler(
      this.locationService.createLocation(locationDto),
      response,
    );
  }

  @Delete(':id')
  async deleteLocation(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.locationService.deleteLocation(id),
      response,
    );
  }
}
