<template>
  <expanded-nav-page-container>
    <!-- Header Section -->
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <h1 class="page-title">Device Management</h1>
          <p class="page-subtitle text-grey-7">Manage devices that can access the time tracking API</p>
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="o_add"
          label="Add Device"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- Devices Table -->
    <q-card flat bordered class="q-mb-md">
      <q-table
        flat
        dense
        :rows="devices"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        no-data-label="No devices found"
      >
        <!-- Status Column -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.isActive ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
            >
              {{ props.row.isActive ? 'Active' : 'Inactive' }}
            </q-chip>
          </q-td>
        </template>

        <!-- Last Activity Column -->
        <template v-slot:body-cell-lastActivity="props">
          <q-td :props="props">
            {{ props.row.lastActivityAt ? formatDate(props.row.lastActivityAt) : 'Never' }}
          </q-td>
        </template>

        <!-- Actions Column -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              round
              icon="o_visibility"
              size="sm"
              @click="viewDevice(props.row)"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="o_edit"
              size="sm"
              @click="editDevice(props.row)"
            >
              <q-tooltip>Edit Device</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="o_key"
              size="sm"
              @click="regenerateKey(props.row)"
            >
              <q-tooltip>Regenerate API Key</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="o_delete"
              size="sm"
              color="negative"
              @click="deleteDevice(props.row)"
            >
              <q-tooltip>Delete Device</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Device Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card flat bordered class="md3-dialog-dense">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingDevice ? 'Edit' : 'Add' }} Device</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveDevice" class="q-gutter-md">
            <q-input
              v-model="deviceForm.name"
              label="Device Name"
              outlined
              dense
              :rules="[val => !!val || 'Name is required']"
            />

            <q-input
              v-model="deviceForm.location"
              label="Location"
              outlined
              dense
              hint="Where is this device located?"
            />

            <q-select
              v-model="deviceForm.projectId"
              :options="projectOptions"
              label="Branch/Project (Optional)"
              outlined
              dense
              clearable
              emit-value
              map-options
            />

            <q-toggle
              v-if="editingDevice"
              v-model="deviceForm.isActive"
              label="Device Active"
              color="primary"
            />

            <div class="row q-gutter-sm q-pt-md">
              <q-btn
                type="submit"
                unelevated
                color="primary"
                label="Save"
                :loading="saving"
              />
              <q-btn
                flat
                color="grey"
                label="Cancel"
                v-close-popup
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Device Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card flat bordered class="md3-dialog-dense" style="min-width: 500px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Device Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedDevice">
          <div class="q-gutter-sm">
            <div class="row">
              <div class="col-4 text-grey-7">Device ID:</div>
              <div class="col-8 text-weight-medium">{{ selectedDevice.deviceId }}</div>
            </div>
            <div class="row">
              <div class="col-4 text-grey-7">Name:</div>
              <div class="col-8">{{ selectedDevice.name }}</div>
            </div>
            <div class="row">
              <div class="col-4 text-grey-7">Location:</div>
              <div class="col-8">{{ selectedDevice.location || 'Not specified' }}</div>
            </div>
            <div class="row">
              <div class="col-4 text-grey-7">Status:</div>
              <div class="col-8">
                <q-chip
                  dense
                  :color="selectedDevice.isActive ? 'positive' : 'negative'"
                  text-color="white"
                  size="sm"
                >
                  {{ selectedDevice.isActive ? 'Active' : 'Inactive' }}
                </q-chip>
              </div>
            </div>
            <div class="row">
              <div class="col-4 text-grey-7">Created:</div>
              <div class="col-8">{{ formatDate(selectedDevice.createdAt) }}</div>
            </div>
            <div class="row">
              <div class="col-4 text-grey-7">Last Activity:</div>
              <div class="col-8">{{ selectedDevice.lastActivityAt ? formatDate(selectedDevice.lastActivityAt) : 'Never' }}</div>
            </div>

            <!-- API Key Section (only shown after regeneration) -->
            <div v-if="newApiKey" class="q-mt-md">
              <q-card flat bordered class="bg-warning-1">
                <q-card-section>
                  <div class="text-weight-medium q-mb-sm">New API Key Generated!</div>
                  <div class="text-caption text-negative q-mb-sm">
                    Save this key now. It won't be shown again.
                  </div>
                  <q-input
                    v-model="newApiKey"
                    readonly
                    outlined
                    dense
                    class="q-mb-sm"
                  >
                    <template v-slot:append>
                      <q-btn
                        flat
                        dense
                        icon="o_content_copy"
                        @click="copyApiKey"
                      />
                    </template>
                  </q-input>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card flat bordered class="md3-dialog-dense">
        <q-card-section class="row items-center">
          <q-icon name="o_warning" color="warning" size="md" class="q-mr-sm" />
          <div>
            <div class="text-h6">Delete Device</div>
            <div class="text-grey-7">Are you sure you want to delete this device?</div>
            <div class="text-caption text-negative">This action cannot be undone.</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn
            unelevated
            label="Delete"
            color="negative"
            @click="confirmDelete"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </expanded-nav-page-container>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

const { proxy } = getCurrentInstance();
const $q = useQuasar();

// Data
const devices = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showAddDialog = ref(false);
const showViewDialog = ref(false);
const showDeleteDialog = ref(false);
const editingDevice = ref(null);
const selectedDevice = ref(null);
const newApiKey = ref('');
const projectOptions = ref([]);

const deviceForm = ref({
  name: '',
  location: '',
  projectId: null,
  isActive: true,
});

// Table configuration
const columns = [
  {
    name: 'deviceId',
    label: 'Device ID',
    field: 'deviceId',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'location',
    label: 'Location',
    field: 'location',
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status',
    field: 'isActive',
    align: 'center',
  },
  {
    name: 'lastActivity',
    label: 'Last Activity',
    field: 'lastActivityAt',
    align: 'left',
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center',
  },
];

const pagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

// Methods
const loadDevices = async () => {
  loading.value = true;
  try {
    const response = await proxy.$api.get('/manpower/devices?includeInactive=true');
    devices.value = response.data;
  } catch (error) {
    console.error('Error loading devices:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load devices',
    });
  } finally {
    loading.value = false;
  }
};

const loadProjects = async () => {
  try {
    const response = await proxy.$api.get('/project/list');
    if (response.data && Array.isArray(response.data)) {
      projectOptions.value = response.data.map(p => ({
        label: p.name,
        value: p.id,
      }));
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
};

const viewDevice = (device) => {
  selectedDevice.value = device;
  newApiKey.value = '';
  showViewDialog.value = true;
};

const editDevice = (device) => {
  editingDevice.value = device;
  deviceForm.value = {
    name: device.name,
    location: device.location || '',
    projectId: device.projectId,
    isActive: device.isActive,
  };
  showAddDialog.value = true;
};

const saveDevice = async () => {
  saving.value = true;
  try {
    if (editingDevice.value) {
      // Update existing device
      await proxy.$api.put(`/manpower/devices/${editingDevice.value.id}`, deviceForm.value);
      $q.notify({
        type: 'positive',
        message: 'Device updated successfully',
      });
    } else {
      // Create new device
      await proxy.$api.post('/manpower/devices', deviceForm.value);
      $q.notify({
        type: 'positive',
        message: 'Device created successfully',
      });
    }

    showAddDialog.value = false;
    loadDevices();
    resetForm();
  } catch (error) {
    console.error('Error saving device:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save device',
    });
  } finally {
    saving.value = false;
  }
};

const regenerateKey = async (device) => {
  $q.dialog({
    title: 'Regenerate API Key',
    message: 'Are you sure you want to regenerate the API key? The old key will stop working immediately.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await proxy.$api.post(`/manpower/devices/${device.id}/regenerate-key`);

      // Update the device in the list
      const index = devices.value.findIndex(d => d.id === device.id);
      if (index >= 0) {
        devices.value[index] = response.data.device;
      }

      // Show the new API key
      selectedDevice.value = response.data.device;
      newApiKey.value = response.data.apiKey;
      showViewDialog.value = true;

      $q.notify({
        type: 'positive',
        message: 'API key regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating key:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to regenerate API key',
      });
    }
  });
};

const deleteDevice = (device) => {
  selectedDevice.value = device;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await proxy.$api.delete(`/manpower/devices/${selectedDevice.value.id}`);
    $q.notify({
      type: 'positive',
      message: 'Device deleted successfully',
    });
    showDeleteDialog.value = false;
    loadDevices();
  } catch (error) {
    console.error('Error deleting device:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to delete device',
    });
  } finally {
    deleting.value = false;
  }
};

const copyApiKey = () => {
  navigator.clipboard.writeText(newApiKey.value);
  $q.notify({
    type: 'positive',
    message: 'API key copied to clipboard',
  });
};

const resetForm = () => {
  editingDevice.value = null;
  deviceForm.value = {
    name: '',
    location: '',
    projectId: null,
    isActive: true,
  };
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Lifecycle
onMounted(() => {
  loadDevices();
  loadProjects();
});
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

.md3-dialog-dense {
  min-width: 400px;
  max-width: 600px;
}

.bg-warning-1 {
  background-color: #fff3cd;
  border-color: #ffc107;
}
</style>