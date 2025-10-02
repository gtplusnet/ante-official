<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="width: 600px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">View Section</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section v-if="sectionData">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Section Name</div>
            <div class="text-body1">{{ sectionData.name }}</div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Grade Level</div>
            <div class="text-body1" v-if="sectionData.gradeLevel">
              <div>{{ sectionData.gradeLevel.name }}</div>
              <div class="text-caption text-grey-6">{{ sectionData.gradeLevel.code }}</div>
            </div>
            <div v-else class="text-grey-6">-</div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Adviser Name</div>
            <div class="text-body1">{{ sectionData.adviserName || '-' }}</div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">School Year</div>
            <div class="text-body1">{{ sectionData.schoolYear }}</div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Capacity</div>
            <div class="text-body1">
              {{ sectionData.capacity ? `${sectionData.capacity} students` : 'Unlimited' }}
            </div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Student Count</div>
            <div v-if="sectionData.capacity">
              <q-linear-progress 
                :value="(sectionData.studentCount || 0) / sectionData.capacity" 
                class="q-mt-xs"
                color="primary"
                track-color="grey-3"
                size="12px"
              />
              <div class="text-caption q-mt-xs">
                {{ sectionData.studentCount || 0 }} / {{ sectionData.capacity }} students enrolled
              </div>
            </div>
            <div v-else class="text-body1">
              {{ sectionData.studentCount || 0 }} students enrolled
            </div>
          </div>

          <div class="col-12">
            <div class="text-weight-bold text-grey-7">Status</div>
            <q-badge :color="sectionData.isActive ? 'green' : 'grey'" text-color="white">
              {{ sectionData.isActive ? 'Active' : 'Inactive' }}
            </q-badge>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Created At</div>
            <div class="text-body1">{{ formatDateTime(sectionData.createdAt) }}</div>
          </div>

          <div class="col-6">
            <div class="text-weight-bold text-grey-7">Updated At</div>
            <div class="text-body1">{{ formatDateTime(sectionData.updatedAt) }}</div>
          </div>

          <!-- Students List -->
          <div class="col-12" v-if="sectionData.students && sectionData.students.length > 0">
            <div class="text-weight-bold text-grey-7 q-mb-sm">Students in this Section</div>
            <q-list bordered separator>
              <q-item v-for="student in sectionData.students" :key="student.id">
                <q-item-section>
                  <q-item-label>{{ student.lastName }}, {{ student.firstName }} {{ student.middleName || '' }}</q-item-label>
                  <q-item-label caption>{{ student.studentNumber }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Edit" color="primary" @click="editSection" />
        <q-btn flat label="Close" color="grey" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ViewSectionDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    sectionData: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'edit'],
  setup(props, { emit }) {
    const close = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    const editSection = () => {
      emit('edit', props.sectionData);
      close();
    };

    const formatDateTime = (dateString: string) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return {
      close,
      editSection,
      formatDateTime,
    };
  },
});
</script>