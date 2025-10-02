<template>
  <div class="q-pa-sm">
    <div v-for="item in filteredNavList" :key="item.key" class="treasury-submenu">
      <div class="treasury-item row items-center justify-between"
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
        <div v-for="child in item.child" :key="child.key" class="treasury-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./TreasurySubMenu.scss"></style>

<script lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { hasAccess } from '../../../utility/access.handler';

interface ChildNavItem {
  icon: string;
  title: string;
  key: string;
  requiredScope?: string[];
}

interface NavItem {
  title: string;
  key: string;
  icon: string;
  child?: ChildNavItem[];
  requiredScope?: string[];
}

export default {
  name: 'TreasurySubMenu',

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
        title: 'Fund Account',
        key: 'fund_account',
        icon: 'o_account_balance_wallet',
        child: [
          { icon: 'o_account_balance', title: 'Fund Account', key: 'member_treasury', requiredScope: ['TREASURY_FUND_ACCOUNT_ACCESS'] }
        ]
      },
      {
        title: 'Payables',
        key: 'payables',
        icon: 'o_payments',
        child: [
          { icon: 'o_receipt_long', title: 'Purchase Order', key: 'member_treasury_payables_purchase_order', requiredScope: ['TREASURY_PAYABLES_PURCHASE_ORDER_ACCESS'] },
          { icon: 'o_storefront', title: 'Suppliers', key: 'member_treasury_payables_suppliers', requiredScope: ['TREASURY_PAYABLES_SUPPLIERS_ACCESS'] },
          { icon: 'o_request_quote', title: 'Request for Payment', key: 'member_treasury_payables_request_payment', requiredScope: ['TREASURY_PAYABLES_REQUEST_PAYMENT_ACCESS'] }
        ]
      },
      {
        title: 'Receivables',
        key: 'receivables',
        icon: 'o_request_quote',
        child: [
          { icon: 'o_assignment', title: 'Collection by Project', key: 'member_treasury_receivables_project', requiredScope: ['TREASURY_RECEIVABLES_PROJECT_ACCESS'] },
          { icon: 'o_person', title: 'Collection by Client', key: 'member_treasury_receivables_client', requiredScope: ['TREASURY_RECEIVABLES_CLIENT_ACCESS'] },
          { icon: 'o_history', title: 'Collection Logs', key: 'member_treasury_receivables_logs', requiredScope: ['TREASURY_RECEIVABLES_LOGS_ACCESS'] },
          { icon: 'o_rate_review', title: 'For Review', key: 'member_treasury_receivables_review', requiredScope: ['TREASURY_RECEIVABLES_REVIEW_ACCESS'] }
        ]
      },
      {
        title: 'Petty Cash',
        key: 'petty_cash',
        icon: 'o_point_of_sale',
        child: [
          { icon: 'o_account_balance_wallet', title: 'Petty Cash Holders', key: 'member_treasury_pettycash', requiredScope: ['TREASURY_PETTYCASH_HOLDERS_ACCESS'] },
          { icon: 'o_receipt_long', title: 'For Liquidation', key: 'member_treasury_pettycash_liquidation', requiredScope: ['TREASURY_PETTYCASH_LIQUIDATION_ACCESS'] }
        ]
      },
      {
        title: 'Media Library',
        key: 'member_treasury_media_library',
        icon: 'o_perm_media',
      }
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