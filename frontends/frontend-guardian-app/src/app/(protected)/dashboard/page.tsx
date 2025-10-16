"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { Card } from "@/components/ui/Card";
import { AttendanceLogItem } from "@/components/features/AttendanceLog";
import { AttendanceLogDetailModal } from "@/components/features/AttendanceLogDetailModal";
import { PushNotificationWidget } from "@/components/features/PushNotificationWidget";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { FiSun, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { guardianPublicApi, StudentAttendanceStatusDto, AttendanceLogDto } from "@/lib/api/guardian-public-api";
import { usePolling } from "@/hooks/usePolling";
import { format } from "date-fns";

// Transform API status to display format
interface StudentStatus {
  studentId: string;
  studentName: string;
  studentNumber: string;
  currentStatus: "in_school" | "out_of_school" | "no_attendance";
  photoUrl?: string;
  lastAction?: {
    type: "check-in" | "check-out";
    timestamp: string;
    location?: string;
  };
}

export default function DashboardPage() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [studentStatuses, setStudentStatuses] = useState<StudentStatus[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogDto[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { user, loading: authLoading } = useAuth();

  // Convert user to Guardian format for Navigation
  const guardianForNav = user
    ? {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        photoUrl: undefined,
      }
    : { id: "", name: "", email: "" };

  // Fetch student statuses from Public API
  const fetchStudentStatuses = useCallback(async () => {
    try {
      setStatusError(null);
      if (!user?.id) return;

      console.log("[Dashboard] Fetching attendance status from Public API");
      const apiStatuses = await guardianPublicApi.getAttendanceStatus();

      // Transform API response to internal format
      const transformedStatuses: StudentStatus[] = apiStatuses.map((apiStatus) => {
        let currentStatus: "in_school" | "out_of_school" | "no_attendance" = "no_attendance";
        let lastAction: StudentStatus["lastAction"];

        // Determine status based on last check-in/out
        if (apiStatus.status === "in-school") {
          currentStatus = "in_school";
        } else if (apiStatus.status === "out-of-school") {
          currentStatus = "out_of_school";
        }

        // Get last action from either lastCheckIn or lastCheckOut (whichever is more recent)
        if (apiStatus.lastCheckIn || apiStatus.lastCheckOut) {
          const lastCheckInTime = apiStatus.lastCheckIn ? new Date(apiStatus.lastCheckIn.timestamp).getTime() : 0;
          const lastCheckOutTime = apiStatus.lastCheckOut ? new Date(apiStatus.lastCheckOut.timestamp).getTime() : 0;

          if (lastCheckInTime > lastCheckOutTime && apiStatus.lastCheckIn) {
            lastAction = {
              type: "check-in",
              timestamp: apiStatus.lastCheckIn.timestamp,
              location: apiStatus.lastCheckIn.gate,
            };
          } else if (apiStatus.lastCheckOut) {
            lastAction = {
              type: "check-out",
              timestamp: apiStatus.lastCheckOut.timestamp,
              location: apiStatus.lastCheckOut.gate,
            };
          }
        }

        return {
          studentId: apiStatus.studentId,
          studentName: apiStatus.studentName,
          studentNumber: apiStatus.studentCode,
          currentStatus,
          photoUrl: apiStatus.photoUrl,
          lastAction,
        };
      });

      setStudentStatuses(transformedStatuses);
      setLastUpdated(new Date());
      console.log(`[Dashboard] Fetched ${transformedStatuses.length} student statuses`);
    } catch (error: any) {
      console.error("[Dashboard] Failed to fetch student statuses:", error);
      setStatusError(error.message || "Failed to load student status");
    } finally {
      setStatusLoading(false);
    }
  }, [user?.id]);

  // Fetch attendance logs from Public API
  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setLogsError(null);
      if (!user?.id) return;

      console.log("[Dashboard] Fetching attendance logs from Public API");
      const logs = await guardianPublicApi.getAttendanceLogs({
        limit: 50,
        days: 7,
      });

      setAttendanceLogs(logs);
      setLastUpdated(new Date());
      console.log(`[Dashboard] Fetched ${logs.length} attendance logs`);
    } catch (error: any) {
      console.error("[Dashboard] Failed to fetch attendance logs:", error);
      setLogsError(error.message || "Failed to load attendance logs");
    } finally {
      setLogsLoading(false);
    }
  }, [user?.id]);

  // Refresh all data
  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStudentStatuses(), fetchAttendanceLogs()]);
    setIsRefreshing(false);
  };

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && user) {
      fetchStudentStatuses();
      fetchAttendanceLogs();
    }
  }, [authLoading, user, fetchStudentStatuses, fetchAttendanceLogs]);

  // Setup polling for realtime updates (every 30 seconds)
  usePolling(
    async () => {
      console.log("[Dashboard] Polling for updates...");
      await Promise.all([fetchStudentStatuses(), fetchAttendanceLogs()]);
    },
    30000, // 30 seconds
    {
      enabled: !authLoading && !!user,
      runOnMount: false, // Don't run on mount (already fetched above)
      stopWhenHidden: true, // Stop polling when tab is hidden
    }
  );

  // Group logs by date
  const logsByDate = attendanceLogs.reduce((groups, log) => {
    const date = format(new Date(log.timestamp), "MMMM dd, yyyy");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, AttendanceLogDto[]>);

  // Helper function to get status display
  const getStatusDisplay = (status: StudentStatus["currentStatus"]) => {
    switch (status) {
      case "in_school":
        return "In School";
      case "out_of_school":
        return "Not in School";
      case "no_attendance":
        return "No Attendance";
      default:
        return "Unknown";
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <MobileLayout className="bg-gray-50">
      <Header title="Dashboard" onMenuClick={() => setIsNavOpen(true)} />

      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} guardian={guardianForNav} />

      <PullToRefresh onRefresh={refreshData} className="flex-1">
        <div className="px-4 py-4">
          {/* Greeting Section with Refresh */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiSun className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Good Day {user?.firstName || "Guardian"}</h2>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Push Notification Widget */}
          <PushNotificationWidget />

          {/* Attendance Tracker */}
          <Card className="mb-6" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
              <h3 className="text-lg font-semibold">Attendance Tracker</h3>
            </div>

            {statusLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="h-4 bg-gray-200 rounded w-32" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : statusError ? (
              <div className="text-center py-4">
                <FiAlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{statusError}</p>
                <button onClick={fetchStudentStatuses} className="mt-2 text-sm text-primary-600 hover:underline">
                  Try again
                </button>
              </div>
            ) : studentStatuses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No students connected to your account</p>
            ) : (
              <div className="space-y-3">
                {studentStatuses.map((student) => (
                  <div key={student.studentId} className="flex flex-col items-start justify-start">
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.studentName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {student.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{student.studentName}</p>
                        {student.lastAction && (
                          <p className="text-xs text-gray-500">
                            Last {student.lastAction.type === "check-in" ? "in" : "out"}: {format(new Date(student.lastAction.timestamp), "h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium pl-[3.2rem] ${student.currentStatus === "in_school" ? "text-green-600" : student.currentStatus === "out_of_school" ? "text-gray-500" : "text-amber-600"}`}>
                      {getStatusDisplay(student.currentStatus)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Attendance Logs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Attendance Logs</h3>
              <p className="text-xs text-gray-400">Updated: {format(lastUpdated, "h:mm:ss a")}</p>
            </div>

            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-5 bg-gray-200 rounded w-48" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logsError ? (
              <div className="text-center py-8">
                <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 mb-3">{logsError}</p>
                <button onClick={fetchAttendanceLogs} className="text-primary-600 hover:underline">
                  Try again
                </button>
              </div>
            ) : attendanceLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendance logs in the past week</p>
              </div>
            ) : (
              Object.entries(logsByDate).map(([date, logs]) => (
                <div key={date} className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 text-center">{date}</p>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => {
                          setSelectedLogId(log.id);
                          setShowLogDetail(true);
                        }}
                      >
                        <AttendanceLogItem
                          log={{
                            id: log.id,
                            studentId: log.studentId,
                            studentName: log.studentName,
                            timestamp: new Date(log.timestamp),
                            type: log.type === "check-in" ? "entry" : "exit",
                            date: format(new Date(log.timestamp), "MMMM dd, yyyy"),
                            photoUrl: log.photo,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
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
        logId={selectedLogId || ""}
      />
    </MobileLayout>
  );
}
