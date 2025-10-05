<template>
  <q-dialog ref="dialog" @before-show="initForm">
    <TemplateDialog minWidth="500px" maxWidth="500px">
      <template #DialogIcon>
        <q-icon name="business" />
      </template>

      <template #DialogTitle>
        <div class="cursor-pointer">{{ companyData?.id ? "Edit" : "Create" }} Company</div>
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <q-form @submit.prevent="save">
            <div class="row">
              <!-- Company Name -->
              <div class="col-12 q-px-sm">
                <g-input required type="text" label="Company Name" v-model="form.companyName" />
              </div>

              <!-- Account Owner with Plus button -->
              <div class="col-12 q-mb-md q-px-sm">
                <g-input
                  v-model="form.accountOwnerId"
                  label="Account Owner"
                  type="select-search-with-add"
                  :options="accountOwnerOptions"
                  @showAddDialog="showAccountOwnerAddDialog"
                  ref="accountOwnerSelect"
                  required
                />
              </div>

              <!-- Number of Employees -->
              <div class="col-12 q-px-sm">
                <g-input type="number" label="Number of Employees" v-model="form.numberOfEmployees" :min="1" />
              </div>
            </div>

            <div class="text-right">
              <GButton
                no-caps
                class="q-mr-sm"
                variant="tonal"
                label="Cancel"
                type="button"
                color="light-grey"
                v-close-popup
              />
              <GButton no-caps unelevated :label="companyData?.id ? 'Update' : 'Save'" type="submit" color="primary" />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>

    <!-- Add Account Owner Dialog (placeholder) -->
    <q-dialog v-model="isAddAccountOwnerDialogOpen">
      <TemplateDialog minWidth="400px" maxWidth="400px">
        <template #DialogTitle>
          <div class="text-h6">Add New Account Owner</div>
        </template>

        <template #DialogContent>
          <q-form @submit.prevent="addNewAccountOwner" class="q-px-md q-pb-md">
            <g-input v-model="newAccountOwner.name" label="Name" required outlined dense />
            <g-input v-model="newAccountOwner.email" label="Email" required outlined dense class="q-mt-md" />
            <div class="text-right">
              <GButton
                no-caps
                class="q-mr-sm"
                variant="tonal"
                label="Cancel"
                type="button"
                color="light-grey"
                v-close-popup
              />
              <GButton no-caps unelevated label="Save" type="submit" color="primary" />
            </div>
          </q-form>
        </template>
      </TemplateDialog>
    </q-dialog>
  </q-dialog>
</template>

<style scoped lang="scss">
/* Styles managed by TemplateDialog */
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { defineAsyncComponent } from 'vue';
import { QDialog, useQuasar } from "quasar";
import GInput from "src/components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface CompanyForm {
  companyName: string;
  accountOwnerId: number | null;
  numberOfEmployees: number;
}

interface CompanyData {
  id?: number;
  companyName: string;
  accountOwnerId: number;
  numberOfEmployees: number;
}

export default defineComponent({
  name: "AddEditCompanyDialog",
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  props: {
    companyData: {
      type: Object as () => CompanyData | null,
      default: null,
    },
  },
  emits: ["close", "saveDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog>>();
    const accountOwnerSelect = ref<InstanceType<typeof GInput> | null>(null);
    const isAddAccountOwnerDialogOpen = ref(false);

    const form = ref<CompanyForm>({
      companyName: "",
      accountOwnerId: null,
      numberOfEmployees: 10,
    });

    const newAccountOwner = ref({
      name: "",
      email: "",
    });

    // Static account owner options for UI demonstration
    const accountOwnerOptions = ref([
      { value: 1, label: "John Smith", email: "john.smith@company.com" },
      { value: 2, label: "Sarah Johnson", email: "sarah.johnson@company.com" },
      { value: 3, label: "Michael Davis", email: "michael.davis@company.com" },
      { value: 4, label: "Emily Wilson", email: "emily.wilson@company.com" },
      { value: 5, label: "Robert Brown", email: "robert.brown@company.com" },
    ]);

    const initForm = () => {
      if (props.companyData && props.companyData.id) {
        // Edit mode - populate form with existing data
        form.value = {
          companyName: props.companyData.companyName || "",
          accountOwnerId: props.companyData.accountOwnerId || null,
          numberOfEmployees: props.companyData.numberOfEmployees || 10,
        };
      } else {
        // Create mode - reset form
        form.value = {
          companyName: "",
          accountOwnerId: null,
          numberOfEmployees: 10,
        };
      }
    };

    const showAccountOwnerAddDialog = () => {
      isAddAccountOwnerDialogOpen.value = true;
    };

    const addNewAccountOwner = () => {
      if (newAccountOwner.value.name && newAccountOwner.value.email) {
        // Add new account owner to options (static implementation)
        const newId = Math.max(...accountOwnerOptions.value.map((o) => o.value)) + 1;
        accountOwnerOptions.value.push({
          value: newId,
          label: newAccountOwner.value.name,
          email: newAccountOwner.value.email,
        });

        // Select the newly added account owner
        form.value.accountOwnerId = newId;

        // Reset and close dialog
        newAccountOwner.value = { name: "", email: "" };
        isAddAccountOwnerDialogOpen.value = false;

        $q.notify({
          message: "Account owner added successfully",
          color: "positive",
          position: "top",
          timeout: 2000,
        });
      }
    };

    const save = async () => {
      const isEdit = !!props.companyData?.id;
      $q.loading.show({
        message: isEdit ? "Updating company..." : "Creating company...",
      });

      try {
        // Simulate API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Static response data
        const responseData = {
          id: isEdit ? props.companyData!.id : Date.now(),
          ...form.value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        $q.notify({
          message: `Company ${isEdit ? "updated" : "created"} successfully`,
          color: "positive",
          position: "top",
          timeout: 2000,
        });

        emit("saveDone", responseData);
        emit("close");

        if (dialog.value) {
          dialog.value.hide();
        }
      } catch (error) {
        $q.notify({
          message: `Failed to ${isEdit ? "update" : "create"} company`,
          color: "negative",
          position: "top",
          timeout: 2000,
        });
      } finally {
        $q.loading.hide();
      }
    };

    return {
      dialog,
      accountOwnerSelect,
      form,
      isAddAccountOwnerDialogOpen,
      newAccountOwner,
      accountOwnerOptions,
      initForm,
      showAccountOwnerAddDialog,
      addNewAccountOwner,
      save,
    };
  },
});
</script>
