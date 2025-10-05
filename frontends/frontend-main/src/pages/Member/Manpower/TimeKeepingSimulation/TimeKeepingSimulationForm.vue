<template>
  <div class="q-pa-md">
    <table>
      <thead class="text-title-small">
        <tr>
          <th>Date In</th>
          <th>Time In</th>
          <th>Date Out</th>
          <th>Time Out</th>
          <th></th>
        </tr>
      </thead>

      <tbody class="text-body-medium">
        <tr v-for="(shift, index) in dateTimeArray" :key="index">
          <td>
            <input type="date" v-model="shift.dateIn" />
          </td>
          <td>
            <input type="time" v-model="shift.timeIn" />
          </td>
          <td>
            <input type="date" v-model="shift.dateOut" />
          </td>
          <td>
            <input type="time" v-model="shift.timeOut" />
          </td>
          <td>
            <GButton
              dense
              rounded
              variant="text"
              icon="delete"
              color="red"
              @click="deleteTime(index)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="text-right">
      <GButton
        @click="resetList"
        class="q-mt-md q-ml-sm"
        color="primary"
        variant="outline"
        icon="refresh"
      />
      <GButton
        @click="addTime"
        class="q-mt-md q-ml-sm"
        color="primary"
        variant="outline"
        icon="add"
      />
      <GButton
        @click="submitForSimulation"
        class="q-mt-md q-ml-sm text-label-large"
        color="primary"
        variant="filled"
        label="Submit"
      />
    </div>



    <TimeKeepingSimulationOutputDialog v-model="isTimeKeepingSimulationOutputDialogOpen" v-if="outputData"
      :outputData="outputData"></TimeKeepingSimulationOutputDialog>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, ref, reactive, onMounted, Ref } from 'vue';
import { api } from 'src/boot/axios';
import { CutoffDateRangeResponse, TimeKeepingComputeResponseData, TimekeepingLogResponse } from '@shared/response/timekeeping.response';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TimeKeepingSimulationOutputDialog = defineAsyncComponent(() =>
  import('./TimeKeepingSimulationOutputDialog.vue')
);

export default {
  name: 'TimeKeepingSimulationForm',
  components: {
    TimeKeepingSimulationOutputDialog,
    GButton
  },
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object as () => CutoffDateRangeResponse,
      default: () => ({}),
      required: false,
    },
    editData: {
      type: Object as () => TimekeepingLogResponse,
      default: null,
    },
  },
  emits: ['simulation-completed'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const isTimeKeepingSimulationOutputDialogOpen: Ref<boolean> = ref(false);
    const outputData: Ref<TimeKeepingComputeResponseData | null> = ref(null);
    const dateTimeArray = reactive<{ dateIn: string; dateOut: string; timeIn: string; timeOut: string }[]>([]);

    const generateRandomTime = (date: string | number | Date) => {
      const randomTimeIn = new Date(date);
      randomTimeIn.setHours(8 + Math.floor(Math.random() * 3)); // Random hour between 8 and 10
      randomTimeIn.setMinutes(Math.floor(Math.random() * 60)); // Random minute

      const randomTimeOut = new Date(date);
      randomTimeOut.setHours(
        randomTimeIn.getHours() + 8 + Math.floor(Math.random() * 2)
      );

      randomTimeOut.setMinutes(Math.floor(Math.random() * 60)); // Random minute

      return {
        timeIn: randomTimeIn.toTimeString().split(' ')[0].slice(0, 5), // Format as HH:mm
        timeOut: randomTimeOut.toTimeString().split(' ')[0].slice(0, 5), // Format as HH:mm
      };
    };

    const submitForSimulation = () => {
      $q.loading.show();

      const simulatedTime = dateTimeArray.map((item) => ({
        timeIn: `${item.dateIn} ${item.timeIn}:00`,
        timeOut: `${item.dateOut} ${item.timeOut}:00`,
      }));

      const payload = {
        employeeAccountId: props.employeeAccountId,
        simulatedTime,
      };

      api
        .post('/hris/timekeeping/simulate', payload)
        .then((data) => {
          outputData.value = data.data as TimeKeepingComputeResponseData;
          isTimeKeepingSimulationOutputDialogOpen.value = true;
          emit('simulation-completed');
        })
        .catch((error: AxiosError) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const addTime = () => {
      let nextDate = new Date();

      nextDate.setDate(dateTimeArray.length ? new Date(dateTimeArray[dateTimeArray.length - 1].dateOut).getDate() + 1 : new Date().getDate());

      if (props.cutoffDateRange) {
        nextDate = new Date(props.cutoffDateRange.startDate.dateFull);
        nextDate.setDate(nextDate.getDate() + dateTimeArray.length);
      }

      const randomTimes = generateRandomTime(nextDate);

      const newTime = {
        dateIn: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
        timeIn: randomTimes.timeIn,
        dateOut: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
        timeOut: randomTimes.timeOut,
      };

      if (props.editData && dateTimeArray.length === 0) {
        newTime.dateIn = props.editData.timeIn.dateStandard;
        newTime.timeIn = props.editData.timeIn.time24;
        newTime.dateOut = props.editData.timeOut.dateStandard;
        newTime.timeOut = props.editData.timeOut.time24;
      }

      dateTimeArray.push(newTime);
    };

    const deleteTime = (index: number) => {
      dateTimeArray.splice(index, 1);
    };

    const resetList = () => {
      dateTimeArray.length = 0;
      addTime();
    };

    onMounted(() => {
      addTime();
    });

    return {
      isTimeKeepingSimulationOutputDialogOpen,
      outputData,
      dateTimeArray,
      submitForSimulation,
      addTime,
      deleteTime,
      resetList,
    };
  },
};

</script>
<style scoped lang="scss" src="./TimeKeepingSimulationForm.scss"></style>
