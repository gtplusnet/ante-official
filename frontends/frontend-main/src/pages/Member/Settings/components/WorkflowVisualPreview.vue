<template>
  <div class="workflow-visual-preview">
    <div class="workflow-stages-vertical" v-if="stages.length > 0">
      <div
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="stage-preview-wrapper"
      >
        <div class="stage-preview-card">
          <div class="stage-number">{{ index + 1 }}</div>
          <div class="stage-content">
            <q-chip
              :label="stage.name"
              :style="{
                backgroundColor: stage.color,
                color: stage.textColor,
              }"
              class="stage-chip"
            />
            <div class="stage-key text-caption text-grey-7">
              {{ stage.key }}
            </div>
            <div class="stage-badges">
              <q-badge v-if="stage.isInitial" color="green" label="START" class="text-tiny" />
              <q-badge v-if="stage.isFinal" color="red" label="END" class="text-tiny" />
            </div>
          </div>
        </div>
        <div v-if="index < stages.length - 1" class="stage-connector">
          <div class="connector-line"></div>
          <q-icon name="arrow_downward" size="18px" color="grey-6" />
        </div>
      </div>
    </div>
    <div v-else class="text-center text-grey">
      No stages defined
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'WorkflowVisualPreview',
  props: {
    stages: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    transitions: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
  },
});
</script>

<style lang="scss" scoped>
.workflow-visual-preview {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.workflow-stages-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.stage-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.stage-preview-card {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 20px;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
}

.stage-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #616161;
  margin-right: 16px;
  flex-shrink: 0;
}

.stage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-chip {
  font-size: 14px;
  padding: 6px 12px;
  font-weight: 500;
}

.stage-key {
  font-size: 11px;
  font-family: monospace;
  opacity: 0.8;
}

.stage-badges {
  display: flex;
  gap: 6px;
  margin-top: 4px;

  .q-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
}

.stage-connector {
  height: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.connector-line {
  width: 2px;
  height: 20px;
  background-color: #9e9e9e;
  position: absolute;
  top: 0;
}

.text-tiny {
  font-size: 10px !important;
}
</style>