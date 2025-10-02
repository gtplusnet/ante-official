<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="text-title-large">HRIS</div>

      <div class="q-gutter-sm">
        <g-button
          @click="exportEmployees"
          variant="outline"
          label="Export"
          icon="download"
          color="secondary"
        />
        <g-button
          @click="openDialogImport"
          variant="outline"
          label="Import"
          icon="upload"
          color="secondary"
        />
        <g-button
          @click="openDialog()"
          label="Create Employee"
          icon="add"
          color="primary"
          size="md"
          data-testid="create-employee-button"
        />
      </div>
    </div>

    <div class="bread-crumbs">
      <q-breadcrumbs class="text-body-small">
        <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
        <q-breadcrumbs-el label="HRIS" />
      </q-breadcrumbs>
    </div>

    <div class="page-tabs">
      <div v-for="tab in tabList" :key="tab.column" class="text-label-medium tab" :class="tab.key == activeTab ? 'active' : ''" @click="activeTab = tab.key" :data-testid="`hris-tab-${tab.key}`">
        {{ tab.name }}
      </div>
    </div>

    <div class="q-mt-sm">
      <HRISActiveTabPage v-if="activeTab == 'active'" ref="activeTabComponent" @employee-updated="handleEmployeeSaved" @employee-deleted="handleEmployeeDeleted" data-testid="hris-active-tab" />
      <HRISInactiveTabPage v-if="activeTab == 'inactive'" ref="InactiveComponent" @employee-updated="handleEmployeeSaved" />
      <HRISSeparatedTabPage v-if="activeTab == 'separated'" ref="SeperatedTab" @employee-updated="handleEmployeeSaved" />
      <HRISNotYetSetupTabPage v-if="activeTab == 'not_yet'" ref="NotYetSetup" @employee-updated="handleEmployeeSaved" />
    </div>

    <AddEditHRISEmployeeDialog ref="dialogCreate" @employee-saved="handleEmployeeSaved" />

    <ImportEmployeeDialog ref="dialogImport" @imported="handleEmployeeImported" />
  </expanded-nav-page-container>
</template>

<script>
import HRISActiveTabPage from './Tab/HRISActiveTabPage.vue';
import HRISSeparatedTabPage from './Tab/HRISSeparatedTabPage.vue';
import HRISNotYetSetupTabPage from './Tab/HRISNotYetSetupTabPage.vue';
import HRISInactiveTabPage from './Tab/HRISInactiveTabPage.vue';
import AddEditHRISEmployeeDialog from '../dialogs/hris/ManpowerAddEditHRISEmployeeDialog.vue';
import ImportEmployeeDialog from '../dialogs/hris/ManpowerImportEmployeeDialog.vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import GButton from 'src/components/shared/buttons/GButton.vue';
export default {
  name: 'HRISMenuPage',
  components: {
    HRISActiveTabPage,
    HRISInactiveTabPage,
    HRISSeparatedTabPage,
    HRISNotYetSetupTabPage,
    AddEditHRISEmployeeDialog,
    ImportEmployeeDialog,
    ExpandedNavPageContainer,
    GButton,
  },
  data: () => ({
    form: {},
    activeTab: 'active',
    tabList: [
      {
        key: 'active',
        name: 'Active',
        icon: 'active',
      },
      {
        key: 'inactive',
        name: 'Inactive',
        icon: 'inactive',
      },
      {
        key: 'separated',
        name: 'Separated',
      },
      {
        key: 'not_yet',
        name: 'Not Yet Set',
      },
    ],
  }),
  methods: {
    handleEmployeeSaved() {
      console.log('[DEBUG] HRISMenuPage: handleEmployeeSaved method called, activeTab:', this.activeTab);
      
      if (this.activeTab === 'active' && this.$refs.activeTabComponent) {
        console.log('[DEBUG] HRISMenuPage: Calling refreshTable on activeTabComponent');
        this.$refs.activeTabComponent.refreshTable();
      } else if (this.activeTab === 'inactive' && this.$refs.InactiveComponent) {
        console.log('[DEBUG] HRISMenuPage: Calling refreshTable on InactiveComponent');
        this.$refs.InactiveComponent.refreshTable();
      } else if (this.activeTab === 'not_yet' && this.$refs.NotYetSetup) {
        console.log('[DEBUG] HRISMenuPage: Calling refreshTable on NotYetSetup');
        this.$refs.NotYetSetup.refreshTable();
      } else if (this.activeTab === 'separated' && this.$refs.SeperatedTab) {
        console.log('[DEBUG] HRISMenuPage: Calling refreshTable on SeperatedTab');
        this.$refs.SeperatedTab.refreshTable();
      } else {
        console.log('[DEBUG] HRISMenuPage: No matching tab or ref found for activeTab:', this.activeTab);
        console.log('[DEBUG] HRISMenuPage: Available refs:', Object.keys(this.$refs));
      }
    },
    handleEmployeeDeleted() {
      console.log('[DEBUG] HRISMenuPage: handleEmployeeDeleted method called');
      
      // Refresh the inactive tab since deleted employees become inactive
      if (this.$refs.InactiveComponent) {
        console.log('[DEBUG] HRISMenuPage: Refreshing InactiveComponent after deletion');
        this.$refs.InactiveComponent.refreshTable();
      }
      
      // Also refresh the active tab to update the list
      if (this.$refs.activeTabComponent) {
        console.log('[DEBUG] HRISMenuPage: Refreshing activeTabComponent after deletion');
        this.$refs.activeTabComponent.refreshTable();
      }
    },
    openDialog() {
      if (this.$refs.dialogCreate) {
        this.$refs.dialogCreate.show();
      }
    },
    openDialogImport() {
      if (this.$refs.dialogImport) {
        this.$refs.dialogImport.show();
      }
    },
    async exportEmployees() {
      try {
        this.$q.loading.show({
          message: 'Exporting employees data...',
        });

        const response = await api.get('/hris/employee/export', {
          responseType: 'blob',
        });

        // Create a blob URL and download the file
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$q.notify({
          type: 'positive',
          message: 'Employees data exported successfully',
        });
      } catch (error) {
        handleAxiosError(this.$q, error);
      } finally {
        this.$q.loading.hide();
      }
    },
    handleEmployeeImported() {
      // Refresh the currently active tab
      this.handleEmployeeSaved();

      this.$q.notify({
        type: 'positive',
        message: 'Employee import completed successfully!',
        position: 'top',
      });
    },
  },
};
</script>
