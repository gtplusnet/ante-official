import { Injectable } from '@nestjs/common';
import { RRule, Frequency } from 'rrule';

@Injectable()
export class RRuleService {
  /**
   * Convert form data to RRULE string (RFC 5545 standard)
   */
  buildRRule(data: {
    recurrenceType: string;
    frequency: number;
    byDay?: string[];
    byMonthDay?: number[];
    byMonth?: number[];
    count?: number;
    until?: string;
    dtstart: Date;
  }): string {
    const options: any = {
      freq: this.mapFrequency(data.recurrenceType),
      interval: data.frequency || 1,
      dtstart: data.dtstart,
    };

    // Add week days for weekly recurrence
    if (data.byDay?.length) {
      options.byweekday = data.byDay.map((d) => this.mapDay(d));
    }

    // Add month days for monthly recurrence
    if (data.byMonthDay?.length) {
      options.bymonthday = data.byMonthDay;
    }

    // Add months for yearly recurrence
    if (data.byMonth?.length) {
      options.bymonth = data.byMonth;
    }

    // Add end conditions
    if (data.count) options.count = data.count;
    if (data.until) options.until = new Date(data.until);

    const rule = new RRule(options);

    // Return just the RRULE part (without DTSTART line)
    const rruleString = rule.toString();
    const lines = rruleString.split('\n');
    return lines.find((line) => line.startsWith('RRULE:')) || rruleString;
  }

  /**
   * Expand RRULE to date instances within range
   */
  expandRRule(
    rrule: string,
    dtstart: Date,
    startDate: Date,
    endDate: Date,
    exdate: string[] = [],
  ): Date[] {
    try {
      // Construct full RRULE string with DTSTART
      const dtStartString = this.toISODateString(dtstart);
      const fullRRule = `DTSTART:${dtStartString}\n${rrule}`;

      const rule = RRule.fromString(fullRRule);
      const allDates = rule.between(startDate, endDate, true);

      // Filter out exception dates
      if (exdate.length > 0) {
        const exceptionSet = new Set(
          exdate.map((d) => new Date(d).toISOString().split('T')[0]),
        );

        return allDates.filter(
          (date) =>
            !exceptionSet.has(date.toISOString().split('T')[0]),
        );
      }

      return allDates;
    } catch (error) {
      console.error('Error expanding RRULE:', error);
      return [];
    }
  }

  /**
   * Convert RRULE to human-readable text
   */
  toText(rrule: string, dtstart: Date): string {
    try {
      const dtStartString = this.toISODateString(dtstart);
      const fullRRule = `DTSTART:${dtStartString}\n${rrule}`;
      const rule = RRule.fromString(fullRRule);
      return rule.toText();
    } catch (error) {
      console.error('Error converting RRULE to text:', error);
      return 'Invalid recurrence rule';
    }
  }

  /**
   * Parse RRULE back to UI fields (for editing)
   */
  parseRRule(rrule: string): any {
    try {
      const rule = RRule.fromString(rrule);
      const options = rule.origOptions;

      // Normalize byweekday to array
      let byDayArray: number[] = [];
      if (options.byweekday) {
        const weekdayArray = Array.isArray(options.byweekday)
          ? options.byweekday
          : [options.byweekday];

        byDayArray = weekdayArray.map((d) => {
          if (typeof d === 'number') return d;
          // Handle Weekday object
          if (typeof d === 'object' && 'weekday' in d) return d.weekday;
          // Handle string weekday names
          const dayMap: Record<string, number> = {
            'SU': 6, 'MO': 0, 'TU': 1, 'WE': 2, 'TH': 3, 'FR': 4, 'SA': 5
          };
          return dayMap[d.toString()] ?? 0;
        });
      }

      return {
        recurrenceType: this.unmapFrequency(options.freq),
        frequency: options.interval || 1,
        byDay: byDayArray.map((d) => this.unmapDay(d)),
        byMonthDay: options.bymonthday || [],
        byMonth: options.bymonth || [],
        count: options.count || null,
        until: options.until ? options.until.toISOString() : null,
      };
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return null;
    }
  }

  /**
   * Map frequency string to RRule constant
   */
  private mapFrequency(type: string): Frequency {
    const map: Record<string, Frequency> = {
      daily: RRule.DAILY,
      weekly: RRule.WEEKLY,
      monthly: RRule.MONTHLY,
      yearly: RRule.YEARLY,
    };
    return map[type.toLowerCase()] || RRule.DAILY;
  }

  /**
   * Unmap RRule frequency to string
   */
  private unmapFrequency(freq: Frequency): string {
    const map: Record<number, string> = {
      [RRule.DAILY]: 'daily',
      [RRule.WEEKLY]: 'weekly',
      [RRule.MONTHLY]: 'monthly',
      [RRule.YEARLY]: 'yearly',
    };
    return map[freq] || 'daily';
  }

  /**
   * Map day string (MO, TU, etc.) to RRule weekday constant
   */
  private mapDay(day: string): number {
    const map: Record<string, number> = {
      SU: RRule.SU.weekday,
      MO: RRule.MO.weekday,
      TU: RRule.TU.weekday,
      WE: RRule.WE.weekday,
      TH: RRule.TH.weekday,
      FR: RRule.FR.weekday,
      SA: RRule.SA.weekday,
    };
    return map[day.toUpperCase()] ?? RRule.MO.weekday;
  }

  /**
   * Unmap RRule weekday to day string
   */
  private unmapDay(weekday: number): string {
    const map: Record<number, string> = {
      [RRule.SU.weekday]: 'SU',
      [RRule.MO.weekday]: 'MO',
      [RRule.TU.weekday]: 'TU',
      [RRule.WE.weekday]: 'WE',
      [RRule.TH.weekday]: 'TH',
      [RRule.FR.weekday]: 'FR',
      [RRule.SA.weekday]: 'SA',
    };
    return map[weekday] || 'MO';
  }

  /**
   * Convert Date to ISO date string (YYYYMMDD format for RRULE)
   */
  private toISODateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
}
