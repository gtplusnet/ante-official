<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>

    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab text-label-medium">
            <div
              v-for="tab in tabList"
              :key="tab.key"
              class="tab"
              :class="tab.key === activeTab ? 'active' : ''"
              @click="activeTab = tab.key"
            >
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="right">
        </div>
      </div>

      <g-card class="q-pa-md q-mt-sm">
        <CollectionByProjectTable v-if="activeTab == 'collection_by_project'" />
        <CollectionClientTable v-if="activeTab == 'collection_by_client'" />
        <CollectionLogsTable v-if="activeTab == 'collection_logs'" />
        <ForReviewsTable v-if="activeTab == 'for_review'" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import CollectionByProjectTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionByProjectTable.vue";
import CollectionClientTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionClientTable.vue";
import CollectionLogsTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionLogsTable.vue";
import ForReviewsTable from "../../../components/tables/ForReviewsTable.vue";
export default {
  name: 'TresuryReceivables',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    CollectionByProjectTable,
    CollectionClientTable,
    CollectionLogsTable,
    ForReviewsTable,
  },
  data: () => ({
    form: {},
    activeTab: 'collection_by_project',
    tabList: [
      {
        key: 'collection_by_project',
        name: 'Collection by Project',
      },
      {
        key: 'collection_by_client',
        name: 'Collection by Client',
      },
      {
        key: 'collection_logs',
        name: 'Collection Logs',
      },
      {
        key: 'for_review',
        name: 'For Review',
      },
    ],
  }),
  methods: {},
};
</script>
