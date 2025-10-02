<template>
  <div>
    <div class="page-head">
      <div>
        <div class="text-dark text-headline-small">Proposal Templates</div>
        <div class="bread-crumbs text-body-small">
          <q-breadcrumbs>
            <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
            <q-breadcrumbs-el label="Leads" :to="{ name: 'member_leads_dashboard' }" />
            <q-breadcrumbs-el label="Templates" />
            <q-breadcrumbs-el label="Proposal" />
          </q-breadcrumbs>
        </div>
      </div>
      <div>
        <q-btn class="actions text-label-large" unelevated color="primary" no-caps icon="add" label="Create Proposal" />
      </div>
    </div>

    <div class="page-content q-mt-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">Proposal Templates</div>
          <div class="text-subtitle2 text-grey-7 q-mt-sm">Create and manage proposal templates</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-center text-grey-6 q-pa-xl">
            <q-icon name="o_request_quote" size="80px" color="grey-5" />
            <div class="text-h6 q-mt-md">No proposals yet</div>
            <div class="text-body2 q-mt-sm">Start by creating your first proposal template</div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'LeadsProposal',
});
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-content {
  padding: 0;
}
</style>