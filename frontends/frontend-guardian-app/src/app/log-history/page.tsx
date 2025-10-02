'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AttendanceLogDetailModal } from '@/components/features/AttendanceLogDetailModal';
import { AttendanceLog } from '@/types';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// attendanceApi removed - using Supabase
import { AttendanceLogDto } from '@/types/api.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

const ITEMS_PER_PAGE = 10;

export default function LogHistoryPage() {
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Fetch attendance logs
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch logs for the last 30 days (API limit is 100)
      // TODO: Replace with Supabase implementation
      const response = { logs: [] as AttendanceLogDto[] };
      
      // Convert API logs to our AttendanceLog format
      const convertedLogs: AttendanceLog[] = response.logs.map((log: AttendanceLogDto) => ({
        id: log.id,
        studentId: log.studentId,
        studentName: log.studentName,
        timestamp: new Date(log.timestamp),
        type: log.action === 'check_in' ? 'entry' : 'exit',
        location: log.location || 'Main Gate',
      }));
      
      setAllLogs(convertedLogs);
    } catch (err: any) {
      console.error('Failed to fetch attendance logs:', err);
      setError('Failed to load attendance logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all attendance logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on selected date
  useEffect(() => {
    if (filterDate && allLogs.length > 0) {
      const selectedDate = parseISO(filterDate);
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);
      
      const filtered = allLogs.filter(log => 
        isWithinInterval(log.timestamp, { start: dayStart, end: dayEnd })
      );
      
      setFilteredLogs(filtered);
      setCurrentPage(1);
    } else {
      setFilteredLogs(allLogs);
    }
  }, [filterDate, allLogs]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <AuthenticatedLayout 
      title="Log History"
    >
      <PullToRefresh onRefresh={fetchLogs} className="flex-1">
        <div className="p-4">
        {/* Filter Section */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="mm/dd/yyyy"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Logs Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Attendance Logs</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => {
                      setSelectedLogId(log.id);
                      setShowLogDetail(true);
                    }}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {log.studentName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${
                        log.type === 'entry' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.type === 'entry' ? 'Entered' : 'Left'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(log.timestamp, 'MMM d, yyyy h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No attendance logs found for the selected date.
              </div>
            )}
          </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2">...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>

      {/* Attendance Log Detail Modal */}
      <AttendanceLogDetailModal
        isOpen={showLogDetail}
        onClose={() => {
          setShowLogDetail(false);
          setSelectedLogId(null);
        }}
        logId={selectedLogId || ''}
      />
    </AuthenticatedLayout>
  );
}