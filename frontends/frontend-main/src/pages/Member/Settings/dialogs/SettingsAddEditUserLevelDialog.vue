<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">{{ isEdit ? 'Edit User Level' : 'Create User Level' }}</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup @click="closeDialog">
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <div class="row">
            <div class="col-12 q-mb-md">
              <label class="text-label-medium">Label</label>
              <g-input v-model="form.label" :rules="[(val: string) => !!val || 'Label is required']" />
            </div>
            <div class="col-12 q-mb-md">
              <label class="text-label-medium">System Module</label>
              <g-input
                v-model="form.systemModule"
                type="select"
                :apiUrl="'/select-box/system-module-list'"
                :nullOption="'Select System Module'"
                class="text-body-medium"
                :rules="[(val: string) => !!val || 'System Module is required']"
              />
            </div>
            <div class="col-12 q-mb-md">
              <label class="text-label-medium">Scope</label>
              <div class="q-mb-sm">
                <q-input dense outlined v-model="scopeSearch" placeholder="Search scopes..." clearable class="text-body-medium" />
              </div>
              <div class="scope-tree-container">
                <q-tree
                  v-if="treeNodes.length"
                  :nodes="treeNodes"
                  node-key="key"
                  tick-strategy="none"
                  v-model:expanded="expandedNodes"
                  :filter="scopeSearch"
                  :filter-method="filterTree"
                  class="scope-tree"
                >
                  <template v-slot:default-header="props">
                    <div class="row items-center full-width">
                      <q-checkbox
                        v-if="!scopeTreeData.find(item => item.key === props.node.key)?.virtual"
                        :model-value="selectedScopes.includes(props.node.key)"
                        @update:model-value="(val) => { console.log('Checkbox clicked:', props.node.key, 'new value:', val); handleNodeSelection(props.node, val); }"
                        color="primary"
                        dense
                        @click.stop
                        class="q-mr-sm"
                      />
                      <div v-else class="q-mr-sm" style="width: 40px;"></div>
                      <q-icon 
                        :name="props.node.icon || 'folder'" 
                        size="20px" 
                        :color="props.node.type === 'PAGE' ? 'primary' : 'grey-7'"
                        class="q-mr-sm" 
                      />
                      <div class="col">
                        <div class="text-label-medium">{{ props.node.label }}</div>
                        <div v-if="props.node.description" class="text-caption text-grey-6">
                          {{ props.node.description }}
                        </div>
                      </div>
                      <q-chip 
                        v-if="props.node.type" 
                        size="sm" 
                        :color="getTypeColor(props.node.type)" 
                        text-color="white"
                        dense
                      >
                        {{ props.node.type }}
                      </q-chip>
                    </div>
                  </template>
                </q-tree>
                <div v-else class="text-center q-pa-lg text-grey-6">
                  <q-icon name="info" size="48px" />
                  <div class="q-mt-sm">No scopes available for the selected module</div>
                </div>
              </div>
              <div class="q-mt-sm text-caption text-grey-7">
                <q-icon name="info" size="16px" class="q-mr-xs" />
                Selecting a child will automatically select all parent scopes
              </div>
            </div>
          </div>
          <div class="text-right q-mt-md">
            <q-btn no-caps class="q-mr-sm text-label-large" outline label="Close" type="button" color="primary" @click="closeDialog" />
            <q-btn no-caps class="text-label-large" unelevated :label="isEdit ? 'Update' : 'Save'" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import type { UpdateUserLevelRequest } from '@shared/request/user-level.request';
import type { UserLevelDataResponse } from '@shared/response/user-level.response';

interface TreeNode {
  key: string;
  label: string;
  value: string;
  description?: string;
  type: string;
  icon: string;
  children?: TreeNode[];
  selectable: boolean;
  parentId?: string;
}

interface ScopeTreeItem {
  key: string;
  label: string;
  value: string;
  description?: string;
  type: string;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  parentId?: string;
  icon: string;
  virtual?: boolean;
}

const $q = useQuasar();

const props = defineProps<{
  modelValue: boolean,
  userLevel?: UserLevelDataResponse | null,
  isDefault?: boolean
}>();
const emit = defineEmits(['update:modelValue', 'saveDone', 'close']);

const dialogVisible = ref(props.modelValue);
watch(() => props.modelValue, (val: boolean) => {
  dialogVisible.value = val;
});
watch(dialogVisible, (val: boolean) => {
  if (val !== props.modelValue) emit('update:modelValue', val);
});

const isEdit = computed(() => !!props.userLevel);
const form = ref<UpdateUserLevelRequest>({
  id: props.userLevel?.id ?? 0,
  label: props.userLevel?.label ?? '',
  systemModule: props.userLevel?.systemModule ?? undefined,
  scope: props.userLevel?.scope ? [...props.userLevel.scope] : [],
});

watch(() => props.userLevel, (val: UserLevelDataResponse | null | undefined) => {
  console.log('UserLevel prop changed:', val);
  // Only reset if the dialog is not visible (initial load) or if it's a different user level
  if (!dialogVisible.value || form.value.id !== val?.id) {
    form.value = {
      id: val?.id ?? 0,
      label: val?.label ?? '',
      systemModule: val?.systemModule ?? undefined,
      scope: val?.scope ? [...val.scope] : [],
    };
    selectedScopes.value = val?.scope ? [...val.scope] : [];
    console.log('Initial selectedScopes set to:', selectedScopes.value);
  }
});

const scopeTreeData = ref<ScopeTreeItem[]>([]);
const treeNodes = ref<TreeNode[]>([]);
const scopeSearch = ref('');
// Initialize with form.value.scope to ensure consistency
const selectedScopes = ref<string[]>([...(form.value.scope || [])]);
const expandedNodes = ref<string[]>([]);

// Build tree structure from flat list
function buildTree(items: ScopeTreeItem[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // First pass: create all nodes
  items.forEach(item => {
    nodeMap.set(item.key, {
      key: item.key,
      label: item.label,
      value: item.value,
      description: item.description,
      type: item.type,
      icon: item.icon,
      children: [],
      selectable: true,
      parentId: item.parentId
    });
  });

  // Second pass: build hierarchy
  items.forEach(item => {
    const node = nodeMap.get(item.key);
    if (node) {
      if (item.parentId && nodeMap.has(item.parentId)) {
        const parent = nodeMap.get(item.parentId);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

// Get first level node keys for expansion
function getFirstLevelNodeKeys(nodes: TreeNode[]): string[] {
  // Only return keys of root level nodes (first level)
  return nodes.map(node => node.key);
}

// Get all parent IDs for a given node
function getParentIds(nodeKey: string): string[] {
  const parents: string[] = [];
  const findParents = (key: string) => {
    const node = scopeTreeData.value.find(item => item.key === key);
    if (node && node.parentId) {
      parents.push(node.parentId);
      findParents(node.parentId);
    }
  };
  findParents(nodeKey);
  return parents;
}

// Get all child IDs for a given node
function getChildIds(node: TreeNode): string[] {
  const children: string[] = [];
  const collectChildren = (n: TreeNode) => {
    if (n.children && n.children.length > 0) {
      n.children.forEach(child => {
        children.push(child.key);
        collectChildren(child);
      });
    }
  };
  collectChildren(node);
  return children;
}

// Handle node selection with parent-child logic
function handleNodeSelection(node: TreeNode, selected: boolean) {
  console.log('=== handleNodeSelection START ===');
  console.log('Node:', node.key, 'Selected:', selected);
  console.log('Current selectedScopes before update:', [...selectedScopes.value]);
  
  // Don't allow selection of virtual nodes
  const treeItem = scopeTreeData.value.find(item => item.key === node.key);
  if (treeItem?.virtual) {
    console.log('Node is virtual, skipping');
    return;
  }
  
  // Create a new array instead of using Set to ensure reactivity
  let newSelection: string[] = [...selectedScopes.value];
  
  if (selected) {
    // Add this node if not already present
    if (!newSelection.includes(node.key)) {
      newSelection.push(node.key);
      console.log(`Added ${node.key} to selection`);
    }
    
    // Add all parents (excluding virtual ones)
    const parents = getParentIds(node.key);
    parents.forEach(parentId => {
      const parentItem = scopeTreeData.value.find(item => item.key === parentId);
      if (!parentItem?.virtual && !newSelection.includes(parentId)) {
        newSelection.push(parentId);
        console.log(`Added parent ${parentId} to selection`);
      }
    });
    
    // Automatically select all children when parent is selected
    if (node.children && node.children.length > 0) {
      const childIds = getChildIds(node);
      childIds.forEach(childId => {
        if (!newSelection.includes(childId)) {
          newSelection.push(childId);
          console.log(`Added child ${childId} to selection`);
        }
      });
    }
  } else {
    // Remove this node and all children
    const toRemove = new Set([node.key]);
    const childIds = getChildIds(node);
    childIds.forEach(id => toRemove.add(id));
    
    newSelection = newSelection.filter(scope => !toRemove.has(scope));
    console.log(`Removed ${node.key} and its children from selection`);
  }
  
  // Update both reactive values
  selectedScopes.value = newSelection;
  form.value.scope = newSelection as any;
  
  console.log('=== handleNodeSelection END ===');
  console.log('New selectedScopes:', [...selectedScopes.value]);
  console.log('New form.scope:', [...(form.value.scope || [])]);
}

// Filter tree nodes
function filterTree(node: TreeNode, filter: string): boolean {
  if (!filter) return true;
  const search = filter.toLowerCase();
  
  // Check if current node matches
  if (node.label.toLowerCase().includes(search) ||
      (node.description && node.description.toLowerCase().includes(search))) {
    return true;
  }
  
  // Check if any child matches
  if (node.children) {
    return node.children.some(child => filterTree(child, filter));
  }
  
  return false;
}

// Get color for scope type
function getTypeColor(type: string): string {
  switch (type) {
    case 'PAGE': return 'primary';
    case 'SUBPAGE': return 'secondary';
    case 'BUTTON': return 'accent';
    case 'WIDGET': return 'info';
    default: return 'grey';
  }
}

function fetchScopeTree(module?: string) {
  if (!module) {
    scopeTreeData.value = [];
    treeNodes.value = [];
    expandedNodes.value = [];
    return;
  }
  
  api.get('/select-box/scope-tree', { params: { module } })
    .then(res => {
      scopeTreeData.value = res.data;
      treeNodes.value = buildTree(res.data);
      // Expand only first level nodes by default
      expandedNodes.value = getFirstLevelNodeKeys(treeNodes.value);
      
      // Don't reset selectedScopes here - they should be maintained
      // The selectedScopes should only be set from props.userLevel in the watch
      console.log('Tree loaded, current selectedScopes:', [...selectedScopes.value]);
    })
    .catch((err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleAxiosError($q, err as any);
    });
}

onMounted(() => fetchScopeTree(form.value.systemModule));
watch(dialogVisible, (val: boolean) => {
  console.log('Dialog visibility changed:', val, 'Current selectedScopes:', [...selectedScopes.value]);
  if (val) {
    fetchScopeTree(form.value.systemModule);
    // Make sure selectedScopes is synced with form.scope when dialog opens
    if (form.value.scope && form.value.scope.length > 0) {
      selectedScopes.value = [...form.value.scope] as string[];
      console.log('Synced selectedScopes from form.scope:', selectedScopes.value);
    }
  }
});
watch(() => form.value.systemModule, (module, oldModule) => {
  fetchScopeTree(module);
  // Only clear selection when module actually changes to a different value
  if (oldModule !== undefined && module !== oldModule) {
    selectedScopes.value = [];
    form.value.scope = [] as any;
  }
});

// Sync selected scopes with form
watch(selectedScopes, (newVal) => {
  console.log('selectedScopes watch triggered, new value:', [...newVal]);
  form.value.scope = newVal as any;
}, { deep: true });

function closeDialog() {
  dialogVisible.value = false;
  emit('close');
}

function onSubmit() {
  if (!form.value.label || !form.value.systemModule) return;
  
  console.log('=== SUBMIT START ===');
  console.log('Current selectedScopes:', [...selectedScopes.value]);
  console.log('Current form.scope:', [...(form.value.scope || [])]);
  
  // Ensure we're using the latest selected scopes
  const scopesToSubmit = selectedScopes.value.length > 0 ? [...selectedScopes.value] : [];
  
  const req: UpdateUserLevelRequest = {
    id: form.value.id,
    label: form.value.label,
    systemModule: form.value.systemModule,
    scope: scopesToSubmit as any,
  };
  
  console.log('=== SUBMITTING REQUEST ===');
  console.log('Request object:', JSON.stringify(req, null, 2));
  
  // Determine the API endpoint based on whether it's a default user level
  const baseUrl = props.isDefault ? '/user-level/default' : '/user-level';
  
  if(!req.id) {
    api.post(baseUrl, req).then(() => {
      emit('saveDone');
      dialogVisible.value = false;
    }).catch((err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleAxiosError($q, err as any);
    });
  } else {
    api.patch(`${baseUrl}/${req.id}`, req).then(() => {
      emit('saveDone');
      dialogVisible.value = false;
    }).catch((err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleAxiosError($q, err as any);
    });
  }
}
</script>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
  height: 800px;
}

.scope-tree-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.scope-tree {
  :deep(.q-tree__node-header) {
    padding: 4px 8px;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
  
  :deep(.q-tree__node--selected) {
    background-color: transparent;
  }
  
  :deep(.q-tree__node-header-content) {
    width: 100%;
  }
}
</style>