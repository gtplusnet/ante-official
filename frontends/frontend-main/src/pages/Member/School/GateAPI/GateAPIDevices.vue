<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Gate Device Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" />
              <q-breadcrumbs-el label="Gate API" />
              <q-breadcrumbs-el label="Device Management" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="openGenerateLicensesDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Generate Device License
          </q-btn>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table
        :isRowActionEnabled="true"
        tableKey="deviceLicenseTable"
        apiUrl="school/device-license/table"
        ref="table"
      >
        <!-- License Key Slot -->
        <template v-slot:licenseKey="props">
          <div class="row items-center">
            <div class="q-mr-sm">
              <code class="license-key">{{ props.data.licenseKey }}</code>
            </div>
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              size="sm"
              color="grey-6"
              @click="copyLicenseKey(props.data.licenseKey)"
            >
              <q-tooltip>Copy license key</q-tooltip>
            </q-btn>
          </div>
        </template>

        <!-- Gate Slot -->
        <template v-slot:gate="props">
          <div v-if="props.data.gate">
            <q-badge color="green" text-color="white">
              <q-icon name="door_sliding" size="xs" class="q-mr-xs" />
              {{ props.data.gate.gateName }}
            </q-badge>
          </div>
          <span v-else class="text-grey-6">No gate assigned</span>
        </template>

        <!-- Connection Status Slot -->
        <template v-slot:connectionStatus="props">
          <div class="row items-center">
            <q-icon
              :name="props.data.connectedDevice ? 'wifi' : 'wifi_off'"
              :color="props.data.connectedDevice ? 'green' : 'grey'"
              size="sm"
              class="q-mr-sm"
            />
            <span :class="props.data.connectedDevice ? 'text-green' : 'text-grey-6'">
              {{ props.data.connectedDevice ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </template>

        <!-- Connected Device Slot -->
        <template v-slot:connectedDevice="props">
          <div v-if="props.data.connectedDevice">
            <div class="text-weight-medium">{{ props.data.connectedDevice.deviceName }}</div>
            <div class="text-caption text-grey-6">MAC: {{ props.data.connectedDevice.macAddress }}</div>
            <div class="text-caption text-grey-6">
              Last seen: {{ formatDate(props.data.connectedDevice.lastSeen) }}
            </div>
          </div>
          <span v-else class="text-grey-6">No device connected</span>
        </template>

        <!-- Date First Used Slot -->
        <template v-slot:dateFirstUsed="props">
          <span v-if="props.data.dateFirstUsed">{{ formatDate(props.data.dateFirstUsed) }}</span>
          <span v-else class="text-grey-6">Never used</span>
        </template>

        <!-- Date Last Used Slot -->
        <template v-slot:dateLastUsed="props">
          <span v-if="props.data.dateLastUsed">{{ formatDate(props.data.dateLastUsed) }}</span>
          <span v-else class="text-grey-6">Never used</span>
        </template>

        <!-- Status Slot -->
        <template v-slot:status="props">
          <q-badge :color="props.data.isActive ? 'green' : 'grey'" text-color="white">
            {{ props.data.isActive ? 'Active' : 'Inactive' }}
          </q-badge>
        </template>

        <!-- Action Slot -->
        <template v-slot:action="props">
          <q-btn
            flat
            dense
            round
            icon="visibility"
            color="grey-6"
            @click="viewLicense(props.data)"
          >
            <q-tooltip>View details</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="edit"
            color="grey-6"
            @click="editLicense(props.data)"
          >
            <q-tooltip>Edit license</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="refresh"
            color="warning"
            @click="regenerateLicense(props.data)"
          >
            <q-tooltip>Regenerate key</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(props.data)"
          >
            <q-tooltip>Delete license</q-tooltip>
          </q-btn>
        </template>
      </g-table>
    </g-card>

    <!-- Generate Licenses Dialog -->
    <q-dialog v-model="showGenerateDialog" persistent>
      <q-card style="min-width: 500px" class="md3-dialog-dense">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Generate Device Licenses</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <q-input
              v-model.number="generateForm.quantity"
              label="Number of Licenses"
              type="number"
              outlined
              :rules="[val => val > 0 || 'Must be greater than 0']"
            />

            <q-select
              v-model="generateForm.gateId"
              :options="gateOptions"
              label="Assign to Gate (Optional)"
              outlined
              clearable
              emit-value
              map-options
            />

            <q-input
              v-model="generateForm.prefix"
              label="License Key Prefix (Optional)"
              outlined
              hint="Example: SGK-2024"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
            label="Generate"
            color="primary"
            @click="generateLicenses"
            :loading="generating"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- View License Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 600px" class="md3-dialog-dense">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">License Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedLicense">
          <div class="q-gutter-sm">
            <div class="row">
              <div class="col-4 text-weight-medium">License Key:</div>
              <div class="col-8">
                <code>{{ selectedLicense.licenseKey }}</code>
                <q-btn
                  flat
                  dense
                  icon="content_copy"
                  size="sm"
                  color="grey-6"
                  @click="copyLicenseKey(selectedLicense.licenseKey)"
                  class="q-ml-sm"
                />
              </div>
            </div>

            <div class="row">
              <div class="col-4 text-weight-medium">Gate:</div>
              <div class="col-8">
                {{ selectedLicense.gate?.gateName || 'Not assigned' }}
              </div>
            </div>

            <div class="row">
              <div class="col-4 text-weight-medium">Status:</div>
              <div class="col-8">
                <q-badge :color="selectedLicense.isActive ? 'green' : 'grey'">
                  {{ selectedLicense.isActive ? 'Active' : 'Inactive' }}
                </q-badge>
              </div>
            </div>

            <div class="row">
              <div class="col-4 text-weight-medium">Created:</div>
              <div class="col-8">{{ formatDate(selectedLicense.createdAt) }}</div>
            </div>

            <div class="row">
              <div class="col-4 text-weight-medium">First Used:</div>
              <div class="col-8">{{ selectedLicense.dateFirstUsed ? formatDate(selectedLicense.dateFirstUsed) : 'Never' }}</div>
            </div>

            <div class="row">
              <div class="col-4 text-weight-medium">Last Used:</div>
              <div class="col-8">{{ selectedLicense.dateLastUsed ? formatDate(selectedLicense.dateLastUsed) : 'Never' }}</div>
            </div>

            <div v-if="selectedLicense.connectedDevice" class="q-mt-md">
              <q-separator class="q-my-md" />
              <div class="text-subtitle2 q-mb-sm">Connected Device</div>
              <div class="row">
                <div class="col-4 text-weight-medium">Device Name:</div>
                <div class="col-8">{{ selectedLicense.connectedDevice.deviceName }}</div>
              </div>
              <div class="row">
                <div class="col-4 text-weight-medium">MAC Address:</div>
                <div class="col-8">{{ selectedLicense.connectedDevice.macAddress }}</div>
              </div>
              <div class="row">
                <div class="col-4 text-weight-medium">IP Address:</div>
                <div class="col-8">{{ selectedLicense.connectedDevice.ipAddress }}</div>
              </div>
              <div class="row">
                <div class="col-4 text-weight-medium">Version:</div>
                <div class="col-8">{{ selectedLicense.connectedDevice.version }}</div>
              </div>
            </div>

            <div v-if="newLicenseKey" class="q-mt-md">
              <q-banner class="bg-warning-1 text-dark">
                <template v-slot:avatar>
                  <q-icon name="warning" color="warning" />
                </template>
                <div class="text-weight-medium">New License Key Generated!</div>
                <div>Please save this key securely. It will only be shown once.</div>
                <div class="q-mt-sm">
                  <code class="text-h6">{{ newLicenseKey }}</code>
                  <q-btn
                    flat
                    dense
                    icon="content_copy"
                    color="primary"
                    @click="copyLicenseKey(newLicenseKey)"
                    label="Copy"
                    class="q-ml-md"
                  />
                </div>
              </q-banner>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit License Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 500px" class="md3-dialog-dense">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit License</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <q-select
              v-model="editForm.gateId"
              :options="gateOptions"
              label="Assign to Gate"
              outlined
              clearable
              emit-value
              map-options
            />

            <q-toggle
              v-model="editForm.isActive"
              label="Active"
              color="primary"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
            label="Save"
            color="primary"
            @click="saveLicense"
            :loading="saving"
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
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';

const { proxy } = getCurrentInstance();
const $q = useQuasar();

// Data
const table = ref(null);
const showGenerateDialog = ref(false);
const showViewDialog = ref(false);
const showEditDialog = ref(false);
const generating = ref(false);
const saving = ref(false);
const selectedLicense = ref(null);
const newLicenseKey = ref('');
const gateOptions = ref([]);

const generateForm = ref({
  quantity: 1,
  gateId: null,
  prefix: '',
});

const editForm = ref({
  id: null,
  gateId: null,
  isActive: true,
});

// Methods
const loadGates = async () => {
  try {
    const response = await proxy.$api.get('/school/gate/list');
    if (response.data && Array.isArray(response.data)) {
      gateOptions.value = response.data.map(gate => ({
        label: gate.gateName,
        value: gate.id,
      }));
    }
  } catch (error) {
    console.error('Error loading gates:', error);
  }
};

const openGenerateLicensesDialog = () => {
  generateForm.value = {
    quantity: 1,
    gateId: null,
    prefix: '',
  };
  showGenerateDialog.value = true;
};

const generateLicenses = async () => {
  generating.value = true;
  try {
    const response = await proxy.$api.post('/school/device-license/generate', generateForm.value);

    $q.notify({
      type: 'positive',
      message: `${generateForm.value.quantity} license(s) generated successfully`,
    });

    showGenerateDialog.value = false;
    table.value?.refresh();

    // Show generated licenses if returned
    if (response.data && response.data.licenses && response.data.licenses.length > 0) {
      const licenses = response.data.licenses;
      $q.dialog({
        title: 'Generated Licenses',
        message: 'Please save these license keys securely. They will only be shown once.',
        html: true,
        persistent: true,
        ok: {
          label: 'Copy All',
          color: 'primary',
        },
        cancel: {
          label: 'Close',
        },
      }).onOk(() => {
        const keys = licenses.map(l => l.licenseKey).join('\n');
        copyToClipboard(keys);
      });
    }
  } catch (error) {
    console.error('Error generating licenses:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate licenses',
    });
  } finally {
    generating.value = false;
  }
};

const viewLicense = (license) => {
  selectedLicense.value = license;
  newLicenseKey.value = '';
  showViewDialog.value = true;
};

const editLicense = (license) => {
  selectedLicense.value = license;
  editForm.value = {
    id: license.id,
    gateId: license.gateId,
    isActive: license.isActive,
  };
  showEditDialog.value = true;
};

const saveLicense = async () => {
  saving.value = true;
  try {
    await proxy.$api.put('/school/device-license/update', editForm.value);

    $q.notify({
      type: 'positive',
      message: 'License updated successfully',
    });

    showEditDialog.value = false;
    table.value?.refresh();
  } catch (error) {
    console.error('Error updating license:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update license',
    });
  } finally {
    saving.value = false;
  }
};

const regenerateLicense = (license) => {
  $q.dialog({
    title: 'Regenerate License Key',
    message: 'Are you sure you want to regenerate this license key? The old key will stop working immediately.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await proxy.$api.post('/school/device-license/regenerate', {
        id: license.id,
      });

      if (response.data && response.data.newLicenseKey) {
        selectedLicense.value = response.data.license;
        newLicenseKey.value = response.data.newLicenseKey;
        showViewDialog.value = true;

        $q.notify({
          type: 'positive',
          message: 'License key regenerated successfully',
        });

        table.value?.refresh();
      }
    } catch (error) {
      console.error('Error regenerating license:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to regenerate license key',
      });
    }
  });
};

const confirmDelete = (license) => {
  $q.dialog({
    title: 'Delete License',
    message: `Are you sure you want to delete this license? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await proxy.$api.delete('/school/device-license/delete', {
        data: { ids: [license.id] },
      });

      $q.notify({
        type: 'positive',
        message: 'License deleted successfully',
      });

      table.value?.refresh();
    } catch (error) {
      console.error('Error deleting license:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to delete license',
      });
    }
  });
};

const copyLicenseKey = (key) => {
  copyToClipboard(key);
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    $q.notify({
      type: 'positive',
      message: 'Copied to clipboard',
      timeout: 1000,
    });
  }).catch(() => {
    $q.notify({
      type: 'negative',
      message: 'Failed to copy',
    });
  });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Lifecycle
onMounted(() => {
  loadGates();
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

.license-key {
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