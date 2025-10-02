<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <PettyCashLiquidations ref="liquidations" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import PettyCashLiquidations from "../../../pages/Member/Treasury/components/tables/TreasuryPettyCashLiquidationsTable.vue";

export default {
  name: 'TreasuryPettyCashLiquidation',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    PettyCashLiquidations,
  },
};
</script>