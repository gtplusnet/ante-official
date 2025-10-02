<template>
  <div class="q-pa-md example-column-vertical-alignment">
    <div class="column justify-start">
      <!-- Username -->
      <div class="col-1 q-px-sm">
        <GInput required type="text" label="Username" v-model="username"></GInput>
      </div>

      <!-- Password -->
      <div class="col-1 q-px-sm">
        <GInput required type="password" label="Password" v-model="password"></GInput>
      </div>

      <!-- Role ID -->
      <div class="col-1 q-px-sm">
        <GInput type="select-search" apiUrl="/select-box/role-list" label="Role" v-model="roleId">
        </GInput>
      </div>

      <!-- Parent User -->
      <div class="col-1 q-px-sm">
        <GInput :key="parentUserKey" type="select-search" :apiUrl="parentUserApiUrl" label="Parent User"
          v-model="parentUser">
        </GInput>
      </div>
    </div>
  </div>
</template>
<script>
import GInput from "../../../../../components/shared/form/GInput.vue";

export default {
  name: 'RoleAccessForm',
  components: {
    GInput,
  },
  props: {
    existingData: {
      type: Object,
      required: false,
    },
  },
  data: () => ({
    username: '',
    password: '',
    roleId: '',
    parentUser: '',
    parentUserKey: 0,
  }),
  watch: {
    username() {
      this.emitData();
    },
    password() {
      this.emitData();
    },
    roleId: {
      handler() {
        this.parentUser = null;
        this.parentUserKey++;

        this.emitData();
      },
      deep: true,
    },
    parentUser() {
      this.emitData();
    },
    existingData: {
      handler(newData) {
        this.username = newData.username;
        this.password = newData.password;
        this.roleId = newData.roleId;
        this.parentUser = newData.parentUser;
      },
      deep: true,
    },
  },
  mounted() {
    this.username = this.existingData.username;
    this.password = this.existingData.password;
    this.roleId = this.existingData.roleId;
    this.parentUser = this.existingData.parentUser;
  },
  computed: {
    parentUserApiUrl() {
      return this.roleId
        ? `/select-box/parent-user-list?id=${this.roleId.value}`
        : '';
    },
  },
  methods: {
    emitData() {
      // Emit the form data to the parent component
      this.$emit('onRoleAccessDetailsUpdate', {
        username: this.username,
        password: this.password,
        roleId: this.roleId,
        parentUser: this.parentUser,
      });
    },
  },
};
</script>
