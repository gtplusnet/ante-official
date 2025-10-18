"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Scanner, ScannerHandle } from "@/app/(auth)/scan/components/Scanner";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { playSound, cleanupAudio, resetAudio } from "@/lib/utils/sound";
import { getAttendanceAPIService, AttendanceRecord, AttendanceStats } from "@/lib/services/attendance-api.service";
import { websocketService } from "@/lib/services/websocket.service";
import { getStorageManager, Student, Guardian } from "@/lib/utils/storage";
import { format } from "date-fns";
import { debugTimezone } from "@/lib/utils/date";
import { AlertCircle, CheckCircle, Wifi, WifiOff, Minimize } from "lucide-react";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import ScanDialog from "@/components/ui/ScanDialog";

export default function ScanPage() {
  const router = useRouter();
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    todayTotal: 0,
    pendingSync: 0,
    lastScanTime: null,
    checkIns: 0,
    checkOuts: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [scanStatus, setScanStatus] = useState<"success" | "error" | null>(null);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [gateName, setGateName] = useState<string>("Main Gate");
  const [isScannerActive, setIsScannerActive] = useState(true);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanDialogData, setScanDialogData] = useState<{
    personName: string;
    personType: "student" | "guardian";
    action: "check_in" | "check_out" | "in" | "out";
    timestamp: Date;
    profilePhotoUrl?: string;
    status: "success" | "error" | "processing";
    message?: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const scannerRef = useRef<ScannerHandle>(null);
  const attendanceService = useRef(getAttendanceAPIService());
  const wsUnsubscribeRef = useRef<(() => void) | null>(null);
  const initializationRef = useRef<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const storageManager = getStorageManager();
  // Note: Using WebSocket for realtime updates
  const isOnline = useNetworkStatus();

  // Navigation guard to stop camera when leaving the page
  useNavigationGuard(async () => {
    console.log("Navigation guard: Stopping scanner before navigation");
    setIsScannerActive(false);
    if (scannerRef.current) {
      await scannerRef.current.stopScanner();
    }
    cleanupAudio();
  });

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current || initializingRef.current) {
      console.log("🔒 [ScanPage] Already initialized or initializing, skipping...");
      return;
    }

    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    const init = async () => {
      if (!mounted) return;

      console.log("🚀 [ScanPage] Starting init function...");
      try {
        // Ensure database is initialized first
        const { ensureDatabase } = await import("@/lib/utils/ensure-db");
        await ensureDatabase();

        // Reset audio when component mounts
        resetAudio();
        await storageManager.init();
        await attendanceService.current.init();
        // Recent scans will be loaded from API and WebSocket updates

        // Load gate name
        const savedGateName = localStorage.getItem("gateName");
        if (savedGateName) {
          setGateName(savedGateName);
        }

        // Debug: Check database contents
        if (typeof window !== "undefined") {
          const counts = await storageManager.getRecordCounts();
          console.log("Database record counts:", counts);

          // Auto-sync if database is empty
          if (counts.students === 0 && counts.guardians === 0) {
            console.log("Database is empty, triggering automatic sync...");
            try {
              const syncResult = await storageManager.syncFromAPI();
              console.log("Auto-sync completed:", syncResult);
            } catch (error) {
              console.error("Auto-sync failed:", error);
            }
          }

          // Add global debug functions
          (window as any).debugDatabase = async () => {
            const { dbManager } = await import("@/lib/db/db-manager");
            const students = await dbManager.getAll("students", undefined, 5);
            const guardians = await dbManager.getAll("guardians", undefined, 5);
            console.log("Sample students:", students);
            console.log("Sample guardians:", guardians);
            return { students, guardians };
          };

          (window as any).testScan = async (qrCode: string) => {
            console.log("Testing scan for:", qrCode);
            const result = await storageManager.findByQrCode(qrCode);
            console.log("Result:", result);
            return result;
          };

          (window as any).checkIndexes = async () => {
            try {
              const { dbManager } = await import("@/lib/db/db-manager");
              const db = (dbManager as any).db;
              if (!db) {
                console.log("Database not initialized");
                return;
              }

              // Verify stores exist before accessing them
              const requiredStores = ["students", "guardians"];
              const missingStores = requiredStores.filter((store) => !db.objectStoreNames.contains(store));

              if (missingStores.length > 0) {
                console.error("Missing required stores:", missingStores);
                console.log("Available stores:", Array.from(db.objectStoreNames));
                return;
              }

              const tx = db.transaction(["students", "guardians"], "readonly");
              const studentStore = tx.objectStore("students");
              const guardianStore = tx.objectStore("guardians");

              console.log("Student indexes:", Array.from(studentStore.indexNames));
              console.log("Guardian indexes:", Array.from(guardianStore.indexNames));

              // Check if qrCode index exists
              if (studentStore.indexNames.contains("qrCode")) {
                const index = studentStore.index("qrCode");
                console.log("Student qrCode index properties:", {
                  name: index.name,
                  keyPath: index.keyPath,
                  unique: index.unique,
                });
              }
            } catch (error) {
              console.error("Error checking indexes:", error);
            }
          };

          // Add data sync function
          (window as any).forceDataSync = async () => {
            console.log("Forcing data sync from API...");
            try {
              const syncResult = await storageManager.syncFromAPI();
              console.log("Data sync completed:", syncResult);

              // Re-check database contents
              const newCounts = await storageManager.getRecordCounts();
              console.log("Updated database counts:", newCounts);
            } catch (error) {
              console.error("Data sync failed:", error);
            }
          };

          // Removed forceFullSync - using Supabase realtime instead

          console.log("Debug functions added:");
          console.log("- debugDatabase() - Check database contents");
          console.log('- testScan("student:uuid") - Test QR code lookup');
          console.log("- checkIndexes() - Check database indexes");
          console.log("- forceDataSync() - Sync students/guardians from API");

          // Test the scan handler directly
          (window as any).testScanHandler = (data: string) => {
            console.log("Testing scan handler with:", data);
            handleScan(data);
          };
        }

        setIsInitialized(true);
        console.log("✅ [ScanPage] Init function completed successfully");
        return true;
      } catch (error) {
        console.error("❌ [ScanPage] Failed to initialize:", error);
        return false;
      }
    };

    // Define setupRealtime function - returns true if successful
    const setupRealtime = async (): Promise<boolean> => {
      console.log("🔌 [ScanPage] Starting WebSocket realtime setup...");

      try {
        // Get companyId from localStorage
        const companyIdStr = localStorage.getItem("companyId");
        if (!companyIdStr) {
          console.error("❌ [ScanPage] No companyId found in localStorage");
          setRealtimeConnected(false);
          return false;
        }

        const companyId = parseInt(companyIdStr);
        console.log("🔌 [ScanPage] Connecting to WebSocket with companyId:", companyId);

        // Connect to WebSocket
        await websocketService.connect(companyId);

        // Subscribe to attendance updates
        console.log("🔌 [ScanPage] Subscribing to attendance updates...");
        const unsubscribe = websocketService.subscribeToAttendance((data) => {
          console.log("📺 [ScanPage] Received WebSocket attendance update:", data);

          // Convert to local AttendanceRecord format
          const newRecord: AttendanceRecord = {
            id: data.id,
            qrCode: data.qrCode,
            personId: data.personId,
            personType: data.personType,
            personName: data.personName,
            firstName: undefined,
            lastName: undefined,
            profilePhotoUrl: data.profilePhoto || undefined,
            action: data.action,
            timestamp: new Date(data.timestamp),
            deviceId: data.deviceId || undefined,
            location: undefined,
            companyId: data.companyId,
          };

          // Add to recent scans (avoid duplicates)
          setRecentScans((prev) => {
            // Check if this record already exists
            const exists = prev.some((scan) => scan.id === newRecord.id);
            if (exists) return prev;

            // Add new record at the beginning and keep max 100
            const updated = [newRecord, ...prev].slice(0, 100);
            return updated;
          });

          // Update stats
          setStats((prev) => ({
            ...prev,
            todayTotal: prev.todayTotal + 1,
            checkIns: newRecord.action === "check_in" ? prev.checkIns + 1 : prev.checkIns,
            checkOuts: newRecord.action === "check_out" ? prev.checkOuts + 1 : prev.checkOuts,
            lastScanTime: newRecord.timestamp instanceof Date ? newRecord.timestamp : new Date(newRecord.timestamp),
          }));

          // Play sound for new scans from other devices
          // Only play if this isn't the scan we just made
          if (newRecord.qrCode !== lastScanRef.current) {
            try {
              playSound(newRecord.action);
            } catch (error) {
              console.error("Failed to play sound:", error);
            }
          }
        });

        // Store unsubscribe function for cleanup
        wsUnsubscribeRef.current = unsubscribe;

        setRealtimeConnected(true);
        console.log("✅ [ScanPage] WebSocket subscription setup complete");

        // Load initial data from API
        try {
          const apiRecent = await attendanceService.current.getTodayAttendance(100);
          if (apiRecent && apiRecent.length > 0) {
            setRecentScans(apiRecent);
            console.log(`✅ [ScanPage] Loaded ${apiRecent.length} records from API`);
          } else {
            console.log("📋 [ScanPage] No attendance records found for today");
          }

          const apiStats = await attendanceService.current.getAttendanceStats();
          setStats(apiStats);
        } catch (error) {
          console.error("❌ [ScanPage] Failed to load initial API data:", error);
          // Try again after a delay
          setTimeout(() => loadRecentScans(), 2000);
        }

        return true; // Success
      } catch (error) {
        console.error("❌ [ScanPage] Failed to setup WebSocket:", error);
        setRealtimeConnected(false);
        return false; // Failed
      }
    };

    // Initialize and setup everything
    const initializeAll = async () => {
      if (!mounted) return;

      // Mark as initializing
      initializingRef.current = true;
      console.log("🎯 [ScanPage] Starting full initialization...");

      try {
        // First initialize the app
        const initSuccess = await init();

        // Don't check mounted here - it's causing premature exit
        // The component is still mounted, this is a React StrictMode issue

        if (!initSuccess) {
          console.error("❌ [ScanPage] Init failed, skipping realtime setup");
          return;
        }

        // Enable scanner
        setIsScannerActive(true);

        // Load initial recent scans
        console.log("📋 [ScanPage] Loading initial recent scans...");
        await loadRecentScans();

        // Then setup realtime
        console.log("🔌 [ScanPage] About to call setupRealtime...");
        const realtimeSuccess = await setupRealtime().catch((err) => {
          console.error("❌ [ScanPage] setupRealtime failed with error:", err);
          return false;
        });

        // Only set up periodic refresh if realtime is NOT connected
        // This prevents unnecessary polling when realtime is working
        if (!realtimeSuccess) {
          console.log("⚠️ [ScanPage] Realtime not available, enabling polling fallback...");
          refreshInterval = setInterval(() => {
            // Only poll if realtime is still not connected
            if (!realtimeConnected) {
              console.log("🔄 [ScanPage] Periodic refresh of recent scans (realtime not connected)...");
              loadRecentScans();
            }
          }, 5000);
        } else {
          console.log("✅ [ScanPage] Realtime connected, polling disabled");
        }

        // Mark as fully initialized
        initializationRef.current = true;
        initializingRef.current = false;
        console.log("🎉 [ScanPage] Full initialization complete!");
      } catch (error) {
        console.error("❌ [ScanPage] Error during initialization:", error);
        initializingRef.current = false;
      }
    };

    // Start initialization
    initializeAll();

    // Cleanup when component unmounts
    return () => {
      mounted = false;
      setIsScannerActive(false);
      cleanupAudio();

      // Clear refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }

      // Unsubscribe from WebSocket
      if (wsUnsubscribeRef.current) {
        console.log("🔌 [ScanPage] Unsubscribing from WebSocket...");
        wsUnsubscribeRef.current();
        wsUnsubscribeRef.current = null;
      }

      // Disconnect WebSocket
      websocketService.disconnect();
    };
  }, []);

  // Monitor realtime connection state and manage polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (!isInitialized) return;

    if (realtimeConnected) {
      console.log("🟢 [ScanPage] Realtime is connected, stopping any polling");
      // Clear any existing polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } else {
      console.log("🔴 [ScanPage] Realtime disconnected, starting polling fallback");
      // Start polling as fallback
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          console.log("🔄 [ScanPage] Polling for updates (realtime disconnected)...");
          loadRecentScans();
        }, 5000);
      }
    }

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [realtimeConnected, isInitialized]);

  // Realtime updates are handled by WebSocket subscription above

  const loadRecentScans = async () => {
    console.log("📊 [loadRecentScans] Loading recent scans from API...");
    try {
      // Try to load from API regardless of WebSocket connection status
      // This allows us to show recent scans even if WebSocket is not working
      try {
        const apiRecent = await attendanceService.current.getTodayAttendance(100);
        console.log(`📊 [loadRecentScans] Received ${apiRecent?.length || 0} records from API`);
        if (apiRecent && apiRecent.length > 0) {
          // Only update if different from current state (avoid unnecessary re-renders)
          setRecentScans((prev) => {
            // Check if the data has actually changed
            if (prev.length !== apiRecent.length || (prev.length > 0 && apiRecent.length > 0 && prev[0].id !== apiRecent[0].id)) {
              console.log(`📊 [ScanPage] Updated recent scans: ${apiRecent.length} records`);
              return apiRecent;
            }
            return prev;
          });

          // Get stats from API
          const apiStats = await attendanceService.current.getAttendanceStats();
          setStats(apiStats);
        } else {
          // No records from API
          console.log("No attendance records found for today");
          setRecentScans([]);
          setStats({
            todayTotal: 0,
            pendingSync: 0,
            lastScanTime: null,
            checkIns: 0,
            checkOuts: 0,
          });
        }
      } catch (error) {
        // Only log errors occasionally to avoid spam during periodic refresh
        if (Math.random() < 0.1) {
          // Log 10% of errors
          console.error("❌ [ScanPage] Failed to load from API:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load recent scans:", error);
    }
  };

  const handleScan = useCallback(async (data: string) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now();
    if (data === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
      console.log("Duplicate scan prevented:", data);
      return;
    }

    console.log("=== SCAN DEBUG START ===");
    console.log("Raw scan data:", data);
    console.log("Data type:", typeof data);
    console.log("Data length:", data.length);

    // Update refs
    lastScanRef.current = data;
    lastScanTimeRef.current = now;

    // Process scanned data
    const currentTime = new Date();
    setLastScanned(data);
    setScanTime(format(currentTime, "h:mm:ss a"));

    // Parse QR code format: "student:{uuid}" or "guardian:{uuid}"
    const [type, id] = data.split(":");
    let personData: Student | Guardian | null = null;

    try {
      // First check database contents
      const counts = await storageManager.getRecordCounts();
      console.log("Current database counts:", counts);
      console.log("Parsed QR code - Type:", type, "ID:", id);

      if (!["student", "guardian"].includes(type) || !id) {
        console.error("Invalid QR format - Type:", type, "ID:", id);
        setScanStatus("error");
        setScanMessage("Invalid QR code format");
        playSound("error");
        setTimeout(() => setScanStatus(null), 3000);
        return;
      }

      // Look up person in IndexedDB using QR code
      console.log("Looking up in IndexedDB:", data);

      // Try direct database query for debugging
      if (typeof window !== "undefined") {
        const { dbManager } = await import("@/lib/db/db-manager");
        if (type === "student") {
          const allStudents = await dbManager.getAll<Student>("students", undefined, 5);
          console.log("Sample students in DB:", allStudents);
          console.log("First student qrCode:", allStudents[0]?.qrCode);
        } else if (type === "guardian") {
          const allGuardians = await dbManager.getAll<Guardian>("guardians", undefined, 5);
          console.log("Sample guardians in DB:", allGuardians);
          console.log("First guardian qrCode:", allGuardians[0]?.qrCode);
        }
      }

      personData = await storageManager.findByQrCode(data);
      console.log("Person data found:", personData);
      console.log("=== SCAN DEBUG END ===");

      if (!personData) {
        console.error("Person not found in IndexedDB for QR:", data);
        setScanStatus("error");
        setScanMessage(`${type === "student" ? "Student" : "Guardian"} not found in local database`);
        playSound("error");

        // Show error dialog
        setScanDialogData({
          personName: "Unknown Person",
          personType: type as "student" | "guardian",
          action: "in",
          timestamp: currentTime,
          status: "error",
          message: `${type === "student" ? "Student" : "Guardian"} not found in local database`,
        });
        setShowScanDialog(true);

        setTimeout(() => setScanStatus(null), 3000);
        return;
      }

      // IMMEDIATE FEEDBACK: Play recognition sound as soon as person is found
      playSound("recognition");

      // Construct full name from first and last name
      const fullName = `${personData.firstName} ${personData.lastName}`;

      // Show processing dialog immediately
      setScanDialogData({
        personName: fullName,
        personType: type as "student" | "guardian",
        action: "in", // Will be updated after record is created
        timestamp: currentTime,
        profilePhotoUrl: personData.profilePhotoUrl || undefined,
        status: "processing",
        message: "Recording attendance...",
      });
      setShowScanDialog(true);

      // Record attendance via API
      console.log("Recording attendance for:", personData);
      const record = await attendanceService.current.recordAttendance(data, personData);
      console.log("Attendance record created:", record);
      debugTimezone(record.timestamp, "New attendance record");

      // Play confirmation sound based on action
      playSound(record.action);

      // Update dialog with success status
      setScanDialogData({
        personName: record.personName,
        personType: type as "student" | "guardian",
        action: record.action,
        timestamp: new Date(record.timestamp),
        profilePhotoUrl: personData.profilePhotoUrl || undefined,
        status: "success",
      });

      setScanStatus("success");
      setScanMessage(`${record.personName} - ${record.action === "check_in" ? "Checked In" : "Checked Out"}`);

      // Reload recent scans and stats
      await loadRecentScans();

      // Data automatically broadcasts to all devices via WebSocket

      // Clear status after 3 seconds
      setTimeout(() => setScanStatus(null), 3000);
    } catch (error) {
      console.error("Scan error:", error);
      setScanStatus("error");
      setScanMessage("Failed to process scan");
      playSound("error");

      // Show error dialog
      const errorName = personData ? `${personData.firstName} ${personData.lastName}` : "Unknown Person";
      setScanDialogData({
        personName: errorName,
        personType: type as "student" | "guardian",
        action: "in",
        timestamp: currentTime,
        status: "error",
        message: "Failed to process scan. Please try again.",
      });
      setShowScanDialog(true);

      setTimeout(() => setScanStatus(null), 3000);
    }
  }, []);

  // Toggle between camera and manual input modes
  const handleToggleMode = () => {
    setManualInputMode(!manualInputMode);
    console.log("Switching to", !manualInputMode ? "manual" : "camera", "mode");
  };

  // Toggle fullscreen mode
  const toggleFullscreen = async () => {
    router.push("/scan");
  };

  // Listen for fullscreen changes (handles ESC key and F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      // If exiting fullscreen (not entering), navigate back to scan page
      if (!isCurrentlyFullscreen && isFullscreen) {
        router.push("/scan");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, router]);

  console.log("ScanPage rendering, isInitialized:", isInitialized);

  return (
    <div className="relative bg-black h-screen w-screen">
      <button className="absolute top-4 right-40 z-20 p-2.5 rounded-lg bg-gray-600/70 text-white" onClick={toggleFullscreen}>
        <Minimize className="h-4 w-4" />
      </button>
      {/* Camera View */}
      <div className="bg-white w-full h-full flex flex-col">
        <div className="flex-1 relative">
          <div className="relative rounded-lg bg-gray-900 h-full w-full">
            <Scanner ref={scannerRef} onScan={handleScan} isActive={isScannerActive} useFrontCamera={useFrontCamera} manualInputMode={manualInputMode} onToggleMode={handleToggleMode} onCameraChange={(useFront) => setUseFrontCamera(useFront)} />

            {/* Sync Status - Under Camera */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Offline Mode:</strong> All scans are saved locally and will sync when connected.
                </p>
              </div>

              <div className="rounded-lg border p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {realtimeConnected ? <Wifi className="h-4 w-4 text-green-600" /> : isOnline ? <Wifi className="h-4 w-4 text-yellow-600" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
                    <span className="text-sm font-medium">{realtimeConnected ? "Live Updates" : isOnline ? "Online" : "Offline"}</span>
                  </div>
                </div>

                {realtimeConnected && <p className="text-xs text-green-600 mt-2">✓ Live updates enabled - changes appear instantly</p>}

                {!realtimeConnected && isOnline && <p className="text-xs text-yellow-600 mt-2">Connecting to live updates...</p>}

                {!isOnline && <p className="text-xs text-gray-500 mt-2">Offline - scans saved locally</p>}
              </div>
            </div>
          </div>

          {scanStatus && (
            <div className={`absolute top-4 left-4 right-4 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 ${scanStatus === "success" ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {scanStatus === "success" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                  <div>
                    <p className={`text-sm font-medium ${scanStatus === "success" ? "text-green-800" : "text-red-800"}`}>{scanStatus === "success" ? "Successfully Scanned" : "Scan Error"}</p>
                    <p className={`text-lg font-semibold ${scanStatus === "success" ? "text-green-900" : "text-red-900"}`}>{scanMessage}</p>
                  </div>
                </div>
                <p className={`text-sm ${scanStatus === "success" ? "text-green-700" : "text-red-700"}`} suppressHydrationWarning>
                  {scanTime}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Dialog */}
      <ScanDialog isOpen={showScanDialog} onClose={() => setShowScanDialog(false)} data={scanDialogData} autoCloseDuration={3000} />
    </div>
  );
}
