<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="add" />
        <div class="text-title-medium">Add Brand</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: first name -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.brandName" label="Brand Name" />
                </div>
              </div>
            </div>
          </div>

          <!-- actions -->
          <div class="text-right q-mt-md">
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
              label="Save"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 400px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../components/shared/form/GInput.vue";

export default {
  name: 'AddEditBrandDialog',
  components: {
    GInput,
  },
  props: {},
  data: () => ({
    form: {},
  }),
  methods: {
    submitRequest() {
      api
        .post('equipment/save-brand', this.form)
        .then((data) => {
          this.$refs.dialog.hide();
          const newData = data.data.brand;
          this.$emit('saveDone', newData);
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {};
    },
  },
};
</script>
