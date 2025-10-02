<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <CollectionClientTable />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import CollectionClientTable from "../../../pages/Member/Treasury/components/tables/TreasuryCollectionClientTable.vue";

export default {
  name: 'TreasuryReceivablesClient',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    CollectionClientTable,
  },
};
</script>