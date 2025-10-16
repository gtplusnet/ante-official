import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';
import type { DateInput } from '@fullcalendar/core';

export interface ExportOptions {
  startDate?: DateInput;
  endDate?: DateInput;
  categoryIds?: number[];
}

/**
 * Composable for exporting calendar events to ICS format
 * Compatible with Google Calendar, Outlook, and other RFC 5545 compliant applications
 */
export function useCalendarExport() {
  const isExporting = ref(false);

  /**
   * Download a file from blob data
   * @private
   */
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Export a single event to ICS file
   * @param eventId - Event ID to export
   * @param filename - Optional filename (defaults to 'calendar-event.ics')
   */
  const exportEvent = async (eventId: string, filename?: string) => {
    try {
      isExporting.value = true;

      const response = await api.get(`/calendar/event/export/${eventId}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/calendar; charset=utf-8' });
      downloadFile(blob, filename || 'calendar-event.ics');

      Notify.create({
        type: 'positive',
        message: 'Event exported successfully',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error exporting event:', error);
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to export event',
        position: 'top',
      });
      throw error;
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * Export multiple events to ICS file
   * @param eventIds - Array of event IDs to export
   * @param filename - Optional filename (defaults to 'calendar-events.ics')
   */
  const exportEvents = async (eventIds: string[], filename?: string) => {
    try {
      isExporting.value = true;

      const response = await api.post(
        '/calendar/event/export/multiple',
        { eventIds },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/calendar; charset=utf-8' });
      downloadFile(blob, filename || 'calendar-events.ics');

      Notify.create({
        type: 'positive',
        message: `${eventIds.length} event(s) exported successfully`,
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error exporting events:', error);
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to export events',
        position: 'top',
      });
      throw error;
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * Export events within a date range to ICS file
   * @param options - Export options (startDate, endDate, categoryIds)
   * @param filename - Optional filename (defaults to 'calendar-export.ics')
   */
  const exportDateRange = async (options: ExportOptions, filename?: string) => {
    try {
      isExporting.value = true;

      const params = new URLSearchParams();

      if (options.startDate) {
        const startDate = typeof options.startDate === 'string'
          ? options.startDate
          : new Date(options.startDate).toISOString();
        params.append('startDate', startDate);
      }

      if (options.endDate) {
        const endDate = typeof options.endDate === 'string'
          ? options.endDate
          : new Date(options.endDate).toISOString();
        params.append('endDate', endDate);
      }

      if (options.categoryIds && options.categoryIds.length > 0) {
        params.append('categoryIds', options.categoryIds.join(','));
      }

      const response = await api.get(`/calendar/event/export/range?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/calendar; charset=utf-8' });
      downloadFile(blob, filename || 'calendar-export.ics');

      Notify.create({
        type: 'positive',
        message: 'Calendar exported successfully',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error exporting date range:', error);
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to export calendar',
        position: 'top',
      });
      throw error;
    } finally {
      isExporting.value = false;
    }
  };

  return {
    isExporting,
    exportEvent,
    exportEvents,
    exportDateRange,
  };
}
