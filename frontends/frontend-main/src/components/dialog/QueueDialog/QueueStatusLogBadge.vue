<template>
  <div>
   <q-badge
                v-if="log.status === 'COMPLETED'"
                color="primary"
                text-color="white"
                label="Completed"
                class="text-label-medium"
              />

              <q-badge
                v-else-if="log.status === 'FAILED'"
                color="red"
                text-color="white"
                label="Failed"
                class="text-label-medium"
              />

              <q-badge
                v-else-if="log.status === 'PROCESSING'"
                color="green"
                text-color="white"
                class="text-label-medium"
              >
                <q-icon name="cached" size="20px" class="custom-spinner q-mr-sm" />
                Processing
              </q-badge>

              <q-badge
                v-else-if="log.status === 'PENDING'"
                color="yellow"
                text-color="grey"
                label="Pending"
                class="text-label-medium"
              />
  </div>
</template>

<script lang="ts">
export default {
  name: 'QueueStatusBadge',
  props: {
    log: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return {};
  },
};
</script>
