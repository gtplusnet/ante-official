<template>
  <expanded-nav-page-container>
    <div class="q-pb-md">
      <div class="row justify-between items-center">
        <div>
          <span class="text-title-large">Deduction</span>
          <div class="bread-crumbs">
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Deduction" :to="{ name: 'member_manpower_deduction' }" />
              <q-breadcrumbs-el :label="deductionInformation?.name" />
            </q-breadcrumbs>
          </div>
        </div>
        <div>
          <GButton
            class="q-mr-sm text-label-large"
            icon="download"
            label="Mass Import"
            color="gray"
            variant="outline"
            @click="openImportDialog"
            :disabled="!deductionInformation"
          />
          <GButton
            @click="deductionInformation && openDialog(deductionInformation)"
            icon="add"
            label="Create Deduction"
            color="primary"
            class="text-label-large"
          />
        </div>
      </div>
    </div>

    <div class="row justify-between items-center q-pb-sm">
      <div class="deduct-tabs">
        <div v-for="tab in tabList" :key="tab.key" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''" @click="activeTab = tab.key">
          {{ tab.name }}
        </div>
      </div>
    </div>

    <GCard class="deduction-content">
      <q-card-section>
        <!-- Active Table -->
        <DeductionActiveTable
          :deductionInformation="deductionInformation"
          ref="activeTableRef"
          v-if="activeTab === 'active_table' && deductionInformation"
        />
        <!-- Inactive Table -->
        <DeductionDeactivateTable
          :deductionInformation="deductionInformation"
          ref="inactiveTableRef"
          v-if="activeTab === 'deactivate_table' && deductionInformation"
        />
      </q-card-section>
    </GCard>

    <CreateDeductionDialog v-model="isCreateDeductionDialogOpen" @saveDone="handleSaveDone" :selectedDeduction="selectedDeduction || {}" />

    <!-- Import Deduction Dialog -->
    <ManpowerImportDeductionDialog
      v-if="deductionInformation"
      ref="importDialog"
      :deductionConfigurationId="deductionInformation.id"
      :deductionConfig="deductionInformation"
      @imported="handleImportDone"
    />
  </expanded-nav-page-container>
</template>

<style src="./DeductionMenuPage.scss" scoped></style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import GCard from "../../../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import { onMounted, ref, defineAsyncComponent } from 'vue';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { api } from 'src/boot/axios';
import { DeductionConfigurationDataResponse } from '@shared/response/deduction-configuration.response';
import DeductionActiveTable from "../../../../../pages/Member/Manpower/components/tables/ManpowerDeductionActiveTable.vue";
import DeductionDeactivateTable from "../../../../../pages/Member/Manpower/components/tables/ManpowerDeductionDeactivateTable.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const CreateDeductionDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerCreateDeductionDialog.vue')
);
const ManpowerImportDeductionDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerImportDeductionDialog.vue')
);

export default {
  name: 'DeductionMenuPagePlan',
  components: {
    ExpandedNavPageContainer,
    DeductionActiveTable,
    DeductionDeactivateTable,
    CreateDeductionDialog,
    ManpowerImportDeductionDialog,
    GCard,
    GButton,
  },
  props: {},
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const isCreateDeductionDialogOpen = ref(false);
    const planId = route.params.planId;
    const deductionInformation = ref<DeductionConfigurationDataResponse | null>(null);
    const selectedDeduction = ref<DeductionConfigurationDataResponse | null>(null);
    const activeTab = ref('active_table');
    const tabList = ref([
      { name: 'Active', key: 'active_table' },
      { name: 'Inactive', key: 'deactivate_table' },
    ]);
    const activeTableRef = ref<(InstanceType<typeof DeductionActiveTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);
    const inactiveTableRef = ref<(InstanceType<typeof DeductionDeactivateTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);

    onMounted(() => {
      getDeductionInfo();
    });

    const getDeductionInfo = () => {
      $q.loading.show();
      api
        .get(`hr-configuration/deduction?id=${planId}`)
        .then((response) => {
          deductionInformation.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const openDialog = (deduction: DeductionConfigurationDataResponse) => {
      selectedDeduction.value = deduction;
      isCreateDeductionDialogOpen.value = true;
    };

    const handleSaveDone = () => {
      if (activeTableRef.value?.$refs.table) {
        activeTableRef.value.$refs.table.refetch();
      }
      if (inactiveTableRef.value?.$refs.table) {
        inactiveTableRef.value.$refs.table.refetch();
      }
    };

    const importDialog = ref<InstanceType<typeof ManpowerImportDeductionDialog> | null>(null);

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
      tabList,
      activeTab,
      planId,
      activeTableRef,
      inactiveTableRef,
      isCreateDeductionDialogOpen,
      deductionInformation,
      selectedDeduction,
      openDialog,
      handleSaveDone,
      importDialog,
      openImportDialog,
      handleImportDone,
    };
  },
};
</script>
