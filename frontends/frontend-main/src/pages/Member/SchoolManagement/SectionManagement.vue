<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Section Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_student_management' }" />
              <q-breadcrumbs-el label="Academic Setup" />
              <q-breadcrumbs-el label="Sections" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="openAddSectionDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Add Section
          </q-btn>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table 
        :isRowActionEnabled="true" 
        tableKey="sectionTable" 
        apiUrl="school/section/table" 
        ref="table"
      >
        <!-- Grade Level Slot -->
        <template v-slot:gradeLevel="props">
          <div v-if="props.data.gradeLevel">
            <div class="text-weight-medium">{{ props.data.gradeLevel.name }}</div>
            <div class="text-caption text-grey-6">{{ props.data.gradeLevel.code }}</div>
          </div>
          <span v-else class="text-grey-6">-</span>
        </template>

        <!-- Capacity Slot -->
        <template v-slot:capacity="props">
          <div v-if="props.data.capacity">
            <q-linear-progress 
              :value="props.data.studentCount / props.data.capacity" 
              class="q-mt-xs"
              color="primary"
              track-color="grey-3"
              size="8px"
            />
            <div class="text-caption q-mt-xs">
              {{ props.data.studentCount || 0 }} / {{ props.data.capacity }} students
            </div>
          </div>
          <div v-else>
            <span class="text-caption">{{ props.data.studentCount || 0 }} students</span>
          </div>
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
                <div clickable @click="viewSection(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="visibility" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">View</div>
                </div>
                <div clickable @click="editSection(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="edit" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Edit</div>
                </div>
                <div clickable @click="deleteSection(props.data)" class="row q-pa-xs cursor-pointer">
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
    <ViewSectionDialog 
      @close="openViewDialog = false" 
      @edit="openEditSection" 
      :sectionData="sectionData" 
      v-model="openViewDialog" 
    />

    <AddEditSectionDialog 
      @saveDone="handleTableRefetch" 
      @close="openAddEditDialog = false" 
      :sectionData="sectionData" 
      v-model="openAddEditDialog" 
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';
import ViewSectionDialog from './dialogs/ViewSectionDialog.vue';
import AddEditSectionDialog from './dialogs/AddEditSectionDialog.vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'SectionManagement',
  components: {
    GTable,
    GCard,
    ExpandedNavPageContainer,
    ViewSectionDialog,
    AddEditSectionDialog
  },
  setup() {
    const $q = useQuasar();
    const table = ref();
    const openViewDialog = ref(false);
    const openAddEditDialog = ref(false);
    const sectionData = ref({});

    const openAddSectionDialog = () => {
      sectionData.value = {};
      openAddEditDialog.value = true;
    };

    const viewSection = (props: any) => {
      sectionData.value = props.data;
      openViewDialog.value = true;
    };

    const editSection = (props: any) => {
      sectionData.value = props.data;
      openAddEditDialog.value = true;
    };

    const openEditSection = (data: any) => {
      sectionData.value = data;
      openViewDialog.value = false;
      openAddEditDialog.value = true;
    };

    const deleteSection = async (data: any) => {
      $q.dialog({
        title: 'Delete Section',
        message: `Are you sure you want to delete section "${data.name}"? This action cannot be undone.`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          $q.loading.show();
          await (window as any).$api.delete(`school/section/delete?id=${data.id}`);
          $q.notify({
            type: 'positive',
            message: 'Section deleted successfully'
          });
          handleTableRefetch();
        } catch (error: any) {
          $q.notify({
            type: 'negative',
            message: error?.response?.data?.message || 'Failed to delete section'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const handleTableRefetch = () => {
      table.value?.refetch();
      openAddEditDialog.value = false;
    };

    return {
      table,
      openViewDialog,
      openAddEditDialog,
      sectionData,
      openAddSectionDialog,
      viewSection,
      editSection,
      openEditSection,
      deleteSection,
      handleTableRefetch
    };
  }
});
</script>

<style scoped>
.page-head {
  padding: 20px 0;
}

.title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 8px;
}
</style>