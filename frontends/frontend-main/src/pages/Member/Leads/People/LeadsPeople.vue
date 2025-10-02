<template>
  <div>
    <div class="page-head">
      <div>
        <div class="text-dark text-headline-small">People</div>
        <div class="bread-crumbs text-body-small">
          <q-breadcrumbs>
            <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
            <q-breadcrumbs-el label="Leads" :to="{ name: 'member_leads_dashboard' }" />
            <q-breadcrumbs-el label="Companies" />
            <q-breadcrumbs-el label="People" />
          </q-breadcrumbs>
        </div>
      </div>
      <div>
        <q-btn class="actions text-label-large" unelevated color="primary" no-caps icon="add" label="Add Person" />
      </div>
    </div>

    <div class="page-content q-mt-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">People Management</div>
          <div class="text-subtitle2 text-grey-7 q-mt-sm">Manage contacts and individuals</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-center text-grey-6 q-pa-xl">
            <q-icon name="o_people" size="80px" color="grey-5" />
            <div class="text-h6 q-mt-md">No people yet</div>
            <div class="text-body2 q-mt-sm">Start by adding your first contact</div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'LeadsPeople',
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