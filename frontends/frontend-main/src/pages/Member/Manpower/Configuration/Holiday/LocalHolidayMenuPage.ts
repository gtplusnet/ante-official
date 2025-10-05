import GTable from "../../../../../components/shared/display/GTable.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { api } from 'src/boot/axios';
import { ref, Ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import { LocalHolidayResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditLocalHolidayDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditLocalHolidayDialog.vue')
);
const ViewLocalHolidayDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerViewLocalHolidayDialog.vue')
);

export default {
  name: 'LocalHoliday',
  components: {
    AddEditLocalHolidayDialog,
    ViewLocalHolidayDialog,
    GTable,
    GButton,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<{ refetch: () => void } | null>(null);
    const localHolidayData: Ref<unknown | null> = ref(null);
    const openLocalHolidayDialog: Ref<boolean> = ref(false);
    const openViewLocalDialog: Ref<boolean> = ref(false);

    const openDialog = (local: null) => {
      localHolidayData.value = local;
      openLocalHolidayDialog.value = true;
    };

    const viewLocalHoliday = (local: LocalHolidayResponse) => {
      localHolidayData.value = local;
      openViewLocalDialog.value = true;
    };

    const editLocalHoliday = (local: LocalHolidayResponse) => {
      localHolidayData.value = local;
      openLocalHolidayDialog.value = true;
    };

    const deleteLocalHoliday = (data: LocalHolidayResponse) => {
      $q.dialog({
        title: 'Delete Local Holiday',
        message: `Are you sure you want to delete <b>${data.name} Holiday</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        deleteLocalHolidayData(data.id);
      });
    };

    const deleteLocalHolidayData = (id: string | number) => {
      api
        .delete('hr-configuration/holiday/local-holiday/delete?id=' + id)
        .then(() => {
          if (table.value) {
            table.value.refetch();
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        });
    };

    return {
      localHolidayData,
      openLocalHolidayDialog,
      openViewLocalDialog,
      table,
      openDialog,
      viewLocalHoliday,
      editLocalHoliday,
      deleteLocalHoliday,
    };
  },
}
