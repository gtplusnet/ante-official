<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        {{ branchData ? "Edit" : "Create" }} Branch
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <q-form @submit.prevent="saveBranch" class="col q-gutter-y-md">
            <div class="col-6">
              <g-input
                v-model="form.branchCode"
                label="Branch Code"
                type="text"
              />
            </div>
            <div class="col-6">
              <g-input
                v-model="form.branchName"
                label="Branch Name"
                type="text"
              />
            </div>
            <div class="col-6">
              <selection-location
                required
                label="Location"
                v-model="form.selectedLocation"
              ></selection-location>
            </div>
            <div class="col-6">
              <q-select
                v-model="form.parentId"
                :options="availableBranches"
                option-label="name"
                option-value="id"
                label="Parent Branch (Optional)"
                clearable
                emit-value
                map-options
                outlined
                dense
                :loading="loadingBranches"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="form.mainWarehouseId"
                :options="availableWarehouses"
                option-label="name"
                option-value="id"
                label="Main Warehouse"
                clearable
                emit-value
                map-options
                outlined
                dense
                :loading="loadingWarehouses"
              />
            </div>

            <div class="full-width row justify-end q-gutter-sm">
              <GButton
                label="Cancel"
                type="button"
                color="primary"
                variant="outline"
                class="text-label-large"
                v-close-popup
              />
              <GButton
                :label="branchData ? 'Update' : 'Save'"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}
</style>

<script lang="ts">
import GInput from "../../../../../components/shared/form/GInput.vue";
import SelectionLocation from "../../../../../components/selection/SelectionLocation.vue";
import { api } from "src/boot/axios";
import { QDialog, useQuasar } from "quasar";
import { ref, watch } from "vue";
import { defineAsyncComponent } from 'vue';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { BranchCreateRequest } from "@shared/request/branch.request";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddEditBranchManagementDialog",
  components: {
    SelectionLocation,
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    branchData: {
      type: Object || null,
      default: null,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const form = ref({
      branchCode: "",
      branchName: "",
      selectedLocation: "",
      parentId: null as number | null,
      mainWarehouseId: null as string | null,
    });

    const availableBranches = ref([]);
    const loadingBranches = ref(false);
    const availableWarehouses = ref([]);
    const loadingWarehouses = ref(false);

    const fetchData = async () => {
      if (props.branchData) {
        form.value.branchCode = props.branchData.code;
        form.value.branchName = props.branchData.name;
        form.value.selectedLocation = props.branchData.location.id;
        form.value.parentId = props.branchData.parentId || null;
        form.value.mainWarehouseId = props.branchData.mainWarehouse?.id || null;
      } else {
        form.value.branchCode = "";
        form.value.branchName = "";
        form.value.selectedLocation = "";
        form.value.parentId = null;
        form.value.mainWarehouseId = null;
      }
      await fetchAvailableBranches();
      await fetchAvailableWarehouses();
    };

    const fetchAvailableBranches = async () => {
      loadingBranches.value = true;
      try {
        const params: any = {};
        if (props.branchData) {
          params.excludeId = props.branchData.id;
        }

        const response = await api.get("branch/parent-options", { params });
        availableBranches.value = response.data;
      } catch (error: any) {
        handleAxiosError($q, error);
      } finally {
        loadingBranches.value = false;
      }
    };

    const fetchAvailableWarehouses = async () => {
      loadingWarehouses.value = true;
      try {
        const response = await api.get('warehouse/options');
        availableWarehouses.value = response.data;
      } catch (error: any) {
        handleAxiosError($q, error);
      } finally {
        loadingWarehouses.value = false;
      }
    };

    const saveBranch = async () => {
      $q.loading.show();

      if (props.branchData) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      const params: BranchCreateRequest = {
        branchCode: form.value.branchCode,
        branchName: form.value.branchName,
        branchLocationId: form.value.selectedLocation,
        mainWarehouseId: form.value.mainWarehouseId,
        parentId: form.value.parentId,
      };

      api
        .post("branch/create", params)
        .then((response) => {
          $q.loading.hide();
          emit("saveDone", response.data);

          if (dialog.value) {
            dialog.value.hide();
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
          $q.loading.hide();
        });
    };

    const apiUpdate = () => {
      const updatedParams = {
        id: props.branchData.id,
        branchCode: form.value.branchCode,
        branchName: form.value.branchName,
        branchLocationId: form.value.selectedLocation,
        mainWarehouseId: form.value.mainWarehouseId,
        parentId: form.value.parentId,
      };
      api
        .patch("branch/update", updatedParams)
        .then((response) => {
          $q.loading.hide();

          if (dialog.value) {
            dialog.value.hide();
          }
          emit("saveDone", response.data);
        })
        .catch((error) => {
          handleAxiosError($q, error);
          $q.loading.hide();
        });
    };

    watch(() => props.branchData, fetchData, { immediate: true });

    return {
      dialog,
      form,
      availableBranches,
      loadingBranches,
      availableWarehouses,
      loadingWarehouses,
      fetchData,
      saveBranch,
    };
  },
};
</script>
