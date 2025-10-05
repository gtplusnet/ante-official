<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div>
        <div class="text-title-large">Shift Management</div>
        <q-breadcrumbs>
          <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
          <q-breadcrumbs-el label="Scheduling" />
          <q-breadcrumbs-el label="Shift Management" />
        </q-breadcrumbs>
      </div>
      <div>
        <GButton
          @click="openDialog()"
          icon="add"
          label="Add Shift"
          color="primary"
          class="text-label-large"
        />
      </div>
    </div>
    <GCard class="q-pa-md">
      <g-table :isRowActionEnabled="true" tableKey="shiftManagement" apiUrl="/hr-configuration/shift/table" ref="table">
        <!-- Add this template for the FlexiTime column -->
        <template v-slot:cell-isFlexiTime="props">
          {{ props.value ? 'Yes' : 'No' }}
        </template>

        <template v-slot:row-actions="props">
          <GButton color="gray" variant="icon" icon="more_horiz" icon-size="md" round>
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div clickable @click="viewShift(props)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="visibility" color="gray" size="20px" />
                  <span class="text-primary q-pl-xs text-label-medium">View</span>
                </div>
                <div clickable @click="editShift(props)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="edit" color="gray" size="20px" />
                  <span class="text-primary q-pl-xs text-label-medium">Edit</span>
                </div>
                <div clickable @click="deleteShift(props.data.id)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="delete" color="negative" size="20px" />
                  <span class="text-negative q-pl-xs text-label-medium">Delete</span>
                </div>
              </div>
            </q-menu>
          </GButton>
        </template>
      </g-table>
    </GCard>
    <div>
      <!-- View Shift Code Dialog -->
      <ViewShiftDialog @close="openViewShiftDialog = false" v-model="openViewShiftDialog" @edit="editShift" :shiftInfo="shiftInfo" />

      <!-- Add and Edit Shift Dialog -->
      <AddEditShiftDialog @saveDone="$refs.table.refetch()" @close="openAddEditShift = false" :shiftInfo="shiftInfo" v-model="openAddEditShift" />
    </div>
  </expanded-nav-page-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../components/shared/display/GTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditShiftDialog = defineAsyncComponent(() =>
  import('../dialogs/configuration/ManpowerAddEditShiftDialog.vue')
);
const ViewShiftDialog = defineAsyncComponent(() =>
  import('../dialogs/configuration/ManpowerViewShiftDialog.vue')
);
export default {
  name: 'ShiftManagementMenuPage',
  components: {
    AddEditShiftDialog,
    ViewShiftDialog,
    GTable,
    GCard,
    ExpandedNavPageContainer,
    GButton,
  },

  data() {
    return {
      openViewShiftDialog: false,
      openAddEditShift: false,
      shiftInfo: null,
    };
  },
  methods: {
    viewShift(data) {
      this.shiftInfo = data;
      this.openViewShiftDialog = true;
    },
    openFlexiTimeShift(data) {
      this.shiftInfo = data?.ShiftDetails?.openFlexiTime || null;
      this.openViewShiftDialog = true;
    },

    openDialog() {
      this.shiftInfo = null;
      this.openAddEditShift = true;
    },
    editShift(data) {
      this.shiftInfo = data;
      this.openAddEditShift = true;
    },
    deleteShift(id) {
      this.$q
        .dialog({
          title: 'Delete Shift',
          message: 'Are you sure you want to delete this shift?',
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.callDeleteShiftAPI(id);
        })
        .onCancel(() => {
          console.log('Cancel');
        })
        .onDismiss(() => {
          console.log('I am triggered on both OK and Cancel');
        });
    },
    callDeleteShiftAPI(id) {
      api
        .delete(`/hr-configuration/shift?id=${id}`)
        .then(() => {
          this.$refs.table.refetch();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
