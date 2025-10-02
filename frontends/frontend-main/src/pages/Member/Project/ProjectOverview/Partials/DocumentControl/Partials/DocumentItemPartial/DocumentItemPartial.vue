<template>
  <div class="q-gutter-md">
    <q-scroll-area style="height: 300px">
      <q-list class="q-gutter-xs document-grid">
        <q-item v-for="item in documents" :key="item.id" class="document-item">
          <q-item-section avatar>
            <q-icon
              name="description"
              :color="getColor(item.name)"
              size="34px"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>
              <div>
                <span class="text-label-medium">{{ item.name }}</span>
              </div>
              <div>
                <span class="text-grey-8 text-body-small">{{ item.uploadedBy }}</span>
              </div>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<style scoped src="./DocumentItemPartial.scss"></style>

<script>
export default {
  name: 'DocumentItemPartial',
  props: {
    documents: {
      type: Array,
      required: true,
    },
  },
  methods: {
    getColor(name) {
      if (name.endsWith('.pdf')) return 'red';
      if (name.endsWith('.doc')) return 'primary';
      if (name.endsWith('.xls')) return 'green';
      return 'primary';
    },
  },
};
</script>
