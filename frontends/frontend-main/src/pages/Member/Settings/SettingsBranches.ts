import { ref, Ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import AddEditBrachDialog from "../../../pages/Member/Manpower/dialogs/configuration/ManpowerAddEditBranchDialog.vue";
import ViewBranchDialog from "../../../pages/Member/Manpower/dialogs/configuration/ManpowerViewBranchDialog.vue";
import BranchNode from "../../../components/BranchNode.vue";
import GTable from "../../../components/shared/display/GTable.vue";
import { useQuasar } from 'quasar';
import { BranchDataResponse } from '@shared/response/branch.response';
import { handleAxiosError } from "../../../utility/axios.error.handler";


export default {
  name: 'SettingsBranches',
  components: {
    AddEditBrachDialog,
    ViewBranchDialog,
    BranchNode,
    GTable,
  },
  setup() {
    const $q = useQuasar();
    const branches: Ref<BranchDataResponse[]> = ref([]);
    const loading: Ref<boolean> = ref(false);
    const branchData: Ref<BranchDataResponse | null> = ref(null);
    const openAddEditBranchDialog: Ref<boolean> = ref(false);
    const openViewBranchDialog: Ref<boolean> = ref(false);
    const activeTab: Ref<string> = ref('tree');
    const tableRef = ref<{ refetch: () => void } | null>(null);

    const fetchBranches = async () => {
      loading.value = true;
      try {
        const response = await api.get('branch/tree');
        branches.value = response.data;
      } catch (error: any) {
        handleAxiosError($q, error);
      } finally {
        loading.value = false;
      }
    };

    const openDialog = () => {
      branchData.value = null;
      openAddEditBranchDialog.value = true;
    }

    const openEditBranch = (branch: BranchDataResponse) => {
      branchData.value = branch;
      openViewBranchDialog.value = false;
      openAddEditBranchDialog.value = true;
    }
    
    const viewBranch = (branch: BranchDataResponse) => {
      branchData.value = branch;
      openViewBranchDialog.value = true;
    }

    const editBranch = (branch: BranchDataResponse) => {
      branchData.value = branch;
      openAddEditBranchDialog.value = true;
    }

    const deleteBranch = (data: BranchDataResponse) => {
      $q
        .dialog({
          title: 'Delete Branch',
          message: `Are you sure you want to delete <b>${data.name} Branch</b>?`,
          ok: 'Yes',
          cancel: 'No',
          html: true,
        })
        .onOk(() => {
          deleteBranchData(data.id);
        });
    }

    const deleteBranchData = async (branchId: string) => {
      api
        .delete('branch/delete?id=' + branchId)
        .then(() => {
          fetchBranches();
          if (tableRef.value) {
            tableRef.value.refetch();
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        });
    }

    const handleSaveDone = () => {
      fetchBranches();
      if (tableRef.value) {
        tableRef.value.refetch();
      }
    };

    onMounted(() => {
      fetchBranches();
    });

    return {
      branches,
      loading,
      branchData,
      openAddEditBranchDialog,
      openViewBranchDialog,
      openDialog,
      openEditBranch,
      viewBranch,
      editBranch,
      deleteBranch,
      fetchBranches,
      activeTab,
      tableRef,
      handleSaveDone,
    }
  }
};
