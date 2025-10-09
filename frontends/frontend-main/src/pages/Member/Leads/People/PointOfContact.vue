<template>
  <div class="point-of-contact-page">
    <!-- Header Section -->
    <div class="row justify-between items-center">
      <div class="text-dark text-title-medium-f-[18px] col-2">
        Point Of Contact
      </div>

      <!-- Filter Section -->
      <div class="row items-center justify-end q-gutter-x-md col-10">
        <div class="col-4">
          <q-select
            v-model="selectedCompany"
            :options="companyOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            label="Select by Company"
          />
        </div>
        <div class="col-4">
          <q-select
            v-model="sortBy"
            :options="sortOptions"
            outlined
            dense
            label="Sort By"
          />
        </div>
        <g-button
          icon-size="md"
          icon="add"
          label="New Record"
          @click="addNewRecord"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <!-- Loading Skeleton -->
      <table v-if="loading" class="point-of-contact-table">
        <thead>
          <tr>
            <th class="text-left">Full Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Company</th>
            <th class="text-left">Job Title</th>
            <th class="text-left">Phone</th>
            <th class="text-left">Date Created</th>
            <th class="text-left">Created By</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 5" :key="`skeleton-${n}`">
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td>
              <div class="actions-container">
                <q-skeleton type="QBtn" />
                <q-skeleton type="QBtn" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-else-if="contactsList.length === 0" class="text-center q-pa-lg">
        <q-icon name="contacts" size="64px" color="grey-4" />
        <div class="q-mt-sm text-h6 text-grey-6">
          No point of contacts found
        </div>
        <div class="text-body-small text-grey-5 q-mt-xs">
          Click "New Record" to add point of contacts
        </div>
      </div>

      <!-- Actual Data Table -->
      <table v-else class="point-of-contact-table">
        <thead>
          <tr>
            <th class="text-left">Full Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Company</th>
            <th class="text-left">Job Title</th>
            <th class="text-left">Phone</th>
            <th class="text-left">Date Created</th>
            <th class="text-left">Created By</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="contact in contactsList"
            :key="contact.id"
          >
            <td>{{ contact.fullName }}</td>
            <td>{{ contact.email }}</td>
            <td>{{ contact.company }}</td>
            <td>{{ contact.jobTitle }}</td>
            <td>{{ contact.phone }}</td>
            <td>{{ contact.dateCreated }}</td>
            <td>{{ contact.createdBy }}</td>
            <td>
              <div class="actions-container">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="o_edit"
                  color="grey-6"
                  @click="editContact(contact)"
                  class="action-btn"
                />
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="o_delete"
                  color="grey-6"
                  @click="deleteContact(contact)"
                  class="action-btn"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Point of Contact Dialog -->
    <AddEditPointOfContactDialog
      ref="addEditDialog"
      :contact-id="editingContactId"
      @created="handleContactCreated"
      @updated="handleContactUpdated"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  getCurrentInstance,
  watch,
  defineAsyncComponent,
} from "vue";
import { useQuasar, date } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPointOfContactDialog = defineAsyncComponent(
  () => import("./dialogs/AddEditPointOfContactDialog.vue")
);

defineOptions({
  name: "PointOfContact",
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Loading state
const loading = ref(false);
const totalCount = ref(0);

// Filter options
const selectedCompany = ref("");
const sortBy = ref("");

interface FilterOption {
  label: string;
  value: string | number;
}

interface PointOfContact {
  id: number;
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  dateCreated: string;
  createdBy: string;
  isActive: boolean;
}

const companyOptions = ref<FilterOption[]>([{ label: "All", value: "All" }]);

const sortOptions = [
  "Date Created",
  "Name (A-Z)",
  "Name (Z-A)",
  "Company",
  "Recent Activity",
];

// Point of contacts data
const contactsList = ref<PointOfContact[]>([]);

// Dialog reference and state
const addEditDialog = ref();
const editingContactId = ref<number | undefined>();

const fetchCompanyOptions = async () => {
  if (!$api) return;

  try {
    const response = await $api.get("/lead-company/list");
    const companies = response.data || [];

    const mappedCompanies = companies.map((company: any) => ({
      label: company.name,
      value: company.id,
    }));

    companyOptions.value = [
      { label: "All", value: "All" },
      ...mappedCompanies,
    ];
  } catch (error) {
    console.error("Error fetching company options:", error);
  }
};

const fetchPointOfContacts = async () => {
  if (!$api) return;

  loading.value = true;
  try {
    const params = new URLSearchParams();

    // Add company filter if not "All"
    if (
      selectedCompany.value &&
      selectedCompany.value !== "All" &&
      selectedCompany.value !== "all"
    ) {
      params.append("companyId", selectedCompany.value.toString());
    }

    // Add sort parameter
    if (sortBy.value) {
      params.append("sortBy", sortBy.value);
    }

    const response = await $api.get(
      `/point-of-contact/list?${params.toString()}`
    );

    // Format the dates for display
    contactsList.value = response.data.data.map((contact: any) => ({
      ...contact,
      dateCreated: date.formatDate(contact.dateCreated, "MMM DD, YYYY"),
    }));

    totalCount.value =
      response.data.pagination?.total || response.data.data.length;
  } catch (error) {
    console.error("Error fetching point of contacts:", error);
  } finally {
    loading.value = false;
  }
};

const addNewRecord = () => {
  editingContactId.value = undefined;
  if (addEditDialog.value) {
    addEditDialog.value.show();
  }
};

const editContact = (contact: PointOfContact) => {
  editingContactId.value = contact.id;
  if (addEditDialog.value) {
    addEditDialog.value.show();
  }
};

const handleContactCreated = async () => {
  // Refresh the contact list to show the new contact
  await fetchPointOfContacts();
};

const handleContactUpdated = async () => {
  // Refresh the contact list to show the updated contact
  await fetchPointOfContacts();
};

const deleteContact = async (contact: PointOfContact) => {
  if (!$api) return;

  $q.dialog({
    title: "Delete Point of Contact",
    message: `Are you sure you want to delete ${contact.fullName}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      loading.value = true;

      console.log("Attempting to delete contact ID:", contact.id);

      // Permanently delete (hard delete) instead of archiving
      await $api.delete(`/point-of-contact/${contact.id}`);

      console.log("Delete successful!");

      $q.notify({
        color: "positive",
        message: "Point of contact deleted successfully!",
        icon: "check_circle",
      });

      // Refresh the list
      await fetchPointOfContacts();
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Show more detailed error message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          "Failed to delete point of contact";

      $q.notify({
        color: "negative",
        message: errorMessage,
        icon: "error",
      });
    } finally {
      loading.value = false;
    }
  });
};

// Load data when component mounts
onMounted(async () => {
  // Fetch all initial data in parallel
  await Promise.all([fetchCompanyOptions(), fetchPointOfContacts()]);
});

// Watch for filter changes
watch([selectedCompany, sortBy], () => {
  fetchPointOfContacts();
});
</script>

<style scoped>
.point-of-contact-page {
  background-color: #fff;
  border-radius: 24px;
  min-height: calc(100vh - 95px);
  padding: 24px;
}

.table-container {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  max-height: calc(100vh - 210px);
  overflow: auto;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}

.point-of-contact-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
  overflow: hidden;
  border-radius: 8px;

  thead {
    tr {
      th {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
        color: #333 !important;
      }
    }
  }
  tbody {
    &.loading {
      opacity: 0.5;
    }
    tr {
      td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
      }
    }
  }
}

.actions-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .point-of-contact-page {
    padding: 16px;
  }
}
</style>
