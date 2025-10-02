<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Grade Level Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_student_management' }" />
              <q-breadcrumbs-el label="Academic Setup" />
              <q-breadcrumbs-el label="Grade Level" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="seedGradeLevels()" no-caps color="orange" unelevated class="q-mr-sm">
            <q-icon name="o_upload"></q-icon>
            Seed Default Levels
          </q-btn>
          <q-btn @click="openAddGradeLevelDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Add Grade Level
          </q-btn>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table 
        :isRowActionEnabled="true" 
        tableKey="gradeLevelTable" 
        apiUrl="school/grade-level/table" 
        ref="table"
      >
        <!-- Education Level Slot -->
        <template v-slot:educationLevel="props">
          <q-badge :color="getEducationLevelColor(props.data.educationLevel)" text-color="white">
            {{ formatEducationLevel(props.data.educationLevel) }}
          </q-badge>
        </template>

        <!-- Age Range Slot -->
        <template v-slot:ageRange="props">
          <span v-if="props.data.ageRangeMin && props.data.ageRangeMax">
            {{ props.data.ageRangeMin }} - {{ props.data.ageRangeMax }} years
          </span>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Status Slot -->
        <template v-slot:status="props">
          <q-badge :color="props.data.isActive ? 'green' : 'grey'" text-color="white">
            {{ props.data.isActive ? 'Active' : 'Inactive' }}
          </q-badge>
        </template>

        <!-- Row Actions -->
        <template v-slot:row-actions="props">
          <q-btn color="grey-7" round flat icon="more_horiz">
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div clickable @click="viewGradeLevel(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="visibility" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">View</div>
                </div>
                <div clickable @click="editGradeLevel(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="edit" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Edit</div>
                </div>
                <div clickable @click="deleteGradeLevel(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="delete" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Delete</div>
                </div>
              </div>
            </q-menu>
          </q-btn>
        </template>
      </g-table>
    </g-card>

    <!-- Dialogs -->
    <ViewGradeLevelDialog 
      @close="openViewDialog = false" 
      @edit="openEditGradeLevel" 
      :gradeLevelData="gradeLevelData" 
      v-model="openViewDialog" 
    />

    <AddEditGradeLevelDialog 
      @saveDone="handleTableRefetch" 
      @close="openAddEditDialog = false" 
      :gradeLevelData="gradeLevelData" 
      v-model="openAddEditDialog" 
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import ViewGradeLevelDialog from './dialogs/ViewGradeLevelDialog.vue';
import AddEditGradeLevelDialog from './dialogs/AddEditGradeLevelDialog.vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import type { GradeLevelResponse } from '@shared/response';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

interface GTableInstance {
  refetch: () => void;
  reload: () => void;
  refresh: () => void;
}

export default defineComponent({
  name: 'GradeLevelManagement',
  components: {
    ExpandedNavPageContainer,
GTable,
    GCard,
    ViewGradeLevelDialog,
    AddEditGradeLevelDialog,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<GTableInstance | null>(null);
    const openViewDialog = ref(false);
    const openAddEditDialog = ref(false);
    const gradeLevelData = ref<{ data: GradeLevelResponse } | null>(null);
    
    const handleTableRefetch = () => {
      if (table.value) {
        table.value.refetch();
      }
    };

    const formatEducationLevel = (level: string) => {
      const levelMap: Record<string, string> = {
        NURSERY: 'Nursery',
        KINDERGARTEN: 'Kindergarten',
        ELEMENTARY: 'Elementary',
        JUNIOR_HIGH: 'Junior High',
        SENIOR_HIGH: 'Senior High',
        COLLEGE: 'College',
      };
      return levelMap[level] || level;
    };

    const getEducationLevelColor = (level: string) => {
      const colorMap: Record<string, string> = {
        NURSERY: 'purple',
        KINDERGARTEN: 'indigo',
        ELEMENTARY: 'blue',
        JUNIOR_HIGH: 'cyan',
        SENIOR_HIGH: 'teal',
        COLLEGE: 'green',
      };
      return colorMap[level] || 'grey';
    };

    const seedGradeLevels = async () => {
      $q.dialog({
        title: 'Seed Default Grade Levels',
        message: 'This will populate default grade levels for your company. Are you sure you want to continue?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: 'Seeding grade levels...',
        });

        try {
          await api.post('school/grade-level/seed');
          $q.notify({
            type: 'positive',
            message: 'Default grade levels seeded successfully',
          });
          handleTableRefetch();
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: 'negative',
            message: axiosError.response?.data?.message || 'Failed to seed grade levels',
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const openAddGradeLevelDialog = () => {
      gradeLevelData.value = null;
      openAddEditDialog.value = true;
    };

    const viewGradeLevel = (props: { data: GradeLevelResponse }) => {
      gradeLevelData.value = props;
      openViewDialog.value = true;
    };

    const editGradeLevel = (props: { data: GradeLevelResponse }) => {
      gradeLevelData.value = props;
      openAddEditDialog.value = true;
    };

    const openEditGradeLevel = (data: { data: GradeLevelResponse }) => {
      gradeLevelData.value = data;
      openAddEditDialog.value = true;
    };

    const deleteGradeLevel = (data: GradeLevelResponse) => {
      $q.dialog({
        title: 'Delete Grade Level',
        message: `Are you sure you want to delete ${data.name}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: 'Deleting grade level...',
        });

        try {
          await api.delete(`school/grade-level/delete?id=${data.id}`);
          $q.notify({
            type: 'positive',
            message: 'Grade level deleted successfully',
          });
          handleTableRefetch();
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: 'negative',
            message: axiosError.response?.data?.message || 'Failed to delete grade level',
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    return {
      table,
      openViewDialog,
      openAddEditDialog,
      gradeLevelData,
      formatEducationLevel,
      getEducationLevelColor,
      seedGradeLevels,
      openAddGradeLevelDialog,
      viewGradeLevel,
      editGradeLevel,
      openEditGradeLevel,
      deleteGradeLevel,
      handleTableRefetch,
    };
  },
});
</script>