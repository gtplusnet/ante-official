<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Push Notification Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" />
              <q-breadcrumbs-el label="Guardian API" />
              <q-breadcrumbs-el label="Push Notifications" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscribers List -->
    <g-card class="q-pa-md q-mb-md">
      <div class="text-h6 q-mb-md">Subscribed Guardians</div>
      
      <div class="row q-gutter-md q-mb-md">
        <q-chip color="primary" text-color="white" icon="people">
          {{ totalSubscribers }} Guardian{{ totalSubscribers !== 1 ? 's' : '' }}
        </q-chip>
        <q-chip color="secondary" text-color="white" icon="devices">
          {{ totalDevices }} Device{{ totalDevices !== 1 ? 's' : '' }}
        </q-chip>
      </div>

      <q-table
        :rows="subscriberRows"
        :columns="columns"
        row-key="guardianId"
        :loading="loading"
        :pagination="pagination"
        flat
        selection="multiple"
        v-model:selected="selectedGuardians"
        class="subscriber-table"
      >
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.email }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-devices="props">
          <q-td :props="props">
            <div v-for="(device, index) in props.row.devices" :key="index" class="q-mb-xs">
              <q-chip size="sm" :color="getDeviceColor(device.deviceType)" text-color="white">
                <q-icon :name="getDeviceIcon(device.deviceType)" size="xs" class="q-mr-xs" />
                {{ device.deviceType }}
              </q-chip>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-subscribedAt="props">
          <q-td :props="props">
            {{ formatDate(props.row.subscribedAt) }}
          </q-td>
        </template>

        <template v-slot:body-cell-lastActive="props">
          <q-td :props="props">
            {{ formatDate(props.row.lastActive) }}
          </q-td>
        </template>
      </q-table>
    </g-card>

    <!-- Send Notification Panel -->
    <g-card class="q-pa-md">
      <div class="text-h6 q-mb-md">Send Notification</div>
      
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-input
            v-model="notificationTitle"
            label="Notification Title *"
            outlined
            dense
            :rules="[val => !!val || 'Title is required']"
            maxlength="100"
            counter
          />
        </div>
        
        <div class="col-12">
          <q-input
            v-model="notificationBody"
            label="Notification Message *"
            outlined
            dense
            type="textarea"
            rows="4"
            :rules="[val => !!val || 'Message is required']"
            maxlength="500"
            counter
          />
        </div>

        <div class="col-12">
          <q-banner v-if="selectedGuardians.length > 0" class="bg-blue-1 text-primary" rounded dense>
            <template v-slot:avatar>
              <q-icon name="info" color="primary" />
            </template>
            {{ selectedGuardians.length }} guardian{{ selectedGuardians.length !== 1 ? 's' : '' }} selected
          </q-banner>
        </div>

        <div class="col-12">
          <div class="row q-gutter-sm">
            <q-btn
              label="Send to All"
              color="primary"
              unelevated
              no-caps
              icon="send"
              :loading="sending"
              :disable="!notificationTitle || !notificationBody || totalSubscribers === 0"
              @click="sendToAll"
            />
            <q-btn
              label="Send to Selected"
              color="secondary"
              unelevated
              no-caps
              icon="send"
              :loading="sending"
              :disable="!notificationTitle || !notificationBody || selectedGuardians.length === 0"
              @click="sendToSelected"
            />
            <q-btn
              label="Clear Selection"
              color="grey-7"
              flat
              no-caps
              :disable="selectedGuardians.length === 0"
              @click="selectedGuardians = []"
            />
          </div>
        </div>
      </div>
    </g-card>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import GCard from 'src/components/shared/display/GCard.vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';

interface Device {
  deviceId: string;
  deviceType: string;
  subscribedAt: string;
  lastActive: string;
}

interface Subscriber {
  guardianId: string;
  firstName: string;
  lastName: string;
  email: string;
  devices: Device[];
}

interface SubscriberRow {
  guardianId: string;
  name: string;
  email: string;
  devices: Device[];
  subscribedAt: string;
  lastActive: string;
}

export default defineComponent({
  name: 'GuardianNotifications',
  components: {
    ExpandedNavPageContainer,
    GCard,
  },
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const sending = ref(false);
    const subscribers = ref<Subscriber[]>([]);
    const totalSubscribers = ref(0);
    const totalDevices = ref(0);
    const selectedGuardians = ref<SubscriberRow[]>([]);
    const notificationTitle = ref('');
    const notificationBody = ref('');

    const pagination = ref({
      rowsPerPage: 10,
    });

    const columns = [
      {
        name: 'name',
        label: 'Guardian Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'devices',
        label: 'Devices',
        field: 'devices',
        align: 'left' as const,
      },
      {
        name: 'subscribedAt',
        label: 'Subscription Date',
        field: 'subscribedAt',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'lastActive',
        label: 'Last Active',
        field: 'lastActive',
        align: 'left' as const,
        sortable: true,
      },
    ];

    const subscriberRows = computed<SubscriberRow[]>(() => {
      return subscribers.value.map((subscriber) => {
        const earliestDevice = subscriber.devices.reduce((earliest, device) => {
          return new Date(device.subscribedAt) < new Date(earliest.subscribedAt)
            ? device
            : earliest;
        }, subscriber.devices[0]);

        const latestDevice = subscriber.devices.reduce((latest, device) => {
          return new Date(device.lastActive) > new Date(latest.lastActive)
            ? device
            : latest;
        }, subscriber.devices[0]);

        return {
          guardianId: subscriber.guardianId,
          name: `${subscriber.firstName} ${subscriber.lastName}`,
          email: subscriber.email,
          devices: subscriber.devices,
          subscribedAt: earliestDevice.subscribedAt,
          lastActive: latestDevice.lastActive,
        };
      });
    });

    const fetchSubscribers = async () => {
      loading.value = true;
      try {
        const response = await api.get('school/guardian/notifications/subscribers');
        subscribers.value = response.data.subscribers;
        totalSubscribers.value = response.data.totalSubscribers;
        totalDevices.value = response.data.totalDevices;
      } catch (error) {
        console.error('Error fetching subscribers:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load subscribers',
        });
      } finally {
        loading.value = false;
      }
    };

    const sendNotification = async (guardianIds: string[]) => {
      if (!notificationTitle.value || !notificationBody.value) {
        $q.notify({
          type: 'warning',
          message: 'Please enter both title and message',
        });
        return;
      }

      sending.value = true;
      try {
        const response = await api.post('school/guardian/notifications/send', {
          title: notificationTitle.value,
          body: notificationBody.value,
          guardianIds,
        });

        $q.notify({
          type: 'positive',
          message: response.data.message || 'Notification sent successfully',
        });

        // Clear form
        notificationTitle.value = '';
        notificationBody.value = '';
        selectedGuardians.value = [];
      } catch (error: any) {
        console.error('Error sending notification:', error);
        $q.notify({
          type: 'negative',
          message: error?.response?.data?.message || 'Failed to send notification',
        });
      } finally {
        sending.value = false;
      }
    };

    const sendToAll = async () => {
      $q.dialog({
        title: 'Confirm',
        message: `Send notification to all ${totalSubscribers.value} guardian(s)?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        await sendNotification([]);
      });
    };

    const sendToSelected = async () => {
      const guardianIds = selectedGuardians.value.map(g => g.guardianId);
      $q.dialog({
        title: 'Confirm',
        message: `Send notification to ${guardianIds.length} selected guardian(s)?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        await sendNotification(guardianIds);
      });
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    const getDeviceIcon = (deviceType: string) => {
      switch (deviceType.toLowerCase()) {
        case 'android':
          return 'phone_android';
        case 'ios':
          return 'phone_iphone';
        case 'web':
          return 'language';
        default:
          return 'devices';
      }
    };

    const getDeviceColor = (deviceType: string) => {
      switch (deviceType.toLowerCase()) {
        case 'android':
          return 'green';
        case 'ios':
          return 'blue-grey';
        case 'web':
          return 'blue';
        default:
          return 'grey';
      }
    };

    onMounted(() => {
      fetchSubscribers();
    });

    return {
      loading,
      sending,
      subscribers,
      totalSubscribers,
      totalDevices,
      selectedGuardians,
      notificationTitle,
      notificationBody,
      columns,
      pagination,
      subscriberRows,
      sendToAll,
      sendToSelected,
      formatDate,
      getDeviceIcon,
      getDeviceColor,
    };
  },
});
</script>

<style scoped>
.subscriber-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
</style>

