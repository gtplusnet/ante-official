<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog size="xs" :scrollable="false" :icon="'add'" :iconColor="'primary'">
      <!-- Dialog Title -->
      <template #DialogTitle>
        Add Brand
      </template>

      <!-- Dialog Content -->
      <template #DialogContent>
        <q-form @submit.prevent="submitRequest" class="q-pa-md">
          <div class="row">
            <div class="col-12">
              <g-input v-model="form.brandName" label="Brand Name" />
            </div>
          </div>
        </q-form>
      </template>

      <!-- Dialog Actions -->
      <template #DialogSubmitActions>
        <GButton label="Close" variant="text" color="primary" v-close-popup />
        <GButton label="Save" variant="filled" color="primary" @click="submitRequest" />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss"></style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../components/shared/form/GInput.vue";
import TemplateDialog from './TemplateDialog.vue';
import GButton from '../shared/buttons/GButton.vue';

export default {
  name: 'AddEditBrandDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {},
  data: () => ({
    form: {},
  }),
  methods: {
    submitRequest() {
      // Use proper brand endpoint
      // Auto-generate code from brand name (uppercase, spaces to underscores)
      const brandCode = this.form.brandName.toUpperCase().replace(/\s+/g, '_');

      api
        .post('brand', {
          name: this.form.brandName,
          code: brandCode
        })
        .then((data) => {
          this.$refs.dialog.hide();
          const newData = data.data;
          this.$emit('saveDone', newData);
          this.$q.notify({
            color: 'positive',
            message: 'Brand added successfully',
            position: 'top',
          });
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