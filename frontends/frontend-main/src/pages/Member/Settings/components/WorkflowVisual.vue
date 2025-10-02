<template>
  <div class="workflow-visual">
    <div class="workflow-container" v-if="stages.length > 0">
      <div class="workflow-stages-vertical">
        <div
          v-for="(stage, index) in stages"
          :key="stage.id"
          class="stage-wrapper-vertical"
        >
          <!-- Stage Node -->
          <div class="stage-node-vertical">
            <q-card
              flat
              bordered
              class="stage-card"
              :class="{ 
                'stage-initial': stage.isInitial,
                'stage-final': stage.isFinal
              }"
            >
              <q-card-section class="stage-content">
                <div class="stage-header">
                  <q-chip 
                    :style="{
                      backgroundColor: stage.color,
                      color: stage.textColor,
                    }"
                    class="stage-chip"
                  >
                    {{ stage.key }}
                  </q-chip>
                  <div class="stage-badges">
                    <q-badge v-if="stage.isInitial" color="green" label="START" />
                    <q-badge v-if="stage.isFinal" color="red" label="END" />
                  </div>
                </div>
                <div class="stage-info">
                  <div class="text-h6 q-mb-xs">{{ stage.name }}</div>
                  <div class="text-caption text-grey-7" v-if="stage.description">
                    {{ stage.description }}
                  </div>
                </div>
                
                <!-- Connection Controls -->
                <div class="stage-actions" v-if="!stage.isFinal">
                  <q-btn
                    size="sm"
                    flat
                    dense
                    round
                    icon="add_circle"
                    color="primary"
                    @click="startConnection(stage)"
                    :class="{ 'pulse-animation': connectingFrom?.id === stage.id }"
                  >
                    <q-tooltip>Add transition from this stage</q-tooltip>
                  </q-btn>
                </div>
              </q-card-section>
            </q-card>

          </div>

          <!-- Default Arrow to next stage -->
          <div v-if="index < stages.length - 1" class="stage-connector">
            <div class="connector-line"></div>
            <q-icon name="arrow_downward" size="md" color="grey-6" class="connector-arrow" />
          </div>
        </div>
      </div>

      <!-- Custom Transitions -->
      <div class="custom-transitions q-mt-lg" v-if="customTransitions.length > 0">
        <div class="text-subtitle2 q-mb-md">Custom Transitions</div>
        <q-list bordered separator>
          <q-item v-for="transition in customTransitions" :key="transition.id">
            <q-item-section>
              <q-item-label>
                {{ getStageById(transition.fromStageId)?.name }}
                <q-icon name="arrow_forward" />
                {{ transition.toStageId ? getStageById(transition.toStageId)?.name : 'End' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                icon="delete"
                size="sm"
                flat
                round
                color="negative"
                @click="$emit('remove-transition', transition.id)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <div v-else class="text-center text-grey q-pa-xl">
      <q-icon name="account_tree" size="64px" />
      <div class="q-mt-md">No stages defined yet</div>
    </div>

    <!-- Connection Dialog -->
    <q-dialog v-model="showConnectionDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add Transition</div>
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md">
            <strong>From:</strong> {{ connectingFrom?.name }}
          </div>
          <q-select
            v-model="connectingTo"
            :options="availableTargetStages"
            option-label="name"
            option-value="id"
            label="To Stage"
            emit-value
            map-options
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup @click="cancelConnection" />
          <q-btn
            label="Add"
            color="primary"
            @click="confirmConnection"
            :disable="!connectingTo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';

export default defineComponent({
  name: 'WorkflowVisual',
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
  emits: ['add-transition', 'remove-transition'],
  setup(props, { emit }) {
    const connectingFrom = ref<any>(null);
    const connectingTo = ref<number | null>(null);
    const showConnectionDialog = ref(false);


    const customTransitions = computed(() => {
      // Filter out sequential transitions (already shown as arrows)
      return props.transitions.filter(t => {
        const fromIndex = props.stages.findIndex(s => s.id === t.fromStageId);
        const toIndex = props.stages.findIndex(s => s.id === t.toStageId);
        return toIndex !== fromIndex + 1;
      });
    });

    const availableTargetStages = computed(() => {
      if (!connectingFrom.value) return [];
      
      const fromIndex = props.stages.findIndex(s => s.id === connectingFrom.value.id);
      const targets = [];

      // Add all stages except the current one and the immediate next
      props.stages.forEach((stage, index) => {
        if (stage.id !== connectingFrom.value.id && index !== fromIndex + 1) {
          targets.push(stage);
        }
      });

      // Add "End" option if not the last stage
      if (!connectingFrom.value.isFinal) {
        targets.push({ id: null, name: 'End Workflow' });
      }

      return targets;
    });

    const getStageById = (id: number) => {
      return props.stages.find(s => s.id === id);
    };

    const startConnection = (stage: any) => {
      connectingFrom.value = stage;
      connectingTo.value = null;
      showConnectionDialog.value = true;
    };

    const cancelConnection = () => {
      connectingFrom.value = null;
      connectingTo.value = null;
    };

    const confirmConnection = () => {
      if (connectingFrom.value && connectingTo.value !== undefined) {
        emit('add-transition', connectingFrom.value.id, connectingTo.value);
      }
      showConnectionDialog.value = false;
      cancelConnection();
    };

    return {
      connectingFrom,
      connectingTo,
      showConnectionDialog,
      customTransitions,
      availableTargetStages,
      getStageById,
      startConnection,
      cancelConnection,
      confirmConnection,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-visual {
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 400px;
}

.workflow-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.workflow-stages-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 600px;
  width: 100%;
}

.stage-wrapper-vertical {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stage-node-vertical {
  width: 100%;
  position: relative;
}

.stage-card {
  width: 100%;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.stage-initial {
    border-color: #4CAF50;
    border-width: 3px;
  }
  
  &.stage-final {
    border-color: #F44336;
    border-width: 3px;
  }
}

.stage-content {
  padding: 20px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stage-chip {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 8px 16px;
}

.stage-badges {
  display: flex;
  gap: 8px;
}

.stage-info {
  text-align: left;
}

.stage-actions {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
}

.stage-connector {
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.connector-line {
  width: 2px;
  height: 30px;
  background-color: #9e9e9e;
  position: absolute;
  top: 0;
}

.connector-arrow {
  position: absolute;
  bottom: -5px;
  background-color: #f5f5f5;
  padding: 2px;
}


.custom-transitions {
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
</style>