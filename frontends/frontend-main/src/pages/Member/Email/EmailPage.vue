<template>
  <div class="email-page">
    <!-- Header -->
    <div class="email-header q-pb-sm">
      <q-toolbar>
        <div class="row items-center">
          <q-btn flat round dense icon="notes" @click="toggleSidebar" />
          <div class="text-title-large q-ml-md">Emails</div>
        </div>

        <q-space />

        <!-- Search Bar -->
        <q-input
          v-model="searchQuery"
          placeholder="Search mail"
          class="email-search"
          :class="$q.screen.lt.md ? 'q-mx-sm' : 'q-mx-md'"
          standout
          dense
          rounded
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Action Buttons -->
        <q-btn
          flat
          round
          dense
          icon="refresh"
          class="text-grey"
          :class="$q.screen.gt.xs ? 'q-mr-md' : 'q-mr-sm'"
          @click="refreshEmails"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
        <q-btn
          v-if="$q.screen.gt.xs"
          flat
          round
          dense
          icon="settings"
          class="text-grey"
          @click="goToSettings"
        >
          <q-tooltip>Email Settings</q-tooltip>
        </q-btn>
      </q-toolbar>
    </div>

    <!-- Main Content -->
    <div class="email-content">
      <div class="row no-wrap full-height">
        <!-- Sidebar -->
        <transition name="slide">
          <EmailSidebar
            v-show="showSidebar || $q.screen.gt.md"
            :class="{ 'mobile-sidebar': $q.screen.lt.lg }"
            :selected-folder="selectedFolder"
            @folder-changed="onFolderChanged"
            @compose="openCompose"
          />
        </transition>

        <!-- Main Content Area (Email List or Email Viewer) -->
        <div class="email-main-content" :class="{ 'full-width': !showSidebar && $q.screen.lt.lg }">
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
            :key="`email-list-${filteredEmails.length}`"
            :emails="filteredEmails"
            :selected-email="selectedEmail"
            :loading="loading"
            @email-selected="onEmailSelected"
            @emails-selected="onEmailsSelected"
          />
        </div>
      </div>
    </div>

    <!-- Email Compose Dialog -->
    <EmailComposeDialog v-model="showComposeDialog" :default-to="composeTo" :default-subject="composeSubject" :default-body="composeBody" :mode="composeMode" @sent="onEmailSent" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router';
import { APIRequests } from '../../../utility/api.handler';
import EmailSidebar from './components/EmailSidebar.vue';
import EmailList from './components/EmailList.vue';
import EmailViewer from './components/EmailViewer.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const EmailComposeDialog = defineAsyncComponent(() =>
  import('../../../components/dialog/EmailComposeDialog.vue')
);

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

export default defineComponent({
  name: 'EmailPage',
  components: {
    EmailSidebar,
    EmailList,
    EmailViewer,
    EmailComposeDialog,
  },
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const route = useRoute();

    // State
    const showSidebar = ref($q.screen.gt.sm); // Show sidebar by default on desktop/tablet
    const selectedFolder = ref('INBOX');
    const selectedEmail = ref<EmailData | null>(null);
    const selectedEmails = ref<string[]>([]);
    const searchQuery = ref('');
    const loading = ref(false);
    const emails = ref<EmailData[]>([]);

    // Compose dialog
    const showComposeDialog = ref(false);
    const composeTo = ref('');
    const composeSubject = ref('');
    const composeBody = ref('');
    const composeMode = ref('new');

    // Computed
    const filteredEmails = computed(() => {
      console.log('Computing filtered emails, total emails:', emails.value.length, 'folder:', selectedFolder.value);
      let filtered = emails.value.filter((email) => email.folder.toLowerCase() === selectedFolder.value.toLowerCase());

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(
          (email) => email.subject.toLowerCase().includes(query) || email.from.name.toLowerCase().includes(query) || email.preview.toLowerCase().includes(query)
        );
      }

      const sorted = filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
      console.log('Filtered emails count:', sorted.length);
      return sorted;
    });

    // Methods
    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value;
    };

    const refreshEmails = async () => {
      console.log('refreshEmails called, folder:', selectedFolder.value);
      loading.value = true;
      try {
        const response = await APIRequests.getEmails($q, {
          folder: selectedFolder.value,
          page: 1,
          limit: 50,
        });
        console.log('Email API response:', response);

        if (response && response.emails) {
          emails.value = response.emails.map((email) => ({
            ...email,
            date: new Date(email.date),
          }));
          console.log('Emails array updated, count:', emails.value.length);
          console.log('First email:', emails.value[0]);

          // Force reactivity update
          emails.value = [...emails.value];
        } else {
          console.log('No emails in response');
          emails.value = [];
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
        emails.value = [];
        // Show notification about email configuration
        $q.notify({
          color: 'info',
          message: 'Email not configured. Please configure email settings first.',
          icon: 'info',
          actions: [
            {
              label: 'Configure',
              color: 'white',
              handler: () => router.push('/member/settings/email'),
            },
          ],
        });
      } finally {
        loading.value = false;
        console.log('Loading complete, final email count:', emails.value.length);
      }
    };

    const onFolderChanged = (folder: string) => {
      selectedFolder.value = folder;
      selectedEmail.value = null;
      // Auto-hide sidebar on mobile after selection
      if ($q.screen.lt.md) {
        showSidebar.value = false;
      }
    };

    const onEmailSelected = async (email: EmailData) => {
      selectedEmail.value = email;
      // Hide sidebar on mobile when email is selected
      if ($q.screen.lt.md) {
        showSidebar.value = false;
      }
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
      // Hide sidebar on mobile after compose
      if ($q.screen.lt.md) {
        showSidebar.value = false;
      }
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
      composeBody.value = `<br><br>---------- Forwarded message ----------<br>From: ${email.from.name} <${email.from.email}><br>Date: ${email.date.toLocaleString()}<br>Subject: ${
        email.subject
      }<br><br>${email.body}`;
      showComposeDialog.value = true;
    };

    const deleteEmail = async (email: EmailData) => {
      try {
        await APIRequests.deleteEmail($q, email.id);
        emails.value = emails.value.filter((e) => e.id !== email.id);
        selectedEmail.value = null;
        $q.notify({
          color: 'positive',
          message: 'Email deleted',
          icon: 'check',
        });
      } catch (error) {
        console.error('Failed to delete email:', error);
      }
    };

    const markAsUnread = async (email: EmailData) => {
      try {
        await APIRequests.markEmailAsUnread($q, email.id);
        email.unread = true;
        selectedEmail.value = null;
      } catch (error) {
        console.error('Failed to mark email as unread:', error);
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

    const goToSettings = () => {
      router.push('/member/settings/email');
    };

    // Initialize email page
    const initializeEmailPage = async () => {
      console.log('Initializing email page...');

      // Reset state to ensure fresh start
      selectedEmail.value = null;
      emails.value = [];

      // Ensure proper layout calculation after navigation
      await nextTick();

      // Try to fetch real folders
      try {
        const folders = await APIRequests.getEmailFolders($q);
        console.log('Available email folders:', folders);
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }

      // Fetch emails
      await refreshEmails();
    };

    // Track if we've initialized
    let hasInitialized = false;

    // Lifecycle
    onMounted(async () => {
      console.log('EmailPage onMounted, route:', route.path);
      // Always initialize on mount
      hasInitialized = false;
      await initializeEmailPage();
      hasInitialized = true;
    });

    // Handle route updates
    onBeforeRouteUpdate(async (to, from) => {
      console.log('Route update:', from.path, '->', to.path);
      if (to.path === '/member/email') {
        await initializeEmailPage();
      }
    });

    // Watch for route changes to detect when we navigate back to email page
    watch(
      () => route.path,
      async (newPath, oldPath) => {
        console.log('Route watcher - from:', oldPath, 'to:', newPath);

        // If we're on the email page and it's not the initial mount
        if (newPath === '/member/email' && hasInitialized) {
          console.log('Re-navigated to email page, reinitializing...');
          await initializeEmailPage();
        }
      }
    );

    // Watch for folder changes
    watch(selectedFolder, () => {
      refreshEmails();
    });

    // Debug watcher for emails array
    watch(
      emails,
      (newEmails) => {
        console.log('Emails array changed, new length:', newEmails.length);
      },
      { deep: true }
    );

    // Debug watcher for computed property
    watch(filteredEmails, (newFiltered) => {
      console.log('Filtered emails changed, new length:', newFiltered.length);
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
      toggleEmailStar,
      onEmailSent,
      goToSettings,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-page {
  height: calc(100vh - 100px);
  display: flex;
  margin-left: 43px;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;

  @media (max-width: 768px) {
    height: calc(100vh - 155px);
  }

  // Mobile adjustments
  @media (max-width: 599px) {
    height: calc(100vh - 140px);
  }

  // Tablet adjustments
  @media (max-width: 1023px) {
    margin-left: 18px;
  }

  .email-header {
    background: #fff;
    border-bottom: 1px solid #e0e0e0;

    .email-search {
      // Always use dark text color for the search icon
      :deep(.q-field__prepend .q-icon) {
        color: var(--q-text-dark) !important;
      }
      color: var(--q-text-dark);
      max-width: 350px;
      flex: 1;

      // Mobile search width
      @media (max-width: 599px) {
        max-width: 200px;
      }

      // Tablet search width
      @media (max-width: 1023px) {
        max-width: 280px;
      }

      :deep(.q-field__native) {
        color: var(--q-text-dark);
      }

      :deep(.q-field__control) {
        background: #f6f8fb;
        box-shadow: none;
        color: var(--q-text-dark);
      }
    }
  }

  .email-content {
    flex: 1;
    overflow: hidden;
    position: relative;

    .row {
      height: 100%;
    }

    // Mobile sidebar overlay
    .mobile-sidebar {
      @media (max-width: 1023px) {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .email-main-content {
    flex: 1;
    overflow: hidden;
    background: white;
    transition: margin-left 0.3s;

    &.full-width {
      @media (max-width: 1023px) {
        width: 100%;
      }
    }
  }
}

// Sidebar slide transition
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  @media (max-width: 1023px) {
    transform: translateX(-100%);
  }
  @media (min-width: 1024px) {
    margin-left: -260px;
  }
}
</style>
