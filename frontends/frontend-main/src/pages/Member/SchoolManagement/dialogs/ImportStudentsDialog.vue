<template>
  <q-dialog v-model="model" persistent>
    <template-dialog size="md" icon="o_file_upload" icon-color="primary">
      <template #DialogTitle>Import Students</template>

      <template #DialogContent>
        <div class="q-pa-md import-container">
          <div class="text-body1 q-mb-md">Upload a CSV or Excel file containing student information.</div>

          <q-card flat bordered class="q-pa-md q-mb-lg bg-grey-1">
            <div class="text-subtitle2 q-mb-sm">File Format Requirements:</div>
            <ul class="q-pl-md q-my-xs">
              <li>First row must contain column headers (exact spelling required)</li>
              <li>Supported formats: CSV, XLS, XLSX</li>
              <li>Maximum file size: 10MB</li>
              <li>Excel date serial numbers are automatically converted</li>
            </ul>

            <div class="text-subtitle2 q-mb-sm q-mt-md">Required Columns (exact names):</div>
            <ul class="q-pl-md q-my-xs">
              <li><strong>firstName</strong> - Student's first name</li>
              <li><strong>lastName</strong> - Student's last name</li>
              <li><strong>dateOfBirth</strong> - Date of birth (Excel serial or YYYY-MM-DD)</li>
              <li><strong>gender</strong> - Must be MALE or FEMALE (uppercase)</li>
              <li><strong>gradeLevel</strong> - NURSERY, KINDERGARTEN, or Grade 1-12</li>
            </ul>

            <div class="text-subtitle2 q-mb-sm q-mt-md">Optional Columns:</div>
            <ul class="q-pl-md q-my-xs">
              <li><strong>middleName</strong> - Student's middle name or initial</li>
              <li><strong>studentNumber</strong> - Student ID number (leave blank to auto-generate)</li>
              <li><strong>lrn</strong> - Learner Reference Number</li>
              <li><strong>Section</strong> - Class section name (note capital 'S')</li>
              <li><strong>Adviser</strong> - Section adviser's full name</li>
              <li><strong>Guardian Full Name</strong> - Guardian's complete name</li>
              <li><strong>Guardian Address</strong> - Guardian's home address</li>
              <li><strong>Guardian Contact Number</strong> - Guardian's phone number</li>
            </ul>

            <div class="text-subtitle2 q-mb-sm q-mt-md">Auto-Generated Fields:</div>
            <ul class="q-pl-md q-my-xs">
              <li><strong>Student Number</strong> - Format: YYYY-XXXXX (auto-generated)</li>
              <li><strong>Username</strong> - Format: firstname.lastname (lowercase)</li>
              <li><strong>Email</strong> - Format: username@materdei.edu.ph</li>
              <li><strong>Password</strong> - Default: student's first name (lowercase)</li>
            </ul>

            <div class="text-caption text-orange-8 q-mt-md">
              <q-icon name="info" /> Sections will be automatically created if they don't exist
            </div>
          </q-card>

          <div class="q-mb-md">
            <g-button
              @click="downloadTemplate"
              color="secondary"
              label="Download Template"
              icon="download"
              variant="filled"
              class="full-width"
            />
          </div>

          <q-file
            v-model="importFile"
            label="Select Import File"
            outlined
            accept=".csv,.xls,.xlsx"
            max-file-size="10485760"
            @rejected="onFileRejected"
            @update:model-value="onFileSelected"
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
            <template v-slot:append>
              <q-icon v-if="importFile" name="close" @click.stop="clearFile" class="cursor-pointer" />
            </template>
          </q-file>

          <!-- File Preview Section -->
          <div v-if="previewData && previewData.length > 0" class="q-mb-md">
            <q-card flat bordered class="q-pa-md bg-blue-1">
              <div class="text-subtitle2 q-mb-sm">File Preview (First 5 Students):</div>
              <div class="text-caption q-mb-sm">Total Students Found: {{ totalStudents }}</div>
              <q-scroll-area style="height: 200px">
                <q-list dense>
                  <q-item v-for="(student, index) in previewData.slice(0, 5)" :key="index">
                    <q-item-section>
                      <q-item-label>
                        {{ index + 1 }}. {{ student.lastName }}, {{ student.firstName }} {{ student.middleName || "" }}
                        <span v-if="student.studentNumber" class="text-grey-6">({{ student.studentNumber }})</span>
                      </q-item-label>
                      <q-item-label caption>
                        Grade: {{ student.gradeLevel }} | Section: {{ student.Section || "N/A" }} | DOB:
                        {{ formatDate(student.dateOfBirth) }}
                        <span v-if="student.lrn"> | LRN: {{ student.lrn }}</span>
                      </q-item-label>
                      <q-item-label caption v-if="student['Guardian Full Name']" class="text-blue-grey-6">
                        Guardian: {{ student["Guardian Full Name"] }}
                        <span v-if="student['Guardian Contact Number']"> ({{ student["Guardian Contact Number"] }})</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-scroll-area>
              <div v-if="parseErrors.length > 0" class="q-mt-md">
                <div class="text-negative text-caption">
                  <q-icon name="warning" /> Found {{ parseErrors.length }} issue(s):
                </div>
                <div class="text-caption" style="max-height: 100px; overflow-y: auto">
                  <div v-for="(error, index) in parseErrors.slice(0, 5)" :key="index" class="text-negative">
                    {{ error }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Import Progress -->
          <div v-if="importing" class="q-mt-lg">
            <q-card flat bordered class="q-pa-md bg-blue-1">
              <div class="text-subtitle2 q-mb-md">
                <q-icon name="hourglass_empty" class="q-mr-sm" />
                Importing Students...
              </div>
              <q-linear-progress :value="importProgress" color="primary" stripe rounded size="20px" class="q-mb-sm" />
              <div class="text-caption text-center q-mb-sm">
                Processing: {{ processedCount }} / {{ totalCount }} students ({{ Math.round(importProgress * 100) }}%)
              </div>
              <div v-if="currentStudent" class="text-caption text-center text-primary">
                <q-icon name="person" size="xs" /> Currently importing: <strong>{{ currentStudent }}</strong>
              </div>

              <!-- Live Success/Error Counts -->
              <div class="row q-mt-md q-gutter-sm">
                <div class="col">
                  <div class="text-positive text-caption">
                    <q-icon name="add_circle" size="xs" />
                    Created: {{ liveCreatedCount }}
                  </div>
                </div>
                <div class="col">
                  <div class="text-info text-caption">
                    <q-icon name="edit" size="xs" />
                    Updated: {{ liveUpdatedCount }}
                  </div>
                </div>
                <div class="col">
                  <div class="text-negative text-caption">
                    <q-icon name="error" size="xs" />
                    Errors: {{ liveErrors.length }}
                  </div>
                </div>
              </div>

              <!-- Live Error List -->
              <div v-if="liveErrors.length > 0" class="q-mt-md">
                <q-expansion-item
                  dense
                  icon="error_outline"
                  :label="`Recent Errors (${liveErrors.length})`"
                  header-class="text-negative text-caption"
                >
                  <q-scroll-area style="height: 150px" class="q-pa-sm bg-white">
                    <q-list dense>
                      <q-item v-for="(error, index) in liveErrors.slice(-5).reverse()" :key="index">
                        <q-item-section>
                          <q-item-label caption>Row {{ error.row }}: {{ error.studentName }}</q-item-label>
                          <q-item-label class="text-negative text-caption">{{ error.message }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-scroll-area>
                </q-expansion-item>
              </div>
            </q-card>
          </div>

          <!-- Import Results -->
          <div v-if="importResults && !importing" class="q-mt-lg">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-md">Import Complete!</div>

              <!-- Statistics Cards -->
              <div class="row q-gutter-md q-mb-md">
                <!-- Total Processed Card -->
                <div class="col">
                  <q-card flat bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4 text-primary">
                        {{ importResults.successCount + importResults.errorCount }}
                      </div>
                      <div class="text-subtitle2 text-grey-7">Total Processed</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Created Card -->
                <div class="col" v-if="importResults.createdCount !== undefined">
                  <q-card flat bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4 text-green">
                        {{ importResults.createdCount }}
                      </div>
                      <div class="text-subtitle2 text-grey-7">Created</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Updated Card -->
                <div class="col" v-if="importResults.updatedCount !== undefined">
                  <q-card flat bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4 text-blue">
                        {{ importResults.updatedCount }}
                      </div>
                      <div class="text-subtitle2 text-grey-7">Updated</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Success Card (if created/updated not available) -->
                <div class="col" v-else>
                  <q-card flat bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4 text-positive">
                        {{ importResults.successCount }}
                      </div>
                      <div class="text-subtitle2 text-grey-7">Succeeded</div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Errors Card -->
                <div class="col">
                  <q-card flat bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4" :class="importResults.errorCount > 0 ? 'text-negative' : 'text-grey-5'">
                        {{ importResults.errorCount }}
                      </div>
                      <div class="text-subtitle2 text-grey-7">Errors</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- Success Rate Progress Bar -->
              <div class="q-mb-md">
                <div class="text-subtitle2 text-grey-7 q-mb-xs">Success Rate</div>
                <q-linear-progress
                  :value="importResults.successCount / (importResults.successCount + importResults.errorCount)"
                  size="20px"
                  :color="getSuccessRateColor(importResults.successCount, importResults.errorCount)"
                  class="q-mb-sm"
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge
                      color="white"
                      text-color="black"
                      :label="`${Math.round(
                        (importResults.successCount / (importResults.successCount + importResults.errorCount)) * 100
                      )}%`"
                    />
                  </div>
                </q-linear-progress>
              </div>

              <!-- Error Details -->
              <div v-if="importResults.errorCount > 0">
                <!-- Failed Students List -->
                <q-expansion-item
                  v-if="importResults.errors.length > 0"
                  icon="list"
                  label="View Failed Imports"
                  header-class="text-negative"
                  class="q-mt-sm"
                >
                  <q-card>
                    <q-card-section>
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="text-subtitle2">Failed Import Details</div>
                        <g-button
                          @click="downloadErrorReport"
                          size="sm"
                          variant="text"
                          icon="download"
                          label="Export as CSV"
                          color="negative"
                        />
                      </div>
                      <q-list dense separator>
                        <q-item v-for="(error, index) in importResults.errors" :key="index">
                          <q-item-section avatar>
                            <q-avatar size="32px" color="red-2" text-color="red">
                              {{ error.row }}
                            </q-avatar>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>
                              <strong>Row {{ error.row }}:</strong>
                              <span v-if="error.studentName">{{ error.studentName }}</span>
                            </q-item-label>
                            <q-item-label caption class="text-negative">
                              {{ error.message }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </div>
            </q-card>
          </div>
        </div>
      </template>

      <template #DialogSubmitActions>
        <g-button @click="onCancel" color="grey" label="Cancel" variant="outline" :disable="importing" />
        <g-button
          @click="onImport"
          color="primary"
          :label="importing ? 'Importing...' : 'Import'"
          icon="upload"
          variant="filled"
          :loading="loading"
          :disable="!importFile || importing || previewData.length === 0"
        />
      </template>
    </template-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onUnmounted } from "vue";
import { defineAsyncComponent } from 'vue';
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { AxiosError } from "axios";
import * as XLSX from "xlsx";
import { io, Socket } from "socket.io-client";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface ImportResult {
  hasErrors: boolean;
  successCount: number;
  createdCount?: number;
  updatedCount?: number;
  errorCount: number;
  errors: Array<{
    row: number;
    message: string;
    studentName?: string;
  }>;
  successes: Array<{
    row: number;
    studentName: string;
    studentNumber: string;
    action?: "created" | "updated";
  }>;
}

interface StudentPreview {
  firstName: string;
  lastName: string;
  middleName?: string;
  studentNumber?: string;
  lrn?: string;
  dateOfBirth: string | number;
  gender: string;
  gradeLevel: string;
  Section?: string;
  Adviser?: string;
  "Guardian Full Name"?: string;
  "Guardian Address"?: string;
  "Guardian Contact Number"?: string;
}

interface ImportProgressData {
  sessionId: string;
  current: number;
  total: number;
  percentage: number;
  studentName?: string;
  status: "processing" | "success" | "error" | "complete";
  message?: string;
  error?: string;
  row?: number;
  action?: "created" | "updated";
}

interface ImportResultData {
  sessionId: string;
  successCount: number;
  createdCount?: number;
  updatedCount?: number;
  errorCount: number;
  errors: Array<{
    row: number;
    studentName: string;
    message: string;
  }>;
  successes: Array<{
    row: number;
    studentName: string;
    studentNumber: string;
  }>;
}

export default defineComponent({
  name: "ImportStudentsDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "close", "importDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const importing = ref(false);
    const importFile = ref<File | null>(null);
    const importResults = ref<ImportResult | null>(null);
    const previewData = ref<StudentPreview[]>([]);
    const totalStudents = ref(0);
    const parseErrors = ref<string[]>([]);
    const processedCount = ref(0);
    const totalCount = ref(0);
    const importProgress = ref(0);

    // WebSocket connection
    const socket = ref<Socket | null>(null);
    const sessionId = ref<string>("");
    const currentStudent = ref<string>("");
    const liveSuccesses = ref<
      Array<{ row: number; studentName: string; studentNumber: string; action?: "created" | "updated" }>
    >([]);
    const liveErrors = ref<Array<{ row: number; studentName: string; message: string }>>([]);
    const liveCreatedCount = ref(0);
    const liveUpdatedCount = ref(0);

    const model = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    // Convert Excel serial date to JavaScript Date
    const excelDateToJS = (serial: number): Date => {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);

      const fractional_day = serial - Math.floor(serial) + 0.0000001;
      let total_seconds = Math.floor(86400 * fractional_day);
      const seconds = total_seconds % 60;
      total_seconds -= seconds;
      const hours = Math.floor(total_seconds / (60 * 60));
      const minutes = Math.floor(total_seconds / 60) % 60;

      return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    };

    // Format date for display
    const formatDate = (dateValue: string | number): string => {
      if (!dateValue) return "N/A";

      try {
        let date: Date;
        if (typeof dateValue === "number") {
          // Excel serial date
          date = excelDateToJS(dateValue);
        } else if (typeof dateValue === "string") {
          date = new Date(dateValue);
        } else {
          return "Invalid Date";
        }

        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "Invalid Date";
      }
    };

    const downloadTemplate = () => {
      const headers = [
        "firstName",
        "lastName",
        "middleName",
        "studentNumber",
        "lrn",
        "dateOfBirth",
        "gender",
        "gradeLevel",
        "Section",
        "Adviser",
        "Guardian Full Name",
        "Guardian Address",
        "Guardian Contact Number",
      ];

      const sampleData = [
        [
          "JANINE JOYCE",
          "CASPE",
          "F.",
          "", // studentNumber - leave empty to auto-generate
          "136475000001", // lrn
          "2021-02-25",
          "FEMALE",
          "NURSERY",
          "MORNING STAR",
          "Ms. Marissa P. Nicolas",
          "Maria Caspe",
          "123 Main St, Quezon City",
          "09171234567",
        ],
        [
          "ADELE ELYX",
          "CASTILLO",
          "V.",
          "", // studentNumber - leave empty to auto-generate
          "136475000002", // lrn
          "2021-09-08",
          "FEMALE",
          "NURSERY",
          "MORNING STAR",
          "Ms. Marissa P. Nicolas",
          "Juan Castillo",
          "456 Oak Ave, Manila",
          "09281234567",
        ],
        [
          "AVIELLA ELINE",
          "SANTOS",
          "A.",
          "2024-00001", // studentNumber - can specify
          "136475000003", // lrn
          "2021-09-10",
          "FEMALE",
          "KINDERGARTEN",
          "CAUSE OF OUR JOY",
          "Ms. Anna Marie Reyes",
          "Ana Santos",
          "789 Pine Rd, Makati",
          "09391234567",
        ],
        [
          "ETHAN MATTHEW",
          "GAGARIN",
          "T.",
          "", // studentNumber - leave empty to auto-generate
          "", // lrn - optional
          "2020-08-14",
          "MALE",
          "Grade 1",
          "MOTHER OF CHRIST",
          "Mr. Joseph Santos",
          "Pedro Gagarin",
          "321 Elm St, Pasig",
          "09451234567",
        ],
      ];

      let csvContent = headers.join(",") + "\n";
      sampleData.forEach((row) => {
        csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "student_import_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      $q.notify({
        type: "positive",
        message: "Template downloaded successfully",
      });
    };

    const clearFile = () => {
      importFile.value = null;
      previewData.value = [];
      totalStudents.value = 0;
      parseErrors.value = [];
      importResults.value = null;
      processedCount.value = 0;
      totalCount.value = 0;
      importProgress.value = 0;
      importing.value = false;
    };

    const onFileSelected = async (file: File | null) => {
      if (!file) {
        clearFile();
        return;
      }

      parseErrors.value = [];
      previewData.value = [];
      totalStudents.value = 0;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as StudentPreview[];

        if (data.length === 0) {
          parseErrors.value.push("No data found in the file");
          return;
        }

        // Validate and clean data
        const cleanedData: StudentPreview[] = [];
        const errors: string[] = [];

        data.forEach((row, index) => {
          const rowNum = index + 2; // +2 because Excel starts at 1 and has headers

          // Clean whitespace from strings
          const student: StudentPreview = {
            firstName: String(row.firstName || "").trim(),
            lastName: String(row.lastName || "").trim(),
            middleName: row.middleName ? String(row.middleName).trim() : undefined,
            studentNumber: row.studentNumber ? String(row.studentNumber).trim() : undefined,
            lrn: row.lrn ? String(row.lrn).trim() : undefined,
            dateOfBirth: row.dateOfBirth,
            gender: String(row.gender || "")
              .trim()
              .toUpperCase(),
            gradeLevel: String(row.gradeLevel || "").trim(),
            Section: row.Section ? String(row.Section).trim() : undefined,
            Adviser: row.Adviser ? String(row.Adviser).trim() : undefined,
            "Guardian Full Name": row["Guardian Full Name"] ? String(row["Guardian Full Name"]).trim() : undefined,
            "Guardian Address": row["Guardian Address"] ? String(row["Guardian Address"]).trim() : undefined,
            "Guardian Contact Number": row["Guardian Contact Number"] ? String(row["Guardian Contact Number"]).trim() : undefined,
          };

          // Validate required fields
          if (!student.firstName) {
            errors.push(`Row ${rowNum}: Missing first name`);
          }
          if (!student.lastName) {
            errors.push(`Row ${rowNum}: Missing last name`);
          }
          if (!student.dateOfBirth) {
            errors.push(`Row ${rowNum}: Missing date of birth`);
          }
          if (!student.gender) {
            errors.push(`Row ${rowNum}: Missing gender`);
          } else if (!["MALE", "FEMALE"].includes(student.gender)) {
            errors.push(`Row ${rowNum}: Invalid gender (must be MALE or FEMALE)`);
          }
          if (!student.gradeLevel) {
            errors.push(`Row ${rowNum}: Missing grade level`);
          }

          cleanedData.push(student);
        });

        previewData.value = cleanedData;
        totalStudents.value = cleanedData.length;
        parseErrors.value = errors.slice(0, 10); // Show max 10 errors
      } catch (error) {
        console.error("Error parsing file:", error);
        parseErrors.value.push("Failed to parse file. Please check the file format.");
      }
    };

    // Initialize WebSocket connection
    const initWebSocket = (importSessionId: string) => {
      // Get WebSocket URL from environment or fallback to localhost
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000';
      
      // Convert ws:// to http:// or wss:// to https:// for socket.io
      const httpUrl = socketUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      socket.value = io(`${httpUrl}/student-import`, {
        query: { sessionId: importSessionId },
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      // Add connection event handlers for debugging
      socket.value.on('connect', () => {
        console.log('WebSocket connected to student-import namespace', {
          sessionId: importSessionId,
          socketId: socket.value?.id,
          connected: socket.value?.connected,
          namespace: socket.value?.nsp,
        });
      });
      
      socket.value.on('connect_error', (error: any) => {
        console.error('WebSocket connection error:', error.message, error);
      });
      
      socket.value.on('disconnect', (reason: string) => {
        console.log('WebSocket disconnected:', reason);
      });
      
      // Debug: Log all events
      socket.value.onAny((eventName: string, ...args: any[]) => {
        console.log('WebSocket event received:', eventName, args);
      });

      // Listen for progress updates
      socket.value.on('import-progress', (data: ImportProgressData) => {
        console.log('Progress update received:', data);
        processedCount.value = data.current;
        totalCount.value = data.total;
        importProgress.value = data.percentage / 100;

        if (data.studentName && data.status === "processing") {
          currentStudent.value = data.studentName;
        }

        if (data.status === "success" && data.row) {
          liveSuccesses.value.push({
            row: data.row,
            studentName: data.studentName || "",
            studentNumber: "", // Will be updated from complete event
            action: data.action,
          });

          // Track live counts by action type
          if (data.action === "created") {
            liveCreatedCount.value++;
          } else if (data.action === "updated") {
            liveUpdatedCount.value++;
          }
        }

        if (data.status === "error" && data.row) {
          liveErrors.value.push({
            row: data.row,
            studentName: data.studentName || "",
            message: data.error || "Import failed",
          });
        }
      });

      // Listen for import completion
      socket.value.on("import-complete", (data: ImportResultData) => {
        importing.value = false;
        loading.value = false;

        importResults.value = {
          hasErrors: data.errorCount > 0,
          successCount: data.successCount,
          createdCount: data.createdCount,
          updatedCount: data.updatedCount,
          errorCount: data.errorCount,
          errors: data.errors,
          successes: data.successes,
        };

        // Update success list with student numbers
        liveSuccesses.value = data.successes;

        // Show notification
        if (data.successCount > 0 && data.errorCount === 0) {
          let message = "";
          if (data.createdCount !== undefined && data.updatedCount !== undefined) {
            message = `Successfully processed ${data.successCount} student${data.successCount === 1 ? "" : "s"} (${
              data.createdCount
            } created, ${data.updatedCount} updated)`;
          } else {
            message = `Successfully imported ${data.successCount} student${data.successCount === 1 ? "" : "s"}`;
          }
          $q.notify({
            type: "positive",
            message,
            position: "top",
            timeout: 3000,
          });
          emit("importDone");
        } else if (data.successCount > 0 && data.errorCount > 0) {
          let message = "";
          if (data.createdCount !== undefined && data.updatedCount !== undefined) {
            message = `Processed ${data.successCount} student${data.successCount === 1 ? "" : "s"} (${
              data.createdCount
            } created, ${data.updatedCount} updated) with ${data.errorCount} error${data.errorCount === 1 ? "" : "s"}`;
          } else {
            message = `Imported ${data.successCount} student${data.successCount === 1 ? "" : "s"} with ${
              data.errorCount
            } error${data.errorCount === 1 ? "" : "s"}`;
          }
          $q.notify({
            type: "warning",
            message,
            position: "top",
            timeout: 5000,
          });
          emit("importDone");
        } else if (data.errorCount > 0) {
          $q.notify({
            type: "negative",
            message: `Failed to import ${data.errorCount} student${data.errorCount === 1 ? "" : "s"}`,
            position: "top",
            timeout: 5000,
          });
        }

        // Disconnect socket
        if (socket.value) {
          socket.value.disconnect();
          socket.value = null;
        }
      });

      // Handle cancellation
      socket.value.on("import-cancelled", () => {
        importing.value = false;
        loading.value = false;
        $q.notify({
          type: "warning",
          message: "Import was cancelled",
        });

        if (socket.value) {
          socket.value.disconnect();
          socket.value = null;
        }
      });
    };

    const onImport = async () => {
      if (!importFile.value || previewData.value.length === 0) return;

      // Check for validation errors
      if (parseErrors.value.length > 0) {
        $q.dialog({
          title: "Validation Errors Found",
          message: `There are ${parseErrors.value.length} validation error(s). Do you want to proceed with import anyway?`,
          cancel: true,
          persistent: true,
        }).onCancel(() => {
          return;
        });
      }

      importing.value = true;
      loading.value = true;
      importResults.value = null;
      processedCount.value = 0;
      totalCount.value = previewData.value.length;
      liveSuccesses.value = [];
      liveErrors.value = [];
      liveCreatedCount.value = 0;
      liveUpdatedCount.value = 0;
      currentStudent.value = "";

      // Generate session ID
      sessionId.value = `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Initialize WebSocket connection
      initWebSocket(sessionId.value);
      importProgress.value = 0;

      const formData = new FormData();
      formData.append("file", importFile.value);

      try {
        const response = await api.post(`school/student/import?sessionId=${sessionId.value}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Response will only contain sessionId and initial success
        // Actual results will come through WebSocket events
        if (response.data.statusCode === 200) {
          console.log("Import started with session:", sessionId.value);
          // WebSocket handlers will manage the rest
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string; errors?: any[] }>;

        if (axiosError.response?.data?.errors) {
          // Enhance error data with student names
          const enhancedErrors = axiosError.response.data.errors.map((error: any) => {
            const studentRow = previewData.value[error.row - 2];
            return {
              ...error,
              studentName: studentRow
                ? `${studentRow.lastName}, ${studentRow.firstName} ${studentRow.middleName || ""}`.trim()
                : undefined,
            };
          });

          importResults.value = {
            hasErrors: true,
            successCount: 0,
            errors: enhancedErrors,
          };
        } else {
          $q.notify({
            type: "negative",
            message: axiosError.response?.data?.message || "Failed to import students",
            position: "top",
          });
        }
      } finally {
        loading.value = false;
        importing.value = false;
      }
    };

    const downloadErrorReport = () => {
      if (!importResults.value || !importResults.value.errors.length) return;

      const headers = ["Row", "Student Name", "Error Message"];
      const rows = importResults.value.errors.map((error) => [
        error.row,
        error.studentName || "Unknown",
        error.message,
      ]);

      let csvContent = headers.join(",") + "\n";
      rows.forEach((row) => {
        csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `import-errors-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      $q.notify({
        type: "info",
        message: "Error report downloaded",
        position: "top",
      });
    };

    const onCancel = () => {
      clearFile();
      emit("close");
    };

    const onFileRejected = () => {
      $q.notify({
        type: "negative",
        message: "Invalid file. Please select a CSV or Excel file under 10MB",
      });
    };

    // Clean up socket on unmount
    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
      }
    });

    // Helper function to get color based on success rate
    const getSuccessRateColor = (successCount: number, errorCount: number): string => {
      const total = successCount + errorCount;
      if (total === 0) return "grey";
      const rate = (successCount / total) * 100;
      if (rate >= 90) return "positive";
      if (rate >= 70) return "warning";
      return "negative";
    };

    return {
      model,
      loading,
      importing,
      importFile,
      importResults,
      previewData,
      totalStudents,
      parseErrors,
      processedCount,
      totalCount,
      importProgress,
      currentStudent,
      liveSuccesses,
      liveErrors,
      liveCreatedCount,
      liveUpdatedCount,
      formatDate,
      downloadTemplate,
      onImport,
      downloadErrorReport,
      onCancel,
      onFileRejected,
      onFileSelected,
      clearFile,
      getSuccessRateColor,
    };
  },
});
</script>

<style lang="scss" scoped>
.import-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
