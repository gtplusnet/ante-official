<template>
  <expanded-nav-page-container>
    <div class="page-content">
      <div class="page-head q-pb-md">
        <div>
          <div class="text-title-large title">Cut-Off Management</div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
            <q-breadcrumbs-el label="Configuration" />
            <q-breadcrumbs-el label="Cut-Off Management" />
          </q-breadcrumbs>
        </div>
        <div>
          <GButton @click="openDialog()" icon="add" label="Create Cut-Off" color="primary" class="text-label-large"/>
        </div>
      </div>

      <g-card class="q-pa-md">
        <g-table :isRowActionEnabled="true" tableKey="cutOffManagementTable" apiUrl="/hr-configuration/cutoff/table" ref="table">
          <template v-slot:type="props">
            <span v-if="props.data.cutoffType == 'SEMIMONTHLY'"> SEMI-MONTHLY </span>
            <span v-else>{{ props.data.cutoffType }}</span>
          </template>

          <template v-slot:first="props">
            <span v-if="props.data.cutoffConfig.firstCutoffPeriod == 1"> {{ props.data.cutoffConfig.firstCutoffPeriod }}st </span>
            <span v-if="props.data.cutoffConfig.firstCutoffPeriod == 2"> {{ props.data.cutoffConfig.firstCutoffPeriod }}nd </span>
            <span v-if="props.data.cutoffConfig.firstCutoffPeriod == 3"> {{ props.data.cutoffConfig.firstCutoffPeriod }}rd </span>
            <span v-if="props.data.cutoffConfig.firstCutoffPeriod >= 4"> {{ props.data.cutoffConfig.firstCutoffPeriod }}th </span>
          </template>

          <template v-slot:last="props">
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod == 0"> LAST DAY </span>
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod <= 20 && props.data.cutoffConfig.lastCutoffPeriod >= 16"> {{ props.data.cutoffConfig.lastCutoffPeriod }}th </span>
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod >= 24 && props.data.cutoffConfig.lastCutoffPeriod <= 28"> {{ props.data.cutoffConfig.lastCutoffPeriod }}th </span>
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod == 21"> {{ props.data.cutoffConfig.lastCutoffPeriod }}st </span>
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod == 22"> {{ props.data.cutoffConfig.lastCutoffPeriod }}nd </span>
            <span v-if="props.data.cutoffConfig.lastCutoffPeriod == 23"> {{ props.data.cutoffConfig.lastCutoffPeriod }}rd </span>
          </template>

          <template v-slot:period="props">
            <span v-if="props.data.cutoffConfig.cutoffPeriod == 1 || props.data.cutoffConfig.cutoffPeriod == 21"> {{ props.data.cutoffConfig.cutoffPeriod }}st </span>
            <span v-if="props.data.cutoffConfig.cutoffPeriod == 2 || props.data.cutoffConfig.cutoffPeriod == 22"> {{ props.data.cutoffConfig.cutoffPeriod }}nd </span>
            <span v-if="props.data.cutoffConfig.cutoffPeriod == 3 || props.data.cutoffConfig.cutoffPeriod == 23"> {{ props.data.cutoffConfig.cutoffPeriod }}rd </span>
            <span v-if="props.data.cutoffConfig.cutoffPeriod >= 4 && props.data.cutoffConfig.cutoffPeriod <= 20"> {{ props.data.cutoffConfig.cutoffPeriod }}th </span>
            <span v-if="props.data.cutoffConfig.cutoffPeriod >= 24 && props.data.cutoffConfig.cutoffPeriod <= 28"> {{ props.data.cutoffConfig.cutoffPeriod }}th </span>
            <span v-if="props.data.cutoffConfig.cutoffPeriod == 0"> LAST DAY </span>
          </template>

          <!-- Actions -->
          <template v-slot:row-actions="props">
            <GButton variant="icon" color="gray" icon="more_horiz" icon-size="md">
              <q-menu auto-close>
                <div class="q-pa-sm">
                  <div clickable @click="viewCutOff(props.data)" class="row q-pa-xs cursor-pointer">
                    <div class="q-py-xs">
                      <q-icon name="visibility" color="grey" size="20px" />
                    </div>
                    <div class="text-primary q-pa-xs text-label-medium">View</div>
                  </div>
                  <div clickable @click="deleteCutOff(props.data)" class="row q-pa-xs cursor-pointer">
                    <div><q-icon name="delete" color="grey" size="20px" /></div>
                    <div class="text-negative q-pa-xs text-label-medium">Delete</div>
                  </div>
                </div>
              </q-menu>
            </GButton>
          </template>
        </g-table>
      </g-card>
    </div>
  </expanded-nav-page-container>

  <!-- View Cut-Off -->
  <ViewCutOffDialog @close="openViewCutOffDialog = false" @edit="openEditCutOff" v-model="openViewCutOffDialog" :cutOffData="cutOffData" />

  <!-- Add and Edit Cut-Off -->
  <AddEditCutOffDialog @saveDone="this.$refs.table.refetch()" @close="openAddEditCutOffDialog = false" v-model="openAddEditCutOffDialog" :cutOffData="cutOffData" />
</template>

<script src="./CutOffManagement.ts"></script>
