<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="500px" maxWidth="400px">
      <template #DialogIcon>
        <q-icon name="o_task" size="24px" />
      </template>
      <template #DialogTitle> Add Location </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <q-form @submit.prevent="saveLocation">
            <!-- Name -->
            <div class="col-12">
              <GInput
                required
                type="text"
                label="Location Name"
                v-model="form.name"
                class="text-body-small"
              ></GInput>
            </div>

            <!-- Region -->
            <div class="col-12">
              <GInput
                type="select-search"
                nullOption="Select Region"
                apiUrl="/select-box/location-region-list"
                label="Region"
                v-model="form.regionId"
                class="text-body-small"
              >
              </GInput>
            </div>

            <!-- Province -->
            <div v-if="form.regionId" class="col-12">
              <GInput
                type="select-search"
                nullOption="Select Province"
                :apiUrl="`/select-box/location-province-list?regionId=${form.regionId}`"
                label="Province"
                v-model="form.provinceId"
                class="text-body-small"
              >
              </GInput>
            </div>

            <!-- Municipality -->
            <div v-if="form.provinceId" class="col-12">
              <GInput
                type="select-search"
                nullOption="Select Municipality"
                :apiUrl="`/select-box/location-municipality-list?provinceId=${form.provinceId}`"
                label="Municipality"
                v-model="form.municipalityId"
                class="text-body-small"
              >
              </GInput>
            </div>

            <!-- Barangay -->
            <div v-if="form.municipalityId" class="col-12">
              <GInput
                type="select-search"
                nullOption="Select Barangay"
                :apiUrl="`/select-box/location-barangay-list?municipalityId=${form.municipalityId}`"
                label="Barangay"
                v-model="form.barangayId"
                class="text-body-small"
              >
              </GInput>
            </div>

            <!-- Street -->
            <div class="col-12">
              <GInput
                required
                type="text"
                label="Street"
                v-model="form.street"
                class="text-body-small"
              ></GInput>
            </div>

            <!-- Zip Code -->
            <div class="col-12">
              <GInput
                required
                type="text"
                label="Zip Code"
                v-model="form.zipCode"
                class="text-body-small"
              ></GInput>
            </div>

            <!-- Landmark -->
            <div class="col-12">
              <GInput
                type="textarea"
                label="Landmark"
                v-model="form.landmark"
                class="text-body-small"
              ></GInput>
            </div>

            <div class="col-12 text-right q-gutter-x-sm">
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
                label="Save Location"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";
import { api, environment } from "src/boot/axios";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddEditLocationDialog",
  components: {
    GInput,
    TemplateDialog,
  },
  props: {},
  data: () => ({
    environment: environment,
    form: {},
  }),
  mounted() {
    this.initForm();
  },
  methods: {
    async initForm() {
      this.form = {
        name: "",
        street: "",
        regionId: null,
        municipalityId: null,
        provinceId: null,
        barangayId: null,
        zipCode: "",
        landmark: "",
      };

      const today = new Date();
      this.form.dueDate = today.toISOString().substr(0, 10);
    },
    async fillData() {
      if (environment === "development") {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.name = "Location " + randomNumber;
        this.form.zipCode = randomNumber;

        this.$q.notify({
          color: "grey-8",
          message: "Data filled successfully",
          position: "top",
        });
      }
    },
    async saveLocation() {
      this.$q.loading.show();
      try {
        const param = {
          name: this.form.name,
          regionId: this.form.regionId,
          provinceId: this.form.provinceId,
          municipalityId: this.form.municipalityId,
          barangayId: this.form.barangayId,
          zipCode: this.form.zipCode,
          street: this.form.street,
          landmark: this.form.landmark,
        };

        const response = await api.post("/location", param);

        this.$q.notify({
          color: "positive",
          message: "Task created successfully",
          position: "top",
        });
        this.$emit("close");
        console.log(response.data);
        this.$emit("saveDone", response.data);
        this.$refs.dialog.hide();
        this.initForm();
      } catch (error) {
        console.log(error);
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
