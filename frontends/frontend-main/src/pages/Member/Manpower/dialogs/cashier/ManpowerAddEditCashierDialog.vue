<template>
  <q-dialog v-model="dialogVisible" persistent @hide="onHide">
    <q-card flat bordered class="md3-dialog-dense" style="min-width: 600px; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEditMode ? 'Edit' : 'Add' }} Cashier</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section class="q-pt-md" style="max-height: 70vh; overflow-y: auto;">
        <q-form @submit="saveCashier">
          <!-- Personal & Contact Information Section -->
          <div class="q-mb-md">
            <h3 class="text-subtitle1 text-weight-medium q-mb-sm">
              <q-icon name="person" class="q-mr-xs" color="primary" size="20px" />
              Personal & Contact Information
            </h3>
            <div class="text-caption text-grey-7 q-mb-md">
              Account details and contact information for the cashier.
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">First Name *</label>
                <q-input
                  v-model="form.firstName"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[val => !!val || 'First name is required']"
                />
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Last Name *</label>
                <q-input
                  v-model="form.lastName"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[val => !!val || 'Last name is required']"
                />
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Middle Name <span class="text-grey-6">(Optional)</span></label>
                <q-input
                  v-model="form.middleName"
                  outlined
                  dense
                  class="q-mt-xs"
                />
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Username *</label>
                <q-input
                  v-model="form.username"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[val => !!val || 'Username is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="account_circle" color="primary" />
                  </template>
                </q-input>
              </div>

              <!-- Password field (only in create mode) -->
              <div v-if="!isEditMode" class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Password *</label>
                <q-input
                  v-model="form.password"
                  type="password"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[val => !!val || 'Password is required']"
                />
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Email *</label>
                <q-input
                  v-model="form.email"
                  type="email"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[
                    val => !!val || 'Email is required',
                    val => /.+@.+\..+/.test(val) || 'Email must be valid'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="email" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-medium">Contact Number *</label>
                <q-input
                  v-model="form.contactNumber"
                  outlined
                  dense
                  class="q-mt-xs"
                  :rules="[val => !!val || 'Contact number is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="phone" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <!-- Status Section (edit mode only) -->
          <div v-if="isEditMode" class="q-mb-md">
            <h3 class="text-subtitle1 text-weight-medium q-mb-sm">
              <q-icon name="settings" class="q-mr-xs" color="primary" size="20px" />
              Status
            </h3>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-toggle
                  v-model="form.isActive"
                  label="Cashier Active"
                  color="primary"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="row q-gutter-sm q-pt-md">
            <q-btn
              type="submit"
              unelevated
              color="primary"
              :label="isEditMode ? 'Update' : 'Create'"
              :loading="saving"
            />
            <q-btn
              flat
              color="grey"
              label="Cancel"
              @click="close"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

export default {
  name: 'ManpowerAddEditCashierDialog',
  components: {},
  emits: ['cashier-saved'],
  data: () => ({
    dialogVisible: false,
    saving: false,
    isEditMode: false,
    cashierAccountId: null,
    existingCashier: null,
    form: {
      // Account creation fields (create mode)
      firstName: '',
      lastName: '',
      middleName: '',
      username: '',
      password: '',
      email: '',
      contactNumber: '',
      // Common fields
      isActive: true,
    },
  }),
  computed: {
    displayAccountName() {
      if (this.existingCashier && this.existingCashier.account) {
        const acc = this.existingCashier.account;
        return `${acc.firstName || ''} ${acc.lastName || ''}`.trim();
      }
      return '';
    },
  },
  methods: {
    async show(accountId = null) {
      this.isEditMode = !!accountId;
      this.cashierAccountId = accountId;

      if (this.isEditMode) {
        // Load existing cashier data
        await this.loadCashier(accountId);
      }

      this.dialogVisible = true;
    },
    close() {
      this.dialogVisible = false;
    },
    onHide() {
      this.resetForm();
    },
    resetForm() {
      this.form = {
        // Account creation fields
        firstName: '',
        lastName: '',
        middleName: '',
        username: '',
        password: '',
        email: '',
        contactNumber: '',
        // Common fields
        isActive: true,
      };
      this.existingCashier = null;
      this.cashierAccountId = null;
      this.isEditMode = false;
    },
    async loadCashier(accountId) {
      try {
        const response = await api.get(`/cashier/${accountId}`);
        this.existingCashier = response.data;

        // Load all account details in edit mode
        if (response.data.account) {
          this.form.firstName = response.data.account.firstName || '';
          this.form.lastName = response.data.account.lastName || '';
          this.form.middleName = response.data.account.middleName || '';
          this.form.username = response.data.account.username || '';
          this.form.email = response.data.account.email || '';
          this.form.contactNumber = response.data.account.contactNumber || '';
        }

        // Load status
        this.form.isActive = response.data.isActive;
      } catch (error) {
        handleAxiosError(this.$q, error);
        this.close();
      }
    },
    async saveCashier() {
      this.saving = true;
      try {
        let response;

        if (this.isEditMode) {
          // Update existing cashier with account details
          response = await api.put(`/cashier/${this.cashierAccountId}`, {
            accountUpdateDetails: {
              firstName: this.form.firstName,
              lastName: this.form.lastName,
              middleName: this.form.middleName,
              username: this.form.username,
              email: this.form.email,
              contactNumber: this.form.contactNumber,
            },
            isActive: this.form.isActive,
          });

          this.$q.notify({
            type: 'positive',
            message: 'Cashier updated successfully',
          });
        } else {
          // Create new cashier with account details
          response = await api.post('/cashier', {
            accountDetails: {
              firstName: this.form.firstName,
              lastName: this.form.lastName,
              middleName: this.form.middleName,
              username: this.form.username,
              password: this.form.password,
              email: this.form.email,
              contactNumber: this.form.contactNumber,
            },
          });

          this.$q.notify({
            type: 'positive',
            message: response.data.message || 'Cashier created successfully',
          });
        }

        this.$emit('cashier-saved');
        this.close();
      } catch (error) {
        handleAxiosError(this.$q, error);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.md3-dialog-dense {
  .q-card__section {
    padding: 16px;
  }
}
</style>
