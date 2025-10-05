<template>
  <q-dialog ref="dialog">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div @dblclick="fillData()" class="text-title-medium">{{ isEditMode ? 'Edit' : 'Add' }} Warehouse</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="saveWarehouse" class="row">
          <!-- Warehouse Name -->
          <div class="col-6 q-px-sm">
            <GInput
              label="Warehouse Name"
              required
              type="text"
              v-model="form.name"
              class="text-body-small"
            ></GInput>
          </div>

          <!-- Capacity -->
          <div class="col-6 q-px-sm">
            <GInput
              label="Warehouse Capacity"
              required
              type="number"
              v-model="form.capacity"
              class="text-body-small"
            ></GInput>
          </div>

          <!-- Location -->
          <div
            v-if="warehouseType == 'COMPANY_WAREHOUSE' || isEditMode"
            class="col-12 q-px-sm"
          >
            <GInput
              label="Warehouse Location"
              ref="locationSelect"
              class="text-body-small"
              required
              type="select-search-with-add"
              apiUrl="/select-box/location-list"
              @showAddDialog="showLocationAddDialog"
              v-model="form.location"
            ></GInput>
          </div>

          <!-- Project -->
          <div
            v-if="warehouseType == 'PROJECT_WAREHOUSE' && !isEditMode"
            class="col-12 q-px-sm"
          >
              <GInput
              label="Project"
              ref="locationSelect"
              class="text-body-small"
              required
              type="select-search"
              apiUrl="/select-box/project-list"
              @showAddDialog="showLocationAddDialog"
              v-model="form.warehouse"
            ></GInput>
          </div>

          <div class="col-12 text-right q-mt-md">
            <q-btn
              no-caps
              class="q-mr-sm text-label-large"
              outline
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />
            <q-btn
              no-caps
              unelevated
              :label="isEditMode ? 'Update Warehouse' : 'Save New Warehouse'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Location Dialog -->
    <add-edit-location-dialog
      @saveDone="selectNewSave"
      v-model="isAddLocationDialogOpen"
    />
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../../../components/shared/form/GInput.vue";
import { api, environment } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditLocationDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/AddEditLocationDialog.vue")
);

export default {
  name: 'AddEditWarehouseDialog',
  components: {
    GInput,
    AddEditLocationDialog,
  },
  props: {
    warehouseType: {
      type: String,
      default: 'COMPANY_WAREHOUSE',
    },
    warehouseData: {
      type: Object,
      default: null,
    },
  },
  data: () => ({
    isAddLocationDialogOpen: false,
    environment: environment,
    form: {},
  }),
  computed: {
    isEditMode() {
      return !!this.warehouseData;
    },
  },
  mounted() {
    this.initForm();
  },
  methods: {
    async initForm() {
      if (this.isEditMode && this.warehouseData) {
        this.form = {
          name: this.warehouseData.name,
          capacity: this.warehouseData.capacity,
          location: this.warehouseData.location?.id || null,
          warehouse: this.warehouseData.project?.id || null,
        };
      } else {
        this.form = {
          name: '',
          capacity: 1000,
          location: null,
          warehouse: null,
        };
      }
    },
    async showLocationAddDialog() {
      this.isAddLocationDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      await this.$refs.locationSelect.reloadGSelect(autoSelect);
    },
    async fillData() {
      if (environment === 'development') {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.name = 'Warehouse ' + randomNumber;
        this.form.capacity = randomNumber;

        this.$q.notify({
          color: 'grey-8',
          message: 'Data filled successfully',
          position: 'top',
        });
      }
    },
    async saveWarehouse() {
      this.$q.loading.show();
      try {
        let response;
        
        if (this.isEditMode) {
          // Update warehouse
          const param = {
            name: this.form.name,
            capacity: this.form.capacity,
            locationId: this.form.location,
          };

          response = await api.put(`/warehouse/${this.warehouseData.id}`, param);
          
          this.$q.notify({
            color: 'positive',
            message: 'Warehouse updated successfully',
            position: 'top',
          });
        } else {
          // Create new warehouse
          const param = {
            name: this.form.name,
            capacity: this.form.capacity,
            locationId: this.form.location,
            projectId: this.form.warehouse,
            warehouseType: this.warehouseType,
          };

          response = await api.post('/warehouse', param);
          
          this.$q.notify({
            color: 'positive',
            message: 'Warehouse created successfully',
            position: 'top',
          });
        }

        const responseData = response.data;
        this.$emit('close');
        this.$emit('saveDone', responseData);
        this.$refs.dialog.hide();
        this.initForm();
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
