<template>
  <expanded-nav-page-container>
    <MediaLibraryCore
      mode="page"
      :selection-mode="'multiple'"
      :allow-upload="true"
      :allow-folders="true"
      :show-header="true"
      :show-breadcrumbs="true"
      :module="'TREASURY'"
      library-title="Treasury Media Library"
      @upload-complete="handleUploadComplete"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import MediaLibraryCore from '../../../components/shared/MediaLibrary/MediaLibraryCore.vue';

export default defineComponent({
  name: 'TreasuryMediaLibrary',
  components: {
    ExpandedNavPageContainer,
    MediaLibraryCore,
  },
  setup() {
    const handleUploadComplete = () => {
      console.log('Treasury media files uploaded successfully');
    };

    return {
      handleUploadComplete,
    };
  },
});
</script>

<style scoped lang="scss">
// Treasury media library specific styles if needed
</style>