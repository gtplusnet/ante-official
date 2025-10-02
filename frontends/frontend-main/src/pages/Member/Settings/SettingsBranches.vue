<template>
  <div class="page-content q-mt-md">
    <div class="page-head">
      <div class="title text-title-large">Branches Management</div>
      <div class="actions">
        <q-btn @click="openDialog()" color="primary" rounded unelevated class="text-label-large">
          <q-icon size="16px" name="add"></q-icon>
          Create Branch
        </q-btn>
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      class="text-grey"
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
        <div class="branches-tree-container">
          <q-spinner-dots v-if="loading" color="primary" size="40px" class="q-ma-md" />
          
          <div v-else-if="branches.length === 0" class="text-center q-pa-lg text-grey-6">
            <q-icon name="account_tree" size="64px" class="q-mb-md" />
            <div class="text-h6">No branches yet</div>
            <div class="text-body2">Create your first branch to get started</div>
          </div>
          
          <div v-else class="branches-tree">
            <div v-for="branch in branches" :key="branch.id" class="branch-node">
              <BranchNode 
                :branch="branch" 
                @view="viewBranch"
                @edit="editBranch"
                @delete="deleteBranch"
              />
            </div>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="table" class="q-pa-none">
        <div class="q-mt-lg">
          <g-table
            ref="tableRef"
            tableKey="branchManagement"
            apiUrl="branch/table"
            pageTitle="Branches"
            hideSave
            @viewDetails="viewBranch"
            @edit="editBranch"
            @delete="deleteBranch"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>

  <ViewBranchDialog
    @close="openViewBranchDialog = false"
    @edit="openEditBranch"
    v-model="openViewBranchDialog"
    :branchData="branchData"
  />

  <!-- Add and Edit Branch -->
  <AddEditBrachDialog
    @saveDone="handleSaveDone"
    @close="openAddEditBranchDialog = false"
    v-model="openAddEditBranchDialog"
    v-if="openAddEditBranchDialog"
    :branchData="branchData"
  />
</template>

<script src="./SettingsBranches.ts"></script>

<style lang="scss" scoped>
.branches-tree-container {
  width: 100%;
  padding: 24px 0;
}

.branches-tree {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  min-height: 400px;
  position: relative;
}

.branch-node {
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
  .branches-tree {
    padding: 20px;
  }
}
</style>
