<template>
  <div class="login-container" :class="`${whitelabel}`">
    <div class="login-container__left">
      <div class="login-container__left__logo mt-top-100">
      </div>
      <div class="login-form">
        <SignUpForm />
      </div>
    </div>
    <div class="login-container__right">
    </div>

  </div>
</template>

<style lang="scss" scoped src="./SignUp.scss"></style>

<script lang="ts">
import SignUpForm from './SignUpForm.vue';
import { whitelabel } from 'src/boot/axios';

export default {
  name: 'SignUpGeer',
  components: {
    SignUpForm
  },
  props: {},
  setup() {
    return {
      whitelabel: whitelabel,
    };
  },
};
</script>
