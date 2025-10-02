<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar
        @dblclick="fillData"
        class="bg-primary text-white cursor-default"
        dark
      >
        <q-icon name="o_task" />
        <div class="text-title-medium">
          {{ userId ? 'Edit User' : (variant === 'invite' ? 'Send Invitation' : 'Create User') }}
        </div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form v-if="this.isInitialDataLoaded" @submit.prevent="save">
          <div class="row">
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">First Name</label>
                  <g-input v-model="form.firstName"  class="text-body-small"/>
                </div>
              </div>
            </div>

            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Last Name</label>
                  <g-input v-model="form.lastName" class="text-body-small"/>
                </div>
              </div>
            </div>

            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Email</label>
                  <g-input v-model="form.email" class="text-body-small"/>
                </div>
              </div>
            </div>

            <div v-if="variant !== 'invite'" class="col-6">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Contact Number</label>
                  <g-input v-model="form.contactNumber" class="text-body-small"/>
                </div>
              </div>
            </div>

            <div v-if="variant !== 'invite'" :class="!userId ? 'col-6' : 'col-12'">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Username</label>
                  <g-input v-model="form.username" class="text-body-small"/>
                </div>
              </div>
            </div>

            <div v-if="!userId && variant !== 'invite'" class="col-6">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Password</label>
                  <g-input
                    type="password"
                    v-model="form.password"
                    class="text-body-small"
                  />
                </div>
              </div>
            </div>

            <div class="col-12 q-mb-md">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Role / Position</label>
                  <g-input
                    type="select"
                    apiUrl="select-box/role-list"
                    v-model="form.roleID"
                    class="text-body-small"
                  />
                </div>
              </div>
            </div>

            <div v-if="selectedRoleLevel !== 0" class="col-12">
              <div class="q-mx-sm">
                <div>
                  <label class="text-label-medium">Reports to</label>
                  <g-input
                    type="select"
                    :apiUrl="`select-box/parent-user-list?id=${form.roleID}`"
                    v-model="parentAccountId"
                    class="text-body-small"
                  />
                </div>
              </div>
            </div>
          </div>

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
              class="text-label-large"
              :label="userId ? 'Update User' : (variant === 'invite' ? 'Send Invitation' : 'Save User')"
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
  max-width: 700px;
  min-height: 347px;
}
</style>

<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'UserCreateEditDialog',
  components: {
    GInput,
  },
  props: {
    userId: {
      type: String,
      default: null,
    },
    parentUserId: {
      type: String,
      default: null,
    },
    roleId: {
      type: String,
      default: null,
    },
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit', 'invite'].includes(value),
    },
  },
  data: () => ({
    form: {},
    parentAccountId: null,
    isInitialDataLoaded: false,
    selectedRoleLevel: null,
  }),
  watch: {
    'form.roleID': {
      async handler(newRoleId) {
        this.parentAccountId = null;
        this.selectedRoleLevel = null;

        if (newRoleId) {
          try {
            const { data } = await api.get(`role?id=${newRoleId}`);
            this.selectedRoleLevel = data.level;

            // Clear parentAccountId if level 0 role is selected
            if (data.level === 0) {
              this.parentAccountId = null;
            }
          } catch (error) {
            console.error('Failed to fetch role information:', error);
          }
        }
      },
    },
  },
  methods: {
    async fillData() {
      this.$q.loading.show();
      const { data } = await api.get('https://randomuser.me/api');
      const personInformation = data.results[0];

      this.form.firstName = personInformation.name.first;
      this.form.lastName = personInformation.name.last;
      this.form.email = personInformation.email;
      this.form.contactNumber = personInformation.phone;
      this.form.username = personInformation.login.username;
      this.form.password = 'water123';

      this.$q.loading.hide();
    },
    fetchData() {
      this.isInitialDataLoaded = false;

      if (this.userId) {
        this.$q.loading.show();
        api
          .get(`account?id=${this.userId}`)
          .then(({ data }) => {
            const userInformation = data;
            this.form.firstName = userInformation.firstName;
            this.form.lastName = userInformation.lastName;
            this.form.email = userInformation.email;
            this.form.contactNumber = userInformation.contactNumber;
            this.form.username = userInformation.username;
            this.form.roleID = userInformation.role.id;
            this.selectedRoleLevel = userInformation.role.level;
            this.parentAccountId = userInformation.parentAccountId;
            this.isInitialDataLoaded = true;
          })
          .catch((error) => {
            this.$q.notify({
              type: 'negative',
              message: error?.response?.data?.message || 'Failed to load user information.'
            });
          })
          .finally(() => {
            this.$q.loading.hide();
          });
      } else {
        this.form = {
          firstName: '',
          lastName: '',
          email: '',
          contactNumber: '',
          username: '',
          password: '',
          roleID: null,
        };

        // Set parent account ID if provided (when creating child user from tree)
        if (this.parentUserId) {
          this.parentAccountId = this.parentUserId;
        }

        // Set role ID if provided (when creating user in specific role)
        if (this.roleId) {
          this.form.roleID = this.roleId;
        }

        this.isInitialDataLoaded = true;
      }
    },
    async save() {
      // Only set parentAccountId if not a level 0 role
      if (this.selectedRoleLevel !== 0 && this.parentAccountId) {
        this.form.parentAccountId = this.parentAccountId;
      } else {
        // Ensure parentAccountId is null for level 0 roles
        this.form.parentAccountId = null;
      }

      if (this.userId) {
        await this.apiUpdate();
      } else if (this.variant === 'invite') {
        await this.apiSendInvite();
      } else {
        await this.apiSave();
      }
    },

    async apiSave() {
      this.$q.loading.show();

      try {
        await api.post('account', this.form);
        this.$refs.dialog.hide();
        this.$emit('saveDone');
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: error?.response?.data?.message || 'Failed to save user.'
        });
      } finally {
        this.$q.loading.hide();
      }
    },
    async apiUpdate() {
      this.$q.loading.show();

      this.form.id = this.userId;

      try {
        await api.patch('account', this.form);
        this.$refs.dialog.hide();
        this.$emit('saveDone');
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: error?.response?.data?.message || 'Failed to save user.'
        });
      } finally {
        this.$q.loading.hide();
      }
    },
    
    async apiSendInvite() {
      this.$q.loading.show();

      const inviteData = {
        email: this.form.email,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        roleID: this.form.roleID,
        parentAccountId: this.form.parentAccountId,
      };

      try {
        await api.post('auth/invite/send', inviteData);
        this.$q.notify({
          type: 'positive',
          message: `Invitation sent to ${this.form.email}`,
          timeout: 3000,
        });
        this.$refs.dialog.hide();
        this.$emit('saveDone');
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: error?.response?.data?.message || 'Failed to send invitation.'
        });
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
