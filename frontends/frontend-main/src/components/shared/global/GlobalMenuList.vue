<template>
  <q-menu :auto-close="autoClose" :anchor="anchor" :self="self">
    <q-list>
      <div
        v-for="item in items"
        :key="item.key"
        @click="handleItemClick(item)"
        :data-testid="item.testId"
        class="global-menu-item"
      >
        <div v-if="item.icon">
          <q-icon
            :name="item.icon"
            :style="{
              color: item.iconColor || 'currentColor',
              fontSize: item.iconSize || '20px'
            }"
          />
        </div>
        <div class="text-label-medium">{{ item.label }}</div>
      </div>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  iconColor?: string;
  iconSize?: string;
  testId?: string;
  onClick?: () => void;
}

interface Props {
  items: MenuItem[];
  autoClose?: boolean;
  anchor?: string;
  self?: string;
}

withDefaults(defineProps<Props>(), {
  autoClose: true,
  anchor: 'bottom end',
  self: 'top end',
});

const emit = defineEmits<{
  'item-click': [key: string];
}>();

const handleItemClick = (item: MenuItem) => {
  // If item has inline onClick handler, call it
  if (item.onClick) {
    item.onClick();
  }
  // Always emit the event for parent handling
  emit('item-click', item.key);
};
</script>

<style scoped>
.global-menu-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--q-extra-lighter);
  }
}
</style>
