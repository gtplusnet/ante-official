<template>
  <q-btn @click="isDialogOpen = true" icon="o_mode_comment" size="14px" rounded>
    <q-badge 
      v-if="unreadCount > 0" 
      color="red" 
      floating
      :label="unreadCount > 99 ? '99+' : unreadCount.toString()"
    />
    <q-tooltip>{{ unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'Discussions' }}</q-tooltip>

    <discussion-dialog 
      :data="data" 
      v-model="isDialogOpen" 
      @messages-read="handleMessagesRead"
    />
  </q-btn>
</template>

<script lang="ts">
import { PropType, ref, computed, onMounted, onUnmounted } from 'vue';
import DiscussionDialog from './DiscussionDialog.vue';
import { DiscussionProps, DiscussionModule } from './DiscussionProps';
import { useDiscussionStore } from 'src/stores/discussionStore';
import { useSocketStore } from 'src/stores/socketStore';
import bus from 'src/bus';

export default {
  name: 'DiscussionButton',
  components: {
    DiscussionDialog,
  },
  props: {
    data: {
      type: Object as PropType<DiscussionProps>,
      required: true,
    },
  },
  setup(props) {
    const isDialogOpen = ref(false);
    const discussionStore = useDiscussionStore();
    const socketStore = useSocketStore();
    const unreadCount = ref(0);
    
    // Helper to create discussionId
    const createDiscussionId = (module: DiscussionModule, targetId: string) => {
      return `${module.toString().toUpperCase()}-${targetId}`;
    };
    
    const discussionId = computed(() => 
      createDiscussionId(props.data.discussionModule, props.data.targetId)
    );
    
    // Event handlers
    const handleNewMessage = () => {
      // The discussion store will handle incrementing the count
      // Just update our local ref
      unreadCount.value = discussionStore.getUnreadCount(discussionId.value);
    };
    
    const handleMessagesRead = () => {
      // Update local unread count
      unreadCount.value = discussionStore.getUnreadCount(discussionId.value);
    };
    
    const handleUnreadCount = (data: { count: number }) => {
      // Initial unread count from socket
      unreadCount.value = data.count;
    };
    
    onMounted(async () => {
      // Fetch initial unread count
      await discussionStore.fetchUnreadCount(discussionId.value);
      unreadCount.value = discussionStore.getUnreadCount(discussionId.value);
      
      // Join socket room if connected
      if (socketStore.isConnected) {
        discussionStore.joinDiscussionRoom(discussionId.value);
      }
      
      // Listen for discussion-specific events
      bus.on(`discussion:${discussionId.value}:new-message` as any, handleNewMessage);
      bus.on(`discussion:${discussionId.value}:messages-read` as any, handleMessagesRead);
      bus.on(`discussion:${discussionId.value}:unread-count` as any, handleUnreadCount as any);
      
      // Also listen for when messages are marked as read locally
      bus.on(`discussion:${discussionId.value}:marked-read` as any, handleMessagesRead);
    });
    
    onUnmounted(() => {
      // Leave socket room
      discussionStore.leaveDiscussionRoom(discussionId.value);
      
      // Clean up event listeners
      bus.off(`discussion:${discussionId.value}:new-message` as any, handleNewMessage);
      bus.off(`discussion:${discussionId.value}:messages-read` as any, handleMessagesRead);
      bus.off(`discussion:${discussionId.value}:unread-count` as any, handleUnreadCount as any);
      bus.off(`discussion:${discussionId.value}:marked-read` as any, handleMessagesRead);
    });

    return {
      isDialogOpen,
      unreadCount,
      handleMessagesRead,
    };
  },
};
</script>
