import GCard from "../../../../../components/shared/display/GCard.vue"
import GButton from "src/components/shared/buttons/GButton.vue"
import GTable from "../../../../../components/shared/display/GTable.vue"
import { ref, Ref } from 'vue'
import { defineAsyncComponent } from 'vue';
import { CutoffDataResponse } from '@shared/response/cutoff.response'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditCutOffDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditCutOffDialog.vue')
);
const ViewCutOffDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerViewCutOffDialog.vue')
);

export default {
  name: 'CutOffManagement',
  components: {
    AddEditCutOffDialog,
    ViewCutOffDialog,
    GCard,
    GButton,
    GTable,
    ExpandedNavPageContainer,
  },
  setup() {
    const table = ref<{ refetch: () => void } | null>(null);
    const openViewCutOffDialog: Ref<boolean> = ref(false);
    const openAddEditCutOffDialog: Ref<boolean> = ref(false);
    const cutOffData: Ref<CutoffDataResponse | null> = ref(null);
    const $q = useQuasar();

    const openDialog = (cutOff: null) => {
      cutOffData.value = cutOff;
      openAddEditCutOffDialog.value = true;
    }

    const openEditCutOff = (cutOff: CutoffDataResponse) => {
      cutOffData.value = cutOff;
      openAddEditCutOffDialog.value = true;
    }

    const viewCutOff = (cutOff: CutoffDataResponse) => {
      cutOffData.value = cutOff;
      openViewCutOffDialog.value = true;
    }

    const editCutOff = (cutOff: CutoffDataResponse) => {
      cutOffData.value = cutOff;
      openAddEditCutOffDialog.value = true;
    }

    const apiDeleteCutOff = async (cutOff: CutoffDataResponse) => {
      $q.loading.show({ message: 'Deleting CutOff...' });

      api.delete(`/hr-configuration/cutoff/delete?id=${cutOff.id}`)
        .then(() => {
          if (table.value) {
            table.value.refetch();
          }

        }).catch((error) => {
          console.error('Error deleting CutOff:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to delete CutOff',
          });
        }
        ).finally(() => {
          $q.loading.hide();
        });
    }

    const deleteCutOff = (cutOff: CutoffDataResponse) => {
      $q.dialog({
        title: 'Delete CutOff',
        message: `Are you sure you want to delete CutOff: ${cutOff.cutoffCode}?`,
        persistent: true,
        ok: true,
        cancel: true,
      }).onOk(() => {
        apiDeleteCutOff(cutOff)
      }).onCancel(() => {
        console.log('Delete cancelled');
      });
    }

    return {
      openViewCutOffDialog,
      openAddEditCutOffDialog,
      cutOffData,
      openDialog,
      openEditCutOff,
      viewCutOff,
      editCutOff,
      deleteCutOff,
      table,
    }
  }
};
