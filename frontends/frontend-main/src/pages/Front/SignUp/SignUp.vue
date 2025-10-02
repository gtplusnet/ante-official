<template>
  <div class="signin-container" :class="whitelabel">
    <SignUpGeer v-if="whitelabel === 'geer'" />
    <SignUpAnte v-else />
  </div>
</template>

<style lang="scss" scoped src="./SignUp.scss"></style>

<script lang="ts">
import { whitelabel } from 'src/boot/axios';
import SignUpAnte from './SignUpAnte.vue';
import SignUpGeer from './SignUpGeer.vue';

export default {
  name: 'SignUp',
  props: {},
  components: {
    SignUpAnte,
    SignUpGeer,
  },
  setup() {
    return {
      whitelabel
    };
  },
};
</script>
