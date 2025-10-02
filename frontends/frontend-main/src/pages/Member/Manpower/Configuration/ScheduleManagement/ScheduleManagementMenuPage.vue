<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div>
        <div class="title text-title-large">Schedule Management</div>
        <q-breadcrumbs class="text-body-small">
          <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
          <q-breadcrumbs-el label="Scheduling" />
          <q-breadcrumbs-el label="Schedule Management" />
        </q-breadcrumbs>
      </div>
      <div>
        <GButton 
          @click="openDialog()" 
          icon="add" 
          label="Add Schedule" 
          color="primary" 
          class="text-label-large" 
        />
      </div>
    </div>
    <GCard class="q-pa-md">
      <g-table :isRowActionEnabled="true" tableKey="scheduleManagement" apiUrl="hr-configuration/schedule/table" ref="table">
        <template v-slot:monday="props">
          <span @click="openMondayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.mondayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:tuesday="props">
          <span @click="openTuesdayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.tuesdayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:wednesday="props">
          <span @click="openWednesdayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.wednesdayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:thursday="props">
          <span @click="openThursdayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.thursdayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:friday="props">
          <span @click="openFridayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.fridayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:saturday="props">
          <span @click="openSaturdayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.saturdayShift.shiftCode }}
          </span>
        </template>
        <template v-slot:sunday="props">
          <span @click="openSundayShift(props.data)" class="clickable-code">
            {{ props.data.dayScheduleDetails.sundayShift.shiftCode }}
          </span>
        </template>

        <!-- Slot Action -->
        <template v-slot:row-actions="props">
          <GButton color="gray" variant="icon" icon="more_horiz" icon-size="md" round>
            <q-menu auto-close>
              <div class="q-pa-sm text-label-medium">
                <div clickable @click="viewSchedule(props.data)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="visibility" color="gray" size="20px" class="q-py-xs" />
                  <span class="text-primary q-pl-xs">View</span>
                </div>
                <div clickable @click="editSchedule(props.data)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="edit" color="gray" size="20px" class="q-py-xs" />
                  <span class="text-primary q-pl-xs">Edit</span>
                </div>
                <div clickable @click="deleteSchedule(props.data)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="delete" color="negative" size="20px" class="q-py-xs" />
                  <span class="text-negative q-pl-xs">Delete</span>
                </div>
              </div>
            </q-menu>
          </GButton>
        </template>
      </g-table>
    </GCard>
    <div>
      <!-- View Shift Code Dialog -->
      <ViewShiftCodeDialog @close="this.openViewShiftDialog = false" v-model="openViewShiftDialog" :shiftCodeData="shiftCodeData" />

      <!-- View Schedule Dialog -->
      <ViewScheduleDialog @close="this.openViewSchedule = false" @edit="editSchedule" v-model="openViewSchedule" :scheduleInformation="scheduleInformation" />

      <!-- Add and Edit Schedule Dialog -->
      <AddEditScheduleDialog @saveDone="this.$refs.table.refetch()" @close="this.openAddEditSchedule = false" :scheduleInformation="scheduleInformation" v-model="openAddEditSchedule" />
    </div>
  </expanded-nav-page-container>
</template>

<script src="./ScheduleManagement.ts"></script>
