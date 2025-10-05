<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="800px">
      <template #DialogTitle> View Leave Plan Details </template>
      <template #DialogContent>
        <section class="leave-plan-details q-pa-md">
          <div class="text-title-medium text-dark">Plan Details</div>
          <table class="planDetails-container column">
            <tbody class="text-body-small">
              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Plan Name
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.planName }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can unused leaves be carried over upon renewal?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.rules.canCarryOver ? "Yes" : "No" }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Max Number of Credits
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.credits.maxCarryOver || "0.00" }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can unused leaves be converted to cash?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.rules.canConvertToCash ? "Yes" : "No" }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Max Number of Credits
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.credits.maxCashConversion || "0.00" }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can an employee file a leave on the same day?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ planInformation?.rules.canFileSameDay ? "Yes" : "No" }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Does this policy allow late filing?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    `${
                      planInformation?.rules.allowLateFiling ? "Yes" : "No"
                    }, Atleast ${
                      planInformation?.rules.advanceFilingDays || "0"
                    } days before`
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Do you limit the number of consecutive days an employee can
                  file (New Leave Type) for?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    `${
                      planInformation?.rules.isLimitedConsecutiveFilingDays
                        ? "Yes"
                        : "No"
                    }, Maximum of ${
                      planInformation?.rules.maxConsecutiveDays || "0"
                    }`
                  }}
                  <br />
                  consecutive days
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can employee file for future leaves against future credits
                  (advance filing)?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    `${
                      planInformation?.rules.canFileAgainstFutureCredits
                        ? "Yes"
                        : "No"
                    }, Maximum of ${
                      planInformation?.rules.maxAdvanceFilingDays || "0"
                    }`
                  }}
                  <br />
                  consecutive days
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Is attachment mandatory?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    planInformation?.rules.isAttachmentMandatory ? "Yes" : "No"
                  }}
                </td>
              </tr>
              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  When does it renew?
                </td>
                <td class="planDetails-value col-4 text-right">
                  <span>{{
                    formatRenewalType(planInformation?.renewal?.type)
                  }}</span>
                  <br />
                  <span
                    v-if="planInformation?.renewal?.customDate"
                    class="text-grey-6"
                    >{{ planInformation?.renewal?.customDate?.dateFull }}</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-right q-pt-md">
            <GButton
              label="Close"
              type="button"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style
  scoped
  lang="scss"
  src="../../Configuration/ServiceIncentiveLeave/ServiceIncentiveLeaveMenuPage.scss"
></style>

<script lang="ts">
import { LeavePlanResponse } from "@shared/response/leave-plan-response.interface";
import { defineComponent } from "vue";
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default defineComponent({
  name: "ViewPlanDetailsDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    planInformation: {
      type: Object as () => LeavePlanResponse | null,
      default: () => ({}),
    },
  },
  setup() {
    const formatRenewalType = (type: string | null | undefined) => {
      if (!type) return "-";
      return type
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return {
      formatRenewalType,
    };
  },
});
</script>
