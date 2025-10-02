<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="fade"
    transition-hide="fade"
    class="response-dialog"
  >
    <q-card flat class="response-dialog-card">
      <!-- Compact Header -->
      <q-card-section class="response-header q-pa-sm">
        <div class="row items-center q-gutter-sm">
          <!-- Status, Method & Time -->
          <q-badge
            :color="getStatusColor(responseData?.status || 0)"
            text-color="white"
            class="status-badge"
          >
            {{ responseData?.status || 'N/A' }} {{ responseData?.statusText || '' }}
          </q-badge>
          <q-badge
            :color="getMethodColor(responseData?.method || 'GET')"
            text-color="white"
            class="method-badge"
          >
            {{ responseData?.method || 'GET' }}
          </q-badge>
          <div class="response-time">
            <q-icon name="schedule" size="14px" class="q-mr-xs" />
            <span class="text-caption text-weight-medium">{{ responseTime }}ms</span>
          </div>
          
          <q-space />
          
          <!-- Compact Actions -->
          <q-btn
            icon="content_copy"
            flat
            dense
            size="sm"
            color="grey-7"
            class="compact-btn"
            @click="copyResponse"
            :disable="!responseData?.body"
          >
            <q-tooltip>Copy</q-tooltip>
          </q-btn>
          <q-btn
            icon="download"
            flat
            dense
            size="sm"
            color="grey-7"
            class="compact-btn"
            @click="downloadResponse"
            :disable="!responseData?.body"
          >
            <q-tooltip>Download</q-tooltip>
          </q-btn>
          <q-btn
            icon="replay"
            flat
            dense
            size="sm"
            color="primary"
            class="compact-btn"
            @click="replayRequest"
            :disable="!canReplay"
          >
            <q-tooltip>Replay</q-tooltip>
          </q-btn>
          <q-btn
            icon="close"
            flat
            dense
            size="sm"
            color="grey-7"
            @click="closeDialog"
            class="compact-btn"
          >
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
        
        <!-- Compact URL -->
        <div class="row items-center q-mt-sm q-gutter-sm">
          <div class="text-caption text-grey-8 text-weight-bold">URL:</div>
          <q-input
            :model-value="responseData?.url || ''"
            readonly
            filled
            dense
            bg-color="grey-1"
            class="url-input col-grow"
            borderless
          >
            <template v-slot:append>
              <q-btn
                icon="content_copy"
                flat
                round
                size="xs"
                color="grey-7"
                @click="copyUrl"
              >
                <q-tooltip>Copy URL</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </div>
      </q-card-section>
      
      <!-- Compact Tabs -->
      <q-tabs
        v-model="activeTab"
        class="text-grey-8 bg-grey-1 compact-tabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
        no-caps
        flat
        dense
      >
        <q-tab name="response" icon="code" class="compact-tab">Response</q-tab>
        <q-tab name="headers" icon="list_alt" class="compact-tab">Headers</q-tab>
        <q-tab name="request" icon="send" class="compact-tab">Request</q-tab>
        <q-tab name="raw" icon="article" class="compact-tab">Raw</q-tab>
      </q-tabs>
      
      <!-- Tab Panels -->
      <q-tab-panels v-model="activeTab" animated class="response-content">
        <!-- Response Tab -->
        <q-tab-panel name="response" class="q-pa-none">
          <div class="response-viewer">
            <div class="response-toolbar q-px-md q-py-sm">
              <div class="row items-center justify-between">
                <div class="text-subtitle1 text-weight-medium">Response Body</div>
                <div class="row items-center q-gutter-sm">
                  <q-badge
                    v-if="responseData?.body"
                    :label="getDataSize(responseData.body)"
                    color="grey-4"
                    text-color="grey-8"
                    class="data-size-badge"
                  />
                  <q-btn
                    icon="wrap_text"
                    :color="wordWrap ? 'primary' : 'grey-6'"
                    flat
                    round
                    size="sm"
                    @click="wordWrap = !wordWrap"
                  >
                    <q-tooltip>Toggle word wrap</q-tooltip>
                  </q-btn>
                  <q-btn
                    icon="auto_fix_high"
                    flat
                    round
                    size="sm"
                    color="grey-6"
                    @click="formatJson"
                    :disable="!canFormat"
                  >
                    <q-tooltip>Format JSON</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
            
            <div class="json-container" :class="{ 'word-wrap': wordWrap }">
              <pre class="json-content"><code>{{ formattedResponseBody }}</code></pre>
            </div>
          </div>
        </q-tab-panel>
        
        <!-- Headers Tab -->
        <q-tab-panel name="headers" class="q-pa-md">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Response Headers</div>
          
          <q-table
            :rows="headersArray"
            :columns="headerColumns"
            flat
            separator="cell"
            hide-pagination
            :rows-per-page-options="[0]"
            class="headers-table"
          >
            <template v-slot:body-cell-value="props">
              <q-td :props="props" class="value-cell">
                <div class="header-value">{{ props.value }}</div>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
        
        <!-- Request Details Tab -->
        <q-tab-panel name="request" class="q-pa-md">
          <div class="request-details">
            <div class="text-subtitle1 text-weight-medium q-mb-md">Request Summary</div>
            
            <q-list class="request-list">
              <q-item class="request-item">
                <q-item-section avatar>
                  <q-icon name="http" color="primary" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">Method</q-item-label>
                  <q-item-label class="text-body2 text-grey-8">{{ responseData?.method || 'GET' }}</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator spaced inset="item" />
              
              <q-item class="request-item">
                <q-item-section avatar>
                  <q-icon name="link" color="primary" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">URL</q-item-label>
                  <q-item-label class="text-caption text-grey-8 url-break">{{ responseData?.url || '' }}</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator spaced inset="item" />
              
              <q-item class="request-item">
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">Response Time</q-item-label>
                  <q-item-label class="text-body2 text-grey-8">{{ responseTime }}ms</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator spaced inset="item" />
              
              <q-item class="request-item">
                <q-item-section avatar>
                  <q-icon name="info" color="primary" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">Status</q-item-label>
                  <q-item-label class="text-body2 text-grey-8">
                    {{ responseData?.status || 'N/A' }} {{ responseData?.statusText || '' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            
            <!-- Request Headers if available -->
            <div v-if="requestDetails?.headers" class="q-mt-lg">
              <div class="text-subtitle1 text-weight-medium q-mb-md">Request Headers</div>
              <q-table
                :rows="requestHeadersArray"
                :columns="headerColumns"
                flat
                separator="cell"
                hide-pagination
                :rows-per-page-options="[0]"
                class="headers-table"
              />
            </div>
            
            <!-- Request Body if available -->
            <div v-if="requestDetails?.body" class="q-mt-lg">
              <div class="text-subtitle1 text-weight-medium q-mb-md">Request Body</div>
              <q-card flat class="bg-grey-1 request-body-card">
                <q-card-section>
                  <pre class="request-body"><code>{{ formattedRequestBody }}</code></pre>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
        
        <!-- Raw Tab -->
        <q-tab-panel name="raw" class="q-pa-none">
          <div class="raw-viewer">
            <div class="raw-toolbar q-px-md q-py-sm">
              <div class="text-subtitle1 text-weight-medium">Raw Response</div>
            </div>
            <div class="raw-content">
              <pre class="raw-text"><code>{{ rawResponseContent }}</code></pre>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  url: string;
  method: string;
}

interface RequestDetails {
  headers?: Record<string, string>;
  body?: any;
}

export default defineComponent({
  name: 'CMSAPIResponseDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    responseData: {
      type: Object as () => ResponseData | null,
      default: null
    },
    responseTime: {
      type: Number,
      default: 0
    },
    requestDetails: {
      type: Object as () => RequestDetails | null,
      default: null
    }
  },
  emits: ['update:modelValue', 'replay-request'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    // Reactive state
    const activeTab = ref('response');
    const wordWrap = ref(false);
    
    // Computed
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });
    
    const formattedResponseBody = computed(() => {
      if (!props.responseData?.body) return 'No response body';
      
      try {
        if (typeof props.responseData.body === 'string') {
          return JSON.stringify(JSON.parse(props.responseData.body), null, 2);
        }
        return JSON.stringify(props.responseData.body, null, 2);
      } catch (e) {
        return props.responseData.body;
      }
    });
    
    const formattedRequestBody = computed(() => {
      if (!props.requestDetails?.body) return 'No request body';
      
      try {
        if (typeof props.requestDetails.body === 'string') {
          return JSON.stringify(JSON.parse(props.requestDetails.body), null, 2);
        }
        return JSON.stringify(props.requestDetails.body, null, 2);
      } catch (e) {
        return props.requestDetails.body;
      }
    });
    
    const rawResponseContent = computed(() => {
      if (!props.responseData) return 'No response data';
      
      let content = `HTTP/1.1 ${props.responseData.status} ${props.responseData.statusText}\n`;
      
      // Add headers
      Object.entries(props.responseData.headers || {}).forEach(([key, value]) => {
        content += `${key}: ${value}\n`;
      });
      
      content += '\n';
      
      // Add body
      if (props.responseData.body) {
        content += typeof props.responseData.body === 'string' 
          ? props.responseData.body 
          : JSON.stringify(props.responseData.body, null, 2);
      }
      
      return content;
    });
    
    const headersArray = computed(() => {
      if (!props.responseData?.headers) return [];
      
      return Object.entries(props.responseData.headers).map(([key, value]) => ({
        name: key,
        value: value
      }));
    });
    
    const requestHeadersArray = computed(() => {
      if (!props.requestDetails?.headers) return [];
      
      return Object.entries(props.requestDetails.headers).map(([key, value]) => ({
        name: key,
        value: value
      }));
    });
    
    const canFormat = computed(() => {
      if (!props.responseData?.body) return false;
      
      try {
        if (typeof props.responseData.body === 'string') {
          JSON.parse(props.responseData.body);
        } else {
          JSON.stringify(props.responseData.body);
        }
        return true;
      } catch (e) {
        return false;
      }
    });
    
    const canReplay = computed(() => {
      return !!props.responseData?.url;
    });
    
    // Table columns
    const headerColumns = [
      {
        name: 'name',
        label: 'Header Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
        style: 'width: 200px'
      },
      {
        name: 'value',
        label: 'Value',
        field: 'value',
        align: 'left' as const,
        sortable: false
      }
    ];
    
    // Methods
    const getStatusColor = (status: number): string => {
      if (status >= 200 && status < 300) return 'positive';
      if (status >= 300 && status < 400) return 'info';
      if (status >= 400 && status < 500) return 'warning';
      if (status >= 500) return 'negative';
      return 'grey-6';
    };
    
    const getMethodColor = (method: string): string => {
      switch (method.toUpperCase()) {
        case 'GET': return 'positive';
        case 'POST': return 'info';
        case 'PUT': return 'warning';
        case 'DELETE': return 'negative';
        case 'PATCH': return 'purple';
        default: return 'grey-6';
      }
    };
    
    const getDataSize = (data: any): string => {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const bytes = new Blob([jsonString]).size;
      
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    
    const copyResponse = async () => {
      if (!props.responseData?.body) return;
      
      try {
        await navigator.clipboard.writeText(formattedResponseBody.value);
        $q.notify({
          type: 'positive',
          message: 'Response copied to clipboard',
          position: 'top',
          timeout: 2000
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy response',
          position: 'top',
          timeout: 2000
        });
      }
    };
    
    const copyUrl = async () => {
      if (!props.responseData?.url) return;
      
      try {
        await navigator.clipboard.writeText(props.responseData.url);
        $q.notify({
          type: 'positive',
          message: 'URL copied to clipboard',
          position: 'top',
          timeout: 2000
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy URL',
          position: 'top',
          timeout: 2000
        });
      }
    };
    
    const downloadResponse = () => {
      if (!props.responseData?.body) return;
      
      const content = formattedResponseBody.value;
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-response-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      $q.notify({
        type: 'positive',
        message: 'Response downloaded successfully',
        position: 'top',
        timeout: 2000
      });
    };
    
    const formatJson = () => {
      // This would trigger a re-computation of formattedResponseBody
      nextTick(() => {
        $q.notify({
          type: 'info',
          message: 'JSON formatted',
          position: 'top',
          timeout: 1000
        });
      });
    };
    
    const replayRequest = () => {
      emit('replay-request');
    };
    
    const closeDialog = () => {
      isOpen.value = false;
    };
    
    // Keyboard shortcuts
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen.value) {
        closeDialog();
      }
    };
    
    // Watch for dialog open/close to manage keyboard listeners
    watch(isOpen, (newValue) => {
      if (newValue) {
        document.addEventListener('keydown', handleKeydown);
        activeTab.value = 'response'; // Reset to response tab
      } else {
        document.removeEventListener('keydown', handleKeydown);
      }
    });
    
    return {
      // Reactive state
      isOpen,
      activeTab,
      wordWrap,
      
      // Computed
      formattedResponseBody,
      formattedRequestBody,
      rawResponseContent,
      headersArray,
      requestHeadersArray,
      canFormat,
      canReplay,
      headerColumns,
      
      // Methods
      getStatusColor,
      getMethodColor,
      getDataSize,
      copyResponse,
      copyUrl,
      downloadResponse,
      formatJson,
      replayRequest,
      closeDialog
    };
  }
});
</script>

<style scoped lang="scss">
// Material Design 3 Flat Design
.response-dialog {
  .response-dialog-card {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #fafafa;
  }
  
  .response-header {
    background-color: white;
    border-bottom: 1px solid #e0e0e0;
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.1px;
    }
    
    .method-badge {
      padding: 1px 6px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 10px;
      letter-spacing: 0.25px;
    }
    
    .response-time {
      display: flex;
      align-items: center;
      color: #424242;
      font-weight: 500;
      font-size: 11px;
    }
    
    .compact-btn {
      border-radius: 4px;
      min-height: 24px;
      padding: 4px 6px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.08);
      }
    }
    
    .url-input {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 10px;
      border-radius: 4px;
      
      :deep(.q-field__control) {
        min-height: 24px;
        border-radius: 4px;
        box-shadow: none;
      }
      
      :deep(input) {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 10px;
      }
    }
  }
  
  .response-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: white;
    
    .q-tab-panel {
      flex: 1;
      overflow: auto;
    }
  }
  
  .compact-tabs {
    min-height: 36px;
    
    :deep(.q-tabs__content) {
      min-height: 36px;
    }
  }
  
  .compact-tab {
    font-weight: 500;
    letter-spacing: 0.1px;
    font-size: 11px;
    min-height: 36px;
    padding: 0 12px;
    
    :deep(.q-tab__content) {
      min-height: 36px;
    }
    
    :deep(.q-tab__icon) {
      font-size: 16px;
      margin-right: 4px;
    }
  }
  
  .response-viewer {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .response-toolbar {
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      
      .data-size-badge {
        border-radius: 8px;
        font-weight: 500;
        font-size: 10px;
        padding: 2px 6px;
      }
    }
    
    .json-container {
      flex: 1;
      overflow: auto;
      background-color: #fafafa;
      
      &.word-wrap .json-content {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .json-content {
        margin: 0;
        padding: 16px;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
        color: #1a1a1a;
        background: transparent;
        white-space: pre;
        overflow-x: auto;
      }
    }
  }
  
  .headers-table {
    border-radius: 6px;
    overflow: hidden;
    
    :deep(.q-table) {
      font-size: 12px;
    }
    
    :deep(.q-table__top) {
      background-color: #f5f5f5;
    }
    
    :deep(th) {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #424242;
      border-bottom: 1px solid #e0e0e0;
    }
    
    :deep(td) {
      border-bottom: 1px solid #f0f0f0;
    }
    
    .value-cell {
      .header-value {
        word-break: break-all;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 11px;
        color: #424242;
      }
    }
  }
  
  .request-details {
    .request-list {
      border-radius: 8px;
      overflow: hidden;
    }
    
    .request-item {
      padding: 8px 12px;
      min-height: 48px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
    }
    
    .url-break {
      word-break: break-all;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 11px;
    }
    
    .request-body-card {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .request-body {
      margin: 0;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 11px;
      line-height: 1.5;
      color: #424242;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
  
  .raw-viewer {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .raw-toolbar {
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .raw-content {
      flex: 1;
      overflow: auto;
      background-color: #fafafa;
      
      .raw-text {
        margin: 0;
        padding: 16px;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 11px;
        line-height: 1.4;
        color: #424242;
        background: transparent;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  }
}

// Dark mode support
.body--dark {
  .response-dialog {
    .response-dialog-card {
      background-color: #121212;
    }
    
    .response-header {
      background-color: #1e1e1e;
      border-bottom: 1px solid #333;
      
      .response-time {
        color: #e0e0e0;
      }
      
      .action-btn {
        &.q-btn--unelevated {
          background-color: #333;
          color: white;
        }
      }
      
      .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }
    
    .response-content {
      background-color: #1e1e1e;
    }
    
    .response-toolbar {
      background-color: #2a2a2a !important;
      border-bottom: 1px solid #333 !important;
    }
    
    .json-container {
      background-color: #1a1a1a;
      
      .json-content {
        color: #e0e0e0;
        background: transparent;
      }
    }
    
    .headers-table {
      :deep(.q-table__top) {
        background-color: #2a2a2a;
      }
      
      :deep(th) {
        background-color: #2a2a2a;
        color: #e0e0e0;
        border-bottom: 1px solid #333;
      }
      
      :deep(td) {
        border-bottom: 1px solid #333;
        color: #e0e0e0;
      }
      
      .value-cell .header-value {
        color: #e0e0e0;
      }
    }
    
    .request-item:hover {
      background-color: rgba(255, 255, 255, 0.02);
    }
    
    .request-body-card {
      border: 1px solid #333;
    }
    
    .request-body {
      color: #e0e0e0;
    }
    
    .raw-viewer {
      .raw-toolbar {
        background-color: #2a2a2a !important;
        border-bottom: 1px solid #333 !important;
      }
      
      .raw-content {
        background-color: #1a1a1a;
        
        .raw-text {
          color: #e0e0e0;
        }
      }
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .response-dialog {
    .response-header {
      padding: 8px !important;
      
      .row {
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .compact-btn {
        font-size: 10px;
        padding: 3px 5px;
        min-height: 20px;
      }
    }
    
    .json-container .json-content {
      padding: 12px;
      font-size: 10px;
    }
    
    .raw-viewer .raw-content .raw-text {
      padding: 12px;
      font-size: 10px;
    }
    
    .request-item {
      padding: 6px 8px;
      min-height: 40px;
    }
  }
}

// Custom scrollbars
.json-container,
.raw-content {
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }
}

// Typography improvements - Dense version
.text-subtitle1 {
  font-weight: 500 !important;
  letter-spacing: 0.1px;
  font-size: 14px !important;
}

.text-body1 {
  font-size: 13px !important;
}

.text-body2 {
  font-size: 12px !important;
}

.text-caption {
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
}
</style>