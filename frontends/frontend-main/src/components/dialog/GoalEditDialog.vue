<template>
  <q-dialog ref="dialogRef" @before-show="initForm">
    <TemplateDialog minWidth="500px" maxWidth="500px">
      <template #DialogIcon>
        <q-icon name="o_edit" />
      </template>

      <template #DialogTitle>
        <div class="cursor-pointer">Edit Goal</div>
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <q-form @submit.prevent="save">
            <div class="row">
              <!-- Goal Name -->
              <div class="col-12 q-px-sm q-mb-md">
                <g-input
                  required
                  type="text"
                  label="Goal Name"
                  v-model="form.name"
                  placeholder="Enter goal name"
                />
              </div>

              <!-- Goal Description -->
              <div class="col-12 q-px-sm q-mb-md">
                <g-input
                  type="textarea"
                  label="Description"
                  v-model="form.description"
                  placeholder="Enter goal description"
                  :rows="3"
                />
              </div>

              <!-- Goal Deadline -->
              <div class="col-12 q-px-sm q-mb-md">
                <g-input
                  type="date"
                  label="Deadline (Optional)"
                  v-model="form.deadline"
                />
              </div>
            </div>

            <div class="text-right">
              <GButton
                no-caps
                class="q-mr-sm"
                variant="tonal"
                label="Cancel"
                type="button"
                color="light-grey"
                v-close-popup
              />
              <GButton
                no-caps
                unelevated
                label="Update Goal"
                type="submit"
                color="primary"
                :loading="saving"
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';
import { QDialog, useQuasar } from 'quasar';
import GInput from 'src/components/shared/form/GInput.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useGoalStore, type GoalData } from 'src/stores/goal';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface GoalForm {
  name: string;
  description: string;
  deadline: string;
}

export default defineComponent({
  name: 'GoalEditDialog',
  components: {
    GInput,
    GButton,
    TemplateDialog
  },
  props: {
    goal: {
      type: Object as PropType<GoalData | null>,
      default: null
    }
  },
  emits: ['close', 'goal-updated'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const goalStore = useGoalStore();
    const dialogRef = ref<InstanceType<typeof QDialog>>();
    const saving = ref(false);

    const form = ref<GoalForm>({
      name: '',
      description: '',
      deadline: ''
    });

    const initForm = () => {
      // Populate form with goal data
      if (props.goal) {
        form.value = {
          name: props.goal.name || '',
          description: props.goal.description || '',
          deadline: props.goal.deadline?.raw || ''
        };
      }
    };

    const save = async () => {
      if (!props.goal) {
        console.error('No goal to update');
        return;
      }

      saving.value = true;

      try {
        // Prepare data for API
        const updateData: any = {
          name: form.value.name
        };

        // Add optional fields
        if (form.value.description !== undefined) {
          updateData.description = form.value.description;
        }

        if (form.value.deadline !== undefined) {
          updateData.deadline = form.value.deadline || null;
        }

        // Update goal via store
        await goalStore.updateGoalInDB(props.goal.id, updateData);

        // Emit success
        emit('goal-updated');
        emit('close');

        // Close dialog
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      } catch (error) {
        console.error('Failed to update goal:', error);
        // Error notification is handled by the store
      } finally {
        saving.value = false;
      }
    };

    return {
      dialogRef,
      form,
      saving,
      initForm,
      save
    };
  }
});
</script>
