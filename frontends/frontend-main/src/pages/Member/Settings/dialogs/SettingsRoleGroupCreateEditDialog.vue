<template>
  <q-dialog ref="dialog">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div @dblclick="fillData()" class="text-title-medium">{{ dialogTitle }}</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="saveRoleGroup" class="row">
          <!-- Task Title -->
          <div class="col-12 q-px-sm">
            <label class="text-label-medium">Name</label>
            <GInput required type="text" v-model="form.name" class="text-body-small"></GInput>
          </div>
          <!-- Description -->
          <div class="col-12 q-px-sm">
            <label class="text-label-medium">Description</label>
            <GInput required type="textarea" v-model="form.description" class="text-body-small"></GInput>
          </div>

          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm text-label-medium" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated :label="submitButtonLabel" type="submit" color="primary" class="text-label-medium" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api, environment } from 'src/boot/axios';

export default {
  name: 'RoleGroupCreateEditDialog',
  components: {
    GInput,
  },
  props: {
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value),
    },
    roleGroupInfo: {
      type: Object,
      default: () => ({}),
    },
  },
  data: () => ({
    environment: environment,
    form: {
      name: '',
      description: '',
    },
  }),
  watch: {
    variant: {
      immediate: true,
      handler() {
        this.initForm();
      },
    },
    roleGroupInfo: {
      handler(newValue) {
        if (this.variant === 'edit' && newValue) {
          this.form.name = newValue.name || '';
          this.form.description = newValue.description || '';
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.initForm();
  },
  computed: {
    dialogTitle() {
      return this.variant === 'create'
        ? 'Create Role Group'
        : 'Edit Role Group';
    },
    submitButtonLabel() {
      return this.variant === 'create' ? 'Create' : 'Update';
    },
  },
  methods: {
    initForm() {
      this.form =
        this.variant === 'create'
          ? { name: '', description: '' }
          : {
            name: this.roleGroupInfo.name ?? '',
            description: this.roleGroupInfo.description ?? '',
          };
    },
    async fillData() {
      if (environment === 'development') {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.name = 'Role Group ' + randomNumber;
        this.form.description = 'Role Group description';

        this.$q.notify({
          color: 'grey-8',
          message: 'Data filled successfully',
          position: 'top',
        });
      }
    },
    async saveRoleGroup() {
      this.$q.loading.show();
      try {
        const param = {
          name: this.form.name,
          description: this.form.description,
          ...(this.variant === 'edit' && { id: this.roleGroupInfo.id }),
        };

        await api[this.variant === 'create' ? 'post' : 'patch']('/role-group', param);

        this.$q.notify({
          color: 'positive',
          message: 'Role group successfully saved',
          position: 'top',
        });
        this.$emit('close');
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
