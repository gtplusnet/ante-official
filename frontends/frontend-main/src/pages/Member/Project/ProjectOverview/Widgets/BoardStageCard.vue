<template>
  <div class="board-stage-card-content">
    <div class="stage-content">
        <div class="stage-icon q-mb-sm">
          <q-avatar size="60px" :style="{ backgroundColor: stageColors?.bg || '#F8F8F8' }">
            <q-icon
              :name="stageIcon"
              size="32px"
              :style="{ color: stageColors?.text || '#616161' }"
            />
          </q-avatar>
        </div>

        <div class="stage-name text-body1 text-weight-medium q-mb-xs">
          {{ stageName }}
        </div>

        <div class="stage-description text-caption text-grey-6 q-mb-sm">
          {{ stageDescription }}
        </div>

        <!-- Stage Progress Dots -->
        <div class="stage-progress q-mt-md">
          <div class="row justify-center q-gutter-xs">
            <div
              v-for="(stage, index) in allStages"
              :key="stage.key"
              class="stage-dot-container"
            >
              <q-tooltip>{{ stage.name }}</q-tooltip>
              <div
                class="stage-dot"
                :class="{
                  'active': isStageActive(stage.key),
                  'completed': isStageCompleted(stage.key),
                  'current': isCurrentStage(stage.key)
                }"
              />
              <div v-if="index < allStages.length - 1" class="stage-connector" />
            </div>
          </div>
        </div>

        <!-- Next Stage Info -->
        <div v-if="nextStage" class="next-stage-info q-mt-sm text-caption">
          <span class="text-grey-6">Next: </span>
          <span class="text-weight-medium">{{ nextStage.name }}</span>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';
import {
  getBoardStage,
  getProjectBoardColumn,
  BOARD_STAGE_COLORS,
  PROJECT_BOARD_COLUMNS
} from '../../../../../reference/board-stages.reference';

export default defineComponent({
  name: 'BoardStageCard',
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const currentStageKey = computed(() => {
      return props.projectData?.projectBoardStage || 'planning';
    });

    const stageName = computed(() => {
      const stage = getBoardStage(currentStageKey.value);
      return stage?.boardName || 'Planning';
    });

    const stageIcon = computed(() => {
      const column = getProjectBoardColumn(currentStageKey.value);
      return column?.icon || 'architecture';
    });

    const stageColors = computed(() => {
      return BOARD_STAGE_COLORS[currentStageKey.value];
    });

    const stageDescription = computed(() => {
      const descriptions: Record<string, string> = {
        planning: 'Project initiation and planning phase',
        mobilization: 'Resource allocation and team setup',
        construction: 'Active development and implementation',
        done: 'Project completed and delivered'
      };
      return descriptions[currentStageKey.value] || 'Current project phase';
    });

    const allStages = computed(() => {
      return PROJECT_BOARD_COLUMNS.map(col => ({
        key: col.key,
        name: col.boardName
      }));
    });

    const currentStageIndex = computed(() => {
      return allStages.value.findIndex(s => s.key === currentStageKey.value);
    });

    const isStageCompleted = (stageKey: string) => {
      const stageIndex = allStages.value.findIndex(s => s.key === stageKey);
      return stageIndex < currentStageIndex.value;
    };

    const isStageActive = (stageKey: string) => {
      const stageIndex = allStages.value.findIndex(s => s.key === stageKey);
      return stageIndex <= currentStageIndex.value;
    };

    const isCurrentStage = (stageKey: string) => {
      return stageKey === currentStageKey.value;
    };

    const nextStage = computed(() => {
      const nextIndex = currentStageIndex.value + 1;
      if (nextIndex < allStages.value.length) {
        return allStages.value[nextIndex];
      }
      return null;
    });

    return {
      stageName,
      stageIcon,
      stageColors,
      stageDescription,
      allStages,
      isStageCompleted,
      isStageActive,
      isCurrentStage,
      nextStage
    };
  }
});
</script>

<style scoped lang="scss">
.board-stage-card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;

  .stage-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    .stage-icon {
      q-avatar {
        border: 2px solid var(--md-sys-color-outline-variant);
      }
    }

    .stage-progress {
      position: relative;

      .stage-dot-container {
        position: relative;
        display: flex;
        align-items: center;

        .stage-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--md-sys-color-surface-variant);
          border: 2px solid var(--md-sys-color-outline-variant);
          transition: all 0.3s ease;

          &.active {
            background: var(--q-primary);
            border-color: var(--q-primary);
          }

          &.completed {
            background: var(--q-positive);
            border-color: var(--q-positive);
          }

          &.current {
            width: 16px;
            height: 16px;
            background: var(--q-primary);
            border-color: var(--q-primary);
            box-shadow: 0 0 0 3px rgba(var(--q-primary-rgb), 0.2);
          }
        }

        .stage-connector {
          position: absolute;
          left: 12px;
          width: 20px;
          height: 2px;
          background: var(--md-sys-color-outline-variant);
        }
      }
    }

    .next-stage-info {
      padding: 4px 8px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 4px;
      display: inline-block;
    }
  }
}
</style>