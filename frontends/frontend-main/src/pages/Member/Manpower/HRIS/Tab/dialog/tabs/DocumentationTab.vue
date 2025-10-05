<template>
  <div class="documentation-tab">
    <!-- Header -->
    <div class="md3-surface">
      <h4 class="text-title-large">
        <q-icon name="folder" class="q-mr-sm" />
        Employee Documents
      </h4>
      <div class="text-body-medium text-grey-7">
        Manage and organize employee documentation including contracts, certificates, and other important files.
      </div>
    </div>

    <!-- Upload Section -->
    <div class="md3-surface">
      <h4 class="text-title-medium q-mb-md">
        <q-icon name="cloud_upload" class="q-mr-sm" />
        Upload New Document
      </h4>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="uploadForm.category"
            :options="categoryOptions"
            label="Document Category"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="onCategoryChange"
            class="md3-select"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="uploadForm.documentType"
            :options="documentTypeOptions"
            label="Document Type"
            outlined
            dense
            :disable="!uploadForm.category"
            class="md3-select"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            v-model="uploadForm.expiryDate"
            label="Expiry Date (Optional)"
            type="date"
            outlined
            dense
            class="md3-input"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-btn
            unelevated
            color="primary"
            label="Upload Document"
            icon="upload"
            @click="triggerFileSelect"
            :disable="!uploadForm.category || !uploadForm.documentType"
            class="md3-button md3-button-filled full-width"
            no-caps
          />
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            style="display: none"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>
        <div class="col-12">
          <q-input
            v-model="uploadForm.description"
            label="Description/Notes (Optional)"
            type="textarea"
            rows="2"
            outlined
            dense
            class="md3-input"
          />
        </div>
      </div>
    </div>

    <!-- Document Categories -->
    <div class="md3-surface">
      <h4 class="text-title-medium q-mb-md">
        <q-icon name="category" class="q-mr-sm" />
        Document Categories
      </h4>

      <div class="category-tabs">
        <q-tabs
          v-model="selectedCategory"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          no-caps
          inline-label
          outside-arrows
          mobile-arrows
          class="md3-tabs"
        >
          <q-tab name="ALL" label="All" />
          <q-tab name="EMPLOYMENT" :label="`Employment (${getCategoryCount('EMPLOYMENT')})`" />
          <q-tab name="GOVERNMENT_LEGAL" :label="`Gov/Legal (${getCategoryCount('GOVERNMENT_LEGAL')})`" />
          <q-tab name="EDUCATION_PROFESSIONAL" :label="`Education (${getCategoryCount('EDUCATION_PROFESSIONAL')})`" />
          <q-tab name="MEDICAL_HEALTH" :label="`Medical (${getCategoryCount('MEDICAL_HEALTH')})`" />
          <q-tab name="PERFORMANCE_DISCIPLINARY" :label="`Performance (${getCategoryCount('PERFORMANCE_DISCIPLINARY')})`" />
          <q-tab name="COMPENSATION_BENEFITS" :label="`Benefits (${getCategoryCount('COMPENSATION_BENEFITS')})`" />
          <q-tab name="EXIT_DOCUMENTS" :label="`Exit (${getCategoryCount('EXIT_DOCUMENTS')})`" />
          <q-tab name="OTHER" :label="`Other (${getCategoryCount('OTHER')})`" />
        </q-tabs>

        <q-separator class="md3-divider" />

        <q-tab-panels v-model="selectedCategory" animated class="tab-panels">
          <q-tab-panel v-for="panel in ['ALL', ...categoryOptions.map(c => c.value)]" :key="panel" :name="panel">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center q-pa-lg">
              <q-spinner-dots size="50px" color="primary" />
              <div class="md3-text-body-medium q-mt-sm">Loading documents...</div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!getFilteredDocuments(panel).length" class="text-center q-pa-lg">
              <q-icon name="description" size="64px" color="grey-5" />
              <div class="text-label-large q-mt-md">No Documents Found</div>
              <div class="text-body-medium text-grey-6 q-mt-sm">
                {{ panel === 'ALL' ? 'No documents have been uploaded yet.' : `No documents in the ${getCategoryLabel(panel)} category.` }}
              </div>
            </div>

            <!-- Documents Table -->
            <div v-else class="documents-table">
              <table class="md3-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>File Name</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Uploaded Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in getFilteredDocuments(panel)" :key="doc.id">
                    <td>
                      <div class="md3-text-body-medium">{{ doc.documentType }}</div>
                      <div v-if="doc.description" class="md3-text-body-small text-grey-7 q-mt-xs">
                        {{ doc.description }}
                      </div>
                    </td>
                    <td>
                      <q-btn
                        flat
                        dense
                        color="primary"
                        :label="doc.file.originalName"
                        icon="description"
                        @click="viewDocument(doc)"
                        no-caps
                        class="md3-button-text"
                      />
                    </td>
                    <td>
                      <q-chip
                        color="grey-3"
                        text-color="grey-8"
                        dense
                        size="sm"
                      >
                        {{ getCategoryLabel(doc.category) }}
                      </q-chip>
                    </td>
                    <td>
                      <div v-if="doc.expiryDate">
                        <div class="md3-text-body-medium">{{ doc.expiryDate.dateFull }}</div>
                        <q-chip
                          v-if="doc.isExpired"
                          color="negative"
                          text-color="white"
                          size="sm"
                          dense
                        >
                          Expired
                        </q-chip>
                        <q-chip
                          v-else-if="doc.daysUntilExpiry !== null && doc.daysUntilExpiry <= 30"
                          color="warning"
                          text-color="white"
                          size="sm"
                          dense
                        >
                          Expires in {{ doc.daysUntilExpiry }} days
                        </q-chip>
                      </div>
                      <div v-else class="text-grey-6">No expiry</div>
                    </td>
                    <td class="md3-text-body-medium">{{ doc.createdAt.dateFull || doc.uploadedDate }}</td>
                    <td>
                      <div class="row items-center q-gutter-xs">
                        <q-btn
                          flat
                          round
                          dense
                          color="primary"
                          icon="download"
                          size="sm"
                          @click="downloadDocument(doc)"
                        >
                          <q-tooltip>Download</q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          round
                          dense
                          color="info"
                          icon="edit"
                          size="sm"
                          @click="editDocument(doc)"
                        >
                          <q-tooltip>Edit</q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          round
                          dense
                          color="negative"
                          icon="delete"
                          size="sm"
                          @click="deleteDocument(doc)"
                        >
                          <q-tooltip>Delete</q-tooltip>
                        </q-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Edit Dialog -->
    <q-dialog v-model="showEditDialog">
      <TemplateDialog minWidth="400px">
        <template #DialogTitle>
          Edit Document
        </template>
        <template #DialogContent>
          <section>
            <div class="q-gutter-md">
              <q-select
                v-model="editForm.category"
                :options="categoryOptions"
                label="Document Category"
                dense
                outlined
                emit-value
                map-options
                @update:model-value="onEditCategoryChange"
              />
              <q-select
                v-model="editForm.documentType"
                :options="editDocumentTypeOptions"
                label="Document Type"
                dense
                outlined
              />
              <q-input
                v-model="editForm.expiryDate"
                label="Expiry Date"
                type="date"
                dense
                outlined
              />
              <q-input
                v-model="editForm.description"
                label="Description/Notes"
                type="textarea"
                rows="3"
                dense
                outlined
              />
            </div>
          </section>

          <section align="right" class="q-mt-md">
            <q-btn flat label="Cancel" color="primary" v-close-popup class="text-label-large"/>
            <q-btn unelevated label="Save" color="primary" @click="saveEdit" class="text-label-large" />
          </section>
        </template>
      </TemplateDialog>
    </q-dialog>
  </div>
</template>

<script>
import { api } from 'src/boot/axios';
import { FileService } from 'src/services/file.service';
import { useGlobalMethods } from 'src/composables/useGlobalMethods';
import { useQuasar } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'DocumentationTab',
  components: {
    TemplateDialog,
  },
  setup() {
    const quasar = useQuasar();
    const { handleAxiosError } = useGlobalMethods();
    
    return {
      quasar,
      handleAxiosError
    };
  },
  props: {
    employeeData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      documents: [],
      documentTypes: [],
      isLoading: false,
      selectedCategory: 'ALL',
      showEditDialog: false,
      editingDocument: null,
      uploadForm: {
        category: null,
        documentType: null,
        description: '',
        expiryDate: null,
      },
      editForm: {
        category: null,
        documentType: null,
        description: '',
        expiryDate: null,
      },
      categoryOptions: [
        { label: 'Employment', value: 'EMPLOYMENT' },
        { label: 'Government & Legal', value: 'GOVERNMENT_LEGAL' },
        { label: 'Education & Professional', value: 'EDUCATION_PROFESSIONAL' },
        { label: 'Medical & Health', value: 'MEDICAL_HEALTH' },
        { label: 'Performance & Disciplinary', value: 'PERFORMANCE_DISCIPLINARY' },
        { label: 'Compensation & Benefits', value: 'COMPENSATION_BENEFITS' },
        { label: 'Exit Documents', value: 'EXIT_DOCUMENTS' },
        { label: 'Other', value: 'OTHER' },
      ],
      documentTypeOptions: [],
      editDocumentTypeOptions: [],
      columns: [
        {
          name: 'documentType',
          label: 'Document Type',
          field: 'documentType',
          align: 'left',
          sortable: true,
        },
        {
          name: 'file',
          label: 'File Name',
          field: 'file',
          align: 'left',
        },
        {
          name: 'category',
          label: 'Category',
          field: 'category',
          align: 'left',
          format: (val) => this.getCategoryLabel(val),
        },
        {
          name: 'expiryDate',
          label: 'Expiry Date',
          field: 'expiryDate',
          align: 'left',
        },
        {
          name: 'uploadedDate',
          label: 'Uploaded Date',
          field: 'createdAt',
          align: 'left',
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center',
        },
      ],
      pagination: {
        rowsPerPage: 10,
      },
    };
  },
  mounted() {
    this.fetchDocuments();
    this.fetchDocumentTypes();
  },
  methods: {
    async fetchDocuments() {
      this.isLoading = true;
      try {
        const response = await api.get('/hris/employee/document/list', {
          params: {
            accountId: this.employeeData.data.accountDetails.id,
          },
        });
        this.documents = response.data;
      } catch (error) {
        this.handleAxiosError(error);
        this.quasar.notify({
          type: 'negative',
          message: 'Failed to fetch documents',
        });
      } finally {
        this.isLoading = false;
      }
    },
    async fetchDocumentTypes() {
      try {
        const response = await api.get('/hris/employee/document/types');
        this.documentTypes = response.data;
      } catch (error) {
        console.error('Failed to fetch document types:', error);
      }
    },
    getCategoryLabel(value) {
      const category = this.categoryOptions.find((c) => c.value === value);
      return category ? category.label : value;
    },
    getCategoryCount(category) {
      return this.documents.filter((doc) => doc.category === category && doc.isActive).length;
    },
    getFilteredDocuments(panel) {
      if (panel === 'ALL') {
        return this.documents.filter((doc) => doc.isActive);
      }
      return this.documents.filter((doc) => doc.category === panel && doc.isActive);
    },
    onCategoryChange(category) {
      const categoryData = this.documentTypes.find((dt) => dt.category === category);
      this.documentTypeOptions = categoryData ? categoryData.types : [];
      this.uploadForm.documentType = null;
    },
    onEditCategoryChange(category) {
      const categoryData = this.documentTypes.find((dt) => dt.category === category);
      this.editDocumentTypeOptions = categoryData ? categoryData.types : [];
    },
    triggerFileSelect() {
      this.$refs.fileInput.click();
    },
    async handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.quasar.notify({
          type: 'negative',
          message: 'File size must be less than 10MB',
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', this.employeeData.data.accountDetails.id);
      formData.append('category', this.uploadForm.category);
      formData.append('documentType', this.uploadForm.documentType);
      if (this.uploadForm.description) {
        formData.append('description', this.uploadForm.description);
      }
      if (this.uploadForm.expiryDate) {
        formData.append('expiryDate', this.uploadForm.expiryDate);
      }

      this.quasar.loading.show();
      try {
        await api.post('/hris/employee/document/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this.quasar.notify({
          type: 'positive',
          message: 'Document uploaded successfully',
        });
        this.resetUploadForm();
        this.fetchDocuments();
      } catch (error) {
        this.handleAxiosError(error);
        this.quasar.notify({
          type: 'negative',
          message: 'Failed to upload document',
        });
      } finally {
        this.quasar.loading.hide();
        this.$refs.fileInput.value = '';
      }
    },
    viewDocument(document) {
      FileService.viewFile(document.file.url);
    },
    downloadDocument(document) {
      FileService.downloadFile(document.file.url, document.file.originalName);
    },
    editDocument(document) {
      this.editingDocument = document;
      this.editForm = {
        category: document.category,
        documentType: document.documentType,
        description: document.description || '',
        expiryDate: document.expiryDate ?
          (typeof document.expiryDate === 'object' && document.expiryDate.dateStandard
            ? document.expiryDate.dateStandard
            : typeof document.expiryDate === 'string'
              ? document.expiryDate.split(' ')[0]
              : new Date(document.expiryDate).toISOString().split('T')[0]) : null,
      };
      this.onEditCategoryChange(document.category);
      this.showEditDialog = true;
    },
    async saveEdit() {
      this.quasar.loading.show();
      try {
        await api.patch(`/hris/employee/document/${this.editingDocument.id}`, this.editForm);
        this.quasar.notify({
          type: 'positive',
          message: 'Document updated successfully',
        });
        this.showEditDialog = false;
        this.fetchDocuments();
      } catch (error) {
        this.handleAxiosError(error);
        this.quasar.notify({
          type: 'negative',
          message: 'Failed to update document',
        });
      } finally {
        this.quasar.loading.hide();
      }
    },
    async deleteDocument(document) {
      this.quasar
        .dialog({
          title: 'Confirm Delete',
          message: `Are you sure you want to delete "${document.documentType}"?`,
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          this.quasar.loading.show();
          try {
            await api.delete(`/hris/employee/document/${document.id}`);
            this.quasar.notify({
              type: 'positive',
              message: 'Document deleted successfully',
            });
            this.fetchDocuments();
          } catch (error) {
            this.handleAxiosError(error);
            this.quasar.notify({
              type: 'negative',
              message: 'Failed to delete document',
            });
          } finally {
            this.quasar.loading.hide();
          }
        });
    },
    resetUploadForm() {
      this.uploadForm = {
        category: null,
        documentType: null,
        description: '',
        expiryDate: null,
      };
      this.documentTypeOptions = [];
    },
  },
};
</script>

<style scoped lang="scss">
.documentation-tab {
  .category-tabs {
    .md3-tabs {
      :deep(.q-tab) {
        text-transform: none;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        font-weight: 500;
      }

      :deep(.q-tabs__content) {
        overflow-x: auto;
      }
    }

    .tab-panels {
      background: transparent;

      :deep(.q-tab-panel) {
        padding: 16px 0;
      }
    }
  }

  .documents-table {
    margin-top: 16px;

    .md3-table {
      tr:hover {
        background-color: #f8f6ff;
      }
    }
  }

  .full-width {
    width: 100%;
  }
}
</style>

<!-- Import shared styles -->
<style lang="scss" src="../EditCreateEmployee.scss"></style>
