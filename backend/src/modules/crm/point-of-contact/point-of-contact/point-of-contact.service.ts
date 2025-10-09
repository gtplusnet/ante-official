import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CRMActivityService } from '../../crm-activity/crm-activity/crm-activity.service';
import { CRMActivityType, CRMEntityType } from '@prisma/client';
import {
  CreatePointOfContactDto,
  UpdatePointOfContactDto,
  FilterPointOfContactDto,
  BulkCreatePointOfContactDto,
} from './point-of-contact.validator.dto';

@Injectable()
export class PointOfContactService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private crmActivityService: CRMActivityService;

  // Create single point of contact
  async create(data: CreatePointOfContactDto) {
    const createdById = this.utilityService.accountInformation.id;

    // Check if email already exists for this company
    const existingContact = await this.prisma.pointOfContact.findUnique({
      where: {
        email_companyId: {
          email: data.email,
          companyId: data.companyId,
        },
      },
    });

    if (existingContact) {
      throw new ConflictException(
        'A contact with this email already exists for this company',
      );
    }

    const contact = await this.prisma.pointOfContact.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        company: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.CREATE,
      entityType: CRMEntityType.POINT_OF_CONTACT,
      entityId: contact.id,
      entityName: contact.fullName,
      description: `Created new point of contact "${contact.fullName}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return contact;
  }

  // Get single point of contact
  async findOne(id: number) {
    const contact = await this.prisma.pointOfContact.findFirst({
      where: {
        id,
        company: {
          companyId: this.utilityService.companyId, // Filter by user's company
        },
      },
      include: {
        company: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Point of contact not found');
    }

    return contact;
  }

  // Get list of point of contacts with filtering
  async getPointOfContactsList(query: FilterPointOfContactDto) {
    const where: any = {
      isActive: true, // Only show active (non-archived) contacts by default
      company: {
        companyId: this.utilityService.companyId, // Filter by user's company
      },
    };

    // Handle company filter
    if (query?.companyId) {
      where.companyId = query.companyId;
    }

    // Handle search
    if (query?.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Option to show archived contacts
    if (query?.showArchived === true) {
      delete where.isActive;
    }

    // Handle sorting
    let orderBy: any = { createdAt: 'desc' }; // Default sort

    if (query?.sortBy) {
      switch (query.sortBy) {
        case 'Name (A-Z)':
          orderBy = { fullName: 'asc' };
          break;
        case 'Name (Z-A)':
          orderBy = { fullName: 'desc' };
          break;
        case 'Company':
          orderBy = { company: { name: 'asc' } };
          break;
        case 'Recent Activity':
          orderBy = { updatedAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    // Handle pagination
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      this.prisma.pointOfContact.findMany({
        where,
        include: {
          company: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.pointOfContact.count({ where }),
    ]);

    // Format for frontend table
    return {
      data: contacts.map((contact) => ({
        id: contact.id,
        fullName: contact.fullName,
        email: contact.email,
        company: contact.company.name,
        jobTitle: contact.jobTitle || 'N/A',
        phone: contact.phone || 'N/A',
        dateCreated: contact.createdAt.toISOString(),
        createdBy: `${contact.createdBy.firstName} ${contact.createdBy.lastName}`,
        isActive: contact.isActive,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update point of contact
  async update(id: number, data: UpdatePointOfContactDto) {
    const existingContact = await this.findOne(id);

    // If email or company is being updated, check for conflicts
    if (data.email || data.companyId) {
      const email = data.email || existingContact.email;
      const companyId = data.companyId || existingContact.companyId;

      const conflictingContact = await this.prisma.pointOfContact.findUnique({
        where: {
          email_companyId: {
            email,
            companyId,
          },
        },
      });

      if (conflictingContact && conflictingContact.id !== id) {
        throw new ConflictException(
          'A contact with this email already exists for this company',
        );
      }
    }

    const updatedContact = await this.prisma.pointOfContact.update({
      where: { id },
      data,
      include: {
        company: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.UPDATE,
      entityType: CRMEntityType.POINT_OF_CONTACT,
      entityId: updatedContact.id,
      entityName: updatedContact.fullName,
      description: `Updated point of contact "${updatedContact.fullName}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return updatedContact;
  }

  // Archive point of contact (soft delete)
  async archive(id: number) {
    const contact = await this.findOne(id); // Check if exists and user has access

    const archivedContact = await this.prisma.pointOfContact.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.DELETE,
      entityType: CRMEntityType.POINT_OF_CONTACT,
      entityId: contact.id,
      entityName: contact.fullName,
      description: `Archived point of contact "${contact.fullName}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return archivedContact;
  }

  // Create multiple point of contacts
  async createBulk(data: BulkCreatePointOfContactDto) {
    const _createdById = this.utilityService.accountInformation.id;
    const results = [];
    const errors = [];

    for (let i = 0; i < data.contacts.length; i++) {
      try {
        const contact = await this.create({
          ...data.contacts[i],
        });
        results.push(contact);
      } catch (error) {
        errors.push({
          index: i,
          contact: data.contacts[i],
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      errors: errors.length,
      data: results,
      errorDetails: errors,
    };
  }
}
