<template>
  <expanded-nav-page-container>
    <div class="collection-types">
      <div class="page-header">
        <h1 class="text-h5">Collection Types</h1>
        <div class="header-actions">
          <q-input
            v-model="searchQuery"
            placeholder="Search collections..."
            outlined
            dense
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn
            label="Add Entry"
            icon="add"
            color="primary"
            unelevated
            @click="showAddEntryDialog = true"
          />
        </div>
      </div>

      <GlobalWidgetCard>
        <template #title>Articles</template>
        <template #actions>
          <q-select
            v-model="selectedStatus"
            :options="statusOptions"
            label="Status"
            outlined
            dense
            style="min-width: 120px"
          />
        </template>
        <template #content>
          <q-table
            :rows="articles"
            :columns="columns"
            row-key="id"
            flat
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-title="props">
              <q-td :props="props">
                <div class="text-body-medium">{{ props.value }}</div>
                <div class="text-caption text-grey">{{ props.row.slug }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  :label="props.value"
                  :color="getStatusColor(props.value)"
                  text-color="white"
                  size="sm"
                />
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense icon="edit" size="sm" color="primary">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense icon="visibility" size="sm">
                  <q-tooltip>View</q-tooltip>
                </q-btn>
                <q-btn flat dense icon="delete" size="sm" color="negative">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </template>
      </GlobalWidgetCard>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';

export default defineComponent({
  name: 'CollectionTypes',
  components: {
    ExpandedNavPageContainer,
    GlobalWidgetCard,
  },
  setup() {
    const searchQuery = ref('');
    const selectedStatus = ref('All');
    const showAddEntryDialog = ref(false);

    const statusOptions = ['All', 'Published', 'Draft', 'Archived'];

    const columns = [
      { name: 'title', label: 'Title', field: 'title', align: 'left' as const },
      { name: 'author', label: 'Author', field: 'author', align: 'left' as const },
      { name: 'category', label: 'Category', field: 'category', align: 'left' as const },
      { name: 'status', label: 'Status', field: 'status', align: 'center' as const },
      { name: 'updatedAt', label: 'Last Updated', field: 'updatedAt', align: 'left' as const },
      { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
    ];

    const articles = ref([
      {
        id: 1,
        title: 'Getting Started with Strapi',
        slug: 'getting-started-with-strapi',
        author: 'John Doe',
        category: 'Tutorial',
        status: 'Published',
        updatedAt: '2024-01-15',
      },
      {
        id: 2,
        title: 'Building APIs with Node.js',
        slug: 'building-apis-with-nodejs',
        author: 'Jane Smith',
        category: 'Development',
        status: 'Published',
        updatedAt: '2024-01-14',
      },
      {
        id: 3,
        title: 'CMS Best Practices',
        slug: 'cms-best-practices',
        author: 'Mike Johnson',
        category: 'Guide',
        status: 'Draft',
        updatedAt: '2024-01-13',
      },
    ]);

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        Published: 'green',
        Draft: 'orange',
        Archived: 'grey',
      };
      return colors[status] || 'grey';
    };

    return {
      searchQuery,
      selectedStatus,
      showAddEntryDialog,
      statusOptions,
      columns,
      articles,
      getStatusColor,
    };
  },
});
</script>

<style scoped lang="scss">
.collection-types {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;

      .search-input {
        min-width: 250px;
      }
    }
  }
}

@media (max-width: 768px) {
  .collection-types {
    padding: 16px;

    .page-header {
      flex-direction: column;
      gap: 16px;

      .header-actions {
        width: 100%;
        flex-direction: column;

        .search-input {
          width: 100%;
        }
      }
    }
  }
}
</style>