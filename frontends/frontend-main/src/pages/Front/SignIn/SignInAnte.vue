<template>
  <div class="login-container">
    <div class="login-form width-400">
      <div class="ante-logo"></div>
      <div class="caption">Manage your workforce effectively with ease! </div>
      <SignInForm />
    </div>
  </div>
</template>

<style lang="scss" scoped src="./SignIn.scss"></style>

<script lang="ts">
import { whitelabel } from 'src/boot/axios';
import SignInForm from './SignInForm.vue';

export default {
  name: 'SignInAnte',
  props: {},
  components: {
    SignInForm,
  },
  data() {
    return {
      whitelabel: whitelabel,
    };
  },
};

</script>
