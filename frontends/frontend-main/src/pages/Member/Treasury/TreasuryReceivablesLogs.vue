<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <CollectionLogsTable />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import CollectionLogsTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionLogsTable.vue";

export default {
  name: 'TreasuryReceivablesLogs',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    CollectionLogsTable,
  },
};
</script>