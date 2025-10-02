<template>
  <div class="page-content q-mt-md">
    <div class="flex justify-end">
      <div class="text-right q-mb-md">
        <g-button @click="openDialog(null)" icon="add" label="Add Local Holiday" />
      </div>
    </div>
    <g-table :isRowActionEnabled="true" tableKey="localHoliday" apiUrl="/hr-configuration/holiday/local-holiday/table" ref="table">
      <template v-slot:province="props">
        <span>
          {{ props.data.province.region.name }},
          {{ props.data.province.name }}
        </span>
      </template>

      <!-- Slot Action -->
      <template v-slot:row-actions="props">
        <g-button color="grey" variant="text" icon="more_horiz" icon-size="md" round>
          <q-menu auto-close>
            <div class="q-pa-sm">
              <div clickable @click="viewLocalHoliday(props.data)" class="row q-pa-xs cursor-pointer items-center">
                <q-icon name="visibility" color="gray" size="20px" class="q-py-xs" />
                <span class="text-primary q-pl-xs text-label-medium">View</span>
              </div>
              <div clickable @click="editLocalHoliday(props.data)" class="row q-pa-xs cursor-pointer items-center">
                <q-icon name="edit" color="gray" size="20px" class="q-py-xs" />
                <span class="text-primary q-pl-xs text-label-medium">Edit</span>
              </div>
              <div clickable @click="deleteLocalHoliday(props.data)" class="row q-pa-xs cursor-pointer items-center">
                <q-icon name="delete" color="negative" size="20px" class="q-py-xs" />
                <span class="text-negative q-pl-xs text-label-medium">Delete</span>
              </div>
            </div>
          </q-menu>
        </g-button>
      </template>
    </g-table>

    <!-- Add and Edit Local Holiday Dialog -->
    <AddEditLocalHolidayDialog @saveDone="this.$refs.table.refetch()" @close="openLocalHolidayDialog = false" :localHolidayData="localHolidayData" v-model="openLocalHolidayDialog" />

    <!-- View Local Holiday -->
    <ViewLocalHolidayDialog @close="openViewLocalDialog = false" @edit="editLocalHoliday" :localHolidayData="localHolidayData" v-model="openViewLocalDialog" />
  </div>
</template>

<script src="./LocalHolidayMenuPage.ts"></script>
