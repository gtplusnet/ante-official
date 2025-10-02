<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="key" />
        <div>Change Password</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: new password -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input type="password" v-model="form.password" label="New Password" />
                </div>
              </div>
            </div>

            <!-- field: confirm new password -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input type="password" v-model="form.confirmPassword" label="Confirm New Password" />
                </div>
              </div>
            </div>
          </div>

          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Update Password" type="submit" color="primary" />
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
  name: 'ChangePasswordDialog',
  components: {
    GInput,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    form: {},
  }),
  methods: {
    submitRequest() {
      this.form.id = this.userId;

      // validate password
      if (this.form.password !== this.form.confirmPassword) {
        this.$q.dialog({
          title: 'Error',
          message: 'Passwords do not match',
        });
        return;
      }

      api.post('account/change-password', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
          this.$q.notify({
            message: 'Password updated successfully',
            color: 'positive',
          });
        }).catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {};
    },
  },
};
</script>
