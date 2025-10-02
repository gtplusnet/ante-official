<template>
  <div v-for="scope in scopeTree" :key="scope.id">
    <q-checkbox v-model="scope.isChecked" :label="scope.name" />
    <div class="q-ml-lg">
      <CreateEditRoleDialogCheckbox :scopeTree="scope.child" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateEditRoleDialogCheckbox',
  props: {
    scopeTree: {
      type: Array,
      required: false,
    },
  },
}
</script>
