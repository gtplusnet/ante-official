<template>
  <q-dialog ref="dialog" @before-show="onDialogShow" persistent>
    <TemplateDialog maxWidth="600px">
      <template #DialogIcon>
        <q-icon
          :name="viewOnly ? 'visibility' : isEditMode ? 'edit' : 'person_add'"
        />
      </template>
      <template #DialogTitle>
        {{
          viewOnly
            ? "View Point of Contact"
            : isEditMode
            ? "Edit Point of Contact"
            : "Add Point of Contact"
        }}
      </template>
      <template #DialogContent>
        <q-form
          @submit.prevent="submitContact"
          ref="form"
          class="q-px-md q-pb-md"
        >
          <!-- Full Name Field -->
          <GInput
            v-model="formData.fullName"
            label="Full Name"
            type="text"
            :required="!viewOnly"
            :rules="viewOnly ? [] : [(val: string) => !!val || 'Full name is required']"
            :isDisabled="viewOnly"
            ref="firstInput"
            class="text-body-small"
          />

          <!-- Email Field -->
          <GInput
            v-model="formData.email"
            label="Email"
            type="email"
            :required="!viewOnly"
            :rules="viewOnly ? [] : [
              (val: string) => !!val || 'Email is required',
              (val: string) => /.+@.+\..+/.test(val) || 'Please enter a valid email'
            ]"
            :isDisabled="viewOnly"
            class="text-body-small"
          />

          <!-- Job Title Field -->
          <GInput
            v-model="formData.jobTitle"
            label="Job Title"
            type="text"
            :isDisabled="viewOnly"
            class="text-body-small"
          />

          <!-- Phone Field -->
          <GInput
            v-model="formData.phone"
            label="Phone"
            type="text"
            :isDisabled="viewOnly"
            class="text-body-small"
          />

          <!-- Company Field -->
          <SelectionCompany
            v-model="formData.companyId"
            required
            :disabled="viewOnly"
          />

          <!-- Actions -->
          <div class="text-right q-mt-md">
            <GButton
              no-caps
              class="q-mr-sm"
              variant="tonal"
              :label="viewOnly ? 'Close' : 'Cancel'"
              type="button"
              v-close-popup
            />
            <GButton
              v-if="!viewOnly"
              no-caps
              :label="isEditMode ? 'Update' : 'Create'"
              type="submit"
              color="primary"
              :loading="submitting"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts" setup>
import {
  ref,
  getCurrentInstance,
  nextTick,
  computed,
  defineAsyncComponent,
} from "vue";
import { useQuasar } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";
import GInput from "src/components/shared/form/GInput.vue";
import SelectionCompany from "src/components/selection/SelectionCompany.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(
  () => import("src/components/dialog/TemplateDialog.vue")
);

defineOptions({
  name: "AddEditPointOfContactDialog",
});

// Props
const props = defineProps<{
  contactId?: number;
  viewOnly?: boolean;
}>();

// Emits
const emit = defineEmits<{
  created: [contact: any];
  updated: [contact: any];
}>();

// Computed
const isEditMode = computed(() => !!props.contactId);

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Refs
const dialog = ref();
const form = ref();
const firstInput = ref();

// Form data
interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: number | null;
}

const initialForm: ContactForm = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  companyId: null,
};

const formData = ref<ContactForm>({ ...initialForm });

// State
const submitting = ref(false);

// Methods
const fetchContactData = async () => {
  if (!$api || !props.contactId) return;

  submitting.value = true;
  try {
    const response = await $api.get(`/point-of-contact/${props.contactId}`);
    const contact = response.data;

    // Get company ID
    const companyId = contact.company?.id || contact.companyId;

    // Populate form with existing data
    formData.value = {
      fullName: contact.fullName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      jobTitle: contact.jobTitle || "",
      companyId: companyId ? Number(companyId) : null,
    };
  } catch (error) {
    console.error("Error fetching contact data:", error);
    $q.notify({
      color: "negative",
      message: "Failed to load contact data",
      icon: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formData.value = { ...initialForm };
  if (form.value) {
    form.value.resetValidation();
  }
};

const onDialogShow = async () => {
  resetForm();

  // If in edit mode, fetch the contact data
  if (isEditMode.value) {
    await fetchContactData();

    // Debug: Check if company is properly matched
    console.log("Selected Company ID:", formData.value.companyId);
    console.log("Selected Company ID Type:", typeof formData.value.companyId);
  }

  // Focus on first input after dialog is fully shown (only if not in view mode)
  if (!props.viewOnly) {
    nextTick(() => {
      if (firstInput.value?.$el) {
        const input = firstInput.value.$el.querySelector("input");
        if (input) input.focus();
      }
    });
  }
};

const submitContact = async () => {
  if (!$api) return;

  // Validate form
  const isValid = await form.value.validate();
  if (!isValid) {
    return;
  }

  submitting.value = true;
  try {
    let response;
    let successMessage;

    if (isEditMode.value) {
      // Update existing contact
      response = await $api.put(
        `/point-of-contact/${props.contactId}`,
        formData.value
      );
      successMessage = `Successfully updated contact: ${formData.value.fullName}`;

      // Emit the updated event
      emit("updated", response.data);
    } else {
      // Create new contact
      response = await $api.post("/point-of-contact", formData.value);
      successMessage = `Successfully created contact: ${formData.value.fullName}`;

      // Emit the created event
      emit("created", response.data);
    }

    $q.notify({
      color: "positive",
      message: successMessage,
      icon: "check_circle",
    });

    // Close dialog
    dialog.value.hide();
  } catch (error: any) {
    console.error(
      `Error ${isEditMode.value ? "updating" : "creating"} contact:`,
      error
    );

    // Show error message
    let displayMessage = `Failed to ${
      isEditMode.value ? "update" : "create"
    } contact`;
    if (error.response?.data?.message) {
      displayMessage = error.response.data.message;
    }

    $q.notify({
      color: "negative",
      message: displayMessage,
      icon: "error",
    });
  } finally {
    submitting.value = false;
  }
};

// Expose methods for parent component
defineExpose({
  show: () => dialog.value.show(),
  hide: () => dialog.value.hide(),
});
</script>

<style scoped lang="scss">
/* Component styles handled by child components */
</style>
