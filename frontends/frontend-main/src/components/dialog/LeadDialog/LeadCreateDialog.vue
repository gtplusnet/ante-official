<template>
  <q-dialog ref="dialog" @before-show="initForm">
    <TemplateDialog minWidth="800px" maxWidth="900px">
      <template #DialogIcon>
        <q-icon name="o_leaderboard" />
      </template>
      <template #DialogTitle>
        {{ leadData && Object.keys(leadData).length > 0 && leadData.id ? "Edit" : "Add New" }} Lead
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="saveLead" class="q-px-md q-pb-md">
          <div class="row">

            <div class="text-label-large text-dark">Deal Information</div>
            <!-- Row 1: Deal Name/Opportunity* | Deal Type* -->
            <div class="row justify-center col-12 q-px-sm q-mt-sm">
              <div class="col-6 q-pr-sm">
                <g-input v-model="form.dealName" label="Deal Name/Opportunity*" type="text" required />
              </div>
              <div class="col-6 q-pl-sm">
                <SelectionDealType v-model="form.dealType" required />
              </div>
            </div>

            <div class="text-label-large text-dark">Deal Value</div>
            <!-- Row 2: Approved Budget for Contract (ABC) | Monthly Recurring Revenue (MRR) -->
            <div class="row justify-center col-12 q-px-sm q-mt-sm">
              <div class="col-6 q-pr-sm">
                <g-input v-model="form.approvedBudgetContract" label="Approved Budget for Contract (ABC)" type="number"
                  :min="0" />
              </div>
              <div class="col-6 q-pl-sm">
                <g-input v-model="form.monthlyRecurringRevenue" label="Monthly Recurring Revenue (MRR)" type="number"
                  :min="0" />
              </div>
            </div>

            <!-- Row 3: Implementation Fee | Total Contract -->
            <div class="row justify-center col-12 q-px-sm">
              <div class="col-6 q-pr-sm">
                <g-input v-model="form.implementationFee" label="Implementation Fee" type="number" :min="0" />
              </div>
              <div class="col-6 q-pl-sm">
                <g-input v-model="form.totalContract" label="Total Contract" type="number" :min="0" />
              </div>
            </div>

            <div class="text-label-large text-dark">Other Details</div>
            <!-- Row 4: Close Date (Month/Year) | Win Probability -->
            <div class="row justify-center col-12 q-px-sm q-mt-sm">
              <div class="col-6 q-pr-sm">
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <g-input v-model="form.closeMonth" label="Close Month" type="select" :options="monthOptions"
                      required />
                  </div>
                  <div class="col-6">
                    <g-input v-model="form.closeYear" label="Close Year" type="select" :options="yearOptions"
                      required />
                  </div>
                </div>
              </div>
              <div class="col-6 q-pl-sm">
                <g-input v-model="form.winProbability" label="Win Probability" type="number" :min="0" :max="100"
                  suffix="%" />
              </div>
            </div>

            <!-- Row 5: Select Location | Select Deal Source -->
            <div class="row justify-center q-mb-md col-12 q-px-sm">
              <div class="col-6 q-pr-sm">
                <SelectionLocation v-model="form.locationId" />
              </div>
              <div class="col-6 q-pl-sm">
                <SelectionDealSource v-model="form.dealSourceId" />
              </div>
            </div>

            <div class="text-label-large text-dark">People</div>
            <!-- Row 6: Relationship Owner | Point Of Contact -->
            <div class="row justify-center col-12 q-px-sm q-mt-sm">
              <div class="col-6 q-pr-sm">
                <SelectionRelationshipOwner v-model="form.relationshipOwnerId" />
              </div>
              <div class="col-6 q-pl-sm">
                <SelectionPointOfContact v-model="form.pointOfContactId" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="text-right q-mt-md q-pr-sm">
            <GButton no-caps class="q-mr-sm" variant="tonal" label="Cancel" type="button" color="light-grey"
              v-close-popup />
            <GButton no-caps :label="leadData && Object.keys(leadData).length > 0 && leadData.id ? 'Update' : 'Save'"
              type="submit" color="primary" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
// Custom styles for LeadCreateDialog - TemplateDialog handles most styling</style>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { QDialog, useQuasar } from "quasar";
// import { useRouter } from 'vue-router';
import GInput from "../../shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import TemplateDialog from "../TemplateDialog.vue";
import { APIRequests } from "../../../utility/api.handler";
import { ProjectCreateRequest } from "@shared/request";
import { LeadDataResponse } from "@shared/response";
import SelectionLocation from "src/components/selection/SelectionLocation.vue";
import SelectionRelationshipOwner from "src/components/selection/SelectionRelationshipOwner.vue";
import SelectionPointOfContact from "src/components/selection/SelectionPointOfContact.vue";
import SelectionDealSource from "src/components/selection/SelectionDealSource.vue";
import SelectionDealType from "src/components/selection/SelectionDealType.vue";

interface LeadForm {
  dealName: string;
  dealType: string | number;
  approvedBudgetContract: number;
  monthlyRecurringRevenue: number;
  implementationFee: number;
  totalContract: number;
  closeMonth: string;
  closeYear: string;
  winProbability: number;
  locationId: string;
  dealSourceId: string | number;
  relationshipOwnerId: string;
  pointOfContactId: string | number;
}

export default defineComponent({
  name: "LeadCreateDialog",
  components: {
    GInput,
    GButton,
    TemplateDialog,
    SelectionLocation,
    SelectionRelationshipOwner,
    SelectionPointOfContact,
    SelectionDealSource,
    SelectionDealType,
  },
  props: {
    leadData: {
      type: Object as () => LeadDataResponse,
      default: null,
    },
  },
  emits: ["close", "saveDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    // const router = useRouter();
    const dialog = ref<InstanceType<typeof QDialog>>();

    // Month and Year options for Close Date
    const monthOptions = [
      { label: 'January', value: '01' },
      { label: 'February', value: '02' },
      { label: 'March', value: '03' },
      { label: 'April', value: '04' },
      { label: 'May', value: '05' },
      { label: 'June', value: '06' },
      { label: 'July', value: '07' },
      { label: 'August', value: '08' },
      { label: 'September', value: '09' },
      { label: 'October', value: '10' },
      { label: 'November', value: '11' },
      { label: 'December', value: '12' }
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 10 }, (_, i) => ({
      label: (currentYear + i).toString(),
      value: (currentYear + i).toString()
    }));

    const form = ref<LeadForm>({
      dealName: "",
      dealType: "",
      approvedBudgetContract: 0,
      monthlyRecurringRevenue: 0,
      implementationFee: 0,
      totalContract: 0,
      closeMonth: "",
      closeYear: "",
      winProbability: 50,
      locationId: "",
      dealSourceId: "",
      relationshipOwnerId: "",
      pointOfContactId: "",
    });

    const initForm = async () => {
      if (props.leadData && Object.keys(props.leadData).length > 0 && props.leadData.id) {
        // Edit mode - populate form with existing data
        const endDate = props.leadData.endDate?.raw ? new Date(props.leadData.endDate.raw) : new Date();

        // Set non-select fields immediately
        form.value.dealName = props.leadData.name || "";
        form.value.approvedBudgetContract = props.leadData.abc?.raw || 0;
        form.value.monthlyRecurringRevenue = props.leadData.mmr?.raw || 0;
        form.value.implementationFee = 0;
        form.value.totalContract = props.leadData.initialCosting?.raw || 0;
        form.value.closeMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        form.value.closeYear = endDate.getFullYear().toString();
        form.value.winProbability = typeof props.leadData.winProbability === "number"
          ? props.leadData.winProbability
          : typeof props.leadData.winProbability === "string"
            ? parseInt(props.leadData.winProbability) || 50
            : parseInt(props.leadData.winProbability?.key || "50") || 50;

        // Now set the select field values
        form.value.dealType = props.leadData.leadType?.key ? Number(props.leadData.leadType.key) : "";
        form.value.locationId = props.leadData.locationId || "";
        form.value.dealSourceId = props.leadData.leadSource ? Number(props.leadData.leadSource) : "";
        form.value.relationshipOwnerId = props.leadData.relationshipOwnerId || "";
        form.value.pointOfContactId = props.leadData.clientId ? Number(props.leadData.clientId) : "";
      } else {
        // Create mode - set defaults
        const today = new Date();
        form.value.dealName = "";
        form.value.dealType = "";
        form.value.approvedBudgetContract = 0;
        form.value.monthlyRecurringRevenue = 0;
        form.value.implementationFee = 0;
        form.value.totalContract = 0;
        form.value.closeMonth = String(today.getMonth() + 1).padStart(2, '0');
        form.value.closeYear = today.getFullYear().toString();
        form.value.winProbability = 50;
        form.value.locationId = "";
        form.value.dealSourceId = "";
        form.value.relationshipOwnerId = "";
        form.value.pointOfContactId = "";
      }
    };

    const saveLead = async () => {
      const isEdit = !!(props.leadData && props.leadData.id);
      $q.loading.show({ message: isEdit ? "Updating lead..." : "Creating lead..." });

      // Calculate start and end dates from close month/year
      const startDate = new Date().toISOString().substr(0, 10);
      const closeDate = new Date(parseInt(form.value.closeYear), parseInt(form.value.closeMonth), 1);
      const endDate = closeDate.toISOString().substr(0, 10);

      const param: ProjectCreateRequest = {
        name: form.value.dealName,
        description: "Lead Opportunity", // Using deal name as description for leads
        budget: form.value.approvedBudgetContract || 0, // Using ABC as budget for leads
        startDate: startDate,
        endDate: endDate,
        status: "LEAD" as ProjectCreateRequest["status"],
        ...(form.value.pointOfContactId ? {
          clientId: parseInt(form.value.pointOfContactId),
          pointOfContactId: parseInt(form.value.pointOfContactId)
        } : {}), // Only include clientId/pointOfContactId if Point of Contact is selected
        locationId: form.value.locationId || "", // Using location from form
        downpaymentAmount: 0,
        retentionAmount: 0,
        isLead: true,
        winProbability: form.value.winProbability as unknown as ProjectCreateRequest["winProbability"],
        leadSource: form.value.dealSourceId,
        leadType: String(form.value.dealType),
        abc: form.value.approvedBudgetContract,
        mmr: form.value.monthlyRecurringRevenue,
        initialCosting: form.value.totalContract,
        contactDetails: "", // Not capturing this in new form
        relationshipOwnerId: form.value.relationshipOwnerId,
        leadBoardStage: props.leadData?.leadBoardStage, // Pass the board stage from props
      };

      try {
        let response;
        if (isEdit && props.leadData?.id) {
          // Update existing lead
          param.id = props.leadData.id;
          response = await APIRequests.editLead($q, param);
        } else {
          // Create new lead
          response = await APIRequests.createLead($q, param);
        }

        $q.notify({
          color: "positive",
          message: `Lead ${isEdit ? "updated" : "created"} successfully`,
          position: "top",
        });

        if (dialog.value) {
          dialog.value.hide();
        }

        emit("close");
        emit("saveDone", response);

        // Only navigate to lead page if creating new lead
        // if (!isEdit) {
        //   router.push({
        //     name: 'member_lead_page',
        //     params: { id: response.id },
        //   });
        // }
      } catch (error) {
        console.error(`Failed to ${isEdit ? "update" : "create"} lead:`, error);
      } finally {
        $q.loading.hide();
      }
    };

    // Watch for point of contact selection changes
    watch(
      () => form.value.pointOfContactId,
      async (newContactId) => {
        if (newContactId && newContactId !== "") {
          // Future: Auto-populate additional fields from point of contact if needed
        }
      }
    );

    onMounted(() => {
      initForm();
    });

    return {
      dialog,
      form,
      monthOptions,
      yearOptions,
      initForm,
      saveLead,
    };
  },
});
</script>
