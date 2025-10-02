<template>
  <div class="content-types-sidebar">
    <!-- Search -->
    <ContentTypeSearch v-model="searchQuery" />

    <!-- View Mode Tabs -->
    <div class="view-tabs-wrapper">
      <q-tabs
        v-model="viewMode"
        class="content-type-tabs"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        dense
        no-caps
      >
        <q-tab
          name="active"
          label="Active"
          icon="o_folder_open"
          class="view-tab"
        />
        <q-tab
          name="archived"
          label="Archived"
          icon="o_archive"
          class="view-tab"
        />
      </q-tabs>
    </div>

    <!-- Tab Panels -->
    <q-tab-panels v-model="viewMode" animated class="sidebar-sections">
      <!-- Active Content Types Tab -->
      <q-tab-panel name="active" class="q-pa-none">
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
        
        <!-- Active Content Type Sections -->
        <template v-else>
          <!-- Active Collection Types -->
          <ContentTypeSection
            v-model="expandedSections.collection"
            title="COLLECTION TYPES"
            icon="o_folder"
            :items="activeFilteredCollectionTypes"
            :active-id="activeContentType"
            tooltip-text="collection type"
            view-mode="active"
            @select="selectContentType"
            @create="$emit('create-content-type', 'collection')"
            @edit-item="$emit('edit-content-type', $event)"
            @delete-item="$emit('delete-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />

          <!-- Active Single Types -->
          <ContentTypeSection
            v-model="expandedSections.single"
            title="SINGLE TYPES"
            icon="o_description"
            :items="activeFilteredSingleTypes"
            :active-id="activeContentType"
            tooltip-text="single type"
            item-prefix="/"
            view-mode="active"
            @select="selectContentType"
            @create="$emit('create-content-type', 'single')"
            @edit-item="$emit('edit-content-type', $event)"
            @delete-item="$emit('delete-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />

          <!-- Active Components -->
          <ContentTypeSection
            v-model="expandedSections.components"
            title="COMPONENTS"
            icon="o_widgets"
            :items="activeFilteredComponents"
            :active-id="activeContentType"
            tooltip-text="component"
            view-mode="active"
            @select="selectContentType"
            @create="$emit('create-content-type', 'component')"
            @edit-item="$emit('edit-content-type', $event)"
            @delete-item="$emit('delete-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />
        </template>
      </q-tab-panel>

      <!-- Archived Content Types Tab -->
      <q-tab-panel name="archived" class="q-pa-none">
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
        
        <!-- Archived Content Type Sections -->
        <template v-else>
          <!-- Archived Collection Types -->
          <ContentTypeSection
            v-model="expandedSections.collection"
            title="COLLECTION TYPES"
            icon="o_folder"
            :items="archivedFilteredCollectionTypes"
            :active-id="activeContentType"
            tooltip-text="collection type"
            view-mode="archived"
            @select="selectContentType"
            @edit-item="$emit('edit-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />

          <!-- Archived Single Types -->
          <ContentTypeSection
            v-model="expandedSections.single"
            title="SINGLE TYPES"
            icon="o_description"
            :items="archivedFilteredSingleTypes"
            :active-id="activeContentType"
            tooltip-text="single type"
            item-prefix="/"
            view-mode="archived"
            @select="selectContentType"
            @edit-item="$emit('edit-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />

          <!-- Archived Components -->
          <ContentTypeSection
            v-model="expandedSections.components"
            title="COMPONENTS"
            icon="o_widgets"
            :items="archivedFilteredComponents"
            :active-id="activeContentType"
            tooltip-text="component"
            view-mode="archived"
            @select="selectContentType"
            @edit-item="$emit('edit-content-type', $event)"
            @restore-item="$emit('restore-content-type', $event)"
          />
        </template>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import type { ContentType } from '@components/shared/cms/types/content-type';
import ContentTypeSearch from './ContentTypeSearch.vue';
import ContentTypeSection from './ContentTypeSection.vue';

export default defineComponent({
  name: 'ContentTypeSidebar',
  components: {
    ContentTypeSearch,
    ContentTypeSection
  },
  props: {
    collectionTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    singleTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    components: {
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
    },
    showArchived: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select-content-type', 'create-content-type', 'edit-content-type', 'delete-content-type', 'restore-content-type'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const viewMode = ref<'active' | 'archived'>('active');
    
    const expandedSections = ref({
      collection: true,
      single: false,
      components: false,
    });

    // Filter by search query
    const filterBySearch = (types: ContentType[]) => {
      if (!searchQuery.value) return types;
      return types.filter(ct =>
        ct.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (ct.displayName && ct.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()))
      );
    };

    // Filter active items (not archived)
    const filterActiveItems = (types: ContentType[]) => {
      return types.filter(ct => !ct.deletedAt);
    };

    // Filter archived items
    const filterArchivedItems = (types: ContentType[]) => {
      return types.filter(ct => ct.deletedAt);
    };

    // Active filtered content types
    const activeFilteredCollectionTypes = computed(() => 
      filterBySearch(filterActiveItems(props.collectionTypes))
    );

    const activeFilteredSingleTypes = computed(() => 
      filterBySearch(filterActiveItems(props.singleTypes))
    );

    const activeFilteredComponents = computed(() => 
      filterBySearch(filterActiveItems(props.components))
    );

    // Archived filtered content types
    const archivedFilteredCollectionTypes = computed(() => 
      filterBySearch(filterArchivedItems(props.collectionTypes))
    );

    const archivedFilteredSingleTypes = computed(() => 
      filterBySearch(filterArchivedItems(props.singleTypes))
    );

    const archivedFilteredComponents = computed(() => 
      filterBySearch(filterArchivedItems(props.components))
    );

    const selectContentType = (id: string) => {
      emit('select-content-type', id);
    };

    return {
      searchQuery,
      viewMode,
      expandedSections,
      activeFilteredCollectionTypes,
      activeFilteredSingleTypes,
      activeFilteredComponents,
      archivedFilteredCollectionTypes,
      archivedFilteredSingleTypes,
      archivedFilteredComponents,
      selectContentType
    };
  },
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

  .view-tabs-wrapper {
    border-bottom: 1px solid #e0e0e0;
    background: #f9f9f9;
    
    .content-type-tabs {
      :deep(.q-tabs__content) {
        background: transparent;
        min-height: 24px;
        padding-bottom: 0 !important;
      }
      
      :deep(.q-tab) {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.02em;
        padding: 4px 8px;
        min-height: 24px;
        color: #666;
        flex-direction: row !important;
        
        .q-tab__content {
          flex-direction: row !important;
          align-items: center;
          gap: 4px;
        }
        
        .q-icon {
          font-size: 13px;
          margin: 0 !important;
        }
        
        .q-tab__label {
          font-size: 11px;
          line-height: 1;
        }
        
        &.q-tab--active {
          color: #1976d2;
          font-weight: 600;
        }
        
        &:hover:not(.q-tab--active) {
          color: #333;
          background: rgba(25, 118, 210, 0.04);
        }
      }
      
      :deep(.q-tabs__indicator) {
        height: 2px;
        background: #1976d2;
        bottom: 0 !important;
      }
    }
  }

  .sidebar-sections {
    flex: 1;
    overflow-y: auto;
  }
}</style>
