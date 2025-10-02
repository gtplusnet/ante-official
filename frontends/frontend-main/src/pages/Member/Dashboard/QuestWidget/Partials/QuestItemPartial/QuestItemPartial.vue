<template>
  <div class="q-pa-md q-gutter-md">
    <q-list class="q-gutter-md">
      <!-- Add q-gutter-md to the q-list -->
      <q-item
        v-for="item in questItems"
        :key="item.id"
        class="q-pa-sm quest-item"
        clickable
        @click="
          () => {
            selectedTask = item;
            isTaskInformationDialogOpen = true;
          }
        "
      >
        <q-item-section avatar>
          <q-icon name="note_add" class="q-ml-md" color="primary" size="34px" />
        </q-item-section>

        <q-item-section class="q-py-md">
          <q-item-label>
            <div>
              <span class="text-title-small">{{ item.title }}</span>
            </div>
            <div>
              <span class="text-grey-8 text-body-small">
                {{ item.description }}
              </span>
            </div>
          </q-item-label>
          <q-item-label>
            <q-chip
              v-for="(tag, index) in item.tags"
              :key="index"
              color="primary"
              text-color="white"
              size="sm text-label-medium"
            >
              {{ tag }}
            </q-chip>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <TaskInformationDialog
    v-model="isTaskInformationDialogOpen"
    v-if="selectedTask"
    :taskInformation="selectedTask"
    :task="selectedTask"
  />
</template>

<style scoped src="./QuestItemPartial.scss"></style>

<script>
import TaskInformationDialog from "../../../../../../components/dialog/TaskInformationDialog/TaskInformationDialog.vue";
export default {
  name: 'QuestItemPartial',
  components: {
    TaskInformationDialog,
  },
  props: {
    questItems: {
      type: Array,
    },
  },
  data: () => ({
    isTaskInformationDialogOpen: false,
    selectedTask: null,
  }),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
