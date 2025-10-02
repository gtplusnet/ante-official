<template>
  <q-dialog ref="dialog" @before-show="initForm">
    <TemplateDialog minWidth="400px" maxWidth="500px">
      <template #DialogIcon>
        <q-icon name="o_source" />
      </template>
      <template #DialogTitle>
        {{ sourceId ? 'Edit' : 'Add New' }} Deal Source
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="saveDealSource" class="q-px-md q-pb-md">
          <div class="q-mb-md">
            <g-input 
              v-model="form.sourceName" 
              label="Source Name" 
              type="text" 
              required
              placeholder="Enter deal source name"
            />
          </div>

          <!-- Actions -->
          <div class="text-right q-mt-lg">
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
              :label="sourceId ? 'Update' : 'Save'"
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, getCurrentInstance } from 'vue';
import { useQuasar, QDialog } from 'quasar';
import GInput from '../shared/form/GInput.vue';
import GButton from '../shared/buttons/GButton.vue';
import TemplateDialog from './TemplateDialog.vue';

defineOptions({
  name: 'AddEditDealSourceDialog',
});

const props = defineProps<{
  sourceId?: number;
}>();

const emit = defineEmits<{
  created: [source: any];
  updated: [source: any];
}>();

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;
const dialog = ref<InstanceType<typeof QDialog>>();

interface DealSourceForm {
  sourceName: string;
}

const form = ref<DealSourceForm>({
  sourceName: '',
});

const initForm = async () => {
  if (props.sourceId) {
    // Edit mode - fetch existing source
    try {
      const response = await $api?.get(`/deal-source/${props.sourceId}`);
      if (response?.data) {
        form.value.sourceName = response.data.sourceName || '';
      }
    } catch (error) {
      console.error('Failed to fetch deal source:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to load deal source data',
        icon: 'error'
      });
    }
  } else {
    // Create mode - reset form
    form.value.sourceName = '';
  }
};

const saveDealSource = async () => {
  if (!$api) return;

  const isEdit = !!props.sourceId;
  $q.loading.show({ message: isEdit ? 'Updating deal source...' : 'Creating deal source...' });

  try {
    let response;
    
    if (isEdit) {
      // Update existing source
      response = await $api.patch(`/deal-source/${props.sourceId}`, {
        sourceName: form.value.sourceName,
      });
      emit('updated', response.data);
    } else {
      // Create new source
      response = await $api.post('/deal-source', {
        sourceName: form.value.sourceName,
      });
      emit('created', response.data);
    }

    $q.notify({
      color: 'positive',
      message: `Deal source ${isEdit ? 'updated' : 'created'} successfully`,
      icon: 'check',
    });

    if (dialog.value) {
      dialog.value.hide();
    }
  } catch (error: any) {
    console.error(`Failed to ${isEdit ? 'update' : 'create'} deal source:`, error);
    
    const errorMessage = error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} deal source`;
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
    });
  } finally {
    $q.loading.hide();
  }
};

const show = () => {
  if (dialog.value) {
    dialog.value.show();
  }
};

const hide = () => {
  if (dialog.value) {
    dialog.value.hide();
  }
};

defineExpose({
  show,
  hide,
});
</script>

<style scoped lang="scss">
// Custom styles for AddEditDealSourceDialog - TemplateDialog handles most styling
</style>