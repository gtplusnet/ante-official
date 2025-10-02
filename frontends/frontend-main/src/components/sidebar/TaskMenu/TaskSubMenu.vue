<template>
  <div class="q-pa-sm nav-submenu">
    <div class="search-box q-my-sm">
      <q-input
        v-model="searchQuery"
        outlined
        rounded
        clearable
        placeholder="Search tasks..."
        dense
        @update:model-value="updateSearch"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div v-for="item in filteredNavList" :key="item.key">
      <div
        class="nav-item row items-center"
        :class="item.key == activeNav ? 'active' : ''"
        @click="navigate(item.key)"
      >
        <div class="row items-center">
          <div>
            <q-icon
              :name="getActiveIcon(item.icon, item.key == activeNav)"
              size="22px"
              class="menu-icon q-mr-sm"
            />
          </div>
          <div class="text-label-large text-grey">{{ item.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./TaskSubMenu.scss"></style>
<style scoped>
:deep(.q-field__focusable-action) {
  opacity: 0.7;
}
</style>

<script lang="ts">
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { hasAccess } from "../../../utility/access.handler";
import { useTaskSearchStore } from "../../../stores/taskSearch";

interface NavItem {
  title: string;
  key: string;
  icon: string;
  requiredScope?: string[];
}

export default {
  name: "TaskSubMenu",

  setup() {
    const $router = useRouter();
    const taskSearchStore = useTaskSearchStore();
    const searchQuery = ref(taskSearchStore.searchQuery);
    const activeNav = ref<string | null>(
      $router.currentRoute.value.name?.toString() || null
    );

    watch(
      () => $router.currentRoute.value.name,
      (newName) => {
        activeNav.value = newName ? newName.toString() : null;
      }
    );

    const navList = ref<NavItem[]>([
      {
        title: "My Task",
        key: "member_task_my_task",
        icon: "o_person",
      },
      {
        title: "All Tasks",
        key: "member_task_all",
        icon: "o_list_alt",
      },
      {
        title: "Approval Task",
        key: "member_task_approval",
        icon: "o_approval",
      },
      {
        title: "Due Task",
        key: "member_task_due",
        icon: "o_schedule",
      },
      {
        title: "Done Task",
        key: "member_task_done",
        icon: "o_task_alt",
      },
      {
        title: "Assigned Task",
        key: "member_task_assigned",
        icon: "o_assignment_ind",
      },
      {
        title: "Complete Task",
        key: "member_task_complete",
        icon: "o_check_circle",
      },
      {
        title: "Deleted Tasks",
        key: "member_task_deleted",
        icon: "o_delete",
      },
    ]);

    const filteredNavList = computed(() => {
      return navList.value.filter((nav) => {
        if (!nav.requiredScope || nav.requiredScope.length === 0)
          return true;
        return nav.requiredScope.some((scope) => hasAccess(scope));
      });
    });

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith("o_")) {
        return icon.substring(2);
      }
      return icon;
    };

    const updateSearch = (value: string) => {
      taskSearchStore.setSearchQuery(value || '');
    };

    const navigate = (key: string) => {
      try {
        $router.push({ name: key }).catch((error: unknown) => {
          console.warn("Navigation error:", error);
        });
      } catch (error) {
        console.error("Router navigation failed:", error);
      }
    };

    $router.afterEach((to) => {
      try {
        activeNav.value = to.name?.toString() || "";
      } catch (error) {
        console.error("Error updating activeNav:", error);
        activeNav.value = "";
      }
    });

    return {
      searchQuery,
      filteredNavList,
      activeNav,
      navigate,
      getActiveIcon,
      updateSearch,
    };
  },
};
</script>