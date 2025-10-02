<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Payslip Center</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Payroll" />
              <q-breadcrumbs-el label="Payslip Center" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center items-center q-pa-lg">
      <p class="text-label-medium text-grey-6">Under Development Payslip Center</p>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

export default {
  name: 'PayslipCenterMenuPage',
  props: {},
  components: {
    ExpandedNavPageContainer,
  },
};
</script>
