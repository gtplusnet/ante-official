<template>
  <div class="email-sidebar">
    <!-- Compose Button -->
    <q-btn
      @click="$emit('compose')"
      unelevated
      color="secondary"
      class="compose-btn q-mb-md"
      no-caps
    >
      <q-icon name="edit_square" size="20px" class="q-mr-sm" />
      Compose
    </q-btn>

    <!-- Folder List -->
    <q-list>
      <q-item
        v-for="folder in folders"
        :key="folder.id"
        clickable
        v-ripple
        :active="selectedFolder === folder.id"
        @click="$emit('folder-changed', folder.id)"
        active-class="active-folder"
      >
        <q-item-section avatar>
          <q-icon class="text-grey" size="20px" :name="folder.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label><span class="text-grey text-label-medium">{{ folder.name }}</span></q-item-label>
        </q-item-section>
        <q-item-section side v-if="folder.count">
          <q-badge :label="folder.count" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EmailSidebar',
  props: {
    selectedFolder: {
      type: String,
      default: 'inbox',
    },
  },
  emits: ['folder-changed', 'compose'],
  setup() {
    const folders = [
      { id: 'inbox', name: 'Inbox', icon: 'mail', count: 12 },
      { id: 'sent', name: 'Sent', icon: 'send', count: 0 },
      { id: 'drafts', name: 'Drafts', icon: 'file_copy', count: 3 },
      { id: 'starred', name: 'Starred', icon: 'star_half', count: 0 },
      { id: 'important', name: 'Important', icon: 'book', count: 0 },
      { id: 'spam', name: 'Spam', icon: 'report', count: 0 },
      { id: 'trash', name: 'Trash', icon: 'delete', count: 0 },
    ];

    return {
      folders,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-sidebar {
  min-width: 270px;
  background: white;
  padding: 16px;
  padding-top: 8px;
  overflow-y: auto;
  height: 100%;

  // Mobile adjustments
  @media (max-width: 599px) {
    min-width: 250px;
    padding: 12px;
  }

  // Tablet adjustments
  @media (max-width: 1023px) {
    min-width: 260px;
  }

  .compose-btn {
    width: 100%;
    border-radius: 6px;
    padding: 8px 24px;
    margin-top: 8px;

    @media (max-width: 599px) {
      padding: 8px 16px;
    }
  }

  .active-folder {
    background-color: #f6f8fb;
    color: var(--q-secondary);

    .q-icon {
      color: #d33b27;
    }
  }
}
</style>
