<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col q-mr-xl">
        <div class="title text-title-small">Basic Details</div>
        <div class="user-details">
          <!-- First Name -->
          <div class="row">
            <div class="col text-label-medium">First Name:</div>
            <div class="col text-body-small">{{ this.form.firstName }}</div>
          </div>

          <!-- Last Name -->
          <div class="row">
            <div class="col text-label-medium">Last Name:</div>
            <div class="col text-body-small">{{ this.form.lastName }}</div>
          </div>

          <!-- Email -->
          <div class="row">
            <div class="col text-label-medium">Email:</div>
            <div class="col text-body-small">{{ this.form.email }}</div>
          </div>

          <!-- Contact No -->
          <div class="row">
            <div class="col text-label-medium">Contact No.:</div>
            <div class="col text-body-small">{{ this.form.contactNo }}</div>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="title text-title-small">Role Access</div>
        <div class="user-details">
          <!-- Username -->
          <div class="row">
            <div class="col text-label-medium">Username:</div>
            <div class="col text-body-small">{{ this.form.username }}</div>
          </div>

          <!-- Password -->
          <div class="row">
            <div class="col text-label-medium">Password:</div>
            <div class="col text-body-small">{{ this.form.password }}</div>
          </div>

          <!-- Role -->
          <div class="row">
            <div class="col text-label-medium">Role:</div>
            <div class="col text-body-small">{{ this.form.roleId.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ReviewDetails',
  props: {
    formData: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    form: {
      firstName: '',
      lastName: '',
      email: '',
      contactNo: '',
      username: '',
      password: '',
      roleId: '',
      parentUser: '',
    },
  }),
  watch: {
    formData: {
      handler(newValues) {
        this.form = { ...newValues };
      },
      deep: true,
    },
  },
  mounted() {
    this.form = { ...this.formData };
  },
  computed: {},
  methods: {},
};
</script>
