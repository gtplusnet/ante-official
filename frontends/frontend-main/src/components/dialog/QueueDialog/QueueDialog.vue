<template>
  <q-dialog class="queue-dialog" ref="dialog" @before-hide="resetData" @before-show="initialLoad">
    <q-card class="full-width dialog-card">
      <q-card-section v-if="queueReponse">
        <div class="title text-title-small">{{ queueReponse.name }}</div>
        <q-linear-progress size="30px" stripe rounded :value="queueReponse.completePercentage.raw" color="primary" class="q-mt-sm">
          <div class="absolute-full flex flex-center">
            <q-badge color="white" text-color="accent" :label="queueReponse.completePercentage.formatPercentage" />
          </div>
        </q-linear-progress>

        <div class="q-mt-md">
          <label class="q-mt-md q-mb-sm text-label-medium">
            Status:
          </label>

          <queue-status-badge class="text-label-medium" :queueReponse="queueReponse"></queue-status-badge>
        </div>

        <div class="log-list">
          <div class="log" v-for="log in queueReponse.logs" :key="log.id" @click="openQueueLogInfoDialog(log)">
            <div class="message text-body-small">{{ log.message }}</div>
            <div class="status">
              <queue-status-log-badge :log="log"></queue-status-log-badge>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <QueueLogInfoDialog
      v-model="isQueueLogInfoDialogOpen"
      v-if="queueLogInfo"
      :queueLogInfo="queueLogInfo"
      ></QueueLogInfoDialog>
  </q-dialog>
</template>

<style lang="scss" src="./QueueDialog.scss"></style>
<script lang="ts">
import { api } from 'src/boot/axios';
import { ref, Ref } from 'vue';
import { QueueLogResponse, QueueResponse } from "@shared/response";
import QueueStatusBadge from './QueueStatusBadge.vue';
import QueueStatusLogBadge from './QueueStatusLogBadge.vue';
import QueueLogInfoDialog from './QueueLogInfoDialog.vue';
import { useQuasar } from 'quasar';


export default {
  name: 'QueueDialog',
  components: {
    QueueStatusBadge,
    QueueStatusLogBadge,
    QueueLogInfoDialog,
  },
  props: {
    queueId: {
      type: String,
      required: true,
    },
  },
  emits: ['completed'],

  setup(props, { emit }) {
    const $q = useQuasar();
  const queueReponse: Ref<null | QueueResponse> = ref(null);
    const isQueueLogInfoDialogOpen: Ref<boolean> = ref(false);
    const queueLogInfo: Ref<null | QueueLogResponse> = ref(null);
    const initialLoad = () => {
      $q.loading.show();
      fetchData();
    };
    const fetchData = async () => {

      api.get(`/queue/info?id=${props.queueId}`)
        .then((response) => {
          queueReponse.value = response.data;

          if (response.data.status != 'COMPLETED' && response.data.status != 'FAILED' && response.data.status != 'INCOMPLETE') {
            setTimeout(() => {
              fetchData();
            }, 1000);
          }
          else {
            if(response.data.status == 'COMPLETED') {
              emit('completed');
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching queue data:', error);
        }).finally(() => {
          $q.loading.hide();
        });
    };

    const resetData = () => {
      queueReponse.value = null;
    };

    const openQueueLogInfoDialog = (log: QueueLogResponse) => {
      queueLogInfo.value = log;
      isQueueLogInfoDialogOpen.value = true;
    };

    return {
      queueReponse,
      fetchData,
      resetData,
      openQueueLogInfoDialog,
      initialLoad,
      isQueueLogInfoDialogOpen,
      queueLogInfo,
    };
  },
};
</script>
