<template>
  <q-dialog ref="dialog" @before-show="initialize">
    <TemplateDialog minWidth="600px">
      <template #DialogIcon>
        <q-icon name="o_task" size="20px" />
      </template>
      <template #DialogTitle>
        <div>{{ employeeName }} | {{ selectedOutputData.dateFormatted.dateFull }}</div>
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="submitRequest" class="q-pa-md">
          <table>
            <tbody>
              <tr>
                <td colspan="3">
                  <div class="title">Timekeeping Override</div>
                </td>
              </tr>
              <tr>
                <td class="description">Work Minutes</td>
                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.worktime" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.worktime" /></td>
              </tr>
              <tr>
                <td class="description">Night Differential</td>

                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.nightDifferential" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.nightDifferential" /></td>
              </tr>
              <tr>
                <td  class="description">Approved (Overtime)</td>
                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.overtime" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.overtime" /></td>
              </tr>
              <tr>
                <td  class="description">Approved (Night Differential Overtime)</td>
                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.nightDifferentialOvertime" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.nightDifferentialOvertime" /></td>
              </tr>
              <tr>
                <td colspan="3">
                  <div class="title">Deductions</div>
                </td>
              </tr>
              <tr>
                <td  class="description">Late</td>
                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.late" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.late" /></td>
              </tr>
              <tr>
                <td  class="description">Undertime</td>
                <td class="input-field">
                  <input class="text-right q-pa-xs" v-model="form.undertime" type="text"/>
                </td>
                <td class="time-format"><time-view-raw :time="form.undertime" /></td>
              </tr>
            </tbody>
          </table>

          <q-separator class="q-mt-md"></q-separator>

          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn
              @click="clearTimekeepingOverride"
              class="q-mr-sm"
              flat
              icon="o_clear"
              size="12px"
              unelevated
              label="Clear"
              type="button"
              color="primary"
            />

            <q-btn
               size="12px"

              icon="o_edit"
              unelevated
              label="Modify"
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped src="./PayrollTimekeepingOverrideDialog.scss"></style>

<script lang="ts">
import { TimekeepingOutputResponse } from '@shared/response/timekeeping.response';
import { QDialog, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { Ref, ref } from 'vue';
import { TimekeepingOverrideRequest } from '@shared/request/timekeeping.request';
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import TimeViewRaw from "../../../../components/shared/display/TimeViewRaw.vue";

export default {
  name: 'PayrollTimekeepingOverrrideDialog',
  components: {
    TimeViewRaw,
    TemplateDialog,
  },
  props: {
    employeeName: {
      type: String,
      default: '0',
    },
    employeeAccountId: {
      type: String,
      default: '',
    },
    selectedOutputData: {
      type: Object as () => TimekeepingOutputResponse,
      default: () => ({}),
    },
  },
  emits: ['override-saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const form: Ref<TimekeepingOverrideRequest> = ref({
      timekeepingId: props.selectedOutputData.timekeepingId,
      worktime: 0,
      nightDifferential: 0,
      overtime: 0,
      nightDifferentialOvertime: 0,
      late: 0,
      undertime: 0,
    });

    const initialize = () => {
      form.value.timekeepingId = props.selectedOutputData.timekeepingId;
      form.value.worktime = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.worktime.totalMinutes :  props.selectedOutputData.timekeepingSummary.worktime.totalMinutes;
      form.value.nightDifferential = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.nightDifferential.totalMinutes : props.selectedOutputData.timekeepingSummary.nightDifferential.totalMinutes;
      form.value.overtime = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.overtime.totalMinutes : props.selectedOutputData.timekeepingSummary.overtimeApproved.totalMinutes;
      form.value.nightDifferentialOvertime = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.nightDifferentialOvertime.totalMinutes : props.selectedOutputData.timekeepingSummary.nightDifferentialOvertimeApproved.totalMinutes;
      form.value.late = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.late.totalMinutes : props.selectedOutputData.timekeepingSummary.late.totalMinutes;
      form.value.undertime = props.selectedOutputData.isOverridden ? props.selectedOutputData.timekeepingOverride.undertime.totalMinutes : props.selectedOutputData.timekeepingSummary.undertime.totalMinutes;
    };

    const clearTimekeepingOverride = () => {
      $q.dialog({
        title: 'Clear Timekeeping Override',
        message: 'Are you sure you want to clear the timekeeping override?',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        clearTimekeepingOverrideRequest();
      });
    };

    const clearTimekeepingOverrideRequest = () => {
      $q.loading.show({ message: 'Clearing...' });

      api.post('/hris/timekeeping/override/clear', {
        timekeepingId: form.value.timekeepingId,
      })
        .then(() => {
          emit('override-saved');
          dialog.value?.hide();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        }).finally(() => {
          $q.loading.hide();
        });
    };

    const submitRequest = () => {
      $q.loading.show({ message: 'Saving...' });

      form.value.worktime = Number(form.value.worktime);
      form.value.nightDifferential = Number(form.value.nightDifferential);
      form.value.overtime = Number(form.value.overtime);
      form.value.nightDifferentialOvertime = Number(form.value.nightDifferentialOvertime);
      form.value.late = Number(form.value.late);
      form.value.undertime = Number(form.value.undertime);

      api.post('/hris/timekeeping/override', form.value)
        .then(() => {
          emit('override-saved');
          dialog.value?.hide();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        }).finally(() => {
          $q.loading.hide();
        });
    };

    return {
      form,
      submitRequest,
      initialize,
      dialog,
      clearTimekeepingOverride,
    };
  },
};
</script>
