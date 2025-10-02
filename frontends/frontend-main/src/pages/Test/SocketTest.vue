<template>
  <q-page padding>
    <div class="q-gutter-md">
      <h4>Socket.io Event Test</h4>
      
      <div class="q-mb-md">
        <div>Socket Connected: {{ socketConnected }}</div>
        <div>Socket ID: {{ socketId }}</div>
      </div>

      <q-card>
        <q-card-section>
          <div class="text-h6">Actions</div>
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-sm">
            <q-btn @click="testTaskUpdate" color="primary" label="Test Task Update" />
            <q-btn @click="testFilingUpdate" color="secondary" label="Test Filing Update" />
            <q-btn @click="clearLog" color="negative" label="Clear Log" />
          </div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6">Socket Events Log</div>
        </q-card-section>
        <q-card-section>
          <div v-if="events.length === 0" class="text-grey">
            No events received yet...
          </div>
          <div v-else>
            <div v-for="(event, index) in events" :key="index" class="q-mb-sm">
              <q-chip square>
                {{ event.time }} - {{ event.type }}
              </q-chip>
              <pre class="q-mt-xs">{{ JSON.stringify(event.data, null, 2) }}</pre>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useSocketStore } from '../../stores/socketStore';
import bus from 'src/bus';
import { api } from 'src/boot/axios';

interface SocketEvent {
  time: string;
  type: string;
  data: unknown;
}

export default defineComponent({
  name: 'SocketTest',
  setup() {
    const socketStore = useSocketStore();
    const events = ref<SocketEvent[]>([]);
    const socketConnected = ref(false);
    const socketId = ref('');

    const addEvent = (type: string, data: unknown) => {
      events.value.unshift({
        time: new Date().toLocaleTimeString(),
        type,
        data
      });
      // Keep only last 20 events
      if (events.value.length > 20) {
        events.value.pop();
      }
    };

    const handleTaskChanged = (data: unknown) => {
      console.log('[SocketTest] Received task-changed event:', data);
      addEvent('task-changed', data);
    };

    const handleFilingUpdated = (data: unknown) => {
      console.log('[SocketTest] Received filing-updated event:', data);
      addEvent('filing-updated', data);
    };

    const handleTaskCompleted = (data: unknown) => {
      console.log('[SocketTest] Received task-completed event:', data);
      addEvent('task-completed', data);
    };

    const handleFilingApproved = (data: unknown) => {
      console.log('[SocketTest] Received filing-approved event:', data);
      addEvent('filing-approved', data);
    };

    const handleApprovalProcessed = (data: unknown) => {
      console.log('[SocketTest] Received approval-processed event:', data);
      addEvent('approval-processed', data);
    };

    const testTaskUpdate = async () => {
      try {
        const response = await api.post('/developer-scripts/test-task-update');
        console.log('Task update test response:', response);
      } catch (error) {
        console.error('Failed to test task update:', error);
      }
    };

    const testFilingUpdate = async () => {
      try {
        const response = await api.post('/developer-scripts/test-filing-update');
        console.log('Filing update test response:', response);
      } catch (error) {
        console.error('Failed to test filing update:', error);
      }
    };

    const clearLog = () => {
      events.value = [];
    };

    onMounted(() => {
      console.log('[SocketTest] Component mounted, setting up event listeners');
      
      // Check socket connection status
      if (socketStore.socket) {
        socketConnected.value = socketStore.socket.connected;
        socketId.value = socketStore.socket.id || 'Not connected';
        
        // Also listen directly on socket for debugging
        socketStore.socket.on('task-changed', (data: unknown) => {
          console.log('[SocketTest] Direct socket event: task-changed', data);
          addEvent('task-changed (direct)', data);
        });
        
        socketStore.socket.on('filing-updated', (data: unknown) => {
          console.log('[SocketTest] Direct socket event: filing-updated', data);
          addEvent('filing-updated (direct)', data);
        });
      }
      
      // Listen for events via event bus
      bus.on('task-changed', handleTaskChanged);
      bus.on('filing-updated', handleFilingUpdated);
      bus.on('task-completed', handleTaskCompleted);
      bus.on('filing-approved', handleFilingApproved);
      bus.on('approval-processed', handleApprovalProcessed);
    });

    onUnmounted(() => {
      console.log('[SocketTest] Component unmounted, removing event listeners');
      bus.off('task-changed', handleTaskChanged);
      bus.off('filing-updated', handleFilingUpdated);
      bus.off('task-completed', handleTaskCompleted);
      bus.off('filing-approved', handleFilingApproved);
      bus.off('approval-processed', handleApprovalProcessed);
      
      // Remove direct socket listeners
      if (socketStore.socket) {
        socketStore.socket.off('task-changed');
        socketStore.socket.off('filing-updated');
      }
    });

    return {
      events,
      socketConnected,
      socketId,
      testTaskUpdate,
      testFilingUpdate,
      clearLog
    };
  }
});
</script>