<template>
  <expanded-nav-page-container>
    <router-view></router-view>
  </expanded-nav-page-container>
</template>

<style src="./Settings.scss"></style>

<script lang="ts">
import { defineComponent } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

export default defineComponent({
  name: 'MemberSettings',
  components: {
    ExpandedNavPageContainer,
  },
});
</script>
