<template>
  <q-dialog v-model="model" persistent>
    <template-dialog 
      size="md" 
      icon="o_school" 
      icon-color="primary"
      :scrollable="true"
    >
      <template #DialogTitle>Student Information</template>

      <template #DialogContent>
        <div v-if="studentData" class="md3-content">
          <div class="md3-content-grid">
            <!-- Profile Section -->
            <div class="md3-profile-section">
              <!-- Profile Header -->
              <div class="md3-profile-header">
                <q-avatar size="100px" class="md3-avatar">
                  <img 
                    v-if="studentData.data.profilePhoto" 
                    :src="studentData.data.profilePhoto.url" 
                    :alt="`${studentData.data.firstName} ${studentData.data.lastName}`"
                  />
                  <q-icon v-else name="person" color="grey-6" size="48px" />
                </q-avatar>
                
                <div class="md3-student-name">
                  {{ studentData.data.firstName }} {{ studentData.data.middleName ? studentData.data.middleName + ' ' : '' }}{{ studentData.data.lastName }}
                </div>
                
                <div class="md3-student-number">{{ studentData.data.studentNumber }}</div>
                
                <div class="md3-status-chip" :class="studentData.data.isActive ? 'active' : 'inactive'">
                  {{ studentData.data.isActive ? 'Active' : 'Inactive' }}
                </div>
              </div>

              <!-- QR Code Section -->
              <div class="md3-qr-section">
                <div class="md3-qr-title">Student QR Code</div>
                
                <div class="md3-qr-code">
                  <qrcode-vue 
                    :value="`student:${studentData.data.id}`" 
                    :size="120" 
                    level="M"
                    render-as="svg"
                  />
                </div>
                
                <div class="md3-qr-description">
                  Scan to view student information
                </div>
                
                <div class="md3-qr-value">
                  student:{{ studentData.data.id }}
                </div>
              </div>
            </div>

            <!-- Details Section -->
            <div class="md3-details-section">
              <!-- Personal Information -->
              <div class="md3-info-card">
                <div class="md3-section-title">
                  <q-icon name="person" size="18px"/>
                  Personal Information
                </div>
                
                <div class="md3-field-grid">
                  <div class="md3-field">
                    <div class="md3-field-label">First Name</div>
                    <div class="md3-field-value">{{ studentData.data.firstName }}</div>
                  </div>
                  
                  <div class="md3-field">
                    <div class="md3-field-label">Last Name</div>
                    <div class="md3-field-value">{{ studentData.data.lastName }}</div>
                  </div>
                  
                  <div class="md3-field">
                    <div class="md3-field-label">Middle Name</div>
                    <div class="md3-field-value" :class="{ empty: !studentData.data.middleName }">
                      {{ studentData.data.middleName || 'Not provided' }}
                    </div>
                  </div>

                  <div class="md3-field">
                    <div class="md3-field-label">Date of Birth</div>
                    <div class="md3-field-value">{{ formatDate(studentData.data.dateOfBirth) }}</div>
                  </div>
                  
                  <div class="md3-field">
                    <div class="md3-field-label">Gender</div>
                    <div class="md3-field-value">{{ studentData.data.gender }}</div>
                  </div>
                </div>
              </div>

              <!-- Academic Information -->
              <div class="md3-info-card">
                <div class="md3-section-title">
                  <q-icon name="badge" size="18px"/>
                  Academic Information
                </div>
                
                <div class="md3-field-grid">
                  <div class="md3-field">
                    <div class="md3-field-label">Student Number</div>
                    <div class="md3-field-value">{{ studentData.data.studentNumber }}</div>
                  </div>
                  
                  <div class="md3-field">
                    <div class="md3-field-label">LRN</div>
                    <div class="md3-field-value" :class="{ empty: !studentData.data.lrn }">
                      {{ studentData.data.lrn || 'Not provided' }}
                    </div>
                  </div>

                  <div class="md3-field adviser-section">
                    <div class="md3-field-label">Adviser Name</div>
                    <div class="md3-field-value" :class="{ empty: !studentData.data.section?.adviserName }">
                      {{ formatAdviserName(studentData.data.section?.adviserName) || 'Not assigned' }}
                    </div>
                  </div>
                  
                  <div class="md3-field gr-section">
                    <div class="md3-field-label">Grade & Section</div>
                    <div class="md3-field-value" :class="{ empty: !studentData.data.section }">
                      <template v-if="studentData.data.section">
                        <div>{{ formatGradeName(studentData.data.section.gradeLevel.name) }} - {{ studentData.data.section.name }}</div>
                      </template>
                      <template v-else>
                        Not assigned
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Guardian Information -->
              <!-- <div class="md3-info-card">
                <div class="md3-section-title">
                  <q-icon name="family_restroom" size="18px"/>
                  Guardian Information
                </div>
                
                <div v-if="studentData.data.guardian" class="md3-guardian-card">
                  <div class="md3-field-grid">
                    <div class="md3-field">
                      <div class="md3-field-label">Guardian Name</div>
                      <div class="md3-field-value">{{ studentData.data.guardian.name }}</div>
                    </div>
                    
                    <div class="md3-field">
                      <div class="md3-field-label">Relationship</div>
                      <div class="md3-field-value">{{ studentData.data.guardian.relationship }}</div>
                    </div>
                    
                    <div class="md3-field">
                      <div class="md3-field-label">Contact Number</div>
                      <div class="md3-field-value">{{ studentData.data.guardian.contactNumber }}</div>
                    </div>
                    
                    <div class="md3-field">
                      <div class="md3-field-label">Email</div>
                      <div class="md3-field-value">{{ studentData.data.guardian.email }}</div>
                    </div>
                  </div>
                </div>
                
                <div v-else class="md3-field-value empty">
                  No guardian assigned to this student
                </div>
              </div> -->

              <!-- Date Registered -->
              <div class="md3-info-card">
                <div class="md3-section-title">
                  <q-icon name="today" size="18px"/>
                  Date Registered
                </div>
                
                <div class="md3-field-grid">
                  <div class="md3-field">
                    <div class="md3-field-value">{{ formatDate(studentData.data.dateRegistered) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #DialogSubmitActions>
        <g-button 
          @click="close" 
          label="Close" 
          variant="outline"
          color="primary"
          v-close-popup
        />
        <g-button 
          @click="editStudent" 
          label="Edit" 
          icon="edit" 
          variant="filled"
          color="primary"
        />
      </template>
    </template-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import type { StudentResponse } from '@shared/response';

export default defineComponent({
  name: 'ViewStudentDialog',
  components: {
    QrcodeVue,
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    studentData: {
      type: Object as () => { data: StudentResponse } | null,
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

    const editStudent = () => {
      emit('edit', props.studentData);
      close();
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
    
    const formatAdviserName = (name: string | undefined) => {
      if (!name) return name;
      
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formatGradeName = (gradeName: string) => {
      if (!gradeName) return gradeName;
      
      // Convert college year names to ordinal format
      const yearMappings: Record<string, string> = {
        'FIRST YEAR': '1ST YEAR',
        'SECOND YEAR': '2ND YEAR',
        'THIRD YEAR': '3RD YEAR',
        'FOURTH YEAR': '4TH YEAR',
        'FIFTH YEAR': '5TH YEAR',
      };
      
      return yearMappings[gradeName.toUpperCase()] || gradeName;
    };

    return {
      model,
      close,
      editStudent,
      formatDate,
      getEducationLevelColor,
      formatGradeName,
      formatAdviserName,
    };
  },
});
</script>

<style lang="scss" scoped>
@import './ViewStudentDialog.scss';
</style>