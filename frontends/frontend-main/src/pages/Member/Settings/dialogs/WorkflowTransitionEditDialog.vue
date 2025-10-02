<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px; max-width: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Connection</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <!-- Connection Info -->
            <div class="text-body-medium text-grey-7 q-mb-md">
              {{ fromStageName }} → {{ toStageName }}
              <q-chip 
                v-if="transition?.transitionType === 'REJECTION'" 
                color="red" 
                text-color="white" 
                size="sm"
                class="q-ml-sm"
              >
                Rejection Path
              </q-chip>
            </div>

            <!-- Button Name -->
            <div>
              <label class="text-body-small q-mb-sm block">Button Name</label>
              <q-input
                v-model="formData.buttonName"
                filled
                placeholder="e.g., Approve, Submit, Next"
                hint="The label shown on the button for this transition"
                :rules="[
                  val => !val || val.length <= 50 || 'Maximum 50 characters'
                ]"
              />
            </div>

            <!-- Dialog Configuration Section -->
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-md">Dialog Configuration</div>
            
            <div>
              <label class="text-body-small q-mb-sm block">Dialog Type</label>
              <q-select
                v-model="formData.dialogType"
                :options="dialogOptions"
                option-value="type"
                option-label="name"
                emit-value
                map-options
                filled
                clearable
                hint="Select the dialog that will be shown when this transition is triggered"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                      <q-item-label caption v-if="scope.opt.isCommon">
                        <q-chip size="xs" color="blue" text-color="white">Common Dialog</q-chip>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="onDelete"
            icon="delete"
          />
          <q-btn
            flat
            label="Save"
            color="primary"
            type="submit"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'WorkflowTransitionEditDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    transition: {
      type: Object,
      default: null,
    },
    fromStageName: {
      type: String,
      default: '',
    },
    toStageName: {
      type: String,
      default: '',
    },
    workflowId: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:modelValue', 'updated', 'deleted'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const loading = ref(false);
    const formData = ref({
      buttonName: '',
      dialogType: null as string | null,
      customDialogConfig: null,
    });

    const dialogOptions = ref<any[]>([]);

    const loadDialogOptions = async () => {
      if (!$api) return;
      try {
        // Get the workflow to determine its code
        const workflowResponse = await $api.get(`/workflow-template/${props.workflowId}`);
        const workflowCode = workflowResponse.data.code;
        
        const response = await $api.get(`/workflow-template/dialogs/${workflowCode}`);
        dialogOptions.value = response.data;
      } catch (error) {
        console.error('Failed to load dialog options:', error);
      }
    };

    const onSubmit = async () => {
      if (!$api || !props.transition) return;

      loading.value = true;
      try {
        await $api.put(`/workflow-stage/transition/${props.transition.id}`, {
          buttonName: formData.value.buttonName || null,
          dialogType: formData.value.dialogType,
          customDialogConfig: formData.value.customDialogConfig,
        });

        $q.notify({
          type: 'positive',
          message: 'Connection updated successfully',
        });

        emit('updated');
        dialogVisible.value = false;
      } catch (error: any) {
        console.error('Failed to update transition:', error);
        $q.notify({
          color: 'negative',
          message: error.response?.data?.message || 'Failed to update connection',
          icon: 'report_problem',
        });
      } finally {
        loading.value = false;
      }
    };

    const onDelete = () => {
      $q.dialog({
        title: 'Delete Connection',
        message: 'Are you sure you want to delete this connection?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        if (!$api || !props.transition) return;

        try {
          if (props.transition.transitionType === 'REJECTION') {
            // For rejection transitions, we need to update the stage
            const fromStageId = props.transition.fromStageId;
            await $api.put(`/workflow-stage/${fromStageId}`, {
              rejectFallbackStageId: null
            });
          } else {
            // For normal transitions, delete the transition
            await $api.delete(`/workflow-stage/transition/${props.transition.id}`);
          }

          $q.notify({
            type: 'positive',
            message: 'Connection deleted successfully',
          });

          emit('deleted');
          dialogVisible.value = false;
        } catch (error: any) {
          console.error('Failed to delete transition:', error);
          $q.notify({
            color: 'negative',
            message: error.response?.data?.message || 'Failed to delete connection',
            icon: 'report_problem',
          });
        }
      });
    };

    const resetForm = () => {
      formData.value = {
        buttonName: '',
        dialogType: null,
        customDialogConfig: null,
      };
    };

    watch(
      () => props.transition,
      (transition) => {
        if (transition) {
          formData.value = {
            buttonName: transition.buttonName || '',
            dialogType: transition.dialogType || null,
            customDialogConfig: transition.customDialogConfig || null,
          };
        } else {
          resetForm();
        }
      },
      { immediate: true }
    );

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          loadDialogOptions();
        }
      }
    );

    return {
      dialogVisible,
      loading,
      formData,
      dialogOptions,
      onSubmit,
      onDelete,
    };
  },
});
</script>