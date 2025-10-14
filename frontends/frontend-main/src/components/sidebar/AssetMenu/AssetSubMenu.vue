<template>
  <div class="q-pa-sm nav-submenu">
    <div v-for="item in filteredNavList" :key="item.key">
      <div class="nav-item row items-center justify-between"
           :class="item.key == activeNav ? 'active' : ''"
           @click="item.child && item.child.length > 0 ? toggleDropdown(item.key) : navigate(item.key)">
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
          style="color: var(--q-grey-icon)"
        />
      </div>

      <div v-if="item.child && item.child.length > 0 && openKey === item.key" class="q-pb-sm">
        <div v-for="child in item.child" :key="child.key" class="nav-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Import shared submenu styles
@import '../shared/submenu-common.scss';
</style>

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
  name: 'AssetSubMenu',

  setup() {
    // Track which dropdown is open
    const openKey = ref<string | null>(null);
    const $router = useRouter();
    const activeNav = ref<string | null>($router.currentRoute.value.name?.toString() || null);

    // Keep activeNav in sync with the current route
    watch(() => $router.currentRoute.value.name, (newName) => {
      activeNav.value = newName ? newName.toString() : null;
    });

    function toggleDropdown(key: string) {
      openKey.value = openKey.value === key ? null : key;
    }

    // Compute which expansion items should be open based on active route
    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};

      // If we have an active nav, find its parent and expand it
      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child) {
            // Check if any child matches the active nav
            const hasActiveChild = nav.child.some(child => child.key === activeNav.value);
            state[nav.key] = hasActiveChild;
          }
        });
      }

      return state;
    });

    // Set initial open state based on current route
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
        title: 'Warehouse',
        key: 'warehouse',
        icon: 'o_warehouse',
        child: [
          { icon: 'o_business', title: 'Company Warehouse', key: 'member_asset_company_warehouse', requiredScope: ['ASSET_COMPANY_WAREHOUSE_ACCESS'] },
          { icon: 'o_construction', title: 'Project Warehouse', key: 'member_asset_project_warehouse', requiredScope: ['ASSET_PROJECT_WAREHOUSE_ACCESS'] },
          { icon: 'o_local_shipping', title: 'In Transit Warehouse', key: 'member_asset_intransit_warehouse', requiredScope: ['ASSET_INTRANSIT_WAREHOUSE_ACCESS'] },
          { icon: 'o_inventory_2', title: 'Temporary Warehouse', key: 'member_asset_temporary_warehouse', requiredScope: ['ASSET_TEMPORARY_WAREHOUSE_ACCESS'] }
        ],
      },
      {
        title: 'Item',
        key: 'item',
        icon: 'o_inventory',
        child: [
          { icon: 'o_view_column', title: 'Simple View', key: 'member_asset_item_simple', requiredScope: ['ASSET_ITEM_SIMPLE_ACCESS'] },
          { icon: 'o_view_module', title: 'Advance View', key: 'member_asset_item_advance', requiredScope: ['ASSET_ITEM_ADVANCE_ACCESS'] },
          { icon: 'o_workspaces', title: 'Group View', key: 'member_asset_item_group', requiredScope: ['ASSET_ITEM_GROUP_ACCESS'] },
          { icon: 'o_delete', title: 'Deleted List', key: 'member_asset_item_deleted', requiredScope: ['ASSET_ITEM_DELETED_ACCESS'] }
        ],
      },
      {
        title: 'Purchasing',
        key: 'purchasing',
        icon: 'o_shopping_bag',
        child: [
          { icon: 'o_shopping_cart', title: 'Purchase Request', key: 'member_asset_purchase_request', requiredScope: ['ASSET_PURCHASE_REQUEST_ACCESS'] },
          { icon: 'o_receipt_long', title: 'Purchase Order', key: 'member_asset_purchase_order', requiredScope: ['ASSET_PURCHASE_ORDER_ACCESS'] },
          { icon: 'o_store', title: 'Suppliers', key: 'member_asset_suppliers', requiredScope: ['ASSET_SUPPLIERS_ACCESS'] }
        ],
      },
      {
        title: 'Deliveries',
        key: 'deliveries',
        icon: 'o_local_shipping',
        child: [
          { icon: 'o_arrow_circle_up', title: 'Pending Receive', key: 'member_asset_deliveries_pending', requiredScope: ['ASSET_DELIVERIES_PENDING_ACCESS'] },
          { icon: 'o_local_shipping', title: 'For Truck Load', key: 'member_asset_deliveries_truck_load', requiredScope: ['ASSET_DELIVERIES_TRUCK_LOAD_ACCESS'] },
          { icon: 'o_arrow_circle_down', title: 'Done Deliveries', key: 'member_asset_deliveries_done', requiredScope: ['ASSET_DELIVERIES_DONE_ACCESS'] },
          { icon: 'o_highlight_off', title: 'Canceled Deliveries', key: 'member_asset_deliveries_canceled', requiredScope: ['ASSET_DELIVERIES_CANCELED_ACCESS'] }
        ],
      },
      {
        title: 'Item Categories',
        key: 'member_asset_item_categories',
        icon: 'o_category',
        requiredScope: ['ASSET_ACCESS']
      },
      {
        title: 'Equipment',
        key: 'equipment',
        icon: 'o_precision_manufacturing',
        child: [
          { icon: 'o_forklift', title: 'Equipment List', key: 'member_asset_equipment_list', requiredScope: ['ASSET_EQUIPMENT_LIST_ACCESS'] },
          { icon: 'o_build', title: 'Parts Maintenance', key: 'member_asset_equipment_parts', requiredScope: ['ASSET_EQUIPMENT_PARTS_ACCESS'] },
          { icon: 'o_assignment', title: 'Job Orders', key: 'member_asset_equipment_joborders', requiredScope: ['ASSET_EQUIPMENT_JOBORDERS_ACCESS'] }
        ],
      },
      {
        title: 'Media Library',
        key: 'member_asset_media_library',
        icon: 'o_perm_media',
      },
    ]);

    // Filter navList and childNavs based on access
    const filteredNavList = computed(() => {
      return navList.value
        .map((nav) => {
          // If nav has children, filter children by access
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
          // Handle navigation errors silently (e.g., navigating to same route)
          console.warn('Navigation error:', error);
        });
      } catch (error) {
        console.error('Router navigation failed:', error);
      }
    };

    // Watch for route changes to update activeNav
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