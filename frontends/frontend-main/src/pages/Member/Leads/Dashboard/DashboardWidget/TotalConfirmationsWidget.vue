<template>
  <div>
    <GlobalWidgetCard class="total-confirmations-widget">
      <template #title>Total Confirmations</template>
      <template #actions>
        <span class="text-title-medium-w-[700]">19</span>
      </template>
      <template #content>
        <div class="q-pb-md">
          <!-- Wins -->
          <div class="row items-center justify-between q-pb-md">
            <div class="row items-center">
              <div class="icon-container win-icon">
                <q-icon name="o_military_tech" size="18px" />
              </div>
              <span class="text-label-large text-dark">Wins</span>
            </div>
            <span class="text-body-medium">13</span>
          </div>
          <!-- Losses -->
          <div class="row items-center justify-between">
            <div class="row items-center">
              <div class="icon-container loss-icon">
                <q-icon name="o_bookmark_remove" size="18px" />
              </div>
              <span class="text-label-large text-dark">Losses</span>
            </div>
            <span class="text-body-medium">6</span>
          </div>
        </div>
      </template>
    </GlobalWidgetCard>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';

export default defineComponent({
  name: "TotalConfirmationsWidget",
  components: {
    GlobalWidgetCard,
  },
});
</script>

<style scoped lang="scss">
.icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;

  &.win-icon {
    background-color: var(--q-primary);
    color: #fff;
  }

  &.loss-icon {
    background-color: var(--q-error-tinted);
    color: var(--q-error);
  }
}
</style>

