<template>
  <div class="login-container" :class="`${whitelabel}`">
    <div class="login-container__left">
      <div class="login-container__left__logo mt-top-100">
      </div>
      <div class="login-form width-400">
        <SignInForm />
      </div>
    </div>
    <div class="login-container__right">
    </div>
  </div>
</template>

<style lang="scss" scoped src="./SignIn.scss"></style>

<script lang="ts">
import { whitelabel } from 'src/boot/axios';
import SignInForm from './SignInForm.vue';

export default {
  name: 'SignInGeer',
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
