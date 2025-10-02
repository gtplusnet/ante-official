<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title text-title-large">
            {{ activeTab == 'national_holiday' ? 'National Holiday' : 'Local Holiday' }}
          </div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Holiday" />
              <q-breadcrumbs-el :label="activeTab == 'national_holiday' ? 'National Holiday' : 'Local Holiday'" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>

    <div class="page-tabs">
      <div v-for="tab in tabList" :key="tab.column" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''" @click="activeTab = tab.key">
        {{ tab.name }}
      </div>
    </div>
    <div class="q-mt-md">
      <!-- National Holiday Page -->
      <NationalHolidayTabPage v-if="activeTab == 'national_holiday'" />
      <!-- Local Holiday Page -->
      <LocalHolidayTabPage v-if="activeTab == 'local_holiday'" />
    </div>
  </expanded-nav-page-container>
</template>

<script>
import LocalHolidayTabPage from './LocalHolidayTabPage.vue';
import NationalHolidayTabPage from './NationalHolidayTabPage.vue';
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';

export default {
  name: 'HolidayHeaderMenuPage',
  components: {
    NationalHolidayTabPage,
    ExpandedNavPageContainer,
    LocalHolidayTabPage,
  },
  props: {},
  data: () => ({
    activeTab: 'national_holiday',
    tabList: [
      { name: 'National Holiday', key: 'national_holiday' },
      { name: 'Local Holiday', key: 'local_holiday' },
    ],
    form: {},
  }),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
