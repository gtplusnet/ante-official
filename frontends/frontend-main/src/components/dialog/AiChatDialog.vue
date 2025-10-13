<template>
  <q-dialog v-model="isOpen" position="right" maximized class="ai-chat-dialog">
    <q-card class="ai-chat-card">
      <!-- Header -->
      <q-card-section class="ai-chat-header">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-h6">AI Assistant</div>
            <div class="text-caption text-grey-6">Ask me anything about your projects</div>
          </div>
          <div class="col-auto">
            <q-btn flat round dense icon="close" @click="closeDialog" />
          </div>
        </div>
      </q-card-section>

      <!-- Messages Area -->
      <q-card-section class="ai-chat-messages" ref="messagesContainer" @scroll="onScroll">
        <div v-if="isLoadingMore" class="text-center q-mb-md">
          <q-spinner-dots color="primary" size="24px" />
        </div>
        <div v-if="messages.length === 0 && !isLoadingMore" class="text-center text-grey-6 q-mt-xl">
          <q-icon name="chat" size="64px" class="q-mb-md" />
          <div class="text-h6">Start a conversation</div>
          <div class="text-body2">Ask me about your tasks, projects, or anything else!</div>
        </div>
        <div v-for="(message, index) in messages" :key="index" class="message-item">
          <div :class="[
            'message-bubble',
            message.role === 'user' ? 'user-message' : 'assistant-message'
          ]">
            <div class="message-content" v-html="message.role === 'assistant' ? renderMarkdown(message.content) : message.content"></div>
            <div class="message-time">{{ formatTime(message.createdAt) }}</div>
          </div>
        </div>
        <!-- Typing indicator -->
        <div v-if="isTyping" class="message-item">
          <div class="message-bubble assistant-message typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <!-- Loading overlay when not at bottom and loading -->
        <div v-if="!isAtBottom" class="ai-chat-loading-overlay">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </q-card-section>
      <!-- Input Area -->
      <q-card-section class="ai-chat-input">
        <div class="row q-gutter-sm">
          <div class="col">
            <q-input
              v-model="currentMessage"
              placeholder="Type your message..."
              outlined
              dense
              @keyup.enter="sendMessage"
              :disable="isTyping"
            />
          </div>
          <div class="col-auto">
            <q-btn
              icon="send"
              color="primary"
              round
              dense
              @click="sendMessage"
              :disable="isTyping || !currentMessage.trim()"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useSocketStore } from "../../stores/socketStore";
import { api } from 'src/boot/axios';
import { marked } from 'marked';

export default {
  name: 'AiChatDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      currentMessage: '',
      messages: [],
      isTyping: false,
      isLoadingMore: false,
      hasMore: true,
      isAtBottom: false,
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    socketChatStore() {
      return useSocketStore();
    },
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.scrollToBottom();
        this.isAtBottom = false;
        this.setupSocketListeners();
        this.loadMessages();
      } else {
        this.removeSocketListeners();
      }
    },
  },
  methods: {
    closeDialog() {
      this.isOpen = false;
    },

    sendMessage() {
      if (!this.currentMessage.trim() || this.isTyping) return;

      const message = {
        role: 'user',
        content: this.currentMessage.trim(),
        createdAt: new Date().toISOString(),
      };

      console.log('[AI CHAT] Attempting to send message:', message);
      console.log('[AI CHAT] Socket connected:', this.socketChatStore.isConnected);
      console.log('[AI CHAT] Socket instance:', this.socketChatStore.socket);

      this.messages.push(message);
      this.isTyping = true;

      // Send message via socket store
      const sent = this.socketChatStore.sendAiChatMessage(message);
      console.log('[AI CHAT] Message sent result:', sent);

      if (!sent) {
        // If message failed to send, remove from messages and stop typing
        this.messages.pop();
        this.isTyping = false;
        // Show error notification (could be enhanced with Quasar notify)
        console.error('[AI CHAT] Failed to send message. Socket not connected.');
        this.$q.notify({
          type: 'negative',
          message: 'Socket not connected. Please refresh the page.',
          position: 'top'
        });
      }

      this.currentMessage = '';
      this.scrollToBottom();
    },

    setupSocketListeners() {
      if (this.socketChatStore.socket) {
        this.socketChatStore.socket.on('ai_chat_message', this.handleAiResponse);
      }
    },

    removeSocketListeners() {
      if (this.socketChatStore.socket) {
        this.socketChatStore.socket.off('ai_chat_message', this.handleAiResponse);
      }
    },

    handleAiResponse(data) {
      if (data.message === 'assistant') {
        this.messages.push(data.data);
        this.isTyping = false;
        this.scrollToBottom();
      } else if (data.message === 'error') {
        this.messages.push(data.data);
        this.isTyping = false;
        this.scrollToBottom();
      }
    },

    async loadMessages(initial = true) {
      try {
        let before = undefined;
        if (!initial && this.messages.length > 0) {
          before = this.messages[0].createdAt;
        }
        this.isLoadingMore = !initial;
        // Artificial delay for demo
        const response = await api.get('/ai-chat/conversation/messages', {
          params: {
            limit: 30,
            before,
          },
        });
        const newMessages = response.data || [];
        if (initial) {
          this.messages = newMessages;
        } else {
          // Prepend older messages
          this.messages = [...newMessages, ...this.messages];
        }
        this.hasMore = newMessages.length === 30;
        this.$nextTick(() => {
          setTimeout(() => {
            if (initial) {
              this.scrollToBottom();
              setTimeout(() => {
                this.isAtBottom = true;
              }, 200);
            } else {
              this.scrollToFirstNew(newMessages.length);
            }
            this.isLoadingMore = false;
          }, 200);
        });
      } catch (error) {
        if (initial) this.messages = [];
        this.hasMore = false;
        this.isLoadingMore = false;
        console.error('Failed to load conversation history:', error);
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        setTimeout(() => {
          let container = this.$refs.messagesContainer;
          // If using Quasar, sometimes $refs is a Vue component, not a DOM node
          if (container && container.$el) container = container.$el;
          if (container && container.scrollHeight !== undefined) {
            container.scrollTop = container.scrollHeight;
          } else if (container && container.querySelector) {
            // Try to find the actual scrollable div inside
            const scrollDiv = container.querySelector('.q-card__section, .ai-chat-messages');
            if (scrollDiv) scrollDiv.scrollTop = scrollDiv.scrollHeight;
          }
        }, 200);
      });
    },

    onScroll(e) {
      const container = e.target;
      if (container.scrollTop === 0 && this.hasMore && !this.isLoadingMore) {
        this.loadMessages(false);
      }
    },

    scrollToFirstNew(newCount) {
      // Scroll to the first of the newly loaded messages
      const container = this.$refs.messagesContainer;
      if (container && container.scrollHeight !== undefined) {
        // Estimate height of new messages
        const messageEls = container.querySelectorAll('.message-item');
        let height = 0;
        for (let i = 0; i < newCount && i < messageEls.length; i++) {
          height += messageEls[i].offsetHeight;
        }
        container.scrollTop = height;
      }
    },

    renderMarkdown(text) {
      return marked.parse(text || '');
    },
  },

  beforeUnmount() {
    this.removeSocketListeners();
  },
};
</script>

<style lang="scss" scoped>
.ai-chat-dialog {

  .ai-chat-card {
    width: 400px;
    height: 100vh;
    display: flex;
    flex-direction: column;

  }

  .ai-chat-header {
    border-bottom: 1px solid #e0e0e0;
    background: #f5f5f5;
  }

  .ai-chat-messages {
    position: relative;
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 100px);

    .message-item {
      margin-bottom: 16px;

      .message-bubble {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        position: relative;

        &.user-message {
          background: #1976d2;
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }

        &.assistant-message {
          background: #f1f3f4;
          color: #333;
          margin-right: auto;
          border-bottom-left-radius: 4px;
        }

        .message-content {
          word-wrap: break-word;
          line-height: 1.4;
        }

        .message-time {
          font-size: 11px;
          margin-top: 4px;
          opacity: 0.7;
        }
      }
    }
  }

  .ai-chat-input {
    border-top: 1px solid #e0e0e0;
    background: white;
  }

  .typing-indicator {
    .typing-dots {
      display: flex;
      gap: 4px;

      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite ease-in-out;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
      }
    }
  }

  .ai-chat-loading-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255);
    z-index: 2;
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.message-content {
  /* Add some padding and style for markdown */
  padding: 0;

  ul {
    display: none !important;
  }
}
.message-content ul,
.message-content ol {

  margin: 0 0 0 1.2em;
  padding: 0;
}
.message-content li {
  margin-bottom: 0.2em;
}
.message-content strong {
  font-weight: bold;
}
.message-content em {
  font-style: italic;
}
</style>
