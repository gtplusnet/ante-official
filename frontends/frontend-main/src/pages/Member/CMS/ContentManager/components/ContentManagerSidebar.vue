<template>
  <div class="content-types-sidebar">
    <!-- Search -->
    <div class="sidebar-search">
      <q-input
        v-model="searchQuery"
        placeholder="Search content types"
        filled
        dense
        class="search-input md3-search"
      >
        <template v-slot:prepend>
          <q-icon name="o_search" size="20px" />
        </template>
      </q-input>
    </div>

    <!-- Content -->
    <div class="sidebar-sections">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state q-pa-md text-center">
        <q-spinner color="primary" size="2em" class="q-mb-sm" />
        <div class="text-caption text-grey-7">Loading content types...</div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-state q-pa-md text-center">
        <q-icon name="error" size="2em" color="negative" class="q-mb-sm" />
        <div class="text-caption text-grey-7">{{ error }}</div>
      </div>
      
      <!-- Content Type Sections -->
      <template v-else>
        <!-- Collection Types -->
        <q-expansion-item
          v-model="expandedSections.collection"
          icon="o_folder"
          label="COLLECTION TYPES"
          header-class="section-header"
          expand-icon="o_expand_more"
        >
          <template v-slot:header>
            <q-item-section avatar>
              <q-icon name="o_folder" />
            </q-item-section>
            <q-item-section>
              <span class="section-title">COLLECTION TYPES</span>
            </q-item-section>
          </template>
          
          <q-list dense class="content-type-list">
            <q-item
              v-for="item in filteredCollectionTypes"
              :key="item.id"
              clickable
              :active="activeContentType === item.id"
              @click="selectContentType(item)"
              active-class="active-content-type"
              class="content-type-item"
            >
              <q-item-section>
                <q-item-label>
                  {{ item.displayName || item.name }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>

        <!-- Single Types -->
        <q-expansion-item
          v-model="expandedSections.single"
          icon="o_description"
          label="SINGLE TYPES"
          header-class="section-header"
          expand-icon="o_expand_more"
        >
          <template v-slot:header>
            <q-item-section avatar>
              <q-icon name="o_description" />
            </q-item-section>
            <q-item-section>
              <span class="section-title">SINGLE TYPES</span>
            </q-item-section>
          </template>
          
          <q-list dense class="content-type-list">
            <q-item
              v-for="item in filteredSingleTypes"
              :key="item.id"
              clickable
              :active="activeContentType === item.id"
              @click="selectContentType(item)"
              active-class="active-content-type"
              class="content-type-item"
            >
              <q-item-section>
                <q-item-label>
                  /{{ item.singularName || item.displayName || item.name }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from 'vue';
import type { ContentType } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'ContentManagerSidebar',
  props: {
    collectionTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    singleTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    activeContentType: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: undefined
    }
  },
  emits: ['select-content-type', 'refresh'],
  setup(props, { emit }) {
    // State
    const searchQuery = ref('');
    const expandedSections = ref({
      collection: true,
      single: true
    });
    
    // Filter by search query
    const filterBySearch = (types: ContentType[]) => {
      if (!searchQuery.value) return types;
      return types.filter(ct =>
        (ct.displayName || ct.name).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    };

    // Filter out archived items (those with deletedAt field)
    const activeCollectionTypes = computed(() => 
      props.collectionTypes.filter(ct => !ct.deletedAt)
    );
    
    const activeSingleTypes = computed(() => 
      props.singleTypes.filter(ct => !ct.deletedAt)
    );

    // Computed
    const filteredCollectionTypes = computed(() => 
      filterBySearch(activeCollectionTypes.value)
    );

    const filteredSingleTypes = computed(() => 
      filterBySearch(activeSingleTypes.value)
    );

    const selectContentType = (contentType: ContentType) => {
      console.log('[ContentManagerSidebar] Selecting content type:', contentType.name);
      emit('select-content-type', contentType.id);
    };
    
    return {
      searchQuery,
      expandedSections,
      filteredCollectionTypes,
      filteredSingleTypes,
      selectContentType
    };
  }
});
</script>

<style scoped lang="scss">
.content-types-sidebar {
  width: 280px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.04);

  .sidebar-search {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;

    .search-input.md3-search {
      :deep(.q-field__control) {
        background: #f0f4f8;
        border-radius: 28px;
        height: 40px;
        padding: 0 12px;
        
        &:before {
          border: none;
        }
        
        &:after {
          height: 1px;
          background: transparent;
        }
        
        input {
          color: #1a1a1a;
          font-size: 14px;
          
          &::placeholder {
            color: #5f6368;
          }
        }
      }
      
      :deep(.q-field--filled.q-field--focused .q-field__control) {
        background: #e8f0fe;
        
        &:after {
          height: 2px;
          background: #1976d2;
        }
      }

      :deep(.q-field__prepend) {
        color: #5f6368;
        padding-right: 8px;
      }
      
      :deep(.q-field__append) {
        color: #5f6368;
        padding-left: 8px;
      }
    }
  }

  .sidebar-sections {
    flex: 1;
    overflow-y: auto;
  }
}

:deep(.q-expansion-item) {
  .section-header {
    background: transparent;
    color: #5f6368;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 8px 16px;
    min-height: 40px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(25, 118, 210, 0.04);
      border-radius: 8px;
    }
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .q-item__section--avatar {
    min-width: 24px;
    padding-right: 8px;
    
    .q-icon {
      font-size: 18px;
      color: #757575;
    }
  }

  .q-expansion-item__content {
    background: #fafafa;
  }
}

.content-type-list {
  padding: 0;

  :deep(.q-item) {
    color: #616161;
    padding: 8px 16px 8px 40px;
    min-height: 36px;
    font-size: 14px;
    transition: all 0.2s;
    position: relative;

    &:hover {
      background: #f5f5f5;
      color: #1a1a1a;
      border-radius: 8px;
      margin: 0 4px;
    }

    &.active-content-type {
      background: #e8f0fe;
      color: #1976d2;
      font-weight: 500;
      border-radius: 8px;
      margin: 0 4px;
      position: relative;
      
      &:before {
        content: '';
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: #1976d2;
        border-radius: 3px;
      }
    }
  }
}
</style>