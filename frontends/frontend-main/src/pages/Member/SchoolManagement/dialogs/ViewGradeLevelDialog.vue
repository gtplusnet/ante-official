<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="width: 500px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">View Grade Level</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section v-if="gradeLevelData">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Code</div>
            <div class="text-body1">{{ gradeLevelData.data.code }}</div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Grade Level Name</div>
            <div class="text-body1">{{ gradeLevelData.data.name }}</div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Education Level</div>
            <q-badge :color="getEducationLevelColor(gradeLevelData.data.educationLevel)" text-color="white">
              {{ formatEducationLevel(gradeLevelData.data.educationLevel) }}
            </q-badge>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Sequence</div>
            <div class="text-body1">{{ gradeLevelData.data.sequence }}</div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Minimum Age</div>
            <div class="text-body1">
              {{ gradeLevelData.data.ageRangeMin ? `${gradeLevelData.data.ageRangeMin} years` : '-' }}
            </div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Maximum Age</div>
            <div class="text-body1">
              {{ gradeLevelData.data.ageRangeMax ? `${gradeLevelData.data.ageRangeMax} years` : '-' }}
            </div>
          </div>

          <div class="col-12" v-if="gradeLevelData.data.description">
            <div class="text-weight-bold text-grey-7">Description</div>
            <div class="text-body1">{{ gradeLevelData.data.description }}</div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Status</div>
            <q-badge :color="gradeLevelData.data.isActive ? 'green' : 'grey'" text-color="white">
              {{ gradeLevelData.data.isActive ? 'Active' : 'Inactive' }}
            </q-badge>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Created At</div>
            <div class="text-body1">{{ gradeLevelData.data.createdAt }}</div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Updated At</div>
            <div class="text-body1">{{ gradeLevelData.data.updatedAt }}</div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Edit" color="primary" @click="editGradeLevel" />
        <q-btn flat label="Close" color="grey" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { GradeLevelResponse } from '@shared/response';

export default defineComponent({
  name: 'ViewGradeLevelDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    gradeLevelData: {
      type: Object as () => { data: GradeLevelResponse } | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'edit'],
  setup(props, { emit }) {
    const close = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    const editGradeLevel = () => {
      emit('edit', props.gradeLevelData);
      close();
    };

    const formatEducationLevel = (level: string) => {
      const levelMap: Record<string, string> = {
        NURSERY: 'Nursery',
        KINDERGARTEN: 'Kindergarten',
        ELEMENTARY: 'Elementary',
        JUNIOR_HIGH: 'Junior High',
        SENIOR_HIGH: 'Senior High',
        COLLEGE: 'College',
      };
      return levelMap[level] || level;
    };

    const getEducationLevelColor = (level: string) => {
      const colorMap: Record<string, string> = {
        NURSERY: 'purple',
        KINDERGARTEN: 'indigo',
        ELEMENTARY: 'blue',
        JUNIOR_HIGH: 'cyan',
        SENIOR_HIGH: 'teal',
        COLLEGE: 'green',
      };
      return colorMap[level] || 'grey';
    };

    return {
      close,
      editGradeLevel,
      formatEducationLevel,
      getEducationLevelColor,
    };
  },
});
</script>