<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        {{ leaveTypeInformation ? "Edit" : "Add" }} Leave Type
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="save" class="q-pa-md">
          <g-input
            type="text"
            label="Leave Type Title"
            v-model="formData.leaveType"
          />
          <g-input
            type="text"
            label="Leave Type Code"
            :hint="'Leave Type Code'"
            v-model="formData.leaveTypeCode"
          />
          <g-input
            type="textarea"
            label="Leave Type Description"
            v-model="formData.leaveTypeDescription"
          />

          <div class="row items-center q-mt-md q-gutter-sm justify-end">
            <GButton
              label="Cancel"
              color="primary"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
            <GButton
              label="Save"
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

<script lang="ts">
import GInput from "src/components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { QDialog, useQuasar } from "quasar";
import { ref } from "vue";
import { defineAsyncComponent } from 'vue';
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import { LeaveTypeConfigurationResponse } from "@shared/response";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddEditLeaveTypeDialog",
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
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const formData = ref({
      leaveType: "",
      leaveTypeCode: "",
      leaveTypeDescription: "",
    });

    const save = async () => {
      if (props.leaveTypeInformation) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      $q.loading.show();
      const params = {
        name: formData.value.leaveType,
        code: formData.value.leaveTypeCode.toUpperCase(),
        description: formData.value.leaveTypeDescription,
      };

      api
        .post("hr-configuration/leave/type", params)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit("saveDone");
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
        name: formData.value.leaveType,
        code: formData.value.leaveTypeCode.toUpperCase(),
        description: formData.value.leaveTypeDescription,
      };

      api
        .patch(
          `hr-configuration/leave/type/${props.leaveTypeInformation?.id}`,
          params
        )
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit("saveDone");
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      $q.loading.show();
      if (props.leaveTypeInformation) {
        formData.value = {
          leaveType: props.leaveTypeInformation.name ?? "",
          leaveTypeCode: props.leaveTypeInformation.code ?? "",
          leaveTypeDescription: props.leaveTypeInformation.description ?? "",
        };
      } else {
        formData.value = {
          leaveType: "",
          leaveTypeCode: "",
          leaveTypeDescription: "",
        };
      }
      $q.loading.hide();
    };

    return {
      $q,
      dialog,
      formData,
      save,
      apiSave,
      apiUpdate,
      fetchData,
    };
  },
};
</script>
