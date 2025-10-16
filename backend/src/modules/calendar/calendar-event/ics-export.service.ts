import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import ical, { ICalCalendar, ICalEventRepeatingFreq, ICalEventStatus, ICalAttendeeRole, ICalAttendeeStatus, ICalCalendarMethod, ICalAlarmType } from 'ical-generator';

@Injectable()
export class IcsExportService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;

  /**
   * Export a single event to ICS format
   */
  async exportEvent(eventId: string): Promise<string> {
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new NotFoundException('Company not found');
    }

    // Fetch event with all relations
    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        companyId,
        isActive: true,
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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

    // Create calendar
    const calendar = ical({
      name: `ANTE ERP - ${event.title}`,
      prodId: '//ANTE ERP//Calendar Events//EN',
      method: ICalCalendarMethod.PUBLISH,
      timezone: 'Asia/Manila', // Use your default timezone
    });

    // Add event to calendar
    this.addEventToCalendar(calendar, event);

    return calendar.toString();
  }

  /**
   * Export multiple events to ICS format
   */
  async exportEvents(eventIds: string[]): Promise<string> {
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new NotFoundException('Company not found');
    }

    // Fetch events with all relations
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        id: { in: eventIds },
        companyId,
        isActive: true,
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        recurrence: true,
        reminders: true,
        attachments: true,
      },
    });

    if (events.length === 0) {
      throw new NotFoundException('No events found');
    }

    // Create calendar
    const calendar = ical({
      name: 'ANTE ERP - Calendar Events',
      prodId: '//ANTE ERP//Calendar Events//EN',
      method: ICalCalendarMethod.PUBLISH,
      timezone: 'Asia/Manila',
    });

    // Add all events to calendar
    events.forEach(event => {
      this.addEventToCalendar(calendar, event);
    });

    return calendar.toString();
  }

  /**
   * Export events within a date range
   */
  async exportDateRange(
    startDate: Date,
    endDate: Date,
    categoryIds?: number[],
  ): Promise<string> {
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new NotFoundException('Company not found');
    }

    // Fetch events in date range
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        companyId,
        isActive: true,
        startDateTime: { gte: startDate },
        endDateTime: { lte: endDate },
        ...(categoryIds && categoryIds.length > 0 && {
          categoryId: { in: categoryIds },
        }),
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendees: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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

    if (events.length === 0) {
      throw new NotFoundException('No events found in date range');
    }

    // Create calendar
    const calendar = ical({
      name: 'ANTE ERP - Calendar Export',
      prodId: '//ANTE ERP//Calendar Events//EN',
      method: ICalCalendarMethod.PUBLISH,
      timezone: 'Asia/Manila',
    });

    // Add all events to calendar
    events.forEach(event => {
      this.addEventToCalendar(calendar, event);
    });

    return calendar.toString();
  }

  /**
   * Add a single event to the calendar
   * @private
   */
  private addEventToCalendar(calendar: ICalCalendar, event: any) {
    const icalEvent = calendar.createEvent({
      id: `${event.id}@ante.ph`,
      start: event.startDateTime,
      end: event.endDateTime,
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      status: ICalEventStatus.CONFIRMED,
      allDay: event.allDay,
      created: event.createdAt,
      lastModified: event.updatedAt,
    });

    // Add organizer (creator)
    if (event.creator) {
      icalEvent.organizer({
        name: `${event.creator.firstName} ${event.creator.lastName}`,
        email: event.creator.email || `${event.creator.id}@ante.ph`,
      });
    }

    // Add attendees
    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach((attendee: any) => {
        if (attendee.account) {
          icalEvent.createAttendee({
            name: `${attendee.account.firstName} ${attendee.account.lastName}`,
            email: attendee.account.email || `${attendee.account.id}@ante.ph`,
            role: attendee.isOrganizer ? ICalAttendeeRole.CHAIR : ICalAttendeeRole.REQ,
            status: this.mapAttendeeStatus(attendee.responseStatus),
            rsvp: !attendee.isOrganizer,
          });
        }
      });
    }

    // Add recurrence rule
    if (event.recurrence && event.recurrence.rrule) {
      try {
        // Parse and add RRULE
        const rrule = this.parseRRule(event.recurrence);
        icalEvent.repeating(rrule);

        // Add exception dates (EXDATE)
        if (event.recurrence.exdate && event.recurrence.exdate.length > 0) {
          event.recurrence.exdate.forEach((exdate: string) => {
            try {
              icalEvent.recurrenceId(new Date(exdate));
            } catch (err) {
              console.error('Error adding EXDATE:', err);
            }
          });
        }
      } catch (err) {
        console.error('Error parsing RRULE:', err);
      }
    }

    // Add reminders (alarms)
    if (event.reminders && event.reminders.length > 0) {
      event.reminders.forEach((reminder: any) => {
        icalEvent.createAlarm({
          type: reminder.method === 'email' ? ICalAlarmType.email : ICalAlarmType.display,
          trigger: reminder.minutes * 60, // Convert minutes to seconds
        });
      });
    }

    // Add category
    if (event.category) {
      icalEvent.categories([{ name: event.category.name }]);
    }

    // Add custom properties
    icalEvent.x('X-ANTE-EVENT-ID', event.id);
    icalEvent.x('X-ANTE-COMPANY-ID', event.companyId.toString());
    if (event.colorCode) {
      icalEvent.x('X-APPLE-CALENDAR-COLOR', event.colorCode);
    }
  }

  /**
   * Parse RRULE from database to ical-generator format
   * @private
   */
  private parseRRule(recurrence: any): any {
    const rruleConfig: any = {};

    // Map recurrence type to frequency
    const freqMap: Record<string, ICalEventRepeatingFreq> = {
      daily: ICalEventRepeatingFreq.DAILY,
      weekly: ICalEventRepeatingFreq.WEEKLY,
      monthly: ICalEventRepeatingFreq.MONTHLY,
      yearly: ICalEventRepeatingFreq.YEARLY,
    };

    rruleConfig.freq = freqMap[recurrence.recurrenceType] || ICalEventRepeatingFreq.DAILY;
    rruleConfig.interval = recurrence.frequency || 1;

    // Add BYDAY (for weekly recurrence)
    if (recurrence.byDay && recurrence.byDay.length > 0) {
      rruleConfig.byDay = recurrence.byDay;
    }

    // Add BYMONTHDAY (for monthly recurrence)
    if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
      rruleConfig.byMonthDay = recurrence.byMonthDay;
    }

    // Add BYMONTH (for yearly recurrence)
    if (recurrence.byMonth && recurrence.byMonth.length > 0) {
      rruleConfig.byMonth = recurrence.byMonth;
    }

    // Add COUNT or UNTIL
    if (recurrence.count) {
      rruleConfig.count = recurrence.count;
    } else if (recurrence.until) {
      rruleConfig.until = new Date(recurrence.until);
    }

    return rruleConfig;
  }

  /**
   * Map attendee response status to iCal format
   * @private
   */
  private mapAttendeeStatus(status: string): ICalAttendeeStatus {
    const statusMap: Record<string, ICalAttendeeStatus> = {
      accepted: ICalAttendeeStatus.ACCEPTED,
      declined: ICalAttendeeStatus.DECLINED,
      tentative: ICalAttendeeStatus.TENTATIVE,
      pending: ICalAttendeeStatus.NEEDSACTION,
    };

    return statusMap[status] || ICalAttendeeStatus.NEEDSACTION;
  }
}
