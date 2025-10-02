<template>
  <div class="global-widget-card" :class="{ 'no-content-top-padding': noContentTopPadding, 'no-header-bottom-padding': noHeaderBottomPadding }">
    <div class="header-section">
      <div class="header-content">
        <div class="title-wrapper">
          <div>
            <div class="title-text"><slot name="title"></slot></div>
            <slot name="title-actions"></slot>
          </div>
          <div class="more-action">
            <slot name="more-actions"></slot>
          </div>
        </div>
        <div class="action-controls">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
    <div class="content-section">
      <slot name="content"></slot>
    </div>
    <div class="footer-section">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  noContentTopPadding?: boolean;
  noHeaderBottomPadding?: boolean;
}

withDefaults(defineProps<Props>(), {
  noContentTopPadding: false,
  noHeaderBottomPadding: false,
});
</script>

<style scoped>
.global-widget-card {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (max-width: 768px) {
    border-radius: 8px;
  }

  .header-section {
    padding: 12px 12px 8px 12px;

    @media (max-width: 599px) {
      padding: 12px 12px 8px 12px;
    }

    .header-content {
      display: flex;
      align-items: center;
      width: 100%;

      @media (max-width: 599px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;

      .title-text {
        font-size: 16px;
        font-weight: 500;
        color: var(--q-dark);
      }

      .more-action {
        display: none;
      }

      @media (max-width: 599px) {
        margin-bottom: 0;
        justify-content: space-between;

        .more-action {
          display: block;
        }
      }
    }

    .action-controls {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      flex: 1 1 0;
      min-width: 0;
      width: 100%;

      @media (max-width: 599px) {
        justify-content: flex-start;
        width: 100%;
      }
    }
  }

  .content-section {
    padding: 8px 12px 0px 12px;
    /* Allow content to grow naturally */
    flex: 1 1 auto;

    @media (max-width: 599px) {
      padding: 8px 12px 0 12px;
    }
  }

  &.no-content-top-padding .content-section {
    padding: 0 12px 0px 12px;

    @media (max-width: 599px) {
      padding: 0 12px 0 12px;
    }
  }

  &.no-header-bottom-padding .header-section {
    padding: 12px 12px 0 12px;

    @media (max-width: 599px) {
      padding: 12px 12px 0 12px;
    }
  }

  .footer-section {
    padding: 0px 12px 12px 12px;
    /* Ensure footer stays at bottom */
    flex-shrink: 0;

    @media (max-width: 599px) {
      padding: 0px 12px 12px 12px;
    }

    /* Ensure empty footer doesn't take space */
    &:empty {
      display: none;
    }
  }
}
</style>
