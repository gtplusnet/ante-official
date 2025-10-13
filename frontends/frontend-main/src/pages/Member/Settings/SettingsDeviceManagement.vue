<template>
  <div>
    <!-- Header Section -->
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">POS Device Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="Settings" />
              <q-breadcrumbs-el label="System" />
              <q-breadcrumbs-el label="Device Management" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="showAddDialog = true" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Add POS Device
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Devices Table -->
    <g-card class="q-pa-md">
      <q-table
        flat
        dense
        :rows="devices"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        no-data-label="No POS devices found"
      >
        <!-- Device ID Column -->
        <template v-slot:body-cell-deviceId="props">
          <q-td :props="props">
            <code class="device-id">{{ props.row.deviceId }}</code>
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              size="xs"
              color="grey-6"
              @click="copyToClipboard(props.row.deviceId, 'Device ID')"
              class="q-ml-xs"
            >
              <q-tooltip>Copy Device ID</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <!-- Branch Column -->
        <template v-slot:body-cell-branch="props">
          <q-td :props="props">
            <div v-if="props.row.branch">
              <q-badge color="primary" text-color="white">
                {{ props.row.branch.name }}
              </q-badge>
            </div>
            <span v-else class="text-grey-6">No branch assigned</span>
          </q-td>
        </template>

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
    </g-card>

    <!-- Add/Edit Device Dialog -->
    <AddEditPOSDeviceDialog
      v-model="showAddDialog"
      :device="editingDevice"
      @saved="handleDeviceSaved"
    />

    <!-- View Device Dialog -->
    <ViewPOSDeviceDialog
      v-model="showViewDialog"
      :device="selectedDevice"
      :new-api-key="newApiKey"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import GCard from 'src/components/shared/display/GCard.vue';

// Lazy-loaded dialogs (MANDATORY - CLAUDE.md)
const AddEditPOSDeviceDialog = defineAsyncComponent(() =>
  import('./dialogs/AddEditPOSDeviceDialog.vue')
);
const ViewPOSDeviceDialog = defineAsyncComponent(() =>
  import('./dialogs/ViewPOSDeviceDialog.vue')
);

const { proxy } = getCurrentInstance();
const $q = useQuasar();

// Data
const devices = ref([]);
const loading = ref(false);
const showAddDialog = ref(false);
const showViewDialog = ref(false);
const editingDevice = ref(null);
const selectedDevice = ref(null);
const newApiKey = ref('');

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
    name: 'branch',
    label: 'Branch',
    field: 'branch',
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
    const response = await proxy.$api.get('/pos-device?includeInactive=true');
    devices.value = response.data;
  } catch (error) {
    console.error('Error loading devices:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load POS devices',
    });
  } finally {
    loading.value = false;
  }
};

const viewDevice = (device) => {
  selectedDevice.value = device;
  newApiKey.value = '';
  showViewDialog.value = true;
};

const editDevice = (device) => {
  editingDevice.value = device;
  showAddDialog.value = true;
};

const regenerateKey = (device) => {
  $q.dialog({
    title: 'Regenerate API Key',
    message: 'Are you sure you want to regenerate the API key? The old key will stop working immediately.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await proxy.$api.post(`/pos-device/${device.id}/regenerate-key`);

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
        message: response.data.message || 'API key regenerated successfully',
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
  $q.dialog({
    title: 'Delete POS Device',
    message: `Are you sure you want to delete "${device.name}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await proxy.$api.delete(`/pos-device/${device.id}`);
      $q.notify({
        type: 'positive',
        message: 'POS device deleted successfully',
      });
      loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to delete POS device',
      });
    }
  });
};

const handleDeviceSaved = (data) => {
  showAddDialog.value = false;
  editingDevice.value = null;

  // If it's a new device with API key, show it
  if (data.apiKey) {
    selectedDevice.value = data.device;
    newApiKey.value = data.apiKey;
    showViewDialog.value = true;
  }

  loadDevices();
};

const copyToClipboard = (text, label = 'Text') => {
  navigator.clipboard.writeText(text);
  $q.notify({
    type: 'positive',
    message: `${label} copied to clipboard`,
    timeout: 1000,
  });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Lifecycle
onMounted(() => {
  loadDevices();
});
</script>

<style scoped lang="scss">
.page-head {
  margin-bottom: 20px;

  .title {
    font-size: 24px;
    font-weight: 500;
    color: $grey-9;
  }
}

.device-id {
  font-family: 'Courier New', monospace;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #1976d2;
}

.md3-dialog-dense {
  .q-card__section {
    padding: 16px;
  }
}

.bg-warning-1 {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 12px;
}
</style>
