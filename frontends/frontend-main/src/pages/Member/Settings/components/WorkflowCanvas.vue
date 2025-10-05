<template>
  <div class="workflow-canvas-container">
    <!-- Toolbar -->
    <div class="workflow-toolbar">
      <div class="toolbar-section">
        <q-btn
          icon="add_box"
          label="Add Stage"
          color="primary"
          @click="addNewStage"
          class="q-mr-sm"
        />
        <q-btn
          icon="zoom_in"
          round
          flat
          @click="zoomIn"
          class="q-mr-xs"
        />
        <q-btn
          icon="zoom_out"
          round
          flat
          @click="zoomOut"
          class="q-mr-xs"
        />
        <q-btn
          icon="fit_screen"
          round
          flat
          @click="fitToScreen"
          class="q-mr-sm"
        />
        <q-chip>
          Zoom: {{ Math.round(zoom * 100) }}%
        </q-chip>
      </div>
      <div class="toolbar-section">
        <q-btn
          icon="save"
          label="Save Workflow"
          color="positive"
          @click="saveWorkflow"
          :loading="saving"
        />
      </div>
    </div>

    <!-- Canvas -->
    <div
      ref="canvasContainer"
      class="workflow-canvas"
      @wheel="handleWheel"
      @mousedown="startPan"
      @mousemove="handleMouseMove"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <div
        class="canvas-content"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }"
      >
        <!-- Connection Lines -->
        <svg class="connections-layer" style="overflow: visible;">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#666" />
            </marker>
          </defs>
          
          <!-- Transitions -->
          <g v-for="transition in transitions" :key="`transition-${transition.id}`">
            <!-- Invisible wider stroke for better clickability -->
            <path
              :d="getConnectionPath(transition)"
              stroke="transparent"
              :stroke-width="10"
              fill="none"
              class="connection-line-clickable"
              @click="selectTransition(transition)"
            />
            <path
              :d="getConnectionPath(transition)"
              stroke="#666"
              :stroke-width="2"
              fill="none"
              :stroke-opacity="1"
              marker-end="url(#arrowhead)"
              class="connection-line"
              @click="selectTransition(transition)"
            />
            <!-- Label background -->
            <rect
              v-if="transition.buttonName"
              :x="getTransitionLabelBackground(transition).x"
              :y="getTransitionLabelBackground(transition).y"
              :width="getTransitionLabelBackground(transition).width"
              :height="getTransitionLabelBackground(transition).height"
              :rx="4"
              fill="#ffffff"
              :stroke="transition.buttonColor || '#9E9E9E'"
              :stroke-width="2"
              class="label-background"
              @click="selectTransition(transition)"
            />
            <text
              v-if="transition.buttonName"
              :x="getTransitionLabelPosition(transition).x"
              :y="getTransitionLabelPosition(transition).y"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="getTransitionTextColor(transition)"
              class="transition-label-text"
              @click="selectTransition(transition)"
            >
              {{ transition.buttonName }}
            </text>
          </g>

          <!-- Temporary connection while dragging -->
          <path
            v-if="tempConnection"
            :d="getTempConnectionPath()"
            stroke="#2196F3"
            stroke-width="2"
            stroke-dasharray="5,5"
            fill="none"
            marker-end="url(#arrowhead)"
            class="temp-connection"
          />
        </svg>

        <!-- Workflow Stages -->
        <div
          v-for="stage in stages"
          :key="stage.id"
          :data-stage-id="stage.id"
          class="workflow-stage"
          :class="{
            'stage-initial': stage.isInitial,
            'stage-final': stage.isFinal,
            'stage-selected': selectedStageId === stage.id,
            'stage-editing': editingStageId === stage.id
          }"
          :style="{
            left: stage.position.x + 'px',
            top: stage.position.y + 'px',
            backgroundColor: stage.color,
            color: stage.textColor
          }"
          @mousedown="startDragStage($event, stage)"
          @click="selectStage(stage)"
          @dblclick="startEditingStage(stage)"
        >
          <!-- Stage Header -->
          <div class="stage-header">
            <div class="stage-badges">
              <q-badge v-if="stage.isInitial" color="green" label="Start" />
              <q-badge v-if="stage.isFinal" color="red" label="End" />
            </div>
            <q-btn
              icon="close"
              size="xs"
              flat
              round
              dense
              class="stage-delete"
              @click.stop="deleteStage(stage)"
            />
          </div>

          <!-- Stage Content -->
          <div class="stage-content">
            <div v-if="editingStageId === stage.id" class="stage-edit-mode">
              <q-input
                v-model="editingStage.name"
                dense
                borderless
                class="stage-name-input"
                @keyup.enter="saveStageEdit"
                @keyup.esc="cancelStageEdit"
                autofocus
              />
            </div>
            <div v-else>
              <div class="stage-name">{{ stage.name }}</div>
            </div>

            <!-- Stage Details -->
            <div class="stage-details">
              <div v-if="stage.assigneeType" class="detail-item">
                <q-icon name="person" size="xs" />
                <span>{{ getAssigneeDisplay(stage) }}</span>
              </div>
            </div>
          </div>

          <!-- Connection Points -->
          <div
            class="connection-point connection-point-top"
            :data-stage-id="stage.id"
            data-side="top"
            @mousedown.stop="startConnection($event, stage, 'top')"
            @mouseup.stop="endConnectionAtPoint($event, stage, 'top')"
          >
            <q-icon name="add_circle" size="xs" />
          </div>
          <div
            class="connection-point connection-point-right"
            :data-stage-id="stage.id"
            data-side="right"
            @mousedown.stop="startConnection($event, stage, 'right')"
            @mouseup.stop="endConnectionAtPoint($event, stage, 'right')"
          >
            <q-icon name="add_circle" size="xs" />
          </div>
          <div
            class="connection-point connection-point-bottom"
            :data-stage-id="stage.id"
            data-side="bottom"
            @mousedown.stop="startConnection($event, stage, 'bottom')"
            @mouseup.stop="endConnectionAtPoint($event, stage, 'bottom')"
          >
            <q-icon name="add_circle" size="xs" />
          </div>
          <div
            class="connection-point connection-point-left"
            :data-stage-id="stage.id"
            data-side="left"
            @mousedown.stop="startConnection($event, stage, 'left')"
            @mouseup.stop="endConnectionAtPoint($event, stage, 'left')"
          >
            <q-icon name="add_circle" size="xs" />
          </div>
        </div>

        <!-- Drop Zone for New Stages -->
        <div
          v-if="isDraggingNewStage"
          class="drop-zone"
          :style="{
            left: dropZonePosition.x + 'px',
            top: dropZonePosition.y + 'px'
          }"
        >
          Drop here to add stage
        </div>
      </div>
    </div>

    <!-- Stage Details Panel -->
    <transition name="slide">
      <div v-if="selectedStageId && selectedStage && !selectedTransition" class="stage-details-panel">
        <div class="panel-header">
          <h6>Stage Details</h6>
          <q-btn icon="close" flat round dense @click="selectedStageId = null" />
        </div>
        <div class="panel-content">
          <workflow-stage-details
            :stage="selectedStage"
            :workflow-id="workflowId"
            @updated="onStageUpdated"
          />
        </div>
      </div>
    </transition>

    <!-- Transition Details Panel -->
    <transition name="slide">
      <div v-if="selectedTransition" class="transition-details-panel">
        <div class="panel-header">
          <h6>Connection Details</h6>
          <q-btn icon="close" flat round dense @click="selectedTransition = null" />
        </div>
        <div class="panel-content">
          <workflow-transition-details
            :transition="selectedTransition"
            :from-stage-name="selectedTransitionFromName"
            :to-stage-name="selectedTransitionToName"
            :workflow-id="workflowId"
            @updated="onTransitionUpdated"
            @deleted="onTransitionDeleted"
          />
        </div>
      </div>
    </transition>

    <!-- Add Stage Dialog -->
    <workflow-add-stage-dialog
      v-model="showAddStageDialog"
      :position="newStagePosition"
      :existing-stages="stages"
      @add-stage="createStageWithDetails"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, getCurrentInstance, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import WorkflowStageDetails from './WorkflowStageDetails.vue';
import WorkflowTransitionDetails from './WorkflowTransitionDetails.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const WorkflowAddStageDialog = defineAsyncComponent(() =>
  import('../dialogs/WorkflowAddStageDialog.vue')
);

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
  position: StagePosition;
  isInitial: boolean;
  isFinal: boolean;
  assigneeType?: string;
  assigneeId?: string;
  dialogType?: string;
}

interface ConnectionInfo {
  stage: WorkflowStage;
  side: 'top' | 'right' | 'bottom' | 'left';
}

export default defineComponent({
  name: 'WorkflowCanvas',
  components: {
    WorkflowStageDetails,
    WorkflowTransitionDetails,
    WorkflowAddStageDialog,
  },
  props: {
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

    // Canvas state
    const canvasContainer = ref<HTMLElement>();
    const zoom = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    const isPanning = ref(false);
    const panStart = ref({ x: 0, y: 0 });

    // Workflow state
    const stages = ref<WorkflowStage[]>([]);
    const transitions = ref<any[]>([]);
    const selectedStageId = ref<number | null>(null);
    const editingStageId = ref<number | null>(null);
    const editingStage = ref<any>({});
    const saving = ref(false);

    // Drag state
    const isDragging = ref(false);
    const draggedStage = ref<WorkflowStage | null>(null);
    const dragOffset = ref({ x: 0, y: 0 });
    const isDraggingNewStage = ref(false);
    const dropZonePosition = ref({ x: 0, y: 0 });

    // Add stage dialog state
    const showAddStageDialog = ref(false);
    const newStagePosition = ref({ x: 0, y: 0 });

    // Connection state
    const isConnecting = ref(false);
    const connectionStart = ref<ConnectionInfo | null>(null);
    const tempConnection = ref<{
      from: ConnectionInfo;
      to: { x: number; y: number };
    } | null>(null);
    const mousePosition = ref({ x: 0, y: 0 });

    // Transition state
    const selectedTransition = ref<any>(null);
    const selectedTransitionFromName = ref('');
    const selectedTransitionToName = ref('');

    const selectedStage = computed(() => 
      stages.value.find(s => s.id === selectedStageId.value)
    );

    // Cycle detection using DFS
    const hasCycle = (fromStageId: number, toStageId: number): boolean => {
      const visited = new Set<number>();
      const recursionStack = new Set<number>();
      
      // Build adjacency list including the proposed new connection
      const adjacencyList = new Map<number, number[]>();
      
      // Add existing transitions
      transitions.value.forEach(t => {
        if (!adjacencyList.has(t.fromStageId)) {
          adjacencyList.set(t.fromStageId, []);
        }
        adjacencyList.get(t.fromStageId)!.push(t.toStageId);
      });
      
      
      // Add the proposed new connection
      if (!adjacencyList.has(fromStageId)) {
        adjacencyList.set(fromStageId, []);
      }
      adjacencyList.get(fromStageId)!.push(toStageId);
      
      // DFS to detect cycle
      const dfs = (node: number): boolean => {
        visited.add(node);
        recursionStack.add(node);
        
        const neighbors = adjacencyList.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) return true;
          } else if (recursionStack.has(neighbor)) {
            return true; // Cycle detected
          }
        }
        
        recursionStack.delete(node);
        return false;
      };
      
      // Check for cycles starting from any unvisited node
      for (const stageId of stages.value.map(s => s.id)) {
        if (!visited.has(stageId)) {
          if (dfs(stageId)) return true;
        }
      }
      
      return false;
    };
    
    // Auto-detect start and end stages
    const updateStartEndStages = async () => {
      // Find stages with no incoming transitions (potential starts)
      const stagesWithIncoming = new Set<number>();
      transitions.value.forEach(t => {
        if (t.transitionType !== 'REJECTION') {
          stagesWithIncoming.add(t.toStageId);
        }
      });
      
      // Find stages with no outgoing transitions (potential ends)
      const stagesWithOutgoing = new Set<number>();
      transitions.value.forEach(t => {
        if (t.transitionType !== 'REJECTION') {
          stagesWithOutgoing.add(t.fromStageId);
        }
      });
      
      // Update start and end flags
      for (const stage of stages.value) {
        const isInitial = !stagesWithIncoming.has(stage.id);
        const isFinal = !stagesWithOutgoing.has(stage.id);
        
        // Only update if changed
        if (stage.isInitial !== isInitial || stage.isFinal !== isFinal) {
          if (!$api) continue;
          try {
            await $api.put(`/workflow-stage/${stage.id}`, {
              isInitial,
              isFinal
            });
            stage.isInitial = isInitial;
            stage.isFinal = isFinal;
          } catch (error) {
            console.error('Failed to update stage start/end flags:', error);
          }
        }
      }
    };

    // Load workflow data
    const loadWorkflow = async () => {
      if (!$api) return;
      
      try {
        const response = await $api.get(`/workflow-template/${props.workflowId}`);
        const workflow = response.data;
        
        // Process stages with positions
        stages.value = workflow.stages.map((stage: any, index: number) => ({
          ...stage,
          position: stage.position || calculateDefaultPosition(index, workflow.stages.length)
        }));

        // Extract transitions
        transitions.value = [];
        workflow.stages.forEach((stage: any) => {
          // Add normal transitions
          if (stage.transitionsFrom) {
            transitions.value.push(...stage.transitionsFrom);
          }
        });
        
        // Auto-detect start and end stages after loading
        await updateStartEndStages();
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    };

    // Calculate default positions for stages
    const calculateDefaultPosition = (index: number, total: number): StagePosition => {
      const centerX = 600;
      const centerY = 300;
      const radius = 200;
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      
      return {
        x: centerX + radius * Math.cos(angle) - 100,
        y: centerY + radius * Math.sin(angle) - 50
      };
    };

    // Canvas controls
    const zoomIn = () => {
      zoom.value = Math.min(zoom.value * 1.2, 3);
    };

    const zoomOut = () => {
      zoom.value = Math.max(zoom.value / 1.2, 0.3);
    };

    const fitToScreen = () => {
      if (!canvasContainer.value || stages.value.length === 0) return;

      const container = canvasContainer.value;
      const bounds = calculateBounds();
      
      const scaleX = container.clientWidth / (bounds.width + 100);
      const scaleY = container.clientHeight / (bounds.height + 100);
      
      zoom.value = Math.min(scaleX, scaleY, 1);
      panX.value = -bounds.minX * zoom.value + 50;
      panY.value = -bounds.minY * zoom.value + 50;
    };

    const calculateBounds = () => {
      if (stages.value.length === 0) {
        return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
      }

      const xs = stages.value.map(s => s.position.x);
      const ys = stages.value.map(s => s.position.y);
      
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs) + 200; // Stage width
      const maxY = Math.max(...ys) + 100; // Stage height
      
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    };

    // Pan handling
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoom.value = Math.max(0.3, Math.min(3, zoom.value * delta));
    };

    const startPan = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only start panning if not clicking on a stage or other interactive element
      if (!target.closest('.workflow-stage') && 
          !target.closest('.connection-line') &&
          !isDragging.value &&
          !isConnecting.value) {
        isPanning.value = true;
        panStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasContainer.value?.getBoundingClientRect();
      if (!rect) return;

      mousePosition.value = {
        x: (e.clientX - rect.left - panX.value) / zoom.value,
        y: (e.clientY - rect.top - panY.value) / zoom.value
      };

      if (isPanning.value) {
        panX.value = e.clientX - panStart.value.x;
        panY.value = e.clientY - panStart.value.y;
      }

      if (isDragging.value && draggedStage.value) {
        draggedStage.value.position.x = mousePosition.value.x - dragOffset.value.x;
        draggedStage.value.position.y = mousePosition.value.y - dragOffset.value.y;
      }

      if (isDraggingNewStage.value) {
        dropZonePosition.value = {
          x: mousePosition.value.x - 100,
          y: mousePosition.value.y - 50
        };
      }

      if (isConnecting.value && connectionStart.value) {
        tempConnection.value = {
          from: connectionStart.value,
          to: mousePosition.value
        };
      }
    };

    const endPan = () => {
      isPanning.value = false;
      isDragging.value = false;
      isDraggingNewStage.value = false;
      
      if (draggedStage.value) {
        updateStagePosition(draggedStage.value);
        draggedStage.value = null;
      }
    };

    // Stage management
    const addNewStage = () => {
      isDraggingNewStage.value = true;
      document.addEventListener('click', showAddStageDialogAtPosition);
    };

    const showAddStageDialogAtPosition = (e: MouseEvent) => {
      if (!isDraggingNewStage.value) return;
      
      isDraggingNewStage.value = false;
      document.removeEventListener('click', showAddStageDialogAtPosition);

      const rect = canvasContainer.value?.getBoundingClientRect();
      if (!rect) return;

      newStagePosition.value = {
        x: (e.clientX - rect.left - panX.value) / zoom.value - 100,
        y: (e.clientY - rect.top - panY.value) / zoom.value - 50
      };

      showAddStageDialog.value = true;
    };

    const createStageWithDetails = async (stageData: any) => {
      if (!$api) return;

      const stageCount = stages.value.length + 1;
      const newStage = {
        workflowId: props.workflowId,
        name: stageData.name,
        key: stageData.key,
        color: '#2196F3',
        textColor: '#FFFFFF',
        sequence: stageCount,
        position: stageData.position
      };

      try {
        const response = await $api.post('/workflow-stage', newStage);
        await loadWorkflow();
        
        // Auto-update start/end stages after adding new stage
        await updateStartEndStages();
        
        selectStage(response.data);
      } catch (error) {
        console.error('Failed to create stage:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to create stage',
          icon: 'report_problem'
        });
      }
    };

    const startDragStage = (e: MouseEvent, stage: WorkflowStage) => {
      if (editingStageId.value === stage.id) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      isDragging.value = true;
      draggedStage.value = stage;
      const rect = canvasContainer.value?.getBoundingClientRect();
      if (!rect) return;
      
      const clickX = (e.clientX - rect.left - panX.value) / zoom.value;
      const clickY = (e.clientY - rect.top - panY.value) / zoom.value;
      
      dragOffset.value = {
        x: clickX - stage.position.x,
        y: clickY - stage.position.y
      };
    };

    const updateStagePosition = async (stage: WorkflowStage) => {
      if (!$api) return;
      
      try {
        await $api.put(`/workflow-stage/${stage.id}`, {
          position: stage.position
        });
      } catch (error) {
        console.error('Failed to update stage position:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to save stage position',
          icon: 'report_problem'
        });
        // Reload to restore the correct position
        await loadWorkflow();
      }
    };

    const selectStage = (stage: WorkflowStage) => {
      selectedStageId.value = stage.id;
      // Clear transition selection when selecting a stage
      selectedTransition.value = null;
    };

    const startEditingStage = (stage: WorkflowStage) => {
      editingStageId.value = stage.id;
      editingStage.value = { ...stage };
    };

    const saveStageEdit = async () => {
      if (!$api || !editingStage.value) return;
      
      try {
        await $api.put(`/workflow-stage/${editingStage.value.id}`, {
          name: editingStage.value.name
        });
        const stage = stages.value.find(s => s.id === editingStage.value.id);
        if (stage) {
          stage.name = editingStage.value.name;
        }
        editingStageId.value = null;
      } catch (error) {
        console.error('Failed to update stage:', error);
      }
    };

    const cancelStageEdit = () => {
      editingStageId.value = null;
      editingStage.value = {};
    };

    const deleteStage = async (stage: WorkflowStage) => {
      $q.dialog({
        title: 'Delete Stage',
        message: `Are you sure you want to delete "${stage.name}"?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        if (!$api) return;
        
        try {
          // Clear selection first if this is the selected stage
          if (selectedStageId.value === stage.id) {
            selectedStageId.value = null;
          }
          
          await $api.delete(`/workflow-stage/${stage.id}`);
          await loadWorkflow();
          
          // Auto-update start/end stages after deletion
          await updateStartEndStages();
        } catch (error) {
          console.error('Failed to delete stage:', error);
          $q.notify({
            color: 'negative',
            message: 'Failed to delete stage',
            icon: 'report_problem'
          });
        }
      });
    };

    const onStageUpdated = () => {
      loadWorkflow();
    };

    // Connection management
    const startConnection = (e: MouseEvent, stage: WorkflowStage, side: 'top' | 'right' | 'bottom' | 'left') => {
      isConnecting.value = true;
      connectionStart.value = { stage, side };
      document.body.classList.add('is-connecting');
      document.addEventListener('mouseup', endConnection);
      document.addEventListener('mousemove', handleConnectionDrag);
    };

    const handleConnectionDrag = (e: MouseEvent) => {
      if (!isConnecting.value || !connectionStart.value || !canvasContainer.value) return;
      
      const rect = canvasContainer.value.getBoundingClientRect();
      const x = (e.clientX - rect.left - panX.value) / zoom.value;
      const y = (e.clientY - rect.top - panY.value) / zoom.value;
      
      tempConnection.value = {
        from: connectionStart.value,
        to: { x, y }
      };
    };

    const endConnectionAtPoint = async (e: MouseEvent, targetStage: WorkflowStage, targetSide: 'top' | 'right' | 'bottom' | 'left') => {
      if (!isConnecting.value || !connectionStart.value || !$api) return;
      
      // Prevent connecting to same stage
      if (targetStage.id === connectionStart.value.stage.id) {
        endConnection();
        return;
      }
      
      const sourceStageId = connectionStart.value.stage.id;
      const targetStageId = targetStage.id;
      const sourceSide = connectionStart.value.side;
      
      // Clear connection state
      isConnecting.value = false;
      connectionStart.value = null;
      tempConnection.value = null;
      document.body.classList.remove('is-connecting');
      document.removeEventListener('mouseup', endConnection);
      document.removeEventListener('mousemove', handleConnectionDrag);
      
      try {
        // Check for cycles before creating connection
        if (hasCycle(sourceStageId, targetStageId)) {
          $q.notify({
            color: 'negative',
            message: 'Cannot create this connection as it would create an infinite loop',
            icon: 'report_problem'
          });
          return;
        }
        
        // Create new transition with side information and default values
        await $api.post('/workflow-stage/transition', {
          fromStageId: sourceStageId,
          toStageId: targetStageId,
          fromSide: sourceSide,
          toSide: targetSide,
          buttonName: 'Submit',
          dialogType: 'default_approval'
        });
        
        await loadWorkflow();
        await updateStartEndStages();
      } catch (error) {
        console.error('Failed to create connection:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to create connection',
          icon: 'report_problem'
        });
      }
    };

    const endConnection = () => {
      // Only called when mouseup happens outside a connection point
      isConnecting.value = false;
      connectionStart.value = null;
      tempConnection.value = null;
      document.body.classList.remove('is-connecting');
      document.removeEventListener('mouseup', endConnection);
      document.removeEventListener('mousemove', handleConnectionDrag);
    };

    const selectTransition = (transition: any) => {
      // Clear stage selection when selecting a transition
      selectedStageId.value = null;
      
      // Find stage names for the sidebar
      const fromStage = stages.value.find(s => s.id === transition.fromStageId);
      const toStage = stages.value.find(s => s.id === transition.toStageId);
      
      selectedTransition.value = transition;
      selectedTransitionFromName.value = fromStage?.name || 'Unknown';
      selectedTransitionToName.value = toStage?.name || 'Unknown';
    };

    const onTransitionUpdated = () => {
      loadWorkflow();
    };

    const onTransitionDeleted = () => {
      loadWorkflow();
      // Auto-update start and end stages after deletion
      updateStartEndStages();
      selectedTransition.value = null;
    };

    // Path calculations
    const getConnectionPath = (transition: any) => {
      const fromStage = stages.value.find(s => s.id === transition.fromStageId);
      const toStage = stages.value.find(s => s.id === transition.toStageId);
      
      if (!fromStage || !toStage) return '';
      
      // Use stored sides if available, otherwise calculate best sides
      let fromSide = transition.fromSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      let toSide = transition.toSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      
      if (!fromSide || !toSide) {
        // Fallback to automatic calculation
        const stageWidth = 200;
        const stageHeight = 100;
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
        
        // Determine best sides based on relative positions
        if (Math.abs(dx) > Math.abs(dy)) {
          fromSide = dx > 0 ? 'right' : 'left';
          toSide = dx > 0 ? 'left' : 'right';
        } else {
          fromSide = dy > 0 ? 'bottom' : 'top';
          toSide = dy > 0 ? 'top' : 'bottom';
        }
      }
      
      // Get actual connection points
      let from = getConnectionPointPosition(fromStage, fromSide);
      let to = getConnectionPointPosition(toStage, toSide);
      
      // Calculate offset for multiple connections
      const offsetAmount = 20;
      const transitionsBetween = transitions.value.filter(t => 
        t.fromStageId === transition.fromStageId && 
        t.toStageId === transition.toStageId
      );
      const transitionIndex = transitionsBetween.findIndex(t => t.id === transition.id);
      const totalTransitions = transitionsBetween.length;
      
      let offset = 0;
      if (totalTransitions > 1) {
        offset = (transitionIndex - (totalTransitions - 1) / 2) * offsetAmount;
      }
      
      // Apply offset based on connection direction
      if (fromSide === 'left' || fromSide === 'right') {
        from = { ...from, y: from.y + offset };
        to = { ...to, y: to.y + offset };
      } else {
        from = { ...from, x: from.x + offset };
        to = { ...to, x: to.x + offset };
      }
      
      // Add small offset for arrow head
      const arrowOffset = 2;
      switch (toSide) {
        case 'top':
          to.y -= arrowOffset;
          break;
        case 'right':
          to.x += arrowOffset;
          break;
        case 'bottom':
          to.y += arrowOffset;
          break;
        case 'left':
          to.x -= arrowOffset;
          break;
      }
      
      // Create path with control points based on exit/entry sides
      let path = `M ${from.x} ${from.y}`;
      
      // Calculate path based on side combinations
      const extensionDistance = 30;
      
      if ((fromSide === 'right' && toSide === 'left') || (fromSide === 'left' && toSide === 'right')) {
        // Horizontal direct connection
        const midX = from.x + (to.x - from.x) / 2;
        path += ` L ${midX} ${from.y}`;
        path += ` L ${midX} ${to.y}`;
        path += ` L ${to.x} ${to.y}`;
      } else if ((fromSide === 'bottom' && toSide === 'top') || (fromSide === 'top' && toSide === 'bottom')) {
        // Vertical direct connection
        const midY = from.y + (to.y - from.y) / 2;
        path += ` L ${from.x} ${midY}`;
        path += ` L ${to.x} ${midY}`;
        path += ` L ${to.x} ${to.y}`;
      } else {
        // Complex routing for other combinations
        let p1, p2;
        
        switch (fromSide) {
          case 'top':
            p1 = { x: from.x, y: from.y - extensionDistance };
            break;
          case 'right':
            p1 = { x: from.x + extensionDistance, y: from.y };
            break;
          case 'bottom':
            p1 = { x: from.x, y: from.y + extensionDistance };
            break;
          case 'left':
            p1 = { x: from.x - extensionDistance, y: from.y };
            break;
        }
        
        switch (toSide) {
          case 'top':
            p2 = { x: to.x, y: to.y - extensionDistance };
            break;
          case 'right':
            p2 = { x: to.x + extensionDistance, y: to.y };
            break;
          case 'bottom':
            p2 = { x: to.x, y: to.y + extensionDistance };
            break;
          case 'left':
            p2 = { x: to.x - extensionDistance, y: to.y };
            break;
        }
        
        // Route through extension points
        path += ` L ${p1.x} ${p1.y}`;
        
        // Connect p1 to p2
        if ((fromSide === 'top' || fromSide === 'bottom') && (toSide === 'left' || toSide === 'right')) {
          path += ` L ${p1.x} ${p2.y}`;
        } else if ((fromSide === 'left' || fromSide === 'right') && (toSide === 'top' || toSide === 'bottom')) {
          path += ` L ${p2.x} ${p1.y}`;
        } else {
          // Same orientation sides
          const midPoint = {
            x: p1.x + (p2.x - p1.x) / 2,
            y: p1.y + (p2.y - p1.y) / 2
          };
          path += ` L ${midPoint.x} ${midPoint.y}`;
        }
        
        path += ` L ${p2.x} ${p2.y}`;
        path += ` L ${to.x} ${to.y}`;
      }
      
      return path;
    };

    const getConnectionPointPosition = (stage: WorkflowStage, side: 'top' | 'right' | 'bottom' | 'left') => {
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

    const getTempConnectionPath = () => {
      if (!tempConnection.value) return '';
      
      const from = getConnectionPointPosition(tempConnection.value.from.stage, tempConnection.value.from.side);
      const to = tempConnection.value.to;
      
      // Create angled path based on the exit side
      let path = `M ${from.x} ${from.y}`;
      
      switch (tempConnection.value.from.side) {
        case 'top':
        case 'bottom':
          // Exit vertically, then horizontal
          const midY = from.y + (tempConnection.value.from.side === 'top' ? -30 : 30);
          path += ` L ${from.x} ${midY}`;
          path += ` L ${to.x} ${midY}`;
          path += ` L ${to.x} ${to.y}`;
          break;
        case 'left':
        case 'right':
          // Exit horizontally, then vertical
          const midX = from.x + (tempConnection.value.from.side === 'left' ? -30 : 30);
          path += ` L ${midX} ${from.y}`;
          path += ` L ${midX} ${to.y}`;
          path += ` L ${to.x} ${to.y}`;
          break;
      }
      
      return path;
    };

    const getTransitionLabelPosition = (transition: any) => {
      const fromStage = stages.value.find(s => s.id === transition.fromStageId);
      const toStage = stages.value.find(s => s.id === transition.toStageId);
      
      if (!fromStage || !toStage) return { x: 0, y: 0 };
      
      // Use stored sides or calculate them
      let fromSide = transition.fromSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      let toSide = transition.toSide as 'top' | 'right' | 'bottom' | 'left' | undefined;
      
      if (!fromSide || !toSide) {
        // Fallback to automatic calculation
        const stageWidth = 200;
        const stageHeight = 100;
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
      let from = getConnectionPointPosition(fromStage, fromSide);
      let to = getConnectionPointPosition(toStage, toSide);
      
      // Calculate offset for multiple connections
      const offsetAmount = 20;
      const transitionsBetween = transitions.value.filter(t => 
        t.fromStageId === transition.fromStageId && 
        t.toStageId === transition.toStageId
      );
      const transitionIndex = transitionsBetween.findIndex(t => t.id === transition.id);
      const totalTransitions = transitionsBetween.length;
      
      let offset = 0;
      if (totalTransitions > 1) {
        offset = (transitionIndex - (totalTransitions - 1) / 2) * offsetAmount;
      }
      
      // Apply offset based on connection direction
      if (fromSide === 'left' || fromSide === 'right') {
        from = { ...from, y: from.y + offset };
        to = { ...to, y: to.y + offset };
      } else {
        from = { ...from, x: from.x + offset };
        to = { ...to, x: to.x + offset };
      }
      
      // Calculate label position based on the path type
      const extensionDistance = 30;
      let labelX, labelY;
      
      if ((fromSide === 'right' && toSide === 'left') || (fromSide === 'left' && toSide === 'right')) {
        // Horizontal direct connection - place label at horizontal midpoint
        const midX = from.x + (to.x - from.x) / 2;
        labelX = midX;
        labelY = from.y + (to.y - from.y) / 2;
      } else if ((fromSide === 'bottom' && toSide === 'top') || (fromSide === 'top' && toSide === 'bottom')) {
        // Vertical direct connection - place label at vertical midpoint
        const midY = from.y + (to.y - from.y) / 2;
        labelX = from.x + (to.x - from.x) / 2;
        labelY = midY;
      } else {
        // Complex routing - place label on the most suitable segment
        let p1, p2;
        
        // Calculate first extension point
        switch (fromSide) {
          case 'top':
            p1 = { x: from.x, y: from.y - extensionDistance };
            break;
          case 'right':
            p1 = { x: from.x + extensionDistance, y: from.y };
            break;
          case 'bottom':
            p1 = { x: from.x, y: from.y + extensionDistance };
            break;
          case 'left':
            p1 = { x: from.x - extensionDistance, y: from.y };
            break;
        }
        
        // Calculate second extension point
        switch (toSide) {
          case 'top':
            p2 = { x: to.x, y: to.y - extensionDistance };
            break;
          case 'right':
            p2 = { x: to.x + extensionDistance, y: to.y };
            break;
          case 'bottom':
            p2 = { x: to.x, y: to.y + extensionDistance };
            break;
          case 'left':
            p2 = { x: to.x - extensionDistance, y: to.y };
            break;
        }
        
        // Determine the best segment for label placement
        if ((fromSide === 'top' || fromSide === 'bottom') && (toSide === 'left' || toSide === 'right')) {
          // Path goes vertical then horizontal - place on horizontal segment
          labelX = p1.x + (p2.x - p1.x) / 2;
          labelY = p2.y;
        } else if ((fromSide === 'left' || fromSide === 'right') && (toSide === 'top' || toSide === 'bottom')) {
          // Path goes horizontal then vertical - place on vertical segment
          labelX = p2.x;
          labelY = p1.y + (p2.y - p1.y) / 2;
        } else {
          // Same orientation sides - place on middle segment
          const midPoint = {
            x: p1.x + (p2.x - p1.x) / 2,
            y: p1.y + (p2.y - p1.y) / 2
          };
          labelX = midPoint.x;
          labelY = midPoint.y;
        }
      }
      
      return { x: labelX, y: labelY };
    };

    const getTransitionLabelBackground = (transition: any) => {
      const labelPos = getTransitionLabelPosition(transition);
      const text = transition.buttonName || '';
      
      // Estimate text width (roughly 8px per character)
      const padding = 12;
      const textWidth = text.length * 8;
      const width = textWidth + padding * 2;
      const height = 24;
      
      return {
        x: labelPos.x - width / 2,
        y: labelPos.y - height / 2,
        width,
        height
      };
    };

    // Display helpers
    const getAssigneeDisplay = (stage: WorkflowStage) => {
      switch (stage.assigneeType) {
        case 'DEPARTMENT': return 'Department';
        case 'ROLE': return 'Role';
        case 'SPECIFIC_USER': return 'User';
        case 'DIRECT_SUPERVISOR': return 'Supervisor';
        default: return 'Unassigned';
      }
    };

    const getTransitionTextColor = (transition: any): string => {
      // Use the button color for text, or default gray if not set
      return transition.buttonColor || '#9E9E9E';
    };



    const getStageNameById = (stageId: number) => {
      const stage = stages.value.find(s => s.id === stageId);
      return stage?.name || 'Unknown';
    };

    const saveWorkflow = async () => {
      if (!$api) return;
      
      saving.value = true;
      try {
        // Save all stage positions
        const savePromises = stages.value.map(stage => 
          $api.put(`/workflow-stage/${stage.id}`, {
            position: stage.position
          })
        );
        
        await Promise.all(savePromises);
        
        $q.notify({
          type: 'positive',
          message: 'Workflow layout saved successfully',
          icon: 'check_circle'
        });
        emit('updated');
      } catch (error) {
        console.error('Failed to save workflow:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to save workflow layout',
          icon: 'report_problem'
        });
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      loadWorkflow();
      setTimeout(fitToScreen, 100);
    });

    return {
      // Refs
      canvasContainer,
      stages,
      transitions,
      selectedStageId,
      selectedStage,
      editingStageId,
      editingStage,
      saving,
      zoom,
      panX,
      panY,
      isDraggingNewStage,
      dropZonePosition,
      tempConnection,
      selectedTransition,
      selectedTransitionFromName,
      selectedTransitionToName,
      showAddStageDialog,
      newStagePosition,

      // Methods
      handleWheel,
      startPan,
      handleMouseMove,
      endPan,
      zoomIn,
      zoomOut,
      fitToScreen,
      addNewStage,
      createStageWithDetails,
      startDragStage,
      selectStage,
      startEditingStage,
      saveStageEdit,
      cancelStageEdit,
      deleteStage,
      onStageUpdated,
      startConnection,
      handleConnectionDrag,
      endConnectionAtPoint,
      endConnection,
      selectTransition,
      getConnectionPath,
      getTempConnectionPath,
      getTransitionLabelPosition,
      getTransitionLabelBackground,
      getAssigneeDisplay,
      getTransitionTextColor,
      getStageNameById,
      saveWorkflow,
      onTransitionUpdated,
      onTransitionDeleted,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-canvas-container {
  display: flex;
  height: 100%;
  position: relative;
  background-color: #f5f5f5;
}

.workflow-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toolbar-section {
  display: flex;
  align-items: center;
}

.workflow-canvas {
  flex: 1;
  margin-top: 60px;
  position: relative;
  overflow: hidden;
  cursor: grab;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;

  &:active {
    cursor: grabbing;
  }
}

.canvas-content {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.1s ease-out;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 5000px;
  height: 5000px;
  pointer-events: none;
  z-index: 1;
}

.connection-line-clickable {
  pointer-events: stroke;
  cursor: pointer;
}

.connection-line {
  pointer-events: visibleStroke;
  cursor: pointer;
  transition: stroke-width 0.2s;
  stroke-linejoin: round;
  stroke-linecap: round;

  &:hover {
    stroke-width: 4;
    stroke-opacity: 0.8;
  }
}

.temp-connection {
  pointer-events: none;
}

.label-background {
  cursor: pointer;
  pointer-events: all;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
  
  &:hover {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    opacity: 0.9;
  }
}

.transition-label-text {
  font-size: 12px;
  font-weight: 500;
  pointer-events: all;
  cursor: pointer;
}

.workflow-stage {
  position: absolute;
  width: 200px;
  min-height: 100px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: move;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 10;
  user-select: none;

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }

  &.stage-selected {
    box-shadow: 0 0 0 3px #2196F3;
  }

  &.stage-editing {
    cursor: text;
  }

  &.stage-initial {
    border: 2px solid #4CAF50;
  }

  &.stage-final {
    border: 2px solid #f44336;
  }
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.stage-badges {
  display: flex;
  gap: 4px;
}

.stage-delete {
  opacity: 0;
  transition: opacity 0.2s;

  .workflow-stage:hover & {
    opacity: 1;
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

.stage-name-input {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  
  :deep(.q-field__control) {
    height: auto;
  }
}

.stage-details {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.9;
}

.connection-point {
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;

  .workflow-stage:hover & {
    opacity: 1;
  }

  &.connection-point-top {
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.connection-point-right {
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.connection-point-bottom {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.connection-point-left {
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  &:hover {
    opacity: 1 !important;
    
    .q-icon {
      color: #2196F3;
    }
  }
  
  &.connection-target {
    opacity: 1 !important;
    
    .q-icon {
      color: #4CAF50;
      transform: scale(1.2);
    }
  }
}

// Add class to body when connecting
body.is-connecting {
  .connection-point {
    opacity: 0.5;
    
    &:hover {
      opacity: 1 !important;
    }
  }
}

.drop-zone {
  position: absolute;
  width: 200px;
  height: 100px;
  border: 2px dashed #2196F3;
  border-radius: 8px;
  background: rgba(33, 150, 243, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 20;
}

.stage-details-panel,
.transition-details-panel {
  position: absolute;
  right: 0;
  top: 60px;
  bottom: 0;
  width: 400px;
  background: white;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  z-index: 100;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;

  h6 {
    margin: 0;
    font-size: 18px;
  }
}

.panel-content {
  padding: 16px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>