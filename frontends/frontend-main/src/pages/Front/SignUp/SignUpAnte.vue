<template>
  <div class="login-container">
    <div class="login-form">
      <SignUpForm></SignUpForm>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./SignUp.scss"></style>

<script lang="ts">
import SignUpForm from './SignUpForm.vue';
import { whitelabel } from 'src/boot/axios';

export default {
  name: 'SignUpAnte',
  props: {},
  components: {
    SignUpForm
  },
  setup() {
    return {
      whitelabel: whitelabel,
    };
  },
};
</script>
