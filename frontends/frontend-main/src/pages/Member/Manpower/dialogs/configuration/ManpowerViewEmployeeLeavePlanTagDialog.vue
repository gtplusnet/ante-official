<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="800px">
      <template #DialogTitle>
        {{ formatName(employeeLeavePlanTagInformation?.employee.name) }} ({{
          employeeLeavePlanTagInformation?.employee.employeeCode
        }})
      </template>
      <template #DialogContent>
        <section class="leave-plan-details q-pa-md">
          <div class="text-dark text-title-medium">Plan Details</div>
          <table class="planDetails-container column">
            <tbody class="text-body-small">
              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Plan Name
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{ employeeLeavePlanTagInformation?.plan.planName }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can unused leaves be carried over upon renewal?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules.canCarryOver
                      ? "Yes"
                      : "No"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Max Number of Credits
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules
                      .maxCarryOverCredits || "0.00"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can unused leaves be converted to cash?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules.canConvertToCash
                      ? "Yes"
                      : "No"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Max Number of Credits
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules
                      .maxCashConversionCredits || "0.00"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can an employee file a leave on the same day?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules.canFileSameDay
                      ? "Yes"
                      : "No"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Does this policy allow late filing?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    `${
                      employeeLeavePlanTagInformation?.plan.rules
                        .allowLateFiling
                        ? "Yes"
                        : "No"
                    }`
                  }}
                  <span
                    v-if="
                      !employeeLeavePlanTagInformation?.plan.rules
                        .allowLateFiling
                    "
                    >, Atleast
                    {{
                      employeeLeavePlanTagInformation?.plan.rules
                        .advanceFilingDays || "0"
                    }}
                    days before</span
                  >
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Do you limit the number of consecutive days an employee can
                  file (New Leave Type) for?
                </td>
                <td
                  class="planDetails-value col-4 row items-center justify-end text-right"
                >
                  <span
                    >{{
                      `${
                        employeeLeavePlanTagInformation?.plan.rules
                          .isLimitedConsecutiveFilingDays
                          ? "Yes"
                          : "No"
                      }`
                    }}
                    <span
                      v-if="
                        employeeLeavePlanTagInformation?.plan.rules
                          .isLimitedConsecutiveFilingDays
                      "
                      >, Maximum of
                      {{
                        employeeLeavePlanTagInformation?.plan.rules
                          .maxConsecutiveDays || "0"
                      }}
                      consecutive days</span
                    ></span
                  >
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Can employee file for future leaves against future credits
                  (advance filing)?
                </td>
                <td
                  class="planDetails-value col-4 row items-center justify-end text-right"
                >
                  <span
                    >{{
                      `${
                        employeeLeavePlanTagInformation?.plan.rules
                          .canFileAgainstFutureCredits
                          ? "Yes"
                          : "No"
                      }`
                    }}
                    <span
                      v-if="
                        employeeLeavePlanTagInformation?.plan.rules
                          .canFileAgainstFutureCredits
                      "
                      >, Maximum of
                      {{
                        employeeLeavePlanTagInformation?.plan.rules
                          .maxAdvanceFilingDays || "0"
                      }}
                      consecutive days</span
                    ></span
                  >
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Is attachment mandatory?
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.plan.rules
                      .isAttachmentMandatory
                      ? "Yes"
                      : "No"
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  When does it renew?
                </td>
                <td class="planDetails-value col-4 text-right">
                  <span>{{
                    employeeLeavePlanTagInformation?.plan.renewalType
                  }}</span>
                  <br />
                  <span
                    v-if="
                      employeeLeavePlanTagInformation?.plan.customRenewalDate
                    "
                    class="text-grey-6"
                    >{{
                      employeeLeavePlanTagInformation?.plan.customRenewalDate
                        .dateFull
                    }}</span
                  >
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Initial leave credits
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.settings.totalAnnualCredits
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Total leave credits given upfront
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.settings
                      .leaveCreditsGivenUpfront
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Credits accrue over time per month
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.settings
                      .monthlyAccrualCredits
                  }}
                </td>
              </tr>

              <tr class="planDetails-item row justify-between">
                <td class="planDetails-label col-8 row items-center">
                  Number of days per month
                </td>
                <td class="planDetails-value col-4 text-right">
                  {{
                    employeeLeavePlanTagInformation?.settings
                      .monthDayCreditsAccrual
                  }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-right">
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
import { defineComponent } from "vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { formatName } from "src/utility/formatter";

export default defineComponent({
  name: "ViewEmployeeLeavePlanTagDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    employeeLeavePlanTagInformation: {
      type: [Object, null],
      default: () => ({}),
    },
  },
  setup() {
    return {
      formatName,
    };
  },
});
</script>
