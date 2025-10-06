<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" transition-show="slide-down" transition-hide="slide-up" @before-show="fetchData">
    <TemplateDialog minWidth="800px">
      <template #DialogIcon>
        <q-icon name="o_mode_comment" size="24px" />
      </template>

      <template #DialogTitle>
        <div class="text-title-medium discuss-title">{{ data.discussionTitle }}</div>
      </template>
      
      <template #DialogQuickActions>
        <DiscussionWatchers 
          v-if="discussionId"
          :discussionId="discussionId"
          :maxVisible="4"
          @watchers-loaded="handleWatchersLoaded"
          @watchers-error="handleWatchersError"
        />
      </template>
      <template #DialogContent>
        <div class="discussion-container" ref="discussionContainerRef">
          <template v-if="loadingMessages && messages.length === 0">
            <q-inner-loading showing color="primary" />
          </template>
          <template v-else-if="messages.length === 0">
            <div class="q-pa-md text-center text-grey">No messages yet.</div>
          </template>
          <template v-else>

            <div v-for="msg in messages" :key="msg.id" class="discussion" :class="{ 'self-message': msg.account?.id == loggedInAccount?.id }">
              <div class="avatar">
                <q-avatar size="32px">
                  <img :src="msg.account?.image || 'https://cdn.quasar.dev/img/avatar1.jpg'" />
                </q-avatar>
              </div>
              <div class="message">
                <div class="details">
                  <div class="person-name">{{ msg.account?.fullName || msg.account?.firstName + ' ' + msg.account?.lastName || 'Unknown' }}</div>
                  <div class="activity-text">{{ msg.activity }}</div>
                </div>
                <div v-if="msg.content" class="message-content" v-html="msg.content"></div>
                <div v-if="msg.attachment" class="message-attachment">
                  <img 
                    v-if="msg.attachment.mimetype?.startsWith('image/')"
                    :src="msg.attachment.url"
                    :alt="msg.attachment.name"
                    class="message-attachment-image"
                    @click="showImageFullscreen(msg.attachment)"
                  />
                  <div v-else class="message-attachment-file">
                    <q-icon name="attach_file" size="20px" />
                    <span class="file-name">{{ msg.attachment.name }}</span>
                    <q-btn
                      flat
                      round
                      dense
                      icon="download"
                      size="sm"
                      @click="downloadFile(msg.attachment)"
                    />
                  </div>
                </div>
                <div class="time">{{ msg.createdAt?.dateTime || msg.createdAt }}</div>
              </div>
            </div>
            <div class="q-mb-sm text-center">
              <q-btn
                v-if="!allLoaded && messages.length > 0 && !loadingMessages"
                size="sm"
                color="primary"
                flat
                @click="loadMoreMessages"
                label="Load more"
                icon="expand_less"
              />
              <q-spinner v-if="loadingMessages && messages.length > 0" size="20px" color="primary" class="q-mt-sm" />
            </div>
          </template>
        </div>
        <div class="discussion-input-message">
          <div v-if="attachmentPreview" class="attachment-preview q-mb-sm">
            <div class="attachment-preview-content">
              <q-icon 
                :name="attachmentPreview.mimetype?.startsWith('image/') ? 'image' : 'attach_file'" 
                size="24px" 
                :color="attachmentPreview.mimetype?.startsWith('image/') ? 'green-6' : 'primary'"
                class="q-mr-sm" 
              />
              <div class="attachment-info">
                <div class="attachment-name">{{ attachmentPreview.name }}</div>
                <div class="attachment-size text-caption text-grey">{{ formatFileSize(attachmentPreview.size) }}</div>
              </div>
              <q-btn
                flat
                round
                dense
                icon="clear"
                size="sm"
                color="negative"
                @click="removeAttachment"
                class="q-ml-auto"
              >
                <q-tooltip>Remove attachment</q-tooltip>
              </q-btn>
            </div>
          </div>
          <div class="editor relative-position">
            <q-editor
              ref="editorRef"
              max-height="100px"
              v-model="messageContent"
              min-height="40px"
              placeholder="Type your message here (use @ to mention someone)"
              @keyup="handleEditorKeyup"
              @focus="handleEditorFocus"
            />

            <!-- Fixed-position mention dropdown that appears beside the editor -->
            <teleport to="body">
              <div v-if="mentionSearch.active" class="mention-dropdown" ref="mentionMenuRef" @mousedown.prevent>
                <q-list dense separator class="mention-dropdown-list">
                  <q-item class="mention-user" v-for="user in mentionUsers" :key="user.id" clickable dense @click="selectMention(user)">
                    <div>
                      <q-avatar size="28px">
                        <img v-if="user.image" :src="user.image" />
                        <template v-else>
                          {{ user.firstName?.charAt(0)?.toUpperCase() || '' }}{{ user.lastName?.charAt(0)?.toUpperCase() || '' }}
                        </template>
                      </q-avatar>
                    </div>
                    <div>
                      <q-item-label>{{ user.firstName }} {{ user.lastName }}</q-item-label>
                      <q-item-label caption>{{ user.email }}</q-item-label>
                    </div>
                  </q-item>

                  <!-- Show loading state -->
                  <q-item v-if="mentionLoading" dense>
                    <q-item-section>
                      <div class="text-center">
                        <q-spinner color="primary" size="sm" />
                        <span class="q-ml-sm">Loading...</span>
                      </div>
                    </q-item-section>
                  </q-item>

                  <!-- No results message -->
                  <q-item v-if="!mentionUsers.length && !mentionLoading" dense>
                    <q-item-section>
                      <div class="text-center text-grey">No users found</div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </teleport>
          </div>
          <div class="actions text-right q-mt-sm">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              style="display: none"
              accept="*/*"
            />
            <DiscussionViewTopicButton :data="data" class="q-mr-sm" v-if="data.fromNotification" />
            <q-btn
              outline
              no-caps
              icon="attach_file"
              label="Attach"
              @click="triggerFileSelect"
              :disable="uploadingAttachment || !!attachmentPreview"
              :loading="uploadingAttachment"
              color="primary"
              class="q-mr-sm"
              size="sm"
            />
            <q-btn
              :loading="loading"
              @click="apiCallCreateDiscussionMessage"
              no-caps
              :color="isMessageEmpty ? 'grey-5' : 'primary'"
              unelevated
              :disable="isMessageEmpty"
            >
              <q-icon size="14px" class="q-mr-xs" name="mail" />
              <span class="q-mt-xxs">Send</span>
            </q-btn>
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
  
  <!-- Fullscreen Image Viewer Dialog -->
  <q-dialog v-model="showImageViewer" maximized transition-show="fade" transition-hide="fade">
    <q-card class="image-viewer-card">
      <q-bar class="bg-dark text-white">
        <div>{{ currentImageName }}</div>
        <q-space />
        <q-btn dense flat icon="download" @click="downloadFile({ url: currentImageUrl, name: currentImageName })" class="q-mr-sm">
          <q-tooltip>Download</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section class="image-viewer-content">
        <img :src="currentImageUrl" :alt="currentImageName" class="fullscreen-image" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss" src="./DiscussionDialog.scss"></style>

<script lang="ts">
import { PropType, ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { defineAsyncComponent } from 'vue';
import { QEditor } from 'quasar';
import { DiscussionModule, DiscussionProps } from './DiscussionProps';
import { CreateDiscussionMessageRequest } from '@shared/request/discussion.request';
import { DiscussionMessageResponse } from '@shared/response/discussion.response';
import { FileDataResponse } from '@shared/response/file.response';
import DiscussionViewTopicButton from './DiscussionViewTopicButton.vue';
import DiscussionWatchers from './DiscussionWatchers.vue';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../utility/axios.error.handler";
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { MiniAccountDataResponse } from '@shared/response/account.response';
import { useAuthStore } from "../../../stores/auth";
import { useDiscussionStore } from 'src/stores/discussionStore';
import { useSocketStore } from 'src/stores/socketStore';
import bus from 'src/bus';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'DiscussionDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    data: {
      type: Object as PropType<DiscussionProps>,
      required: true,
    },
  },
  emits: ['update:modelValue', 'messages-read'],
  components: {
    DiscussionViewTopicButton,
    DiscussionWatchers,
    TemplateDialog,
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const messageContent = ref('');
    const loading = ref(false);
    const authStore = useAuthStore();
    const loggedInAccount = computed(() => authStore.accountInformation);
    const discussionStore = useDiscussionStore();
    const socketStore = useSocketStore();
    const markAsReadTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    // Using HTMLElement type to avoid the 'any' lint errors for editorRef
    const editorRef = ref<InstanceType<typeof QEditor> | null>(null);
    // Chat messages state
    const messages = ref<DiscussionMessageResponse[]>([]);
    const loadingMessages = ref(false);
    const allLoaded = ref(false);
    const discussionContainerRef = ref<HTMLElement | null>(null);
    const scrollThreshold = 30; // px
    
    // Attachment functionality
    const fileInput = ref<HTMLInputElement | null>(null);
    const attachmentPreview = ref<FileDataResponse | null>(null);
    const uploadingAttachment = ref(false);
    
    // Image viewer
    const showImageViewer = ref(false);
    const currentImageUrl = ref('');
    const currentImageName = ref('');

    // @mention functionality
    const mentionUsers = ref<MiniAccountDataResponse[]>([]);
    const mentionLoading = ref(false);
    const mentionMenuRef = ref<HTMLElement | null>(null);
    const mentionSearch = ref({
      active: false,
      term: '',
    });

    // Variables to store text before and after mention for insertion
    const beforeMention = ref('');
    const afterMention = ref('');

    // Debounce helper for mention search
    let mentionSearchTimeout: ReturnType<typeof setTimeout> | null = null;

    // Reset mention state when a message is sent
    const resetMentionState = () => {
      mentionSearch.value.active = false;
      mentionSearch.value.term = '';
      mentionUsers.value = [];
      if (mentionSearchTimeout) {
        clearTimeout(mentionSearchTimeout);
        mentionSearchTimeout = null;
      }
    };

    // Helper to create discussionId
    const createDiscussionId = (module: DiscussionModule, targetId: string) => {
      return `${module.toString().toUpperCase()}-${targetId}`;
    };
    
    // Computed discussionId for watchers component
    const discussionId = computed(() => 
      createDiscussionId(props.data.discussionModule, props.data.targetId)
    );
    
    // Watchers event handlers
    const handleWatchersLoaded = (watchers: any[]) => {
      console.log('Discussion watchers loaded:', watchers);
    };
    
    const handleWatchersError = (error: any) => {
      console.error('Failed to load discussion watchers:', error);
    };

    // Fetch latest messages (first page)
    const fetchMessages = async () => {
      loadingMessages.value = true;
      allLoaded.value = false;
      try {
        const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
        const res = await api.get('/discussion/messages', { params: { discussionId, limit: 20 } });
        messages.value = res.data;
        if (!res.data.length || res.data.length < 20) allLoaded.value = true;
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loadingMessages.value = false;
      }
    };

    // Load more messages (for infinite scroll/upward loading)
    const loadMoreMessages = async () => {
      if (loadingMessages.value || allLoaded.value || !messages.value.length) return;
      loadingMessages.value = true;
      try {
        const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
        const beforeId = messages.value[messages.value.length - 1].id;
        const res = await api.get('/discussion/messages', { params: { discussionId, limit: 20, beforeId } });
        if (res.data.length) {
          messages.value = [...messages.value, ...res.data];
          if (res.data.length < 20) allLoaded.value = true;
        } else {
          allLoaded.value = true;
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loadingMessages.value = false;
      }
    };

    // Helper to scroll to the bottom of the discussion container
    const scrollToBottom = () => {
      nextTick(() => {
        const container = discussionContainerRef.value;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    };

    // Helper function to ensure discussion exists before syncing watchers
    const ensureDiscussionExists = async () => {
      const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
      
      try {
        // Check if discussion exists by trying to fetch messages
        const res = await api.get('/discussion/messages', { 
          params: { discussionId, limit: 1 } 
        });
        
        // If we get here without error, discussion exists
        return res.data.length > 0;
      } catch (error) {
        // If error is 404 or similar, discussion doesn't exist
        return false;
      }
    };

    // Helper function to create discussion with initial system message
    const createDiscussionWithSystemMessage = async () => {
      const request: CreateDiscussionMessageRequest = {
        discussionId: createDiscussionId(props.data.discussionModule, props.data.targetId),
        module: props.data.discussionModule,
        targetId: props.data.targetId,
        title: props.data.discussionTitle || '',
        content: '<em>Discussion created</em>',
        activity: 'created the discussion',
      };
      
      try {
        await api.post('/discussion/message', request);
        return true;
      } catch (error) {
        console.error('Failed to create discussion:', error);
        return false;
      }
    };

    // Fetch messages when dialog is shown
    const fetchData = async () => {
      // Join socket room when dialog opens
      if (socketStore.isConnected) {
        discussionStore.joinDiscussionRoom(props.data.discussionModule + '-' + props.data.targetId);
      }
      
      // Handle discussion creation and watcher syncing
      if (props.data.syncWatchers && props.data.defaultWatcherIds && props.data.defaultWatcherIds.length > 0) {
        const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
        
        // Check if discussion exists
        const discussionExists = await ensureDiscussionExists();
        
        if (!discussionExists) {
          // Create discussion with system message first
          const created = await createDiscussionWithSystemMessage();
          if (!created) {
            console.error('Failed to create discussion');
          }
        }
        
        // Now sync watchers (whether discussion existed or was just created)
        try {
          await api.post('/discussion/sync-watchers', {
            discussionId,
            taskRelatedIds: props.data.defaultWatcherIds
          });
        } catch (error) {
          console.error('Failed to sync discussion watchers:', error);
        }
      }
      
      fetchMessages().then(() => {
        // Set focus to editor after dialog is shown
        nextTick(() => {
          if (editorRef.value) {
            editorRef.value.focus();
          }
          scrollToBottom();
        });
        
        // Mark messages as read after 2 seconds
        if (markAsReadTimer.value) {
          clearTimeout(markAsReadTimer.value);
        }
        markAsReadTimer.value = setTimeout(() => {
          markMessagesAsRead();
        }, 2000);
      });
    };

    // Note: This section has been replaced by the apiCallCreateDiscussionMessage function

    // Utility functions for message content formatting can be added here if needed in the future

    // Save the current selection state for mention insertion
    const saveSelectionState = () => {
      if (!editorRef.value || !editorRef.value.$el) return;

      const editorContentElement = editorRef.value.$el.querySelector('.q-editor__content') as HTMLElement | null;
      if (!editorContentElement) {
        // Fallback to $el if specific content area isn't found, though this might be less accurate
        const editorRootElement = editorRef.value.$el as HTMLElement;
        if (!editorRootElement) return;
        console.warn(
          'QEditor content area (.q-editor__content) not found, falling back to root $el for saveSelectionState. This may not be the contenteditable area.'
        );
        const editor = editorRootElement;
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const currentRange = selection.getRangeAt(0);

        // Helper to get HTML from a range
        const getHtmlOfRange = (rangeToExtract: Range): string => {
          const div = document.createElement('div');
          const contents = rangeToExtract.cloneContents();
          div.appendChild(contents);
          return div.innerHTML;
        };

        // Ensure the current range is within the editor element
        if (!editor.contains(currentRange.commonAncestorContainer)) {
          console.warn('Selection range is outside the editor (fallback path). Mention placement might be incorrect.');
          beforeMention.value = editor.innerHTML; // Default to all content before, if range is unexpected
          afterMention.value = '';
        } else {
          // Calculate HTML before the cursor
          const beforeRange = document.createRange();
          beforeRange.selectNodeContents(editor);
          beforeRange.setEnd(currentRange.startContainer, currentRange.startOffset);
          beforeMention.value = getHtmlOfRange(beforeRange);

          // Calculate HTML after the cursor
          const afterRange = document.createRange();
          afterRange.selectNodeContents(editor);
          afterRange.setStart(currentRange.endContainer, currentRange.endOffset);
          afterMention.value = getHtmlOfRange(afterRange);
        }

        return; // Exit after fallback logic
      }

      const editor = editorContentElement;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const currentRange = selection.getRangeAt(0);

      // Helper to get HTML from a range (can be defined outside or reused if already defined globally/scoped)
      const getHtmlOfRange = (rangeToExtract: Range): string => {
        const div = document.createElement('div');
        const contents = rangeToExtract.cloneContents();
        div.appendChild(contents);
        return div.innerHTML;
      };

      // Ensure the current range is within the editor element
      if (!editor.contains(currentRange.commonAncestorContainer)) {
        console.warn('Selection range is outside the editor (main path). Mention placement might be incorrect.');
        beforeMention.value = editor.innerHTML; // Default to all content before, if range is unexpected
        afterMention.value = '';
      } else {
        // Calculate HTML before the cursor
        const beforeRange = document.createRange();
        beforeRange.selectNodeContents(editor);
        beforeRange.setEnd(currentRange.startContainer, currentRange.startOffset);
        beforeMention.value = getHtmlOfRange(beforeRange);

        // Calculate HTML after the cursor
        const afterRange = document.createRange();
        afterRange.selectNodeContents(editor);
        afterRange.setStart(currentRange.endContainer, currentRange.endOffset);
        afterMention.value = getHtmlOfRange(afterRange);
      }
    };

    // Function for updating mention dropdown position
    const updateMentionPosition = () => {
      if (!editorRef.value || !editorRef.value.$el || !mentionMenuRef.value) return;

      const editorContentElement = editorRef.value.$el.querySelector('.q-editor__content') as HTMLElement | null;
      const fallbackElement = editorRef.value.$el as HTMLElement; // Fallback to root $el if .q-editor__content is not found
      const targetElement = editorContentElement || fallbackElement;

      let rect: DOMRect | undefined;
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (targetElement.contains(range.commonAncestorContainer)) {
          if (range.collapsed) {
            // For a collapsed caret, try getClientRects first
            const clientRects = range.getClientRects();
            if (clientRects.length > 0) {
              rect = clientRects[0];
            } else {
              // Fallback: insert a temporary span to get its position
              const tempSpan = document.createElement('span');
              // Ensure the span has some content or dimensions to be measurable, or use a zero-width space
              tempSpan.textContent = '\u200B'; // Zero-width space
              range.insertNode(tempSpan);
              rect = tempSpan.getBoundingClientRect();
              tempSpan.parentNode?.removeChild(tempSpan);
            }
          } else {
            // For a selection, getBoundingClientRect is usually fine
            rect = range.getBoundingClientRect();
          }
        }
      }

      // If no valid rect from selection/caret, fallback to the editor content element's bounding box
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        console.warn('Failed to get caret/selection rect, falling back to editor content area.');
        rect = targetElement.getBoundingClientRect();
      }

      // Position the dropdown
      const dropdown = mentionMenuRef.value;
      const dropdownHeight = dropdown.offsetHeight;
      const spaceAbove = rect.top + window.scrollY;
      // const spaceBelow = window.innerHeight - (rect.bottom + window.scrollY); // Unused variable
      const preferredTopAbove = rect.top + window.scrollY - dropdownHeight - 5;

      dropdown.style.position = 'fixed';
      // Prefer to position above if there's enough space and it doesn't go off-screen
      if (preferredTopAbove > 10 && dropdownHeight <= spaceAbove) {
        // 10px margin from top of viewport
        dropdown.style.top = `${preferredTopAbove}px`;
      } else {
        // Otherwise, position below
        dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
      }

      dropdown.style.left = `${rect.left + window.scrollX}px`;
      dropdown.style.zIndex = '9999';
      dropdown.style.maxHeight = '200px'; // Keep maxHeight to prevent overly long dropdowns
      dropdown.style.overflowY = 'auto';
      dropdown.style.overflowX = 'hidden';
      dropdown.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)';
    };

    // Handle editor focus event
    const handleEditorFocus = () => {
      // Ensure the editor is properly focused and cursor is positioned
      if (editorRef.value) {
        const editorContentEl = editorRef.value.$el.querySelector('.q-editor__content') as HTMLElement;
        if (editorContentEl) {
          // Make sure the content-editable div is properly focused
          editorContentEl.focus();

          // Set selection to end of content
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(editorContentEl);
            range.collapse(false); // false to collapse to the end
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    };

    // Helper to ensure editor maintains focus after operations
    const keepEditorFocus = () => {
      nextTick(() => {
        if (editorRef.value) {
          editorRef.value.focus(); // Call QEditor's focus method

          // Attempt to place cursor at the end of the content after focus
          const editorContentEl = editorRef.value.$el.querySelector('.q-editor__content') as HTMLElement;
          if (editorContentEl) {
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.selectNodeContents(editorContentEl);
              range.collapse(false); // false to collapse to the end
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      });
    };

    // Watch for mentions in editor input
    const handleEditorKeyup = (e: KeyboardEvent) => {
      if (!editorRef.value) return;

      // Always save the current state around the cursor
      saveSelectionState();

      // Get the plain text content *before* the cursor for accurate mention detection
      // Create a temporary div to parse beforeMention.value and get its textContent
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = beforeMention.value;
      const textBeforeCursor = tempDiv.textContent || '';

      if (e.key === '@') {
        mentionSearch.value.active = true;
        mentionSearch.value.term = ''; // Start with an empty term
        mentionUsers.value = [];
        searchMentionUsers(''); // Fetch initial list
        nextTick(() => updateMentionPosition());
        return;
      }

      if (mentionSearch.value.active) {
        // Check for mention pattern immediately before the cursor
        // This regex looks for "@" followed by word characters (letters, numbers, underscore)
        // right at the end of the string (textBeforeCursor).
        const mentionPattern = /@(\w*)$/;
        const match = textBeforeCursor.match(mentionPattern);

        if (match) {
          // A mention pattern is active right before the cursor
          const currentSearchTerm = match[1]; // The term after "@"
          if (mentionSearch.value.term !== currentSearchTerm) {
            // Only search if term changed
            mentionSearch.value.term = currentSearchTerm;
            searchMentionUsers(currentSearchTerm); // Search can handle empty string for initial list
          }
          // Ensure dropdown is positioned
          nextTick(() => updateMentionPosition());

          // Handle Enter to select
          if (e.key === 'Enter' && !e.shiftKey && mentionUsers.value.length > 0) {
            e.preventDefault();
            selectMention(mentionUsers.value[0]);
            return;
          }
          // (Optional: Handle ArrowDown/Up for selection if desired in future)
        } else {
          // No valid mention pattern immediately before cursor, or space typed, etc.
          mentionSearch.value.active = false;
          mentionUsers.value = []; // Clear users
        }

        // If user types space while a potential mention is active (but not yet a full word)
        // or if the pattern was broken by other means, ensure mention mode is off.
        if (e.key === ' ' && mentionSearch.value.active) {
          // If space is typed and we were in mention mode but the pattern above didn't sustain it
          // (e.g. "@sara " - space after "sara"), deactivate.
          const textAfterAt = textBeforeCursor.substring(textBeforeCursor.lastIndexOf('@') + 1);
          if (textAfterAt.includes(' ')) {
            mentionSearch.value.active = false;
            mentionUsers.value = [];
          }
        }

        // If Escape is pressed, always close the mention dropdown
        if (e.key === 'Escape') {
          mentionSearch.value.active = false;
          mentionUsers.value = [];
          return;
        }
      }
      // No specific "else" needed here; if not '@' and not active, nothing mention-related happens.
    };

    // Search for users to mention
    const searchMentionUsers = async (query: string) => {
      // Cancel any existing search
      if (mentionSearchTimeout) {
        clearTimeout(mentionSearchTimeout);
      }

      // Only search if we have at least 1 character or if explicitly showing all
      if (query.length > 0 || query === '') {
        mentionLoading.value = true;

        // API call is now immediate
        try {
          // Use axios instance from the component
          const response = await api.get(`/discussion/mentions?search=${encodeURIComponent(query)}`);

          // Update mentions with data from response
          if (response.data) {
            if (Array.isArray(response.data)) {
              mentionUsers.value = response.data;
            } else if (response.data.list && Array.isArray(response.data.list)) {
              mentionUsers.value = response.data.list;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              mentionUsers.value = response.data.data;
            } else {
              console.error('Unexpected response format:', response.data);
              mentionUsers.value = [];
            }
          } else {
            mentionUsers.value = [];
          }
        } catch (error) {
          console.error('Error searching for mentions:', error);
          mentionUsers.value = [];
        } finally {
          mentionLoading.value = false;
          nextTick(() => {
            updateMentionPosition();
          });
        }
      } else {
        // Clear results for empty query
        mentionUsers.value = [];
      }
    };

    // Select a user from the mention dropdown
    const selectMention = (user: MiniAccountDataResponse) => {
      const userName = user.fullName || `${user.firstName} ${user.lastName}`;
      // The &nbsp; (non-breaking space) after the mention helps ensure the cursor
      // is placed correctly after insertion and allows normal typing.
      const mentionHtml = `<span class="mention" data-mention-id="${user.id}" contenteditable="false">@${userName}</span>&nbsp;`;

      let finalBeforeMention = beforeMention.value;

      // The mentionSearch.term contains what the user typed *after* the '@'
      // The full trigger is '@' + mentionSearch.term
      const typedMentionTrigger = `@${mentionSearch.value.term}`;

      // Create a temporary div to parse beforeMention.value
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalBeforeMention;

      // Iterate through text nodes to find and remove the typedMentionTrigger
      // This is more robust than a simple string replace on HTML.
      // We search backwards because the trigger should be at the end.
      let foundAndRemoved = false;
      const walkNodes = (node: Node) => {
        if (foundAndRemoved) return; // Optimization: stop once removed

        if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text;
          if (textNode.nodeValue && textNode.nodeValue.includes(typedMentionTrigger)) {
            const lastIndex = textNode.nodeValue.lastIndexOf(typedMentionTrigger);
            // Ensure it's at the very end of the text node's content or followed by typical non-word chars if any
            if (lastIndex + typedMentionTrigger.length === textNode.nodeValue.length) {
              textNode.nodeValue = textNode.nodeValue.substring(0, lastIndex);
              foundAndRemoved = true;
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Traverse children in reverse order for elements
          for (let i = node.childNodes.length - 1; i >= 0; i--) {
            if (foundAndRemoved) break;
            walkNodes(node.childNodes[i]);
          }
        }
      };

      // Start walking from the last child of the tempDiv backwards
      for (let i = tempDiv.childNodes.length - 1; i >= 0; i--) {
        if (foundAndRemoved) break;
        walkNodes(tempDiv.childNodes[i]);
      }

      finalBeforeMention = tempDiv.innerHTML;

      resetMentionState(); // Clears mentionSearch.value.term, hides dropdown.

      if (finalBeforeMention !== undefined && afterMention.value !== undefined) {
        messageContent.value = finalBeforeMention + mentionHtml + afterMention.value;
      } else {
        console.warn('selectMention: beforeMention or afterMention was undefined. Attempting direct HTML insertion.');
        editorRef.value?.runCmd('insertHTML', mentionHtml);
      }

      keepEditorFocus();
    };

    // Computed property to check if message is empty
    const isMessageEmpty = computed(() => {
      // Check if messageContent is empty or only contains whitespace/HTML tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = messageContent.value;
      const textContent = tempDiv.textContent?.trim() || '';
      return textContent === '';
    });

    // Attachment-related methods
    const triggerFileSelect = () => {
      fileInput.value?.click();
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      uploadingAttachment.value = true;
      try {
        const formData = new FormData();
        formData.append('fileData', file);
        
        const response = await api.post('/file-upload/upload-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        attachmentPreview.value = response.data;
        $q.notify({
          color: 'positive',
          message: 'File uploaded successfully',
          icon: 'check',
        });
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        uploadingAttachment.value = false;
        // Reset file input
        if (target) target.value = '';
      }
    };

    const removeAttachment = () => {
      attachmentPreview.value = null;
    };

    const downloadFile = async (attachment: FileDataResponse | { url: string; name: string }) => {
      try {
        // Fetch the file as a blob
        const response = await fetch(attachment.url);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback to simple download
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        link.target = '_blank';
        link.click();
      }
    };

    const showImageFullscreen = (attachment: FileDataResponse) => {
      currentImageUrl.value = attachment.url;
      currentImageName.value = attachment.name;
      showImageViewer.value = true;
    };

    // API call to create a discussion message
    const apiCallCreateDiscussionMessage = () => {
      // Don't proceed if the message is empty
      if (isMessageEmpty.value) return;
      // Process content to handle mentions properly
      const rawContent = messageContent.value;
      // Convert mention spans to a format stored in the database
      let processedContent = rawContent;

      // Find all mention spans using DOM manipulation instead of regex
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawContent;
      const mentionSpans = tempDiv.querySelectorAll('span.mention');

      // Create a new string with mentions converted to the proper format
      mentionSpans.forEach((span) => {
        const id = span.getAttribute('data-mention-id');
        const name = span.textContent?.substring(1); // Remove @ from the text
        if (id && name) {
          const spanHtml = span.outerHTML;
          const mentionTag = `<mention class="mention" id="${id}">@${name}</mention>`;
          processedContent = processedContent.replace(spanHtml, mentionTag);
        }
      });

      // Create the discussion message request
      const request: CreateDiscussionMessageRequest = {
        discussionId: createDiscussionId(props.data.discussionModule, props.data.targetId),
        module: props.data.discussionModule,
        targetId: props.data.targetId,
        title: props.data.discussionTitle || '',
        content: processedContent.trim(),
        activity: 'commented on the discussion',
        attachmentId: attachmentPreview.value?.id,
      };

      loading.value = true;
      api
        .post('/discussion/message', request)
        .then(() => {
          messageContent.value = '';
          attachmentPreview.value = null; // Clear attachment preview
          resetMentionState(); // Reset mention state after sending
          fetchData(); // Refresh messages after sending
        })
        .catch((error) => {
          // Handle error with Quasar's notification system
          const e = error as AxiosError;
          if (e.response) {
            $q.notify({
              color: 'negative',
              message: `Error: ${(e.response.data as { message?: string })?.message || 'Failed to send message'}`,
            });
          } else {
            $q.notify({
              color: 'negative',
              message: 'Network error, please try again',
            });
          }
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // Handler for scroll event (column-reverse: top is scrollHeight)
    const handleScroll = () => {
      const container = discussionContainerRef.value;
      if (!container || loadingMessages.value || allLoaded.value || messages.value.length === 0) return;
      // For column-reverse, scrollTop is at the bottom when 0, at the top when (scrollHeight - clientHeight)
      // So, we check if scrollTop + clientHeight >= scrollHeight - threshold
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - scrollThreshold) {
        loadMoreMessages();
      }
      
      // Check if scrolled to bottom to mark messages as read
      const isAtBottom = container.scrollTop <= 10; // Near bottom in column-reverse
      if (isAtBottom && messages.value.length > 0) {
        // Clear existing timer and mark as read immediately when at bottom
        if (markAsReadTimer.value) {
          clearTimeout(markAsReadTimer.value);
        }
        markMessagesAsRead();
      }
    };

    // Mark messages as read
    const markMessagesAsRead = async () => {
      if (messages.value.length === 0) return;
      
      const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
      await discussionStore.markMessagesAsRead(discussionId);
      
      // Emit event to parent
      emit('messages-read', { discussionId });
    };
    
    // Handle real-time new messages
    const handleNewMessage = (data: { discussionId: string; message: DiscussionMessageResponse; senderId: string }) => {
      // Check if message already exists (to prevent duplicates)
      const exists = messages.value.some(msg => msg.id === data.message.id);
      if (!exists) {
        // Add new message to the beginning (since we display in reverse order)
        messages.value.unshift(data.message);
        
        // Scroll to bottom to show new message
        nextTick(() => {
          scrollToBottom();
        });
        
        // If it's from another user, mark as read after 2 seconds
        if (data.senderId !== loggedInAccount.value?.id) {
          if (markAsReadTimer.value) {
            clearTimeout(markAsReadTimer.value);
          }
          markAsReadTimer.value = setTimeout(() => {
            markMessagesAsRead();
          }, 2000);
        }
      }
    };

    onMounted(() => {
      // Reset mention state on component mount
      resetMentionState();

      const container = discussionContainerRef.value;
      if (container) {
        container.addEventListener('scroll', handleScroll);
      }
      
      // Listen for real-time messages
      const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
      bus.on(`discussion:${discussionId}:new-message` as any, handleNewMessage as any);
    });

    onUnmounted(() => {
      const container = discussionContainerRef.value;
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }

      // Clear any remaining timeout
      if (mentionSearchTimeout) {
        clearTimeout(mentionSearchTimeout);
      }
      
      if (markAsReadTimer.value) {
        clearTimeout(markAsReadTimer.value);
      }
      
      // Leave socket room
      const discussionId = createDiscussionId(props.data.discussionModule, props.data.targetId);
      discussionStore.leaveDiscussionRoom(discussionId);
      
      // Clean up event listeners
      bus.off(`discussion:${discussionId}:new-message` as any, handleNewMessage as any);
    });

    // Return all variables and functions needed in the template
    return {
      messageContent,
      loading,
      editorRef,
      apiCallCreateDiscussionMessage,
      messages,
      loadingMessages,
      allLoaded,
      discussionContainerRef,
      loadMoreMessages,
      fetchData,
      mentionUsers,
      mentionLoading,
      mentionSearch,
      mentionMenuRef,
      handleEditorKeyup,
      handleEditorFocus,
      selectMention,
      keepEditorFocus,
      isMessageEmpty,
      loggedInAccount,
      discussionId,
      handleWatchersLoaded,
      handleWatchersError,
      // Attachment functionality
      fileInput,
      attachmentPreview,
      uploadingAttachment,
      triggerFileSelect,
      handleFileSelect,
      removeAttachment,
      formatFileSize,
      downloadFile,
      showImageFullscreen,
      // Image viewer
      showImageViewer,
      currentImageUrl,
      currentImageName,
    };
  },
};
</script>
