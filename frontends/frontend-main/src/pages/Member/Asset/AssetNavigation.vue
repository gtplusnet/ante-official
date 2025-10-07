<template>
  <div class="asset">
    <div class="navigation">
      <div class="title text-title-medium">Asset Management</div>
      <div>
        <q-list>
          <template v-for="nav in filteredNavList" :key="nav.key">
            <q-item
              v-if="!nav.child"
              clickable
              v-ripple
              @click="navigate(nav.key)"
              class="nav-item"
              :class="['nav-item', isMainNavActive(nav) ? 'active' : '']"
            >
              <q-item-section>
                <q-item-label class="text-label-medium">{{ nav.title }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-expansion-item
              v-else
              expand-separator
              :label="nav.title"
              :model-value="expandedState[nav.key]"
              :class="isMainNavActive(nav) ? 'active' : ''"
              class="text-label-medium"
            >
              <q-card>
                <q-list class="nav-list q-pb-md">
                  <q-item
                    v-for="childNav in nav.child"
                    :key="childNav.key"
                    clickable
                    v-ripple
                    @click="navigate(childNav.key)"
                    class="nav-item"
                    :class="childNav.key == activeNav ? 'active' : ''"
                  >
                    <q-item-section class="sub-nav text-body-small">
                      <i v-if="childNav.icon" class="material-icons nav-icon">{{ childNav.icon }}</i>
                      {{ childNav.title }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </q-expansion-item>
          </template>
        </q-list>
      </div>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" src="./AssetNavigation.scss" scoped></style>

<script lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { hasAccess } from "../../../utility/access.handler";

interface ChildNavItem {
  icon: string;
  title: string;
  key: string;
  requiredScope?: string[];
}

interface NavItem {
  title: string;
  key: string;
  child?: ChildNavItem[];
  requiredScope?: string[];
}

export default {
  name: 'AssetNavigation',
  props: {},
  setup() {
    const $router = useRouter();
    const activeNav = ref($router.currentRoute.value.name?.toString() || '');

    // Compute which expansion items should be open
    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};
      navList.value.forEach((nav) => {
        if (nav.child) {
          state[nav.key] = nav.child.some((child) => child.key === activeNav.value);
        }
      });
      return state;
    });

    // Determine if a main nav item is active
    const isMainNavActive = (nav: NavItem) => {
      if (nav.child) {
        return nav.child.some((child) => child.key === activeNav.value);
      }
      return nav.key === activeNav.value;
    };

    const navList = ref<NavItem[]>([
      {
        title: 'Warehouse',
        key: 'warehouse',
        child: [
          { icon: 'business', title: 'Company Warehouse', key: 'member_asset_company_warehouse', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'construction', title: 'Project Warehouse', key: 'member_asset_project_warehouse', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'local_shipping', title: 'In Transit Warehouse', key: 'member_asset_intransit_warehouse', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'inventory_2', title: 'Temporary Warehouse', key: 'member_asset_temporary_warehouse', requiredScope: ['ASSET_ACCESS'] }
        ],
      },
      {
        title: 'Item',
        key: 'member_asset_item',
        requiredScope: ['ASSET_ACCESS']
      },
      {
        title: 'Purchasing',
        key: 'purchasing',
        child: [
          { icon: 'shopping_cart', title: 'Purchase Request', key: 'member_asset_purchase_request', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'receipt_long', title: 'Purchase Order', key: 'member_asset_purchase_order', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'store', title: 'Suppliers', key: 'member_asset_suppliers', requiredScope: ['ASSET_ACCESS'] }
        ],
      },
      {
        title: 'Deliveries',
        key: 'member_asset_deliveries',
        requiredScope: ['ASSET_ACCESS']
      },
      {
        title: 'Item Categories',
        key: 'member_asset_item_categories',
        requiredScope: ['ASSET_ACCESS']
      },
      {
        title: 'Equipment',
        key: 'equipment',
        child: [
          { icon: 'forklift', title: 'Equipment List', key: 'member_asset_equipment_list', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'build', title: 'Parts Maintenance', key: 'member_asset_equipment_parts', requiredScope: ['ASSET_ACCESS'] },
          { icon: 'construction', title: 'Job Orders', key: 'member_asset_equipment_joborders', requiredScope: ['ASSET_ACCESS'] }
        ],
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
      navigate,
      filteredNavList,
      activeNav,
      expandedState,
      isMainNavActive,
    };
  },
};
</script>