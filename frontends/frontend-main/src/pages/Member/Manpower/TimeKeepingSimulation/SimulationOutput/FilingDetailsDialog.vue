<template>
  <q-dialog v-model="dialogModel">
    <TemplateDialog>
      <template #DialogIcon>
        <q-icon name="info" size="24px" />
      </template>

      <template #DialogTitle> Filing Details </template>
      <template #DialogContent>
        <section v-if="filing">
          <!-- Dynamic Component based on filing type -->
          <div v-if="filingDisplayComponent" class="q-pa-md">
            <component :is="filingDisplayComponent" :filing="filing" />
          </div>

          <!-- Fallback for unknown filing types -->
          <div v-else>
            <div class="row q-mb-md">
              <div class="col-12">
                <div class="text-title-medium">{{ filing.filingType?.label || "Filing" }} Request</div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-label-medium text-grey">Filing ID</div>
                <div class="text-body-small">{{ filing.id }}</div>
              </div>
              <div class="col-6">
                <div class="text-label-medium text-grey">Status</div>
                <q-badge :color="getStatusColor(filing.status.label)" :label="filing.status.label" />
              </div>
              <div class="col-6">
                <div class="text-label-medium text-grey">Date Filed</div>
                <div class="text-body-small">{{ formatDate(filing.createdAt) }}</div>
              </div>
              <div class="col-6" v-if="filing.remarks">
                <div class="text-label-medium text-grey">Remarks</div>
                <div class="text-body-small">{{ filing.remarks }}</div>
              </div>
            </div>
          </div>

          <!-- Approval Information -->
          <div v-if="filing.status.key === 'APPROVED' && filing.approvedBy" class="q-pa-md q-pt-md border-top">
            <div class="text-label-medium text-grey">Approved By</div>
            <div class="text-body-small">{{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}</div>
            <div class="text-body-small" v-if="filing.approvedAt">{{ formatDate(filing.approvedAt) }}</div>
          </div>

          <!-- Rejection Information -->
          <div v-if="filing.status.key === 'REJECTED' && filing.remarks" class="q-mt-md q-pa-md q-pt-md border-top">
            <div class="text-label-medium text-grey">Rejection Remarks</div>
            <div class="text-body-small">{{ filing.remarks }}</div>
          </div>

          <!-- Action buttons for pending filings -->
          <div v-if="filing.status.key === 'PENDING'" class="q-mt-md q-pt-md border-top text-right">
            <GButton
              variant="filled"
              color="negative"
              @click="cancelRequest"
              class="text-label-large"
              icon="block"
              label="Cancel Request"
            />
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { date, useQuasar } from "quasar";
import { api } from "src/boot/axios";
import OvertimeFilingDisplay from "src/components/dialog/FilingApprovalDialog/components/OvertimeFilingDisplay.vue";
import LeaveFilingDisplay from "src/components/dialog/FilingApprovalDialog/components/LeaveFilingDisplay.vue";
import ScheduleAdjustmentFilingDisplay from "src/components/dialog/FilingApprovalDialog/components/ScheduleAdjustmentFilingDisplay.vue";
import OfficialBusinessFilingDisplay from "src/components/dialog/FilingApprovalDialog/components/OfficialBusinessFilingDisplay.vue";
import CertificateOfAttendanceFilingDisplay from "src/components/dialog/FilingApprovalDialog/components/CertificateOfAttendanceFilingDisplay.vue";
import { FilingResponse } from "src/types/filing.types";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

export default defineComponent({
  name: "FilingDetailsDialog",
  components: {
    OvertimeFilingDisplay,
    LeaveFilingDisplay,
    ScheduleAdjustmentFilingDisplay,
    OfficialBusinessFilingDisplay,
    CertificateOfAttendanceFilingDisplay,
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    filing: {
      type: Object as PropType<FilingResponse | null>,
      default: null,
    },
  },
  emits: ["update:modelValue", "cancelled"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const filingDisplayComponent = computed(() => {
      if (!props.filing) return null;

      const componentMap = {
        OVERTIME: "OvertimeFilingDisplay",
        LEAVE: "LeaveFilingDisplay",
        SCHEDULE_ADJUSTMENT: "ScheduleAdjustmentFilingDisplay",
        OFFICIAL_BUSINESS_FORM: "OfficialBusinessFilingDisplay",
        CERTIFICATE_OF_ATTENDANCE: "CertificateOfAttendanceFilingDisplay",
      };

      return componentMap[props.filing.filingType?.key as keyof typeof componentMap];
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case "Approved":
          return "positive";
        case "Rejected":
          return "negative";
        case "Cancelled":
          return "grey";
        default:
          return "warning";
      }
    };

    const formatDate = (dateStr: string) => {
      return date.formatDate(dateStr, "MMM DD, YYYY hh:mm A");
    };

    const cancelRequest = async () => {
      if (!props.filing || !props.filing.id) return;

      $q.dialog({
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
        $q.loading.show();
        try {
          await api.post("/hr-filing/filing/cancel", {
            id: props.filing!.id,
            remarks: "Cancelled by requestor",
          });

          $q.notify({
            type: "positive",
            message: "Filing request cancelled successfully",
          });

          dialogModel.value = false;
          emit("cancelled");
        } catch (error) {
          console.error("Error cancelling filing:", error);
          $q.notify({
            type: "negative",
            message: "Failed to cancel filing request",
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    return {
      dialogModel,
      filingDisplayComponent,
      getStatusColor,
      formatDate,
      cancelRequest,
    };
  },
});
</script>

<style scoped>
.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>
