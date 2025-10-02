import { computed, Ref } from 'vue';
import { useSupabaseTable, FilterConfig, OrderConfig } from './useSupabaseTable';
import supabaseService from '../../services/supabase';
import { useAuthStore } from '../../stores/auth';

// Simple date formatting helper
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

export type TabType = 'active' | 'inactive' | 'separated' | 'not_yet';

export interface EmployeeData {
  id?: string;
  accountId: string;
  employeeCode: string;
  isActive: boolean;
  payrollGroupId: number;
  activeContractId: number;
  scheduleId: number;
  branchId: number;
  bankAccountNumber?: string;
  bankName?: string;
  biometricsNumber?: string;
  hdmfNumber?: string;
  phicNumber?: string;
  sssNumber?: string;
  tinNumber?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  account?: any;
  activeContract?: any;
  branch?: any;
  payrollGroup?: any;
  schedule?: any;
}

export interface AccountData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber?: string;
  image?: string;
  roleId: string;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  role?: any;
}

// Transform raw database data to match existing UI format
function transformEmployeeData(raw: any): any {
  try {
    if (!raw) return null;

    // For EmployeeData records
    if (raw.accountId && raw.employeeCode !== undefined) {
      const account = raw.account || {};
      const contract = raw.activeContract || {};
      const branch = raw.branch || {};
      
      // Safe date formatting with error handling
      const safeFormatDate = (date: any) => {
        try {
          return formatDate(date);
        } catch {
          return '';
        }
      };
      
      const safeDateTimeFormat = (date: any) => {
        try {
          return date ? new Date(date).toLocaleString() : '';
        } catch {
          return '';
        }
      };
      
      return {
        id: raw.id,
        accountId: raw.accountId,
        employeeCode: raw.employeeCode || '',
        isActive: raw.isActive !== undefined ? raw.isActive : true,
        createdAt: {
          dateFull: safeFormatDate(raw.createdAt),
          dateTime: safeDateTimeFormat(raw.createdAt),
        },
        updatedAt: {
          dateFull: safeFormatDate(raw.updatedAt),
          dateTime: safeDateTimeFormat(raw.updatedAt),
        },
        // Nested account details for table display with comprehensive null checks
        accountDetails: {
          id: account.id || raw.accountId,
          firstName: account.firstName || '',
          lastName: account.lastName || '',
          middleName: account.middleName || '',
          email: account.email || '',
          username: account.username || '',
          image: account.image || '/images/person01.webp',
          createdAt: {
            dateFull: safeFormatDate(account.createdAt || raw.createdAt),
            dateTime: safeDateTimeFormat(account.createdAt || raw.createdAt),
          },
          role: account.role ? {
            id: account.role.id,
            name: account.role.name || '',
            roleGroup: account.role.roleGroup || account.role.RoleGroup || {
              id: null,
              name: ''
            }
          } : {
            id: null,
            name: '',
            roleGroup: { id: null, name: '' }
          }
        },
        // Contract details with safe handling
        contractDetails: contract.id ? {
          id: contract.id,
          startDate: {
            dateFull: safeFormatDate(contract.startDate),
            date: contract.startDate || null
          },
          endDate: contract.endDate ? {
            dateFull: safeFormatDate(contract.endDate),
            date: contract.endDate
          } : null,
          employmentStatus: {
            key: contract.employmentStatus || '',
            label: getEmploymentStatusLabel(contract.employmentStatus || '')
          },
          monthlyRate: contract.monthlyRate || 0
        } : {
          id: null,
          startDate: { dateFull: '', date: null },
          endDate: null,
          employmentStatus: { key: '', label: '' },
          monthlyRate: 0
        },
      // Branch details
      branch: branch.id ? {
        id: branch.id,
        name: branch.name
      } : {},
      // Payroll group - map payrollGroupCode to name for UI compatibility
      payrollGroup: raw.payrollGroup ? {
        id: raw.payrollGroup.id,
        name: raw.payrollGroup.payrollGroupCode || '',  // Map code to name field
        payrollGroupCode: raw.payrollGroup.payrollGroupCode || ''
      } : {},
      // Schedule - map scheduleCode to name for UI compatibility
      schedule: raw.schedule ? {
        id: raw.schedule.id,
        name: raw.schedule.scheduleCode || '',  // Map code to name field
        scheduleCode: raw.schedule.scheduleCode || ''
      } : {}
    };
    } 
    // For Account records (not yet setup) - now coming from accounts_without_employee_data view
    else {
      const safeFormatDate = (date: any) => {
        try {
          return formatDate(date);
        } catch {
          return '';
        }
      };
      
      const safeDateTimeFormat = (date: any) => {
        try {
          return date ? new Date(date).toLocaleString() : '';
        } catch {
          return '';
        }
      };
      
      return {
        id: raw.id,
        username: raw.username || '',
        email: raw.email || '',
        firstName: raw.firstName || '',
        lastName: raw.lastName || '',
        middleName: raw.middleName || '',
        contactNumber: raw.contactNumber || '',
        image: raw.image || '/images/person01.webp',
        createdAt: {
          dateFull: safeFormatDate(raw.createdAt),
          dateTime: safeDateTimeFormat(raw.createdAt),
        },
        // Role information from the view (flattened)
        role: {
          id: raw.role_id || null,
          name: raw.role_name || '',
          roleGroup: {
            id: raw.rolegroup_id || null,
            name: raw.rolegroup_name || ''
          }
        }
      };
    }
  } catch (error) {
    console.error('Error transforming employee data:', error, raw);
    // Return a safe default object
    return {
      id: raw?.id || null,
      accountId: raw?.accountId || null,
      employeeCode: raw?.employeeCode || '',
      isActive: false,
      accountDetails: {
        firstName: '',
        lastName: '',
        middleName: ''
      }
    };
  }
}

// Get employment status label
function getEmploymentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    REGULAR: 'Regular',
    PROBATIONARY: 'Probationary',
    CONTRACTUAL: 'Contractual',
    TRAINEE: 'Trainee',
    RESIGNED: 'Resigned',
    TERMINATED: 'Terminated',
    ENDO: 'End of Contract'
  };
  return statusMap[status] || status;
}

export function useHRISEmployees(tab: TabType, searchConfig?: { column?: string; value?: Ref<string> | string }) {
  const authStore = useAuthStore();
  const companyId = computed(() => authStore.accountInformation?.companyId || authStore.accountInformation?.company?.id);
  
  // Determine if we need client-side search for name fields
  const useClientSearch = computed(() => {
    const col = typeof searchConfig?.column === 'object' ? searchConfig.column.value : searchConfig?.column;
    return col && (col.includes('firstName') || col.includes('lastName') || col.includes('name') || col === 'fullName');
  });

  // Build the select query based on tab type
  const getSelectQuery = () => {
    if (tab === 'not_yet') {
      // For not yet setup, use the accounts_without_employee_data view
      return {
        table: 'accounts_without_employee_data',
        select: '*',  // View already includes all necessary joins and data
        filters: [
          // Company filter - only add if companyId exists
          ...(companyId.value ? [{ column: 'companyId', operator: 'eq' as const, value: companyId.value }] : [])
        ] as FilterConfig[]
      };
    }

    // For employee tabs, query EmployeeData
    const baseSelect = `
      *,
      account:Account!inner (
        id,
        firstName,
        lastName,
        middleName,
        email,
        username,
        image,
        createdAt,
        role:Role (
          id,
          name,
          roleGroup:RoleGroup (
            id,
            name
          )
        )
      ),
      activeContract:EmployeeContract (
        id,
        startDate,
        endDate,
        employmentStatus,
        monthlyRate
      ),
      branch:Project (
        id,
        name
      ),
      payrollGroup:PayrollGroup (
        id,
        payrollGroupCode
      ),
      schedule:Schedule (
        id,
        scheduleCode
      )
    `;

    const filters: FilterConfig[] = [];

    // Add tab-specific filters
    switch (tab) {
      case 'active':
        filters.push({ column: 'isActive', operator: 'eq', value: true });
        break;
      case 'inactive':
        filters.push({ column: 'isActive', operator: 'eq', value: false });
        break;
      case 'separated':
        // Separated employees have an end date on their contract
        filters.push({ column: 'activeContract.endDate', operator: 'not', value: null });
        break;
    }

    // Add company filter via account relation - only if companyId exists
    if (companyId.value) {
      filters.push({ column: 'account.companyId', operator: 'eq', value: companyId.value });
    }

    return {
      table: 'EmployeeData',
      select: baseSelect,
      filters
    };
  };

  // Get query configuration for the current tab
  const queryConfig = getSelectQuery();

  // Handle search column mapping
  const searchColumn = computed(() => {
    const column = typeof searchConfig?.column === 'object' ? searchConfig.column.value : searchConfig?.column;
    
    if (!column) return undefined;
    
    // If it's a name search, we'll handle it client-side
    if (useClientSearch.value) {
      return undefined; // No database-level search for name fields
    }
    
    // For direct column searches
    if (column === 'id') {
      return 'employeeCode';
    }
    
    // Only return column if it's a direct column (not nested)
    if (column && !column.includes('.')) {
      return column;
    }
    
    return undefined;
  });

  // Use the base composable with specific configuration
  const tableComposable = useSupabaseTable({
    table: queryConfig.table,
    select: queryConfig.select,
    filters: queryConfig.filters,
    orderBy: { 
      column: tab === 'not_yet' ? 'firstName' : 'createdAt', 
      ascending: tab === 'not_yet' 
    } as OrderConfig,
    pageSize: useClientSearch.value ? 100 : 10, // Fetch more for client-side search
    searchColumn: searchColumn as any,  // Use the computed search column
    searchValue: useClientSearch.value ? undefined : searchConfig?.value, // Don't use server search for names
    useCursor: false, // Use offset pagination for now
    autoFetch: false // Disable auto-fetch to prevent double loading
  });

  // Transform and filter the data for UI consumption
  const transformedData = computed(() => {
    let data = tableComposable.data.value.map(transformEmployeeData);
    
    // Apply client-side filtering for name searches only (no more client-side filtering for not_yet tab)
    if (useClientSearch.value && searchConfig?.value) {
      const searchTerm = (typeof searchConfig.value === 'object' ? searchConfig.value.value : searchConfig.value)?.toLowerCase() || '';
      
      if (searchTerm) {
        data = data.filter(item => {
          if (tab === 'not_yet') {
            // For not_yet tab, search in direct fields from the view
            return (
              item.firstName?.toLowerCase().includes(searchTerm) ||
              item.lastName?.toLowerCase().includes(searchTerm) ||
              item.middleName?.toLowerCase().includes(searchTerm) ||
              item.email?.toLowerCase().includes(searchTerm) ||
              item.username?.toLowerCase().includes(searchTerm)
            );
          } else {
            // For employee tabs, search in both employeeCode and account details
            return (
              item.employeeCode?.toLowerCase().includes(searchTerm) ||
              item.accountDetails?.firstName?.toLowerCase().includes(searchTerm) ||
              item.accountDetails?.lastName?.toLowerCase().includes(searchTerm) ||
              item.accountDetails?.middleName?.toLowerCase().includes(searchTerm) ||
              item.accountDetails?.email?.toLowerCase().includes(searchTerm) ||
              item.accountDetails?.username?.toLowerCase().includes(searchTerm)
            );
          }
        });
      }
    }
    
    return data;
  });


  return {
    ...tableComposable,
    data: transformedData,
    // Additional HRIS-specific methods
    exportToExcel: async () => {
      // Implementation for exporting to Excel
      console.log('Export to Excel not yet implemented');
    },
    
    updateEmployee: async (accountId: string, updates: Partial<EmployeeData>) => {
      try {
        const client = supabaseService.getClient();
        if (!client) throw new Error('Supabase client not initialized');

        const { error } = await client
          .from('EmployeeData')
          .update(updates)
          .eq('accountId', accountId);

        if (error) throw error;
        
        await tableComposable.refetch();
        return true;
      } catch (error) {
        console.error('Error updating employee:', error);
        return false;
      }
    },

    deleteEmployee: async (accountId: string) => {
      try {
        const client = supabaseService.getClient();
        if (!client) throw new Error('Supabase client not initialized');

        // Soft delete by setting isActive to false
        const { error } = await client
          .from('EmployeeData')
          .update({ isActive: false })
          .eq('accountId', accountId);

        if (error) throw error;
        
        await tableComposable.refetch();
        return true;
      } catch (error) {
        console.error('Error deleting employee:', error);
        return false;
      }
    },

    restoreEmployee: async (accountId: string) => {
      try {
        const client = supabaseService.getClient();
        if (!client) throw new Error('Supabase client not initialized');

        const { error } = await client
          .from('EmployeeData')
          .update({ isActive: true })
          .eq('accountId', accountId);

        if (error) throw error;
        
        await tableComposable.refetch();
        return true;
      } catch (error) {
        console.error('Error restoring employee:', error);
        return false;
      }
    }
  };
}