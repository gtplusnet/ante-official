<template>
  <q-dialog v-model="model" persistent maximized>
    <q-card style="max-width: 1200px; width: 100%">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div class="text-h6">Guardian Information</div>
          <q-btn @click="close" round flat icon="close" />
        </div>
      </q-card-section>

      <q-card-section v-if="guardianData" class="q-pa-lg">
        <div class="row q-col-gutter-lg">
          <!-- Left Column: Profile -->
          <div class="col-12 col-md-4">
            <!-- Profile Photo -->
            <div class="text-center q-mb-lg">
              <q-avatar size="150px" class="q-mb-md">
                <q-icon name="o_family_restroom" color="grey-6" size="100px" />
              </q-avatar>
              <div class="text-h6">
                {{ guardianData.data.name }}
              </div>
              <div class="text-subtitle1 text-grey-7">{{ guardianData.data.email }}</div>
              <q-badge :color="guardianData.data.isActive ? 'green' : 'grey'" class="q-mt-sm">
                {{ guardianData.data.isActive ? 'Active' : 'Inactive' }}
              </q-badge>
            </div>

            <!-- Contact Summary Card -->
            <q-card flat bordered class="q-pa-md q-mb-lg">
              <div class="text-subtitle2 q-mb-sm">Quick Contact</div>
              <div>
                <q-icon name="phone" color="primary" class="q-mr-sm" />
                {{ guardianData.data.contactNumber }}
              </div>
            </q-card>

            <!-- QR Code Section -->
            <q-card flat bordered class="q-pa-md text-center">
              <div class="text-subtitle2 q-mb-sm">Guardian QR Code</div>
              <qrcode-vue 
                :value="`guardian:${guardianData.data.id}`" 
                :size="200" 
                level="M"
                render-as="svg"
                class="q-mx-auto"
              />
              <div class="text-caption text-grey-7 q-mt-sm">
                Scan to view guardian information
              </div>
              <q-separator class="q-my-sm" />
              <div class="text-caption text-weight-medium">QR Code Value:</div>
              <div class="text-caption text-grey-8 q-pa-xs bg-grey-1 rounded-borders q-mt-xs" style="font-family: monospace; word-break: break-all;">
                guardian:{{ guardianData.data.id }}
              </div>
            </q-card>
          </div>

          <!-- Right Column: Guardian Details -->
          <div class="col-12 col-md-8">
            <!-- Basic Information -->
            <div class="text-h6 q-mb-md">Basic Information</div>
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">First Name</div>
                <div class="text-body1">{{ guardianData.data.firstName }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Last Name</div>
                <div class="text-body1">{{ guardianData.data.lastName }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Middle Name</div>
                <div class="text-body1">{{ guardianData.data.middleName || 'N/A' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Date of Birth</div>
                <div class="text-body1">{{ formatDate(guardianData.data.dateOfBirth) }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Contact Number</div>
                <div class="text-body1">{{ guardianData.data.contactNumber }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Email</div>
                <div class="text-body1">{{ guardianData.data.email }}</div>
              </div>
            </div>

            <q-separator class="q-my-lg" />

            <!-- Connected Students -->
            <div class="text-h6 q-mb-md">
              Connected Students 
              <q-badge color="primary" class="q-ml-sm">
                {{ guardianData.data.studentCount }} {{ guardianData.data.studentCount === 1 ? 'student' : 'students' }}
              </q-badge>
            </div>
            <div v-if="guardianData.data.students && guardianData.data.students.length > 0">
              <q-list bordered separator class="rounded-borders">
                <q-item v-for="student in guardianData.data.students" :key="student.id">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">
                      {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ student.name }}</q-item-label>
                    <q-item-label caption>Student #{{ student.studentNumber }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-right">
                      <q-badge :color="student.isPrimary ? 'green' : 'grey-5'" :label="student.relationship" />
                      <div v-if="student.isPrimary" class="text-caption text-green q-mt-xs">Primary Guardian</div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else class="text-grey-6">
              No students connected to this guardian yet.
            </div>

            <q-separator class="q-my-lg" />

            <!-- System Information -->
            <div class="text-h6 q-mb-md">System Information</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Date Created</div>
                <div class="text-body1">{{ formatDate(guardianData.data.createdAt) }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Last Login</div>
                <div class="text-body1">{{ guardianData.data.lastLogin ? formatDate(guardianData.data.lastLogin) : 'Never' }}</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn @click="editGuardian" color="primary" label="Edit" icon="edit" no-caps unelevated class="q-px-lg" />
        <q-btn @click="close" color="grey" label="Close" no-caps flat />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import type { GuardianResponse } from '@shared/response';

export default defineComponent({
  name: 'ViewGuardianDialog',
  components: {
    QrcodeVue,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    guardianData: {
      type: Object as () => { data: GuardianResponse } | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'edit'],
  setup(props, { emit }) {
    const model = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const close = () => {
      emit('close');
    };

    const editGuardian = () => {
      emit('edit', props.guardianData);
      close();
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      
      // The backend returns date in MM/DD/YYYY (hh:mm A) format
      // Extract just the date part
      const datePart = dateString.split(' ')[0];
      if (datePart && datePart.includes('/')) {
        // Convert MM/DD/YYYY to a more readable format
        const [month, day, year] = datePart.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      // Fallback to parsing as date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return {
      model,
      close,
      editGuardian,
      formatDate,
    };
  },
});
</script>