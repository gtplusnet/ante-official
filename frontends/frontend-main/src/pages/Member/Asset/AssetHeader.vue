<template>
  <div class="page-head">
    <div class="title text-headline-small">Asset Management</div>
  </div>
  <div class="bread-crumbs text-body-small">
    <q-breadcrumbs>
      <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
      <q-breadcrumbs-el label="Asset Management" />
    </q-breadcrumbs>
  </div>
  <div class="page-tabs text-label-medium">
    <div @click="setActiveTab(tab.route)" v-for="tab in tabList"
      :class="tab.route == this.$route.name ? 'active' : 'inactive'" :key="tab.route" class="tab">
      {{ tab.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'MemberAssetHeader',
  props: {},
  data: () => ({
    tabList: [
      { name: 'Warehouse', route: 'member_asset' },
      { name: 'Item', route: 'member_asset_item' },
      { name: 'Purchasing', route: 'member_asset_purchasing' },
      { name: 'Deliveries', route: 'member_asset_deliveries' },
      { name: 'Equipment', route: 'member_asset_equipment' },
    ],
    form: {},
  }),
  mounted() { },
  methods: {
    setActiveTab(route) {
      this.$router.push({ name: route });
    },
  },
  computed: {},
};
</script>
