<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 700px; max-width: 900px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEditing ? 'Edit Stage' : 'Add Stage' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="q-gutter-md">
            <g-input
              v-model="formData.name"
              label="Stage Name"
              :rules="[(val: string) => !!val || 'Name is required']"
              required
            />

            <g-input
              v-model="formData.key"
              label="Stage Key"
              hint="Uppercase with underscores only (e.g., PENDING_APPROVAL)"
              :rules="[
                (val: string) => !!val || 'Key is required',
                (val: string) => /^[A-Z_]+$/.test(val) || 'Key must be uppercase with underscores only',
                (val: string) => !isDuplicateKey(val) || 'Key already exists'
              ]"
              :disable="isEditing"
              required
            />

            <g-input
              v-model="formData.description"
              label="Description"
              type="textarea"
              rows="2"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-body-small q-mb-sm">Background Color</div>
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
                <div class="text-body-small q-mb-sm">Text Color</div>
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

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-toggle
                  v-model="formData.isInitial"
                  label="Initial Stage"
                  hint="First stage in the workflow"
                  disable
                />
              </div>
              <div class="col-6">
                <q-toggle
                  v-model="formData.isFinal"
                  label="Final Stage"
                  hint="Last stage in the workflow"
                  disable
                />
              </div>
            </div>
            <q-banner class="q-mt-sm bg-blue-1" dense>
              <template v-slot:avatar>
                <q-icon name="info" color="blue" />
              </template>
              <div class="text-caption">
                Start and End stages are automatically detected based on workflow connections.
                A stage becomes a start stage if it has no incoming arrows, and an end stage if it has no outgoing arrows.
              </div>
            </q-banner>

            <!-- Assignee Configuration Section -->
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-md">Assignee Configuration</div>
            
            <div class="q-gutter-md">
              <div>
                <label class="text-body-small q-mb-sm block">Assignee Type</label>
                <q-select
                  v-model="formData.assigneeType"
                  :options="assigneeTypeOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  filled
                  clearable
                  hint="Who should be assigned to handle this stage"
                />
              </div>

              <div v-if="formData.assigneeType && formData.assigneeType !== 'DIRECT_SUPERVISOR'">
                <label class="text-body-small q-mb-sm block">
                  {{ getAssigneeLabel() }}
                </label>
                <q-select
                  v-model="formData.assigneeId"
                  :options="getAssigneeOptions()"
                  option-value="id"
                  option-label="name"
                  emit-value
                  map-options
                  filled
                  clearable
                  :hint="getAssigneeHint()"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.name }}</q-item-label>
                        <q-item-label caption v-if="scope.opt.description">
                          {{ scope.opt.description }}
                        </q-item-label>
                        <q-item-label caption v-if="scope.opt.userCount !== undefined">
                          {{ scope.opt.userCount }} users
                        </q-item-label>
                        <q-item-label caption v-if="scope.opt.email">
                          {{ scope.opt.email }}
                        </q-item-label>
                        <q-item-label caption v-if="scope.opt.roleName">
                          Role: {{ scope.opt.roleName }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            :label="isEditing ? 'Update' : 'Add'"
            type="submit"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import GInput from '../../../../components/shared/form/GInput.vue';

export default defineComponent({
  name: 'WorkflowStageEditDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    stage: {
      type: Object,
      default: null,
    },
    workflowId: {
      type: Number,
      required: true,
    },
    existingStages: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const loading = ref(false);
    const formData = ref({
      name: '',
      key: '',
      description: '',
      color: '#1976D2',
      textColor: '#FFFFFF',
      isInitial: false,
      isFinal: false,
      assigneeType: null as string | null,
      assigneeId: null as string | null,
    });

    const assigneeTypeOptions = ref<any[]>([]);
    const assigneeOptions = ref<any>({
      departments: [],
      roles: [],
      users: []
    });

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const isEditing = computed(() => !!props.stage);

    const isDuplicateKey = (key: string) => {
      if (!key) return false;
      return props.existingStages.some((s: any) => 
        s.key === key && s.id !== props.stage?.id
      );
    };

    const onSubmit = async () => {
      if (!$api) return;
      loading.value = true;
      try {
        if (isEditing.value) {
          await $api.put(`/workflow-stage/${props.stage.id}`, formData.value);
          $q.notify({
            type: 'positive',
            message: 'Stage updated successfully',
          });
        } else {
          const nextSequence = props.existingStages.length + 1;
          await $api.post('/workflow-stage', {
            ...formData.value,
            workflowId: props.workflowId,
            sequence: nextSequence,
          });
          $q.notify({
            type: 'positive',
            message: 'Stage added successfully',
          });
        }
        emit('saved');
        dialogVisible.value = false;
        resetForm();
      } catch (error) {
        console.error('Failed to save stage:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to save stage',
          icon: 'report_problem'
        });
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      formData.value = {
        name: '',
        key: '',
        description: '',
        color: '#1976D2',
        textColor: '#FFFFFF',
        isInitial: false,
        isFinal: false,
        assigneeType: null,
        assigneeId: null,
      };
    };


    const loadAssigneeOptions = async () => {
      if (!$api) return;
      try {
        const response = await $api.get('/workflow-template/options/assignees');
        const data = response.data;
        assigneeTypeOptions.value = data.assigneeTypes;
        assigneeOptions.value = {
          departments: data.departments,
          roles: data.roles,
          users: data.users
        };
      } catch (error) {
        console.error('Failed to load assignee options:', error);
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
        case 'DEPARTMENT': return assigneeOptions.value.departments;
        case 'ROLE': return assigneeOptions.value.roles;
        case 'SPECIFIC_USER': return assigneeOptions.value.users;
        default: return [];
      }
    };


    watch(
      () => props.stage,
      (stage) => {
        if (stage) {
          formData.value = {
            name: stage.name,
            key: stage.key,
            description: stage.description || '',
            color: stage.color,
            textColor: stage.textColor,
            isInitial: stage.isInitial,
            isFinal: stage.isFinal,
            assigneeType: stage.assigneeType || null,
            assigneeId: stage.assigneeId || null,
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
          loadAssigneeOptions();
        }
      }
    );

    // Reset assigneeId when assigneeType changes
    watch(
      () => formData.value.assigneeType,
      () => {
        formData.value.assigneeId = null;
      }
    );

    return {
      dialogVisible,
      loading,
      formData,
      isEditing,
      isDuplicateKey,
      onSubmit,
      assigneeTypeOptions,
      assigneeOptions,
      getAssigneeLabel,
      getAssigneeHint,
      getAssigneeOptions,
    };
  },
});
</script>

<style lang="scss" scoped>
.block {
  display: block;
}
</style>