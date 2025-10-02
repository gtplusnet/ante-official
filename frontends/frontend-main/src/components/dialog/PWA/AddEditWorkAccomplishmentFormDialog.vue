<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div ref="workLabel" class="text-title-medium">
          {{ isEditMode ? 'Edit' : 'Create' }} Work Accomplishment
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form v-if="initialDataLoaded" @submit.prevent="save">
          <div class="column">
            <!-- field: Milestone Title: -->
            <div v-show="isProjectStarted" class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    label="Milestone Title"
                    v-model="form.title"
                    type="text"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: Percentage: -->
            <div v-show="isProjectStarted" class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    :label="`Percentage (Previous ${projectData.progressPercentage}%)`"
                    v-model="form.percentage"
                    type="number"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: Accomplishment Date: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    label="Accomplishment Date"
                    v-model="form.accomplishmentDate"
                    type="date"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: Attachment: -->
            <div class="col-6 q-mt-md">
              <div v-if="!isEditMode" class="q-mx-sm">
                <div>
                  <g-input
                    label="Attachment"
                    v-model="form.attachment"
                    type="file"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: Description: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    label="Description"
                    v-model="form.description"
                    type="textarea"
                  ></g-input>
                </div>
              </div>
            </div>
          </div>

          <!-- actions -->
          <div class="flex full-width q-pa-sm">
            <q-btn
              class="full-width text-label-large"
              no-caps
              unelevated
              :label="workAccomplishmentFormData ? 'Update' : 'Save'"
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../components/shared/form/GInput.vue";

export default {
  name: 'AddEditWorkAccomplishmentFormDialog',
  components: {
    GInput,
  },
  props: {
    workAccomplishmentFormData: {
      type: Object || null,
      default: null,
    },
    projectId: {
      type: Number,
      required: true,
    },
    projectData: {
      type: Object || null,
      default: null,
    },
    isProjectStarted: {
      type: Boolean,
      required: true,
    },
  },
  data: () => ({
    form: {},
  }),
  computed: {
    isEditMode() {
      return this.workAccomplishmentFormData ? true : false;
    },
  },
  methods: {
    async save() {
      this.$q.loading.show();

      if (this.workAccomplishmentFormData) {
        await this.apiUpdate();
      } else {
        await this.apiSave();
      }
      this.$q.loading.hide();
    },
    apiSave() {
      const params = {
        projectId: this.projectId,
        title: this.form.title,
        percentage: Number(this.form.percentage),
        accomplishmentDate: this.form.accomplishmentDate.replace(/\//g, '-'),
        attachmentId: this.form.attachment ? this.form.attachment.id : null,
        description: this.form.description,
      };
      api
        .post('project-accomplishment/create', params)
        .then(() => {
          this.$q.loading.hide();
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    apiUpdate() {
      const payload = {
        accomplishmentId: this.workAccomplishmentFormData.id,
        projectId: this.projectId,
        title: this.form.title,
        percentage: Number(this.form.percentage),
        accomplishmentDate: this.form.accomplishmentDate.replace(/\//g, '-'),
        description: this.workAccomplishmentFormData.description,
      };
      api
        .patch('project-accomplishment/update', payload)
        .then(() => {
          console.log(payload);
          this.$q.loading.hide();
          this.$emit('saveDone');
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.$q.loading.show();
      this.initialDataLoaded = false;

      if (this.workAccomplishmentFormData) {
        this.form = {
          title: this.workAccomplishmentFormData.title,
          percentage: Number(this.workAccomplishmentFormData.percentage),
          accomplishmentDate:
            this.workAccomplishmentFormData.accomplishmentDate?.raw,
          attachmentId: this.workAccomplishmentFormData.attachment.id,
          description: this.workAccomplishmentFormData.description,
        };
        this.$q.loading.hide();
        this.initialDataLoaded = true;
      } else {
        const today = new Date();

        this.form = {
          title: '',
          percentage: '',
          accomplishmentDate: today.toISOString().substr(0, 10),
          attachmentId: null,
          description: null,
        };
        this.$q.loading.hide();
        this.initialDataLoaded = true;
      }
    },
  },
};
</script>
