<template>
  <div class="shift-tab-md3">
    <!-- Initial Loading Skeleton - when component is first mounting -->
    <div v-if="isLoadingSchedules && !scheduleOptions.length" class="initial-loading-skeleton">
      <!-- Schedule Selection Skeleton -->
      <div class="schedule-section">
        <div class="section-header">
          <div class="header-content">
            <q-skeleton type="rect" width="20px" height="20px" class="header-icon" />
            <q-skeleton type="text" width="140px" height="20px" />
          </div>
        </div>
        <div class="schedule-controls">
          <div class="schedule-select-container">
            <q-skeleton type="rect" width="100%" height="40px" />
          </div>
        </div>
      </div>

      <!-- Message -->
      <div class="loading-message">
        <div class="text-center q-pa-md">
          <q-spinner-dots size="24px" color="primary" />
          <div class="md3-body-small text-grey-6 q-mt-sm">Loading schedule options...</div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="shift-md3">
      <!-- Schedule Selection & Overview Section -->
      <div class="schedule-section">
        <div class="section-header">
          <div class="header-content">
            <q-icon name="schedule" size="20px" class="header-icon" />
            <span class="md3-title-medium">Schedule Assignment</span>
          </div>
          <q-btn
            v-if="scheduleDetails"
            flat
            dense
            color="primary"
            icon="refresh"
            size="sm"
            class="refresh-btn"
            :loading="isRefreshing"
            :disable="isLoadingScheduleDetails || isRefreshing"
            @click="refreshScheduleDetails"
          >
            <q-tooltip>Refresh Details</q-tooltip>
          </q-btn>
        </div>

        <div class="schedule-controls">
          <div class="schedule-select-container">
            <q-select
              v-model="scheduleId"
              :options="scheduleOptions"
              filled
              dense
              emit-value
              map-options
              :loading="isLoadingSchedules || composableLoading"
              :disable="isLoadingSchedules || composableLoading"
              @update:model-value="onScheduleChange"
              class="schedule-select"
              label="Select Schedule Code"
            >
              <template v-slot:prepend>
                <q-icon name="schedule" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Inline Overview -->
          <div v-if="scheduleDetails && !isLoadingScheduleDetails" class="schedule-overview-inline">
            <div class="overview-item">
              <span class="overview-label">Code:</span>
              <span class="overview-value">{{ scheduleDetails.scheduleCode }}</span>
            </div>
            <div class="overview-divider"></div>
            <div class="overview-item">
              <span class="overview-label">Total Hours:</span>
              <span class="overview-value">{{ scheduleDetails.totalWorkingHours?.formatted || "N/A" }}</span>
            </div>
          </div>

          <!-- Inline Overview Skeleton -->
          <div v-else-if="isLoadingScheduleDetails && scheduleId" class="schedule-overview-skeleton">
            <div class="overview-item-skeleton">
              <q-skeleton type="text" width="40px" height="12px" />
              <q-skeleton type="text" width="60px" height="14px" />
            </div>
            <div class="overview-divider-skeleton"></div>
            <div class="overview-item-skeleton">
              <q-skeleton type="text" width="70px" height="12px" />
              <q-skeleton type="text" width="50px" height="14px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Schedule Section -->
      <div
        v-if="scheduleDetails || isLoadingScheduleDetails"
        class="weekly-section"
        :class="{ 'loading-overlay': isRefreshing && scheduleDetails }"
      >
        <div class="section-header">
          <div class="header-content">
            <q-icon name="view_week" size="20px" class="header-icon" />
            <span class="md3-title-medium">Weekly Schedule</span>
          </div>
        </div>

        <!-- Loading Skeleton for Weekly Schedule -->
        <div v-if="isLoadingScheduleDetails || isRefreshing" class="weekly-schedule-skeleton">
          <div v-for="day in 7" :key="day" class="schedule-row-skeleton">
            <div class="day-name-skeleton">
              <q-skeleton type="text" width="60px" height="13px" />
            </div>
            <div class="shift-details-skeleton">
              <q-skeleton type="text" width="45px" height="12px" />
              <q-skeleton type="rect" width="60px" height="20px" />
            </div>
            <div class="time-details-skeleton">
              <div class="time-item-skeleton">
                <q-skeleton type="rect" width="14px" height="14px" />
                <q-skeleton type="text" width="30px" height="11px" />
              </div>
              <div class="time-item-skeleton">
                <q-skeleton type="rect" width="14px" height="14px" />
                <q-skeleton type="text" width="35px" height="11px" />
              </div>
              <div class="time-item-skeleton">
                <q-skeleton type="rect" width="14px" height="14px" />
                <q-skeleton type="text" width="40px" height="11px" />
              </div>
            </div>
          </div>
        </div>

        <!-- Loaded Weekly Schedule -->
        <div v-else-if="scheduleDetails && !isLoadingScheduleDetails && !isRefreshing" class="weekly-schedule-compact">
          <div v-for="(shift, day) in scheduleDetails.dayScheduleDetails" :key="day" class="schedule-row">
            <div class="day-name">
              <span class="day-text">{{ formatDayName(day) }}</span>
            </div>
            <div class="shift-details">
              <div class="shift-code">{{ shift.shiftCode || "-" }}</div>
              <q-chip
                :color="getShiftTypeColor(shift.shiftType?.label)"
                text-color="white"
                dense
                size="xs"
                class="shift-type-chip"
              >
                {{ shift.shiftType?.label || "Unknown" }}
              </q-chip>
            </div>
            <div class="time-details">
              <div class="time-item">
                <q-icon name="free_breakfast" size="14px" />
                <span>{{ shift.breakHours?.formatted || "-" }}</span>
              </div>
              <div class="time-item">
                <q-icon name="schedule" size="14px" />
                <span>{{ shift.targetHours?.formatted || "-" }}</span>
              </div>
              <div class="time-item total">
                <q-icon name="timer" size="14px" />
                <span>{{ shift.totalWorkHours?.formatted || "-" }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Time Schedules Section -->
      <div v-if="scheduleDetails || isLoadingScheduleDetails" class="daily-section">
        <div class="section-header">
          <div class="header-content">
            <q-icon name="schedule" size="20px" class="header-icon" />
            <span class="md3-title-medium">Daily Time Schedules</span>
          </div>
        </div>

        <!-- Loading Skeleton for Daily Schedules -->
        <div v-if="isLoadingScheduleDetails" class="daily-schedule-skeleton">
          <div v-for="day in 7" :key="day" class="day-card-skeleton">
            <div class="day-header-skeleton">
              <q-skeleton type="text" width="60px" height="13px" />
              <q-skeleton type="rect" width="50px" height="18px" />
            </div>
            <div class="time-slots-skeleton">
              <div v-for="slot in 2" :key="slot" class="time-slot-skeleton">
                <div class="time-range-skeleton">
                  <q-skeleton type="rect" width="12px" height="12px" />
                  <q-skeleton type="text" width="70px" height="11px" />
                </div>
                <div class="work-hours-skeleton">
                  <q-skeleton type="rect" width="10px" height="10px" />
                  <q-skeleton type="text" width="35px" height="10px" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loaded Daily Schedules -->
        <div v-else-if="scheduleDetails && !isLoadingScheduleDetails" class="daily-schedule-grid">
          <div v-for="(shift, day) in scheduleDetails.dayScheduleDetails" :key="day" class="day-card-compact">
            <div class="day-card-header">
              <span class="day-name-compact">{{ formatDayName(day) }}</span>
              <q-chip
                :color="getShiftTypeColor(shift.shiftType?.label)"
                text-color="white"
                dense
                size="xs"
                class="shift-chip-compact"
              >
                {{ shift.shiftType?.label || "Unknown" }}
              </q-chip>
            </div>

            <div v-if="shift.shiftTime && shift.shiftTime.length > 0" class="time-slots-compact">
              <div v-for="(time, index) in shift.shiftTime" :key="index" class="time-slot-compact">
                <div class="time-range-compact">
                  <q-icon name="schedule" size="12px" />
                  <span class="time-text">{{ time.startTime?.time || "N/A" }} - {{ time.endTime?.time || "N/A" }}</span>
                </div>
                <div class="work-hours-compact">
                  <q-icon name="timer" size="10px" />
                  <span class="hours-text">{{ time.workHours?.formatted || "N/A" }}</span>
                </div>
              </div>
            </div>

            <div v-else class="no-schedule-compact">
              <q-icon name="event_busy" size="16px" color="grey-5" />
              <span class="no-schedule-text">No schedule</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="fetchError && !isLoadingScheduleDetails && scheduleId" class="error-state">
        <div class="text-center q-pa-lg">
          <q-icon name="error_outline" size="48px" color="negative" />
          <div class="md3-title-medium q-mt-md text-negative">Failed to Load Schedule</div>
          <div class="md3-body-medium text-grey-6 q-mt-sm q-mb-md">
            {{
              fetchError?.response?.data?.message ||
              fetchError?.message ||
              "Unable to load schedule details for the selected code."
            }}
          </div>
          <q-btn
            color="primary"
            icon="refresh"
            label="Try Again"
            :loading="isLoadingScheduleDetails"
            @click="retryFetchScheduleDetails"
            flat
            dense
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!scheduleDetails && !isLoadingScheduleDetails && scheduleId && !fetchError" class="empty-state">
        <div class="text-center q-pa-lg">
          <q-icon name="event_busy" size="48px" color="grey-5" />
          <div class="md3-title-medium q-mt-md">No Schedule Details</div>
          <div class="md3-body-medium text-grey-6 q-mt-sm">No schedule details found for the selected code.</div>
        </div>
      </div>

      <!-- Initial State -->
      <div v-if="!scheduleId && !isLoadingSchedules && !composableLoading" class="initial-state">
        <div class="text-center q-pa-lg">
          <q-icon name="schedule" size="48px" color="grey-5" />
          <div class="md3-title-medium q-mt-md">Select a Schedule</div>
          <div class="md3-body-medium text-grey-6 q-mt-sm">
            Choose a schedule code from the dropdown above to view shift details.
          </div>
        </div>
      </div>
    </div>
    <!-- End of main content -->
  </div>
</template>

<script>
import { api } from "src/boot/axios";
import { useSupabaseSchedules } from "src/composables/supabase/useSupabaseSchedules";
import { useAuthStore } from "src/stores/auth";
import { useGlobalMethods } from "src/composables/useGlobalMethods";
import { useQuasar } from "quasar";

export default {
  name: "ShiftTab",
  setup() {
    // Initialize Quasar
    const quasar = useQuasar();

    // Initialize Supabase composables
    const schedulesComposable = useSupabaseSchedules();
    const authStore = useAuthStore();
    const { handleAxiosError } = useGlobalMethods();

    return {
      quasar,
      // Expose only the specific methods and computed properties we need
      fetchSchedulesByCompany: schedulesComposable.fetchSchedulesByCompany,
      fetchSchedules: schedulesComposable.fetchSchedules,
      // Create a safe getter for scheduleOptions
      getScheduleOptions: () => {
        try {
          return schedulesComposable.scheduleOptions?.value || [];
        } catch (error) {
          console.warn("Error accessing schedule options:", error);
          return [];
        }
      },
      // Expose the loading state from composable
      composableLoading: schedulesComposable.loading,
      composableError: schedulesComposable.error,
      authStore,
      handleAxiosError,
    };
  },
  props: {
    employeeData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      scheduleId: null,
      originalScheduleId: null,
      scheduleDetails: null,
      isLoadingSchedules: false,
      isLoadingScheduleDetails: false,
      isUpdating: false,
      isRefreshing: false,
      fetchError: null,
    };
  },
  computed: {
    hasChanges() {
      return this.scheduleId !== this.originalScheduleId;
    },
    scheduleOptions() {
      // Use the safe getter function from setup()
      return this.getScheduleOptions ? this.getScheduleOptions() : [];
    },
  },
  watch: {
    // Watch for changes in employeeData prop
    "employeeData.data.schedule": {
      handler(newSchedule, oldSchedule) {
        if (newSchedule && newSchedule.id !== oldSchedule?.id) {
          this.scheduleId = newSchedule.id;
          this.originalScheduleId = newSchedule.id;
          // Fetch complete schedule details
          this.onScheduleChange(newSchedule.id);
        }
      },
      deep: true,
      immediate: false, // We handle initial load in mounted()
    },
  },
  async mounted() {
    try {
      this.initializeData();
      await this.fetchScheduleOptions();

      // If we have a scheduleId from employeeData, fetch the complete schedule details
      if (this.scheduleId) {
        await this.onScheduleChange(this.scheduleId);
      }
    } catch (error) {
      console.error("Error during ShiftTab initialization:", error);
      // The individual methods already handle their own error notifications
    }
  },
  unmounted() {
    // Clean up any pending operations
    // Note: We don't set composable to null as it's managed by Vue's setup()
  },
  methods: {
    initializeData() {
      if (this.employeeData?.data?.schedule) {
        this.scheduleId = this.employeeData.data.schedule.id;
        this.originalScheduleId = this.employeeData.data.schedule.id;
        // Don't set scheduleDetails directly - let onScheduleChange fetch complete data
      }
    },
    async fetchScheduleOptions() {
      this.isLoadingSchedules = true;
      try {
        const companyId =
          this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;

        // Add null checks for composable methods
        if (!this.fetchSchedulesByCompany || !this.fetchSchedules) {
          console.warn("Schedule composable methods not available");
          return;
        }

        if (companyId) {
          await this.fetchSchedulesByCompany(companyId);
        } else {
          await this.fetchSchedules();
        }

        // Check for composable errors
        if (this.composableError) {
          throw new Error(this.composableError.message || "Failed to fetch schedule options");
        }

        // scheduleOptions is already reactive and exposed from setup()
      } catch (error) {
        this.handleAxiosError(error);
        this.quasar.notify({
          type: "negative",
          message: "Failed to fetch schedule options",
        });
      } finally {
        this.isLoadingSchedules = false;
      }
    },
    async onScheduleChange(scheduleId) {
      if (!scheduleId) {
        this.scheduleDetails = null;
        this.fetchError = null;
        return;
      }

      // Clear previous data for clean transition
      this.scheduleDetails = null;
      this.isLoadingScheduleDetails = true;
      this.fetchError = null;

      try {
        const response = await api.get("/hr-configuration/schedule/info", {
          params: { id: scheduleId },
        });
        this.scheduleDetails = response.data;
      } catch (error) {
        this.fetchError = error;
        this.scheduleDetails = null;
        this.handleAxiosError(error);
        this.quasar.notify({
          type: "negative",
          message: "Failed to fetch schedule details",
        });
      } finally {
        this.isLoadingScheduleDetails = false;
      }
    },
    async refreshScheduleDetails() {
      if (!this.scheduleId) return;

      this.isRefreshing = true;
      try {
        await this.onScheduleChange(this.scheduleId);
        this.quasar.notify({
          type: "positive",
          message: "Schedule details refreshed successfully",
          timeout: 2000,
        });
      } catch (error) {
        // Error handling is already done in onScheduleChange
      } finally {
        this.isRefreshing = false;
      }
    },
    async retryFetchScheduleDetails() {
      await this.onScheduleChange(this.scheduleId);
    },
    async onUpdate() {
      if (!this.hasChanges) return;

      this.isUpdating = true;
      try {
        const params = {
          accountId: this.employeeData.data.accountDetails.id,
          scheduleId: this.scheduleId,
        };

        await api.patch("/hris/employee/update-schedule", params);

        this.quasar.notify({
          type: "positive",
          message: "Schedule updated successfully",
        });

        this.originalScheduleId = this.scheduleId;
        this.$emit("update");
      } catch (error) {
        this.handleAxiosError(error);
        this.quasar.notify({
          type: "negative",
          message: "Failed to update schedule",
        });
      } finally {
        this.isUpdating = false;
      }
    },
    onCancel() {
      this.$emit("cancel");
    },
    formatDayName(day) {
      return day.charAt(0).toUpperCase() + day.slice(1).replace("Shift", "");
    },
    getShiftTypeColor(shiftType) {
      const colorMap = {
        REGULAR: "primary",
        OVERTIME: "warning",
        HOLIDAY: "positive",
        NIGHT: "info",
        WEEKEND: "secondary",
      };
      return colorMap[shiftType?.toUpperCase()] || "grey";
    },
  },
};
</script>

<style scoped lang="scss">
@use "sass:color";

// Material Design 3 Variables
$md3-primary: #6750a4;
$md3-surface: #fffbfe;
$md3-surface-variant: #f7f2fa;
$md3-on-surface: #1d1b20;
$md3-on-surface-variant: #49454f;
$md3-outline: #79747e;
$md3-outline-variant: #cac4d0;
$md3-spacing-xs: 4px;
$md3-spacing-sm: 8px;
$md3-spacing-md: 12px;
$md3-spacing-lg: 16px;
$md3-spacing-xl: 20px;
$md3-spacing-2xl: 24px;

.shift-tab-md3 {
  display: flex;
  flex-direction: column;

  .shift-md3 {
    display: flex;
    flex-direction: column;
    gap: $md3-spacing-md;

    // Section styling - flat design
    .schedule-section,
    .weekly-section,
    .daily-section {
      background: $md3-surface;
      border-radius: $md3-spacing-md;
      border: 1px solid $md3-outline-variant;
      padding: $md3-spacing-lg;
    }
  }

  // Section headers - compact and flat
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $md3-spacing-md;

    .header-content {
      display: flex;
      align-items: center;
      gap: $md3-spacing-sm;

      .header-icon {
        color: $md3-primary;
      }
    }

    .refresh-btn {
      min-height: 32px;
      min-width: 32px;
    }
  }

  // Schedule controls - horizontal layout
  .schedule-controls {
    display: flex;
    align-items: center;
    gap: $md3-spacing-lg;
    flex-wrap: wrap;

    .schedule-select-container {
      flex: 1;
      min-width: 200px;
    }

    .schedule-select {
      :deep(.q-field__control) {
        height: 40px;
      }
    }

    .schedule-overview-inline {
      display: flex;
      align-items: center;
      gap: $md3-spacing-md;

      .overview-item {
        display: flex;
        align-items: center;
        gap: $md3-spacing-xs;

        .overview-label {
          font-size: 12px;
          color: $md3-on-surface-variant;
          font-weight: 500;
        }

        .overview-value {
          font-size: 14px;
          color: $md3-on-surface;
          font-weight: 600;
          font-family: "Roboto Mono", monospace;
        }
      }

      .overview-divider {
        width: 1px;
        height: 16px;
        background: $md3-outline-variant;
      }
    }

    .schedule-overview-skeleton {
      display: flex;
      align-items: center;
      gap: $md3-spacing-md;
    }
  }

  // Weekly schedule - compact list design
  .weekly-schedule-compact {
    display: flex;
    flex-direction: column;
    gap: 1px;

    .schedule-row {
      display: flex;
      align-items: center;
      padding: $md3-spacing-sm $md3-spacing-md;
      background: $md3-surface-variant;
      transition: background-color 0.2s ease;

      &:hover {
        background: color.adjust($md3-surface-variant, $lightness: -2%);
      }

      &:first-child {
        border-radius: 4px 4px 0 0;
      }

      &:last-child {
        border-radius: 0 0 4px 4px;
      }

      .day-name {
        width: 80px;
        flex-shrink: 0;

        .day-text {
          font-size: 13px;
          font-weight: 600;
          color: $md3-on-surface;
        }
      }

      .shift-details {
        display: flex;
        align-items: center;
        gap: $md3-spacing-sm;
        flex: 1;

        .shift-code {
          font-size: 12px;
          font-family: "Roboto Mono", monospace;
          color: $md3-on-surface-variant;
          min-width: 60px;
        }

        .shift-type-chip {
          font-size: 10px;
          height: 20px;
        }
      }

      .time-details {
        display: flex;
        align-items: center;
        gap: $md3-spacing-md;

        .time-item {
          display: flex;
          align-items: center;
          gap: $md3-spacing-xs;

          span {
            font-size: 11px;
            font-family: "Roboto Mono", monospace;
            color: $md3-on-surface-variant;
          }

          &.total span {
            font-weight: 600;
            color: $md3-on-surface;
          }

          .q-icon {
            color: $md3-on-surface-variant;
          }
        }
      }
    }
  }

  .weekly-schedule-skeleton {
    display: flex;
    flex-direction: column;
    gap: $md3-spacing-sm;

    .schedule-row-skeleton {
      display: flex;
      align-items: center;
      gap: $md3-spacing-md;
      padding: $md3-spacing-sm $md3-spacing-md;
      background: $md3-surface-variant;
    }
  }

  // Daily schedule grid - compact cards
  .daily-schedule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $md3-spacing-sm;

    .day-card-compact {
      background: $md3-surface-variant;
      padding: $md3-spacing-md;
      border-radius: 4px;
      transition: background-color 0.2s ease;

      &:hover {
        background: color.adjust($md3-surface-variant, $lightness: -2%);
      }

      .day-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $md3-spacing-sm;
        padding-bottom: $md3-spacing-xs;
        border-bottom: 1px solid $md3-outline-variant;

        .day-name-compact {
          font-size: 13px;
          font-weight: 600;
          color: $md3-on-surface;
        }

        .shift-chip-compact {
          font-size: 9px;
          height: 18px;
        }
      }

      .time-slots-compact {
        display: flex;
        flex-direction: column;
        gap: $md3-spacing-xs;

        .time-slot-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .time-range-compact {
            display: flex;
            align-items: center;
            gap: $md3-spacing-xs;

            .time-text {
              font-size: 11px;
              font-family: "Roboto Mono", monospace;
              color: $md3-on-surface;
            }
          }

          .work-hours-compact {
            display: flex;
            align-items: center;
            gap: 2px;

            .hours-text {
              font-size: 10px;
              font-family: "Roboto Mono", monospace;
              color: $md3-on-surface-variant;
            }
          }
        }
      }

      .no-schedule-compact {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $md3-spacing-xs;
        color: $md3-on-surface-variant;

        .no-schedule-text {
          font-size: 11px;
        }
      }
    }
  }

  .daily-schedule-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $md3-spacing-sm;

    .day-card-skeleton {
      background: $md3-surface-variant;
      padding: $md3-spacing-md;
      border-radius: 4px;

      .day-header-skeleton {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $md3-spacing-sm;
      }

      .time-slots-skeleton {
        display: flex;
        flex-direction: column;
        gap: $md3-spacing-xs;
      }
    }
  }

  // Initial Loading Skeleton
  .initial-loading-skeleton {
    .loading-message {
      border-top: 1px solid $md3-outline-variant;
    }
  }

  // Schedule Overview Skeleton
  .schedule-overview-skeleton {
    display: flex;
    align-items: center;
    gap: $md3-spacing-md;

    .overview-item-skeleton {
      display: flex;
      align-items: center;
      gap: $md3-spacing-xs;
    }

    .overview-divider-skeleton {
      width: 1px;
      height: 16px;
      background: $md3-outline-variant;
    }
  }

  // Weekly Schedule Skeleton
  .weekly-schedule-skeleton {
    display: flex;
    flex-direction: column;
    gap: 1px;
    opacity: 0.8;

    .schedule-row-skeleton {
      display: flex;
      align-items: center;
      padding: $md3-spacing-sm $md3-spacing-md;
      background: $md3-surface-variant;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: skeleton-shimmer 2s infinite;
      }

      &:first-child {
        border-radius: 4px 4px 0 0;
      }

      &:last-child {
        border-radius: 0 0 4px 4px;
      }

      .day-name-skeleton {
        width: 80px;
        flex-shrink: 0;
      }

      .shift-details-skeleton {
        display: flex;
        align-items: center;
        gap: $md3-spacing-sm;
        flex: 1;
      }

      .time-details-skeleton {
        display: flex;
        align-items: center;
        gap: $md3-spacing-md;

        .time-item-skeleton {
          display: flex;
          align-items: center;
          gap: $md3-spacing-xs;
        }
      }
    }
  }

  @keyframes skeleton-shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  // Loading overlay for refresh state
  .loading-overlay {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(1px);
      z-index: 1;
      border-radius: 4px;
      animation: pulse-overlay 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse-overlay {
    0%,
    100% {
      opacity: 0.7;
    }
    50% {
      opacity: 0.5;
    }
  }

  // Daily Schedule Skeleton
  .daily-schedule-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $md3-spacing-sm;

    .day-card-skeleton {
      background: $md3-surface-variant;
      padding: $md3-spacing-md;
      border-radius: 4px;

      .day-header-skeleton {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $md3-spacing-sm;
        padding-bottom: $md3-spacing-xs;
        border-bottom: 1px solid $md3-outline-variant;
      }

      .time-slots-skeleton {
        display: flex;
        flex-direction: column;
        gap: $md3-spacing-xs;

        .time-slot-skeleton {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .time-range-skeleton {
            display: flex;
            align-items: center;
            gap: $md3-spacing-xs;
          }

          .work-hours-skeleton {
            display: flex;
            align-items: center;
            gap: 2px;
          }
        }
      }
    }
  }

  // Enhanced skeleton animations
  .q-skeleton {
    animation: md3-skeleton-pulse 1.8s ease-in-out infinite;
  }

  @keyframes md3-skeleton-pulse {
    0% {
      opacity: 0.7;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.7;
    }
  }

  // Error and empty states
  .error-state,
  .empty-state,
  .initial-state {
    text-align: center;
    padding: $md3-spacing-2xl;

    .q-icon {
      margin-bottom: $md3-spacing-md;
    }
  }

  // Responsive design
  @media (max-width: 768px) {
    .schedule-controls {
      flex-direction: column;
      align-items: stretch;

      .schedule-overview-inline {
        justify-content: center;
      }
    }

    .daily-schedule-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .weekly-schedule-compact .schedule-row {
      flex-direction: column;
      align-items: flex-start;
      gap: $md3-spacing-xs;

      .day-name {
        width: 100%;
      }

      .shift-details,
      .time-details {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}
</style>
