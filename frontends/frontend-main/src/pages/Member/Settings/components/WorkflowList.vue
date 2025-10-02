<template>
  <div class="workflow-list">
    <q-table
      :rows="workflows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div class="text-body-medium">{{ props.row.name }}</div>
          <div class="text-caption text-grey-7">{{ props.row.code }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-stages="props">
        <q-td :props="props">
          <q-chip
            :label="`${props.row.stages?.length || 0} stages`"
            size="sm"
            color="primary"
            text-color="white"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :label="props.row.isActive ? 'Active' : 'Inactive'"
            :color="props.row.isActive ? 'positive' : 'grey'"
            text-color="white"
            size="sm"
          />
          <q-chip
            v-if="props.row.isDefault"
            label="Default"
            color="info"
            text-color="white"
            size="sm"
            class="q-ml-sm"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            icon="edit"
            size="sm"
            flat
            round
            dense
            color="primary"
            @click="$emit('edit', props.row)"
          >
            <q-tooltip>Edit Workflow</q-tooltip>
          </q-btn>
          <q-btn
            icon="content_copy"
            size="sm"
            flat
            round
            dense
            color="info"
            @click="$emit('clone', props.row)"
          >
            <q-tooltip>Clone Workflow</q-tooltip>
          </q-btn>
          <q-btn
            :icon="props.row.isActive ? 'toggle_on' : 'toggle_off'"
            size="sm"
            flat
            round
            dense
            :color="props.row.isActive ? 'positive' : 'grey'"
            @click="$emit('toggle', props.row)"
          >
            <q-tooltip>{{ props.row.isActive ? 'Deactivate' : 'Activate' }}</q-tooltip>
          </q-btn>
          <q-btn
            icon="delete"
            size="sm"
            flat
            round
            dense
            color="negative"
            :disable="props.row.isDefault"
            @click="$emit('delete', props.row)"
          >
            <q-tooltip>{{ props.row.isDefault ? 'Cannot delete default workflow' : 'Delete Workflow' }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
          <q-icon size="2em" name="account_tree" />
          <span>No workflows configured yet</span>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'WorkflowList',
  props: {
    workflows: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['edit', 'clone', 'delete', 'toggle'],
  setup() {
    const columns = [
      {
        name: 'name',
        label: 'Workflow Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'description',
        label: 'Description',
        field: 'description',
        align: 'left' as const,
      },
      {
        name: 'stages',
        label: 'Stages',
        field: 'stages',
        align: 'center' as const,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'isActive',
        align: 'center' as const,
      },
      {
        name: 'createdAt',
        label: 'Created',
        field: 'createdAt',
        align: 'left' as const,
        format: (val: string) => new Date(val).toLocaleDateString(),
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'right' as const,
      },
    ];

    return {
      columns,
    };
  },
});
</script>