<template>
  <div v-if="showBuiltInPagination" class="pagination-row row items-center justify-end">
    <div class="text-grey q-mr-sm text-label-large">
      {{ startItem }} - {{ endItem }} of {{ pagination.totalItems }}
    </div>
    <q-btn
      flat
      round
      dense
      icon="chevron_left"
      :disable="pagination.currentPage === 1"
      @click="goToPrevPage"
      class="q-mr-xs"
    />
    <q-btn
      flat
      round
      dense
      icon="chevron_right"
      :disable="endItem >= pagination.totalItems"
      @click="goToNextPage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Pagination {
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

interface Props {
  pagination: Pagination
  showBuiltInPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBuiltInPagination: true
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const startItem = computed(() => {
  return (props.pagination.currentPage - 1) * props.pagination.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(
    props.pagination.currentPage * props.pagination.itemsPerPage,
    props.pagination.totalItems
  )
})

const goToPrevPage = () => {
  if (props.pagination.currentPage > 1) {
    emit('update:page', props.pagination.currentPage - 1)
  }
}

const goToNextPage = () => {
  const totalPages = Math.ceil(props.pagination.totalItems / props.pagination.itemsPerPage)
  if (props.pagination.currentPage < totalPages) {
    emit('update:page', props.pagination.currentPage + 1)
  }
}
</script>

<style scoped>
.pagination-row {
  padding: 0.5rem 0 0 0;

  @media (max-width: 768px) {
    padding: 0;
  }
}

/* Ensure buttons have proper touch targets on mobile */
@media (max-width: 768px) {

}
</style>
