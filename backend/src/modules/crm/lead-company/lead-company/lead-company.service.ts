import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CRMActivityService } from '../../crm-activity/crm-activity/crm-activity.service';
import { CRMActivityType, CRMEntityType } from '@prisma/client';
import {
  CreateLeadCompanyDto,
  UpdateLeadCompanyDto,
  LeadCompanyQueryDto,
} from './lead-company.dto';

@Injectable()
export class LeadCompanyService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private crmActivityService: CRMActivityService;

  // Create a new lead company
  async create(createLeadCompanyDto: CreateLeadCompanyDto) {
    const createdBy = createLeadCompanyDto.createdBy || 'System User';

    const leadCompany = await this.prisma.leadCompany.create({
      data: {
        name: createLeadCompanyDto.name,
        employees: createLeadCompanyDto.employees,
        deals: createLeadCompanyDto.deals,
        createdBy,
        companyId: this.utilityService.companyId,
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.CREATE,
      entityType: CRMEntityType.LEAD_COMPANY,
      entityId: leadCompany.id,
      entityName: leadCompany.name,
      description: `Created new company "${leadCompany.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return this.formatResponse(leadCompany);
  }

  // Get all lead companies with search and sorting
  async findAll(query: LeadCompanyQueryDto) {
    const where: any = {
      isActive: true,
      companyId: this.utilityService.companyId,
    };

    // Apply search filter
    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (query.sortBy) {
      const sortField =
        query.sortBy === 'dateCreated' ? 'dateCreated' : query.sortBy;
      orderBy[sortField] = query.sortOrder || 'desc';
    } else {
      orderBy.dateCreated = 'desc'; // Default sort by date created desc
    }

    const leadCompanies = await this.prisma.leadCompany.findMany({
      where,
      orderBy,
    });

    return leadCompanies.map((company) => this.formatResponse(company));
  }

  // Get single lead company by ID
  async findOne(id: number) {
    const leadCompany = await this.prisma.leadCompany.findFirst({
      where: {
        id,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (!leadCompany) {
      throw new NotFoundException(`Lead company with ID ${id} not found`);
    }

    return this.formatResponse(leadCompany);
  }

  // Update lead company
  async update(id: number, updateLeadCompanyDto: UpdateLeadCompanyDto) {
    const existingCompany = await this.prisma.leadCompany.findFirst({
      where: {
        id,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Lead company with ID ${id} not found`);
    }

    const updatedCompany = await this.prisma.leadCompany.update({
      where: { id },
      data: {
        ...updateLeadCompanyDto,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.UPDATE,
      entityType: CRMEntityType.LEAD_COMPANY,
      entityId: updatedCompany.id,
      entityName: updatedCompany.name,
      description: `Updated company "${updatedCompany.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return this.formatResponse(updatedCompany);
  }

  // Soft delete lead company
  async remove(id: number) {
    const existingCompany = await this.prisma.leadCompany.findFirst({
      where: {
        id,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Lead company with ID ${id} not found`);
    }

    await this.prisma.leadCompany.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.DELETE,
      entityType: CRMEntityType.LEAD_COMPANY,
      entityId: existingCompany.id,
      entityName: existingCompany.name,
      description: `Deleted company "${existingCompany.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return { message: 'Lead company successfully deleted' };
  }

  // Format response to match frontend expectations
  private formatResponse(leadCompany: any) {
    return {
      id: leadCompany.id,
      name: leadCompany.name,
      employees: leadCompany.employees,
      deals: leadCompany.deals,
      dateCreated: this.formatDate(leadCompany.dateCreated),
      createdBy: leadCompany.createdBy,
    };
  }

  // Format date to match frontend format (M/D/YYYY)
  private formatDate(date: Date): string {
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
}
