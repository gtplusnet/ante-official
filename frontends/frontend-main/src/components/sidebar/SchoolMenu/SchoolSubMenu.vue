<template>
  <div class="q-pa-sm">
    <div v-for="item in filteredNavList" :key="item.key" class="school-submenu">
      <div class="school-item row items-center justify-between"
           :class="item.key == activeNav ? 'active' : ''"
           @click="item.child && item.child.length > 0 ? toggleDropdown(item.key) : navigate(item.key)"
           style="cursor: pointer">
        <div class="row items-center">
          <div><q-icon :name="getActiveIcon(item.icon, item.key == activeNav)" size="22px" class="menu-icon q-mr-sm" /></div>
          <div class="text-label-large text-grey">{{ item.title }}</div>
        </div>
        <q-icon
          v-if="item.child && item.child.length > 0"
          name="keyboard_arrow_down"
          size="22px"
          class="transition-rotate"
          :class="{ rotated: openKey === item.key }"
          style="color: var(--q-grey-icon); transition: transform 0.2s"
        />
      </div>

      <div v-if="item.child && item.child.length > 0 && openKey === item.key" class="q-pb-sm">
        <div v-for="child in item.child" :key="child.key" class="school-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SchoolSubMenu.scss"></style>

<script lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { hasAccess } from '../../../utility/access.handler';

interface NavItem {
  title: string;
  key: string;
  icon: string;
  child?: ChildNavItem[];
  requiredScope?: string[];
}

interface ChildNavItem {
  icon: string;
  title: string;
  key: string;
  requiredScope?: string[];
}

export default {
  name: 'SchoolSubMenu',

  setup() {
    const openKey = ref<string | null>(null);
    const $router = useRouter();
    const activeNav = ref<string | null>($router.currentRoute.value.name?.toString() || null);

    watch(() => $router.currentRoute.value.name, (newName) => {
      activeNav.value = newName ? newName.toString() : null;
    });

    function toggleDropdown(key: string) {
      openKey.value = openKey.value === key ? null : key;
    }

    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};

      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child) {
            const hasActiveChild = nav.child.some(child => child.key === activeNav.value);
            state[nav.key] = hasActiveChild;
          }
        });
      }

      return state;
    });

    onMounted(() => {
      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child && nav.child.some(child => child.key === activeNav.value)) {
            openKey.value = nav.key;
          }
        });
      }
    });

    const navList = ref<NavItem[]>([
      {
        title: 'People Management',
        key: 'people_management',
        icon: 'o_groups',
        requiredScope: ['SCHOOL_PEOPLE_MANAGEMENT_ACCESS'],
        child: [
          { icon: 'o_school', title: 'Student Management', key: 'member_school_student_management', requiredScope: ['SCHOOL_STUDENT_MANAGEMENT_ACCESS'] },
          { icon: 'o_family_restroom', title: 'Guardian Management', key: 'member_school_guardian_management', requiredScope: ['SCHOOL_GUARDIAN_MANAGEMENT_ACCESS'] },
        ],
      },
      {
        title: 'Gate API',
        key: 'gate_api',
        icon: 'o_api',
        requiredScope: ['SCHOOL_GATE_API_ACCESS'],
        child: [
          { icon: 'o_description', title: 'API Documentation', key: 'member_school_gate_api_documentation', requiredScope: ['SCHOOL_GATE_API_DOCUMENTATION_ACCESS'] },
          { icon: 'o_devices', title: 'Device Management', key: 'member_school_gate_api_devices', requiredScope: ['SCHOOL_GATE_API_DEVICE_MANAGEMENT_ACCESS'] },
        ],
      },
      {
        title: 'Guardian API',
        key: 'guardian_api',
        icon: 'o_api',
        requiredScope: ['SCHOOL_GUARDIAN_API_ACCESS'],
        child: [
          { icon: 'o_description', title: 'API Documentation', key: 'member_school_guardian_api_documentation', requiredScope: ['SCHOOL_GUARDIAN_API_DOCUMENTATION_ACCESS'] },
        ],
      },
      {
        title: 'Devices',
        key: 'devices',
        icon: 'o_devices',
        requiredScope: ['SCHOOL_DEVICES_ACCESS'],
        child: [
          { icon: 'o_door_sliding', title: 'Gate Management', key: 'member_school_gate_management', requiredScope: ['SCHOOL_GATE_MANAGEMENT_ACCESS'] },
        ],
      },
      {
        title: 'Academic Setup',
        key: 'academic_setup',
        icon: 'o_school',
        requiredScope: ['SCHOOL_ACADEMIC_SETUP_ACCESS'],
        child: [
          { icon: 'o_grade', title: 'Grade Level Management', key: 'member_school_grade_level', requiredScope: ['SCHOOL_GRADE_LEVEL_ACCESS'] },
          { icon: 'o_groups', title: 'Section Management', key: 'member_school_section_management', requiredScope: ['SCHOOL_SECTION_MANAGEMENT_ACCESS'] },
        ],
      },
      {
        title: 'Attendance Management',
        key: 'member_school_attendance',
        icon: 'o_fact_check',
        requiredScope: ['SCHOOL_ATTENDANCE_ACCESS'],
      },
      {
        title: 'Media Library',
        key: 'member_school_media_library',
        icon: 'o_perm_media',
      },
    ]);

    const filteredNavList = computed(() => {
      return navList.value
        .map((nav) => {
          if (nav.child) {
            const filteredChild = nav.child.filter((child) => {
              if (!child.requiredScope || child.requiredScope.length === 0) return true;
              return child.requiredScope.some((scope) => hasAccess(scope));
            });
            if (filteredChild.length > 0) {
              return { ...nav, child: filteredChild };
            }
            return null;
          } else {
            if (!nav.requiredScope || nav.requiredScope.length === 0) return nav;
            if (nav.requiredScope.some((scope) => hasAccess(scope))) return nav;
            return null;
          }
        })
        .filter(Boolean) as NavItem[];
    });

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith('o_')) {
        return icon.substring(2);
      }
      return icon;
    };

    const navigate = (key: string) => {
      try {
        $router.push({ name: key }).catch((error: unknown) => {
          console.warn('Navigation error:', error);
        });
      } catch (error) {
        console.error('Router navigation failed:', error);
      }
    };

    $router.afterEach((to) => {
      try {
        activeNav.value = to.name?.toString() || '';
      } catch (error) {
        console.error('Error updating activeNav:', error);
        activeNav.value = '';
      }
    });

    return {
      openKey,
      toggleDropdown,
      filteredNavList,
      expandedState,
      activeNav,
      navigate,
      getActiveIcon,
    };
  },
};
</script>