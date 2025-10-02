<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <ForReviewsTable />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import ForReviewsTable from "../../../components/tables/ForReviewsTable.vue";

export default {
  name: 'TreasuryReceivablesReview',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    ForReviewsTable,
  },
};
</script>