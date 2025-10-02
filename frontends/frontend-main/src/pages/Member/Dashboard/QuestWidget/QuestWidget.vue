<template>
  <div>
    <q-card class="card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-small">
              {{ this.authStore.accountInformation.role.name }} Quests
              <span class="text-grey text-label-medium">({{ questBoardItems.length }})</span>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <!-- task loading -->
        <q-scroll-area class="task-content">
          <template v-if="isQuestBoardItemsLoading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- no task loaded -->
            <div class="task-empty text-label-medium" v-if="questBoardItems.length == 0">
              No Unassigned Tasks
            </div>
            <div v-else>
              <quest-item-partial :questItems="questBoardItems" />
            </div>
          </template>
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped src="./QuestWidget.scss"></style>
<script>
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import QuestItemPartial from './Partials/QuestItemPartial/QuestItemPartial.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'QuestWidget',
  components: {
    GlobalLoader,
    QuestItemPartial,
  },
  data: () => ({
    questBoardItems: [],
    isQuestBoardItemsLoading: false,
  }),
  mounted() {
    this.getQuestBoardItems();
    this.watchReloadQuestBoardItems();
  },
  methods: {
    watchReloadQuestBoardItems() {
      this.$bus.on('reloadTaskList', () => {
        this.getQuestBoardItems();
      });
    },
    getQuestBoardItems() {
      this.isQuestBoardItemsLoading = true;
      api
        .get('/task/quest-task')
        .then((response) => {
          // Handle the new response format where tasks are in the 'items' property
          this.questBoardItems = response.data.items || response.data;
          this.isQuestBoardItemsLoading = false;
        })
        .catch((error) => {
          this.handleAxiosError(error);
          this.isQuestBoardItemsLoading = false;
        });
    },
  },
  computed: {},
};
</script>
