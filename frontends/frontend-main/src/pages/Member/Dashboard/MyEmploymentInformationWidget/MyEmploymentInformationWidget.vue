<template>
  <div>
    <GlobalWidgetCard>
      <template #title>My Employment Information</template>

      <template #content>
        <div class="employment-info-container">
          <div class="info-grid">
            <!-- Left Column -->
            <div class="info-column">
              <EmploymentInfoItem
                icon="assignment"
                iconColor="#615FF6"
                title="Employment Details"
                subtitle="Personal & Contact Information, Work Assignment"
                actionText="Review"
                @click="navigateToEmploymentDetails"
              />

              <EmploymentInfoItem
                icon="work"
                iconColor="#615FF6"
                title="Job Details"
                subtitle="Banking Information, Work Information"
                actionText="Review"
                @click="navigateToJobDetails"
              />

              <EmploymentInfoItem
                icon="schedule"
                iconColor="#615FF6"
                title="My Shift"
                subtitle="Daily Time & Weekly Schedules, Schedule Assignment"
                actionText="Review"
                @click="navigateToMyShift"
              />

              <EmploymentInfoItem
                icon="attach_money"
                iconColor="#615FF6"
                title="Allowances"
                subtitle="Allowance Assignment"
                actionText="Review"
                @click="navigateToAllowances"
              />

              <EmploymentInfoItem
                icon="description"
                iconColor="#615FF6"
                title="Documentation"
                subtitle="My Employment Documents"
                actionText="Review"
                @click="navigateToDocumentation"
              />
            </div>

            <!-- Right Column -->
            <div class="info-column">
              <EmploymentInfoItem
                icon="contact_page"
                iconColor="#615FF6"
                title="Contract Details"
                subtitle="My employment contract, Contract History"
                actionText="Review"
                @click="navigateToContractDetails"
              />

              <EmploymentInfoItem
                icon="account_balance"
                iconColor="#615FF6"
                title="Government IDs"
                subtitle="TIN, SSS, HDMF, PHIC numbers"
                actionText="Review"
                @click="navigateToGovernmentIds"
              />

              <EmploymentInfoItem
                icon="beach_access"
                iconColor="#615FF6"
                title="Service Incentive Leaves"
                subtitle="Leave Summary, Leave Balances"
                actionText="Review"
                @click="navigateToServiceIncentiveLeaves"
              />

              <EmploymentInfoItem
                icon="remove_circle"
                iconColor="#615FF6"
                title="Deductions"
                subtitle="Regular Deduction, Loans"
                actionText="Review"
                @click="navigateToDeductions"
              />

              <EmploymentInfoItem
                icon="remove_circle"
                iconColor="#615FF6"
                title="Time Sheet"
                subtitle="Regular Deduction, Loans"
                actionText="Review"
                @click="navigateToTimeSheet"
              />
            </div>
          </div>
        </div>
      </template>
    </GlobalWidgetCard>

    <!-- Employment Information Dialogs -->
    <EmploymentDetailsDialog v-model="showEmploymentDetailsDialog" />
    <JobDetailsDialog v-model="showJobDetailsDialog" />
    <MyShiftDialog v-model="showMyShiftDialog" />
    <AllowancesDialog v-model="showAllowancesDialog" />
    <DocumentationDialog v-model="showDocumentationDialog" />
    <ContractDetailsDialog v-model="showContractDetailsDialog" />
    <GovernmentIdsDialog v-model="showGovernmentIdsDialog" />
    <ServiceIncentiveLeavesDialog v-model="showServiceIncentiveLeavesDialog" />
    <DeductionsDialog v-model="showDeductionsDialog" />
    <TimeSheetDialog v-model="showTimeSheetDialog" />
  </div>
</template>

<style scoped src="./MyEmploymentInformationWidget.scss"></style>

<script>
import { defineComponent, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import EmploymentInfoItem from './EmploymentInfoItem.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const EmploymentDetailsDialog = defineAsyncComponent(() =>
  import('./dialogs/EmploymentDetailsDialog.vue')
);
const JobDetailsDialog = defineAsyncComponent(() =>
  import('./dialogs/JobDetailsDialog.vue')
);
const MyShiftDialog = defineAsyncComponent(() =>
  import('./dialogs/MyShiftDialog.vue')
);
const AllowancesDialog = defineAsyncComponent(() =>
  import('./dialogs/AllowancesDialog.vue')
);
const DocumentationDialog = defineAsyncComponent(() =>
  import('./dialogs/DocumentationDialog.vue')
);
const ContractDetailsDialog = defineAsyncComponent(() =>
  import('./dialogs/ContractDetailsDialog.vue')
);
const GovernmentIdsDialog = defineAsyncComponent(() =>
  import('./dialogs/GovernmentIdsDialog.vue')
);
const ServiceIncentiveLeavesDialog = defineAsyncComponent(() =>
  import('./dialogs/ServiceIncentiveLeavesDialog.vue')
);
const DeductionsDialog = defineAsyncComponent(() =>
  import('./dialogs/DeductionsDialog.vue')
);
const TimeSheetDialog = defineAsyncComponent(() =>
  import('./dialogs/TimeSheetDialog.vue')
);

// Import all dialogs

export default defineComponent({
  name: 'MyEmploymentInformationWidget',
  components: {
    GlobalWidgetCard,
    EmploymentInfoItem,
    EmploymentDetailsDialog,
    JobDetailsDialog,
    MyShiftDialog,
    AllowancesDialog,
    DocumentationDialog,
    ContractDetailsDialog,
    GovernmentIdsDialog,
    ServiceIncentiveLeavesDialog,
    DeductionsDialog,
    TimeSheetDialog,
  },
  setup() {
    // Dialog visibility states
    const showEmploymentDetailsDialog = ref(false);
    const showJobDetailsDialog = ref(false);
    const showMyShiftDialog = ref(false);
    const showAllowancesDialog = ref(false);
    const showDocumentationDialog = ref(false);
    const showContractDetailsDialog = ref(false);
    const showGovernmentIdsDialog = ref(false);
    const showServiceIncentiveLeavesDialog = ref(false);
    const showDeductionsDialog = ref(false);
    const showTimeSheetDialog = ref(false);

    // Navigation methods - open dialogs
    const navigateToEmploymentDetails = () => {
      showEmploymentDetailsDialog.value = true;
    };

    const navigateToJobDetails = () => {
      showJobDetailsDialog.value = true;
    };

    const navigateToMyShift = () => {
      showMyShiftDialog.value = true;
    };

    const navigateToAllowances = () => {
      showAllowancesDialog.value = true;
    };

    const navigateToDocumentation = () => {
      showDocumentationDialog.value = true;
    };

    const navigateToContractDetails = () => {
      showContractDetailsDialog.value = true;
    };

    const navigateToGovernmentIds = () => {
      showGovernmentIdsDialog.value = true;
    };

    const navigateToServiceIncentiveLeaves = () => {
      showServiceIncentiveLeavesDialog.value = true;
    };

    const navigateToDeductions = () => {
      showDeductionsDialog.value = true;
    };

    const navigateToTimeSheet = () => {
      showTimeSheetDialog.value = true;
    };

    return {
      // Dialog states
      showEmploymentDetailsDialog,
      showJobDetailsDialog,
      showMyShiftDialog,
      showAllowancesDialog,
      showDocumentationDialog,
      showContractDetailsDialog,
      showGovernmentIdsDialog,
      showServiceIncentiveLeavesDialog,
      showDeductionsDialog,
      showTimeSheetDialog,
      
      // Navigation methods
      navigateToEmploymentDetails,
      navigateToJobDetails,
      navigateToMyShift,
      navigateToAllowances,
      navigateToDocumentation,
      navigateToContractDetails,
      navigateToGovernmentIds,
      navigateToServiceIncentiveLeaves,
      navigateToDeductions,
      navigateToTimeSheet,
    };
  },
});
</script>
