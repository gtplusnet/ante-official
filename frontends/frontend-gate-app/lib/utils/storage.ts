// IndexedDB storage utilities for School Gatekeep
import { dbManager } from '@/lib/db/db-manager';

// Utility function to generate initials from first and last name
export const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};
export interface Student {
  id: string;
  qrCode: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  gender: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  profilePhotoUrl?: string | null;
}

export interface Guardian {
  id: string;
  qrCode: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  profilePhotoUrl?: string | null;
}

export interface SyncMetadata {
  lastStudentSync: string | null;
  lastGuardianSync: string | null;
  studentCount: number;
  guardianCount: number;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  lastSyncError?: string;
  lastSyncTime?: string;
}

export class StorageManager {
  async init(): Promise<void> {
    // Database initialization is now handled by dbManager
    console.log('StorageManager: init() called - database initialization handled by dbManager');
  }

  async getSyncMetadata(): Promise<SyncMetadata> {
    const result = await dbManager.get<{ key: string; value: SyncMetadata }>('metadata', 'syncMetadata');
    
    const defaultMetadata: SyncMetadata = {
      lastStudentSync: null,
      lastGuardianSync: null,
      studentCount: 0,
      guardianCount: 0,
      lastSyncStatus: null,
    };
    
    return result?.value || defaultMetadata;
  }

  async updateSyncMetadata(metadata: Partial<SyncMetadata>): Promise<void> {
    const current = await this.getSyncMetadata();
    const updated = { ...current, ...metadata };
    
    await dbManager.put('metadata', { key: 'syncMetadata', value: updated });
  }

  async syncFromAPI(): Promise<{ studentsSync: number; guardiansSync: number }> {
    console.log('StorageManager: Starting sync from API...');

    try {
      // Import the sync service (dynamic import to avoid circular dependencies)
      const { getSyncAPIService } = await import('../services/sync-api.service');
      const syncService = getSyncAPIService();
      await syncService.init();

      // Fetch data from API with QR codes generated
      const { students, guardians } = await syncService.syncAll();
      console.log(`StorageManager: Got ${students.length} students and ${guardians.length} guardians from API`);

      // Map StudentData to Student interface with default values
      const mappedStudents: Student[] = students.map((s: any) => ({
        id: s.id,
        qrCode: s.qrCode,
        studentNumber: s.studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName || undefined,
        email: '', // Default empty as it's not in StudentData
        gender: '', // Default empty as it's not in StudentData
        isActive: s.isActive,
        isDeleted: false, // Default to false
        createdAt: new Date().toISOString(), // Default to now
        updatedAt: new Date().toISOString(), // Default to now
        profilePhotoUrl: s.profilePhotoId ? `/api/photos/${s.profilePhotoId}` : null
      }));

      // Map GuardianData to Guardian interface
      const mappedGuardians: Guardian[] = guardians.map((g: any) => ({
        id: g.id,
        qrCode: g.qrCode,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email || '',
        contactNumber: g.contactNumber || '',
        isActive: g.isActive,
        isDeleted: false, // Default to false
        createdAt: new Date().toISOString(), // Default to now
        updatedAt: new Date().toISOString(), // Default to now
        profilePhotoUrl: null // Default to null
      }));

      // Save to IndexedDB
      await this.saveStudents(mappedStudents);
      await this.saveGuardians(mappedGuardians);

      // Update sync metadata
      const now = new Date().toISOString();
      await this.updateSyncMetadata({
        lastStudentSync: now,
        lastGuardianSync: now,
        studentCount: students.length,
        guardianCount: guardians.length,
        lastSyncStatus: 'success',
        lastSyncTime: now
      });

      console.log('StorageManager: Sync completed successfully');
      return { studentsSync: students.length, guardiansSync: guardians.length };

    } catch (error) {
      console.error('StorageManager: Sync failed:', error);

      await this.updateSyncMetadata({
        lastSyncStatus: 'failed',
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        lastSyncTime: new Date().toISOString()
      });

      throw error;
    }
  }

  async saveStudents(students: Student[]): Promise<void> {
    await dbManager.transaction(['students'], 'readwrite', async (tx) => {
      const store = tx.objectStore('students');
      
      // Clear deleted students
      const deletedStudents = students.filter(s => s.isDeleted);
      for (const student of deletedStudents) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(student.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      // Save active students
      const activeStudents = students.filter(s => !s.isDeleted);
      for (const student of activeStudents) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(student);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    });
  }

  async saveGuardians(guardians: Guardian[]): Promise<void> {
    await dbManager.transaction(['guardians'], 'readwrite', async (tx) => {
      const store = tx.objectStore('guardians');
      
      // Clear deleted guardians
      const deletedGuardians = guardians.filter(g => g.isDeleted);
      for (const guardian of deletedGuardians) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(guardian.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      // Save active guardians
      const activeGuardians = guardians.filter(g => !g.isDeleted);
      for (const guardian of activeGuardians) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(guardian);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    });
  }

  async getRecordCounts(): Promise<{ students: number; guardians: number }> {
    const [students, guardians] = await Promise.all([
      dbManager.count('students'),
      dbManager.count('guardians')
    ]);
    
    return { students, guardians };
  }

  async findByQrCode(qrCode: string): Promise<Student | Guardian | null> {
    console.log('StorageManager.findByQrCode called with:', qrCode);
    const [type, id] = qrCode.split(':');
    console.log('QR code type:', type, 'ID:', id);
    
    if (type === 'student') {
      const result = await this.findStudent(qrCode);
      console.log('Student lookup result:', result);
      return result;
    } else if (type === 'guardian') {
      const result = await this.findGuardian(qrCode);
      console.log('Guardian lookup result:', result);
      return result;
    }
    
    console.log('Unknown QR code type:', type);
    return null;
  }

  private async findStudent(qrCode: string): Promise<Student | null> {
    console.log('Looking up student with QR code:', qrCode);
    try {
      const students = await dbManager.getAllByIndex<Student>('students', 'qrCode', qrCode, 1);
      console.log('Students found:', students.length);
      if (students.length > 0) {
        console.log('First student:', students[0]);
      }
      return students[0] || null;
    } catch (error) {
      console.error('Error looking up student:', error);
      return null;
    }
  }

  private async findGuardian(qrCode: string): Promise<Guardian | null> {
    console.log('Looking up guardian with QR code:', qrCode);
    try {
      const guardians = await dbManager.getAllByIndex<Guardian>('guardians', 'qrCode', qrCode, 1);
      console.log('Guardians found:', guardians.length);
      if (guardians.length > 0) {
        console.log('First guardian:', guardians[0]);
      }
      return guardians[0] || null;
    } catch (error) {
      console.error('Error looking up guardian:', error);
      return null;
    }
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      dbManager.clear('students'),
      dbManager.clear('guardians'),
      dbManager.clear('attendance'),
      dbManager.clear('syncQueue'),
      dbManager.clear('metadata')
    ]);
  }

  async close(): Promise<void> {
    // Database closing is handled by dbManager if needed
    console.log('StorageManager: close() called');
  }
}

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}