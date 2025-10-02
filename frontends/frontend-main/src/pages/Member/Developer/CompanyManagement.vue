<template>
  <div class="page-head">
    <div class="title text-title-large">Company Management</div>
  </div>
  <div class="q-pa-md">
    <q-card>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="active" label="Active Companies" />
        <q-tab name="inactive" label="Inactive Companies" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="active">
          <q-card-section>
            <div class="row items-center justify-end q-mb-md">
              <q-btn
                unelevated
                color="primary"
                label="Add Company"
                icon="add"
                @click="addCompany"
                class="text-label-large"
                :style="{
                  borderRadius: '20px',
                  paddingLeft: '16px',
                  paddingRight: '24px',
                  height: '40px',
                  fontWeight: '500',
                  letterSpacing: '0.1px',
                  textTransform: 'none'
                }"
              />
            </div>
            <g-table
              ref="activeTable"
              tableKey="company"
              apiUrl="company/companies/table"
              :apiFilters="[{ isActive: true }]"
              :isRowActionEnabled="true"
              class="text-body-small"
            >
              <template #row-actions="{ data }">
                <q-btn flat color="primary" icon="edit" @click.stop="editCompany(data)" size="sm">
                  <q-tooltip>Edit Company</q-tooltip>
                </q-btn>
                <q-btn flat color="negative" icon="block" @click.stop="deactivateCompany(data)" size="sm">
                  <q-tooltip>Deactivate Company</q-tooltip>
                </q-btn>
              </template>
            </g-table>
          </q-card-section>
        </q-tab-panel>

        <q-tab-panel name="inactive">
          <q-card-section>
            <g-table
              ref="inactiveTable"
              tableKey="company"
              apiUrl="company/companies/table"
              :apiFilters="[{ isActive: false }]"
              :isRowActionEnabled="true"
              class="text-body-small"
            >
              <template #row-actions="{ data }">
                <q-btn flat color="primary" icon="edit" @click.stop="editCompany(data)" size="sm">
                  <q-tooltip>Edit Company</q-tooltip>
                </q-btn>
                <q-btn flat color="positive" icon="check_circle" @click.stop="activateCompany(data)" size="sm">
                  <q-tooltip>Activate Company</q-tooltip>
                </q-btn>
              </template>
            </g-table>
          </q-card-section>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <company-edit-dialog
      v-model="showEditDialog"
      :company="selectedCompany"
      @close="showEditDialog = false"
      @saveDone="handleSave"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import CompanyEditDialog from './CompanyEditDialog.vue';
import type {  CompanyDataResponse  } from "@shared/response";
import GTable from "../../../components/shared/display/GTable.vue";

export default defineComponent({
  name: 'CompanyManagement',
  components: {
    CompanyEditDialog,
    GTable
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const showEditDialog = ref(false);
    const selectedCompany = ref<CompanyDataResponse | null>(null);
    const activeTable = ref();
    const inactiveTable = ref();
    const activeTab = ref('active');

    const editCompany = (company: CompanyDataResponse) => {
      console.log('🔧 CompanyManagement - Editing company:', company);
      console.log('🔧 CompanyManagement - disabledModules from company data:', company.disabledModules);
      selectedCompany.value = { ...company };
      showEditDialog.value = true;
    };

    const addCompany = () => {
      selectedCompany.value = null;
      showEditDialog.value = true;
    };

    const handleSave = () => {
      console.log('🔧 CompanyManagement - handleSave called');
      showEditDialog.value = false;
      selectedCompany.value = null;
      console.log('🔧 CompanyManagement - Refreshing tables...');
      activeTable.value?.refresh();
      inactiveTable.value?.refresh();
    };

    const deactivateCompany = (company: CompanyDataResponse) => {
      $q.dialog({
        title: 'Deactivate Company',
        message: `Are you sure you want to deactivate "${company.companyName}"? Users from this company will not be able to login.`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        $q.loading.show({
          message: 'Deactivating company...'
        });
        
        try {
          const response = await instance?.appContext.config.globalProperties.$api.put(
            `/company/${company.id}/status`,
            { isActive: false }
          );
          
          if (response?.data) {
            $q.notify({
              type: 'positive',
              message: `Company "${company.companyName}" has been deactivated`,
              position: 'top'
            });
            activeTable.value?.refresh();
            inactiveTable.value?.refresh();
          }
        } catch (error: any) {
          console.error('Deactivate company error:', error);
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to deactivate company',
            position: 'top'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const activateCompany = (company: CompanyDataResponse) => {
      $q.dialog({
        title: 'Activate Company',
        message: `Are you sure you want to activate "${company.companyName}"? Users from this company will be able to login again.`,
        cancel: true,
        persistent: true,
        color: 'positive'
      }).onOk(async () => {
        $q.loading.show({
          message: 'Activating company...'
        });
        
        try {
          const response = await instance?.appContext.config.globalProperties.$api.put(
            `/company/${company.id}/status`,
            { isActive: true }
          );
          
          if (response?.data) {
            $q.notify({
              type: 'positive',
              message: `Company "${company.companyName}" has been activated`,
              position: 'top'
            });
            activeTable.value?.refresh();
            inactiveTable.value?.refresh();
          }
        } catch (error: any) {
          console.error('Activate company error:', error);
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to activate company',
            position: 'top'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    return {
      showEditDialog,
      selectedCompany,
      activeTable,
      inactiveTable,
      activeTab,
      editCompany,
      addCompany,
      handleSave,
      deactivateCompany,
      activateCompany
    };
  }
});
</script>
