<template>
  <q-dialog 
    v-model="show" 
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="email-client">
      <!-- Header -->
      <q-card-section class="email-header q-pa-none">
        <q-toolbar>
          <q-btn flat round dense icon="menu" @click="toggleSidebar" />
          
          <!-- Search Bar -->
          <q-input
            v-model="searchQuery"
            placeholder="Search mail"
            class="email-search q-mx-md"
            outlined
            dense
            rounded
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          
          <q-space />
          
          <!-- Action Buttons -->
          <q-btn flat round dense icon="refresh" @click="refreshEmails">
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="settings" class="q-mr-sm">
            <q-tooltip>Settings</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="close" @click="show = false">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-toolbar>
      </q-card-section>

      <!-- Main Content -->
      <div class="email-content">
        <div class="row no-wrap full-height">
          <!-- Sidebar -->
          <transition name="slide">
            <EmailSidebar 
              v-show="showSidebar"
              :selected-folder="selectedFolder"
              @folder-changed="onFolderChanged"
              @compose="openCompose"
            />
          </transition>

          <!-- Main Content Area (Email List or Email Viewer) -->
          <div class="email-main-content">
            <!-- Email Viewer (when email is selected) -->
            <EmailViewer
              v-if="selectedEmail"
              :email="selectedEmail"
              @reply="replyToEmail"
              @forward="forwardEmail"
              @delete="deleteEmail"
              @mark-unread="markAsUnread"
              @toggle-star="toggleEmailStar"
              @back="selectedEmail = null"
            />
            
            <!-- Email List (when no email is selected) -->
            <EmailList
              v-else
              :emails="filteredEmails"
              :selected-email="selectedEmail"
              :loading="loading"
              @email-selected="onEmailSelected"
              @emails-selected="onEmailsSelected"
            />
          </div>
        </div>
      </div>
    </q-card>

    <!-- Email Compose Dialog -->
    <EmailComposeDialog
      v-model="showComposeDialog"
      :default-to="composeTo"
      :default-subject="composeSubject"
      :default-body="composeBody"
      :mode="composeMode"
      @sent="onEmailSent"
    />
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../../utility/api.handler';
import EmailSidebar from './components/EmailSidebar.vue';
import EmailList from './components/EmailList.vue';
import EmailViewer from './components/EmailViewer.vue';
import EmailComposeDialog from '../../../components/dialog/EmailComposeDialog.vue';

interface EmailRecipient {
  name?: string;
  email: string;
}

interface EmailData {
  id: string;
  messageId?: string;
  from: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  unread: boolean;
  starred: boolean;
  folder: string;
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
  }>;
}

// Mock email data for now
const mockEmails: EmailData[] = [
  {
    id: '1',
    from: { name: 'John Doe', email: 'john@example.com', avatar: null },
    to: [{ name: 'Me', email: 'me@example.com' }],
    subject: 'Project Update - Q4 Planning',
    preview: 'Here is the latest update on the Q4 planning. We need to discuss the timeline for the new features...',
    body: `
      <div>
        <p>Hi Team,</p>
        <p>Here is the latest update on the Q4 planning. We need to discuss the timeline for the new features and allocate resources accordingly.</p>
        <p>Key points to discuss:</p>
        <ul>
          <li>Feature prioritization</li>
          <li>Resource allocation</li>
          <li>Timeline adjustments</li>
        </ul>
        <p>Best regards,<br>John</p>
      </div>
    `,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unread: true,
    starred: false,
    folder: 'inbox',
    hasAttachments: true,
  },
  {
    id: '2',
    from: { name: 'Sarah Johnson', email: 'sarah@company.com', avatar: null },
    to: [{ name: 'Me', email: 'me@example.com' }],
    subject: 'Meeting Reminder - Tomorrow at 10 AM',
    preview: 'Just a reminder about our meeting tomorrow at 10 AM to discuss the new client proposal...',
    body: `
      <div>
        <p>Hi,</p>
        <p>Just a reminder about our meeting tomorrow at 10 AM to discuss the new client proposal.</p>
        <p>Meeting details:</p>
        <ul>
          <li>Time: 10:00 AM - 11:00 AM</li>
          <li>Location: Conference Room B</li>
          <li>Agenda: Client proposal review</li>
        </ul>
        <p>See you there!<br>Sarah</p>
      </div>
    `,
    date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    unread: true,
    starred: true,
    folder: 'inbox',
    hasAttachments: false,
  },
  {
    id: '3',
    from: { name: 'System', email: 'noreply@system.com', avatar: null },
    to: [{ name: 'Me', email: 'me@example.com' }],
    subject: 'Your weekly summary',
    preview: 'Here\'s what happened in your workspace this week. 15 tasks completed, 3 new projects started...',
    body: `
      <div>
        <h3>Weekly Summary</h3>
        <p>Here's what happened in your workspace this week:</p>
        <ul>
          <li>15 tasks completed</li>
          <li>3 new projects started</li>
          <li>8 meetings attended</li>
        </ul>
        <p>Keep up the great work!</p>
      </div>
    `,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unread: false,
    starred: false,
    folder: 'inbox',
    hasAttachments: false,
  },
];

export default defineComponent({
  name: 'EmailClientDialog',
  components: {
    EmailSidebar,
    EmailList,
    EmailViewer,
    EmailComposeDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    // Dialog visibility
    const show = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    // State
    const showSidebar = ref(true);
    const selectedFolder = ref('INBOX');
    const selectedEmail = ref<EmailData | null>(null);
    const selectedEmails = ref<string[]>([]);
    const searchQuery = ref('');
    const loading = ref(false);
    const emails = ref<EmailData[]>(mockEmails);
    
    // Compose dialog
    const showComposeDialog = ref(false);
    const composeTo = ref('');
    const composeSubject = ref('');
    const composeBody = ref('');
    const composeMode = ref('new');

    // Computed
    const filteredEmails = computed(() => {
      let filtered = emails.value.filter(email => 
        email.folder.toLowerCase() === selectedFolder.value.toLowerCase()
      );
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(email => 
          email.subject.toLowerCase().includes(query) ||
          email.from.name.toLowerCase().includes(query) ||
          email.preview.toLowerCase().includes(query)
        );
      }
      
      return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    // Methods
    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value;
    };

    const refreshEmails = async () => {
      loading.value = true;
      try {
        const response = await APIRequests.getEmails($q, {
          folder: selectedFolder.value,
          page: 1,
          limit: 50,
        });
        emails.value = response.emails.map(email => ({
          ...email,
          date: new Date(email.date),
        }));
        // Only show success notification if manually refreshed
        if (emails.value.length > 0) {
          $q.notify({
            color: 'positive',
            message: 'Emails refreshed',
            icon: 'check',
          });
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
        // Keep mock data if fetch fails
        $q.notify({
          color: 'warning',
          message: 'Using demo data. Configure email to see real emails.',
          icon: 'warning',
        });
      } finally {
        loading.value = false;
      }
    };

    const onFolderChanged = (folder: string) => {
      selectedFolder.value = folder;
      selectedEmail.value = null;
    };

    const onEmailSelected = async (email: EmailData) => {
      selectedEmail.value = email;
      // Mark as read
      if (email.unread) {
        try {
          await APIRequests.markEmailAsRead($q, email.id);
          email.unread = false;
        } catch (error) {
          console.error('Failed to mark email as read:', error);
        }
      }
    };

    const onEmailsSelected = (emailIds: string[]) => {
      selectedEmails.value = emailIds;
    };

    const openCompose = () => {
      composeMode.value = 'new';
      composeTo.value = '';
      composeSubject.value = '';
      composeBody.value = '';
      showComposeDialog.value = true;
    };

    const replyToEmail = (email: EmailData) => {
      composeMode.value = 'reply';
      composeTo.value = email.from.email;
      composeSubject.value = `Re: ${email.subject}`;
      composeBody.value = `<br><br>On ${email.date.toLocaleString()}, ${email.from.name} wrote:<br><blockquote>${email.body}</blockquote>`;
      showComposeDialog.value = true;
    };

    const forwardEmail = (email: EmailData) => {
      composeMode.value = 'forward';
      composeTo.value = '';
      composeSubject.value = `Fwd: ${email.subject}`;
      composeBody.value = `<br><br>---------- Forwarded message ----------<br>From: ${email.from.name} <${email.from.email}><br>Date: ${email.date.toLocaleString()}<br>Subject: ${email.subject}<br><br>${email.body}`;
      showComposeDialog.value = true;
    };

    const deleteEmail = (email: EmailData) => {
      $q.dialog({
        title: 'Delete Email',
        message: 'Are you sure you want to delete this email?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await APIRequests.deleteEmail($q, email.id);
          const index = emails.value.findIndex(e => e.id === email.id);
          if (index > -1) {
            emails.value.splice(index, 1);
            selectedEmail.value = null;
          }
          $q.notify({
            color: 'positive',
            message: 'Email deleted',
            icon: 'check',
          });
        } catch (error) {
          console.error('Failed to delete email:', error);
          $q.notify({
            color: 'negative',
            message: 'Failed to delete email',
            icon: 'error',
          });
        }
      });
    };

    const markAsUnread = async (email: EmailData) => {
      try {
        await APIRequests.markEmailAsUnread($q, email.id);
        email.unread = true;
      } catch (error) {
        console.error('Failed to mark email as unread:', error);
        email.unread = false;
      }
    };

    const onEmailSent = () => {
      $q.notify({
        color: 'positive',
        message: 'Email sent successfully',
        icon: 'check',
      });
      refreshEmails();
    };

    // Lifecycle
    onMounted(async () => {
      // Try to fetch real folders
      try {
        const folders = await APIRequests.getEmailFolders($q);
        // Update sidebar with real folders if needed
        console.log('Available email folders:', folders);
        // TODO: Pass folders to EmailSidebar component
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
      
      refreshEmails();
    });

    // Watch for dialog opening
    watch(show, (newValue) => {
      if (newValue) {
        // Reset state and fetch fresh emails when dialog opens
        selectedEmail.value = null;
        refreshEmails();
      }
    });

    // Watch for folder changes
    watch(selectedFolder, () => {
      refreshEmails();
    });

    const toggleEmailStar = async (email: EmailData) => {
      const previousState = email.starred;
      email.starred = !email.starred;
      
      try {
        if (email.starred) {
          await APIRequests.starEmail($q, email.id);
        } else {
          await APIRequests.unstarEmail($q, email.id);
        }
      } catch (error) {
        console.error('Failed to update star status:', error);
        email.starred = previousState;
      }
    };

    return {
      show,
      showSidebar,
      selectedFolder,
      selectedEmail,
      searchQuery,
      loading,
      filteredEmails,
      showComposeDialog,
      composeTo,
      composeSubject,
      composeBody,
      composeMode,
      toggleSidebar,
      refreshEmails,
      onFolderChanged,
      onEmailSelected,
      onEmailsSelected,
      openCompose,
      replyToEmail,
      forwardEmail,
      deleteEmail,
      markAsUnread,
      onEmailSent,
      toggleEmailStar,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-client {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.email-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  z-index: 1;
  
  .q-toolbar {
    min-height: 64px;
  }
  
  .email-search {
    flex: 1;
    max-width: 600px;
    
    :deep(.q-field__control) {
      background: #f1f3f4;
    }
  }
}

.email-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  
  > .row {
    height: 100%;
    position: relative;
  }
}

.email-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.email-viewer-empty {
  flex: 1;
  background: white;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>