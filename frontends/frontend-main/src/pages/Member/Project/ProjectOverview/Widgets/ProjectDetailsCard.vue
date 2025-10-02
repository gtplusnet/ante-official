<template>
  <div class="project-details-card-content">
    <div class="details-content">
      <div class="project-name text-body1 text-weight-medium q-mb-xs">
        {{ projectData?.name || 'Unnamed Project' }}
      </div>

      <div class="project-meta text-caption text-grey-7 q-mb-sm">
        <span v-if="projectData?.code">
          <q-icon name="qr_code_2" size="14px" class="q-mr-xs" />
          {{ projectData.code }}
        </span>
        <span v-if="projectData?.code && projectData?.client" class="q-mx-sm">•</span>
        <span v-if="projectData?.client">
          <q-icon name="business" size="14px" class="q-mr-xs" />
          {{ projectData.client.name }}
        </span>
      </div>

      <div v-if="projectData?.description" class="project-description text-body2 text-grey-8">
        {{ truncateDescription(projectData.description) }}
      </div>

      <div v-if="projectData?.location" class="location-info q-mt-sm">
        <div class="row items-center text-caption text-grey-7">
          <q-icon name="place" size="14px" class="q-mr-xs" />
          {{ projectData.location.name }}
          <span v-if="projectData.location.street" class="q-ml-xs">
            - {{ projectData.location.street }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';

export default defineComponent({
  name: 'ProjectDetailsCard',
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup() {
    const truncateDescription = (description: string) => {
      if (description.length > 150) {
        return description.substring(0, 150) + '...';
      }
      return description;
    };

    return {
      truncateDescription
    };
  }
});
</script>

<style scoped lang="scss">
.project-details-card-content {
  min-height: 180px;
  padding: 8px 0;

  .details-content {
    .project-name {
      line-height: 1.3;
      color: var(--q-dark);
    }

    .project-description {
      line-height: 1.4;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .location-info {
      padding: 10px 14px;
      background: linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%);
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      margin-top: 12px;

      .row {
        color: #616161;
      }
    }
  }
}
</style>