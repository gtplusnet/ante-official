<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <div class="md3-header-dense">
        <q-icon name="description" size="20px" />
        <span class="md3-title">Documentation</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading documents...</div>
          </div>
          <div v-else-if="documentsData && documentsData.documents.length > 0">
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="folder" size="18px" />
              Employment Documents ({{ documentsData.totalDocuments }})
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documentsData.documents" :key="doc.id">
                  <td><strong>{{ doc.documentName }}</strong></td>
                  <td>{{ doc.documentType }}</td>
                  <td>{{ formatDate(doc.uploadDate) }}</td>
                  <td>
                    <span class="md3-badge-dense" :class="doc.status === 'Active' ? 'active' : 'inactive'">
                      {{ doc.status }}
                    </span>
                  </td>
                  <td>
                    <q-btn v-if="doc.fileUrl" flat dense size="sm" icon="download" @click="downloadDocument(doc)">
                      <q-tooltip>Download</q-tooltip>
                    </q-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="md3-empty-dense">
          <q-icon name="folder_open" />
          <div class="empty-title">No Documents</div>
          <div class="empty-subtitle">No employment documents available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type DocumentsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'DocumentationDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const documentsData = ref<DocumentsResponse | null>(null);

    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) loadDocuments();
    });

    watch(show, (newVal) => emit('update:modelValue', newVal));

    const loadDocuments = async () => {
      loading.value = true;
      try {
        documentsData.value = await employeeInfoService.getDocuments();
      } catch (err) {
        console.error('Error loading documents:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString: any) => date.formatDate(dateString, 'MMM DD, YYYY');
    const downloadDocument = (doc: any) => window.open(doc.fileUrl, '_blank');

    return { show, loading, documentsData, formatDate, downloadDocument };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>