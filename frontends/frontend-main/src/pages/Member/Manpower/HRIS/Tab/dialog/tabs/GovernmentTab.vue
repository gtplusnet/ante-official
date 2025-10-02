<template>
  <div class="government-tab">
    <!-- Government Identification Section -->
    <div class="md3-surface">
      <h3 class="md3-title-large">
        <q-icon name="assignment_ind" class="q-mr-sm" color="primary" />
        Government Identification Numbers
      </h3>
      <div class="md3-body-medium text-grey-7 q-mb-md">
        Please provide the government-issued identification numbers for this employee.
      </div>
      
      <div class="row q-col-gutter-md">
        <!-- TIN Section -->
        <div class="col-12 col-sm-6">
          <div class="md3-surface-variant">
            <div class="row items-center q-mb-sm">
              <q-icon name="account_balance" color="primary" size="24px" class="q-mr-sm" />
              <div class="md3-title-medium">TIN Number</div>
            </div>
            <div class="md3-body-medium text-grey-7 q-mb-sm">Tax Identification Number</div>
            <q-input 
              v-model="governmentDetails.tinNumber"
              placeholder="XXX-XXX-XXX-XXX"
              outlined
              dense
              mask="###-###-###-###"
              fill-mask="_"
              class="md3-input"
            />
          </div>
        </div>
        
        <!-- SSS Section -->
        <div class="col-12 col-sm-6">
          <div class="md3-surface-variant">
            <div class="row items-center q-mb-sm">
              <q-icon name="security" color="primary" size="24px" class="q-mr-sm" />
              <div class="md3-title-medium">SSS Number</div>
            </div>
            <div class="md3-body-medium text-grey-7 q-mb-sm">Social Security System</div>
            <q-input 
              v-model="governmentDetails.sssNumber"
              placeholder="XX-XXXXXXX-X"
              outlined
              dense
              mask="##-#######-#"
              fill-mask="_"
              class="md3-input"
            />
          </div>
        </div>
        
        <!-- HDMF Section -->
        <div class="col-12 col-sm-6">
          <div class="md3-surface-variant">
            <div class="row items-center q-mb-sm">
              <q-icon name="home" color="primary" size="24px" class="q-mr-sm" />
              <div class="md3-title-medium">HDMF Number</div>
            </div>
            <div class="md3-body-medium text-grey-7 q-mb-sm">Pag-IBIG Fund</div>
            <q-input 
              v-model="governmentDetails.hdmfNumber"
              placeholder="XXXX-XXXX-XXXX"
              outlined
              dense
              mask="####-####-####"
              fill-mask="_"
              class="md3-input"
            />
          </div>
        </div>
        
        <!-- PHIC Section -->
        <div class="col-12 col-sm-6">
          <div class="md3-surface-variant">
            <div class="row items-center q-mb-sm">
              <q-icon name="local_hospital" color="primary" size="24px" class="q-mr-sm" />
              <div class="md3-title-medium">PHIC Number</div>
            </div>
            <div class="md3-body-medium text-grey-7 q-mb-sm">PhilHealth Insurance</div>
            <q-input 
              v-model="governmentDetails.phicNumber"
              placeholder="XX-XXXXXXXXX-X"
              outlined
              dense
              mask="##-#########-#"
              fill-mask="_"
              class="md3-input"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="../EditCreateEmployee.scss"></style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'GovernmentTab',
  components: {
  },
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['cancel', 'update'],
  data: () => ({
    isLoading: false,
    governmentDetails: {
      tinNumber: '',
      sssNumber: '',
      hdmfNumber: '',
      phicNumber: '',
    },
  }),
  mounted() {
    this.populateFormData();
  },
  watch: {
    employeeData: {
      handler(newVal) {
        if (newVal) {
          this.populateFormData();
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    populateFormData() {
      if (this.employeeData && this.employeeData.data) {
        const { governmentDetails } = this.employeeData.data;
        
        // Populate government details if they exist
        if (governmentDetails) {
          this.governmentDetails = {
            tinNumber: governmentDetails.tinNumber || '',
            sssNumber: governmentDetails.sssNumber || '',
            hdmfNumber: governmentDetails.hdmfNumber || '',
            phicNumber: governmentDetails.phicNumber || '',
          };
        }
      }
    },
    
    updateGovernmentDetails() {
      this.$q.loading.show();
      
      const params = {
        accountId: this.employeeData.data.accountDetails.id,
        governmentDetails: {
          tinNumber: this.governmentDetails.tinNumber || null,
          sssNumber: this.governmentDetails.sssNumber || null,
          hdmfNumber: this.governmentDetails.hdmfNumber || null,
          phicNumber: this.governmentDetails.phicNumber || null,
        },
      };

      api
        .patch('/hris/employee/update-government-details', params)
        .then(() => {
          this.$emit('update');
          this.$q.notify({
            type: 'positive',
            message: 'Government details updated successfully',
          });
        })
        .catch((error) => {
          console.error('Error updating government details:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to update government details',
          });
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
  },
};
</script>

<style scoped lang="scss">
.section-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}
</style>