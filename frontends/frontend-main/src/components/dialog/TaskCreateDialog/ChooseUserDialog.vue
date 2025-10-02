<template>
  <q-dialog ref="dialog" @before-show="fetchData" :maximized="$q.platform.is.mobile" transition-show="slide-up" transition-hide="slide-down">
    <q-card class="dialog-card" :class="{ 'mobile-dialog': $q.platform.is.mobile }">
      <q-card-section class="dialog-header">
        <div class="dialog-header-content">
          <q-icon name="group" size="24px" class="dialog-icon" />
          <h6 class="dialog-title text-headline-small">Choose Collaborators</h6>
        </div>
        <q-btn
          round
          flat
          dense
          icon="close"
          class="dialog-close-btn"
          v-close-popup
        >
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-card-section>
      
      <q-separator />

      <q-card-section class="dialog-body q-pa-none">
        <q-scroll-area class="dialog-scroll-area">
          <div class="q-pa-md">
            <!-- Search Bar -->
            <q-input
              v-model="searchQuery"
              outlined
              dense
              placeholder="Search users..."
              class="search-input q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append v-if="searchQuery">
                <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
              </template>
            </q-input>

            <!-- User List -->
            <q-list class="user-list" separator>
              <q-item 
                v-for="user in filteredUsers" 
                :key="user.id" 
                clickable 
                v-ripple
                @click="toggleUserSelection(user)"
                class="user-item"
              >
                <q-item-section side>
                  <q-checkbox 
                    :model-value="isSelected(user)" 
                    color="primary"
                    @update:model-value="toggleUserSelection(user)"
                  />
                </q-item-section>
                <q-item-section avatar>
                  <q-avatar size="40px" color="primary" text-color="white">
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body-large">{{ user.firstName }} {{ user.lastName }}</q-item-label>
                  <q-item-label caption class="text-body-medium">{{ user.email || 'No email' }}</q-item-label>
                </q-item-section>
              </q-item>
              
              <div v-if="filteredUsers.length === 0" class="no-results">
                <q-icon name="search_off" size="48px" color="grey-5" />
                <p class="text-body-large text-grey-7">No users found</p>
              </div>
            </q-list>
          </div>
        </q-scroll-area>
      </q-card-section>
      
      <q-separator />
      
      <!-- Dialog Actions -->
      <q-card-actions class="dialog-actions">
        <div class="selected-count text-body-medium text-grey-7">
          {{ selectedUsers.length }} selected
        </div>
        <q-space />
        <q-btn
          no-caps
          flat
          class="text-label-large action-btn"
          label="Cancel"
          color="primary"
          v-close-popup
        />
        <q-btn
          no-caps
          unelevated
          class="text-label-large action-btn"
          label="Add Collaborators"
          color="primary"
          @click="submitSelectedUsers"
          :disable="selectedUsers.length === 0"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
// Material Design 3 Dialog Styles
.dialog-card {
  max-width: 500px;
  width: 100%;
  border-radius: 28px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  
  &.mobile-dialog {
    border-radius: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    background-color: #ffffff;
    box-shadow: none;
  }
}

// Dialog Header - MD3 style
.dialog-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  
  .dialog-header-content {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .dialog-icon {
      color: var(--q-primary);
    }
    
    .dialog-title {
      margin: 0;
      color: var(--q-on-surface);
      font-weight: 400;
    }
  }
  
  .dialog-close-btn {
    color: var(--q-on-surface-variant);
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }
  }
}

// Dialog Body
.dialog-body {
  background-color: #ffffff;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.dialog-scroll-area {
  height: calc(100vh - 200px);
  max-height: 500px;
  background-color: #fafafa;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  
  .mobile-dialog & {
    height: calc(100vh - 140px);
    max-height: none;
    background-color: #ffffff;
  }
}

// Search Input
.search-input {
  :deep(.q-field__control) {
    border-radius: 28px;
    background-color: var(--q-surface-variant, #f5f5f5);
    
    &:before {
      border: none;
    }
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }
  }
  
  :deep(.q-field--focused .q-field__control) {
    background-color: var(--q-surface);
    box-shadow: 0 0 0 2px var(--q-primary);
  }
}

// User List
.user-list {
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--q-surface);
}

.user-item {
  padding: 8px 16px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  &:active {
    background-color: rgba(0, 0, 0, 0.08);
  }
  
  .q-item__section--avatar {
    min-width: auto;
    padding-right: 16px;
  }
}

// No Results
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  
  p {
    margin-top: 16px;
    margin-bottom: 0;
  }
}

// Dialog Actions - MD3 style
.dialog-actions {
  padding: 16px 24px;
  background-color: #ffffff;
  
  .selected-count {
    padding-left: 8px;
  }
  
  .action-btn {
    min-width: 64px;
    padding: 10px 24px;
    border-radius: 20px;
    
    &:not(.q-btn--unelevated) {
      &:hover {
        background-color: rgba(var(--q-primary-rgb), 0.08);
      }
    }
    
    &:disabled {
      opacity: 0.38;
    }
  }
}

// Ensure proper spacing on mobile
@media (max-width: 600px) {
  .dialog-header {
    padding: 16px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
  
  .dialog-actions {
    position: sticky;
    bottom: 0;
    z-index: 10;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.12);
    padding: 12px 16px;
    
    .selected-count {
      font-size: 14px;
    }
  }
}

// Checkbox enhancement
:deep(.q-checkbox__inner) {
  border-radius: 4px;
  
  &:before {
    border-radius: 4px;
  }
}
</style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'ChooseUserDialog',
  props: {
    existingCollaborators: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    userList: [],
    selectedUsers: [],
    searchQuery: '',
  }),
  computed: {
    filteredUsers() {
      const query = this.searchQuery.toLowerCase();
      return this.userList.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }
  },
  methods: {
    fetchData() {
      this.selectedUsers = [];
      this.userList = [];
      this.searchQuery = '';
      
      api.get('/select-box/user-list')
        .then(response => {
          this.userList = response.data.list;
          // Pre-select existing collaborators
          this.userList.forEach(user => {
            if (this.isExistingCollaborator(user)) {
              this.selectedUsers.push(user);
            }
          });
        })
        .catch(error => {
          console.log(error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load users',
            position: 'top'
          });
        });
    },
    submitSelectedUsers() {
      this.$refs.dialog.hide();
      this.$emit('submitSelectedUsers', this.selectedUsers);
    },
    toggleUserSelection(user) {
      const index = this.selectedUsers.findIndex(selectedUser => selectedUser.id === user.id);

      if (index === -1) {
        this.selectedUsers.push(user);
      } else {
        this.selectedUsers.splice(index, 1);
      }
    },
    isSelected(user) {
      return this.selectedUsers.some(selectedUser => selectedUser.id === user.id);
    },
    isExistingCollaborator(user) {
      return this.existingCollaborators.some(collaborator => collaborator.id === user.id);
    }
  },
};
</script>