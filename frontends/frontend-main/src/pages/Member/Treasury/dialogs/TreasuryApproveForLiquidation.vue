<template>
    <q-dialog @before-show="fetchData">
      <q-card class="full-width dialog-card">
        <q-bar class="bg-primary text-white cursor-default" dark>
          <q-icon name="o_task" />
          <div>Inventory Transactions</div>
  
          <q-space />
  
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
  
        <q-card-section>
          Test Content
        </q-card-section>
      </q-card>
    </q-dialog>
  </template>
  
  <style scoped lang="scss">
  .dialog-card {
    max-width: 900px;
    min-height: 600px;
  }
  </style>
  
  <script>
  export default {
    name: 'TemplateDialog',
    props: {
    },
    data: () => ({
    }),
    watch: {
    },
    methods: {
      fetchData() {
      },
    },
  };
  </script>
  