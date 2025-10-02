<template>
  <expanded-nav-page-container>
    <div class="scheduling-wrapper">
      <div class="page-head q-pb-md row items-center justify-between">
        <div>
          <div class="title text-title-large">Individual Schedule</div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower_dashboard' }" />
            <q-breadcrumbs-el label="Scheduling" />
            <q-breadcrumbs-el label="Individual Scheduling" />
          </q-breadcrumbs>
        </div>
      </div>
    <!-- Date Navigation and Search -->
    <div class="row items-center justify-between q-mb-md q-px-md">
      <div class="row items-center q-gutter-sm">
        <q-btn 
          flat 
          round 
          icon="chevron_left" 
          size="sm" 
          @click="previousWeek"
          :disable="weekChangeLoading"
        />
        <span class="text-body1 text-weight-medium">
          {{ formatWeekRange() }}
        </span>
        <q-btn 
          flat 
          round 
          icon="chevron_right" 
          size="sm" 
          @click="nextWeek"
          :disable="weekChangeLoading"
        />
      </div>
      
      <div class="row items-center">
        <q-input
          v-model="searchTeam"
          placeholder="Search Team Name"
          outlined
          dense
          style="width: 200px;"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

      <!-- Weekly Schedule Grid -->
      <div class="schedule-container q-pa-md" style="position: relative;">
      <!-- Week Change Loading Overlay -->
      <div v-if="weekChangeLoading" class="loading-overlay">
        <q-spinner-dots size="50px" color="primary" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="text-body1 q-mt-md">Loading employees...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="employees.length === 0" class="text-center q-pa-xl">
        <q-icon name="people" size="4em" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-md">No employees found</div>
        <q-btn 
          @click="() => fetchEmployees(1)" 
          label="Retry" 
          color="primary" 
          outline 
          class="q-mt-md"
        />
      </div>

      <!-- Schedule Grid -->
      <div v-else class="schedule-grid" :class="{ 'loading-content': weekChangeLoading }">
        <!-- Empty corner cell -->
        <div class="header-cell corner-cell"></div>
        
        <!-- Day header cells -->
        <div 
          v-for="day in weekDays" 
          :key="day.date" 
          class="header-cell day-header"
        >
          <div class="text-weight-medium">{{ day.name }}</div>
          <div class="text-caption">{{ day.date }}</div>
        </div>

        <!-- Employee Rows -->
        <template v-for="employee in employees" :key="employee.id">
          <!-- Employee Name Cell -->
          <div class="employee-cell">
            <span class="text-weight-medium">
              {{ employee.name }}
              <span v-if="employee.teamId" class="text-caption text-blue-6">({{ employee.teamName }})</span>
            </span>
          </div>
          
          <!-- Schedule Cells for each day -->
          <div 
            v-for="day in weekDays" 
            :key="`${employee.id}-${day.date}`"
            class="schedule-cell"
          >
            <div class="schedule-dropdowns">
              <!-- Project Dropdown - Using pre-calculated data -->
              <div :class="{ 
                'changed-value': allFieldData[`${employee.id}_${day.date}_project`]?.isChanged && !allFieldData[`${employee.id}_${day.date}_project`]?.isTeamSchedule,
                'team-schedule-value': allFieldData[`${employee.id}_${day.date}_project`]?.isTeamSchedule
              }" class="q-mb-xs">
                <q-select
                  :model-value="allFieldData[`${employee.id}_${day.date}_project`]?.displayValue"
                  @update:model-value="(val) => { employee.schedules[day.date].project = val; trackChange(employee.id, day.date, 'project'); }"
                  :options="projectOptions"
                  :loading="projectsLoading || savingFields[`${employee.id}_${day.date}_project`]"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  :clearable="allFieldData[`${employee.id}_${day.date}_project`]?.clearable"
                  style="min-width: 120px;"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label 
                          :class="{ 'text-weight-bold': isDefaultProject(employee.id, day.date, scope.opt.value) && employee.schedules[day.date].project !== scope.opt.value }"
                        >
                          {{ scope.opt.label }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              
              <!-- Schedule Type Dropdown - Using pre-calculated data -->
              <div :class="{ 
                'changed-value': allFieldData[`${employee.id}_${day.date}_schedule`]?.isChanged && !allFieldData[`${employee.id}_${day.date}_schedule`]?.isTeamSchedule,
                'team-schedule-value': allFieldData[`${employee.id}_${day.date}_schedule`]?.isTeamSchedule
              }">
                <q-select
                  :model-value="allFieldData[`${employee.id}_${day.date}_schedule`]?.displayValue"
                  @update:model-value="(val) => { employee.schedules[day.date].schedule = val; trackChange(employee.id, day.date, 'schedule'); }"
                  :options="shiftOptions"
                  :loading="shiftsLoading || savingFields[`${employee.id}_${day.date}_schedule`]"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  :clearable="allFieldData[`${employee.id}_${day.date}_schedule`]?.clearable"
                  style="min-width: 120px;"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label 
                          :class="{ 'text-weight-bold': isDefaultShift(employee.id, day.date, scope.opt.value) && employee.schedules[day.date].schedule !== scope.opt.value }"
                        >
                          {{ scope.opt.label }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="text-caption text-grey-6">
            Showing {{ ((currentPage - 1) * perPage) + 1 }}-{{ Math.min(currentPage * perPage, pagination.totalCount) }} of {{ pagination.totalCount }} employees
          </div>
          <q-pagination
            v-model="currentPage"
            :max="pagination.totalPages"
            :max-pages="7"
            direction-links
            boundary-links
            color="primary"
            @update:model-value="onPageChange"
          />
        </div>
      </div>
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import { debounce } from 'quasar';

interface ProjectOption {
  label: string;
  value: number;
  key: number;
  type: 'project' | 'lead' | 'branch';
  name: string;
  status: string;
  isLead: boolean;
  clientName: string | null;
  locationName: string | null;
  personInChargeName: string | null;
}

interface ScheduleOption {
  label: string;
  value: number;
  shiftCode?: string;
  startTime?: string;
  endTime?: string;
  workHours?: number;
  workHoursFormatted?: string;
  shiftType?: string;
}

interface DaySchedule {
  project: number | null;
  schedule: number | null;
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  roleName: string;
  branchId: number;
  branchName: string;
  scheduleId: number | null;
  scheduleCode: string | null;
  teamId: number | null;
  teamName: string | null;
  weeklyShifts: {
    sunday: number | null;
    monday: number | null;
    tuesday: number | null;
    wednesday: number | null;
    thursday: number | null;
    friday: number | null;
    saturday: number | null;
  };
  schedules: Record<string, DaySchedule>;
}

interface PaginationInfo {
  currentPage: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface WeekDay {
  name: string;
  date: string;
  fullDate: Date;
}

export default {
  name: 'IndividualSchedulingMenuPage',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const $q = useQuasar();
    const searchTeam = ref('');
    
    // Get the start of the current week (Monday)
    const getStartOfWeek = (date: Date = new Date()): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      d.setDate(diff);
      d.setHours(0, 0, 0, 0); // Reset time to start of day
      return d;
    };
    
    const currentWeekStart = ref(getStartOfWeek());
    const loading = ref(false);
    const weekChangeLoading = ref(false);
    const currentPage = ref(1);
    const perPage = ref(15);
    const pagination = ref<PaginationInfo | null>(null);
    const projectsLoading = ref(false);
    const projectOptions = ref<ProjectOption[]>([]);
    const shiftsLoading = ref(false);
    const shiftOptions = ref<ScheduleOption[]>([]);

    // Fetch project options from API
    const fetchProjects = async (): Promise<void> => {
      try {
        projectsLoading.value = true;
        const response = await api.get('/select-box/scheduling-project-list');
        
        if (response.data && response.data.list) {
          projectOptions.value = response.data.list;
        }
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        handleAxiosError($q, error);
        projectOptions.value = [];
      } finally {
        projectsLoading.value = false;
      }
    };

    // Fetch shift data from API
    const fetchShifts = async (): Promise<void> => {
      try {
        shiftsLoading.value = true;
        const response = await api.get('/hris/employee/scheduling-shifts');
        
        if (response.data) {
          shiftOptions.value = response.data;
        }
      } catch (error: any) {
        console.error('Error fetching shifts:', error);
        handleAxiosError($q, error);
        shiftOptions.value = [];
      } finally {
        shiftsLoading.value = false;
      }
    };

    // Helper function to format date as MM/DD/YYYY
    const formatDate = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    // Generate week days
    const weekDays = computed((): WeekDay[] => {
      const days: WeekDay[] = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Show all 7 days of the week (Sunday to Saturday)
      const startDate = new Date(currentWeekStart.value);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        days.push({
          name: dayNames[date.getDay()],
          date: formatDate(date), // Changed to use MM/DD/YYYY format
          fullDate: date
        });
      }
      
      return days;
    });

    // Employee data from API
    const employees = ref<Employee[]>([]);
    // Store default schedule values to track changes
    const defaultSchedules = ref<Record<string, Record<string, DaySchedule>>>({});
    // Store saved schedules from database
    const savedSchedules = ref<Record<string, Record<string, DaySchedule>>>({});
    // Store team schedules for employees who belong to teams
    const teamSchedules = ref<Record<string, Record<string, DaySchedule>>>({});

    // Initialize schedule data for each day of the week
    const initializeScheduleData = (employee?: Partial<Employee>): Record<string, DaySchedule> => {
      const schedules: Record<string, DaySchedule> = {};
      
      // Use the current weekDays to generate schedule keys
      weekDays.value.forEach(day => {
        // Map weekday to shift ID from employee's weekly schedule
        let defaultShiftId = null;
        if (employee?.weeklyShifts) {
          const dayOfWeek = day.fullDate.getDay();
          switch(dayOfWeek) {
            case 0: defaultShiftId = employee.weeklyShifts.sunday; break;
            case 1: defaultShiftId = employee.weeklyShifts.monday; break;
            case 2: defaultShiftId = employee.weeklyShifts.tuesday; break;
            case 3: defaultShiftId = employee.weeklyShifts.wednesday; break;
            case 4: defaultShiftId = employee.weeklyShifts.thursday; break;
            case 5: defaultShiftId = employee.weeklyShifts.friday; break;
            case 6: defaultShiftId = employee.weeklyShifts.saturday; break;
          }
        }
        
        schedules[day.date] = {
          project: employee?.branchId || null,  // Use employee's branch as default
          schedule: defaultShiftId  // Use the employee's existing shift for this day
        };
      });
      
      return schedules;
    };

    // Fetch employees from API with pagination
    const fetchEmployees = async (page: number = 1): Promise<void> => {
      try {
        loading.value = true;
        
        const params = {
          page,
          perPage: perPage.value,
          search: searchTeam.value || undefined
        };
        
        const response = await api.get('/hris/employee/scheduling-list', { params });

        if (response.data) {
          const newEmployees = response.data.list.map((emp: any) => ({
            ...emp,
            schedules: initializeScheduleData(emp)  // Pass employee data to use branchId
          }));
          
          employees.value = newEmployees;
          pagination.value = response.data.pagination;
          currentPage.value = response.data.pagination.currentPage;
          // Store default schedules for change tracking
          defaultSchedules.value = {};
          newEmployees.forEach((emp: Employee) => {
            defaultSchedules.value[emp.id] = JSON.parse(JSON.stringify(emp.schedules));
          });
          
          // Fetch saved assignments and apply them
          await fetchSavedAssignments();
          
          // Fetch team schedules for employees with teams
          await fetchTeamSchedules();
        }
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        handleAxiosError($q, error);
        employees.value = [];
      } finally {
        loading.value = false;
      }
    };

    const formatWeekRange = (): string => {
      const start = new Date(currentWeekStart.value);
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Full week (Sunday to Saturday)
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    };

    const previousWeek = (): void => {
      const newDate = new Date(currentWeekStart.value);
      newDate.setDate(newDate.getDate() - 7);
      currentWeekStart.value = newDate;
    };

    const nextWeek = (): void => {
      const newDate = new Date(currentWeekStart.value);
      newDate.setDate(newDate.getDate() + 7);
      currentWeekStart.value = newDate;
    };

    // Debounced search handler
    const handleSearch = debounce(() => {
      currentPage.value = 1;
      fetchEmployees(1);
    }, 300);

    // Watch for search changes
    watch(searchTeam, () => {
      handleSearch();
    });
    
    // Watch for week changes to reinitialize schedule data
    watch(currentWeekStart, async () => {
      // Show loading overlay while fetching data for new week
      weekChangeLoading.value = true;
      
      try {
        // Re-initialize schedule data for all employees when week changes
        employees.value = employees.value.map(emp => ({
          ...emp,
          schedules: initializeScheduleData(emp)  // Pass employee data to preserve branch defaults
        }));
        
        // Update default schedules for the new week dates
        defaultSchedules.value = {};
        employees.value.forEach((emp: Employee) => {
          defaultSchedules.value[emp.id] = JSON.parse(JSON.stringify(emp.schedules));
        });
        
        // Clear any unsaved changes when switching weeks
        changedSchedules.value = {};
        
        // Fetch saved assignments for the new week
        await fetchSavedAssignments();
        
        // Fetch team schedules for the new week
        await fetchTeamSchedules();
      } finally {
        weekChangeLoading.value = false;
      }
    });

    // Handle page change
    const onPageChange = (newPage: number): void => {
      currentPage.value = newPage;
      fetchEmployees(newPage);
    };

    // Debug helper to check if values have changed
    const debugScheduleChange = (employeeId: string, date: string, type: 'project' | 'schedule'): void => {
      if (!defaultSchedules.value[employeeId]) {
        console.log(`No default schedules for employee ${employeeId}`);
        return;
      }
      
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) {
        console.log(`Employee ${employeeId} not found`);
        return;
      }
      
      const defaultValue = defaultSchedules.value[employeeId][date]?.[type];
      const currentValue = employee.schedules[date]?.[type];
      
      console.log(`${type} change check for ${employeeId} on ${date}:`, {
        defaultValue,
        currentValue,
        changed: defaultValue !== currentValue
      });
    };

    // Check if a project value is the default for this employee/date
    const isDefaultProject = (employeeId: string, date: string, value: number | null): boolean => {
      // Always check against the original default, not saved values
      if (!defaultSchedules.value[employeeId]) return false;
      return defaultSchedules.value[employeeId][date]?.project === value;
    };

    // Check if a shift value is the default for this employee/date
    const isDefaultShift = (employeeId: string, date: string, value: number | null): boolean => {
      // Always check against the original default, not saved values
      if (!defaultSchedules.value[employeeId]) return false;
      return defaultSchedules.value[employeeId][date]?.schedule === value;
    };

    // Check if a field should show as changed (pink background)
    const isFieldChanged = (employeeId: string, date: string, field: 'project' | 'schedule'): boolean => {
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) return false;
      
      const currentValue = employee.schedules[date]?.[field];
      const defaultValue = defaultSchedules.value[employeeId]?.[date]?.[field];
      // Pink background should show when individual value is explicitly set (not default)
      // This means the value is different from default AND not being inherited from team
      
      // Check if there are team schedule assignments for this employee and date
      const hasTeamSchedule = teamSchedules.value[employeeId]?.[date]?.[field] !== null && 
                             teamSchedules.value[employeeId]?.[date]?.[field] !== undefined;
      
      // If there are no team schedule assignments, use standard comparison
      if (!hasTeamSchedule) {
        return currentValue !== defaultValue;
      }
      
      // If there are team schedule assignments, show as changed (red) even if value matches default
      // This indicates an individual override from the team schedule
      return true;
    };

    // Check if using team schedule (blue background)
    const isUsingTeamSchedule = (employeeId: string, date: string, field: 'project' | 'schedule'): boolean => {
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee || !employee.teamId) return false;
      
      // Get the individual value (what's actually stored for this employee)
      const individualValue = employee.schedules[date]?.[field];
      // const defaultValue = defaultSchedules.value[employeeId]?.[date]?.[field];
      
      // Blue background should show when:
      // 1. Individual value equals default (not explicitly set)
      // 2. AND team has a value for this field
      if (individualValue === null) {
        const teamValue = teamSchedules.value[employeeId]?.[date]?.[field];
        return teamValue !== null && teamValue !== undefined;
      }
      
      return false;
    };

    // Get display value for schedule field (considers team schedule)
    const getScheduleDisplayValue = (employeeId: string, date: string, field: 'project' | 'schedule'): number | null => {
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) return null;
      
      const individualValue = employee.schedules[date]?.[field];
      // const defaultValue = defaultSchedules.value[employeeId]?.[date]?.[field];
      // If individual value is default/null and team has a value, use team value


      if (individualValue === null && employee.teamId) {
        const teamValue = teamSchedules.value[employeeId]?.[date]?.[field];


        if (teamValue !== null && teamValue !== undefined) {
          return teamValue;
        }
      }
      
      return individualValue;
    };

    // Computed property to pre-calculate all display data
    const allFieldData = computed(() => {
      const data: Record<string, any> = {};
      
      employees.value.forEach(employee => {
        weekDays.value.forEach(day => {
          ['project', 'schedule'].forEach(field => {
            const key = `${employee.id}_${day.date}_${field}`;
            
            // Get all needed values once
            const individualValue = employee.schedules[day.date]?.[field as 'project' | 'schedule'];
            const defaultValue = defaultSchedules.value[employee.id]?.[day.date]?.[field as 'project' | 'schedule'];
            const teamScheduleValue = teamSchedules.value[employee.id]?.[day.date]?.[field as 'project' | 'schedule'];
            const hasTeamSchedule = teamScheduleValue !== null && teamScheduleValue !== undefined;
            
            // Calculate display value
            let displayValue = individualValue;
            if (individualValue === null && employee.teamId && hasTeamSchedule) {
              displayValue = teamScheduleValue;
            }
            
            // Calculate isChanged
            let isChanged = false;
            if (!hasTeamSchedule) {
              isChanged = individualValue !== defaultValue;
            } else {
              isChanged = true; // Show as changed if team schedule exists
            }
            
            // Calculate isTeamSchedule  
            const isTeamSchedule = individualValue === null && hasTeamSchedule;
            
            // Calculate clearable
            let clearable = false;
            if (displayValue !== null) {
              if (!hasTeamSchedule) {
                clearable = displayValue !== defaultValue;
              } else {
                clearable = displayValue !== teamScheduleValue;
              }
            }
            
            data[key] = {
              displayValue,
              isChanged,
              isTeamSchedule,
              clearable
            };
          });
        });
      });
      
      return data;
    });
    
    // COMBINED FUNCTION: Get all display data for a field in one call
    const getFieldDisplayData = (employeeId: string, date: string, field: 'project' | 'schedule') => {
      // Find employee once
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) {
        return {
          displayValue: null,
          isChanged: false,
          isTeamSchedule: false,
          clearable: false
        };
      }
      
      // Get all needed values once
      const individualValue = employee.schedules[date]?.[field];
      const defaultValue = defaultSchedules.value[employeeId]?.[date]?.[field];
      const teamScheduleValue = teamSchedules.value[employeeId]?.[date]?.[field];
      const hasTeamSchedule = teamScheduleValue !== null && teamScheduleValue !== undefined;
      
      // Calculate display value
      let displayValue = individualValue;
      if (individualValue === null && employee.teamId && hasTeamSchedule) {
        displayValue = teamScheduleValue;
      }
      
      // Calculate isChanged
      let isChanged = false;
      if (!hasTeamSchedule) {
        isChanged = individualValue !== defaultValue;
      } else {
        isChanged = true; // Show as changed if team schedule exists
      }
      
      // Calculate isTeamSchedule  
      const isTeamSchedule = individualValue === null && hasTeamSchedule;
      
      // Calculate clearable
      let clearable = false;
      if (displayValue !== null) {
        if (!hasTeamSchedule) {
          clearable = displayValue !== defaultValue;
        } else {
          clearable = displayValue !== teamScheduleValue;
        }
      }
      
      return {
        displayValue,
        isChanged,
        isTeamSchedule,
        clearable
      };
    };
    
    // Determine if clear button should be shown for a field
    const shouldShowClearable = (employeeId: string, date: string, field: 'project' | 'schedule'): boolean => {
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) return false;
      
      const currentValue = getScheduleDisplayValue(employeeId, date, field);
      const defaultValue = defaultSchedules.value[employeeId]?.[date]?.[field];
      const teamScheduleValue = teamSchedules.value[employeeId]?.[date]?.[field];

      // If current value is null, never show clearable (already cleared)
      if (currentValue === null) {
        return false;
      }

      // If there's no team schedule for this field
      if (teamScheduleValue === null || teamScheduleValue === undefined) {
        // Show clearable only if current value is different from default value
        return currentValue !== defaultValue;
      }
      
      // If there is a team schedule for this field
      // Show clearable only if current value differs from team schedule value
      return currentValue !== teamScheduleValue;
    };

    // Fetch saved assignments from database
    const fetchSavedAssignments = async () => {
      try {
        const params = {
          startDate: weekDays.value[0].date, // Already in MM/DD/YYYY format
          endDate: weekDays.value[6].date,   // Already in MM/DD/YYYY format
          employeeIds: employees.value.map(e => e.id)
        };
        
        const response = await api.get('/hris/employee/individual-schedule-assignments', { params });

        if (response.data) {
          // Clear existing saved schedules
          savedSchedules.value = {};
          
          // Process each assignment
          response.data.forEach((assignment: any) => {
            // Date is already in MM/DD/YYYY format from backend
            const dateStr = assignment.date;
            
            if (!savedSchedules.value[assignment.employeeId]) {
              savedSchedules.value[assignment.employeeId] = {};
            }
            
            savedSchedules.value[assignment.employeeId][dateStr] = {
              project: assignment.projectId,
              schedule: assignment.shiftId
            };
          });

          // Update employee schedules to use saved values where they exist
          employees.value.forEach(employee => {
            
            weekDays.value.forEach(day => {
              const savedSchedule = savedSchedules.value[employee.id]?.[day.date];
              if (savedSchedule) {
                const teamSchedule = teamSchedules.value[employee.id]?.[day.date];
                employee.schedules[day.date] = {
                  project: savedSchedule.project ?? (teamSchedule?.project !== undefined ? null : defaultSchedules.value[employee.id]?.[day.date]?.project),
                  schedule: savedSchedule.schedule ?? (teamSchedule?.schedule !== undefined ? null : defaultSchedules.value[employee.id]?.[day.date]?.schedule)
                };
              }
            });
          });
        }
      } catch (error) {
        console.error('Error fetching saved assignments:', error);
      }
    };

    // Fetch team schedules for employees with teams
    const fetchTeamSchedules = async () => {
      try {
        const params = {
          startDate: weekDays.value[0].date, // Already in MM/DD/YYYY format
          endDate: weekDays.value[6].date,   // Already in MM/DD/YYYY format
          employeeIds: employees.value.map(e => e.id)
        };
        
        const response = await api.get('/hris/employee/individual-schedule-assignments/team-schedules', { params });

        if (response.data) {
          // Clear existing team schedules
          teamSchedules.value = {};
          
          // Process each team schedule assignment
          response.data.forEach((assignment: any) => {
            const employeeId = assignment.employeeId;
            const dateStr = assignment.date;
            
            if (!teamSchedules.value[employeeId]) {
              teamSchedules.value[employeeId] = {};
            }
            
            teamSchedules.value[employeeId][dateStr] = {
              project: assignment.projectId,
              schedule: assignment.shiftId
            };
          });
          
          // Set employee schedules to null where team schedule exists but no individual assignment
          employees.value.forEach(employee => {
            weekDays.value.forEach(day => {
              const teamSchedule = teamSchedules.value[employee.id]?.[day.date];
              const savedIndividual = savedSchedules.value[employee.id]?.[day.date];
              
              if (teamSchedule) {
                // Ensure the schedule object exists with both properties
                if (!employee.schedules[day.date]) {
                  employee.schedules[day.date] = {
                    project: defaultSchedules.value[employee.id]?.[day.date]?.project ?? null,
                    schedule: defaultSchedules.value[employee.id]?.[day.date]?.schedule ?? null
                  };
                }
                
                // Check each field independently
                // Set project to null if team has project but no individual project saved
                if (teamSchedule.project !== null && teamSchedule.project !== undefined && 
                    (!savedIndividual || savedIndividual.project === null || savedIndividual.project === undefined)) {
                  employee.schedules[day.date].project = null;
                }
                
                // Set schedule to null if team has schedule but no individual schedule saved
                if (teamSchedule.schedule !== null && teamSchedule.schedule !== undefined && 
                    (!savedIndividual || savedIndividual.schedule === null || savedIndividual.schedule === undefined)) {
                  employee.schedules[day.date].schedule = null;
                }
              }
            });
          });
        }
      } catch (error) {
        console.error('Error fetching team schedules:', error);
        // Fail silently - team schedules are optional enhancement
      }
    };

    // Save changes tracking
    const changedSchedules = ref<Record<string, any>>({});
    const savingFields = ref<Record<string, boolean>>({});


    // Track changes when schedule values change
    const trackChange = (employeeId: string, date: string, field: 'project' | 'schedule') => {
      const key = `${employeeId}_${date}`;
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) return;
      let currentValue = employee.schedules[date][field];
      
      // If current value is null and no team schedule exists for this field, use default value
      const teamScheduleValue = teamSchedules.value[employeeId]?.[date]?.[field];
      if (currentValue === null && (teamScheduleValue === null || teamScheduleValue === undefined)) {
        currentValue = defaultSchedules.value[employeeId]?.[date]?.[field];
        // Update the actual value to default
        employee.schedules[date][field] = currentValue;
      }

      // Compare against saved value if exists, otherwise use default
      const savedValue = savedSchedules.value[employeeId]?.[date]?.[field];
      const compareValue = savedValue !== undefined ? savedValue : defaultSchedules.value[employeeId]?.[date]?.[field];

      if (currentValue === compareValue) {
        // Remove from changed if it's back to saved/default
        if (changedSchedules.value[key]) {
          delete changedSchedules.value[key][field];
          // Check if any actual field changes remain (exclude metadata fields)
          const remainingFields = Object.keys(changedSchedules.value[key])
            .filter(k => k !== 'employeeId' && k !== 'date');
          if (remainingFields.length === 0) {
            delete changedSchedules.value[key];
          }
        }
      } else {
        // Add to changed
        if (!changedSchedules.value[key]) {
          changedSchedules.value[key] = { employeeId, date };
        }
        changedSchedules.value[key][field] = currentValue;
      }
      
      // Auto-save the change
      autoSaveChange(employeeId, date, field);
    };

    // Auto-save a single change
    const autoSaveChange = async (employeeId: string, date: string, field: 'project' | 'schedule') => {
      const employee = employees.value.find(e => e.id === employeeId);
      if (!employee) return;
      
      const currentValue = employee.schedules[date][field];
      const savedValue = savedSchedules.value[employeeId]?.[date]?.[field];
      // console.log(assignment,projectDefault,shiftDefault);

      // Don't save if value hasn't changed from saved value
      if (savedValue !== undefined && currentValue === savedValue) return;
      
      // Set loading state for this specific field
      const fieldKey = `${employeeId}_${date}_${field}`;
      savingFields.value[fieldKey] = true;
      
      // let shiftDefault = defaultSchedules.value[employeeId]?.[date]?.['schedule'];
      // let projectDefault = defaultSchedules.value[employeeId]?.[date]?.['project'];


      try {
        // Prepare single assignment - only include the field that changed
        let assignment: any = {
          employeeId,
          date: date, // Already in MM/DD/YYYY format
        };
        
        if (field === 'project') {
          assignment.projectId = employee.schedules[date].project;
        } else {
          assignment.shiftId = employee.schedules[date].schedule;
        }
        
        const response = await api.post('/hris/employee/individual-schedule-assignments/bulk', {
          assignments: [assignment]
        });
        
        if (response.data) {
          // Update saved schedules to reflect the new saved state
          if (!savedSchedules.value[employeeId]) {
            savedSchedules.value[employeeId] = {};
          }
          savedSchedules.value[employeeId][date] = {
            project: employee.schedules[date].project,
            schedule: employee.schedules[date].schedule
          };
          
          // Show success notification with employee name and date
          const fieldLabel = field === 'project' ? 'Project' : 'Schedule';
          $q.notify({
            type: 'positive',
            message: `${fieldLabel} updated for ${employee.name} on ${date}`,
            position: 'top',
            timeout: 2000,
            progress: true,
            classes: 'q-notify-small'
          });
        }
      } catch (error: any) {
        console.error('Error auto-saving schedule:', error);
        handleAxiosError($q, error);
        
        // Revert the change on error
        if (savedValue !== undefined) {
          employee.schedules[date][field] = savedValue;
        } else {
          employee.schedules[date][field] = defaultSchedules.value[employeeId]?.[date]?.[field];
        }
      } finally {
        // Clear loading state
        delete savingFields.value[fieldKey];
      }
    };

    // No longer need deep watch since we track changes directly on select updates


    // Initialize data on component mount
    onMounted(async () => {
      await Promise.all([
        fetchEmployees(),
        fetchProjects(),
        fetchShifts()
      ]);
    });

    return {
      searchTeam,
      weekDays,
      employees,
      projectOptions,
      shiftOptions,
      loading,
      weekChangeLoading,
      formatWeekRange,
      previousWeek,
      nextWeek,
      fetchEmployees,
      pagination,
      currentPage,
      perPage,
      onPageChange,
      projectsLoading,
      fetchProjects,
      shiftsLoading,
      fetchShifts,
      defaultSchedules,
      savedSchedules,
      debugScheduleChange,
      isDefaultProject,
      isDefaultShift,
      isFieldChanged,
      isUsingTeamSchedule,
      savingFields,
      trackChange,
      teamSchedules,
      fetchTeamSchedules,
      getScheduleDisplayValue,
      shouldShowClearable,
      getFieldDisplayData, // Combined function for better performance
      allFieldData, // Pre-calculated display data
    };
  },
};
</script>

<style scoped>
.scheduling-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow-x: auto;
  position: relative;
}

.schedule-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
  min-width: 100%;
}

.schedule-grid {
  display: grid;
  grid-template-columns: 150px repeat(7, minmax(150px, 1fr));
  gap: 1px;
  background-color: #e0e0e0;
  min-width: fit-content;
}

.header-cell {
  background: #f5f5f5;
  padding: 12px 8px;
  text-align: center;
  font-weight: 500;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.corner-cell {
  background: #fafafa;
  position: sticky;
  left: 0;
  z-index: 11;
}

.day-header {
  background: #f8f9fa;
}

.employee-cell {
  background: white;
  padding: 16px 12px;
  display: flex;
  align-items: center;
  border-right: 1px solid #e0e0e0;
  font-weight: 500;
  position: sticky;
  left: 0;
  z-index: 9;
}

.schedule-cell {
  background: white;
  padding: 8px;
  min-height: 100px;
  display: flex;
  align-items: flex-start;
}

.schedule-dropdowns {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Changed value indicator - simple approach */
.changed-value {
  /* Light pink background to show changed state */
  background-color: #fee !important;
  /* padding: 2px; */
}

/* Team schedule value indicator - blue background */
.team-schedule-value {
  /* Light blue background to show value from team schedule */
  background-color: #e3f2fd !important;
  border-radius: 4px;
}

/* Loading overlay for week changes */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
}

/* Slightly dim content when loading */
.loading-content {
  opacity: 0.5;
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .schedule-grid {
    grid-template-columns: 120px repeat(7, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  .schedule-grid {
    grid-template-columns: 100px repeat(7, minmax(100px, 1fr));
  }
  
  .schedule-dropdowns .q-field {
    font-size: 12px;
  }
}

</style>