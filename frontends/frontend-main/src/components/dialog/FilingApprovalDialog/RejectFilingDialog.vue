<template>
  <q-dialog ref="dialog" @before-show="fetchData" transition-show="scale" transition-hide="scale">
    <q-card class="reject-filing-dialog">
      <!-- Header with MD3 styling -->
      <q-card-section class="dialog-header">
        <div class="row items-center no-wrap">
          <q-icon name="o_block" size="24px" class="q-mr-sm text-negative" />
          <div class="text-h6 text-grey-9">Reject Filing</div>
          <q-space />
          <q-btn icon="close" flat round dense color="grey-8" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
      
      <q-card-section class="q-pa-lg">
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <div class="text-body1 text-grey-8 q-mb-md">
            Please provide a detailed reason for rejecting this filing request.
          </div>
          
          <q-input
            v-model="rejectReason"
            type="textarea"
            outlined
            label="Rejection reason"
            :rules="[val => !!val || 'Rejection reason is required']"
            counter
            maxlength="500"
            autogrow
            class="rejection-textarea"
          >
            <template v-slot:prepend>
              <q-icon name="o_edit_note" color="grey-6" />
            </template>
          </q-input>

          <q-separator class="q-my-lg" />

          <div class="row justify-end q-gutter-md">
            <q-btn 
              outline
              color="grey-8"
              label="Cancel"
              icon="o_close"
              v-close-popup
              class="text-body2"
            />
            <q-btn 
              unelevated
              color="negative"
              label="Reject Filing"
              icon="o_block"
              type="submit"
              :loading="isProcessing"
              class="text-body2"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.reject-filing-dialog {
  min-width: 500px;
  max-width: 600px;
  border-radius: 28px;
  overflow: hidden;
}

.dialog-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.rejection-textarea {
  :deep(.q-field__control) {
    min-height: 120px;
  }
  
  :deep(textarea) {
    line-height: 1.5;
  }
}

// Material Design 3 elevation
.q-card {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06);
}

// Button hover effects
.q-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.02em;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
  
  &[type="submit"]:hover {
    background-color: #d32f2f !important;
  }
}

// Input focus effects
.q-input {
  :deep(.q-field__control) {
    transition: all 0.3s ease;
  }
  
  &.q-field--focused {
    :deep(.q-field__control) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

// Separator styling
.q-separator {
  opacity: 0.12;
}
</style>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { CombinedTaskResponseInterface } from 'src/shared/interfaces/task.interfaces';
import { FilingDisplayData } from 'src/interfaces/filing-notification.interface';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

export default defineComponent({
  name: 'FilingApprovalDialog',
  components: {},
  props: {
    task: {
      type: Object as PropType<CombinedTaskResponseInterface | null>,
      default: null,
    },
    filing: {
      type: Object as PropType<FilingDisplayData | null>,
      default: null,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const rejectReason = ref('');
    const isProcessing = ref(false);

    const onSubmit = async () => {
      if (!rejectReason.value.trim()) {
        $q.notify({
          type: 'warning',
          message: 'Please provide a rejection reason',
        });
        return;
      }
      
      isProcessing.value = true;
      
      try {
        // Handle task-based rejection
        if (props.task?.id) {
          await api.patch(`/approval/task/${props.task.id}`, {
            action: 'reject',
            remarks: rejectReason.value,
          });
        }
        // Handle direct filing rejection
        else if (props.filing?.id) {
          await api.post('/hr-filing/filing/reject', {
            id: props.filing.id,
            remarks: rejectReason.value,
          });
        }
        
        emit('rejectedDone');
      } catch (error: any) {
        handleAxiosError($q, error);
      } finally {
        isProcessing.value = false;
      }
    };

    const fetchData = () => {
      rejectReason.value = '';
    };

    return {
      rejectReason,
      isProcessing,
      onSubmit,
      fetchData,
    };
  },
});
</script>
