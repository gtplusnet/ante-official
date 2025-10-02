<template>
  <div class="signin-container" :class="whitelabel">
    <SignInGeer v-if="whitelabel === 'geer'" />
    <SignInAnte v-else />
  </div>
</template>

<style lang="scss" scoped src="./SignIn.scss"></style>
<script lang="ts">
import { whitelabel } from 'src/boot/axios';
import SignInAnte from './SignInAnte.vue';
import SignInGeer from './SignInGeer.vue';

export default {
  name: 'SignIn',
  props: {},
  components: {
    SignInAnte,
    SignInGeer,
  },
  setup() {

    return {
      whitelabel: whitelabel,
    };
  },
};
</script>
