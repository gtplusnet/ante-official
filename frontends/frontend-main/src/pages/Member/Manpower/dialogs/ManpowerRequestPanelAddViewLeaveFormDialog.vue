<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @before-show="fetchData"
    @hide="$emit('hide')"
    class="leave-form-dialog"
  >
    <TemplateDialog icon="event_busy" icon-color="#00897b" :width="'650px'" :scrollable="false">
      <template #DialogTitle>
        Leave Form {{ filing ? `(${filing?.status.label})` : "" }}
      </template>

      <template #DialogContent>
        <q-form @submit.prevent="onSubmit" style="width: 100%">
          <div class="leave-form-content">
            <!-- Leave Credits Section -->
            <div class="leave-credits-section">
              <div class="label">
                <q-icon
                  name="account_balance_wallet"
                  size="20px"
                  color="primary"
                />
                Select Leave Type
                <span class="required">*</span>
              </div>

              <div v-if="loadingCredits" class="loading-state">
                <q-spinner color="primary" size="40px" />
                <div class="loading-text">Loading leave credits...</div>
              </div>

              <div v-else-if="leaveCredits.length === 0" class="no-leave-plans">
                <q-icon
                  name="warning"
                  color="orange"
                  size="48px"
                  class="warning-icon"
                />
                <div class="title">No Leave Plans Assigned</div>
                <div class="description">
                  You are not allowed to file a leave form because you have no
                  leave plans assigned to your account.
                </div>
                <div class="hint">
                  Please contact your HR administrator to assign leave plans to
                  your account.
                </div>
              </div>

              <div v-else class="leave-credits-grid">
                <div
                  v-if="showValidation && !selectedLeaveId"
                  class="error-message q-mb-sm"
                >
                  <q-icon name="error" size="sm" />
                  Please select a leave type to continue
                </div>

                <div
                  v-for="credit in leaveCredits"
                  :key="credit.plan.leaveType.code"
                  class="leave-credit-card"
                  :class="{
                    selected: selectedLeaveId === credit.id,
                    disabled: !isEditable,
                    error: showValidation && !selectedLeaveId && isEditable,
                  }"
                  @click="isEditable ? selectLeaveType(credit) : null"
                >
                  <div class="leave-type-header">
                    <div class="leave-type-name">
                      <q-icon
                        :name="getLeaveIcon(credit.plan.leaveType.code)"
                        size="20px"
                        color="primary"
                      />
                      {{ credit.plan.leaveType.name }}
                    </div>
                    <div
                      class="selection-indicator"
                      :class="{ selected: selectedLeaveId === credit.id }"
                      v-if="isEditable"
                    />
                  </div>

                  <div class="leave-credits-info">
                    <span class="credits-label">Available Credits:</span>
                    <span class="credits-value">
                      {{ credit.credits.remaining }}
                      <span class="total"
                        >/ {{ credit.credits.totalAccumulated }} days</span
                      >
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Section -->
            <div
              v-if="!loadingCredits && leaveCredits.length > 0"
              class="form-section"
            >
              <!-- Compensation Type -->
              <div class="form-group">
                <label class="form-label">
                  Compensation Type
                  <span class="required">*</span>
                </label>
                <div class="compensation-options">
                  <q-radio
                    v-model="form.compensationType"
                    val="WITH_PAY"
                    label="With Pay"
                    :disable="!isEditable"
                    color="primary"
                  />
                  <q-radio
                    v-model="form.compensationType"
                    val="WITHOUT_PAY"
                    label="Without Pay"
                    :disable="!isEditable"
                    color="primary"
                  />
                </div>
                <div
                  v-if="!form.compensationType && showValidation"
                  class="error-message"
                >
                  <q-icon name="error" size="sm" />
                  Please select a compensation type
                </div>
              </div>

              <!-- Date Range -->
              <div class="form-group">
                <div class="date-inputs">
                  <div>
                    <label class="form-label">
                      Date From
                      <span class="required">*</span>
                    </label>
                    <g-input
                      v-model="form.dateFrom"
                      :type="!isEditable ? 'readonly' : 'date'"
                      outlined
                      dense
                      :error="showValidation && !form.dateFrom"
                      :error-message="
                        showValidation && !form.dateFrom
                          ? 'Start date is required'
                          : ''
                      "
                      :min="minDate"
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label class="form-label">
                      Date To
                      <span class="required">*</span>
                    </label>
                    <g-input
                      v-model="form.dateTo"
                      :type="!isEditable ? 'readonly' : 'date'"
                      outlined
                      dense
                      :error="
                        showValidation &&
                        (!form.dateTo ||
                          (form.dateFrom &&
                            form.dateTo &&
                            new Date(form.dateFrom) > new Date(form.dateTo)))
                      "
                      :error-message="
                        showValidation && !form.dateTo
                          ? 'End date is required'
                          : showValidation &&
                            form.dateFrom &&
                            form.dateTo &&
                            new Date(form.dateFrom) > new Date(form.dateTo)
                          ? 'End date must be after start date'
                          : ''
                      "
                      :min="minDate"
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                <!-- Days Summary -->
                <div
                  v-if="
                    form.dateFrom &&
                    form.dateTo &&
                    new Date(form.dateFrom) <= new Date(form.dateTo)
                  "
                  class="q-mt-sm text-center"
                >
                  <q-chip color="primary" text-color="white" class="q-px-md">
                    <q-icon name="calendar_today" size="16px" class="q-mr-sm" />
                    {{ calculateDays() }}
                    {{ calculateDays() === 1 ? "day" : "days" }}
                  </q-chip>
                </div>
              </div>

              <!-- Reason -->
              <div class="form-group">
                <label class="form-label">
                  Reason For Filing
                  <span class="required">*</span>
                </label>
                <g-input
                  v-model="form.reason"
                  :type="!isEditable ? 'readonly' : 'textarea'"
                  outlined
                  dense
                  class="reason-textarea"
                  :readonly="!isEditable"
                  :error="
                    showValidation &&
                    (!form.reason ||
                      form.reason.trim().length < 10 ||
                      form.reason.trim().length > 500)
                  "
                  :error-message="
                    showValidation && !form.reason
                      ? 'Reason is required'
                      : showValidation &&
                        form.reason &&
                        form.reason.trim().length < 10
                      ? 'Reason must be at least 10 characters'
                      : showValidation &&
                        form.reason &&
                        form.reason.trim().length > 500
                      ? 'Reason must not exceed 500 characters'
                      : ''
                  "
                  :counter="isEditable"
                  maxlength="500"
                  placeholder="Please provide a detailed reason for your leave request"
                />
              </div>

              <!-- Attachment -->
              <div class="form-group attachment-section">
                <label class="attachment-label">
                  <q-icon name="attach_file" size="18px" />
                  <span class="label">Attachment</span>
                  <q-chip size="sm" color="grey-4" text-color="grey-8" dense
                    >Optional</q-chip
                  >
                </label>
                <g-input
                  v-model="form.attachment"
                  type="file"
                  :readonly="!isEditable"
                  placeholder="Choose file to attach (if any)"
                />
              </div>
            </div>
          </div>
        </q-form>
      </template>

      <template #DialogSubmitActions>
        <div
          v-if="
            filing?.status.key === 'REJECTED' ||
            filing?.status.key === 'APPROVED'
          "
        >
          <q-btn
            no-caps
            unelevated
            label="Close"
            type="button"
            class="cancel-btn"
            v-close-popup
          />
        </div>

        <div v-else-if="!loadingCredits && leaveCredits.length === 0">
          <q-btn
            no-caps
            unelevated
            label="Close"
            type="button"
            class="cancel-btn"
            v-close-popup
          />
        </div>

        <div v-else class="row q-gutter-sm">
          <GButton
            no-caps
            unelevated
            class="cancel-btn"
            variant="tonal"
            color="gray"
            type="button"
            @click="
              filing && filing.status?.key === 'PENDING'
                ? cancelRequest()
                : hideDialog()
            "
          >
            <q-icon v-if="filing" name="block" size="16px" class="q-mr-xs" />
            {{ filing ? "Cancel Request" : "Cancel" }}
          </GButton>
          <GButton
            v-if="isEditable"
            no-caps
            unelevated
            :label="filing ? 'Update' : 'Submit'"
            type="button"
            @click="onSubmit"
            class="submit-btn"
            :loading="false"
          >
            <template v-slot:loading>
              <q-spinner-dots />
            </template>
          </GButton>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  src="../../Dashboard/RequestPanelWidget/RequestPanelWidget.scss"
  scoped
></style>

<script lang="ts">
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import GInput from "../../../../components/shared/form/GInput.vue";
import TemplateDialog from "../../../../components/dialog/TemplateDialog.vue";
import GButton from "../../../../components/shared/buttons/GButton.vue";
import { api } from "src/boot/axios";
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { useAuthStore } from "../../../../stores/auth";
import type { Filing } from "../../Dashboard/RequestPanelWidget/types/filing.types";
import type {
  CreateFilingRequest,
  UpdateFilingRequest,
} from "src/types/filing.types";
import { AxiosError } from "axios";

interface FormData {
  vacation: string;
  sick: string;
  emergency: string;
  compensationType: string;
  leaveType: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  attachment: {
    id: number;
    name?: string;
    url?: string;
    originalName?: string;
  } | null;
}

interface LeaveCredit {
  id: number;
  employee: {
    accountId: string;
    employeeCode: string;
    name: string;
    email: string;
    department: string;
    position: string;
    role: string;
    payrollGroup: string;
    employmentStatus: string;
    hireDate: string | null;
  };
  plan: {
    id: number;
    planName: string;
    leaveType: {
      id: number;
      name: string;
      code: string;
    };
    monthlyAccrual: string;
    renewalType: string;
    rules: any;
    customRenewalDate: string | null;
  };
  credits: {
    current: string;
    used: string;
    carried: string;
    remaining: string;
    total: string;
    totalAccumulated: string;
    formatted: {
      current: string;
      used: string;
      carried: string;
      remaining: string;
      total: string;
      totalAccumulated: string;
    };
  };
  settings: {
    totalAnnualCredits: string;
    monthlyAccrualCredits: string;
    monthDayCreditsAccrual: number;
    leaveCreditsGivenUpfront: string;
    renewalType: string;
    customRenewalDate: string | null;
  };
  dates: {
    effectiveDate: string;
    createdAt: string;
    updatedAt: string;
  };
  status: {
    isActive: boolean;
    label: string;
    badge: string;
  };
}

export default {
  name: "AddViewLeaveFormDialog",
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    filing: {
      type: Object as () => Filing | null,
      default: null,
    },
  },
  emits: ["update:modelValue", "saveDone", "cancelled", "hide"],

  setup(props, { emit }) {
    const q = useQuasar();
    const authStore = useAuthStore();
    const loadingCredits = ref(false);
    const leaveCredits = ref<LeaveCredit[]>([]);
    const selectedLeaveId = ref<number | null>(null);
    const showValidation = ref(false);

    const form = ref<FormData>({
      vacation: "",
      sick: "",
      emergency: "",
      compensationType: "",
      leaveType: "",
      dateFrom: new Date().toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
      reason: "",
      attachment: null,
    });

    // Check if filing is editable (only PENDING or new filings can be edited)
    const isEditable = computed(() => {
      // If no leave credits, user cannot edit
      if (!loadingCredits.value && leaveCredits.value.length === 0) {
        return false;
      }
      // Otherwise, check if filing is editable (only PENDING or new filings can be edited)
      return !props.filing || props.filing.status?.key === "PENDING";
    });

    // Min date for date inputs (30 days ago)
    const minDate = computed(() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString().split("T")[0];
    });

    const leaveTypeOptions = [
      { label: "Vacation Leave", value: "VACATION" },
      { label: "Sick Leave", value: "SICK" },
      { label: "Emergency Leave", value: "EMERGENCY" },
      { label: "Maternity/Paternity Leave", value: "MATERNITY_PATERNITY" },
      { label: "Bereavement Leave", value: "BEREAVEMENT" },
    ];

    const selectLeaveType = (credit: LeaveCredit) => {
      selectedLeaveId.value = credit.id;
      form.value.leaveType = credit.plan.leaveType.code;
    };

    const fetchLeaveCredits = async (accountId: string) => {
      try {
        loadingCredits.value = true;
        const response = await api.get(
          `/hr-configuration/leave/employee/${accountId}/plans`
        );
        if (response.data?.employeePlans) {
          leaveCredits.value = response.data.employeePlans;
        } else {
          leaveCredits.value = [];
        }
      } catch (error) {
        console.error("Failed to fetch leave credits:", error);
        leaveCredits.value = [];
        // Don't show error notification for leave credits as it's not critical
      } finally {
        loadingCredits.value = false;
      }
    };

    const fetchData = async () => {
      // Reset validation state
      showValidation.value = false;

      if (props.filing) {
        form.value.dateFrom = props.filing.timeIn
          ? formatDate(props.filing.timeIn)
          : "";
        form.value.dateTo = props.filing.timeOut
          ? formatDate(props.filing.timeOut)
          : "";
        form.value.reason = props.filing.remarks || "";
        form.value.attachment = props.filing.file || null;

        // Parse leave data if available
        if (
          props.filing.leaveData &&
          typeof props.filing.leaveData === "object"
        ) {
          const leaveData = props.filing.leaveData as {
            compensationType?: string;
            leaveType?: string;
            leaveId?: number;
            employeeLeavePlanId?: number;
          };
          form.value.compensationType = leaveData.compensationType || "";
          form.value.leaveType = leaveData.leaveType || "";
          // Use employeeLeavePlanId if available, fallback to leaveId
          selectedLeaveId.value =
            leaveData.employeeLeavePlanId || leaveData.leaveId || null;
        }
      } else {
        // Create mode - default values
        form.value = {
          vacation: "",
          sick: "",
          emergency: "",
          compensationType: "",
          leaveType: "",
          dateFrom: new Date().toISOString().split("T")[0],
          dateTo: new Date().toISOString().split("T")[0],
          reason: "",
          attachment: null,
        };
      }

      // Fetch leave credits for current user
      if (authStore.accountInformation?.id) {
        await fetchLeaveCredits(authStore.accountInformation.id);
      }
    };

    const validateForm = () => {
      const errors: string[] = [];

      // Validate leave type selection
      if (!selectedLeaveId.value) {
        errors.push("Please select a leave type");
      }

      // Validate compensation type
      if (!form.value.compensationType) {
        errors.push("Please select a compensation type");
      }

      // Validate dates
      if (!form.value.dateFrom) {
        errors.push("Please select a start date");
      }
      if (!form.value.dateTo) {
        errors.push("Please select an end date");
      }

      // Validate date range
      if (form.value.dateFrom && form.value.dateTo) {
        const fromDate = new Date(form.value.dateFrom);
        const toDate = new Date(form.value.dateTo);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if dates are too far in the past (reasonable limit)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        if (fromDate < thirtyDaysAgo) {
          errors.push("Start date cannot be more than 30 days in the past");
        }

        if (toDate < thirtyDaysAgo) {
          errors.push("End date cannot be more than 30 days in the past");
        }

        if (fromDate > toDate) {
          errors.push("Start date cannot be after end date");
        }

        // Calculate number of days
        const daysDiff =
          Math.floor(
            (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        // Check if user has enough leave credits
        if (
          selectedLeaveId.value &&
          form.value.compensationType === "WITH_PAY"
        ) {
          const selectedLeave = leaveCredits.value.find(
            (credit) => credit.id === selectedLeaveId.value
          );
          if (selectedLeave) {
            const remainingCredits = parseFloat(
              selectedLeave.credits.remaining
            );
            if (daysDiff > remainingCredits) {
              errors.push(
                `Insufficient leave credits. You have ${remainingCredits} days remaining but requested ${daysDiff} days`
              );
            }
          }
        }
      }

      // Validate reason
      if (!form.value.reason || form.value.reason.trim().length === 0) {
        errors.push("Please provide a reason for filing");
      } else if (form.value.reason.trim().length < 10) {
        errors.push("Reason must be at least 10 characters long");
      } else if (form.value.reason.trim().length > 500) {
        errors.push("Reason must not exceed 500 characters");
      }

      return errors;
    };

    const onSubmit = async () => {
      // Show validation errors
      showValidation.value = true;

      // Prevent submission if no leave plans assigned
      if (!loadingCredits.value && leaveCredits.value.length === 0) {
        q.notify({
          type: "negative",
          message:
            "You cannot file a leave form because you have no leave plans assigned.",
          position: "top",
        });
        return;
      }

      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        q.notify({
          type: "negative",
          message: validationErrors.join("<br>"),
          html: true,
          position: "top",
        });
        return;
      }

      // Format dates for display
      const displayDateFrom = new Date(form.value.dateFrom).toLocaleDateString(
        "en-US",
        {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }
      );
      const displayDateTo = new Date(form.value.dateTo).toLocaleDateString(
        "en-US",
        {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }
      );

      // Get leave type label from selected leave credit
      const selectedLeave = leaveCredits.value.find(
        (credit) => credit.id === selectedLeaveId.value
      );
      const leaveTypeLabel = selectedLeave?.plan.leaveType.name || "Leave";

      // Show confirmation dialog
      q.dialog({
        title: "Confirm Leave Filing",
        message: `Are you sure you want to file ${leaveTypeLabel} from ${displayDateFrom} to ${displayDateTo}?`,
        ok: "Yes",
        cancel: "No",
        html: true,
      }).onOk(async () => {
        q.loading.show();
        const baseParams: CreateFilingRequest = {
          type: "LEAVE",
          accountId: authStore.accountInformation?.id
            ? Number(authStore.accountInformation.id)
            : 0,
          date: new Date(form.value.dateFrom).toISOString().split("T")[0],
          filingType: "LEAVE",
          dateFrom: formatDateForSubmit(form.value.dateFrom),
          dateTo: formatDateForSubmit(form.value.dateTo),
          reason: form.value.reason,
          fileId: form.value.attachment?.id
            ? Number(form.value.attachment.id)
            : null,
        };

        // Calculate number of days
        const days = calculateDays();

        // Get selected leave credit details
        const selectedLeaveCredit = leaveCredits.value.find(
          (credit) => credit.id === selectedLeaveId.value
        );
        const leaveTypeCode = selectedLeaveCredit?.plan.leaveType.code || "";

        // Add leaveData as JSON for storage
        baseParams.leaveData = {
          compensationType: form.value.compensationType,
          leaveType: leaveTypeCode,
          leaveId: selectedLeaveId.value,
          employeeLeavePlanId: selectedLeaveId.value, // Same as leaveId - this is the employee's leave plan assignment
          days: days,
        } as any;

        // For leave filings, use dateFrom as the main date
        baseParams.date = new Date(form.value.dateFrom).toISOString();

        const apiCall = props.filing
          ? api.patch("hr-filing/filing", {
              ...baseParams,
              id: props.filing.id,
            } as UpdateFilingRequest)
          : api.post("hr-filing/filing", baseParams);

        apiCall
          .then((response) => {
            console.log("Received response", response);
            emit("update:modelValue", false);
            emit("saveDone");
          })
          .catch((error) => {
            handleAxiosError(q, error);
          })
          .finally(() => {
            q.loading.hide();
          });
      });
    };

    const cancelRequest = async () => {
      if (!props.filing || !props.filing.id) return;

      q.dialog({
        title: "Cancel Filing Request",
        message: "Are you sure you want to cancel this filing request?",
        ok: {
          label: "Yes, Cancel Request",
          color: "negative",
          unelevated: true,
        },
        cancel: {
          label: "No",
          color: "grey",
          outline: true,
        },
        persistent: true,
      }).onOk(async () => {
        q.loading.show();
        try {
          await api.post("/hr-filing/filing/cancel", {
            id: props.filing!.id,
            remarks: "Cancelled by requestor",
          });

          q.notify({
            type: "positive",
            message: "Filing request cancelled successfully",
          });

          {
            emit("update:modelValue", false);
          }
          emit("cancelled");
          emit("saveDone"); // For compatibility with existing refresh logic
        } catch (error) {
          if (error instanceof Error) {
            handleAxiosError(q, error as AxiosError);
          }
        } finally {
          q.loading.hide();
        }
      });
    };

    const formatDateForSubmit = (date: string | Date): string => {
      const originalDate = new Date(date);

      const formattedDate =
        originalDate.getFullYear() +
        "-" +
        String(originalDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(originalDate.getDate()).padStart(2, "0");

      return formattedDate;
    };

    const formatDate = (dateInput: string | { raw: Date }): string => {
      let date: Date;

      if (typeof dateInput === "string") {
        date = new Date(dateInput);
      } else if (
        dateInput &&
        typeof dateInput === "object" &&
        "raw" in dateInput
      ) {
        date = dateInput.raw;
      } else {
        throw new Error("Invalid date input");
      }

      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const hideDialog = () => {
      {
        emit("update:modelValue", false);
      }
    };

    const calculateDays = () => {
      if (!form.value.dateFrom || !form.value.dateTo) return 0;
      const fromDate = new Date(form.value.dateFrom);
      const toDate = new Date(form.value.dateTo);
      return (
        Math.floor(
          (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      );
    };

    const getLeaveIcon = (leaveCode: string) => {
      const icons: Record<string, string> = {
        VACATION: "beach_access",
        SICK: "local_hospital",
        EMERGENCY: "warning",
        MATERNITY_PATERNITY: "child_care",
        BEREAVEMENT: "sentiment_very_dissatisfied",
      };
      return icons[leaveCode] || "event_busy";
    };

    return {
      q,
      form,
      isEditable,
      minDate,
      leaveTypeOptions,
      leaveCredits,
      loadingCredits,
      selectedLeaveId,
      showValidation,
      selectLeaveType,
      fetchData,
      onSubmit,
      cancelRequest,
      hideDialog,
      calculateDays,
      getLeaveIcon,
      formatDateForSubmit,
      formatDate,
    };
  },
};
</script>

<style scoped lang="scss">
.leave-form-content {
  max-height: 80dvh;
  padding: 16px !important;

  @media (max-width: 768px) {
    max-height: 100dvh;
  }

  @media (max-width: 599px) {
    max-height: 85dvh;
  }
}

.leave-form-content .section {
  margin-bottom: 24px;
}

.leave-form-content .section:last-child {
  margin-bottom: 0;
}

.leave-form-content .section-title .required {
  color: var(--q-negative);
  font-weight: normal;
}

.leave-credits-section {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.leave-credits-grid {
  display: grid;
  gap: 12px;
}

.leave-credit-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover:not(.disabled) {
    border-color: var(--q-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.selected {
    border-color: var(--q-primary);
    background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
    box-shadow: 0 4px 16px rgba(var(--q-primary-rgb), 0.15);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--q-primary);
    }
  }

  &.error {
    border-color: var(--q-negative);
    background-color: #fff5f5;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .leave-type-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .leave-type-name {
      font-size: 15px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .selection-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #dee2e6;
      position: relative;
      transition: all 0.3s ease;

      &.selected {
        border-color: var(--q-primary);
        background-color: var(--q-primary);

        &::after {
          content: "✓";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
      }
    }
  }

  .leave-credits-info {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .credits-label {
      font-size: 13px;
      color: #6c757d;
    }

    .credits-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--q-primary);

      .total {
        font-size: 14px;
        color: #6c757d;
        font-weight: normal;
      }
    }
  }
}

.form-section {
  .form-group {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    margin-bottom: 8px;
    display: block;

    .required {
      color: var(--q-negative);
    }
  }

  .compensation-options {
    display: flex;
    gap: 24px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 8px;

    .q-radio {
      font-size: 14px;

      &:deep(.q-radio__label) {
        color: #495057;
        font-weight: 500;
      }
    }
  }

  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .reason-textarea {
    &:deep(textarea) {
      min-height: 100px;
      resize: vertical;
    }
  }

  .attachment-label {

    .q-icon {
      color: #6c757d;
    }
  }
}

.dialog-footer {
  border-top: 1px solid #e9ecef;
  padding: 16px 24px !important;
  background-color: #f8f9fa;

  .q-btn {
    min-width: 100px;
    font-weight: 600;

    &.cancel-btn {
      background-color: #e9ecef;
      color: #495057;

      &:hover {
        background-color: #dee2e6;
      }
    }

    &.submit-btn {
      background-color: var(--q-primary);
      color: white;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.error-message {
  font-size: 12px;
  color: var(--q-negative);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;

  .q-icon {
    font-size: 14px;
  }
}

.loading-state {
  text-align: center;
  padding: 40px;

  .q-spinner {
    margin-bottom: 16px;
  }

  .loading-text {
    color: #6c757d;
    font-size: 14px;
  }
}

.no-leave-plans {
  text-align: center;
  padding: 40px;

  .warning-icon {
    margin-bottom: 16px;
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
  }

  .description {
    color: #6c757d;
    margin-bottom: 8px;
  }

  .hint {
    font-size: 13px;
    color: #868e96;
  }
}
</style>
