<template>
  <div class="import-method-selector">
    <div class="q-mb-md text-title-medium">Select Import Method</div>
    <div class="row q-gutter-md">
      <div
        v-for="method in importMethods"
        :key="method.value"
        class="col-12 col-md"
      >
        <q-card
          flat
          bordered
          class="method-card cursor-pointer"
          :class="{ 'selected': selectedMethod === method.value }"
          @click="selectMethod(method.value)"
        >
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon
                :name="method.icon"
                size="48px"
                :color="selectedMethod === method.value ? method.color : 'grey-6'"
              />
              <div class="col">
                <div class="text-title-medium">{{ method.label }}</div>
                <div class="text-grey-7 text-body-medium">{{ method.description }}</div>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-sm">
            <div class="text-grey-6 text-body-small">
              <q-icon name="description" size="xs" class="q-mr-xs" />
              Supported: {{ method.formatText }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="selectedMethod" class="q-mt-lg">
      <q-btn
        color="primary"
        label="Continue"
        class="text-label-large"
        icon-right="arrow_forward"
        @click="continueWithMethod"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { BiometricModel, BiometricModelInfo } from '../../../../../shared/enums/biometric-model.enum';

export default {
  name: 'ImportMethodSelector',
  emits: ['method-selected'],
  setup(props, { emit }) {
    const selectedMethod = ref<BiometricModel | null>(null);

    const importMethods = Object.entries(BiometricModelInfo).map(([value, info]) => ({
      value: value as BiometricModel,
      ...info
    }));

    function selectMethod(method: BiometricModel) {
      selectedMethod.value = method;
    }

    function continueWithMethod() {
      if (selectedMethod.value) {
        emit('method-selected', selectedMethod.value);
      }
    }

    return {
      selectedMethod,
      importMethods,
      selectMethod,
      continueWithMethod
    };
  }
};
</script>

<style scoped>
.method-card {
  transition: all 0.3s ease;
  border-width: 2px;
}

.method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.method-card.selected {
  border-color: var(--q-primary);
  background-color: rgba(var(--q-primary-rgb), 0.05);
}
</style>
