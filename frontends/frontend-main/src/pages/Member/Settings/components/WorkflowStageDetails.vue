<template>
  <div class="workflow-stage-details">
    <q-form @submit="saveChanges" class="q-gutter-md">
      <!-- Basic Information -->
      <div class="section">
        <div class="section-title">Basic Information</div>
        
        <g-input
          v-model="formData.name"
          label="Stage Name"
          :rules="[(val: string) => !!val || 'Name is required']"
          required
        />

        <g-input
          v-model="formData.key"
          label="Stage Key"
          hint="Unique identifier (uppercase with underscores)"
          :disable="!isNew"
          :rules="[
            (val: string) => !!val || 'Key is required',
            (val: string) => /^[A-Z_]+$/.test(val) || 'Must be uppercase with underscores only'
          ]"
          required
        />

        <g-input
          v-model="formData.description"
          label="Description"
          type="textarea"
          rows="2"
        />
      </div>

      <!-- Visual Settings -->
      <div class="section">
        <div class="section-title">Visual Settings</div>
        
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <label class="text-body-small q-mb-sm block">Background Color</label>
            <q-input
              v-model="formData.color"
              filled
              :rules="['anyColor']"
            >
              <template v-slot:append>
                <q-icon name="colorize" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color v-model="formData.color" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-6">
            <label class="text-body-small q-mb-sm block">Text Color</label>
            <q-input
              v-model="formData.textColor"
              filled
              :rules="['anyColor']"
            >
              <template v-slot:append>
                <q-icon name="colorize" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color v-model="formData.textColor" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <div class="text-center q-mt-md">
          <q-chip
            :label="formData.name || 'Preview'"
            :style="{
              backgroundColor: formData.color,
              color: formData.textColor,
              fontSize: '14px',
              padding: '8px 16px',
            }"
          />
        </div>
      </div>

      <!-- Assignee Configuration -->
      <div class="section">
        <div class="section-title">Assignee Configuration</div>
        
        <q-select
          v-model="formData.assigneeType"
          :options="assigneeTypeOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          filled
          clearable
          label="Assignee Type"
          hint="Who should be assigned to handle this stage"
        />

        <q-select
          v-if="formData.assigneeType && formData.assigneeType !== 'DIRECT_SUPERVISOR'"
          v-model="formData.assigneeId"
          :options="getAssigneeOptions()"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          filled
          clearable
          :label="getAssigneeLabel()"
          :hint="getAssigneeHint()"
          use-input
          input-debounce="300"
          @filter="filterAssignees"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar v-if="formData.assigneeType === 'SPECIFIC_USER'">
                <q-avatar size="32px">
                  <img :src="scope.opt.avatar || '/images/person01.webp'" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.name }}</q-item-label>
                <q-item-label caption v-if="scope.opt.description">
                  {{ scope.opt.description }}
                </q-item-label>
                <q-item-label caption v-if="scope.opt.userCount !== undefined">
                  <q-icon name="people" size="xs" /> {{ scope.opt.userCount }} users
                </q-item-label>
                <q-item-label caption v-if="scope.opt.email">
                  {{ scope.opt.email }}
                </q-item-label>
                <q-item-label caption v-if="scope.opt.roleName">
                  <q-chip size="xs" dense>{{ scope.opt.roleName }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Stage Type Info -->
      <div class="section">
        <q-banner class="bg-blue-1" dense>
          <template v-slot:avatar>
            <q-icon name="info" color="blue" />
          </template>
          <div class="text-caption">
            <strong>Stage Type:</strong> 
            <span v-if="stage?.isInitial && stage?.isFinal">Start & End Stage</span>
            <span v-else-if="stage?.isInitial">Start Stage</span>
            <span v-else-if="stage?.isFinal">End Stage</span>
            <span v-else>Middle Stage</span>
            <br />
            <span class="text-grey-7">
              Stage types are automatically determined based on workflow connections.
            </span>
          </div>
        </q-banner>
      </div>

      <!-- Actions -->
      <div class="actions">
        <q-btn
          type="submit"
          label="Save Changes"
          color="primary"
          :loading="saving"
          :disable="!hasChanges"
        />
        <q-btn
          label="Reset"
          flat
          @click="resetForm"
          :disable="!hasChanges"
        />
      </div>
    </q-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import GInput from '../../../../components/shared/form/GInput.vue';

export default defineComponent({
  name: 'WorkflowStageDetails',
  components: {
    GInput,
  },
  props: {
    stage: {
      type: Object as PropType<any>,
      required: true,
    },
    workflowId: {
      type: Number,
      required: true,
    },
  },
  emits: ['updated'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;

    const formData = ref<any>({});
    const originalData = ref<any>({});
    const saving = ref(false);
    const assigneeTypeOptions = ref<any[]>([]);
    const assigneeOptions = ref<any>({
      departments: [],
      roles: [],
      users: []
    });
    const filteredAssignees = ref<any[]>([]);

    const isNew = computed(() => !props.stage?.id);

    const hasChanges = computed(() => {
      return JSON.stringify(formData.value) !== JSON.stringify(originalData.value);
    });

    const loadOptions = async () => {
      if (!$api) return;

      try {
        // Load assignee options
        const assigneeResponse = await $api.get('/workflow-template/options/assignees');
        const data = assigneeResponse.data;
        assigneeTypeOptions.value = data.assigneeTypes;
        assigneeOptions.value = {
          departments: data.departments,
          roles: data.roles,
          users: data.users
        };
      } catch (error) {
        console.error('Failed to load options:', error);
      }
    };

    const getAssigneeLabel = () => {
      switch (formData.value.assigneeType) {
        case 'DEPARTMENT': return 'Select Department';
        case 'ROLE': return 'Select Role';
        case 'SPECIFIC_USER': return 'Select User';
        default: return 'Select Assignee';
      }
    };

    const getAssigneeHint = () => {
      switch (formData.value.assigneeType) {
        case 'DEPARTMENT': return 'All users in this department will be assigned';
        case 'ROLE': return 'All users with this role will be assigned';
        case 'SPECIFIC_USER': return 'This specific user will be assigned';
        default: return '';
      }
    };

    const getAssigneeOptions = () => {
      switch (formData.value.assigneeType) {
        case 'DEPARTMENT': return filteredAssignees.value.length ? filteredAssignees.value : assigneeOptions.value.departments;
        case 'ROLE': return filteredAssignees.value.length ? filteredAssignees.value : assigneeOptions.value.roles;
        case 'SPECIFIC_USER': return filteredAssignees.value.length ? filteredAssignees.value : assigneeOptions.value.users;
        default: return [];
      }
    };

    const filterAssignees = (val: string, update: (fn: () => void) => void) => {
      update(() => {
        const needle = val.toLowerCase();
        let options: any[] = [];
        
        switch (formData.value.assigneeType) {
          case 'DEPARTMENT':
            options = assigneeOptions.value.departments;
            break;
          case 'ROLE':
            options = assigneeOptions.value.roles;
            break;
          case 'SPECIFIC_USER':
            options = assigneeOptions.value.users;
            break;
        }
        
        filteredAssignees.value = options.filter(opt => 
          opt.name.toLowerCase().includes(needle) ||
          (opt.email && opt.email.toLowerCase().includes(needle)) ||
          (opt.description && opt.description.toLowerCase().includes(needle))
        );
      });
    };

    const saveChanges = async () => {
      if (!$api) return;
      
      saving.value = true;
      try {
        await $api.put(`/workflow-stage/${props.stage.id}`, formData.value);
        originalData.value = { ...formData.value };
        $q.notify({
          type: 'positive',
          message: 'Stage updated successfully',
        });
        emit('updated');
      } catch (error) {
        console.error('Failed to save stage:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to save changes',
          icon: 'report_problem',
        });
      } finally {
        saving.value = false;
      }
    };

    const resetForm = () => {
      formData.value = { ...originalData.value };
    };

    watch(
      () => props.stage,
      (newStage) => {
        if (newStage) {
          formData.value = {
            name: newStage.name,
            key: newStage.key,
            description: newStage.description || '',
            color: newStage.color,
            textColor: newStage.textColor,
            assigneeType: newStage.assigneeType || null,
            assigneeId: newStage.assigneeId || null,
          };
          originalData.value = { ...formData.value };
          loadOptions();
        }
      },
      { immediate: true }
    );

    // Reset assigneeId when assigneeType changes
    watch(
      () => formData.value.assigneeType,
      () => {
        formData.value.assigneeId = null;
        filteredAssignees.value = [];
      }
    );

    return {
      formData,
      saving,
      isNew,
      hasChanges,
      assigneeTypeOptions,
      assigneeOptions,
      filteredAssignees,
      getAssigneeLabel,
      getAssigneeHint,
      getAssigneeOptions,
      filterAssignees,
      saveChanges,
      resetForm,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-stage-details {
  height: 100%;
  overflow-y: auto;
}

.section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.block {
  display: block;
}

.dialog-config-preview {
  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    
    .q-icon {
      opacity: 0.6;
    }
  }
}

.actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
</style>