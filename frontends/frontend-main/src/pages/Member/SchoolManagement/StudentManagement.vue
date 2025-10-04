<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Student Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_student_management' }" />
              <q-breadcrumbs-el label="People Management" />
              <q-breadcrumbs-el label="Students" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <g-button
            @click="exportStudentsCSV()"
            label="Export Students"
            icon="o_download"
            icon-size="md"
            variant="tonal"
            class="q-mr-sm"
          />
          <g-button
            @click="viewStudentIdPdf()"
            label="Export Student ID"
            icon="o_download"
            icon-size="md"
            variant="tonal"
            class="q-mr-sm"
          />
          <g-button
            @click="openImportStudentsDialog()"
            label="Import Students"
            icon="o_file_upload"
            icon-size="md"
            variant="tonal"
            class="q-mr-sm"
          />
          <g-button @click="openAddStudentDialog()" label="Add Student" icon="add" icon-size="md" color="primary" />
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table :isRowActionEnabled="true" tableKey="studentTable" apiUrl="school/student/table" ref="table">
        <!-- Profile Photo Slot -->
        <template v-slot:profilePhoto="props">
          <q-avatar size="40px">
            <img
              :src="props.data.profilePhoto ? props.data.profilePhoto.url : defaultStudentImage"
              :alt="props.data.firstName + ' ' + props.data.lastName"
            />
          </q-avatar>
        </template>

        <!-- Student Name Slot (Full Name) -->
        <template v-slot:studentName="props">
          <span>{{ formatStudentName(props.data) }}</span>
        </template>

        <!-- Section Slot (Grade Level / Section) -->
        <template v-slot:section="props">
          <span v-if="props.data.section && props.data.section.gradeLevel">
            {{ props.data.section.gradeLevel.name }} - {{ props.data.section.name }}
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Guardian Name Slot -->
        <template v-slot:guardianName="props">
          <span v-if="props.data.guardian && props.data.guardian.name">
            {{ props.data.guardian.name }}
          </span>
          <span v-else-if="props.data.temporaryGuardianName">
            {{ props.data.temporaryGuardianName }}
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Guardian Address Slot -->
        <template v-slot:guardianAddress="props">
          <span v-if="props.data.guardian && props.data.guardian.address">
            {{ props.data.guardian.address }}
          </span>
          <span v-else-if="props.data.temporaryGuardianAddress">
            {{ props.data.temporaryGuardianAddress }}
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Guardian Contact No Slot -->
        <template v-slot:guardianContact="props">
          <span v-if="props.data.guardian && props.data.guardian.contactNumber">
            {{ props.data.guardian.contactNumber }}
          </span>
          <span v-else-if="props.data.temporaryGuardianContactNumber">
            {{ props.data.temporaryGuardianContactNumber }}
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Date Created Slot -->
        <template v-slot:createdAt="props">
          <span v-if="props.data.createdAt">
            {{
              new Date(props.data.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            }}
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Row Actions -->
        <template v-slot:row-actions="props">
          <g-button color="grey-7" round flat icon="more_horiz" size="sm" icon-size="md">
            <q-menu fit auto-close anchor="bottom right" self="top left">
              <q-list style="min-width: 150px">
                <div>
                  <div clickable @click="viewIdDialog(props)" class="row menu-item items-center q-pa-xs q-pl-sm cursor-pointer">
                    <q-icon name="visibility" color="grey" size="16px" />
                    <div class="text-blue text-label-small-w-[400] q-pa-xs q-ml-xs">View ID</div>
                  </div>
                  <div clickable @click="viewStudent(props)" class="row menu-item items-center q-pa-xs q-pl-sm cursor-pointer">
                    <q-icon name="visibility" color="grey" size="16px" />
                    <div class="text-blue text-label-small-w-[400] q-pa-xs q-ml-xs">View</div>
                  </div>
                  <div clickable @click="editStudent(props)" class="row menu-item items-center q-pa-xs q-pl-sm cursor-pointer">
                    <q-icon name="edit" color="grey" size="16px" />
                    <div class="text-blue text-label-small-w-[400] q-pa-xs q-ml-xs">Edit</div>
                  </div>
                  <div clickable @click="assignToGuardian(props.data)" class="row menu-item items-center q-pa-xs q-pl-sm cursor-pointer">
                    <q-icon name="o_family_restroom" color="grey" size="16px" />
                    <div class="text-blue text-label-small-w-[400] q-pa-xs q-ml-xs">Assign to Guardian</div>
                  </div>
                  <div clickable @click="deleteStudent(props.data)" class="row menu-item items-center q-pa-xs q-pl-sm cursor-pointer">
                    <q-icon name="delete" color="grey" size="16px" />
                    <div class="text-blue text-label-small-w-[400] q-pa-xs q-ml-xs">Delete</div>
                  </div>
                </div>
              </q-list>
            </q-menu>
          </g-button>
        </template>
      </g-table>
    </g-card>

    <!-- View Export Student ID -->
    <ViewExportStudentIdDilaog
      v-model="openViewExportStudentIdDialog"
    />
    
    <!-- View Id -->
     <ViewStudentIdDialog
      :studentData="studentData"
      v-model="openViewIdDialog"
    />

    <!-- Dialogs -->
    <ViewStudentDialog
      @close="openViewDialog = false"
      @edit="openEditStudent"
      :studentData="studentData"
      v-model="openViewDialog"
    />

    <AddEditStudentDialog
      @saveDone="handleTableRefetch"
      @close="openAddEditDialog = false"
      :studentData="studentData"
      v-model="openAddEditDialog"
    />

    <ImportStudentsDialog
      @importDone="handleTableRefetch"
      @close="openImportDialog = false"
      v-model="openImportDialog"
    />

    <AssignGuardianDialog
      @assignDone="handleAssignGuardianDone"
      @close="openAssignGuardianDialog = false"
      :studentData="selectedStudent"
      v-model="openAssignGuardianDialog"
    />
  </expanded-nav-page-container>
</template>

<style scoped>
.menu-item {
  &:hover {
    background-color: #f5f5f5;
  }
}
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import GTable from "src/components/shared/display/GTable.vue";
import { defineAsyncComponent } from 'vue';
import GCard from "src/components/shared/display/GCard.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import ViewStudentIdDialog from "./dialogs/ViewStudentIdDialog.vue";
import ViewStudentDialog from "./dialogs/ViewStudentDialog.vue";
import AddEditStudentDialog from "./dialogs/AddEditStudentDialog.vue";
import AssignGuardianDialog from "./dialogs/AssignGuardianDialog.vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { AxiosError } from "axios";
import type { StudentResponse } from "@shared/response";
import ExpandedNavPageContainer from "../../../components/shared/ExpandedNavPageContainer.vue";
import defaultStudentImage from "src/assets/default-student.svg";
import ViewExportStudentIdDilaog from "./dialogs/ViewExportStudentIdDilaog.vue";

// Lazy-loaded heavy dialog (TASK-008: Extended - Reduce initial bundle)
const ImportStudentsDialog = defineAsyncComponent(() =>
  import("./dialogs/ImportStudentsDialog.vue")
);

interface GTableInstance {
  refetch: () => void;
  reload: () => void;
  refresh: () => void;
}

export default defineComponent({
  name: "StudentManagement",
  components: {
    ExpandedNavPageContainer,
    GTable,
    GCard,
    GButton,
    ViewStudentDialog,
    AddEditStudentDialog,
    ImportStudentsDialog,
    AssignGuardianDialog,
    ViewStudentIdDialog,
    ViewExportStudentIdDilaog,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<GTableInstance | null>(null);
    const openViewIdDialog = ref(false);
    const openViewDialog = ref(false);
    const openAddEditDialog = ref(false);
    const openImportDialog = ref(false);
    const openAssignGuardianDialog = ref(false);
    const studentData = ref<{ data: StudentResponse } | null>(null);
    const selectedStudent = ref<StudentResponse | null>(null);
    const openViewExportStudentIdDialog = ref(false);

    const handleTableRefetch = () => {
      if (table.value) {
        table.value.refetch();
      }
    };

    const formatStudentName = (student: StudentResponse) => {
      // Helper function to capitalize each word (title case)
      const capitalizeWords = (str: string): string => {
        if (!str) return '';
        return str
          .split(' ')
          .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(' ');
      };

      // Format first name (capitalize each word)
      const firstName = capitalizeWords(student.firstName || '');

      // Format middle initial if exists
      let middleInitial = '';
      if (student.middleName && student.middleName.trim()) {
        middleInitial = ` ${student.middleName.charAt(0).toUpperCase()}.`;
      }

      // Format last name (capitalize each word)
      const lastName = capitalizeWords(student.lastName || '');

      return `${firstName}${middleInitial} ${lastName}`.trim();
    };

    const getEducationLevelColor = (level: string) => {
      const colorMap: Record<string, string> = {
        NURSERY: "purple",
        KINDERGARTEN: "indigo",
        ELEMENTARY: "blue",
        JUNIOR_HIGH: "cyan",
        SENIOR_HIGH: "teal",
        COLLEGE: "green",
      };
      return colorMap[level] || "grey";
    };

    const seedStudents = async () => {
      $q.dialog({
        title: "Seed Sample Students",
        message: "This will create sample students for testing. Are you sure you want to continue?",
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: "Seeding students...",
        });

        try {
          const response = await api.post("school/student/seed");
          $q.notify({
            type: "positive",
            message: response.data.message || "Students seeded successfully",
          });
          handleTableRefetch();
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: "negative",
            message: axiosError.response?.data?.message || "Failed to seed students",
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const openAddStudentDialog = () => {
      console.log("Opening add student dialog...");
      studentData.value = null;
      openAddEditDialog.value = true;
      console.log("openAddEditDialog.value:", openAddEditDialog.value);
    };

    const viewStudentIdPdf = () => {
      openViewExportStudentIdDialog.value = true;
    };

    const viewIdDialog = (props: { data: StudentResponse }) => {
      studentData.value = props;
      openViewIdDialog.value = true;
    };

    const openImportStudentsDialog = () => {
      openImportDialog.value = true;
    };

    const viewStudent = (props: { data: StudentResponse }) => {
      studentData.value = props;
      openViewDialog.value = true;
    };

    const editStudent = (props: { data: StudentResponse }) => {
      studentData.value = props;
      openAddEditDialog.value = true;
    };

    const openEditStudent = (data: { data: StudentResponse }) => {
      studentData.value = data;
      openAddEditDialog.value = true;
    };

    const resetPassword = (data: StudentResponse) => {
      $q.dialog({
        title: "Reset Password",
        message: `Reset password for ${data.firstName} ${data.lastName}?`,
        prompt: {
          model: "",
          type: "password",
          label: "New Password (min 8 characters)",
          isValid: (val: string) => val.length >= 8,
        },
        cancel: true,
        persistent: true,
      }).onOk(async (newPassword: string) => {
        $q.loading.show({
          message: "Resetting password...",
        });

        try {
          await api.post("school/student/reset-password", {
            studentId: data.id,
            newPassword,
          });
          $q.notify({
            type: "positive",
            message: "Password reset successfully",
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: "negative",
            message: axiosError.response?.data?.message || "Failed to reset password",
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const assignToGuardian = async (data: StudentResponse) => {
      // Fetch full student data to get current guardian info
      $q.loading.show({
        message: "Loading student details...",
      });

      try {
        const response = await api.get(`school/student/info?id=${data.id}`);
        selectedStudent.value = response.data;
        openAssignGuardianDialog.value = true;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: "negative",
          message: axiosError.response?.data?.message || "Failed to load student details",
        });
      } finally {
        $q.loading.hide();
      }
    };

    const handleAssignGuardianDone = async () => {
      handleTableRefetch();
      
      // If we still have a selected student, refresh their data
      if (selectedStudent.value) {
        try {
          const response = await api.get(`school/student/info?id=${selectedStudent.value.id}`);
          selectedStudent.value = response.data;
        } catch (error) {
          console.error('Failed to refresh student data:', error);
        }
      }
    };

    const deleteStudent = (data: StudentResponse) => {
      $q.dialog({
        title: "Delete Student",
        message: `Are you sure you want to delete ${data.firstName} ${data.lastName}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: "Deleting student...",
        });

        try {
          await api.delete(`school/student/delete?id=${data.id}`);
          $q.notify({
            type: "positive",
            message: "Student deleted successfully",
          });
          handleTableRefetch();
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: "negative",
            message: axiosError.response?.data?.message || "Failed to delete student",
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const exportStudentsCSV = async () => {
      $q.loading.show({
        message: "Exporting students...",
      });

      try {
        const response = await api.get('school/student/export', {
          responseType: 'blob', // Important for file download
        });

        // Create a blob from the Excel data
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Set filename with current date
        const today = new Date().toISOString().split('T')[0];
        link.download = `students_export_${today}.xlsx`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        $q.notify({
          type: "positive",
          message: "Students exported successfully",
        });
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: "negative",
          message: axiosError.response?.data?.message || "Failed to export students",
        });
      } finally {
        $q.loading.hide();
      }
    };

    return {
      table,
      openViewIdDialog,
      openViewDialog,
      openAddEditDialog,
      openImportDialog,
      openAssignGuardianDialog,
      openViewExportStudentIdDialog,
      studentData,
      selectedStudent,
      formatStudentName,
      getEducationLevelColor,
      seedStudents,
      openAddStudentDialog,
      openImportStudentsDialog,
      viewStudent,
      editStudent,
      openEditStudent,
      assignToGuardian,
      handleAssignGuardianDone,
      resetPassword,
      deleteStudent,
      exportStudentsCSV,
      handleTableRefetch,
      defaultStudentImage,
      viewIdDialog,
      viewStudentIdPdf,
    };
  },
});
</script>
