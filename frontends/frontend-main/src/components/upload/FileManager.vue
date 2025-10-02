<template>
  <div flat class="full-width">
    <div class="text-right q-mb-md">
      <q-btn flat color="primary" no-caps rounded @click="triggerFileSelect">
        <q-icon name="upload" size="14px" class="q-mr-sm"></q-icon>
        Upload File
      </q-btn>
      <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" />
    </div>

    <div>
      <g-table tableKey="files" apiUrl="/file-upload" :apiFilters="[{ taskId: taskId }]" ref="table"
        :isRowActionEnabled="true">
        <!-- actions button -->
        <template v-slot:row-actions="props">
          <q-btn rounded class="q-mr-sm" @click="download(props.data)" no-caps color="primary" unelevated>
            <q-icon name="download" size="16px" class="q-mr-xs"></q-icon>
            Download
          </q-btn>
        </template>
      </g-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
  min-height: 600px;
}
</style>

<script>
import GTable from '../shared/display/GTable.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'FileManager',
  components: {
    GTable,
  },
  props: {
    taskId: {
      type: Number,
      required: false,
    },
    projectId: {
      type: Number,
      required: false,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {
    download(data) {
      const link = document.createElement('a');
      link.href = data.url;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    triggerFileSelect() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('fileData', file);
        this.$q.loading.show();

        let url = '/file-upload/upload-document';
        const params = new URLSearchParams();

        if (this.taskId) {
          params.append('taskId', this.taskId);
        }

        if (this.projectId) {
          params.append('projectId', this.projectId);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        api
          .post(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(() => {
            this.$refs.table.refetch();
          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => {
            this.$q.loading.hide();
          });
      }
    },
  },
};
</script>
