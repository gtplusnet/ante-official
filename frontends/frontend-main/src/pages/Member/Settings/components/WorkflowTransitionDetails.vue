<template>
  <div class="workflow-transition-details">
    <div class="detail-section">
      <div class="section-title">Connection Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">From Stage</div>
          <div class="info-value">{{ fromStageName }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">To Stage</div>
          <div class="info-value">{{ toStageName }}</div>
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div class="detail-section">
      <div class="section-title">
        Transition Settings
        <q-chip
          v-if="hasChanges"
          size="sm"
          color="orange"
          text-color="white"
          icon="edit"
          label="Unsaved Changes"
          class="q-ml-sm"
        />
      </div>
      
      <!-- Button Name -->
      <div class="q-mb-md">
        <label class="text-body-small q-mb-sm block">Button Name</label>
        <q-input
          v-model="formData.buttonName"
          filled
          placeholder="e.g., Approve, Submit, Next"
          hint="The label shown on the button for this transition"
          @update:model-value="onFieldChange"
        />
      </div>

      <!-- Button Color -->
      <div class="q-mb-md">
        <label class="text-body-small q-mb-sm block">Button Color</label>
        <q-input
          v-model="formData.buttonColor"
          filled
          placeholder="#2196F3"
          hint="Button color in hex format"
          @update:model-value="onFieldChange"
        >
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color v-model="formData.buttonColor" @update:model-value="onFieldChange" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <div 
          v-if="formData.buttonColor || formData.buttonName" 
          class="q-mt-sm color-preview"
          :style="{ 
            backgroundColor: '#ffffff',
            borderColor: formData.buttonColor || '#9E9E9E',
            color: formData.buttonColor || '#9E9E9E'
          }"
        >
          {{ formData.buttonName || 'Preview' }}
        </div>
      </div>

      <!-- Dialog Configuration -->
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
          @update:model-value="onFieldChange"
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

    <q-separator class="q-my-md" />

    <div class="detail-section">
      <div class="section-title">Actions</div>
      <q-btn
        label="Save Changes"
        color="primary"
        icon="save"
        class="full-width q-mb-sm"
        :loading="saving"
        :disable="!hasChanges"
        @click="saveChanges"
      />
      <q-btn
        flat
        label="Delete Connection"
        color="negative"
        icon="delete"
        class="full-width"
        @click="onDelete"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'WorkflowTransitionDetails',
  props: {
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
  emits: ['updated', 'deleted'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;

    const formData = ref({
      buttonName: '',
      buttonColor: '',
      dialogType: null as string | null,
      customDialogConfig: null,
    });

    const dialogOptions = ref<any[]>([]);
    const saving = ref(false);
    const hasChanges = ref(false);

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

    const saveChanges = async () => {
      if (!$api || !props.transition) return;

      saving.value = true;
      try {
        await $api.put(`/workflow-stage/transition/${props.transition.id}`, {
          buttonName: formData.value.buttonName || null,
          buttonColor: formData.value.buttonColor || null,
          dialogType: formData.value.dialogType,
          customDialogConfig: formData.value.customDialogConfig,
        });

        $q.notify({
          type: 'positive',
          message: 'Connection details saved successfully',
        });
        hasChanges.value = false;
        emit('updated');
      } catch (error: any) {
        console.error('Failed to update transition:', error);
        $q.notify({
          color: 'negative',
          message: error.response?.data?.message || 'Failed to update connection',
          icon: 'report_problem',
        });
      } finally {
        saving.value = false;
      }
    };

    const onFieldChange = () => {
      hasChanges.value = true;
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
          // Delete the transition
          await $api.delete(`/workflow-stage/transition/${props.transition.id}`);

          $q.notify({
            type: 'positive',
            message: 'Connection deleted successfully',
          });

          emit('deleted');
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

    watch(
      () => props.transition,
      (transition) => {
        if (transition) {
          formData.value = {
            buttonName: transition.buttonName || '',
            buttonColor: transition.buttonColor || '',
            dialogType: transition.dialogType || null,
            customDialogConfig: transition.customDialogConfig || null,
          };
          hasChanges.value = false;
          loadDialogOptions();
        }
      },
      { immediate: true }
    );

    return {
      formData,
      dialogOptions,
      saving,
      hasChanges,
      saveChanges,
      onFieldChange,
      onDelete,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-transition-details {
  padding: 16px;
}

.detail-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #616161;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 13px;
  color: #757575;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #212121;
  text-align: right;
}

.block {
  display: block;
}

.color-preview {
  padding: 8px 16px;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  border: 2px solid;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>