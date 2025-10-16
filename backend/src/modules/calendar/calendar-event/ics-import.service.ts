import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { RRuleService } from './rrule.service';
const ICAL = require('ical.js');

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  events: any[];
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  categoryId?: number;
  defaultVisibility?: string;
}

@Injectable()
export class IcsImportService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;
  @Inject() private readonly rruleService: RRuleService;

  /**
   * Parse ICS file content and return structured data
   */
  parseIcsFile(fileContent: string): any[] {
    try {
      const jcalData = ICAL.parse(fileContent);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      return vevents.map(vevent => {
        const event = new ICAL.Event(vevent);

        // Extract basic properties
        const parsedEvent: any = {
          uid: event.uid || this.generateUid(),
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          location: event.location || null,
          startDateTime: event.startDate ? event.startDate.toJSDate() : new Date(),
          endDateTime: event.endDate ? event.endDate.toJSDate() : new Date(),
          allDay: !event.startDate?.isDate ? false : true,
          colorCode: this.extractColor(vevent),
        };

        // Extract organizer
        const organizer = vevent.getFirstProperty('organizer');
        if (organizer) {
          parsedEvent.organizer = {
            name: organizer.getParameter('cn') || null,
            email: organizer.getFirstValue()?.replace('mailto:', '') || null,
          };
        }

        // Extract attendees
        const attendees = vevent.getAllProperties('attendee');
        parsedEvent.attendees = attendees.map(attendee => ({
          name: attendee.getParameter('cn') || null,
          email: attendee.getFirstValue()?.replace('mailto:', '') || null,
          role: attendee.getParameter('role') || 'REQ-PARTICIPANT',
          status: attendee.getParameter('partstat') || 'NEEDS-ACTION',
          rsvp: attendee.getParameter('rsvp') === 'TRUE',
        }));

        // Extract recurrence rule
        const rruleProp = vevent.getFirstProperty('rrule');
        if (rruleProp) {
          try {
            const rruleValue = rruleProp.getFirstValue();
            parsedEvent.recurrence = this.parseRRule(rruleValue, event.startDate?.toJSDate());
          } catch (err) {
            console.error('Error parsing RRULE:', err);
          }
        }

        // Extract exception dates (EXDATE)
        const exdates = vevent.getAllProperties('exdate');
        if (exdates.length > 0) {
          parsedEvent.exceptionDates = exdates.map(exdate => {
            const time = exdate.getFirstValue();
            return time ? new ICAL.Time(time).toJSDate().toISOString() : null;
          }).filter(Boolean);
        }

        // Extract categories
        const categories = vevent.getFirstProperty('categories');
        if (categories) {
          const cats = categories.getFirstValue();
          parsedEvent.categories = Array.isArray(cats) ? cats : [cats];
        }

        // Extract alarms (reminders)
        const valarms = vevent.getAllSubcomponents('valarm');
        parsedEvent.reminders = valarms.map(valarm => {
          const trigger = valarm.getFirstProperty('trigger');
          if (trigger) {
            const triggerValue = trigger.getFirstValue();
            // Parse trigger duration (e.g., "-PT15M" = 15 minutes before)
            const minutes = this.parseTriggerToMinutes(triggerValue);
            return {
              method: valarm.getFirstPropertyValue('action') || 'popup',
              minutes: minutes,
            };
          }
          return null;
        }).filter(Boolean);

        return parsedEvent;
      });
    } catch (error) {
      console.error('Error parsing ICS file:', error);
      throw new BadRequestException('Invalid ICS file format');
    }
  }

  /**
   * Validate ICS file content
   */
  validateIcsFile(fileContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Try to parse the file
      const jcalData = ICAL.parse(fileContent);
      const comp = new ICAL.Component(jcalData);

      // Check if it's a valid VCALENDAR
      if (comp.name !== 'vcalendar') {
        errors.push('Invalid calendar format: Must be a VCALENDAR component');
      }

      // Check for VEVENT components
      const vevents = comp.getAllSubcomponents('vevent');
      if (vevents.length === 0) {
        errors.push('No events found in calendar file');
      }

      // Validate each event
      vevents.forEach((vevent, index) => {
        const event = new ICAL.Event(vevent);

        if (!event.startDate) {
          errors.push(`Event ${index + 1}: Missing start date`);
        }

        if (!event.summary) {
          errors.push(`Event ${index + 1}: Missing title/summary`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Parse error: ${error.message}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Import events from parsed ICS data
   */
  async importEvents(
    fileContent: string,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const companyId = this.utility.accountInformation.company?.id;
    const creatorId = this.utility.accountInformation.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      events: [],
    };

    try {
      // Parse the ICS file
      const parsedEvents = this.parseIcsFile(fileContent);

      // Import each event
      for (const parsedEvent of parsedEvents) {
        try {
          // Check for duplicates if enabled
          if (options.skipDuplicates) {
            const existing = await this.prisma.calendarEvent.findFirst({
              where: {
                companyId,
                title: parsedEvent.title,
                startDateTime: parsedEvent.startDateTime,
                isActive: true,
              },
            });

            if (existing) {
              result.skipped++;
              continue;
            }
          }

          // Build RRULE if recurrence exists
          let rrule: string | null = null;
          if (parsedEvent.recurrence) {
            try {
              rrule = this.rruleService.buildRRule({
                ...parsedEvent.recurrence,
                dtstart: parsedEvent.startDateTime,
              });
            } catch (err) {
              console.error('Error building RRULE:', err);
            }
          }

          // Create the event
          const event = await this.prisma.calendarEvent.create({
            data: {
              title: parsedEvent.title,
              description: parsedEvent.description,
              location: parsedEvent.location,
              startDateTime: parsedEvent.startDateTime,
              endDateTime: parsedEvent.endDateTime,
              allDay: parsedEvent.allDay,
              colorCode: parsedEvent.colorCode || '#2196F3',
              categoryId: options.categoryId || null,
              visibility: options.defaultVisibility || 'private',
              creatorId,
              companyId,
              isActive: true,
              // Create recurrence if provided
              ...(parsedEvent.recurrence && {
                recurrence: {
                  create: {
                    rrule,
                    recurrenceType: parsedEvent.recurrence.recurrenceType,
                    frequency: parsedEvent.recurrence.frequency,
                    interval: parsedEvent.recurrence.interval,
                    byDay: parsedEvent.recurrence.byDay || [],
                    byMonthDay: parsedEvent.recurrence.byMonthDay || [],
                    byMonth: parsedEvent.recurrence.byMonth || [],
                    count: parsedEvent.recurrence.count,
                    until: parsedEvent.recurrence.until ? new Date(parsedEvent.recurrence.until) : null,
                    exdate: parsedEvent.exceptionDates || [],
                    exceptions: parsedEvent.exceptionDates || [],
                  },
                },
              }),
              // Create reminders if provided
              ...(parsedEvent.reminders && parsedEvent.reminders.length > 0 && {
                reminders: {
                  createMany: {
                    data: parsedEvent.reminders.map((reminder: any) => ({
                      method: reminder.method,
                      minutes: reminder.minutes,
                    })),
                  },
                },
              }),
            },
            include: {
              category: true,
              recurrence: true,
              reminders: true,
            },
          });

          result.success++;
          result.events.push(event);
        } catch (error) {
          console.error('Error importing event:', error);
          result.failed++;
          result.errors.push(`Failed to import "${parsedEvent.title}": ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error in importEvents:', error);
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }

  /**
   * Parse RRULE from ical.js format to our database format
   * @private
   */
  private parseRRule(rruleValue: any, dtstart?: Date): any {
    const rruleConfig: any = {
      recurrenceType: 'custom',
      frequency: 1,
    };

    if (!rruleValue) return rruleConfig;

    // Map frequency
    const freq = rruleValue.freq;
    const freqMap: Record<string, string> = {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      YEARLY: 'yearly',
    };
    rruleConfig.recurrenceType = freqMap[freq] || 'custom';

    // Get interval
    if (rruleValue.interval) {
      rruleConfig.frequency = rruleValue.interval;
    }

    // Get BYDAY
    if (rruleValue.parts && rruleValue.parts.BYDAY) {
      rruleConfig.byDay = Array.isArray(rruleValue.parts.BYDAY)
        ? rruleValue.parts.BYDAY
        : [rruleValue.parts.BYDAY];
    }

    // Get BYMONTHDAY
    if (rruleValue.parts && rruleValue.parts.BYMONTHDAY) {
      rruleConfig.byMonthDay = Array.isArray(rruleValue.parts.BYMONTHDAY)
        ? rruleValue.parts.BYMONTHDAY
        : [rruleValue.parts.BYMONTHDAY];
    }

    // Get BYMONTH
    if (rruleValue.parts && rruleValue.parts.BYMONTH) {
      rruleConfig.byMonth = Array.isArray(rruleValue.parts.BYMONTH)
        ? rruleValue.parts.BYMONTH
        : [rruleValue.parts.BYMONTH];
    }

    // Get COUNT
    if (rruleValue.count) {
      rruleConfig.count = rruleValue.count;
    }

    // Get UNTIL
    if (rruleValue.until) {
      rruleConfig.until = rruleValue.until.toJSDate ? rruleValue.until.toJSDate() : rruleValue.until;
    }

    return rruleConfig;
  }

  /**
   * Extract color from VEVENT component
   * @private
   */
  private extractColor(vevent: any): string {
    // Try X-APPLE-CALENDAR-COLOR
    const appleColor = vevent.getFirstPropertyValue('x-apple-calendar-color');
    if (appleColor) return appleColor;

    // Try COLOR (non-standard but used by some clients)
    const color = vevent.getFirstPropertyValue('color');
    if (color) return color;

    // Default color
    return '#2196F3';
  }

  /**
   * Parse trigger duration to minutes
   * @private
   */
  private parseTriggerToMinutes(triggerValue: any): number {
    try {
      if (typeof triggerValue === 'string') {
        // Parse duration string like "-PT15M"
        const match = triggerValue.match(/-?PT(\d+)M/);
        if (match) {
          return parseInt(match[1], 10);
        }
      } else if (triggerValue.toSeconds) {
        // If it's a Duration object
        const seconds = Math.abs(triggerValue.toSeconds());
        return Math.floor(seconds / 60);
      }
    } catch (err) {
      console.error('Error parsing trigger:', err);
    }

    return 15; // Default to 15 minutes
  }

  /**
   * Generate a unique UID for events without one
   * @private
   */
  private generateUid(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}@ante.ph`;
  }
}
