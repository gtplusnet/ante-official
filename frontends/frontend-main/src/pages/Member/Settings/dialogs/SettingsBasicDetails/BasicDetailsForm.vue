<template>
  <div class="q-pa-md example-column-vertical-alignment">
    <div class="column justify-start">
      <!-- First name -->
      <div class="col-1 q-px-sm">
        <GInput
          required
          type="text"
          label="First Name"
          v-model="firstName"
        ></GInput>
      </div>

      <!-- Last name -->
      <div class="col-1 q-px-sm">
        <GInput
          required
          type="text"
          label="Last Name"
          v-model="lastName"
        ></GInput>
      </div>

      <!-- Email -->
      <div class="col-1 q-px-sm">
        <GInput required type="text" label="Email" v-model="email"></GInput>
      </div>

      <!-- Contact No. -->
      <div class="col-1 q-px-sm">
        <GInput
          required
          type="text"
          label="Contact No."
          v-model="contactNumber"
        ></GInput>
      </div>
    </div>
  </div>
</template>
<script>
import GInput from "../../../../../components/shared/form/GInput.vue";

export default {
  name: 'BasicDetailsForm',
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
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
  }),
  watch: {
    firstName() {
      this.emitData();
    },
    lastName() {
      this.emitData();
    },
    email() {
      this.emitData();
    },
    contactNumber() {
      this.emitData();
    },
    existingData: {
      handler(newData) {
        this.firstName = newData.firstName;
        this.lastName = newData.lastName;
        this.email = newData.email;
        this.contactNumber = newData.contactNumber;
      },
      deep: true,
    },
  },
  mounted() {
    this.firstName = this.existingData.firstName;
    this.lastName = this.existingData.lastName;
    this.email = this.existingData.email;
    this.contactNumber = this.existingData.contactNumber;
  },
  computed: {},
  methods: {
    emitData() {
      // Emit the form data to the parent component
      this.$emit('onBasicDetailsUpdate', {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        contactNumber: this.contactNumber,
      });
    },
  },
};
</script>
