import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';

export interface ImportOptions {
  skipDuplicates?: boolean;
  categoryId?: number;
  defaultVisibility?: 'public' | 'private' | 'company';
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  events: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  eventCount: number;
  preview: any[];
}

/**
 * Composable for importing calendar events from ICS files
 * Compatible with Google Calendar, Outlook, and other RFC 5545 compliant applications
 */
export function useCalendarImport() {
  const isImporting = ref(false);
  const isValidating = ref(false);

  /**
   * Validate an ICS file before importing
   * @param file - ICS file to validate
   * @returns Validation result with event preview
   */
  const validateIcsFile = async (file: File): Promise<ValidationResult> => {
    try {
      isValidating.value = true;

      // Validate file type
      if (!file.name.endsWith('.ics')) {
        throw new Error('Invalid file type. Only .ics files are allowed');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Call validation endpoint
      const response = await api.post('/calendar/event/import/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error validating ICS file:', error);
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || error.message || 'Failed to validate calendar file',
        position: 'top',
      });
      throw error;
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * Import events from an ICS file
   * @param file - ICS file to import
   * @param options - Import options (skipDuplicates, categoryId, defaultVisibility)
   * @returns Import result with success/failure counts
   */
  const importIcsFile = async (file: File, options: ImportOptions = {}): Promise<ImportResult> => {
    try {
      isImporting.value = true;

      // Validate file type
      if (!file.name.endsWith('.ics')) {
        throw new Error('Invalid file type. Only .ics files are allowed');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', options.skipDuplicates ? 'true' : 'false');

      if (options.categoryId) {
        formData.append('categoryId', options.categoryId.toString());
      }

      if (options.defaultVisibility) {
        formData.append('defaultVisibility', options.defaultVisibility);
      }

      // Call import endpoint
      const response = await api.post('/calendar/event/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = response.data as ImportResult;

      // Show success notification
      const messages = [];
      if (result.success > 0) messages.push(`${result.success} imported`);
      if (result.skipped > 0) messages.push(`${result.skipped} skipped`);
      if (result.failed > 0) messages.push(`${result.failed} failed`);

      Notify.create({
        type: result.failed > 0 ? 'warning' : 'positive',
        message: `Import complete: ${messages.join(', ')}`,
        position: 'top',
        timeout: 3000,
      });

      return result;
    } catch (error: any) {
      console.error('Error importing ICS file:', error);
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || error.message || 'Failed to import calendar file',
        position: 'top',
      });
      throw error;
    } finally {
      isImporting.value = false;
    }
  };

  /**
   * Parse ICS file content (client-side preview)
   * @param file - ICS file to parse
   * @returns Array of parsed events
   */
  const parseIcsFile = async (file: File): Promise<any[]> => {
    try {
      const text = await file.text();

      // Import ical.js dynamically
      const ICAL = await import('ical.js');

      // Parse ICS file
      const jcalData = ICAL.parse(text);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      // Extract basic event information
      return vevents.map((vevent: any) => {
        const event = new ICAL.Event(vevent);
        return {
          title: event.summary || 'Untitled Event',
          startDate: event.startDate ? event.startDate.toJSDate() : null,
          endDate: event.endDate ? event.endDate.toJSDate() : null,
          description: event.description || null,
          location: event.location || null,
          allDay: event.startDate?.isDate || false,
        };
      });
    } catch (error) {
      console.error('Error parsing ICS file:', error);
      throw new Error('Failed to parse ICS file. Please check the file format.');
    }
  };

  return {
    isImporting,
    isValidating,
    validateIcsFile,
    importIcsFile,
    parseIcsFile,
  };
}
