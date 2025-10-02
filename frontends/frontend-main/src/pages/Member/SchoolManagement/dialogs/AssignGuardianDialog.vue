<template>
  <q-dialog ref="dialog" v-model="model">
    <template-dialog size="xs" icon="o_family_restroom" icon-color="primary">
      <template #DialogTitle>Assign Guardian to Student</template>

      <template #DialogContent>
        <div class="q-pa-md">
          <div class="q-mb-sm">
            <div class="text-title-small text-grey q-mb-xs">Student Information</div>
            <div class="text-label-medium">{{ studentData?.firstName }} {{ studentData?.lastName }}</div>
            <div class="text-caption text-grey">Student #{{ studentData?.studentNumber }}</div>
          </div>

          <q-separator v-if="studentData?.guardian" class="q-mb-sm" />

          <q-form @submit.prevent="onSubmit">
            <!-- Current Guardian -->
            <div v-if="studentData?.guardian" class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Current Guardian</div>
              <q-card flat bordered class="q-pa-md">
                <div class="row items-center">
                  <div class="col">
                    <div class="text-weight-medium">{{ studentData.guardian.name }}</div>
                    <div class="text-caption text-grey-6">{{ studentData.guardian.relationship }}</div>
                    <div class="text-caption">{{ studentData.guardian.contactNumber }}</div>
                  </div>
                  <div class="col-auto">
                    <g-button
                      @click="removeGuardian"
                      color="negative"
                      variant="text"
                      icon="remove_circle"
                      label="Remove"
                      size="sm"
                    />
                  </div>
                </div>
              </q-card>
            </div>

            <div v-if="!studentData?.guardian" class="q-mt-lg">
              <!-- Select Guardian -->
              <GlobalInputTemplate
                type="select"
                label="Select Guardian"
                v-model="formData.guardianId"
                :options="guardianOptions"
                :required="true"
                :disabled="!!studentData?.guardian"
              />

              <!-- Relationship -->
              <GlobalInputTemplate
                type="select"
                label="Relationship"
                v-model="formData.relationship"
                :options="relationshipOptions"
                :required="true"
                :disabled="!!studentData?.guardian"
              />
            </div>
          </q-form>
        </div>
      </template>

      <template #DialogSubmitActions>
        <g-button label="Close" variant="outline" color="primary" v-close-popup />
        <g-button
          v-if="!studentData?.guardian"
          label="Assign Guardian"
          type="submit"
          variant="filled"
          color="primary"
          :loading="loading"
          @click="onSubmit"
        />
      </template>
    </template-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import type { StudentResponse } from "@shared/response";
import { AxiosError } from "axios";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import GlobalInputTemplate from "src/components/shared/form/GlobalInput/GlobalInputTemplate.vue";

interface GuardianOption {
  label: string;
  value: string;
}

export default defineComponent({
  name: "AssignGuardianDialog",
  components: {
    TemplateDialog,
    GButton,
    GlobalInputTemplate,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    studentData: {
      type: Object as () => StudentResponse | null,
      default: null,
    },
  },
  emits: ["update:modelValue", "close", "assignDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const dialog = ref();
    const guardianOptions = ref<GuardianOption[]>([]);

    const model = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const formData = ref({
      guardianId: "",
      relationship: "",
    });

    const relationshipOptions = [
      { label: "Father", value: "Father" },
      { label: "Mother", value: "Mother" },
      { label: "Guardian", value: "Guardian" },
      { label: "Grandfather", value: "Grandfather" },
      { label: "Grandmother", value: "Grandmother" },
      { label: "Uncle", value: "Uncle" },
      { label: "Aunt", value: "Aunt" },
      { label: "Other", value: "Other" },
    ];

    const loadGuardians = async () => {
      try {
        const response = await api.get("school/guardian/list");
        guardianOptions.value = response.data.map((guardian: any) => ({
          label: guardian.name,
          value: guardian.id,
        }));
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: "negative",
          message: axiosError.response?.data?.message || "Failed to load guardians",
        });
      }
    };

    const onSubmit = async () => {
      if (!props.studentData) return;

      loading.value = true;
      try {
        await api.post("school/guardian/assign-student", {
          guardianId: formData.value.guardianId,
          studentId: props.studentData.id,
          relationship: formData.value.relationship,
          isPrimary: true, // Since one student can only have one guardian
        });

        $q.notify({
          type: "positive",
          message: "Guardian assigned successfully",
        });

        handleSuccess();
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: "negative",
          message: axiosError.response?.data?.message || "Failed to assign guardian",
        });
      } finally {
        loading.value = false;
      }
    };

    const removeGuardian = async () => {
      if (!props.studentData?.guardian) return;

      $q.dialog({
        title: "Remove Guardian",
        message: "Are you sure you want to remove this guardian from the student?",
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        loading.value = true;
        try {
          await api.delete("school/guardian/remove-student", {
            data: {
              guardianId: props.studentData!.guardian!.id,
              studentId: props.studentData!.id,
            },
          });

          $q.notify({
            type: "positive",
            message: "Guardian removed successfully",
          });

          // Just emit assignDone to refresh data, don't close dialog
          emit("assignDone");
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: "negative",
            message: axiosError.response?.data?.message || "Failed to remove guardian",
          });
        } finally {
          loading.value = false;
        }
      });
    };

    const handleSuccess = () => {
      emit("assignDone");
      emit("close");
      if ((dialog.value as any)?.$refs?.dialog) {
        (dialog.value as any).$refs.dialog.hide();
      }
    };

    const resetForm = () => {
      formData.value = {
        guardianId: "",
        relationship: "",
      };
    };

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          resetForm();
          loadGuardians();
        }
      }
    );

    return {
      dialog,
      model,
      loading,
      formData,
      guardianOptions,
      relationshipOptions,
      onSubmit,
      removeGuardian,
      resetForm,
    };
  },
});
</script>
