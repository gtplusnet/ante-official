<template>
  <div class="page-head">
    <div class="title text-title-large">Scope Management</div>
    <div class="actions">
      <q-btn color="primary" unelevated rounded class="text-label-large">Create Scope</q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md">
    <g-table tableKey="scope" apiUrl="/scope" :apiFilters="[]" class="text-body-small"/>
  </div>
</template>

<script>
import GTable from "../../../components/shared/display/GTable.vue";

export default {
  name: 'SettingsScope',
  components: { GTable },
  computed: {},
};
</script>
