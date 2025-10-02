import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TestStudent, TestGuardian } from '../fixtures/student-management-test-data';

export interface SupabaseTestConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  testCompanyId: number;
}

export class SupabaseTestHelper {
  private client: SupabaseClient | null = null;
  private config: SupabaseTestConfig;
  private usingAnonKey: boolean = false;

  constructor(config?: Partial<SupabaseTestConfig>) {
    this.config = {
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://ramamglzyiejlznfnngc.supabase.co',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
      testCompanyId: 1, // Default test company
      ...config
    };

    if (!process.env.SUPABASE_SERVICE_KEY) {
      console.warn('[SupabaseTestHelper] Service key not found. Using anon key for read-only operations.');
      this.usingAnonKey = true;
      this.config.supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    }
  }

  async initialize(): Promise<void> {
    if (!this.client) {
      this.client = createClient(
        this.config.supabaseUrl,
        this.config.supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    }
    console.log('[SupabaseTestHelper] Initialized');
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  // Student operations
  async createTestStudent(studentData: TestStudent): Promise<string | null> {
    if (this.usingAnonKey) {
      console.log('[SupabaseTestHelper] Cannot create student - read-only mode (anon key)');
      return null;
    }
    
    const client = this.ensureClient();
    
    try {
      // First create account if username/password provided
      let accountId = null;
      if (studentData.username && studentData.password) {
        const { data: accountData, error: accountError } = await client
          .from('Account')
          .insert({
            email: studentData.email,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            middleName: studentData.middleName,
            contactNumber: studentData.contactNumber,
            username: studentData.username,
            password: studentData.password, // In real app this would be hashed
            roleId: 'student-role-id', // This would need to be a valid role ID
            companyId: this.config.testCompanyId,
            dateOfBirth: new Date(studentData.dateOfBirth),
            accountType: 'STUDENT'
          })
          .select('id')
          .single();

        if (accountError) {
          console.error('[SupabaseTestHelper] Error creating account:', accountError);
          return null;
        }
        accountId = accountData?.id;
      }

      // Create student record
      const { data, error } = await client
        .from('Student')
        .insert({
          studentNumber: studentData.studentNumber,
          lrn: studentData.lrn,
          companyId: this.config.testCompanyId,
          accountId: accountId,
          isActive: true,
          searchKeyword: `${studentData.firstName} ${studentData.lastName} ${studentData.studentNumber}`.toLowerCase()
        })
        .select('id')
        .single();

      if (error) {
        console.error('[SupabaseTestHelper] Error creating student:', error);
        return null;
      }

      console.log(`[SupabaseTestHelper] Created test student: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception creating student:', error);
      return null;
    }
  }

  async createTestGuardian(guardianData: TestGuardian): Promise<string | null> {
    if (this.usingAnonKey) {
      console.log('[SupabaseTestHelper] Cannot create guardian - read-only mode (anon key)');
      return null;
    }
    
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('Guardian')
        .insert({
          firstName: guardianData.firstName,
          lastName: guardianData.lastName,
          middleName: guardianData.middleName,
          email: guardianData.email,
          contactNumber: guardianData.contactNumber,
          alternateNumber: guardianData.alternateNumber,
          address: guardianData.address,
          occupation: guardianData.occupation,
          dateOfBirth: guardianData.dateOfBirth ? new Date(guardianData.dateOfBirth) : null,
          companyId: this.config.testCompanyId,
          isActive: true,
          searchKeyword: `${guardianData.firstName} ${guardianData.lastName} ${guardianData.email}`.toLowerCase()
        })
        .select('id')
        .single();

      if (error) {
        console.error('[SupabaseTestHelper] Error creating guardian:', error);
        return null;
      }

      console.log(`[SupabaseTestHelper] Created test guardian: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception creating guardian:', error);
      return null;
    }
  }

  async assignGuardianToStudent(studentId: string, guardianId: string, relationship: string, isPrimary: boolean = false): Promise<boolean> {
    const client = this.ensureClient();
    
    try {
      const { error } = await client
        .from('StudentGuardian')
        .insert({
          studentId,
          guardianId,
          relationship,
          isPrimary
        });

      if (error) {
        console.error('[SupabaseTestHelper] Error assigning guardian:', error);
        return false;
      }

      console.log(`[SupabaseTestHelper] Assigned guardian ${guardianId} to student ${studentId}`);
      return true;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception assigning guardian:', error);
      return false;
    }
  }

  // Verification methods
  async verifyStudentExists(studentId: string): Promise<boolean> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('Student')
        .select('id')
        .eq('id', studentId)
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception verifying student:', error);
      return false;
    }
  }

  async verifyGuardianExists(guardianId: string): Promise<boolean> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('Guardian')
        .select('id')
        .eq('id', guardianId)
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception verifying guardian:', error);
      return false;
    }
  }

  async verifyStudentGuardianRelationship(studentId: string, guardianId: string): Promise<boolean> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('StudentGuardian')
        .select('id')
        .eq('studentId', studentId)
        .eq('guardianId', guardianId)
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception verifying relationship:', error);
      return false;
    }
  }

  async getStudentByStudentNumber(studentNumber: string): Promise<any> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('Student')
        .select(`
          *,
          account:Account(
            firstName,
            lastName,
            middleName,
            email,
            contactNumber
          ),
          guardians:StudentGuardian(
            relationship,
            isPrimary,
            guardian:Guardian(
              firstName,
              lastName,
              email,
              contactNumber
            )
          )
        `)
        .eq('studentNumber', studentNumber)
        .eq('companyId', this.config.testCompanyId)
        .single();

      if (error) {
        console.error('[SupabaseTestHelper] Error getting student:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception getting student:', error);
      return null;
    }
  }

  async getGuardianByEmail(email: string): Promise<any> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('Guardian')
        .select(`
          *,
          students:StudentGuardian(
            relationship,
            isPrimary,
            student:Student(
              studentNumber,
              account:Account(
                firstName,
                lastName,
                email
              )
            )
          )
        `)
        .eq('email', email)
        .eq('companyId', this.config.testCompanyId)
        .single();

      if (error) {
        console.error('[SupabaseTestHelper] Error getting guardian:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception getting guardian:', error);
      return null;
    }
  }

  // Attendance/Scan operations
  async createScanLog(personId: string, personType: 'student' | 'guardian', location?: string): Promise<string | null> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('GateScanLog')
        .insert({
          [personType === 'student' ? 'studentId' : 'guardianId']: personId,
          scanTime: new Date().toISOString(),
          location: location || 'Test Location',
          companyId: this.config.testCompanyId
        })
        .select('id')
        .single();

      if (error) {
        console.error('[SupabaseTestHelper] Error creating scan log:', error);
        return null;
      }

      console.log(`[SupabaseTestHelper] Created scan log: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception creating scan log:', error);
      return null;
    }
  }

  async getScanLogs(personId: string, limit: number = 10): Promise<any[]> {
    const client = this.ensureClient();
    
    try {
      const { data, error } = await client
        .from('GateScanLog')
        .select('*')
        .or(`studentId.eq.${personId},guardianId.eq.${personId}`)
        .eq('companyId', this.config.testCompanyId)
        .order('scanTime', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[SupabaseTestHelper] Error getting scan logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception getting scan logs:', error);
      return [];
    }
  }

  // Cleanup methods
  async cleanupTestData(emailPrefix: string = 'test_'): Promise<void> {
    if (this.usingAnonKey) {
      console.log('[SupabaseTestHelper] Cannot cleanup - read-only mode (anon key)');
      return;
    }
    
    const client = this.ensureClient();
    
    try {
      console.log('[SupabaseTestHelper] Starting cleanup...');

      // Delete scan logs first (foreign key constraints)
      await client
        .from('GateScanLog')
        .delete()
        .eq('companyId', this.config.testCompanyId);

      // Delete student-guardian relationships
      const { data: relationships } = await client
        .from('StudentGuardian')
        .select(`
          id,
          student:Student!inner(companyId),
          guardian:Guardian!inner(companyId)
        `)
        .eq('student.companyId', this.config.testCompanyId)
        .eq('guardian.companyId', this.config.testCompanyId);

      if (relationships?.length) {
        await client
          .from('StudentGuardian')
          .delete()
          .in('id', relationships.map(r => r.id));
      }

      // Delete guardians with test email prefix
      await client
        .from('Guardian')
        .delete()
        .eq('companyId', this.config.testCompanyId)
        .like('email', `${emailPrefix}%`);

      // Delete students with test company
      await client
        .from('Student')
        .delete()
        .eq('companyId', this.config.testCompanyId);

      // Delete test accounts
      await client
        .from('Account')
        .delete()
        .eq('companyId', this.config.testCompanyId)
        .like('email', `${emailPrefix}%`);

      console.log('[SupabaseTestHelper] Cleanup completed');
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception during cleanup:', error);
    }
  }

  async cleanupSpecificData(studentIds: string[], guardianIds: string[]): Promise<void> {
    if (this.usingAnonKey) {
      console.log('[SupabaseTestHelper] Cannot cleanup specific data - read-only mode (anon key)');
      return;
    }
    
    const client = this.ensureClient();
    
    try {
      console.log('[SupabaseTestHelper] Cleaning up specific test data...');

      // Delete scan logs
      if (studentIds.length > 0) {
        await client
          .from('GateScanLog')
          .delete()
          .in('studentId', studentIds);
      }
      
      if (guardianIds.length > 0) {
        await client
          .from('GateScanLog')
          .delete()
          .in('guardianId', guardianIds);
      }

      // Delete relationships
      if (studentIds.length > 0 || guardianIds.length > 0) {
        let query = client.from('StudentGuardian').delete();
        if (studentIds.length > 0) {
          query = query.in('studentId', studentIds);
        }
        if (guardianIds.length > 0) {
          query = query.in('guardianId', guardianIds);
        }
        await query;
      }

      // Delete entities
      if (guardianIds.length > 0) {
        await client
          .from('Guardian')
          .delete()
          .in('id', guardianIds);
      }

      if (studentIds.length > 0) {
        await client
          .from('Student')
          .delete()
          .in('id', studentIds);
      }

      console.log('[SupabaseTestHelper] Specific cleanup completed');
    } catch (error) {
      console.error('[SupabaseTestHelper] Exception during specific cleanup:', error);
    }
  }
}