<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Device License Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_device_management' }" />
              <q-breadcrumbs-el label="Devices" />
              <q-breadcrumbs-el label="Device Licenses" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="openGenerateLicensesDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Generate Licenses
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
            />
          </div>
        </template>

        <!-- Gate Slot -->
        <template v-slot:gate="props">
          <div v-if="props.data.gate">
            <q-badge color="primary" text-color="white">
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
            <span>{{ props.data.connectedDevice ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </template>

        <!-- Connected Device Slot -->
        <template v-slot:connectedDevice="props">
          <div v-if="props.data.connectedDevice">
            <div class="text-weight-medium">{{ props.data.connectedDevice.deviceName }}</div>
            <div class="text-caption text-grey-6">{{ props.data.connectedDevice.macAddress }}</div>
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

        <!-- Row Actions -->
        <template v-slot:row-actions="props">
          <q-btn color="grey-7" round flat icon="more_horiz">
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div clickable @click="copyLicenseKey(props.data.licenseKey)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="content_copy" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Copy License Key</div>
                </div>
                <div clickable @click="editLicense(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="edit" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Edit</div>
                </div>
                <div clickable @click="regenerateLicense(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="refresh" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Regenerate Key</div>
                </div>
                <div clickable @click="toggleStatus(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon :name="props.data.isActive ? 'block' : 'check_circle'" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">{{ props.data.isActive ? 'Deactivate' : 'Activate' }}</div>
                </div>
                <div clickable @click="deleteLicense(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="delete" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Delete</div>
                </div>
              </div>
            </q-menu>
          </q-btn>
        </template>
      </g-table>
    </g-card>

    <!-- Dialogs -->
    <GenerateLicensesDialog 
      @generateDone="handleTableRefetch" 
      v-model="openGenerateDialog" 
    />

    <EditLicenseDialog 
      @saveDone="handleTableRefetch" 
      :licenseData="licenseData" 
      v-model="openEditDialog" 
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import GenerateLicensesDialog from './dialogs/GenerateLicensesDialog.vue';
import EditLicenseDialog from './dialogs/EditLicenseDialog.vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

interface DeviceLicenseResponse {
  id: number;
  licenseKey: string;
  gateId: string | null;
  gate: {
    id: string;
    gateName: string;
  } | null;
  isActive: boolean;
  dateFirstUsed: string | null;
  dateLastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  connectedDevice: {
    id: number;
    deviceName: string;
    macAddress: string;
    ipAddress: string | null;
    isConnected: boolean;
    lastSeen: string;
    connectionCount: number;
    createdAt: string;
  } | null;
}


export default defineComponent({
  name: 'DeviceManagement',
  components: {
    ExpandedNavPageContainer,
GTable,
    GCard,
    GenerateLicensesDialog,
    EditLicenseDialog,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<any>(null);
    const openGenerateDialog = ref(false);
    const openEditDialog = ref(false);
    const licenseData = ref<DeviceLicenseResponse | null>(null);
    
    const handleTableRefetch = () => {
      if (table.value) {
        table.value.refetch();
      }
    };

    const openGenerateLicensesDialog = () => {
      openGenerateDialog.value = true;
    };

    const editLicense = (license: DeviceLicenseResponse) => {
      licenseData.value = license;
      openEditDialog.value = true;
    };

    const copyLicenseKey = (licenseKey: string) => {
      navigator.clipboard.writeText(licenseKey).then(() => {
        $q.notify({
          type: 'positive',
          message: 'License key copied to clipboard',
          position: 'top',
        });
      }).catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy license key',
          position: 'top',
        });
      });
    };

    const regenerateLicense = async (license: DeviceLicenseResponse) => {
      $q.dialog({
        title: 'Regenerate License Key',
        message: 'Are you sure you want to regenerate this license key? This will create a new key and reset usage dates.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          const response = await api.post('/school/device-license/regenerate', {
            id: license.id,
          });
          
          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'License key regenerated successfully',
              position: 'top',
            });
            handleTableRefetch();
          }
        } catch (error) {
          handleAxiosError($q, error as AxiosError);
        }
      });
    };

    const toggleStatus = async (license: DeviceLicenseResponse) => {
      const action = license.isActive ? 'deactivate' : 'activate';
      
      $q.dialog({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} License`,
        message: `Are you sure you want to ${action} this license?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          const response = await api.put('/school/device-license/update', {
            id: license.id,
            isActive: !license.isActive,
          });
          
          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: `License ${action}d successfully`,
              position: 'top',
            });
            handleTableRefetch();
          }
        } catch (error) {
          handleAxiosError($q, error as AxiosError);
        }
      });
    };

    const deleteLicense = async (license: DeviceLicenseResponse) => {
      $q.dialog({
        title: 'Delete License',
        message: 'Are you sure you want to delete this license? This action cannot be undone.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          const response = await api.delete('/school/device-license/delete', {
            data: { ids: [license.id] },
          });
          
          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'License deleted successfully',
              position: 'top',
            });
            handleTableRefetch();
          }
        } catch (error) {
          handleAxiosError($q, error as AxiosError);
        }
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return {
      table,
      openGenerateDialog,
      openEditDialog,
      licenseData,
      handleTableRefetch,
      openGenerateLicensesDialog,
      editLicense,
      copyLicenseKey,
      regenerateLicense,
      toggleStatus,
      deleteLicense,
      formatDate,
    };
  },
});
</script>

<style scoped>
.license-key {
  font-family: 'Courier New', monospace;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #2c3e50;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}
</style>