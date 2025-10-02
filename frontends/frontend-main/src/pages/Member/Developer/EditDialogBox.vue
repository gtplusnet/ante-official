<template>
  <q-dialog
    v-model="isOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-label-large">Edit Company Information</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="saveChanges" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="formData.name"
                label="Company Name"
                outlined
                dense
                :rules="[val => !!val || 'Field is required']"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="formData.domain"
                label="Company Code"
                outlined
                dense
                :rules="[val => !!val || 'Field is required']"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Save" color="primary" @click="saveChanges" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

interface Company {
  id: number;
  name: string;
  domain: string;
}

export default defineComponent({
  name: 'CompanyEditDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    company: {
      type: Object as () => Company | null,
      required: true
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const formData = ref<Company>({
      id: 0,
      name: '',
      domain: ''
    });

    watch(() => props.modelValue, (newValue) => {
      isOpen.value = newValue;
    });

    watch(isOpen, (newValue) => {
      emit('update:modelValue', newValue);
    });

    watch(() => props.company, (newValue) => {
      if (newValue) {
        formData.value = { ...newValue };
      }
    }, { immediate: true });

    const saveChanges = () => {
      emit('save', formData.value);
      isOpen.value = false;
    };

    return {
      isOpen,
      formData,
      saveChanges
    };
  }
});
</script>
