import { ref, computed } from 'vue';
import supabaseService from '../../services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface Employee {
  accountId: string;
  payrollGroupId: number;
  activeContractId: number;
  scheduleId: number;
  branchId: number;
  employeeCode: string;
  isActive: boolean;
  bankAccountNumber: string | null;
  bankName: string | null;
  biometricsNumber: string | null;
  hdmfNumber: string | null;
  phicNumber: string | null;
  sssNumber: string | null;
  tinNumber: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  account?: any;
  activeContract?: any;
  branch?: any;
  payrollGroup?: any;
  schedule?: any;
}

export interface EmployeeOption {
  label: string;
  value: string;
  employeeCode: string;
  data?: Employee;
}

export function useSupabaseEmployees() {
  const supabase = supabaseService.getClient();
  
  const employees = ref<Employee[]>([]);
  const loading = ref(false);
  const error = ref<PostgrestError | null>(null);
  
  // Convert employees to dropdown options
  const employeeOptions = computed<EmployeeOption[]>(() => {
    return employees.value.map(employee => ({
      label: employee.employeeCode,
      value: employee.accountId,
      employeeCode: employee.employeeCode,
      data: employee
    }));
  });
  
  // Fetch all employees with related data
  const fetchEmployees = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('EmployeeData')
        .select(`
          *,
          account:Account(
            id,
            firstName,
            lastName,
            middleName,
            email,
            contactNumber,
            username,
            roleID,
            companyId
          ),
          activeContract:EmployeeContract(
            id,
            startDate,
            endDate,
            employmentStatus,
            monthlyRate,
            isActive
          ),
          branch:Project(
            id,
            name
          ),
          payrollGroup:PayrollGroup(
            id,
            payrollGroupCode
          ),
          schedule:Schedule(
            id,
            scheduleCode
          )
        `)
        .eq('isActive', true)
        .order('employeeCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching employees:', fetchError);
        error.value = fetchError;
        return;
      }
      
      employees.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch employees by company ID (through branch relationship)
  const fetchEmployeesByCompany = async (companyId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      // First get branches for this company
      const { data: branches, error: branchError } = await supabase
        .from('Project')
        .select('id')
        .eq('companyId', companyId)
        .eq('isDeleted', false);
      
      if (branchError) {
        console.error('Error fetching branches:', branchError);
        error.value = branchError;
        return;
      }
      
      const branchIds = branches?.map(b => b.id) || [];
      
      if (branchIds.length === 0) {
        employees.value = [];
        return;
      }
      
      // Now fetch employees for these branches
      const { data, error: fetchError } = await supabase
        .from('EmployeeData')
        .select(`
          *,
          account:Account(
            id,
            firstName,
            lastName,
            middleName,
            email,
            contactNumber,
            username,
            roleID,
            companyId
          ),
          activeContract:EmployeeContract(
            id,
            startDate,
            endDate,
            employmentStatus,
            monthlyRate,
            isActive
          ),
          branch:Project(
            id,
            name
          ),
          payrollGroup:PayrollGroup(
            id,
            payrollGroupCode
          ),
          schedule:Schedule(
            id,
            scheduleCode
          )
        `)
        .in('branchId', branchIds)
        .eq('isActive', true)
        .order('employeeCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching employees by company:', fetchError);
        error.value = fetchError;
        return;
      }
      
      employees.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch a single employee by employee code
  const fetchEmployeeByCode = async (employeeCode: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('EmployeeData')
        .select(`
          *,
          account:Account(
            id,
            firstName,
            lastName,
            middleName,
            email,
            contactNumber,
            username,
            roleID,
            companyId
          ),
          activeContract:EmployeeContract(
            id,
            startDate,
            endDate,
            employmentStatus,
            monthlyRate,
            isActive
          ),
          branch:Project(
            id,
            name
          ),
          payrollGroup:PayrollGroup(
            id,
            payrollGroupCode
          ),
          schedule:Schedule(
            id,
            scheduleCode
          )
        `)
        .eq('employeeCode', employeeCode)
        .single();
      
      if (fetchError) {
        console.error('Error fetching employee by code:', fetchError);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error fetching employee:', err);
      return null;
    }
  };
  
  // Fetch employees with minimal data (just for dropdowns)
  const fetchEmployeesMinimal = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('EmployeeData')
        .select('accountId, employeeCode')
        .eq('isActive', true)
        .order('employeeCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching minimal employees:', fetchError);
        error.value = fetchError;
        return;
      }
      
      employees.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
    } finally {
      loading.value = false;
    }
  };
  
  return {
    employees,
    employeeOptions,
    loading,
    error,
    fetchEmployees,
    fetchEmployeesByCompany,
    fetchEmployeeByCode,
    fetchEmployeesMinimal
  };
}