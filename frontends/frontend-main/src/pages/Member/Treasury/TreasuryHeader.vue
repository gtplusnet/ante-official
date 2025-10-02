<template>
  <div class="page-head">
    <div class="title text-headline-small">Treasury</div>
  </div>
  <div class="bread-crumbs">
    <q-breadcrumbs class="text-body-small">
      <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
      <q-breadcrumbs-el label="Treasury" />
    </q-breadcrumbs>
  </div>
</template>

<script>
export default {
  name: 'MembeTreasuryHeader',
  props: {},
  data: () => ({
    form: {},
  }),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
