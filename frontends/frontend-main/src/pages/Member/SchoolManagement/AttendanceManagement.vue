<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Attendance Logs</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_attendance' }" />
              <q-breadcrumbs-el label="Academic Operations" />
              <q-breadcrumbs-el label="Attendance Logs" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn 
            @click="showPeopleWithoutCheckout = true" 
            no-caps 
            color="warning" 
            unelevated 
            class="q-mr-sm"
          >
            <q-icon name="warning"></q-icon>
            People Without Checkout
          </q-btn>
          <q-btn @click="exportAttendance()" no-caps color="secondary" unelevated>
            <q-icon name="o_download"></q-icon>
            Export
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-md" v-if="summary">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ summary.totalCheckIns || 0 }}</div>
            <div class="text-grey-6">Total Check-ins</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ summary.totalCheckOuts || 0 }}</div>
            <div class="text-grey-6">Total Check-outs</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ summary.studentCheckIns || 0 }}</div>
            <div class="text-grey-6">Student Check-ins</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ summary.guardianCheckIns || 0 }}</div>
            <div class="text-grey-6">Guardian Check-ins</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Date Filter -->
    <g-card class="q-mb-md q-pa-md">
      <div class="row items-center">
        <div class="col-12 col-md-4">
          <g-input
            v-model="selectedDate"
            type="date"
            label="Filter by Date"
            @update:modelValue="onDateChange"
          />
        </div>
        <div class="col-12 col-md-8 text-right">
          <q-btn
            flat
            no-caps
            color="primary"
            icon="today"
            label="Today"
            @click="setToday"
            class="q-mr-sm"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="event"
            label="Yesterday"
            @click="setYesterday"
          />
        </div>
      </div>
    </g-card>

    <!-- Attendance Table -->
    <g-card class="q-pa-md">
      <g-table 
        :isRowActionEnabled="false" 
        tableKey="attendanceLogsTable" 
        apiUrl="school/attendance/table" 
        ref="table"
        :query="tableQuery"
        :key="selectedDate"
      >
        <!-- Person Type Slot -->
        <template v-slot:badge="props">
          <q-badge 
            :color="props.data.personType === 'student' ? 'primary' : 'secondary'" 
            text-color="white"
          >
            {{ props.data.personType === 'student' ? 'Student' : 'Guardian' }}
          </q-badge>
        </template>

        <!-- Action Slot -->
        <template v-slot:action="props">
          <div class="row items-center no-wrap">
            <q-icon 
              :name="props.data.action === 'check_in' ? 'login' : 'logout'"
              :color="props.data.action === 'check_in' ? 'green' : 'orange'"
              size="sm"
              class="q-mr-sm"
            />
            <span>{{ props.data.action === 'check_in' ? 'Check In' : 'Check Out' }}</span>
          </div>
        </template>
      </g-table>
    </g-card>

    <!-- People Without Checkout Dialog -->
    <StudentsWithoutCheckoutDialog
      v-model="showPeopleWithoutCheckout"
      :date="selectedDate"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import GInput from 'src/components/shared/form/GInput.vue';
import StudentsWithoutCheckoutDialog from './StudentsWithoutCheckoutDialog.vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
interface IAttendanceSummaryResponse {
  date: string;
  totalCheckIns: number;
  totalCheckOuts: number;
  studentCheckIns: number;
  guardianCheckIns: number;
  totalRecords: number;
}

export default defineComponent({
  name: 'AttendanceManagement',
  components: {
    GTable,
    GCard,
    GInput,
    StudentsWithoutCheckoutDialog,
    ExpandedNavPageContainer,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<any>(null);
    const summary = ref<IAttendanceSummaryResponse | null>(null);
    const showPeopleWithoutCheckout = ref(false);
    
    // Initialize with today's date
    const today = new Date();
    const selectedDate = ref(formatDateForInput(today));

    const tableQuery = computed(() => ({
      date: selectedDate.value,
    }));

    function formatDateForInput(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const fetchSummary = async () => {
      try {
        const response = await api.get('/school/attendance/summary', {
          params: { date: selectedDate.value },
        });
        summary.value = response.data;
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      }
    };

    const onDateChange = () => {
      fetchSummary();
      // Table will automatically refetch due to key change
    };

    const setToday = () => {
      selectedDate.value = formatDateForInput(new Date());
      onDateChange();
    };

    const setYesterday = () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      selectedDate.value = formatDateForInput(yesterday);
      onDateChange();
    };

    const exportAttendance = async () => {
      $q.loading.show({
        message: 'Preparing export...',
      });

      try {
        const response = await api.post('/school/attendance/export', {
          date: selectedDate.value,
          format: 'csv',
        });

        // Convert data to CSV
        const data = response.data;
        if (!data || data.length === 0) {
          $q.notify({
            type: 'warning',
            message: 'No data to export',
          });
          return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map((row: any) => 
            headers.map(header => {
              const value = row[header];
              // Escape commas and quotes in values
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-logs-${selectedDate.value}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $q.notify({
          type: 'positive',
          message: 'Export completed successfully',
        });
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        $q.loading.hide();
      }
    };

    onMounted(() => {
      fetchSummary();
    });

    return {
      table,
      selectedDate,
      summary,
      tableQuery,
      onDateChange,
      setToday,
      setYesterday,
      exportAttendance,
      showPeopleWithoutCheckout,
    };
  },
});
</script>

<style scoped>
.title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.summary-card {
  text-align: center;
  padding: 20px;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
}

.summary-label {
  color: #666;
  margin-top: 8px;
}
</style>