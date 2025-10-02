<template>
  <div class="content-list">
    <!-- Header -->
    <div class="content-header">
      <div class="header-info">
        <h5 class="q-ma-none">{{ contentType?.displayName || contentType?.name || 'Content Type' }}</h5>
        <div class="text-caption text-grey-6">
          {{ pagination.total || 0 }} 
          {{ pagination.total === 1 ? 'entry' : 'entries' }}
        </div>
      </div>
      
      <div class="header-actions">
        <q-input
          v-model="searchQuery"
          placeholder="Search entries..."
          outlined
          dense
          clearable
          style="min-width: 250px"
          @input="debouncedSearch"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          label="Status"
          outlined
          dense
          clearable
          emit-value
          map-options
          style="min-width: 120px"
          @update:model-value="handleFilterChange"
        />
        
        <q-btn
          color="primary"
          icon="add"
          label="Add Entry"
          unelevated
          @click="$emit('create-entry')"
        />
      </div>
    </div>
    
    
    <!-- Content Table -->
    <div class="table-container">
      <q-table
        :rows="entries"
        :columns="tableColumns"
        :loading="loading"
        :pagination="tablePagination"
        selection="none"
        row-key="id"
        flat
        class="content-table"
        @request="onRequest"
      >
        <!-- Primary Field Column -->
        <template v-slot:body-cell-primaryField="props">
          <q-td :props="props" class="primary-field-cell">
            <div class="primary-field-content">
              <!-- Media Field Display -->
              <div v-if="isMediaField() && getPrimaryFieldMediaValue(props.row)" class="media-display">
                <!-- Image Thumbnail -->
                <div v-if="isImageMedia(getPrimaryFieldMediaValue(props.row))" class="image-thumbnail">
                  <img 
                    :src="getMediaThumbnailUrl(getPrimaryFieldMediaValue(props.row))" 
                    :alt="getPrimaryFieldMediaValue(props.row).name || 'Media'"
                    class="thumbnail-image"
                  />
                </div>
                <!-- Non-image Media -->
                <div v-else class="file-thumbnail">
                  <q-icon :name="getMediaIcon(getPrimaryFieldMediaValue(props.row))" size="24px" />
                </div>
                <!-- Media Name -->
                <div class="media-info">
                  <div class="media-name">{{ getPrimaryFieldMediaValue(props.row).name || 'Untitled Media' }}</div>
                </div>
              </div>
              <!-- Regular Field Display -->
              <div v-else class="field-value">{{ getPrimaryFieldValue(props.row) }}</div>
            </div>
          </q-td>
        </template>

        <!-- Status Column -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="status-cell">
            <q-badge
              :color="getStatusColor(props.value)"
              :label="props.value.charAt(0).toUpperCase() + props.value.slice(1)"
              rounded
            />
          </q-td>
        </template>

        <!-- Published Date Column -->
        <template v-slot:body-cell-publishedAt="props">
          <q-td :props="props" class="date-cell">
            <div v-if="props.value" class="date-value">
              {{ formatPublishDate(props.value) }}
            </div>
            <div v-else class="text-grey-5">
              Not published
            </div>
          </q-td>
        </template>

        <!-- Actions Column -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="actions-cell">
            <div class="actions-container">
              <!-- Primary Action -->
              <q-btn
                flat
                dense
                round
                size="md"
                icon="edit"
                class="action-btn primary-action"
                @click="$emit('edit-entry', props.row)"
              >
                <q-tooltip class="bg-grey-9" :offset="[10, 10]">
                  Edit entry
                </q-tooltip>
              </q-btn>

              <!-- Secondary Action (Status dependent) -->
              <q-btn
                v-if="props.row.status === 'draft'"
                flat
                dense
                round
                size="md"
                icon="publish"
                class="action-btn secondary-action"
                @click="$emit('publish-entry', props.row)"
              >
                <q-tooltip class="bg-grey-9" :offset="[10, 10]">
                  Publish entry
                </q-tooltip>
              </q-btn>

              <q-btn
                v-else-if="props.row.status === 'published'"
                flat
                dense
                round
                size="md"
                icon="unpublished"
                class="action-btn secondary-action"
                @click="$emit('unpublish-entry', props.row)"
              >
                <q-tooltip class="bg-grey-9" :offset="[10, 10]">
                  Unpublish entry
                </q-tooltip>
              </q-btn>

              <!-- More Actions Menu -->
              <q-btn
                flat
                dense
                round
                size="md"
                icon="more_vert"
                class="action-btn more-action"
              >
                <q-tooltip class="bg-grey-9" :offset="[10, 10]">
                  More actions
                </q-tooltip>
                
                <q-menu
                  anchor="bottom right"
                  self="top right"
                  :offset="[0, 8]"
                  class="actions-menu"
                >
                  <q-list class="menu-list">
                    <q-item 
                      clickable 
                      v-ripple 
                      class="menu-item"
                      @click="$emit('edit-entry', props.row)"
                    >
                      <q-item-section avatar class="menu-icon">
                        <q-icon name="edit" size="20px" />
                      </q-item-section>
                      <q-item-section class="menu-label">
                        <q-item-label>Edit</q-item-label>
                        <q-item-label caption>Modify entry content</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item 
                      clickable 
                      v-ripple 
                      class="menu-item"
                      @click="duplicateEntry(props.row)"
                    >
                      <q-item-section avatar class="menu-icon">
                        <q-icon name="content_copy" size="20px" />
                      </q-item-section>
                      <q-item-section class="menu-label">
                        <q-item-label>Duplicate</q-item-label>
                        <q-item-label caption>Create a copy</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-separator spaced />

                    <q-item 
                      clickable 
                      v-ripple 
                      class="menu-item danger-item"
                      @click="$emit('delete-entry', props.row)"
                    >
                      <q-item-section avatar class="menu-icon">
                        <q-icon name="delete" size="20px" />
                      </q-item-section>
                      <q-item-section class="menu-label">
                        <q-item-label>Delete</q-item-label>
                        <q-item-label caption>Remove permanently</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-td>
        </template>
        
        <!-- Empty state -->
        <template v-slot:no-data>
          <div class="empty-state">
            <q-icon name="o_article" size="48px" color="grey-4" />
            <div class="empty-title">No entries found</div>
            <div class="empty-subtitle">
              {{ searchQuery ? 'Try adjusting your search criteria' : 'Create your first entry to get started' }}
            </div>
            <q-btn
              v-if="!searchQuery"
              color="primary"
              icon="add"
              label="Create Entry"
              unelevated
              class="q-mt-md"
              @click="$emit('create-entry')"
            />
          </div>
        </template>
      </q-table>
    </div>
    
    <!-- Pagination -->
    <div class="pagination-container">
      <div class="pagination-info">
        Showing {{ getDisplayRange() }} entries
      </div>
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="6"
        boundary-numbers
        @update:model-value="onPageChange"
      />
      <div class="items-per-page">
        <q-select
          v-model="itemsPerPage"
          :options="[10, 20, 50]"
          label="Items per page"
          dense
          outlined
          style="min-width: 120px"
          @update:model-value="onItemsPerPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, watch } from 'vue';
import type { ContentType, Field } from '@components/shared/cms/types/content-type';
import type { ContentEntry } from 'src/services/cms-content.service';

interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  style?: string;
  headerStyle?: string;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export default defineComponent({
  name: 'ContentList',
  props: {
    contentType: {
      type: Object as PropType<ContentType>,
      required: true
    },
    entries: {
      type: Array as PropType<ContentEntry[]>,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Object,
      default: () => ({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      })
    }
  },
  emits: [
    'create-entry',
    'edit-entry', 
    'delete-entry',
    'publish-entry',
    'unpublish-entry',
    'page-change',
    'search',
    'filter-change',
    'bulk-action'
  ],
  setup(props, { emit }) {
    // State
    const searchQuery = ref('');
    const statusFilter = ref<string | null>(null);
    
    // Debug logging for props
    console.log('[ContentList] Component initialized with props:', {
      contentType: props.contentType ? { id: props.contentType.id, name: props.contentType.name } : null,
      entriesLength: props.entries.length,
      entries: props.entries,
      loading: props.loading,
      pagination: props.pagination
    });
    
    // Watch entries prop to track changes
    watch(() => props.entries, (newEntries, oldEntries) => {
      console.log('[ContentList] entries prop changed:', {
        oldLength: oldEntries?.length || 0,
        newLength: newEntries?.length || 0,
        newEntries: newEntries,
        loading: props.loading,
        contentType: props.contentType?.name || 'none'
      });
    }, { deep: true });
    
    // Watch loading prop
    watch(() => props.loading, (newLoading, oldLoading) => {
      console.log('[ContentList] loading prop changed:', {
        from: oldLoading,
        to: newLoading,
        entriesLength: props.entries.length
      });
    });
    
    // Watch pagination prop
    watch(() => props.pagination, (newPagination) => {
      console.log('[ContentList] pagination prop changed:', newPagination);
    }, { deep: true });
    
    // Options
    const statusOptions = [
      { label: 'All', value: null },
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
      { label: 'Archived', value: 'archived' }
    ];
    
    // Smart primary field selection logic
    const getPrimaryField = (): Field | null => {
      const fields = props.contentType?.fields;
      if (!fields || fields.length === 0) return null;
      
      // Priority order for primary field selection
      const priorityNames = ['title', 'name', 'label', 'displayName', 'heading', 'subject'];
      
      // Try priority names first
      for (const name of priorityNames) {
        const field = fields.find(f => f.name === name);
        if (field) return field;
      }
      
      // Fallback to first text/string field that's displayable
      const fallbackField = fields.find(f => 
        ['text', 'uid', 'email'].includes(f.type) && 
        f.type !== 'richtext' && 
        f.type !== 'json'
      );
      
      // Final fallback to first field
      return fallbackField || fields[0] || null;
    };

    const getPrimaryFieldLabel = (): string => {
      const field = getPrimaryField();
      return field?.displayName || field?.name || 'Entry';
    };

    const getPrimaryFieldValue = (entry: ContentEntry): string => {
      const field = getPrimaryField();
      if (!field) return `Entry ${entry.id}`;
      
      const value = entry.data[field.name];
      if (!value) return `Entry ${entry.id}`;
      
      // Format value based on field type
      switch (field.type) {
        case 'boolean':
          return value ? 'Yes' : 'No';
        case 'number':
          return String(value);
        case 'datetime':
          return value ? new Date(value).toLocaleDateString() : '';
        case 'media':
          // For media fields, return the media name or a fallback
          if (typeof value === 'object' && value.name) {
            return value.name;
          } else if (typeof value === 'object') {
            return 'Media File';
          }
          return String(value).slice(0, 50);
        default:
          return String(value).slice(0, 50); // Limit length
      }
    };

    // Media field helper functions
    const isMediaField = (): boolean => {
      const field = getPrimaryField();
      return field?.type === 'media';
    };

    const getPrimaryFieldMediaValue = (entry: ContentEntry): any => {
      const field = getPrimaryField();
      if (!field || field.type !== 'media') return null;
      
      const value = entry.data[field.name];
      return value || null;
    };

    const isImageMedia = (media: any): boolean => {
      if (!media || typeof media !== 'object') return false;
      
      const type = (media.type || media.mimetype || '').toLowerCase();
      return type.includes('image') || type.startsWith('image/');
    };

    const getMediaThumbnailUrl = (media: any): string => {
      if (!media || typeof media !== 'object') return '';
      return media.url || '';
    };

    const getMediaIcon = (media: any): string => {
      if (!media || typeof media !== 'object') return 'o_insert_drive_file';
      
      const type = (media.type || media.mimetype || '').toLowerCase();
      
      if (type.includes('image') || type.startsWith('image/')) return 'o_image';
      if (type.includes('video') || type.startsWith('video/')) return 'o_movie';
      if (type.includes('audio') || type.startsWith('audio/')) return 'o_audiotrack';
      if (type.includes('pdf') || type.includes('document')) return 'o_description';
      
      return 'o_insert_drive_file';
    };

    // Simplified table columns - exactly 4 columns
    const tableColumns = computed((): TableColumn[] => [
      {
        name: 'primaryField',
        label: getPrimaryFieldLabel(),
        field: 'primaryField',
        align: 'left',
        sortable: true
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center',
        sortable: true
      },
      {
        name: 'publishedAt',
        label: 'Published',
        field: 'publishedAt',
        align: 'center',
        sortable: true
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center'
      }
    ]);
    
    // Pagination state and computed
    const currentPage = ref(props.pagination.page || 1);
    const itemsPerPage = ref(props.pagination.limit || 10);
    
    const totalPages = computed(() => 
      Math.ceil((props.pagination.total || 0) / itemsPerPage.value)
    );

    const tablePagination = computed(() => ({
      page: currentPage.value,
      rowsPerPage: itemsPerPage.value,
      rowsNumber: props.pagination.total || 0
    }));

    // Pagination methods
    const getDisplayRange = (): string => {
      const total = props.pagination.total || 0;
      if (total === 0) return '0 of 0';
      
      const start = (currentPage.value - 1) * itemsPerPage.value + 1;
      const end = Math.min(currentPage.value * itemsPerPage.value, total);
      
      return `${start}-${end} of ${total}`;
    };

    const onPageChange = (page: number) => {
      currentPage.value = page;
      emit('page-change', page);
    };

    const onItemsPerPageChange = (newLimit: number) => {
      itemsPerPage.value = newLimit;
      currentPage.value = 1; // Reset to first page
      emit('page-change', 1);
    };
    
    // Simple methods
    const debouncedSearch = debounce(() => {
      emit('search', searchQuery.value);
    }, 500);
    
    const handleFilterChange = () => {
      emit('filter-change', {
        status: statusFilter.value
      });
    };
    
    const onRequest = (props: any) => {
      emit('page-change', props.pagination.page);
    };
    
    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'published': return 'positive';
        case 'draft': return 'warning';
        case 'archived': return 'grey';
        default: return 'grey';
      }
    };
    
    const formatPublishDate = (date: string | Date): string => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    };
    
    // Action methods
    const duplicateEntry = (entry: ContentEntry) => {
      // TODO: Implement duplicate functionality
      console.log('Duplicate entry:', entry);
      // For now, emit edit with copy data
      const duplicatedData = {
        ...entry,
        id: undefined, // Remove ID to create new entry
        data: {
          ...entry.data,
          title: entry.data.title ? `${entry.data.title} (Copy)` : undefined
        },
        status: 'draft' // Always start as draft
      };
      emit('edit-entry', duplicatedData);
    };
    
    return {
      // State
      searchQuery,
      statusFilter,
      currentPage,
      itemsPerPage,
      totalPages,
      
      // Options
      statusOptions,
      
      // Computed
      tableColumns,
      tablePagination,
      
      // Primary field methods
      getPrimaryField,
      getPrimaryFieldLabel,
      getPrimaryFieldValue,
      
      // Media field methods
      isMediaField,
      getPrimaryFieldMediaValue,
      isImageMedia,
      getMediaThumbnailUrl,
      getMediaIcon,
      
      // Formatting methods
      getStatusColor,
      formatPublishDate,
      
      // Pagination methods
      getDisplayRange,
      onPageChange,
      onItemsPerPageChange,
      onRequest,
      
      // Event handlers
      debouncedSearch,
      handleFilterChange,
      
      // Action methods
      duplicateEntry
    };
  }
});
</script>

<style scoped lang="scss">
// Material Design 3 Color Tokens
$md-sys-color-surface: #fefbff;
$md-sys-color-surface-container-lowest: #ffffff;
$md-sys-color-surface-container-low: #f8f8ff;
$md-sys-color-surface-container: #f2f2f9;
$md-sys-color-surface-container-high: #ececf4;
$md-sys-color-surface-container-highest: #e6e6ee;

$md-sys-color-primary: #6750a4;
$md-sys-color-primary-container: #eaddff;
$md-sys-color-on-primary: #ffffff;
$md-sys-color-on-primary-container: #21005d;

$md-sys-color-secondary: #625b71;
$md-sys-color-secondary-container: #e8def8;
$md-sys-color-on-secondary: #ffffff;
$md-sys-color-on-secondary-container: #1d192b;

$md-sys-color-tertiary: #7d5260;
$md-sys-color-tertiary-container: #ffd8e4;
$md-sys-color-on-tertiary: #ffffff;
$md-sys-color-on-tertiary-container: #31111d;

$md-sys-color-error: #ba1a1a;
$md-sys-color-error-container: #ffdad6;
$md-sys-color-on-error: #ffffff;
$md-sys-color-on-error-container: #410002;

$md-sys-color-outline: #79747e;
$md-sys-color-outline-variant: #cac4d0;

$md-sys-color-on-surface: #1c1b1f;
$md-sys-color-on-surface-variant: #49454f;

// Flat Material Design - Minimal Elevation
@mixin flat-elevation {
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
}

@mixin flat-elevation-hover {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.12);
}

// Material Design 3 Typography Tokens
@mixin md-typescale-headline-small {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  letter-spacing: 0;
}

// Flat Material Design Typography - Lighter weights, smaller sizes
@mixin flat-title-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 22px;
  letter-spacing: 0;
}

@mixin flat-title-medium {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.1px;
}

@mixin flat-label-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.05px;
}

@mixin flat-body-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 300;
  line-height: 16px;
  letter-spacing: 0.15px;
}

@mixin flat-body-medium {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 300;
  line-height: 15px;
  letter-spacing: 0.1px;
}

@mixin flat-body-small {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 300;
  line-height: 12px;
  letter-spacing: 0.15px;
}

.content-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $md-sys-color-surface;
  
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    background: $md-sys-color-surface-container-lowest;
    border-bottom: 1px solid $md-sys-color-outline-variant;
    
    .header-info {
      flex: 1;
      
      h5 {
        @include flat-title-large;
        color: $md-sys-color-on-surface;
        margin-bottom: 4px;
      }
      
      .text-caption {
        @include flat-body-medium;
        color: $md-sys-color-on-surface-variant;
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .table-container {
    flex: 1;
    background: $md-sys-color-surface-container-lowest;
    border-radius: 8px;
    overflow: hidden;
    @include flat-elevation;
    margin: 16px 24px;
    display: flex;
    flex-direction: column;
    
    .content-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      :deep(.q-table__container) {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .q-table {
          border-collapse: separate;
          border-spacing: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        // Center the no-data section
        .q-table__middle {
          min-height: calc(100vh - 400px); // Adjust based on header/footer heights
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        // Table headers - Flat Design
        thead th {
          background: $md-sys-color-surface-container;
          color: $md-sys-color-on-surface-variant;
          @include flat-label-large;
          text-transform: none;
          letter-spacing: 0.05px;
          padding: 12px 16px;
          border-bottom: 1px solid $md-sys-color-outline-variant;
          position: sticky;
          top: 0;
          z-index: 1;
          
          &:first-child {
            border-top-left-radius: 8px;
          }
          
          &:last-child {
            border-top-right-radius: 8px;
          }
        }
        
        // Table rows - Material Design 3 State Layers
        tbody tr {
          background: $md-sys-color-surface-container-lowest;
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
            @include flat-elevation-hover;
          }
          
          &:not(:last-child) {
            border-bottom: 1px solid $md-sys-color-outline-variant;
          }
        }
        
        // Table cells
        tbody td {
          padding: 14px 16px;
          @include flat-body-large;
          color: $md-sys-color-on-surface;
          vertical-align: middle;
        }
      }
      
      // Primary field cell
      .primary-field-cell {
        .primary-field-content {
          .field-value {
            @include flat-body-large;
            font-weight: 400;
            color: $md-sys-color-on-surface;
            margin-bottom: 2px;
            line-height: 1.3;
          }
          
          .field-meta {
            @include flat-body-small;
            color: $md-sys-color-on-surface-variant;
          }
          
          .media-display {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .image-thumbnail {
              .thumbnail-image {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid $md-sys-color-outline-variant;
                background: $md-sys-color-surface-container-highest;
              }
            }
            
            .file-thumbnail {
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: $md-sys-color-surface-container-high;
              border-radius: 8px;
              border: 1px solid $md-sys-color-outline-variant;
              
              .q-icon {
                color: $md-sys-color-on-surface-variant;
              }
            }
            
            .media-info {
              flex: 1;
              min-width: 0;
              
              .media-name {
                @include flat-body-large;
                font-weight: 400;
                color: $md-sys-color-on-surface;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }
          }
        }
      }
      
      // Status cell
      .status-cell {
        text-align: center;
        
        .q-badge {
          @include flat-label-large;
          padding: 4px 8px;
          border-radius: 6px;
          
          &.bg-positive {
            background: rgba($md-sys-color-tertiary, 0.12) !important;
            color: $md-sys-color-on-tertiary-container;
          }
          
          &.bg-warning {
            background: rgba(#f59e0b, 0.12) !important;
            color: #92400e;
          }
          
          &.bg-grey {
            background: rgba($md-sys-color-outline, 0.12) !important;
            color: $md-sys-color-on-surface-variant;
          }
        }
      }
      
      // Date cell
      .date-cell {
        text-align: center;
        
        .date-value {
          @include flat-body-medium;
          color: $md-sys-color-on-surface;
        }
      }
      
      // Actions cell - Material Design 3 Action Buttons
      .actions-cell {
        .actions-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          
          .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            
            .q-btn__content .q-icon {
              font-size: 20px;
            }
            
            &.primary-action {
              color: $md-sys-color-primary;
              
              &:hover {
                background: rgba($md-sys-color-primary, 0.04);
                @include flat-elevation-hover;
              }
            }
            
            &.secondary-action {
              color: $md-sys-color-secondary;
              
              &:hover {
                background: rgba($md-sys-color-secondary, 0.04);
                @include flat-elevation-hover;
              }
            }
            
            &.more-action {
              color: $md-sys-color-on-surface-variant;
              
              &:hover {
                background: rgba($md-sys-color-on-surface, 0.04);
                @include flat-elevation-hover;
              }
            }
          }
        }
      }
    }
    
    // Empty state
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120px 24px;
      text-align: center;
      min-height: 500px;
      width: 100%;
      
      .empty-title {
        @include flat-title-medium;
        color: $md-sys-color-on-surface;
        margin: 16px 0 8px;
      }
      
      .empty-subtitle {
        @include flat-body-medium;
        color: $md-sys-color-on-surface-variant;
        margin-bottom: 24px;
        line-height: 1.5;
        max-width: 400px;
      }
    }
  }
  
  // Actions Menu - Flat Design Menu
  :deep(.actions-menu) {
    @include flat-elevation;
    border-radius: 8px;
    background: $md-sys-color-surface-container;
    border: 1px solid $md-sys-color-outline-variant;
    padding: 6px;
    min-width: 200px;
    
    .menu-list {
      .menu-item {
        border-radius: 6px;
        padding: 10px 14px;
        margin-bottom: 2px;
        transition: all 0.15s ease;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        &:hover {
          background: rgba($md-sys-color-on-surface, 0.04);
        }
        
        &.danger-item {
          &:hover {
            background: rgba($md-sys-color-error, 0.04);
          }
          
          .menu-icon .q-icon,
          .menu-label .q-item-label {
            color: $md-sys-color-error;
          }
        }
        
        .menu-icon {
          min-width: 40px;
          
          .q-icon {
            color: $md-sys-color-on-surface-variant;
          }
        }
        
        .menu-label {
          .q-item-label {
            @include flat-body-large;
            color: $md-sys-color-on-surface;
            margin-bottom: 1px;
          }
          
          .q-item-label--caption {
            @include flat-body-small;
            color: $md-sys-color-on-surface-variant;
          }
        }
      }
      
      .q-separator {
        background: $md-sys-color-outline-variant;
        margin: 8px 0;
      }
    }
  }
  
  .pagination-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: $md-sys-color-surface-container-lowest;
    border-top: 1px solid $md-sys-color-outline-variant;
    gap: 20px;
    
    .pagination-info {
      @include flat-body-medium;
      color: $md-sys-color-on-surface-variant;
      flex-shrink: 0;
    }
    
    .q-pagination {
      flex: 1;
      justify-content: center;
      
      :deep(.q-btn) {
        min-width: 36px;
        height: 36px;
        border-radius: 6px;
        @include flat-label-large;
        
        &.q-btn--flat {
          color: $md-sys-color-on-surface-variant;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
          }
        }
        
        &.q-btn--active {
          background: $md-sys-color-primary;
          color: $md-sys-color-on-primary;
          
          &:hover {
            background: $md-sys-color-primary;
            @include flat-elevation-hover;
          }
        }
      }
    }
    
    .items-per-page {
      flex-shrink: 0;
      
      .q-field {
        @include flat-body-medium;
        
        :deep(.q-field__control) {
          border-radius: 6px;
        }
      }
    }
  }
  
  // Responsive design
  @media (max-width: 768px) {
    .content-header {
      padding: 20px;
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      
      .header-actions {
        gap: 8px;
      }
    }
    
    .table-container {
      margin: 12px;
      
      .content-table {
        :deep(.q-table__container) {
          thead th,
          tbody td {
            padding: 16px 20px;
          }
        }
        
        .actions-cell {
          .actions-container {
            gap: 2px;
            
            .action-btn {
              width: 36px;
              height: 36px;
              
              .q-btn__content .q-icon {
                font-size: 18px;
              }
            }
          }
        }
      }
    }
    
    .pagination-container {
      padding: 16px 20px;
      flex-direction: column;
      gap: 16px;
      
      .pagination-info {
        order: 2;
      }
      
      .q-pagination {
        order: 1;
      }
      
      .items-per-page {
        order: 3;
        align-self: center;
      }
    }
  }
}
</style>