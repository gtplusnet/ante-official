<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Item Categories</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Item Categories" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn @click="openDialog()" color="primary" rounded unelevated class="text-label-large">
            <q-icon size="16px" name="add"></q-icon>
            Create Category
          </q-btn>
        </div>
      </div>

      <q-tabs
        v-model="activeTab"
        class="text-grey q-mt-md"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
        dense
      >
        <q-tab name="tree" label="Tree View" />
        <q-tab name="table" label="Table View" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated class="bg-transparent">
        <q-tab-panel name="tree" class="q-pa-none">
          <div class="categories-tree-container">
            <q-spinner-dots v-if="loading" color="primary" size="40px" class="q-ma-md" />

            <div v-else-if="categories.length === 0" class="text-center q-pa-lg text-grey-6">
              <q-icon name="folder_open" size="64px" class="q-mb-md" />
              <div class="text-h6">No categories yet</div>
              <div class="text-body2">Create your first category to get started</div>
            </div>

            <div v-else class="categories-tree">
              <div v-for="category in categories" :key="category.id" class="category-node">
                <ItemCategoryNode
                  :category="category"
                  @view="viewCategory"
                  @edit="editCategory"
                  @delete="deleteCategory"
                />
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="table" class="q-pa-none">
          <div class="q-mt-lg">
            <g-table
              ref="tableRef"
              tableKey="itemCategoryManagement"
              apiUrl="/item-category"
              pageTitle="Item Categories"
              @viewDetails="viewCategory"
              @edit="editCategory"
              @delete="deleteCategory"
            >
              <template v-slot:isActive="props">
                <q-badge :color="props.data.isActive ? 'positive' : 'negative'">
                  {{ props.data.isActive ? 'Active' : 'Inactive' }}
                </q-badge>
              </template>
            </g-table>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </expanded-nav-page-container>

  <ViewItemCategoryDialog
    @close="openViewCategoryDialog = false"
    @edit="openEditCategory"
    v-model="openViewCategoryDialog"
    :categoryData="categoryData"
  />

  <!-- Add and Edit Category -->
  <AddEditItemCategoryDialog
    @saveDone="handleSaveDone"
    @close="openAddEditCategoryDialog = false"
    v-model="openAddEditCategoryDialog"
    v-if="openAddEditCategoryDialog"
    :categoryData="categoryData"
  />
</template>

<script src="./AssetItemCategories.ts"></script>

<style lang="scss" scoped>
.categories-tree-container {
  width: 100%;
  padding: 24px 0;
}

.categories-tree {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  min-height: 400px;
  position: relative;
}

.category-node {
  position: relative;
  z-index: 1;

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.q-tabs) {
  margin-top: 24px;

  .q-tab {
    font-weight: 500;
    letter-spacing: 0.25px;
  }

  .q-tab--active {
    color: $primary;
  }
}

:deep(.q-tab-panels) {
  min-height: 600px;
  background: transparent;
}

:deep(.q-spinner-dots) {
  display: block;
  margin: 100px auto;
}

// Empty state styling
.text-center {
  &.q-pa-lg {
    padding: 80px 40px;

    .q-icon {
      opacity: 0.2;
      margin-bottom: 24px;
    }

    .text-h6 {
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .text-body2 {
      color: #999;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .categories-tree {
    padding: 20px;
  }
}
</style>
