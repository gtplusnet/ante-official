<template>
  <ManpowerNavigation>
    <div class="page-head">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Service Incentives Leaves</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Service Incentives Leaves" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center items-center q-pa-lg">
      <p>Under Development Service Incentives Leaves</p>
    </div>
  </ManpowerNavigation>
</template>

<script lang="ts">
import ManpowerNavigation from "../../../../pages/Member/Manpower/ManpowerNavigation.vue";

export default {
  name: 'ServiceIncentivesLeavesMenuPage',
  props: {},
  components: {
    ManpowerNavigation,
  },
};
</script>
