<template>
  <div class="workflow-canvas-preview">
    <div class="canvas-container" ref="canvasContainer">
      <div 
        class="canvas-content" 
        :style="canvasStyle"
      >
        <!-- Connection Lines -->
        <svg 
          class="connections-layer" 
          :style="svgStyle"
        >
          <defs>
            <marker
              id="arrowhead-preview"
              markerWidth="8"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#666" />
            </marker>
            <marker
              id="arrowhead-reject-preview"
              markerWidth="8"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#e74c3c" />
            </marker>
          </defs>
          
          <!-- Transitions -->
          <g v-for="transition in allTransitions" :key="`transition-${transition.id}`">
            <path
              :d="getConnectionPath(transition)"
              :stroke="transition.transitionType === 'REJECTION' ? '#e74c3c' : '#666'"
              :stroke-width="2 / scale"
              fill="none"
              :stroke-opacity="0.8"
              :marker-end="transition.transitionType === 'REJECTION' ? 'url(#arrowhead-reject-preview)' : 'url(#arrowhead-preview)'"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Label background -->
            <rect
              v-if="transition.buttonName || transition.transitionType === 'REJECTION'"
              :x="getTransitionLabelBackground(transition).x"
              :y="getTransitionLabelBackground(transition).y"
              :width="getTransitionLabelBackground(transition).width"
              :height="getTransitionLabelBackground(transition).height"
              :rx="4 / scale"
              :fill="transition.transitionType === 'REJECTION' ? '#ffffff' : '#ffffff'"
              :stroke="transition.transitionType === 'REJECTION' ? '#e74c3c' : (transition.buttonColor || '#9E9E9E')"
              :stroke-width="2 / scale"
              class="label-background"
            />
            <text
              v-if="transition.buttonName || transition.transitionType === 'REJECTION'"
              :x="getTransitionLabelPosition(transition).x"
              :y="getTransitionLabelPosition(transition).y"
              text-anchor="middle"
              :class="transition.transitionType === 'REJECTION' ? 'rejection-label' : 'transition-label'"
              :font-size="11 / scale"
            >
              {{ transition.buttonName || 'Reject' }}
            </text>
          </g>
        </svg>

        <!-- Workflow Stages -->
        <div
          v-for="stage in normalizedStages"
          :key="stage.id"
          class="workflow-stage-preview"
          :class="{
            'stage-initial': stage.isInitial,
            'stage-final': stage.isFinal
          }"
          :style="{
            left: stage.position.x + 'px',
            top: stage.position.y + 'px',
            backgroundColor: stage.color,
            color: stage.textColor
          }"
        >
          <!-- Stage Header -->
          <div class="stage-header">
            <div class="stage-badges">
              <q-badge v-if="stage.isInitial" color="green" label="Start" />
              <q-badge v-if="stage.isFinal" color="red" label="End" />
            </div>
          </div>

          <!-- Stage Content -->
          <div class="stage-content">
            <div class="stage-name">{{ stage.name }}</div>
            <div class="stage-key">{{ stage.key }}</div>

            <!-- Stage Details -->
            <div class="stage-details" v-if="showDetails">
              <div v-if="stage.assigneeType" class="detail-item">
                <q-icon name="person" size="xs" />
                <span>{{ getAssigneeDisplay(stage) }}</span>
              </div>
              <div v-if="stage.dialogType" class="detail-item">
                <q-icon name="chat_bubble" size="xs" />
                <span>{{ stage.dialogType }}</span>
              </div>
              <div v-if="stage.rejectFallbackStageId" class="detail-item">
                <q-icon name="undo" size="xs" color="red" />
                <span>Has rejection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';

interface StagePosition {
  x: number;
  y: number;
}

interface WorkflowStage {
  id: number;
  name: string;
  key: string;
  color: string;
  textColor: string;
  position?: StagePosition;
  isInitial: boolean;
  isFinal: boolean;
  assigneeType?: string;
  dialogType?: string;
  rejectFallbackStageId?: number;
}

export default defineComponent({
  name: 'WorkflowCanvasPreview',
  props: {
    stages: {
      type: Array as PropType<WorkflowStage[]>,
      default: () => [],
    },
    transitions: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    showDetails: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const canvasContainer = ref<HTMLElement>();
    const scale = ref(1);
    const bounds = ref({ minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 });

    const stagesWithPositions = computed(() => {
      return props.stages.map((stage, index) => ({
        ...stage,
        position: stage.position || calculateDefaultPosition(index, props.stages.length)
      }));
    });

    const normalizedStages = computed(() => {
      return stagesWithPositions.value.map(stage => ({
        ...stage,
        position: {
          x: stage.position.x - bounds.value.minX,
          y: stage.position.y - bounds.value.minY
        }
      }));
    });

    const allTransitions = computed(() => {
      const transitions = [...props.transitions];
      
      // Add rejection transitions
      props.stages.forEach((stage) => {
        if (stage.rejectFallbackStageId) {
          transitions.push({
            id: `reject-${stage.id}`,
            fromStageId: stage.id,
            toStageId: stage.rejectFallbackStageId,
            transitionType: 'REJECTION'
          });
        }
      });
      
      return transitions;
    });

    const canvasStyle = computed(() => {
      const b = bounds.value;
      const centerX = (canvasContainer.value?.clientWidth || 0) / 2;
      const centerY = (canvasContainer.value?.clientHeight || 0) / 2;
      const scaledWidth = b.width * scale.value;
      const scaledHeight = b.height * scale.value;
      
      return {
        position: 'absolute' as const,
        width: `${b.width}px`,
        height: `${b.height}px`,
        transform: `scale(${scale.value})`,
        transformOrigin: '0 0',
        left: `${centerX - scaledWidth / 2}px`,
        top: `${centerY - scaledHeight / 2}px`
      };
    });

    const svgStyle = computed(() => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: `${bounds.value.width}px`,
      height: `${bounds.value.height}px`,
      overflow: 'visible' as const,
      pointerEvents: 'none' as const,
      zIndex: 1
    }));

    const calculateDefaultPosition = (index: number, total: number): StagePosition => {
      const centerX = 300;
      const centerY = 200;
      const radius = 150;
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    };

    const calculateBounds = () => {
      if (stagesWithPositions.value.length === 0) {
        return { 
          minX: 0, 
          minY: 0, 
          maxX: 600, 
          maxY: 400, 
          width: 600, 
          height: 400
        };
      }

      const stageWidth = 200;
      const stageHeight = 100;
      const padding = 50; // Extra padding for arrows
      
      const xs = stagesWithPositions.value.map(s => s.position.x);
      const ys = stagesWithPositions.value.map(s => s.position.y);
      
      const minX = Math.min(...xs) - padding;
      const minY = Math.min(...ys) - padding;
      const maxX = Math.max(...xs) + stageWidth + padding;
      const maxY = Math.max(...ys) + stageHeight + padding;
      
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    };

    const fitToContainer = async () => {
      await nextTick();
      
      if (!canvasContainer.value || stagesWithPositions.value.length === 0) return;

      const container = canvasContainer.value;
      bounds.value = calculateBounds();
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const padding = 40;
      
      // Calculate scale to fit content with padding
      const scaleX = (containerWidth - padding) / bounds.value.width;
      const scaleY = (containerHeight - padding) / bounds.value.height;
      
      // Use the smaller scale to ensure everything fits
      scale.value = Math.min(scaleX, scaleY, 0.9); // Cap at 0.9 for better visibility
    };

    const getConnectionPointPosition = (stage: any, side: 'top' | 'right' | 'bottom' | 'left') => {
      const stageWidth = 200;
      const stageHeight = 100;
      
      switch (side) {
        case 'top':
          return {
            x: stage.position.x + stageWidth / 2,
            y: stage.position.y
          };
        case 'right':
          return {
            x: stage.position.x + stageWidth,
            y: stage.position.y + stageHeight / 2
          };
        case 'bottom':
          return {
            x: stage.position.x + stageWidth / 2,
            y: stage.position.y + stageHeight
          };
        case 'left':
          return {
            x: stage.position.x,
            y: stage.position.y + stageHeight / 2
          };
      }
    };

    const getConnectionPath = (transition: any) => {
      const fromStage = normalizedStages.value.find(s => s.id === transition.fromStageId);
      const toStage = normalizedStages.value.find(s => s.id === transition.toStageId);
      
      if (!fromStage || !toStage) return '';
      
      const stageWidth = 200;
      const stageHeight = 100;
      
      // Use stored sides if available
      let fromSide = transition.fromSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      let toSide = transition.toSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      
      // If sides are not stored, calculate them based on stage positions
      if (!fromSide || !toSide) {
        const fromCenter = {
          x: fromStage.position.x + stageWidth / 2,
          y: fromStage.position.y + stageHeight / 2
        };
        const toCenter = {
          x: toStage.position.x + stageWidth / 2,
          y: toStage.position.y + stageHeight / 2
        };
        
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          fromSide = dx > 0 ? 'right' : 'left';
          toSide = dx > 0 ? 'left' : 'right';
        } else {
          fromSide = dy > 0 ? 'bottom' : 'top';
          toSide = dy > 0 ? 'top' : 'bottom';
        }
      }
      
      const from = getConnectionPointPosition(fromStage, fromSide);
      const to = getConnectionPointPosition(toStage, toSide);
      
      // Check if this is a rejection transition and apply offset
      const isRejection = transition.transitionType === 'REJECTION';
      const offsetAmount = 20;
      
      if (isRejection) {
        if (fromSide === 'left' || fromSide === 'right') {
          from.y += offsetAmount;
          to.y += offsetAmount;
        } else {
          from.x += offsetAmount;
          to.x += offsetAmount;
        }
      }
      
      // Create path based on the sides
      let path = `M ${from.x} ${from.y}`;
      
      if ((fromSide === 'top' || fromSide === 'bottom') && (toSide === 'top' || toSide === 'bottom')) {
        // Both vertical
        const midY = from.y + (to.y - from.y) / 2;
        path += ` L ${from.x} ${midY}`;
        path += ` L ${to.x} ${midY}`;
        path += ` L ${to.x} ${to.y}`;
      } else if ((fromSide === 'left' || fromSide === 'right') && (toSide === 'left' || toSide === 'right')) {
        // Both horizontal
        const midX = from.x + (to.x - from.x) / 2;
        path += ` L ${midX} ${from.y}`;
        path += ` L ${midX} ${to.y}`;
        path += ` L ${to.x} ${to.y}`;
      } else {
        // Mixed - one horizontal, one vertical
        if (fromSide === 'top' || fromSide === 'bottom') {
          // Start vertical, end horizontal
          const extendY = fromSide === 'top' ? from.y - 30 : from.y + 30;
          path += ` L ${from.x} ${extendY}`;
          path += ` L ${to.x} ${extendY}`;
          path += ` L ${to.x} ${to.y}`;
        } else {
          // Start horizontal, end vertical
          const extendX = fromSide === 'left' ? from.x - 30 : from.x + 30;
          path += ` L ${extendX} ${from.y}`;
          path += ` L ${extendX} ${to.y}`;
          path += ` L ${to.x} ${to.y}`;
        }
      }
      
      return path;
    };

    const getTransitionLabelPosition = (transition: any) => {
      const fromStage = normalizedStages.value.find(s => s.id === transition.fromStageId);
      const toStage = normalizedStages.value.find(s => s.id === transition.toStageId);
      
      if (!fromStage || !toStage) return { x: 0, y: 0 };
      
      const stageWidth = 200;
      const stageHeight = 100;
      
      // Use stored sides if available
      let fromSide = transition.fromSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      let toSide = transition.toSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      
      // If sides are not stored, calculate them based on stage positions
      if (!fromSide || !toSide) {
        const fromCenter = {
          x: fromStage.position.x + stageWidth / 2,
          y: fromStage.position.y + stageHeight / 2
        };
        const toCenter = {
          x: toStage.position.x + stageWidth / 2,
          y: toStage.position.y + stageHeight / 2
        };
        
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          fromSide = dx > 0 ? 'right' : 'left';
          toSide = dx > 0 ? 'left' : 'right';
        } else {
          fromSide = dy > 0 ? 'bottom' : 'top';
          toSide = dy > 0 ? 'top' : 'bottom';
        }
      }
      
      // Get actual connection points
      const from = getConnectionPointPosition(fromStage, fromSide);
      const to = getConnectionPointPosition(toStage, toSide);
      
      // Check if this is a rejection transition and apply offset
      const isRejection = transition.transitionType === 'REJECTION';
      const offsetAmount = 20;
      
      if (isRejection) {
        if (fromSide === 'left' || fromSide === 'right') {
          from.y += offsetAmount;
          to.y += offsetAmount;
        } else {
          from.x += offsetAmount;
          to.x += offsetAmount;
        }
      }
      
      // Calculate midpoint of the actual connection line
      return {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2
      };
    };

    const getTransitionLabelBackground = (transition: any) => {
      const labelText = transition.buttonName || 'Reject';
      const charWidth = 7 / scale.value; // Approximate character width
      const padding = 8 / scale.value;
      const width = labelText.length * charWidth + padding * 2;
      const height = 20 / scale.value;
      
      const position = getTransitionLabelPosition(transition);
      
      return {
        x: position.x - width / 2,
        y: position.y - height / 2,
        width,
        height
      };
    };

    const getAssigneeDisplay = (stage: WorkflowStage) => {
      switch (stage.assigneeType) {
        case 'DEPARTMENT': return 'Department';
        case 'ROLE': return 'Role';
        case 'SPECIFIC_USER': return 'User';
        case 'DIRECT_SUPERVISOR': return 'Supervisor';
        default: return '';
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      fitToContainer();
    });

    onMounted(() => {
      fitToContainer();
      if (canvasContainer.value) {
        resizeObserver.observe(canvasContainer.value);
      }
    });

    onUnmounted(() => {
      resizeObserver.disconnect();
    });

    watch(() => props.stages, () => {
      fitToContainer();
    }, { deep: true });

    return {
      canvasContainer,
      scale,
      bounds,
      canvasStyle,
      svgStyle,
      normalizedStages,
      allTransitions,
      getConnectionPath,
      getTransitionLabelPosition,
      getTransitionLabelBackground,
      getAssigneeDisplay
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-canvas-preview {
  width: 100%;
  height: 400px;
  background-color: #f8f9fa;
  background-image: radial-gradient(circle, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: 8px;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-content {
  position: absolute;
  transition: transform 0.3s ease;
}

.connections-layer {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

.rejection-label {
  fill: #e74c3c;
  font-weight: bold;
}

.transition-label {
  fill: #333;
  font-weight: 500;
  font-size: 12px;
}

.label-background {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.workflow-stage-preview {
  position: absolute;
  width: 200px;
  min-height: 100px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 10;

  &.stage-initial {
    border: 2px solid #4CAF50;
  }

  &.stage-final {
    border: 2px solid #f44336;
  }
}

.stage-header {
  padding: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.stage-badges {
  display: flex;
  gap: 4px;
  
  .q-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
}

.stage-content {
  padding: 12px;
  text-align: center;
}

.stage-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.stage-key {
  font-size: 12px;
  opacity: 0.8;
  font-family: monospace;
}

.stage-details {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0.9;
}
</style>