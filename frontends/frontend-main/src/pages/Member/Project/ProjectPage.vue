<template>
  <expanded-nav-page-container variant="transparent">
    <div class="project-container">
      <div v-if="isLoading" class="loading-container">
        <q-spinner-dots color="primary" size="40px" />
      </div>
      <div v-else>
        <!-- Project Header -->
        <div class="project-header">
          <div class="header-top">
            <div class="header-title">
              <div class="text-title-large">{{ projectInformation.name }}</div>
              <div>
                <div class="bread-crumbs text-body-small q-mb-md">
                  <q-breadcrumbs>
                    <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_project_dashboard' }" />
                    <q-breadcrumbs-el label="Project List" :to="{ name: 'member_project' }" />
                    <q-breadcrumbs-el :label="projectInformation.name" />
                  </q-breadcrumbs>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <q-btn @click="workAccomplishmentDialog(projectInformation)" flat outline rounded color="primary" no-caps icon="o_task"
                label="Work Accomplishment" size="md" class="action-btn md3-button-outlined-rounded" />
              <q-btn @click="openTaskManagement" flat outline rounded color="primary" no-caps icon="task" label="Task Management" size="md"
                class="action-btn md3-button-outlined-rounded" />
              <q-btn @click="loadBillOfQuantityDialog" flat rounded color="primary" no-caps icon="view_comfy"
                label="Bill of Quantity" size="md" class="action-btn md3-button-primary-rounded" />
            </div>
          </div>

        </div>

        <!-- Project Content -->
        <div class="project-content">
          <project-overview />
        </div>
      </div>
    </div>

    <!-- Bill of Quantity Dialog -->
    <BillOfQuantityDialog :projectId="projectInformation.id"
      v-if="isBillOfQuantityDialogVisible && projectInformation.id" v-model="isBillOfQuantityDialogVisible">
    </BillOfQuantityDialog>

    <!-- Work Accomplishment Dialog -->
    <WorkAccomplishmentDialog :projectAccomplishmentsData="projectAccomplishmentsData"
      @close="openWorkAccomplishmentDialog = false" v-model="openWorkAccomplishmentDialog" />

    <!-- Task Management Dialog -->
    <TaskManagementDialog
      v-if="projectInformation.id"
      v-model="showTaskManagementDialog"
      :projectId="projectInformation.id"
      :projectName="projectInformation.name || 'Project'"
      filter="all"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { ref } from 'vue';
import BillOfQuantityDialog from "../../../components/dialog/BillOfQuantity/BillOfQuantityDialog.vue";
import ProjectOverview from './ProjectOverview/ProjectOverview.vue';
import WorkAccomplishmentDialog from "../../../components/dialog/PWA/WorkAccomplishmentDialog.vue";
import TaskManagementDialog from "../../../components/dialog/TaskManagementDialog/TaskManagementDialog.vue";
import ExpandedNavPageContainer from "../../../components/shared/ExpandedNavPageContainer.vue";
import { useProjectDetails } from '../../../composables/useProjectDetails';
import { ProjectDataResponse } from "@shared/response";

export default {
  name: 'ProjectPage',
  components: {
    BillOfQuantityDialog,
    ProjectOverview,
    WorkAccomplishmentDialog,
    TaskManagementDialog,
    ExpandedNavPageContainer,
  },
  setup() {
    const { projectData, loading, fetchProjectDetails } = useProjectDetails();
    const showTaskManagementDialog = ref(false);

    const openTaskManagement = () => {
      console.log('Opening Task Management dialog');
      showTaskManagementDialog.value = true;
    };

    return {
      projectData,
      isLoading: loading,
      fetchProjectDetails,
      showTaskManagementDialog,
      openTaskManagement,
    };
  },
  data() {
    return {
      isBillOfQuantityDialogVisible: false,
      openWorkAccomplishmentDialog: false,
      projectAccomplishmentsData: {} as ProjectDataResponse,
    };
  },
  computed: {
    projectInformation() {
      return this.projectData || {};
    }
  },
  mounted() {
    this.loadProjectData();
  },
  methods: {
    loadBillOfQuantityDialog() {
      this.isBillOfQuantityDialogVisible = true;
    },
    workAccomplishmentDialog(data: ProjectDataResponse) {
      this.openWorkAccomplishmentDialog = true;
      this.projectAccomplishmentsData = data;
    },
    async loadProjectData() {
      const id = this.$route.params.id;
      await this.fetchProjectDetails(id);
    },
  },
};
</script>

<style scoped src="./ProjectPage.scss" lang="scss"></style>
