/**
 * Timezone utilities for handling timestamps
 *
 * IMPORTANT: PostgreSQL/Supabase stores all timestamps in UTC.
 * The server's local timezone (GMT+8) doesn't affect storage.
 * We should always store UTC timestamps and convert for display only.
 */

/**
 * Get the current timestamp as ISO string (UTC)
 * This is the correct format for storing in PostgreSQL/Supabase
 * @param date - The date to convert (defaults to current date)
 * @returns ISO string in UTC
 */
export function toISOString(date: Date = new Date()): string {
  // Just return the standard ISO string (UTC)
  // PostgreSQL will store this correctly
  return date.toISOString();
}

/**
 * Get current timestamp as ISO string (UTC)
 * Convenience method for getting "now" for database storage
 * @returns Current timestamp as ISO string in UTC
 */
export function nowAsISO(): string {
  return new Date().toISOString();
}

/**
 * Convert a UTC date to local timezone for display
 * The browser will automatically use the user's local timezone
 * @param date - The UTC date from database
 * @returns Date object in local timezone
 */
export function toLocalDate(date: Date | string): Date {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
}

/**
 * Parse an ISO string from the database (UTC)
 * and convert to local timezone for display
 * @param isoString - ISO string from database (UTC)
 * @returns Date in local timezone
 */
export function fromUTCString(isoString: string): Date {
  // Parse the ISO string - browser will handle timezone conversion
  return new Date(isoString);
}

/**
 * Format a date for display in local timezone
 * @param date - Date to format (from database UTC)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in user's local timezone
 */
export function formatLocalDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Let the browser use the user's local timezone
  return dateObj.toLocaleString('en-PH', options);
}

/**
 * Format a date for display in a specific timezone (e.g., Asia/Manila)
 * Use this when you need to show time in a specific timezone regardless of user location
 * @param date - Date to format
 * @param timeZone - IANA timezone string (e.g., 'Asia/Manila')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in specified timezone
 */
export function formatInTimezone(
  date: Date | string,
  timeZone: string = 'Asia/Manila',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-PH', {
    timeZone,
    ...options
  });
}