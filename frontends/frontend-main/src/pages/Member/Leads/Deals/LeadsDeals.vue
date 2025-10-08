<template>
  <div class="leads-deals">
    <div class="lead-head">
      <!-- title and button group -->
      <div class="row items-center">
        <div class="text-dark text-title-medium-f-[18px] q-mr-md">
          All Deals
        </div>
        <div class="button-group">
          <div
            @click="setActiveView(view.name)"
            v-for="view in viewList"
            :key="view.name"
            class="button"
            :class="activeView == view.name ? 'active' : ''"
          >
            <q-icon :name="view.icon"></q-icon>
          </div>
        </div>
      </div>

      <!-- filter and action button -->
      <div class="row items-center">
        <!-- board filter -->
        <div class="row items-center">
          <q-select
            class="select-box q-mr-sm"
            rounded
            outlined
            dense
            v-model="filterRelationshipOwner"
            :options="optionsRelationshipOwner"
            label="Filter by Relationship Owner"
            emit-value
            map-options
          />
          <div class="row items-center">
            <q-select
              class="select-box q-mr-xs"
              rounded
              outlined
              dense
              v-model="filterDealType"
              :options="optionsDealType"
              label="Filter by Deal Type"
              emit-value
              map-options
            />
          </div>
          <q-select
            v-if="activeView == 'grid' || activeView == 'list'"
            class="select-box q-mr-sm"
            rounded
            outlined
            dense
            v-model="filterStage"
            :options="optionsStage"
            label="Filter by Stage"
            emit-value
            map-options
          />
        </div>

        <!-- action button -->
        <div>
          <g-button
            label="Add Deal Type"
            color="primary"
            icon="add"
            icon-size="md"
            class="q-mr-sm"
            @click="handleAddDealType"
          />
          <GButton
            class="actions text-label-large"
            unelevated
            color="primary"
            icon="add"
            icon-size="md"
            label="New Lead"
            @click="handleAddLead"
          />
        </div>
      </div>
    </div>

    <div class="page-content q-mt-md">
      <component :is="currentViewComponent" ref="leadsView"></component>
    </div>

    <!-- Deal Type Dialog -->
    <AddEditDealTypeDialog
      ref="dealTypeDialog"
      @created="handleDealTypeCreated"
      @updated="handleDealTypeUpdated"
    />
  </div>
</template>

<style scoped src="../Leads.scss"></style>

<style scoped lang="scss">
.leads-deals {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background-color: #fff;
  border-radius: 24px;
}

.select-box {
  width: 200px;
}
</style>

<script lang="ts" setup>
import {
  ref,
  computed,
  onMounted,
  ComponentPublicInstance,
  getCurrentInstance,
  defineAsyncComponent,
} from "vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import LeadsBoardView from "./LeadsBoardView.vue";
import LeadsGridView from "./LeadsGridView.vue";
import LeadsListView from "./LeadsListView.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditDealTypeDialog = defineAsyncComponent(
  () => import("src/components/dialog/AddEditDealTypeDialog.vue")
);

defineOptions({
  name: "LeadsDashboard",
});

interface ViewItem {
  icon: string;
  name: string;
}

interface DealType {
  id: number;
  typeName: string;
}

const { proxy } = getCurrentInstance() as any;

const filterRelationshipOwner = ref("all");
const optionsRelationshipOwner = [
  { label: "All", value: "all" },
  { label: "Owner", value: "owner" },
];

const filterDealType = ref("all");
const optionsDealType = ref([{ label: "All", value: "all" }]);

const filterStage = ref("all");
const optionsStage = [
  { label: "All", value: "all" },
  { label: "Opportunity", value: "opportunity" },
  { label: "Contacted", value: "contacted" },
  { label: "Proposal", value: "proposal" },
  { label: "In-Negotiation", value: "in-negotiation" },
  { label: "Win", value: "win" },
  { label: "Lost", value: "lost" },
];

const leadsView = ref<ComponentPublicInstance | null>(null);
const dealTypeDialog = ref<InstanceType<typeof AddEditDealTypeDialog> | null>(
  null
);

const activeView = ref<string>("board");
const viewList = ref<ViewItem[]>([
  { icon: "view_week", name: "board" },
  { icon: "dashboard", name: "grid" },
  { icon: "view_list", name: "list" },
]);

const currentViewComponent = computed(() => {
  switch (activeView.value) {
    case "grid":
      return LeadsGridView;
    case "board":
      return LeadsBoardView;
    case "list":
      return LeadsListView;
    default:
      return LeadsGridView;
  }
});

const setActiveView = (view: string): void => {
  activeView.value = view;
};

const handleAddLead = () => {
  if (leadsView.value && "addLead" in leadsView.value) {
    (leadsView.value as unknown as { addLead: () => void }).addLead();
  }
};

const handleAddDealType = () => {
  if (dealTypeDialog.value) {
    dealTypeDialog.value.show();
  }
};

const handleDealTypeCreated = () => {
  // Refresh the deal types options
  loadDealTypes();
};

const handleDealTypeUpdated = () => {
  // Refresh the deal types options
  loadDealTypes();
};

const loadDealTypes = async () => {
  try {
    const response = await proxy.$api.get("/deal-type");
    const dealTypes: DealType[] = response.data.data || [];

    // Update the options array
    optionsDealType.value = [
      { label: "All", value: "all" },
      ...dealTypes.map((dealType: DealType) => ({
        label: dealType.typeName,
        value: dealType.id.toString(),
      })),
    ];
  } catch (error) {
    console.error("Failed to load deal types:", error);
    // Keep default options on error
    optionsDealType.value = [{ label: "All", value: "all" }];
  }
};

onMounted(async () => {
  // Load deal types on component mount
  await loadDealTypes();
});
</script>
