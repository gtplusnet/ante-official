<template>
  <div class="q-pa-sm">
    <div class="search-box q-my-sm" style="position: relative;">
      <q-input v-model="searchQuery" outlined rounded clearable placeholder="Search" dense
        @update:model-value="handleSearch" @clear="clearSearch" @focus="isSearchFocused = true"
        @blur="handleSearchBlur">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- Search Results Dropdown -->
      <div v-if="showSearchDropdown" class="search-dropdown" @mousedown.prevent>
        <!-- Loading State -->
        <div v-if="isSearching" class="loading-container q-pa-lg text-center">
          <q-spinner-dots color="primary" size="40px" />
          <div class="text-caption text-grey-6 q-mt-sm">Searching...</div>
        </div>

        <!-- No results message -->
        <div v-else-if="searchResults.length === 0 && searchQuery" class="no-results q-pa-md text-center text-grey-6">
          No deals or relationship owners found
        </div>

        <!-- Deal Results Section -->
        <div v-if="!isSearching && directDealMatches.length > 0" class="results-section">
          <div class="section-header q-px-md q-py-sm text-caption text-grey-7">
            <q-icon name="o_handshake" size="16px" class="q-mr-xs" />
            Deals
          </div>
          <div v-for="deal in directDealMatches" :key="deal.id" class="search-result-item"
            @click="navigateToDeal(deal.id)">
            <div class="result-main">
              <div class="deal-name text-body2 text-weight-medium">{{ deal.name }}</div>
              <div class="deal-info text-caption text-grey-6">
                <span v-if="deal.client">{{ deal.client.name }} • </span>
                <span>{{ deal.initialCosting?.formatCurrency || deal.budget?.formatCurrency || '₱0.00' }}</span>
                <span v-if="deal.leadBoardStage" class="stage-badge q-ml-sm">{{ getStageLabel(deal.leadBoardStage)
                  }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Relationship Owner Results Section -->
        <div v-if="!isSearching && ownerGroupedDeals.length > 0" class="results-section">
          <div class="section-header q-px-md q-py-sm text-caption text-grey-7">
            <q-icon name="o_people_alt" size="16px" class="q-mr-xs" />
            Deals by Relationship Owner
          </div>
          <div v-for="ownerGroup in ownerGroupedDeals" :key="ownerGroup.ownerId" class="owner-group">
            <div class="owner-header q-px-md q-py-xs text-caption text-weight-medium text-grey-8">
              {{ ownerGroup.ownerName }} ({{ ownerGroup.deals.length }} {{ ownerGroup.deals.length === 1 ? 'deal' :
                'deals'
              }})
            </div>
            <div v-for="deal in ownerGroup.deals" :key="deal.id" class="search-result-item indented"
              @click="navigateToDeal(deal.id)">
              <div class="result-main">
                <div class="deal-name text-body2">{{ deal.name }}</div>
                <div class="deal-info text-caption text-grey-6">
                  <span v-if="deal.client">{{ deal.client.name }} • </span>
                  <span>{{ deal.initialCosting?.formatCurrency || deal.budget?.formatCurrency || '₱0.00' }}</span>
                  <span v-if="deal.leadBoardStage" class="stage-badge q-ml-sm">{{ getStageLabel(deal.leadBoardStage)
                    }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-for="item in filteredNavList" :key="item.key" class="leads-submenu">
      <div class="leads-item row items-center justify-between" :class="item.key == activeNav ? 'active' : ''" @click="
        item.child && item.child.length > 0
          ? toggleDropdown(item.key)
          : navigate(item.key)
        " style="cursor: pointer">
        <div class="row items-center">
          <div>
            <q-icon :name="getActiveIcon(item.icon, item.key == activeNav)" size="22px" class="menu-icon q-mr-sm" />
          </div>
          <div class="text-label-large text-grey">{{ item.title }}</div>
        </div>
        <q-icon v-if="item.child && item.child.length > 0" name="keyboard_arrow_down" size="22px"
          class="transition-rotate" :class="{ rotated: openKey === item.key }"
          style="color: var(--q-grey-icon); transition: transform 0.2s" />
      </div>

      <div v-if="item.child && item.child.length > 0 && openKey === item.key" class="q-pb-sm">
        <div v-for="child in item.child" :key="child.key" class="leads-item-dropdown row items-center justify-between"
          :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div>
              <q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" />
            </div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./LeadsSubMenu.scss"></style>
<style scoped>
:deep(.q-field__focusable-action) {
  opacity: 0.7;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 4px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-result-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.search-result-item.indented {
  padding-left: 32px;
}

.results-section {
  border-bottom: 1px solid #f0f0f0;
}

.results-section:last-child {
  border-bottom: none;
}

.section-header {
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.owner-header {
  background-color: #f9f9f9;
  border-top: 1px solid #f0f0f0;
}

.owner-group:first-child .owner-header {
  border-top: none;
}

.stage-badge {
  display: inline-block;
  padding: 2px 6px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.no-results {
  color: #9e9e9e;
}

.deal-name {
  color: var(--q-text-dark);
}

.deal-info {
  margin-top: 2px;
}

.loading-container {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

<script lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { hasAccess } from "../../../utility/access.handler";
import { APIRequests } from "src/utility/api.handler";
import { LeadDataResponse } from "@shared/response";

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

interface OwnerGroupedDeals {
  ownerId: number;
  ownerName: string;
  deals: LeadDataResponse[];
}

export default {
  name: "LeadsSubMenu",

  setup() {
    const searchQuery = ref("");
    const openKey = ref<string | null>(null);
    const $router = useRouter();
    const $q = useQuasar();
    const activeNav = ref<string | null>(
      $router.currentRoute.value.name?.toString() || null
    );

    // Search-related reactive properties
    const isSearching = ref(false);
    const isSearchFocused = ref(false);
    const searchResults = ref<LeadDataResponse[]>([]);
    const showSearchDropdown = ref(false);
    let searchDebounceTimer: NodeJS.Timeout | null = null;

    watch(
      () => $router.currentRoute.value.name,
      (newName) => {
        activeNav.value = newName ? newName.toString() : null;
      }
    );

    function toggleDropdown(key: string) {
      openKey.value = openKey.value === key ? null : key;
    }

    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};

      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child) {
            const hasActiveChild = nav.child.some(
              (child) => child.key === activeNav.value
            );
            state[nav.key] = hasActiveChild;
          }
        });
      }

      return state;
    });

    onMounted(() => {
      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (
            nav.child &&
            nav.child.some((child) => child.key === activeNav.value)
          ) {
            openKey.value = nav.key;
          }
        });
      }
    });

    const navList = ref<NavItem[]>([
      {
        title: "Dashboard",
        key: "member_leads_dashboard",
        icon: "grid_view",
      },
      {
        title: "Deals",
        key: "member_leads_deals",
        icon: "o_handshake",
      },
      {
        title: "Companies",
        key: "member_leads_companies",
        icon: "o_business",
      },
      {
        title: "Deal Type",
        key: "member_leads_deal_type",
        icon: "o_category",
      },
      {
        icon: "diversity_3",
        title: "People",
        key: "member_leads_people",
        child: [
          {
            icon: "o_contact_mail",
            title: "Point of Contact",
            key: "member_leads_point_of_contact",
          },
          {
            icon: "o_people_alt",
            title: "Relationship Owners",
            key: "member_leads_relationship_owners",
          },
        ],
      },
      /*
      {
        title: "Templates",
        key: "templates",
        icon: "o_add_chart",
        child: [
          {
            icon: "o_request_quote",
            title: "Proposal",
            key: "member_leads_proposal",
          },
          {
            icon: "o_present_to_all",
            title: "Presentation",
            key: "member_leads_presentation",
          },
          { icon: "o_gavel", title: "Contract", key: "member_leads_contract" },
        ],
      },
      */
      {
        title: "Media Library",
        key: "member_leads_media_library",
        icon: "o_perm_media",
      },
    ]);

    const filteredNavList = computed(() => {
      return navList.value
        .map((nav) => {
          if (nav.child) {
            const filteredChild = nav.child.filter((child) => {
              if (!child.requiredScope || child.requiredScope.length === 0)
                return true;
              return child.requiredScope.some((scope) => hasAccess(scope));
            });
            if (filteredChild.length > 0) {
              return { ...nav, child: filteredChild };
            }
            return null;
          } else {
            if (!nav.requiredScope || nav.requiredScope.length === 0)
              return nav;
            if (nav.requiredScope.some((scope) => hasAccess(scope))) return nav;
            return null;
          }
        })
        .filter(Boolean) as NavItem[];
    });

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith("o_")) {
        return icon.substring(2);
      }
      return icon;
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

    // Search functionality
    const handleSearch = (value: string) => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      if (!value || value.trim() === "") {
        searchResults.value = [];
        showSearchDropdown.value = false;
        return;
      }

      searchDebounceTimer = setTimeout(() => {
        performSearch(value);
      }, 300);
    };

    const performSearch = async (query: string) => {
      if (!query || query.trim() === "") {
        searchResults.value = [];
        showSearchDropdown.value = false;
        return;
      }

      try {
        isSearching.value = true;
        showSearchDropdown.value = true;

        const response = await APIRequests.getLeadTable(
          $q,
          { searchBy: query.trim() },
          { page: 1, perPage: 20 }
        );

        searchResults.value = response.list || [];
      } catch (error) {
        console.error("Search failed:", error);
        searchResults.value = [];
      } finally {
        isSearching.value = false;
      }
    };

    const clearSearch = () => {
      searchQuery.value = "";
      searchResults.value = [];
      showSearchDropdown.value = false;
    };

    const handleSearchBlur = () => {
      // Delay hiding dropdown to allow click events to fire
      setTimeout(() => {
        if (!isSearchFocused.value) {
          showSearchDropdown.value = false;
        }
      }, 200);
    };

    const navigateToDeal = (dealId: number) => {
      // Clear search
      clearSearch();

      // Navigate to deals board view with the deal highlighted
      $router.push({
        name: "member_leads_deals",
        query: { leadId: dealId.toString() }
      }).catch((error: unknown) => {
        console.warn("Navigation error:", error);
      });
    };

    // Computed properties for grouping search results
    const directDealMatches = computed(() => {
      if (!searchQuery.value) return [];

      const query = searchQuery.value.toLowerCase();
      return searchResults.value.filter((deal) => {
        const dealName = deal.name?.toLowerCase() || "";
        return dealName.includes(query);
      });
    });

    const ownerGroupedDeals = computed(() => {
      if (!searchQuery.value) return [];

      const query = searchQuery.value.toLowerCase();
      const ownerMap = new Map<number, OwnerGroupedDeals>();

      searchResults.value.forEach((deal) => {
        if (deal.personInCharge) {
          const ownerName = `${deal.personInCharge.firstName} ${deal.personInCharge.lastName}`.toLowerCase();

          // Check if the owner name matches the search query
          if (ownerName.includes(query)) {
            const ownerId = deal.personInCharge.id;

            if (!ownerMap.has(ownerId)) {
              ownerMap.set(ownerId, {
                ownerId,
                ownerName: `${deal.personInCharge.firstName} ${deal.personInCharge.lastName}`,
                deals: []
              });
            }

            ownerMap.get(ownerId)!.deals.push(deal);
          }
        }
      });

      // Sort owner groups by number of deals (descending)
      return Array.from(ownerMap.values()).sort((a, b) => b.deals.length - a.deals.length);
    });

    const getStageLabel = (stage: string) => {
      const stageLabels: Record<string, string> = {
        prospect: "Prospect",
        initial_meeting: "Initial Meeting",
        technical_meeting: "Technical Meeting",
        proposal: "Proposal",
        in_negotiation: "Negotiation",
        won: "Won",
        loss: "Lost"
      };

      return stageLabels[stage] || stage;
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
      openKey,
      searchQuery,
      toggleDropdown,
      filteredNavList,
      expandedState,
      activeNav,
      navigate,
      getActiveIcon,
      // Search-related exports
      isSearching,
      isSearchFocused,
      searchResults,
      showSearchDropdown,
      directDealMatches,
      ownerGroupedDeals,
      handleSearch,
      clearSearch,
      handleSearchBlur,
      navigateToDeal,
      getStageLabel,
    };
  },
};
</script>
