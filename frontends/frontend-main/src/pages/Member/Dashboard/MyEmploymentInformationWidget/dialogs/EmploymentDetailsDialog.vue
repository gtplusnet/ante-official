<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="assignment" size="20px" />
        <span class="md3-title">Employment Details</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>

      <!-- MD3 Dense Content -->
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <!-- Loading State -->
          <div v-if="loading" class="md3-loading-dense">
          <q-spinner-dots size="40px" color="primary" />
          <div class="loading-text">Loading employment details...</div>
        </div>

        <!-- Content -->
        <div v-else-if="employmentData">
          <!-- Personal Information Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="person" size="18px" />
              Personal Information
            </div>
            <div class="md3-grid-dense cols-2">
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Employee Code:</span>
                <span class="md3-info-value">{{ employmentData.employeeCode || 'N/A' }}</span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Full Name:</span>
                <span class="md3-info-value">
                  {{ formatFullName(employmentData.personalInfo) }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Date of Birth:</span>
                <span class="md3-info-value">
                  {{ formatDate(employmentData.personalInfo.dateOfBirth) || 'N/A' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Gender:</span>
                <span class="md3-info-value">
                  {{ employmentData.personalInfo.gender || 'N/A' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Civil Status:</span>
                <span class="md3-info-value">
                  {{ employmentData.personalInfo.civilStatus || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="contact_phone" size="18px" />
              Contact Information
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Email:</span>
              <span class="md3-info-value">
                {{ employmentData.contactInfo.email }}
              </span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Contact Number:</span>
              <span class="md3-info-value">
                {{ employmentData.contactInfo.contactNumber || 'N/A' }}
              </span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Address:</span>
              <span class="md3-info-value">
                {{ employmentData.contactInfo.address || 'N/A' }}
              </span>
            </div>
          </div>

          <!-- Work Assignment Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="business_center" size="18px" />
              Work Assignment
            </div>
            <div class="md3-grid-dense cols-2">
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Department:</span>
                <span class="md3-info-value">
                  {{ employmentData.workAssignment.department || 'N/A' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Position:</span>
                <span class="md3-info-value">
                  {{ employmentData.workAssignment.position || 'N/A' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Branch:</span>
                <span class="md3-info-value">
                  {{ employmentData.workAssignment.branch || 'N/A' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Employment Status:</span>
                <span class="md3-info-value">
                  <span 
                    class="md3-badge-dense"
                    :class="getStatusClass(employmentData.workAssignment.employmentStatus)"
                  >
                    {{ employmentData.workAssignment.employmentStatus || 'N/A' }}
                  </span>
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Date Hired:</span>
                <span class="md3-info-value">
                  {{ formatDate(employmentData.workAssignment.dateHired) || 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="md3-empty-dense">
          <q-icon name="error_outline" />
          <div class="empty-title">Error Loading Data</div>
          <div class="empty-subtitle">{{ error }}</div>
        </div>

        <!-- Empty State -->
        <div v-else class="md3-empty-dense">
          <q-icon name="assignment_late" />
          <div class="empty-title">No Employment Details</div>
          <div class="empty-subtitle">Employment information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type EmploymentDetailsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'EmploymentDetailsDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const employmentData = ref<EmploymentDetailsResponse | null>(null);

    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) {
        loadEmploymentDetails();
      }
    });

    // Emit changes
    watch(show, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const loadEmploymentDetails = async () => {
      loading.value = true;
      error.value = null;
      try {
        employmentData.value = await employeeInfoService.getEmploymentDetails();
      } catch (err: any) {
        console.error('Error loading employment details:', err);
        error.value = err.response?.data?.message || 'Failed to load employment details';
      } finally {
        loading.value = false;
      }
    };

    const formatFullName = (personalInfo: any) => {
      const { firstName, lastName, middleName } = personalInfo;
      const middle = middleName ? ` ${middleName}` : '';
      return `${firstName}${middle} ${lastName}`;
    };

    const formatDate = (dateString: string | Date | undefined) => {
      if (!dateString) return null;
      return date.formatDate(dateString, 'MMM DD, YYYY');
    };

    const getStatusClass = (status: string | undefined) => {
      if (!status) return '';
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('active') || lowerStatus.includes('regular')) return 'active';
      if (lowerStatus.includes('inactive') || lowerStatus.includes('terminated')) return 'inactive';
      if (lowerStatus.includes('probation') || lowerStatus.includes('pending')) return 'pending';
      return 'info';
    };

    return {
      show,
      loading,
      error,
      employmentData,
      formatFullName,
      formatDate,
      getStatusClass,
    };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>