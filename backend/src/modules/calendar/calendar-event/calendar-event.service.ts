import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateEventDto,
  UpdateEventDto,
  QuickUpdateEventDto,
  GetEventsQueryDto,
} from './calendar-event.dto';

@Injectable()
export class CalendarEventService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;

  /**
   * Get events within a date range
   */
  async getEvents(query: GetEventsQueryDto) {
    const companyId = this.utility.accountInformation.company?.id;
    const creatorId = this.utility.accountInformation.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    const { startDate, endDate, categoryIds, visibility } = query;

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        companyId,
        isActive: true,
        startDateTime: { gte: new Date(startDate) },
        endDateTime: { lte: new Date(endDate) },
        ...(categoryIds && categoryIds.length > 0 && { categoryId: { in: categoryIds } }),
        ...(visibility && { visibility }),
      },
      include: {
        category: true,
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
      orderBy: { startDateTime: 'asc' },
    });

    return events;
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string) {
    const companyId = this.utility.accountInformation.company?.id;

    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
      include: {
        category: true,
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /**
   * Create a new event
   */
  async createEvent(data: CreateEventDto) {
    const companyId = this.utility.accountInformation.company?.id;
    const creatorId = this.utility.accountInformation.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    // Validate dates
    if (new Date(data.startDateTime) >= new Date(data.endDateTime)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Create the event with relations
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        allDay: data.allDay,
        colorCode: data.colorCode,
        categoryId: data.categoryId,
        visibility: data.visibility,
        creatorId,
        companyId,
        isActive: true,
        // Create recurrence if provided
        ...(data.recurrence && {
          recurrence: {
            create: {
              recurrenceType: data.recurrence.recurrenceType,
              frequency: data.recurrence.frequency,
              interval: data.recurrence.interval,
              byDay: data.recurrence.byDay || [],
              byMonthDay: data.recurrence.byMonthDay || [],
              byMonth: data.recurrence.byMonth || [],
              count: data.recurrence.count,
              until: data.recurrence.until ? new Date(data.recurrence.until) : null,
              exceptions: data.recurrence.exceptions || [],
            },
          },
        }),
        // Create reminders if provided
        ...(data.reminders && data.reminders.length > 0 && {
          reminders: {
            createMany: {
              data: data.reminders.map((reminder) => ({
                method: reminder.method,
                minutes: reminder.minutes,
              })),
            },
          },
        }),
        // Create attendees if provided
        ...(data.attendeeIds && data.attendeeIds.length > 0 && {
          attendees: {
            createMany: {
              data: data.attendeeIds.map((accountId) => ({
                accountId,
                responseStatus: 'pending',
                isOrganizer: accountId === creatorId,
                isOptional: false,
              })),
            },
          },
        }),
      },
      include: {
        category: true,
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
    });

    return event;
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: UpdateEventDto) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Validate dates if both are provided
    if (data.startDateTime && data.endDateTime) {
      if (new Date(data.startDateTime) >= new Date(data.endDateTime)) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Update event
    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.startDateTime && { startDateTime: new Date(data.startDateTime) }),
        ...(data.endDateTime && { endDateTime: new Date(data.endDateTime) }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.colorCode && { colorCode: data.colorCode }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.visibility && { visibility: data.visibility }),
      },
      include: {
        category: true,
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
    });

    // Handle attendees update if provided
    if (data.attendeeIds) {
      // Delete existing attendees
      await this.prisma.calendarEventAttendee.deleteMany({
        where: { eventId: id },
      });

      // Create new attendees
      if (data.attendeeIds.length > 0) {
        await this.prisma.calendarEventAttendee.createMany({
          data: data.attendeeIds.map((accountId) => ({
            eventId: id,
            accountId,
            responseStatus: 'pending',
            isOrganizer: false,
            isOptional: false,
          })),
        });
      }
    }

    return event;
  }

  /**
   * Quick update for drag/drop and resize
   */
  async quickUpdateEvent(id: string, data: QuickUpdateEventDto) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Validate dates
    if (new Date(data.startDateTime) >= new Date(data.endDateTime)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Update only start and end times
    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
      },
      include: {
        category: true,
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
    });

    return event;
  }

  /**
   * Delete an event (soft delete)
   */
  async deleteEvent(id: string) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Soft delete
    await this.prisma.calendarEvent.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Event deleted successfully' };
  }
}
