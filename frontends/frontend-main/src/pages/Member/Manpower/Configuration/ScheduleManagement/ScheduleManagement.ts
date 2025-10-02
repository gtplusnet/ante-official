import GTable from "../../../../../components/shared/display/GTable.vue";
import GCard from "../../../../../components/shared/display/GCard.vue";
import ViewShiftCodeDialog from '../../dialogs/configuration/ManpowerViewShiftCodeDialog.vue';
import ViewScheduleDialog from '../../dialogs/configuration/ManpowerViewScheduleDialog.vue';
import AddEditScheduleDialog from '../../dialogs/configuration/ManpowerAddEditScheduleDialog.vue';
import { ref, Ref } from 'vue';
import { ScheduleDataResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import GButton from "src/components/shared/buttons/GButton.vue";
export default {
  name: 'ScheduleManagementMenuPage',
  components: {
    ViewShiftCodeDialog,
    ViewScheduleDialog,
    AddEditScheduleDialog,
    GTable,
    GCard,
    ExpandedNavPageContainer,
    GButton,
  },
  setup() {
    const openViewShiftDialog: Ref<boolean> = ref(false);
    const openViewSchedule: Ref<boolean> = ref(false);
    const openAddEditSchedule: Ref<boolean> = ref(false);
    const shiftCodeData: Ref<unknown | null> = ref(null);
    const scheduleInformation: Ref<unknown | null> = ref(null);
    const $q = useQuasar();
    const table = ref<InstanceType<typeof GTable> | null>(null);


    const openMondayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.mondayShift;
      openViewShiftDialog.value = true;
    }

    const openTuesdayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.tuesdayShift;
      openViewShiftDialog.value = true;
    }

    const openWednesdayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.wednesdayShift;
      openViewShiftDialog.value = true;
    }

    const openThursdayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.thursdayShift;
      openViewShiftDialog.value = true;
    }

    const openFridayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.fridayShift;
      openViewShiftDialog.value = true;
    }

    const openSaturdayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.saturdayShift;
      openViewShiftDialog.value = true;
    }

    const openSundayShift = (shift: ScheduleDataResponse) => {
      shiftCodeData.value = shift.dayScheduleDetails.sundayShift;
      openViewShiftDialog.value = true;
    }

    const openDialog = (schedule: null) => {
      scheduleInformation.value = schedule;
      openAddEditSchedule.value = true;
    }

    const viewSchedule = (schedule: ScheduleDataResponse) => {
      scheduleInformation.value = schedule;
      openViewSchedule.value = true;
    }

    const editSchedule = (schedule: ScheduleDataResponse) => {
      scheduleInformation.value = schedule;
      openAddEditSchedule.value = true;
    }

    const deleteSchedule = (schedule: ScheduleDataResponse) => {
      $q.dialog({
        title: 'Delete Schedule',
        message: 'Are you sure you want to delete this schedule?',
        persistent: true,
        cancel: true,
        ok: true,
      }).onOk(() => {
        apiDeleteCall(schedule)
      });
    }

    const apiDeleteCall = (schedule: ScheduleDataResponse) => {
      $q.loading.show({
        message: 'Deleting Schedule...'
      });

      api.delete(`/hr-configuration/schedule/delete?id=${schedule.id}`)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: 'Schedule deleted successfully',
          });

          if(table.value) {
            table.value.refetch();
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    }

    return {
      openViewShiftDialog,
      openViewSchedule,
      openAddEditSchedule,
      shiftCodeData,
      scheduleInformation,
      table,
      deleteSchedule,
      openMondayShift,
      openTuesdayShift,
      openWednesdayShift,
      openThursdayShift,
      openFridayShift,
      openSaturdayShift,
      openSundayShift,
      openDialog,
      viewSchedule,
      editSchedule,
    }
  }
};
