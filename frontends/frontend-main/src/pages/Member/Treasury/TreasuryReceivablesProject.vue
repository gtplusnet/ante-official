<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <CollectionByProjectTable />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import CollectionByProjectTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionByProjectTable.vue";

export default {
  name: 'TreasuryReceivablesProject',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    CollectionByProjectTable,
  },
};
</script>