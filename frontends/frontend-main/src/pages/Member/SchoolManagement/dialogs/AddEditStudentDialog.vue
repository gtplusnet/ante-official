<template>
  <q-dialog ref="dialog" v-model="model">
    <template-dialog max-width="800px" icon="o_school" icon-color="black">
      <template #DialogTitle>
        {{ isEdit ? "Edit" : "Create" }} Student
      </template>

      <template #DialogContent>
        <q-form @submit.prevent="onSubmit" class="row">
          <div class="form-container q-px-md">
            <!-- Personal Information Section -->
            <div class="col-12">
              <div class="text-title-medium text-grey-light">
                Personal Information
              </div>
              <q-separator class="q-mt-xs q-mb-md q-mr-md" />
            </div>

            <div class="row col-12 q-col-gutter-md">
              <!-- First Name -->
              <div class="col-12 col-md-4">
                <GlobalInputTemplate
                  :required="true"
                  type="text"
                  label="First Name"
                  v-model="formData.firstName"
                />
              </div>

              <!-- Last Name -->
              <div class="col-12 col-md-4">
                <GlobalInputTemplate
                  :required="true"
                  type="text"
                  label="Last Name"
                  v-model="formData.lastName"
                />
              </div>

              <!-- Middle Name -->
              <div class="col-12 col-md-4">
                <GlobalInputTemplate
                  type="text"
                  label="Middle Name"
                  v-model="formData.middleName"
                />
              </div>

              <!-- Date of Birth -->
              <div class="col-6">
                <GlobalInputTemplate
                  :required="true"
                  type="date"
                  label="Date of Birth"
                  v-model="formData.dateOfBirth"
                />
              </div>

              <!-- Gender -->
              <div class="col-6">
                <GlobalInputTemplate
                  type="select"
                  label="Gender"
                  v-model="formData.gender"
                  :options="genderOptions"
                  :required="true"
                />
              </div>

              <!-- Profile Photo -->
              <div class="col-12">
                <GlobalInputTemplate
                  v-model="profilePhotoData"
                  label="Profile Photo"
                  type="file"
                  accept="image/*"
                />
              </div>
            </div>

            <!-- Academic Information Section -->
            <div class="col-12 q-mt-md">
              <div class="text-title-medium text-grey-light">
                Academic Information
              </div>
              <q-separator class="q-mt-xs q-mb-md q-mr-md" />
            </div>

            <div class="row col-12 q-col-gutter-md">
              <!-- Student Number -->
              <div class="col-6">
                <GlobalInputTemplate
                  type="text"
                  label="Student Number"
                  v-model="formData.studentNumber"
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <!-- LRN -->
              <div class="col-6">
                <GlobalInputTemplate
                  type="text"
                  label="LRN (Learner Reference Number)"
                  v-model="formData.lrn"
                />
              </div>

              <!-- Section (Required) -->
              <div class="col-6">
                <GlobalInputTemplate
                  type="select"
                  label="Section"
                  v-model="formData.sectionId"
                  :options="sectionOptions"
                  :required="true"
                  :loading="loadingSections"
                />
              </div>

              <!-- Adviser (Auto-populated) -->
              <div class="col-6">
                <GlobalInputTemplate
                  type="text"
                  label="Adviser"
                  v-model="adviserName"
                  :disabled="true"
                  placeholder="Select a section first"
                />
              </div>
            </div>

            <!-- Guardian Information Section -->
            <div class="col-12 q-mt-md">
              <div class="text-title-medium text-grey-light">
                Guardian Information (Optional)
              </div>
              <q-separator class="q-mt-xs q-mb-md q-mr-md" />
            </div>

            <div class="row col-12 q-col-gutter-md">
              <!-- Temporary Guardian Name -->
              <div class="col-12 col-md-6">
                <GlobalInputTemplate
                  type="text"
                  label="Full Name"
                  v-model="formData.temporaryGuardianName"
                  placeholder="Enter guardian name"
                />
              </div>

              <!-- Temporary Guardian Contact Number -->
              <div class="col-12 col-md-6">
                <GlobalInputTemplate
                  type="phone"
                  label="Contact Number"
                  v-model="formData.temporaryGuardianContactNumber"
                  placeholder="Enter contact number"
                />
              </div>

              <!-- Temporary Guardian Address -->
              <div class="col-12">
                <GlobalInputTemplate
                  type="text"
                  label="Address"
                  v-model="formData.temporaryGuardianAddress"
                  placeholder="Enter guardian address"
                />
              </div>
            </div>
          </div>

          <div class="col-12 text-right q-pr-md q-my-md">
            <g-button
              label="Close"
              variant="outline"
              color="primary"
              class="q-mr-sm"
              v-close-popup
            />
            <g-button
              label="Save Student"
              variant="filled"
              color="primary"
              type="submit"
              :loading="loading"
            />
          </div>
        </q-form>
      </template>
    </template-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import GButton from "src/components/shared/buttons/GButton.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GlobalInputTemplate from "src/components/shared/form/GlobalInput/GlobalInputTemplate.vue";
import type { StudentResponse } from "@shared/response";
import { AxiosError } from "axios";

export default defineComponent({
  name: "AddEditStudentDialog",
  components: {
    GButton,
    TemplateDialog,
    GlobalInputTemplate,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    studentData: {
      type: Object as () => { data: StudentResponse } | null,
      default: null,
    },
  },
  emits: ["update:modelValue", "close", "saveDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const loadingSections = ref(false);
    const profilePhotoData = ref<any>(null);
    const dialog = ref();
    const sectionOptions = ref<
      Array<{ label: string; value: string; adviserName: string }>
    >([]);
    const sections = ref<any[]>([]);

    const model = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const isEdit = computed(() => !!props.studentData);

    const genderOptions = [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
    ];

    const formData = ref({
      firstName: "",
      lastName: "",
      middleName: "",
      studentNumber: "",
      lrn: "",
      dateOfBirth: "",
      gender: "",
      sectionId: "",
      temporaryGuardianName: "",
      temporaryGuardianAddress: "",
      temporaryGuardianContactNumber: "",
    });

    // Computed property for adviser name based on selected section
    const adviserName = computed(() => {
      if (!formData.value.sectionId) return "";
      const selectedSection = sections.value.find(
        (s) => s.id === formData.value.sectionId
      );
      return selectedSection?.adviserName || "";
    });

    const formatGender = (gender: string) => {
      if (!gender) return "";
      const normalized = gender.toUpperCase();
      if (normalized === "MALE") return "Male";
      if (normalized === "FEMALE") return "Female";
      return gender; // Return original if not recognized
    };

    // Load sections from API
    const loadSections = async () => {
      try {
        loadingSections.value = true;
        const response = await api.get("school/section/list");
        // Fix: API returns data directly, not nested in data.data
        sections.value = response.data || [];

        // Format sections for the dropdown
        sectionOptions.value = sections.value.map((section) => ({
          label: `${section.name} - ${
            section.gradeLevel?.name || "No Grade Level"
          }`,
          value: section.id,
          adviserName: section.adviserName,
        }));
      } catch (error) {
        console.error("Failed to load sections:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load sections",
        });
      } finally {
        loadingSections.value = false;
      }
    };

    const resetForm = () => {
      if (props.studentData) {
        // Convert MM/DD/YYYY to YYYY-MM-DD for date input
        let dateOfBirth = "";
        if (props.studentData.data.dateOfBirth) {
          const dateParts = props.studentData.data.dateOfBirth.split("/");
          if (dateParts.length === 3) {
            // Convert MM/DD/YYYY to YYYY-MM-DD
            const month = dateParts[0].padStart(2, "0");
            const day = dateParts[1].padStart(2, "0");
            const year = dateParts[2];
            dateOfBirth = `${year}-${month}-${day}`;
          }
        }

        // Helper function to clean phone number (remove leading 0s)
        const cleanPhoneNumber = (phone: string | null | undefined): string => {
          if (!phone) return "";
          // Remove leading zeros since we're using +63
          return phone.replace(/^0+/, "");
        };

        formData.value = {
          firstName: props.studentData.data.firstName,
          lastName: props.studentData.data.lastName,
          middleName: props.studentData.data.middleName || "",
          studentNumber: props.studentData.data.studentNumber,
          lrn: props.studentData.data.lrn || "",
          dateOfBirth: dateOfBirth,
          gender: formatGender(props.studentData.data.gender),
          sectionId: props.studentData.data.section?.id || "",
          temporaryGuardianName:
            props.studentData.data.temporaryGuardianName ||
            props.studentData.data.guardian?.name ||
            "",
          temporaryGuardianAddress:
            props.studentData.data.temporaryGuardianAddress ||
            props.studentData.data.guardian?.address ||
            "",
          temporaryGuardianContactNumber: cleanPhoneNumber(
            props.studentData.data.temporaryGuardianContactNumber ||
              props.studentData.data.guardian?.contactNumber
          ),
        };
        profilePhotoData.value = props.studentData.data.profilePhoto || null;
      } else {
        formData.value = {
          firstName: "",
          lastName: "",
          middleName: "",
          studentNumber: "",
          lrn: "",
          dateOfBirth: "",
          gender: "",
          sectionId: "",
          temporaryGuardianName: "",
          temporaryGuardianAddress: "",
          temporaryGuardianContactNumber: "",
        };
        profilePhotoData.value = null;
      }
    };

    const onSubmit = async () => {
      // Validate required fields
      if (
        !formData.value.firstName ||
        !formData.value.lastName ||
        !formData.value.dateOfBirth ||
        !formData.value.gender ||
        !formData.value.sectionId
      ) {
        $q.notify({
          type: "negative",
          message: "Please fill in all required fields",
        });
        return;
      }

      loading.value = true;
      try {
        const payload = {
          ...formData.value,
          profilePhotoId: profilePhotoData.value ? profilePhotoData.value.id : null,
        };

        if (isEdit.value && props.studentData) {
          await api.put(
            `school/student/update?id=${props.studentData.data.id}`,
            payload
          );
          $q.notify({
            type: "positive",
            message: "Student updated successfully",
          });
        } else {
          await api.post("school/student/create", payload);
          $q.notify({
            type: "positive",
            message: "Student created successfully",
          });
        }

        handleSuccess();
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: "negative",
          message:
            axiosError.response?.data?.message || "Failed to save student",
        });
      } finally {
        loading.value = false;
      }
    };

    const onCancel = () => {
      emit("close");
    };

    const handleSuccess = () => {
      emit("saveDone");
      emit("close");
      if ((dialog.value as any)?.$refs?.dialog) {
        (dialog.value as any).$refs.dialog.hide();
      }
    };

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          resetForm();
          loadSections();
        }
      }
    );

    watch(model, () => {
      // Model changed
    });

    onMounted(() => {
      loadSections();
    });

    return {
      dialog,
      model,
      isEdit,
      loading,
      loadingSections,
      profilePhotoData,
      formData,
      genderOptions,
      sectionOptions,
      adviserName,
      onSubmit,
      onCancel,
    };
  },
});
</script>

<style lang="scss" scoped>
.form-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--q-scroll-background-track) var(--q-scroll-background);
}
</style>
