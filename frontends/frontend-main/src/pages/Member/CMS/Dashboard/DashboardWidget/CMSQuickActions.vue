<template>
  <GlobalWidgetCard>
    <template #title>Quick Actions</template>
    <template #content>
      <div class="quick-actions">
        <div
          v-for="action in quickActions"
          :key="action.name"
          class="action-item"
          @click="handleAction(action.route)"
        >
          <div class="action-icon">
            <q-icon :name="action.icon" size="18px" />
          </div>
          <span class="action-label">{{ action.name }}</span>
          <q-icon name="chevron_right" size="16px" class="action-arrow" />
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import GlobalWidgetCard from '../../../../../components/shared/global/GlobalWidgetCard.vue';

export default defineComponent({
  name: 'CMSQuickActions',
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const router = useRouter();

    const quickActions = ref([
      {
        name: 'Create Content',
        icon: 'o_add_circle',
        route: 'member_cms_content_type_builder',
      },
      {
        name: 'Upload Media',
        icon: 'o_cloud_upload',
        route: 'member_cms_media_library',
      },
      {
        name: 'API Tokens',
        icon: 'o_vpn_key',
        route: 'member_cms_api_tokens',
      },
      {
        name: 'Documentation',
        icon: 'o_description',
        route: 'member_cms_documentation',
      },
      {
        name: 'Webhooks',
        icon: 'o_webhook',
        route: 'member_cms_webhooks',
      },
      {
        name: 'Manage Roles',
        icon: 'o_admin_panel_settings',
        route: 'member_cms_roles',
      },
    ]);

    const handleAction = (route: string) => {
      router.push({ name: route });
    };

    return {
      quickActions,
      handleAction,
    };
  },
});
</script>

<style scoped lang="scss">
.quick-actions {
  display: flex;
  flex-direction: column;
  padding: 8px 0 16px 0;

  .action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin: 2px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: transparent;
    border: 1px solid transparent;

    .action-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #495057;
      transition: all 0.2s ease;
    }

    .action-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #212529;
      line-height: 1.4;
    }

    .action-arrow {
      color: #adb5bd;
      transition: transform 0.2s ease;
    }

    &:hover {
      background-color: #f8f9fa;
      border-color: #e9ecef;

      .action-icon {
        background-color: #e9ecef;
        color: #212529;
      }

      .action-arrow {
        transform: translateX(3px);
        color: #495057;
      }
    }

    &:active {
      background-color: #e9ecef;
      transform: scale(0.98);
    }
  }
}

@media (max-width: 768px) {
  .quick-actions {
    .action-item {
      padding: 8px 10px;
      
      .action-icon {
        width: 28px;
        height: 28px;
      }

      .action-label {
        font-size: 13px;
      }
    }
  }
}
</style>