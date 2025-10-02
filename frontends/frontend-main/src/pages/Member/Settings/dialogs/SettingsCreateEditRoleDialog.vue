<template>
  <q-dialog @beforeShow="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar @dblclick="fillData" class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">{{ roleId ? 'Edit Role' : 'Create Role' }}</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form v-if="initialDataLoaded" @submit.prevent="saveRole">
          <div class="row">
            <div class="col-5 q-pt-lg q-mt-md">
              <div class="q-px-md">
                <div class="text-label-medium">Name</div>
                <g-input v-model="form.name" class="text-body-small" />
              </div>
              <div class="q-px-md">
                <div class="text-label-medium">Description</div>
                <g-input v-model="form.description" type="textarea" class="text-body-small" />
              </div>

              <div class="q-px-md">
                <div class="text-label-medium">Role Group</div>
                <g-input type="select" apiUrl="select-box/role-group-list" v-model="form.roleGroup" class="text-body-small" />
              </div>
              <div class="q-px-md q-mt-md">
                <div class="text-label-medium">Role Parent</div>
                <g-input type="select" :apiUrl="isDeveloperRole
                  ? `select-box/role-list?roleGroupId=${form.roleGroup}&developer=true`
                  : `select-box/role-list?roleGroupId=${form.roleGroup}`"
                  v-model="form.roleParent" class="text-body-small" 
                  nullOption="No Parent" />
              </div>
            </div>
            <div class="col-7">
              <div class="q-px-md q-mt-md text-right">
                <q-checkbox v-model="form.isFullAccess" label="Full Access (all permissions)" class="text-body-small" />
              </div>
              <!-- User Level Tree -->
              <div class="user-level-tree-container">
                <q-scroll-area style="height: 470px;">
                  <div v-for="userLevel in userLevelTree" :key="userLevel.id">
                    <!-- Module Name -->
                    <div class="q-px-md module-name text-label-medium">
                      {{ userLevel.label }}
                    </div>
                    <!-- User Level List -->
                    <div class="q-px-md user-level-list" v-if="userLevel.userLevel" >
                      <div v-for="child in userLevel.userLevel" :key="child.id">
                        <q-checkbox v-model="child.isChecked" :label="child.label" :disable="form.isFullAccess" class="text-body-small"></q-checkbox>
                      </div>
                    </div>
                  </div>
                </q-scroll-area>
              </div>
            </div>
            <div class="col-12 text-right q-mt-md">
              <q-btn no-caps class="q-mr-sm text-label-large" outline label="Close" type="button" color="primary" v-close-popup />
              <q-btn no-caps unelevated :label="roleId ? 'Update Role' : 'Save Role'" type="submit" color="primary" class="text-label-large" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
}

.module-name {
  font-weight: bold;
  margin-top: 15px;
  margin-bottom: 10px;
}

.user-level-list {
  margin-bottom: 15px;
}

.user-level-tree-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin: 10px;
}
</style>

<script lang="ts" setup>
import { ref, watch, defineEmits } from 'vue';
import { useQuasar } from 'quasar';
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { RoleDataResponse } from '@shared/response/role.response';
import { UserLevelTreeResponse as UserLevelTreeResponseBase, UserLevelDataResponse as UserLevelDataResponseBase } from '@shared/response/user-level.response';

const props = defineProps<{ roleId?: string | null, isDeveloperRole?: boolean, parentRoleId?: string | null, roleGroupId?: string | null }>();
const $q = useQuasar();

// Extend backend types with isChecked for frontend use
interface UserLevelTreeResponse extends UserLevelTreeResponseBase {
  isChecked?: boolean;
  userLevel: UserLevelDataResponse[];
}
interface UserLevelDataResponse extends UserLevelDataResponseBase {
  isChecked?: boolean;
}

// Form model type
interface FormModel {
  name: string;
  description: string;
  roleGroup: string | null;
  roleParent: string | null;
  isFullAccess: boolean;
}

const initialDataLoaded = ref(false);
const form = ref<FormModel>({ name: '', description: '', roleGroup: null, roleParent: null, isFullAccess: false });
const userLevelTree = ref<UserLevelTreeResponse[]>([]);
const emit = defineEmits(['saveDone']);

// Fetch role data if editing, otherwise reset form
function fetchData() {
  initialDataLoaded.value = false;
  form.value = { name: '', description: '', roleGroup: null, roleParent: null, isFullAccess: false };
  if (props.roleId) {
    $q.loading.show();
    api.get<RoleDataResponse>(`/role?id=${props.roleId}`)
      .then((res) => {
        const roleInformation = res.data;
        form.value.name = roleInformation.name;
        form.value.description = roleInformation.description;
        form.value.roleGroup = roleInformation.roleGroupId;
        form.value.roleParent = roleInformation.parentRole ? roleInformation.parentRole.id : null;
        form.value.isFullAccess = roleInformation.isFullAccess ?? false;
        getScopeTree(roleInformation.userLevels?.map(ul => ul.id) ?? []);
        initialDataLoaded.value = true;
      })
      .catch((err) => {
        handleAxiosError($q, err);
      })
      .finally(() => {
        $q.loading.hide();
      });
  } else {
    form.value = {
      name: '',
      description: '',
      roleGroup: props.roleGroupId || null,
      roleParent: props.parentRoleId || null,
      isFullAccess: false,
    };
    getScopeTree();
    initialDataLoaded.value = true;
  }
}

// Fetch scope tree for user levels
function getScopeTree(existingUserLevels: number[] = []) {
  const url = props.isDeveloperRole ? '/user-level/default/tree' : '/user-level/tree';
  api.get<UserLevelTreeResponseBase[]>(url)
    .then((res) => {
      userLevelTree.value = res.data.map((tree) => ({
        ...tree,
        isChecked: false,
        userLevel: tree.userLevel.map((ul) => ({
          ...ul,
          isChecked: existingUserLevels.includes(Number(ul.id)),
        })),
      }));
    })
    .catch((err) => {
      handleAxiosError($q, err);
    });
}

// Utility: Get all checked user level IDs
function getIDsOfSelectedUserLevels(list: (UserLevelTreeResponse | UserLevelDataResponse)[]): number[] {
  const selectedUserLevels: number[] = [];
  list.forEach((item) => {
    if ('userLevel' in item && Array.isArray(item.userLevel)) {
      // This is a UserLevelTreeResponse, recurse into userLevel array
      selectedUserLevels.push(...getIDsOfSelectedUserLevels(item.userLevel));
    } else if ('isChecked' in item && item.isChecked) {
      // This is a UserLevelDataResponse that is checked
      selectedUserLevels.push(Number(item.id));
    }
  });
  return selectedUserLevels;
}

// Save or update role
function saveRole() {
  const selectedUserLevels = getIDsOfSelectedUserLevels(userLevelTree.value);
  $q.loading.show();
  const params: Record<string, unknown> = {
    name: form.value.name,
    description: form.value.description,
    roleGroupId: form.value.roleGroup,
    placement: 'above',
    userLevelIds: selectedUserLevels,
    isFullAccess: form.value.isFullAccess,
  };
  if (form.value.roleParent) {
    params.parentRoleId = form.value.roleParent;
  } else if (!props.roleId && props.parentRoleId) {
    params.parentRoleId = props.parentRoleId;
  }
  if (props.roleId) {
    params.id = props.roleId;
    api.patch('/role', params)
      .then(() => {
        $q.notify({
          message: 'Role updated successfully',
          color: 'positive',
          position: 'top',
          timeout: 2000,
        });
        emit('saveDone');
      })
      .catch((err) => {
        handleAxiosError($q, err);
      })
      .finally(() => {
        $q.loading.hide();
      });
  } else {
    api.post('/role', params)
      .then(() => {
        $q.notify({
          message: 'Role created successfully',
          color: 'positive',
          position: 'top',
          timeout: 2000,
        });
        emit('saveDone');
      })
      .catch((err) => {
        handleAxiosError($q, err);
      })
      .finally(() => {
        $q.loading.hide();
      });
  }
}

// Demo fill for testing
function fillData() {
  const random = Math.floor(Math.random() * 1000);
  form.value.name = 'Test ' + random;
  form.value.description = 'Test ' + random;
}

// Watch for isFullAccess changes to update userLevelTree checkboxes
watch(
  () => form.value.isFullAccess,
  (isFull) => {
    if (isFull) {
      // Set all checkboxes to checked
      userLevelTree.value.forEach((tree) => {
        tree.userLevel.forEach((ul) => {
          ul.isChecked = true;
        });
      });
    } else {
      // Set all checkboxes to unchecked
      userLevelTree.value.forEach((tree) => {
        tree.userLevel.forEach((ul) => {
          ul.isChecked = false;
        });
      });
    }
  }
);
</script>
