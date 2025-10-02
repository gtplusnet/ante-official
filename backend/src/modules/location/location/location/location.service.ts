import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { Prisma, Location } from '@prisma/client';
import { CreateLocationDTO } from '@modules/location/location/location/location.interface';
import { LocationDataResponse } from '../../../../shared/response/location.response';
import { PrismaService } from '@common/prisma.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';

export class LocationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;

  async locationTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'location');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    tableQuery['where'] = {
      ...tableQuery['where'],
      isDeleted: false,
      companyId: this.utilityService.companyId,
    };

    if (query.search) {
      tableQuery['where'] = {
        ...tableQuery['where'],
        AND: [
          tableQuery['where'],
          {
            OR: [{ name: { contains: query.search, mode: 'insensitive' } }],
          },
        ],
      };
    }

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData<Location>(
      this.prisma.location,
      query,
      tableQuery,
    );

    const list = await Promise.all(
      baseList.map(async (location) => {
        const formattedLocation = await this.formatResponse(location);
        return formattedLocation;
      }),
    );
    return { list, pagination, currentPage };
  }

  async createLocation(
    createLocationDTO: CreateLocationDTO,
  ): Promise<LocationDataResponse> {
    const existingLocation = await this.prisma.location.findFirst({
      where: {
        name: createLocationDTO.name,
        companyId: this.utilityService.companyId,
      },
    });

    if (existingLocation) {
      throw new BadRequestException('Location name already exists.');
    }

    const createLocationData: Prisma.LocationCreateInput = {
      name: createLocationDTO.name,
      region: { connect: { id: createLocationDTO.regionId } },
      province: { connect: { id: createLocationDTO.provinceId } },
      municipality: { connect: { id: createLocationDTO.municipalityId } },
      barangay: { connect: { id: createLocationDTO.barangayId } },
      zipCode: createLocationDTO.zipCode.toString(),
      landmark: createLocationDTO.landmark,
      description: createLocationDTO.description,
      isDeleted: createLocationDTO.isDeleted ?? false,
      street: createLocationDTO.street,
      company: { connect: { id: this.utilityService.companyId } },
    };

    const createResponse = await this.prisma.location.create({
      data: createLocationData,
    });

    return this.formatResponse(createResponse);
  }

  async deleteLocation(id: string): Promise<LocationDataResponse> {
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!location || location.isDeleted) {
      throw new NotFoundException('Location not found or already deleted.');
    }
    const deletedLocation = await this.prisma.location.update({
      where: { id },
      data: { isDeleted: true },
    });

    return this.formatResponse(deletedLocation);
  }

  async getLocationById(id: string): Promise<LocationDataResponse> {
    const location: Location = await this.prisma.location.findFirst({
      where: {
        id,
        // Removed companyId filter to allow cross-company location references
        // This is needed for existing data compatibility
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }
    return this.formatResponse(location);
  }

  async formatResponse(data: Location): Promise<LocationDataResponse> {
    const region = await this.prisma.locationRegion.findUnique({
      where: { id: data.regionId },
    });

    const province = await this.prisma.locationProvince.findUnique({
      where: { id: data.provinceId },
    });

    const municipality = await this.prisma.locationMunicipality.findUnique({
      where: { id: data.municipalityId },
    });

    const barangay = await this.prisma.locationBarangay.findUnique({
      where: { id: data.barangayId },
    });

    const formattedResponse: LocationDataResponse = {
      id: data.id,
      name: data.name,
      region: region,
      province: province,
      municipality: municipality,
      barangay: barangay,
      zipCode: data.zipCode,
      landmark: data.landmark,
      description: data.description,
      street: data.street,
      isDeleted: data.isDeleted,
      createdAt: this.utilityService.formatDate(data.createdAt.toISOString()),
      updatedAt: this.utilityService.formatDate(data.updatedAt.toISOString()),
    };

    return formattedResponse;
  }
}
