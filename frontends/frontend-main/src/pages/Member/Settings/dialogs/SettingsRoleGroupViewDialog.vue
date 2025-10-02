<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="full-width" style="max-width: 500px">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="group" />
        <div class="text-title-medium">{{ displayRoleGroupName }}</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-spinner v-if="loading" color="primary" size="3em" />
        <div v-else-if="error" class="text-negative">
          {{ error }}
        </div>
        <div v-else>
          <div class="text-title-medium q-mb-md">Role Group Details</div>
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label caption class="text-label-medium">Name</q-item-label>
                <q-item-label class="text-body-small">{{ roleGroupInformation.name }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption class="text-label-medium">Description</q-item-label>
                <q-item-label class="text-body-small">{{
                  roleGroupInformation.description || 'N/A'
                  }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'RoleGroupViewDialog',
  props: {
    modelValue: Boolean,
    roleGroupId: String,
  },
  emits: ['update:modelValue'],
  data: () => ({
    roleGroupInformation: {},
    loading: false,
    error: null,
  }),
  methods: {
    async getRoleGroupInformation() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get(`/role-group?id=${this.roleGroupId}`);
        this.roleGroupInformation = data.roleGroupInformation;
      } catch (err) {
        this.error = 'Failed to load role group information. Please try again.';
        console.error('Error fetching role group information:', err);
      } finally {
        this.loading = false;
      }
    },
    onDialogHide() {
      this.$emit('update:modelValue', false);
    },
    show() {
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.show();
      } else {
        this.hide();
      }
    },
    roleGroupId: {
      immediate: true,
      handler(newId) {
        if (newId && this.modelValue) {
          this.getRoleGroupInformation();
        }
      },
    },
  },
  computed: {
    displayRoleGroupName() {
      return this.roleGroupInformation.name || 'Role Group Details';
    },
  },
};
</script>
