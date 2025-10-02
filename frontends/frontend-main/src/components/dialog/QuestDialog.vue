<template>
  <q-dialog v-model="isOpen" position="right" maximized class="quest-dialog">
    <q-card class="quest-card">
      <!-- Header -->
      <q-card-section class="quest-header">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-title-large">Super Admin Quest <span class="text-grey">(0)</span></div>
          </div>
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="text-label-small">Close</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
      <q-card-section class="quest-content">
        <div class="quest-content-body">
          <div class="q-pa-xl text-center text-label-medium text-grey">No Tasks.</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref } from 'vue';
export default {
  name: 'QuestDialog',
  props: {},

  setup() {
    const isOpen = ref(false);
    return {
      isOpen,
    };
  },
};
</script>

<style lang="scss" scoped>
.quest-dialog {
  .quest-card {
    width: 400px;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .quest-header {
    border-bottom: 1px solid #e0e0e0;
    background: #f6f8fb;
  }

  .quest-content {
    height: 100%;

    .quest-content-body {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
