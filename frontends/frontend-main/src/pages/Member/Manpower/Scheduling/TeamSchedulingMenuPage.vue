<template>
  <expanded-nav-page-container>
    <div class="scheduling-wrapper">
      <div class="page-head q-pb-md row items-center justify-between">
        <div>
          <div class="text-title-large">Team Schedule</div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower_dashboard' }" />
            <q-breadcrumbs-el label="Scheduling" />
            <q-breadcrumbs-el label="Team Scheduling" />
          </q-breadcrumbs>
        </div>
        <q-btn
            label="Create Schedule"
            color="primary"
            icon="add"
            no-caps
            rounded
            unelevated
            @click="showCreateDialog = true"
          />
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
          />
        </div>
        
        <div class="row items-center q-gutter-sm">
          
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
      <div class="schedule-container q-pa-md">
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner-dots size="40px" color="primary" />
          <div class="text-body1 q-mt-md">Loading teams...</div>
        </div>

        <!-- Schedule Grid -->
        <div v-else-if="filteredTeams.length > 0" class="schedule-grid">
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

          <!-- Team Rows -->
          <template v-for="team in filteredTeams" :key="team.id">
            <!-- Team Name Cell -->
            <div class="team-cell">
              <span class="text-weight-medium">{{ team.name }}</span>
            </div>
            
            <!-- Schedule Cells for each day -->
            <div 
              v-for="day in weekDays" 
              :key="`${team.id}-${day.date}`"
              class="schedule-cell"
            >
              <div class="schedule-dropdowns">
                <!-- Project Dropdown -->
                <div class="q-mb-xs" :class="{ 'changed-value': isFieldChanged(team.id, day.date, 'project') }">
                  <q-select
                    v-model="team.schedules[day.date].project"
                    :options="projectOptions"
                    option-label="label"
                    option-value="value"
                    emit-value
                    map-options
                    outlined
                    dense
                    :clearable="team.schedules[day.date].project !== null"
                    :disable="savingFields[`${team.id}-${day.date}`]"
                    :loading="savingFields[`${team.id}-${day.date}`]"
                    style="min-width: 120px;"
                    @update:model-value="(val) => trackChange(team.id, day.date, 'project', val)"
                  />
                </div>
                
                <!-- Schedule Type Dropdown -->
                <div :class="{ 'changed-value': isFieldChanged(team.id, day.date, 'schedule') }">
                  <q-select
                    v-model="team.schedules[day.date].schedule"
                    :options="shiftOptions"
                    option-label="label"
                    option-value="value"
                    emit-value
                    map-options
                    outlined
                    dense
                    :clearable="team.schedules[day.date].schedule !== null"
                    :disable="savingFields[`${team.id}-${day.date}`]"
                    :loading="savingFields[`${team.id}-${day.date}`]"
                    style="min-width: 120px;"
                    @update:model-value="(val) => trackChange(team.id, day.date, 'schedule', val)"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center q-pa-xl">
          <q-icon name="groups" size="4em" color="grey-4" />
          <div class="text-h6 text-grey-5 q-mt-md">No teams found</div>
        </div>
      </div>
    </div>
    
    <!-- Create Team Schedule Dialog -->
    <CreateTeamScheduleDialog
      v-model="showCreateDialog"
      :teams="teamOptionsForDialog"
      :projects="projectOptions"
      :shifts="shiftOptions"
      @saved="handleScheduleCreated"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';
import CreateTeamScheduleDialog from '../dialogs/CreateTeamScheduleDialog.vue';

interface DaySchedule {
  project: number | null;
  schedule: number | null;
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
  schedules: Record<string, DaySchedule>;
}

interface WeekDay {
  name: string;
  date: string;
  fullDate: Date;
}

interface ProjectOption {
  label: string;
  value: number | null;
}

interface ScheduleOption {
  label: string;
  value: number | null;
}

export default defineComponent({
  name: 'TeamSchedulingMenuPage',
  components: {
    ExpandedNavPageContainer,
    CreateTeamScheduleDialog,
  },
  setup() {
    const $q = useQuasar();
    const searchTeam = ref('');
    const loading = ref(false);
    const projectsLoading = ref(false);
    const shiftsLoading = ref(false);
    const showCreateDialog = ref(false);
    
    // Get the start of the current week (Monday)
    const getStartOfWeek = (date: Date = new Date()): Date => {
      const d = new Date(date);
      const day = d.getDay();
      // Convert Sunday (0) to 7 for easier calculation
      const dayOfWeek = day === 0 ? 7 : day;
      // Subtract days to get to Monday (1)
      d.setDate(d.getDate() - (dayOfWeek - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    };
    
    const currentWeekStart = ref(getStartOfWeek());

    // Project options - start with just Default
    const projectOptions = ref<ProjectOption[]>([
      { label: 'Default', value: null },
    ]);

    // Shift options - start with just Default
    const shiftOptions = ref<ScheduleOption[]>([
      { label: 'Default', value: null },
    ]);

    // Helper function to format date
    const formatDate = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    // Generate week days
    const weekDays = computed((): WeekDay[] => {
      const days: WeekDay[] = [];
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      const startDate = new Date(currentWeekStart.value);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        days.push({
          name: dayNames[i],
          date: formatDate(date),
          fullDate: date
        });
      }
      
      return days;
    });

    // Initialize schedule data for a team
    const initializeScheduleData = (): Record<string, DaySchedule> => {
      const schedules: Record<string, DaySchedule> = {};
      
      weekDays.value.forEach(day => {
        schedules[day.date] = {
          project: null,
          schedule: null
        };
      });
      
      return schedules;
    };

    // Teams data - empty initially
    const teams = ref<Team[]>([]);
    
    // Store default schedule values to track changes
    const defaultSchedules = ref<Record<string, Record<string, DaySchedule>>>({});
    
    // Store saved schedule values from database
    const savedSchedules = ref<Record<string, Record<string, DaySchedule>>>({});
    
    // Track which fields are currently being saved
    const savingFields = ref<Record<string, boolean>>({});

    // Filter teams based on search
    const filteredTeams = computed(() => {
      if (!searchTeam.value) return teams.value;
      
      const search = searchTeam.value.toLowerCase();
      return teams.value.filter(team => 
        team.name.toLowerCase().includes(search)
      );
    });
    
    // Team options for dialog
    const teamOptionsForDialog = computed(() => {
      return teams.value.map(team => ({
        label: team.name,
        value: parseInt(team.id)
      }));
    });

    const formatWeekRange = (): string => {
      const start = new Date(currentWeekStart.value);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
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
      
      // Re-initialize team schedules for new week if teams exist
      if (teams.value.length > 0) {
        teams.value.forEach((team: Team) => {
          team.schedules = initializeScheduleData();
        });
        
        // Reset default schedules for change tracking
        defaultSchedules.value = {};
        teams.value.forEach((team: Team) => {
          defaultSchedules.value[team.id] = JSON.parse(JSON.stringify(team.schedules));
        });
        
        // Re-fetch saved schedules for new week
        fetchSavedSchedules();
      }
    };

    const nextWeek = (): void => {
      const newDate = new Date(currentWeekStart.value);
      newDate.setDate(newDate.getDate() + 7);
      currentWeekStart.value = newDate;
      
      // Re-initialize team schedules for new week if teams exist
      if (teams.value.length > 0) {
        teams.value.forEach((team: Team) => {
          team.schedules = initializeScheduleData();
        });
        
        // Reset default schedules for change tracking
        defaultSchedules.value = {};
        teams.value.forEach((team: Team) => {
          defaultSchedules.value[team.id] = JSON.parse(JSON.stringify(team.schedules));
        });
        
        // Re-fetch saved schedules for new week
        fetchSavedSchedules();
      }
    };

    // API methods
    const fetchTeams = async (): Promise<void> => {
      try {
        loading.value = true;
        const response = await api.get('/hr/team/all');
        
        if (response.data) {
          // Initialize teams with empty schedules for current week
          teams.value = response.data.map((team: any) => ({
            id: team.id.toString(),
            name: team.name,
            memberCount: team.memberCount || 0,
            schedules: initializeScheduleData()
          }));
          
          // Store default schedules for change tracking
          defaultSchedules.value = {};
          teams.value.forEach((team: Team) => {
            defaultSchedules.value[team.id] = JSON.parse(JSON.stringify(team.schedules));
          });
          
          // Fetch saved schedules from database
          await fetchSavedSchedules();
        }
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        handleAxiosError($q, error);
        teams.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchProjects = async (): Promise<void> => {
      try {
        projectsLoading.value = true;
        const response = await api.get('/select-box/scheduling-project-list');
        
        if (response.data && response.data.list) {
          // Add Default option at the beginning
          projectOptions.value = [
            { label: 'Default', value: null },
            ...response.data.list
          ];
        }
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        handleAxiosError($q, error);
        projectOptions.value = [{ label: 'Default', value: null }];
      } finally {
        projectsLoading.value = false;
      }
    };

    const fetchShifts = async (): Promise<void> => {
      try {
        shiftsLoading.value = true;
        const response = await api.get('/hris/employee/scheduling-shifts');
        
        if (response.data) {
          // Add Default option at the beginning
          shiftOptions.value = [
            { label: 'Default', value: null },
            ...response.data
          ];
        }
      } catch (error: any) {
        console.error('Error fetching shifts:', error);
        handleAxiosError($q, error);
        shiftOptions.value = [{ label: 'Default', value: null }];
      } finally {
        shiftsLoading.value = false;
      }
    };

    // Fetch saved schedules from database
    const fetchSavedSchedules = async (): Promise<void> => {
      try {
        // Skip if no teams
        if (teams.value.length === 0) return;
        
        // Get team IDs
        const teamIds = teams.value.map(t => t.id).join(',');
        if (!teamIds) return;
        
        // Get date range for current week
        const startDate = formatDateForAPI(weekDays.value[0].fullDate);
        const endDate = formatDateForAPI(weekDays.value[6].fullDate);
        
        const response = await api.get('/hr/team/schedule-assignments', {
          params: {
            startDate,
            endDate,
            teamIds
          }
        });
        
        if (response.data) {
          // Clear saved schedules first
          savedSchedules.value = {};
          
          // Process saved assignments
          response.data.forEach((assignment: any) => {
            const teamId = assignment.teamId.toString();
            const date = formatDate(new Date(assignment.date));
            
            if (!savedSchedules.value[teamId]) {
              savedSchedules.value[teamId] = {};
            }
            
            if (!savedSchedules.value[teamId][date]) {
              savedSchedules.value[teamId][date] = {
                project: null,
                schedule: null
              };
            }
            
            savedSchedules.value[teamId][date] = {
              project: assignment.projectId,
              schedule: assignment.shiftId
            };
            
            // Update team schedules with saved data
            const team = teams.value.find(t => t.id === teamId);
            if (team && team.schedules[date]) {
              team.schedules[date].project = assignment.projectId;
              team.schedules[date].schedule = assignment.shiftId;
            }
          });
        }
      } catch (error: any) {
        console.error('Error fetching saved schedules:', error);
        handleAxiosError($q, error);
      }
    };
    
    // Helper function to format date for API (YYYY-MM-DD)
    const formatDateForAPI = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Check if a field has changed from default
    const isFieldChanged = (teamId: string, date: string, field: 'project' | 'schedule'): boolean => {
      const team = teams.value.find(t => t.id === teamId);
      if (!team) return false;
      
      const currentValue = team.schedules[date]?.[field];
      const defaultValue = defaultSchedules.value[teamId]?.[date]?.[field];
      
      // Simply check if current value differs from default
      // Pink background should show whenever the current value is not the default
      return currentValue !== defaultValue;
    };
    
    // Track when a field value changes
    const trackChange = (teamId: string, date: string, field: 'project' | 'schedule', value: number | null): void => {
      const team = teams.value.find(t => t.id === teamId);
      if (!team) return;
      
      // Update the value
      if (field === 'project') {
        team.schedules[date].project = value;
      } else {
        team.schedules[date].schedule = value;
      }
      
      // Auto-save the change
      autoSaveChange(teamId, date);
    };
    
    // Auto-save changes to database
    const autoSaveChange = async (teamId: string, date: string): Promise<void> => {
      const team = teams.value.find(t => t.id === teamId);
      if (!team) return;
      
      const fieldKey = `${teamId}-${date}`;
      
      // Prevent multiple saves for the same field
      if (savingFields.value[fieldKey]) return;
      
      try {
        savingFields.value[fieldKey] = true;
        
        const schedule = team.schedules[date];
        
        // Format date for API - parse MM/DD/YYYY to YYYY-MM-DD
        const [month, day, year] = date.split('/');
        const apiDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const payload = {
          assignments: [{
            teamId: parseInt(teamId),
            date: apiDate,
            projectId: schedule.project,
            shiftId: schedule.schedule
          }]
        };
        
        await api.post('/hr/team/schedule-assignments/bulk', payload);
        
        // Update saved schedules
        if (!savedSchedules.value[teamId]) {
          savedSchedules.value[teamId] = {};
        }
        savedSchedules.value[teamId][date] = {
          project: schedule.project,
          schedule: schedule.schedule
        };
        
        $q.notify({
          type: 'positive',
          message: 'Schedule saved',
          timeout: 1000,
          position: 'top-right'
        });
      } catch (error: any) {
        console.error('Error saving schedule:', error);
        handleAxiosError($q, error);
        
        // Revert the change on error
        const savedValue = savedSchedules.value[teamId]?.[date];
        if (savedValue) {
          team.schedules[date] = { ...savedValue };
        } else {
          team.schedules[date] = { project: null, schedule: null };
        }
      } finally {
        savingFields.value[fieldKey] = false;
      }
    };

    // Handle schedule created from dialog
    const handleScheduleCreated = () => {
      // Refresh saved schedules to show the new data
      fetchSavedSchedules();
    };
    
    // Initialize data on component mount
    onMounted(async () => {
      await Promise.all([
        fetchTeams(),
        fetchProjects(),
        fetchShifts()
      ]);
    });

    return {
      searchTeam,
      loading,
      showCreateDialog,
      projectsLoading,
      shiftsLoading,
      weekDays,
      teams,
      filteredTeams,
      projectOptions,
      shiftOptions,
      formatWeekRange,
      previousWeek,
      nextWeek,
      fetchTeams,
      fetchProjects,
      fetchShifts,
      isFieldChanged,
      defaultSchedules,
      savedSchedules,
      savingFields,
      trackChange,
      autoSaveChange,
      fetchSavedSchedules,
      teamOptionsForDialog,
      handleScheduleCreated,
    };
  },
});
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
  grid-template-columns: 200px repeat(7, minmax(150px, 1fr));
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

.team-cell {
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

.page-head {
  .title {
    font-weight: 500;
    margin-bottom: 4px;
  }
}

/* Changed value indicator - pink background */
.changed-value {
  background-color: #fee !important;
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .schedule-grid {
    grid-template-columns: 150px repeat(7, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  .schedule-grid {
    grid-template-columns: 120px repeat(7, minmax(100px, 1fr));
  }
  
  .schedule-dropdowns .q-field {
    font-size: 12px;
  }
}
</style>