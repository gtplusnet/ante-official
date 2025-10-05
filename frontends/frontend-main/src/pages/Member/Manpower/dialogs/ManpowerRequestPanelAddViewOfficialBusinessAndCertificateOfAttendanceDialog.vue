<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @before-show="fetchData"
    @hide="$emit('hide')"
  >
    <TemplateDialog
      :icon="
        officialBusinessAndCertificateOfAttendanceData ==
        'OFFICIAL_BUSINESS_FORM'
          ? 'work_history'
          : 'event_available'
      "
      :icon-color="officialBusinessAndCertificateOfAttendanceData ==
        'OFFICIAL_BUSINESS_FORM'
          ? '#1e88e5'
          : '#43a047'"
      width="650px"
      :scrollable="false"
    >
      <template #DialogTitle>
        <span class="ob-ca-title">
          {{
            officialBusinessAndCertificateOfAttendanceData ==
            "OFFICIAL_BUSINESS_FORM"
              ? "Official Business Form"
              : "Certificate of Attendance"
          }}
          {{ filing ? `(${filing?.status.label})` : "" }}
        </span>
      </template>

      <template #DialogContent>
        <q-form
          @submit.prevent="onSubmit"
          style="width: 100%"
          class="q-pa-md form-content"
        >
          <div class="column form-container">
            <div class="row q-col-gutter-md q-pb-md">
              <div class="col-6">
                <label class="text-label-large">Date From</label>
                <g-input
                  required
                  class="text-body-medium"
                  v-model="form.dateFrom"
                  :type="!isEditable ? 'readonly' : 'date'"
                  dense
                  outlined
                />
              </div>
              <div class="col-6">
                <label class="text-label-large">Date To</label>
                <g-input
                  required
                  class="text-body-medium"
                  v-model="form.dateTo"
                  :type="!isEditable ? 'readonly' : 'date'"
                  dense
                  outlined
                />
              </div>
            </div>
            <div class="row q-col-gutter-md q-pb-md">
              <div class="col-6">
                <label class="text-label-large">Time From</label>
                <q-input
                  required
                  v-model="form.timeFrom"
                  class="ipt text-body-medium"
                  type="time"
                  dense
                  outlined
                  :readonly="!isEditable"
                />
              </div>
              <div class="col-6">
                <label class="text-label-large">Time To</label>
                <q-input
                  required
                  v-model="form.timeTo"
                  class="ipt text-body-medium"
                  type="time"
                  dense
                  outlined
                  :readonly="!isEditable"
                />
              </div>
            </div>
            <div :class="!isEditable ? 'q-pb-md' : ''">
              <label class="text-label-large"
                >Reason For Filing (Optional)</label
              >
              <g-input
                class="text-body-medium"
                v-model="form.reason"
                :type="!isEditable ? 'readonly' : 'textarea'"
                placeholder="Type your reason"
                dense
                outlined
              />
            </div>
            <div>
              <label class="text-label-large">Attachment</label>
              <g-input
                class="text-body-medium"
                v-model="form.attachment"
                type="file"
                :readonly="!isEditable"
              />
            </div>
          </div>

          <div class="row justify-end q-mt-lg action-buttons">
            <div
              v-if="
                filing?.status.key === 'REJECTED' ||
                filing?.status.key === 'APPROVED'
              "
            >
              <g-button
                no-caps
                unelevated
                variant="tonal"
                label="Close"
                type="button"
                color="light-grey"
                v-close-popup
              />
            </div>

            <div v-else>
              <g-button
                no-caps
                unelevated
                variant="tonal"
                type="button"
                color="light-grey"
                class="q-mr-sm"
                @click="
                  filing && filing.status?.key === 'PENDING'
                    ? cancelRequest()
                    : hideDialog()
                "
              >
                <q-icon
                  v-if="filing"
                  name="block"
                  size="16px"
                  class="q-mr-xs"
                />
                {{ filing ? "Cancel Request" : "Cancel" }}
              </g-button>
              <g-button
                v-if="isEditable"
                no-caps
                unelevated
                :label="filing ? 'Update' : 'Submit'"
                type="submit"
                color="secondary"
              />
            </div>
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  src="../../Dashboard/RequestPanelWidget/RequestPanelWidget.scss"
  scoped
></style>

<style lang="scss" scoped>
@media (max-width: 768px) {
  .form-container {
    height: calc(100dvh - 220px);
  }
}
@media (max-width: 599px) {
  .form-content {
    padding: 12px;
  }

  .ob-ca-title {
    font-size: 16px;
  }

  .action-buttons {
    bottom: -70px;
    right: 12px;
    position: absolute;
    width: 100%;
  }
}
</style>

<script lang="ts">
import { ref, computed } from "vue";
import { defineAsyncComponent } from 'vue';
import GInput from "../../../../components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { formatTime } from "../../../../utility/formatter";
import type { Filing } from "../../Dashboard/RequestPanelWidget/types/filing.types";
import { AxiosError } from "axios";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface FormData {
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  reason: string;
  attachment: {
    id: number;
    name?: string;
    url?: string;
    originalName?: string;
  } | null;
}

export default {
  name: "CreateOfficialBusinessFormDialog",
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
    officialBusinessAndCertificateOfAttendanceData: {
      type: String,
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
    const form = ref<FormData>({
      dateFrom: "",
      dateTo: "",
      timeFrom: "",
      timeTo: "",
      reason: "",
      attachment: null,
    });

    // Check if filing is editable (only PENDING or new filings can be edited)
    const isEditable = computed(
      () => !props.filing || props.filing.status?.key === "PENDING"
    );

    const fetchData = () => {
      if (props.filing) {
        // Edit mode - populate with existing data
        form.value.dateFrom = props.filing.timeIn
          ? formatDate(props.filing.timeIn)
          : "";
        form.value.dateTo = props.filing.timeOut
          ? formatDate(props.filing.timeOut)
          : "";
        form.value.timeFrom = props.filing.timeIn
          ? formatTime(props.filing.timeIn)
          : "";
        form.value.timeTo = props.filing.timeOut
          ? formatTime(props.filing.timeOut)
          : "";
        form.value.reason = props.filing.remarks || "";
        form.value.attachment = props.filing.file || null;
      } else {
        // Create mode - default values
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        form.value.dateFrom = formattedDate;
        form.value.dateTo = formattedDate;
        form.value.timeFrom = "09:00";
        form.value.timeTo = "18:00";
        form.value.reason = "";
        form.value.attachment = null;
      }
    };

    const onSubmit = () => {
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

      // Get form type label
      const formTypeLabel =
        props.officialBusinessAndCertificateOfAttendanceData ===
        "OFFICIAL_BUSINESS_FORM"
          ? "Official Business Form"
          : "Certificate of Attendance";

      // Show confirmation dialog
      q.dialog({
        title: `Confirm ${formTypeLabel}`,
        message: `Are you sure you want to file ${formTypeLabel} from ${displayDateFrom} to ${displayDateTo}?`,
        ok: "Yes",
        cancel: "No",
        html: true,
      }).onOk(() => {
        q.loading.show();
        const params = {
          filingType:
            props.officialBusinessAndCertificateOfAttendanceData ===
            "OFFICIAL_BUSINESS_FORM"
              ? "OFFICIAL_BUSINESS_FORM"
              : "CERTIFICATE_OF_ATTENDANCE",
          timeIn:
            formatDateForSubmit(form.value.dateFrom) +
            " " +
            form.value.timeFrom,
          timeOut:
            formatDateForSubmit(form.value.dateTo) + " " + form.value.timeTo,
          reason: form.value.reason,
          fileId: form.value.attachment?.id || null,
        };

        const apiCall = props.filing
          ? api.patch("hr-filing/filing", { ...params, id: props.filing.id })
          : api.post("hr-filing/filing", params);

        apiCall
          .then(() => {
            console.log("Form submitted successfully", params);
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

    const cancelRequest = async () => {
      if (!props.filing || !props.filing.id) return;

      const formTypeLabel =
        props.officialBusinessAndCertificateOfAttendanceData ===
        "OFFICIAL_BUSINESS_FORM"
          ? "Official Business"
          : "Certificate of Attendance";

      q.dialog({
        title: "Cancel Filing Request",
        message: `Are you sure you want to cancel this ${formTypeLabel} filing request?`,
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
            message: `${formTypeLabel} filing cancelled successfully`,
          });

          emit("update:modelValue", false);
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

    const hideDialog = () => {
      emit("update:modelValue", false);
    };

    return {
      q,
      form,
      isEditable,
      fetchData,
      onSubmit,
      cancelRequest,
      hideDialog,
    };
  },
};
</script>
