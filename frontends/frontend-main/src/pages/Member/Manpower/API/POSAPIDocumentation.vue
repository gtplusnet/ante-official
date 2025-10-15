<template>
  <expanded-nav-page-container>
    <div class="page-header q-mb-md">
      <div class="row items-start justify-between">
        <div class="col-grow">
          <h1 class="page-title">POS Cart API Documentation</h1>
          <p class="page-subtitle text-grey-7">
            Complete API documentation for the Point of Sale cart system
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            dense
            icon="o_open_in_new"
            label="Open in New Tab"
            color="primary"
            @click="openInNewTab"
            class="q-mr-sm"
          />
          <q-btn
            flat
            dense
            icon="o_content_copy"
            label="Copy Link"
            color="primary"
            @click="copyDocumentationLink"
          />
        </div>
      </div>
    </div>

    <q-card flat class="documentation-container">
      <iframe
        :src="documentationUrl"
        frameborder="0"
        class="documentation-iframe"
      />
    </q-card>
  </expanded-nav-page-container>
</template>

<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

const $q = useQuasar();

const documentationUrl = computed(() => {
  const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api/public/pos`;
});

function openInNewTab() {
  window.open(documentationUrl.value, '_blank');
}

async function copyDocumentationLink() {
  try {
    await navigator.clipboard.writeText(documentationUrl.value);
    $q.notify({
      type: 'positive',
      message: 'Documentation link copied to clipboard',
      position: 'top',
      timeout: 2000,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to copy link',
      position: 'top',
      timeout: 2000,
    });
  }
}
</script>

<style scoped lang="scss">
.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 28px;
    font-weight: 500;
    margin: 0 0 4px 0;
    color: $grey-9;
  }

  .page-subtitle {
    font-size: 14px;
    margin: 0;
  }
}

.documentation-container {
  min-height: calc(100vh - 200px);
  background: white;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.documentation-iframe {
  width: 100%;
  height: calc(100vh - 200px);
  border: none;
}

@media (max-width: 768px) {
  .page-header {
    .page-title {
      font-size: 24px;
    }

    .col-auto {
      margin-top: 12px;
    }
  }
}
</style>
