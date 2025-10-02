<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Queue Log Information</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div>
          <label class="q-mt-md q-mb-sm text-label-medium">
            Queue Name:
          </label>
          <pre class="text-body-small">{{ queueLogInfo.message }}</pre>
        </div>
        <div>
          <label class="q-mt-md q-mb-sm text-label-medium">
            Status
          </label>
          <pre class="text-body-small">{{ queueLogInfo.status }}</pre>
        </div>

        <div>
          <label class="q-mt-md q-mb-sm text-label-medium">
            Creation Date
          </label>
          <pre class="text-body-small">{{ queueLogInfo.createdAt }}</pre>
        </div>

        <div class="q-mt-md">
          <label class="q-mt-md q-mb-sm text-label-medium">
            Params
          </label>
          <pre class="text-body-small">{{ queueLogInfo.params }}</pre>
        </div>

        <div v-if="queueLogInfo.errorStatus" class="q-mt-md">
          <label class="q-mt-md q-mb-sm text-label-medium">
            Error
          </label>
          <pre class="text-body-small">{{ queueLogInfo.errorStatus }}</pre>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
}

pre {
  background-color: #333;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>

<script lang="ts">
import { QueueLogResponse } from "@shared/response";

export default {
  name: 'QueueLogInfoDialog',
  props: {
    queueLogInfo: {
      type: Object as () => QueueLogResponse,
      required: true,
    },
  },
  data: () => ({
  }),
  watch: {
  },
  methods: {
    fetchData() {
    },
  },
};
</script>
