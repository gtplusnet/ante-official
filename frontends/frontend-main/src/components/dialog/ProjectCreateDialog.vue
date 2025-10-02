<template>
  <q-dialog ref="dialog">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_folder" />
        <div @dblclick="fillData()">{{ projectData ? 'Edit' : 'Create' }} Project</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="saveProject" class="row">
          <!-- Client -->
          <div class="col-12 q-px-sm q-mb-sm">
            <GInput
              @showAddDialog="showClientAddDialog"
              ref="clientSelect"
              type="select-search-with-add"
              label="Client"
              apiUrl="/select-box/client-list"
              v-model="form.clientId"
            ></GInput>
          </div>

          <!-- Project Name -->
          <div class="col-12 q-px-sm">
            <GInput required type="text" label="Project Name" v-model="form.name"></GInput>
          </div>

          <!-- Description -->
          <div class="col-12 q-px-sm">
            <GInput required type="textarea" label="Description" v-model="form.description"></GInput>
          </div>

          <!-- Location -->
          <div class="col-12 q-px-sm q-mb-sm">
            <SelectionLocation label="Location" v-model="form.locationId"></SelectionLocation>
          </div>

          <!-- Down Payment -->
          <div class="col-6 q-px-sm">
            <GInput type="number" label="Down Payment (%)" v-model.number="form.downpaymentAmount"></GInput>
          </div>

          <!-- Retention Amount -->
          <div class="col-6 q-px-sm">
            <GInput type="number" label="Retention Fee (%)" v-model.number="form.retentionAmount"></GInput>
          </div>

          <!-- Start Date -->
          <div class="col-6 q-px-sm">
            <GInput type="date" label="Start Date" v-model="form.startDate"></GInput>
          </div>

          <!-- End Date -->
          <div class="col-6 q-px-sm">
            <GInput type="date" label="End Date" v-model="form.endDate"></GInput>
          </div>

          <!-- Budget -->
          <div class="col-6 q-px-sm">
            <GInput type="number" label="Budget" v-model.number="form.budget"></GInput>
          </div>

          <!-- Status -->
          <div class="col-6 q-px-sm">
            <GInput type="select" label="Status" apiUrl="/select-box/project-status" v-model="form.status"> </GInput>
          </div>

          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Save Project" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Client Dialog -->
    <add-edit-client-dialog @saveDone="selectNewSave" @showClientAddDialog="showClientAddDialog" v-model="isAddEditClientDialogOpen" />
  </q-dialog>
</template>

<script lang="ts">
import GInput from "../../components/shared/form/GInput.vue";
import { environment } from 'src/boot/axios';
import AddEditClientDialog from './AddEditClientDialog.vue';
import SelectionLocation from "../selection/SelectionLocation.vue";
import { defineComponent } from 'vue';
import { ProjectCreateRequest } from "@shared/request";
import { ProjectDataResponse } from "@shared/response";
import { QDialog } from 'quasar';
import { APIRequests } from "../../utility/api.handler";
import { ProjectStatus } from '@/types/prisma-enums';

export default defineComponent({
  name: 'ProjectCreateDialog',
  components: {
    GInput,
    AddEditClientDialog,
    SelectionLocation,
  },
  props: {
    projectData: {
      type: Object as () => ProjectDataResponse,
      default: null,
    },
  },
  data: () => ({
    environment: environment,
    form: {} as ProjectCreateRequest,
    isAddEditClientDialogOpen: false,
  }),
  mounted() {
    this.initForm();
  },
  watch: {
    projectData: {
      handler(newVal) {
        if (newVal) {
          console.log('ProjectData received:', newVal);

          // Format dates correctly for form inputs (YYYY-MM-DD)
          let startDate = '';
          let endDate = '';

          if (newVal.startDate?.raw) {
            const rawStart = newVal.startDate.raw;
            startDate =
              typeof rawStart === 'string'
                ? rawStart.substring(0, 10) // Take first 10 chars if already string (YYYY-MM-DD)
                : new Date(rawStart).toISOString().substring(0, 10); // Convert Date to YYYY-MM-DD
          }

          if (newVal.endDate?.raw) {
            const rawEnd = newVal.endDate.raw;
            endDate =
              typeof rawEnd === 'string'
                ? rawEnd.substring(0, 10) // Take first 10 chars if already string (YYYY-MM-DD)
                : new Date(rawEnd).toISOString().substring(0, 10); // Convert Date to YYYY-MM-DD
          }

          this.form = {
            name: newVal.name,
            description: newVal.description,
            startDate: startDate,
            endDate: endDate,
            budget: newVal.budget?.raw,
            downpaymentAmount: newVal.downpaymentAmount?.raw || 20,
            retentionAmount: newVal.retentionAmount?.raw || 10,
            status: newVal.status || 'PROJECT' as ProjectStatus,
            clientId: newVal.clientId,
            locationId: newVal.locationId,
            isLead: false,
          };

          // Log the dates to help with debugging
          console.log('Form after setting:', JSON.stringify(this.form));
        }
      },
      immediate: true,
    },
  },
  methods: {
    async selectNewSave(data: ProjectDataResponse) {
      const autoSelect = data.id;
      await (this.$refs as typeof QDialog).clientSelect.reloadGSelect(autoSelect);
    },
    showClientAddDialog() {
      this.$emit('showClientAddDialog');
      this.isAddEditClientDialogOpen = true;
    },
    async initForm() {
      this.form = {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        downpaymentAmount: 20,
        retentionAmount: 10,
        budget: 0,
        status: 'PROJECT' as ProjectStatus,
        clientId: 0,
        locationId: '',
        isLead: false,
      };

      const today = new Date();
      this.form.startDate = today.toISOString().substr(0, 10);
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
      this.form.endDate = nextMonth.toISOString().substr(0, 10);
    },
    async fillData() {
      if (environment === 'development') {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.name = 'Project ' + randomNumber;
        this.form.description = 'Project 1 description';
        this.form.budget = 1000;

        this.$q.notify({
          color: 'grey-8',
          message: 'Data filled successfully',
          position: 'top',
        });
      }
    },
    async saveProject() {
      this.$q.loading.show();
      this.form.downpaymentAmount = Math.min(100, Math.max(0, this.form.downpaymentAmount || 0));
      this.form.retentionAmount = Math.min(100, Math.max(0, this.form.retentionAmount || 0));

      const param: ProjectCreateRequest = {
        name: this.form.name,
        description: this.form.description,
        startDate: this.form.startDate.replace(/\//g, '-'),
        endDate: this.form.endDate.replace(/\//g, '-'),
        downpaymentAmount: this.form.downpaymentAmount,
        retentionAmount: this.form.retentionAmount,
        budget: this.form.budget,
        status: this.form.status,
        clientId: this.form.clientId,
        locationId: this.form.locationId,
        isLead: false,
      };

      if (this.projectData) {
        param.id = this.projectData.id;
        await APIRequests.editProject(this.$q, param).then(this.handleSuccess);
        this.$q.loading.hide();
      } else {
        await APIRequests.createProject(this.$q, param).then(this.handleSuccess);
        this.$q.loading.hide();
      }
    },
    handleSuccess(response: ProjectDataResponse) {
      console.log(response);

      this.$q.notify({
        color: 'positive',
        message: `Project ${this.projectData ? 'updated' : 'created'} successfully`,
        position: 'top',
      });

      this.$emit('close');
      this.$emit('saveDone', response);
      (this.$refs as typeof QDialog).dialog.hide();
      this.initForm();
    },
  },
});
</script>
