<template>
  <expanded-nav-page-container>
    <div class="page-header q-mb-md">
      <div class="row items-start justify-between">
        <div class="col-grow">
          <h1 class="page-title">Gate API Documentation</h1>
          <p class="page-subtitle text-grey-7">
            Complete API reference for school gate devices and attendance tracking
          </p>
        </div>
        <div class="col-auto">
          <div class="row q-gutter-sm">
            <q-btn
              outline
              no-caps
              icon="o_open_in_new"
              label="Open in New Tab"
              color="primary"
              @click="openInNewTab"
              class="q-mt-sm"
            />
            <q-btn
              outline
              no-caps
              icon="o_link"
              label="Copy Link"
              color="primary"
              @click="copyDocumentationLink"
              class="q-mt-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <q-card flat class="documentation-container">
      <q-card-section class="q-pa-none">
        <div class="iframe-container">
          <iframe
            :src="documentationUrl"
            title="Gate API Documentation"
            frameborder="0"
            allowfullscreen
          />
        </div>
      </q-card-section>
    </q-card>
  </expanded-nav-page-container>
</template>

<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

const $q = useQuasar();

// Compute the documentation URL
const documentationUrl = computed(() => {
  const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api/public/school-gate`;
});

// Function to open documentation in a new tab
const openInNewTab = () => {
  const fullUrl = window.location.origin.includes('localhost')
    ? documentationUrl.value
    : documentationUrl.value.replace('http://localhost:3000', window.location.origin.replace(/:\d+$/, ':3000'));

  window.open(fullUrl, '_blank');

  $q.notify({
    type: 'info',
    message: 'Documentation opened in a new tab',
    icon: 'o_open_in_new',
    position: 'top',
    timeout: 2000
  });
};

// Function to copy documentation link to clipboard
const copyDocumentationLink = async () => {
  try {
    // Get the full URL including the current host if needed
    const fullUrl = window.location.origin.includes('localhost')
      ? documentationUrl.value
      : documentationUrl.value.replace('http://localhost:3000', window.location.origin.replace(/:\d+$/, ':3000'));

    await navigator.clipboard.writeText(fullUrl);

    $q.notify({
      type: 'positive',
      message: 'Documentation link copied to clipboard',
      icon: 'o_check_circle',
      position: 'top',
      timeout: 2000
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Failed to copy link',
      icon: 'o_error',
      position: 'top',
      timeout: 2000
    });
  }
};
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
}

.iframe-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 220px);
  min-height: 800px;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }
}

@media (max-width: 768px) {
  .iframe-container {
    height: calc(100vh - 180px);
    min-height: 600px;
  }
}
</style>