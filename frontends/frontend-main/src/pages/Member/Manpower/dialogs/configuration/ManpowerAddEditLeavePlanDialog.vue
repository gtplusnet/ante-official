<template>
  <q-dialog ref="dialog" persistent @before-show="fetchData">
    <TemplateDialog minWidth="600px">
      <template #DialogTitle>
        {{ planInformation ? 'Edit Leave Plan' : 'Add Leave Plan' }}
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="save">
          <div class="leave-plan-container">
            <g-input required type="text" label="Leave Plan Name" v-model="formData.leavePlanName" />
            <!-- Leave Details Rules -->
            <div class="q-pt-md">
              <div class="text-title-medium">Set Rules For New Plan Type Policy</div>
              <div class="text-body-medium text-grey q-mb-md">Edit the accrual and filing rules based on your company policy, then assign employees to this plan</div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Can unused leave be carried over upon renewal?</div>
                  <q-radio required v-model="formData.canCarryOver" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.canCarryOver" size="sm" :val="false" label="No" />
                </div>
                <div v-if="formData.canCarryOver" class="q-mt-sm">
                  <div class="text-label-large">Enter max no. of credits</div>
                  <q-input outlined dense class="input q-mt-xxs text-body-medium" required type="number" min="0" v-model="formData.maxCarryOverCredits" />
                </div>
              </div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Can unused leave be converted to cash?</div>
                  <q-radio required v-model="formData.canConvertToCash" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.canConvertToCash" size="sm" :val="false" label="No" />
                </div>
                <div v-if="formData.canConvertToCash" class="q-mt-sm">
                  <div class="text-label-large">Enter max no. of credits</div>
                  <q-input outlined dense class="input q-mt-xxs text-body-medium" required type="number" min="0" v-model="formData.maxCashConversionCredits" />
                </div>
              </div>

              <div class="leave-details-container">
                <div class="text-body-small">
                  <div class="text-label-large">When does it renew?</div>
                  <q-radio required v-model="formData.renewalType" size="sm" val="START_OF_YEAR" label="Start of the year" />
                  <q-radio required v-model="formData.renewalType" size="sm" val="HIRING_ANNIVERSARY" label="Hiring Anniversary" />
                  <q-radio required v-model="formData.renewalType" size="sm" val="CUSTOM_DATE" label="Custom" />
                  <q-radio required v-model="formData.renewalType" size="sm" val="NEVER" label="Never" />
                </div>
                <div v-if="formData.renewalType === 'CUSTOM_DATE' || formData.renewalType === 'HIRING_ANNIVERSARY'" class="q-mt-sm">
                  <g-input outlined dense :required="formData.renewalType === 'CUSTOM_DATE' || formData.renewalType === 'HIRING_ANNIVERSARY'" class="global-input" :label="formData.renewalType === 'CUSTOM_DATE' ? 'Renewal Date:' : 'Select Date:'" type="date" v-model="formData.renewalInputType" />
                </div>
              </div>
            </div>
            <!-- Leave Request Settings -->
            <div class="q-pt-md">
              <div class="text-title-medium">Request Filing</div>
              <div class="text-body-medium text-grey q-mb-md">Edit the accrual and filing rules based on your company policy, then assign employees to this plan</div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Can an employee file a leave on the same day?</div>
                  <q-radio required v-model="formData.canFileSameDay" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.canFileSameDay" size="sm" :val="false" label="No" />
                </div>
              </div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Does this policy allow late filing?</div>
                  <q-radio required v-model="formData.allowLateFiling" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.allowLateFiling" size="sm" :val="false" label="No" />
                </div>
                <div v-if="formData.allowLateFiling === false" class="q-mt-sm">
                  <div class="text-label-large">Atleast ___ days before.</div>
                  <q-input outlined dense class="input q-mt-xxs" required type="number" min="0" v-model="formData.advanceFilingDays" />
                </div>
              </div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Do you limit the number of the consecutive days an employee can file (New Leave Type) for?</div>
                  <q-radio required v-model="formData.allowConsecutiveDaysLimit" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.allowConsecutiveDaysLimit" size="sm" :val="false" label="No" />
                </div>
                <div v-if="formData.allowConsecutiveDaysLimit" class="q-mt-sm">
                  <div class="text-label-large">Maximum of ___ consecutive days.</div>
                  <q-input outlined dense class="input q-mt-xxs" required type="number" min="0" v-model="formData.maxConsecutiveDays" />
                </div>
              </div>

              <div class="leave-details-container q-mb-sm">
                <div class="text-body-small">
                  <div class="text-label-large">Can employees file for future leaves against future credits (advance filing)?</div>
                  <q-radio required v-model="formData.canFileAgainstFutureCredits" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.canFileAgainstFutureCredits" size="sm" :val="false" label="No" />
                </div>
                <div v-if="formData.canFileAgainstFutureCredits" class="q-mt-sm">
                  <div class="text-label-large">Maximum of ___ consecutive days.</div>
                  <q-input outlined dense class="input q-mt-xxs" required type="number" min="0" v-model="formData.maxAdvanceFilingDays" />
                </div>
              </div>

              <div class="leave-details-container">
                <div class="text-body-small">
                  <div class="text-label-large">Is attachment mandatory?</div>
                  <q-radio required v-model="formData.isAttachmentMandatory" size="sm" :val="true" label="Yes" />
                  <q-radio required v-model="formData.isAttachmentMandatory" size="sm" :val="false" label="No" />
                </div>
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm justify-end q-pa-md">
            <GButton
              label="Cancel"
              color="primary"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
            <GButton
              :label="planInformation ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style src="src/pages/Member/Manpower/Configuration/ServiceIncentiveLeave/ServiceIncentiveLeaveMenuPage.scss" scoped></style>

<script lang="ts">
import { QDialog, useQuasar } from 'quasar';
import { ref, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import type { Ref } from 'vue';
import GInput from 'src/components/shared/form/GInput.vue';
import { LeaveTypeConfigurationResponse } from '@shared/response';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { LeavePlanResponse } from '@shared/response/leave-plan-response.interface';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'CreateLeavePlanDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    leaveTypeInformation: {
      type: Object as () => LeaveTypeConfigurationResponse | null,
      default: null,
    },
    planInformation: {
      type: Object as () => LeavePlanResponse | null,
      default: null,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);

    interface FormData {
      leaveTypeConfigurationId: number;
      leavePlanName: string;
      canCarryOver: boolean | null;
      maxCarryOverCredits: string | null;
      canConvertToCash: boolean | null;
      maxCashConversionCredits: string | null;
      renewalType: string | null;
      renewalInputType: string | null;
      canFileSameDay: boolean | null;
      allowLateFiling: boolean | null;
      advanceFilingDays: number | null;
      allowConsecutiveDaysLimit: boolean | null;
      maxConsecutiveDays: number | null;
      canFileAgainstFutureCredits: boolean | null;
      maxAdvanceFilingDays: number | null;
      isAttachmentMandatory: boolean | null;
    }

    const formData = ref<FormData>({
      leaveTypeConfigurationId: 0,
      leavePlanName: '',
      canCarryOver: null,
      maxCarryOverCredits: null,
      canConvertToCash: null,
      maxCashConversionCredits: null,
      renewalType: null,
      renewalInputType: null,
      canFileSameDay: null,
      allowLateFiling: null,
      advanceFilingDays: null,
      allowConsecutiveDaysLimit: null,
      maxConsecutiveDays: null,
      canFileAgainstFutureCredits: null,
      maxAdvanceFilingDays: null,
      isAttachmentMandatory: null,
    });

    // Watch for changes in formData
    watch(
      formData as Ref<{
        leaveTypeConfigurationId: number;
        leavePlanName: string | null;
        canCarryOver: boolean | null;
        maxCarryOverCredits: number | null;
        canConvertToCash: boolean | null;
        maxCashConversionCredits: number | null;
        renewalType: boolean | null;
        renewalInputType: string | null;
        canFileSameDay: boolean | null;
        allowLateFiling: boolean | null;
        advanceFilingDays: number | null;
        allowConsecutiveDaysLimit: boolean | null;
        maxConsecutiveDays: number | null;
        canFileAgainstFutureCredits: boolean | null;
        maxAdvanceFilingDays: number | null;
        isAttachmentMandatory: boolean | null;
      }>,
      () => {},
      { deep: true }
    );

    // const validateForm = () => {
    //   // Check each radio button one by one and show specific error message
    //   if (formData.value.canCarryOver === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Can unused leave be carried over upon renewal?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.canConvertToCash === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Can unused leave be converted to cash?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.renewalType === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose one of the following: "Start of the year", "Hiring Anniversary", "Custom", "Never" for When does it renew?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.canFileSameDay === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Can an employee file a leave on the same day?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.allowLateFiling === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Does this policy allow late filing?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.allowConsecutiveDaysLimit === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Do you limit the number of the consecutive days an employee can file (New Leave Type) for?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }

    //   if (formData.value.canFileAgainstFutureCredits === null) {
    //     $q.notify({
    //       type: 'negative',
    //       message: 'Please choose "Yes" or "No" for Can employees file for future leaves against future credits (advance filing)?',
    //       position: 'bottom',
    //     });
    //     return;
    //   }
    // };

    const save = async () => {

      // if (!props.planInformation) {
      //   validateForm();
      //   return;
      // }

      if (props.planInformation) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      $q.loading.show();

      const params = {
        leaveTypeConfigurationId: formData.value.leaveTypeConfigurationId,
        planName: formData.value.leavePlanName,
        canCarryOver: formData.value.canCarryOver,
        maxCarryOverCredits: formData.value.canCarryOver ? Number(formData.value.maxCarryOverCredits) : 0,
        canConvertToCash: formData.value.canConvertToCash,
        maxCashConversionCredits: formData.value.canConvertToCash ? Number(formData.value.maxCashConversionCredits) : 0,
        canFileSameDay: formData.value.canFileSameDay,
        allowLateFiling: formData.value.allowLateFiling,
        advanceFilingDays: !formData.value.allowLateFiling ? Number(formData.value.advanceFilingDays) : 0,
        isLimitedConsecutiveFilingDays: formData.value.allowConsecutiveDaysLimit,
        maxConsecutiveDays: formData.value.allowConsecutiveDaysLimit ? Number(formData.value.maxConsecutiveDays) : 0,
        canFileAgainstFutureCredits: formData.value.canFileAgainstFutureCredits,
        maxAdvanceFilingDays: formData.value.canFileAgainstFutureCredits ? Number(formData.value.maxAdvanceFilingDays) : 0,
        isAttachmentMandatory: formData.value.isAttachmentMandatory,
        renewalType: formData.value.renewalType ? formData.value.renewalType : null,
        customRenewalDate: formData.value.renewalInputType ? formData.value.renewalInputType : null,
        consecutiveFilingDays: formData.value.allowConsecutiveDaysLimit ? Number(formData.value.maxConsecutiveDays) : 0,
      };

      api
        .post('hr-configuration/leave/plan', params)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit('saveDone');
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const apiUpdate = () => {
      $q.loading.show();

      const params = {
        leaveTypeConfigurationId: formData.value.leaveTypeConfigurationId,
        planName: formData.value.leavePlanName,
        canCarryOver: formData.value.canCarryOver,
        maxCarryOverCredits: formData.value.canCarryOver ? Number(formData.value.maxCarryOverCredits) : 0,
        canConvertToCash: formData.value.canConvertToCash,
        maxCashConversionCredits: formData.value.canConvertToCash ? Number(formData.value.maxCashConversionCredits) : 0,
        canFileSameDay: formData.value.canFileSameDay,
        allowLateFiling: formData.value.allowLateFiling,
        advanceFilingDays: !formData.value.allowLateFiling ? Number(formData.value.advanceFilingDays) : 0,
        isLimitedConsecutiveFilingDays: formData.value.allowConsecutiveDaysLimit,
        maxConsecutiveDays: formData.value.allowConsecutiveDaysLimit ? Number(formData.value.maxConsecutiveDays) : 0,
        canFileAgainstFutureCredits: formData.value.canFileAgainstFutureCredits,
        maxAdvanceFilingDays: formData.value.canFileAgainstFutureCredits ? Number(formData.value.maxAdvanceFilingDays) : 0,
        isAttachmentMandatory: formData.value.isAttachmentMandatory,
        renewalType: formData.value.renewalType ? formData.value.renewalType : null,
        customRenewalDate: formData.value.renewalType === 'CUSTOM_DATE' || formData.value.renewalType === 'HIRING_ANNIVERSARY' ? formData.value.renewalInputType : null,
        consecutiveFilingDays: formData.value.allowConsecutiveDaysLimit ? Number(formData.value.maxConsecutiveDays) : 0,
      };

      api
        .patch(`hr-configuration/leave/plan/${props.planInformation?.id}`, params)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit('saveDone');
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    }

    const fetchData = () => {
      $q.loading.show();

      if (props.planInformation) {
        formData.value = {
          leaveTypeConfigurationId: props.planInformation.leaveType.id,
          leavePlanName: props.planInformation.planName,
          canCarryOver: props.planInformation.rules.canCarryOver ?? null,
          maxCarryOverCredits: props.planInformation.credits.maxCarryOver ?? null,
          canConvertToCash: props.planInformation.rules.canConvertToCash ?? null,
          maxCashConversionCredits: props.planInformation.credits.maxCashConversion ?? null,
          renewalType: props.planInformation.renewal.type ?? null,
          renewalInputType: props.planInformation.renewal.customDate?.dateStandard ?? null,
          canFileSameDay: props.planInformation.rules.canFileSameDay ?? null,
          allowLateFiling: props.planInformation.rules.allowLateFiling ?? null,
          advanceFilingDays: props.planInformation.rules.advanceFilingDays ?? null,
          allowConsecutiveDaysLimit: props.planInformation.rules.isLimitedConsecutiveFilingDays ?? null,
          maxConsecutiveDays: props.planInformation.rules.maxConsecutiveDays ?? null,
          canFileAgainstFutureCredits: props.planInformation.rules.canFileAgainstFutureCredits ?? null,
          maxAdvanceFilingDays: props.planInformation.rules.maxAdvanceFilingDays ?? null,
          isAttachmentMandatory: props.planInformation.rules.isAttachmentMandatory ?? null,
        };
      } else {
        formData.value = {
          leaveTypeConfigurationId: props.leaveTypeInformation?.id || 0,
          leavePlanName: '',
          canCarryOver: false,
          maxCarryOverCredits: null,
          canConvertToCash: false,
          maxCashConversionCredits: null,
          renewalType: 'START_OF_YEAR',
          renewalInputType: null,
          canFileSameDay: false,
          allowLateFiling: true,
          advanceFilingDays: null,
          allowConsecutiveDaysLimit: false,
          maxConsecutiveDays: null,
          canFileAgainstFutureCredits: false,
          maxAdvanceFilingDays: null,
          isAttachmentMandatory: false,
        };
      }

      $q.loading.hide();
    };

    return {
      $q,
      dialog,
      formData,
      fetchData,
      save,
      // validateForm,
    };
  },
};
</script>
