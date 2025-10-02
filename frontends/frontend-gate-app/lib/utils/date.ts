import { format as dateFnsFormat } from 'date-fns';

/**
 * Formats a date/timestamp for display in the local timezone
 * Handles both Date objects and ISO strings
 */
export function formatLocalTime(timestamp: Date | string, formatString: string): string {
  // Ensure we have a proper Date object
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // For debugging
  if (typeof timestamp === 'string' && timestamp.includes('2025-07-11T11:06')) {
    console.log('Formatting timestamp:', {
      input: timestamp,
      date: date,
      localString: date.toString(),
      formatted: dateFnsFormat(date, formatString)
    });
  }
  
  // date-fns format will use the local timezone
  return dateFnsFormat(date, formatString);
}

/**
 * Get timezone offset in hours from UTC
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset() / -60;
}

/**
 * Debug function to log timezone information
 */
export function debugTimezone(timestamp: Date | string, label: string = 'Timestamp'): void {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  console.log(`${label} Debug:`, {
    original: timestamp,
    dateObject: date,
    iso: date.toISOString(),
    local: date.toString(),
    localTime: formatLocalTime(date, 'yyyy-MM-dd HH:mm:ss'),
    utcTime: formatLocalTime(date, 'yyyy-MM-dd HH:mm:ss') + ' UTC',
    timezoneOffset: getTimezoneOffset()
  });
}