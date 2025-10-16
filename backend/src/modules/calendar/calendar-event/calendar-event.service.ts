import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateEventDto,
  UpdateEventDto,
  QuickUpdateEventDto,
  GetEventsQueryDto,
} from './calendar-event.dto';
import { RRuleService } from './rrule.service';

@Injectable()
export class CalendarEventService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;
  @Inject() private readonly rruleService: RRuleService;

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
   * Supports both regular event IDs and recurring instance IDs (format: parentId_timestamp)
   */
  async getEventById(id: string) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if this is a recurring event instance ID (format: parentId_timestamp)
    let parentEventId = id;
    let instanceTimestamp: number | null = null;

    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        parentEventId = parts[0];
        instanceTimestamp = Number(parts[1]);
      }
    }

    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id: parentEventId,
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

    // If this is a recurring instance request, generate the specific instance
    if (instanceTimestamp !== null && event.recurrence?.rrule) {
      const instanceDate = new Date(instanceTimestamp);

      // Calculate event duration
      const duration =
        new Date(event.endDateTime).getTime() -
        new Date(event.startDateTime).getTime();

      const instanceEnd = new Date(instanceDate.getTime() + duration);

      // Return the instance with modified dates
      return {
        ...event,
        id, // Keep the composite ID
        startDateTime: instanceDate.toISOString(),
        endDateTime: instanceEnd.toISOString(),
        isRecurringInstance: true,
        parentEventId: event.id,
      };
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

    // Build RRULE if recurrence provided
    let rrule: string | null = null;
    if (data.recurrence) {
      rrule = this.rruleService.buildRRule({
        ...data.recurrence,
        dtstart: new Date(data.startDateTime),
      });
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
              rrule, // Source of truth
              // Helper fields for UI
              recurrenceType: data.recurrence.recurrenceType,
              frequency: data.recurrence.frequency,
              interval: data.recurrence.interval,
              byDay: data.recurrence.byDay || [],
              byMonthDay: data.recurrence.byMonthDay || [],
              byMonth: data.recurrence.byMonth || [],
              count: data.recurrence.count,
              until: data.recurrence.until ? new Date(data.recurrence.until) : null,
              exdate: data.recurrence.exdate || [],
              rdate: data.recurrence.rdate || [],
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
   * Note: Updating a recurring instance will update the parent event
   */
  async updateEvent(id: string, data: UpdateEventDto) {
    const companyId = this.utility.accountInformation.company?.id;

    // Extract parent event ID if this is a recurring instance
    let parentEventId = id;
    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        parentEventId = parts[0];
      }
    }

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id: parentEventId, companyId, isActive: true },
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

    // Update event (using parent event ID)
    const event = await this.prisma.calendarEvent.update({
      where: { id: parentEventId },
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
      // Delete existing attendees (using parent event ID)
      await this.prisma.calendarEventAttendee.deleteMany({
        where: { eventId: parentEventId },
      });

      // Create new attendees
      if (data.attendeeIds.length > 0) {
        await this.prisma.calendarEventAttendee.createMany({
          data: data.attendeeIds.map((accountId) => ({
            eventId: parentEventId,
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
   * Note: Updating a recurring instance will update the parent event
   */
  async quickUpdateEvent(id: string, data: QuickUpdateEventDto) {
    const companyId = this.utility.accountInformation.company?.id;

    // Extract parent event ID if this is a recurring instance
    let parentEventId = id;
    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        parentEventId = parts[0];
      }
    }

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id: parentEventId, companyId, isActive: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Validate dates
    if (new Date(data.startDateTime) >= new Date(data.endDateTime)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Update only start and end times (using parent event ID)
    const event = await this.prisma.calendarEvent.update({
      where: { id: parentEventId },
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
   * Note: Deleting a recurring instance will delete the parent event
   */
  async deleteEvent(id: string) {
    const companyId = this.utility.accountInformation.company?.id;

    // Extract parent event ID if this is a recurring instance
    let parentEventId = id;
    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        parentEventId = parts[0];
      }
    }

    // Check if event exists and belongs to company
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id: parentEventId, companyId, isActive: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Soft delete (using parent event ID)
    await this.prisma.calendarEvent.update({
      where: { id: parentEventId },
      data: { isActive: false },
    });

    return { success: true, message: 'Event deleted successfully' };
  }

  /**
   * Get expanded events (with recurring instances)
   */
  async getExpandedEvents(query: GetEventsQueryDto) {
    // Get all events in the date range
    const events = await this.getEvents(query);
    const expanded = [];

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    for (const event of events) {
      if (!event.recurrence?.rrule) {
        // Non-recurring event - add as is
        expanded.push(event);
      } else {
        // Recurring event - expand using rrule.js
        const instances = this.rruleService.expandRRule(
          event.recurrence.rrule,
          new Date(event.startDateTime),
          startDate,
          endDate,
          event.recurrence.exdate || [],
        );

        // Calculate event duration
        const duration =
          new Date(event.endDateTime).getTime() -
          new Date(event.startDateTime).getTime();

        // Create an instance object for each occurrence
        for (const instanceDate of instances) {
          const instanceEnd = new Date(instanceDate.getTime() + duration);

          expanded.push({
            ...event,
            id: `${event.id}_${instanceDate.getTime()}`, // Unique ID for each instance
            startDateTime: instanceDate.toISOString(),
            endDateTime: instanceEnd.toISOString(),
            isRecurringInstance: true,
            parentEventId: event.id,
          });
        }
      }
    }

    return expanded;
  }
}
