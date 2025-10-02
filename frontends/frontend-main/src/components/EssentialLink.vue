<template>
  <div
    class="item"
    :class="[isActive ? 'active' : '', $q.platform.is.mobile ? 'mobile-item' : '']"
    clickable
    tag="div"
    @click="navigate"
  >
    <div v-if="$q.platform.is.mobile" class="mobile-nav-item row items-center">
      <q-icon :name="activeIcon" size="24px" class="nav-icon q-mr-md" />
      <div class="text-body-1">{{ title }}</div>
    </div>
    <div v-else-if="icon" class="icon-label column items-center justify-center" avatar>
      <q-icon :name="activeIcon" size="22px" class="nav-icon" />
      <div class="text-label-medium text-grey">{{ title }}</div>
    </div>
  </div>
</template>

<style scoped src="./EssentialLink.scss"></style>

<script>

export default {
  props: {
    title: String,
    icon: String,
    route: String,
  },
  filters: {},
  data: () => ({
    form: {},
  }),
  mounted() {
    if(this.$route.name && this.$route.name === this.route) {
      this.updatePageTitle();
    }
  },
  methods: {
    updatePageTitle() {
      const pageTitle = document.getElementById('page-title');
      if (pageTitle) {
        pageTitle.innerHTML = this.title || '';
      }
    },
    navigate() {
      // On mobile, emit event to parent for handling submenu logic
      if (this.$q.platform.is.mobile) {
        this.$emit('click', { route: this.route, title: this.title });
        return;
      }
      
      this.updatePageTitle();
      this.$router.push({ name: this.route });
    },
    getNavigationSection(routeName) {
      // Extract the navigation section from the route name
      // e.g., 'member_manpower_payroll_time_keeping' -> 'manpower'
      // e.g., 'member_settings_company' -> 'settings'
      if (!routeName) return '';

      const parts = routeName.split('_');
      if (parts.length >= 2 && parts[0] === 'member') {
        return parts[1];
      }
      return '';
    },
  },
  computed: {
    isActive() {
      if (!this.$route.name || !this.route) return false;

      // Get the navigation section from both current route and this nav item's route
      const currentSection = this.getNavigationSection(this.$route.name);
      const navSection = this.getNavigationSection(this.route);

      // Check if they're in the same section
      return currentSection && navSection && currentSection === navSection;
    },
    activeIcon() {
      if (this.isActive && this.icon.startsWith('o_')) {
        return this.icon.substring(2);
      }
      return this.icon;
    }
  },
};
</script>
