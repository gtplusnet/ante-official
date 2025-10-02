import { ref, computed, Ref, onMounted } from 'vue';
import { Notify } from 'quasar';
import type { ContentType } from '@components/shared/cms/types/content-type';
import { CMSContentTypesService } from 'src/services/cms-content-types.service';

// Singleton state - shared across all component instances
const globalContentTypesState = {
  collectionTypes: ref<ContentType[]>([]),
  singleTypes: ref<ContentType[]>([]),
  components: ref<ContentType[]>([]),
  loading: ref(false),
  error: ref<string | undefined>(undefined),
  isInitialized: ref(false)
};

export function useContentTypes() {
  // Use the shared global state
  const {
    collectionTypes,
    singleTypes,
    components,
    loading,
    error,
    isInitialized
  } = globalContentTypesState;
  // Load data from API (always fetch archived data for tab filtering)
  const loadContentTypes = async () => {
    // Prevent concurrent loading calls
    if (loading.value) {
      console.log('[CMS DEBUG] Already loading content types, skipping...');
      return;
    }
    
    console.log('[CMS DEBUG] Starting to load content types...');
    loading.value = true;
    error.value = undefined;
    
    try {
      const [collections, singles, comps] = await Promise.all([
        CMSContentTypesService.getByType('collection', true),
        CMSContentTypesService.getByType('single', true),
        CMSContentTypesService.getByType('component', true)
      ]);
      
      console.log('[CMS DEBUG] API responses received:', {
        collections: collections.length,
        singles: singles.length,
        components: comps.length
      });
      console.log('[CMS DEBUG] Collection types data:', collections);
      if (collections.length > 0) {
        console.log('[CMS DEBUG] First collection type structure:', collections[0]);
        console.log('[CMS DEBUG] First collection type keys:', Object.keys(collections[0]));
        console.log('[CMS DEBUG] First collection type ID field:', collections[0].id);
        console.log('[CMS DEBUG] First collection type _id field:', (collections[0] as any)._id);
      }
      console.log('[CMS DEBUG] Single types data:', singles);
      console.log('[CMS DEBUG] Components data:', comps);
      
      collectionTypes.value = collections;
      singleTypes.value = singles;
      components.value = comps;
      isInitialized.value = true;
      
      console.log('[CMS DEBUG] Content types loaded successfully');
    } catch (err) {
      console.error('[CMS DEBUG] Failed to load content types:', err);
      error.value = 'Failed to load content types';
      
      // Show user-friendly error notification
      Notify.create({
        type: 'negative',
        message: 'Failed to load content types',
        caption: 'Please check your connection and try refreshing the page',
        position: 'top',
        timeout: 5000,
        actions: [
          {
            icon: 'refresh',
            color: 'white',
            handler: () => {
              console.log('[CMS DEBUG] Retrying to load content types...');
              loadContentTypes();
            }
          }
        ]
      });
      
      // Fallback to empty arrays on error
      collectionTypes.value = [];
      singleTypes.value = [];
      components.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Initialize data on mount - simplified logic
  onMounted(() => {
    const totalContentTypes = collectionTypes.value.length + singleTypes.value.length + components.value.length;
    console.log('[CMS DEBUG] onMounted - total content types:', totalContentTypes, 'loading:', loading.value);
    
    // Load if we have no data AND we're not currently loading
    if (totalContentTypes === 0 && !loading.value) {
      console.log('[CMS DEBUG] No content types found, loading now...');
      loadContentTypes();
    } else {
      console.log('[CMS DEBUG] Content types already available or loading in progress, skipping load');
    }
  });

  // Computed properties
  const allContentTypes = computed(() => [
    ...collectionTypes.value,
    ...singleTypes.value,
    ...components.value,
  ]);

  const availableContentTypes = computed(() => {
    return allContentTypes.value
      .filter(ct => ct.type !== 'component')
      .map(ct => ct.displayName || ct.name);
  });

  // Filter functions
  const filterContentTypes = (types: Ref<ContentType[]>, searchQuery: string) => {
    if (!searchQuery) return types.value;
    return types.value.filter(ct =>
      ct.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Content type operations
  const findContentType = (id: string) => {
    console.log('[CMS DEBUG] Finding content type with ID:', id);
    console.log('[CMS DEBUG] Available content types:', allContentTypes.value.map(ct => ({ id: ct.id, name: ct.name, type: ct.type })));
    const result = allContentTypes.value.find(ct => ct.id === id);
    console.log('[CMS DEBUG] Find result:', result ? { id: result.id, name: result.name, type: result.type } : 'NOT FOUND');
    return result;
  };

  const createContentType = async (type: 'collection' | 'single' | 'component', data: Partial<ContentType>) => {
    try {
      const createData = {
        name: data.name || data.singularName || '',
        displayName: data.displayName || '',
        type,
        singularName: data.singularName || '',
        pluralName: data.pluralName || '',
        category: data.category || '',
        description: data.description || '',
        draftPublish: data.draftPublish || false,
        internationalization: data.internationalization || false
      };

      const newContentType = await CMSContentTypesService.create(createData);
      
      // Add to local state
      switch (type) {
        case 'collection':
          collectionTypes.value.push(newContentType);
          break;
        case 'single':
          singleTypes.value.push(newContentType);
          break;
        case 'component':
          components.value.push(newContentType);
          break;
      }

      return newContentType;
    } catch (err) {
      console.error('Failed to create content type:', err);
      throw err;
    }
  };

  const updateContentType = async (id: string, updates: Partial<ContentType>) => {
    try {
      const updated = await CMSContentTypesService.update(id, updates);
      
      // Update local state
      const contentType = findContentType(id);
      if (contentType) {
        Object.assign(contentType, updated);
      }
      
      return updated;
    } catch (err) {
      console.error('Failed to update content type:', err);
      throw err;
    }
  };

  const deleteContentType = async (id: string) => {
    try {
      await CMSContentTypesService.delete(id);
      
      // Remove from local state
      let index = collectionTypes.value.findIndex(ct => ct.id === id);
      if (index > -1) {
        collectionTypes.value.splice(index, 1);
        return true;
      }
      
      index = singleTypes.value.findIndex(ct => ct.id === id);
      if (index > -1) {
        singleTypes.value.splice(index, 1);
        return true;
      }
      
      index = components.value.findIndex(ct => ct.id === id);
      if (index > -1) {
        components.value.splice(index, 1);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to delete content type:', err);
      throw err;
    }
  };

  const restoreContentType = async (id: string) => {
    try {
      const restored = await CMSContentTypesService.restore(id);
      
      // If we're showing archived, replace the item in local state
      // Otherwise, add it to the appropriate list
      const updateList = (list: Ref<ContentType[]>) => {
        const index = list.value.findIndex(ct => ct.id === id);
        if (index > -1) {
          // Replace with restored version
          list.value[index] = restored;
        } else {
          // Add to list if not found
          list.value.push(restored);
        }
      };
      
      // Update appropriate list based on type
      switch (restored.type) {
        case 'collection':
          updateList(collectionTypes);
          break;
        case 'single':
          updateList(singleTypes);
          break;
        case 'component':
          updateList(components);
          break;
      }
      
      return restored;
    } catch (err) {
      console.error('Failed to restore content type:', err);
      throw err;
    }
  };


  const refreshContentTypes = () => {
    console.log('[CMS DEBUG] Forcing refresh of content types');
    isInitialized.value = false; // Reset initialization flag to force reload
    return loadContentTypes();
  };

  const refreshSingleContentType = async (id: string): Promise<ContentType | null> => {
    console.log('[CMS DEBUG] Refreshing single content type:', id);
    
    try {
      // Use the existing findOne method from the service to get fresh data
      const freshContentType = await CMSContentTypesService.getById(id);
      
      if (freshContentType) {
        // Update the content type in local state
        const updated = updateContentTypeInLocalState(freshContentType);
        
        if (updated) {
          console.log('[CMS DEBUG] Successfully refreshed content type from backend');
          return freshContentType;
        } else {
          console.warn('[CMS DEBUG] Content type not found in local state for refresh');
        }
      }
      
      return null;
    } catch (error) {
      console.error('[CMS DEBUG] Failed to refresh content type:', error);
      return null;
    }
  };

  const updateContentTypeInLocalState = (updatedContentType: ContentType) => {
    console.log('[CMS DEBUG] Updating content type in local state:', {
      id: updatedContentType.id,
      name: updatedContentType.name,
      type: updatedContentType.type,
      fieldsCount: updatedContentType.fields?.length || 0
    });

    // Find and update the content type in the appropriate array
    let updated = false;
    
    switch (updatedContentType.type) {
      case 'collection':
        const collectionIndex = collectionTypes.value.findIndex(ct => ct.id === updatedContentType.id);
        if (collectionIndex > -1) {
          collectionTypes.value[collectionIndex] = updatedContentType;
          updated = true;
          console.log('[CMS DEBUG] Updated collection type in local state');
        }
        break;
        
      case 'single':
        const singleIndex = singleTypes.value.findIndex(ct => ct.id === updatedContentType.id);
        if (singleIndex > -1) {
          singleTypes.value[singleIndex] = updatedContentType;
          updated = true;
          console.log('[CMS DEBUG] Updated single type in local state');
        }
        break;
        
      case 'component':
        const componentIndex = components.value.findIndex(ct => ct.id === updatedContentType.id);
        if (componentIndex > -1) {
          components.value[componentIndex] = updatedContentType;
          updated = true;
          console.log('[CMS DEBUG] Updated component in local state');
        }
        break;
        
      default:
        console.warn('[CMS DEBUG] Unknown content type:', updatedContentType.type);
    }

    if (!updated) {
      console.warn('[CMS DEBUG] Content type not found in local state for update:', updatedContentType.id);
    }
    
    return updated;
  };

  return {
    // State
    collectionTypes,
    singleTypes,
    components,
    allContentTypes,
    availableContentTypes,
    loading,
    error,
    
    // Methods
    loadContentTypes,
    refreshContentTypes,
    refreshSingleContentType,
    filterContentTypes,
    findContentType,
    createContentType,
    updateContentType,
    updateContentTypeInLocalState,
    deleteContentType,
    restoreContentType
  };
}