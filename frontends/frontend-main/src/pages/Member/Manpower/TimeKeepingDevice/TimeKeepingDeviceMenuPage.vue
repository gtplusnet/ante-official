<template>
  <expanded-nav-page-container>
    <div>
      <div class="page-head">
        <div>
          <div class="text-title-large">Time Keeping Device</div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
            <q-breadcrumbs-el label="Configuration" />
            <q-breadcrumbs-el label="Time Keeping Device" />
          </q-breadcrumbs>
        </div>
      </div>
    </div>
    <div class="flex justify-center items-center q-pa-lg">
      <p class="text-label-medium text-grey-6">Under Development Time Keeping Device</p>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

export default {
  name: 'TimeKeepingDeviceMenuPage',
  props: {},
  components: {
    ExpandedNavPageContainer,
  },
};
</script>
