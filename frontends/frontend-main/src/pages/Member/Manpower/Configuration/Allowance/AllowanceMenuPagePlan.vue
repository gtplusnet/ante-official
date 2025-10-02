<template>
  <expanded-nav-page-container>
    <div class="q-pb-md">
      <div class="row justify-between items-center">
        <div>
          <span class="text-title-large">Allowance Summary</span>
          <div class="bread-crumbs">
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Allowance" :to="{ name: 'member_manpower_allowance' }" />
              <q-breadcrumbs-el :label="allowanceInformation?.category.value" class="text-grey-9" />
              <q-breadcrumbs-el :label="allowanceInformation?.name" />
            </q-breadcrumbs>
          </div>
        </div>
        <div>
          <GButton
            class="q-mr-sm text-label-large"
            icon="download"
            label="Mass Import"
            variant="outline"
            color="gray"
            @click="openImportDialog"
          />
          <GButton
            icon="add"
            @click="allowanceInformation && openDialog(allowanceInformation)"
            label="Create Allowance"
            color="primary"
            class="text-label-large"
          />
        </div>
      </div>
    </div>

    <div class="row justify-between items-center q-pb-sm">
      <div class="allowance-tabs text-label-medium">
        <div v-for="tab in tabList" :key="tab.key" class="tab" :class="tab.key == activeTab ? 'active' : ''" @click="activeTab = tab.key">
          {{ tab.name }}
        </div>
      </div>
    </div>
    <GCard>
      <q-card-section>
        <!-- Active Table -->
        <AllowanceActiveTable
          ref="activeTableRef"
          v-if="activeTab === 'active_table' && allowanceInformation"
          :allowanceInformation="allowanceInformation"
        />
        <!-- Inactive Table -->
        <AllowanceDeactivateTable
          ref="inactiveTableRef"
          v-if="activeTab === 'deactivate_table' && allowanceInformation"
          :allowanceInformation="allowanceInformation"
        />
      </q-card-section>
    </GCard>
    <!-- Create Allowance Plan Dialog -->
    <CreateAllowancePlanDialog v-model="isCreateAllowanceDialogOpen" @saveDone="handleSaveDone" :allowanceInformation="allowanceInformation || {}" />

    <!-- Import Allowance Dialog -->
    <ManpowerImportAllowanceDialog
      v-if="allowanceInformation"
      ref="importDialog"
      :allowanceConfigurationId="allowanceInformation.id"
      @imported="handleImportDone"
    />
  </expanded-nav-page-container>
</template>

<style scoped src="./AllowanceMenuPage.scss"></style>

<script lang="ts">
import { onMounted, ref } from 'vue';
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import GCard from "../../../../../components/shared/display/GCard.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { useRoute } from 'vue-router';
import { AllowanceConfigurationDataResponse } from "@shared/response";
import AllowanceActiveTable from "../../../../../pages/Member/Manpower/components/tables/ManpowerAllowanceActiveTable.vue";
import AllowanceDeactivateTable from "../../../../../pages/Member/Manpower/components/tables/ManpowerAllowanceDeactivateTable.vue";
import CreateAllowancePlanDialog from '../../dialogs/configuration/ManpowerCreateAllowancePlanDialog.vue';
import ManpowerImportAllowanceDialog from '../../dialogs/configuration/ManpowerImportAllowanceDialog.vue';

export default {
  name: 'AllowanceMenuPagePlan',
  components: {
    GButton,
    ExpandedNavPageContainer,
    AllowanceActiveTable,
    AllowanceDeactivateTable,
    CreateAllowancePlanDialog,
    ManpowerImportAllowanceDialog,
    GCard,
  },
  props: {},
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const isCreateAllowanceDialogOpen = ref(false);
    const planId = route.params.planId;
    const allowanceInformation = ref<AllowanceConfigurationDataResponse | null>(null);
    const activeTableRef = ref<(InstanceType<typeof AllowanceActiveTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);
    const inactiveTableRef = ref<(InstanceType<typeof AllowanceDeactivateTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);
    const activeTab = ref('active_table');
    const tabList = ref([
      { name: 'Active', key: 'active_table' },
      { name: 'Inactive', key: 'deactivate_table' },
    ]);

    onMounted(() => {
      getAllowanceData();
    });

    const getAllowanceData = async () => {
      $q.loading.show();
      api
        .get(`hr-configuration/allowance?id=${planId}`)
        .then((response) => {
          allowanceInformation.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const openDialog = (data: AllowanceConfigurationDataResponse) => {
      allowanceInformation.value = data;
      isCreateAllowanceDialogOpen.value = true;
    };


    const handleSaveDone = () => {
      if (activeTableRef.value?.$refs.table) {
        activeTableRef.value.$refs.table.refetch();
      }
      if (inactiveTableRef.value?.$refs.table) {
        inactiveTableRef.value.$refs.table.refetch();
      }
    };

    const importDialog = ref<InstanceType<typeof ManpowerImportAllowanceDialog> | null>(null);

    const openImportDialog = () => {
      importDialog.value?.show();
    };

    const handleImportDone = () => {
      // Refresh tables after successful import
      if (activeTableRef.value?.$refs.table) {
        activeTableRef.value.$refs.table.refetch();
      }
      if (inactiveTableRef.value?.$refs.table) {
        inactiveTableRef.value.$refs.table.refetch();
      }
      $q.notify({
        type: 'positive',
        message: 'Import completed successfully',
      });
    };

    return {
      $q,
      planId,
      activeTab,
      tabList,
      allowanceInformation,
      isCreateAllowanceDialogOpen,
      activeTableRef,
      inactiveTableRef,
      openDialog,
      handleSaveDone,
      importDialog,
      openImportDialog,
      handleImportDone,
    };
  },
};
</script>
