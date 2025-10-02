// Database types for Supabase
// This is a simplified version focusing on school-related tables

export type Database = {
  public: {
    Tables: {
      Student: {
        Row: {
          id: string
          studentNumber: string
          firstName: string
          lastName: string
          middleName: string | null
          profilePhotoId: number | null
          isActive: boolean
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Student']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Student']['Insert']>
      }
      Guardian: {
        Row: {
          id: string
          firstName: string
          lastName: string
          middleName: string | null
          contactNumber: string | null
          email: string | null
          isActive: boolean
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Guardian']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Guardian']['Insert']>
      }
      StudentGuardian: {
        Row: {
          id: string
          studentId: string
          guardianId: string
          relationship: string | null
          isPrimary: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['StudentGuardian']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['StudentGuardian']['Insert']>
      }
      SchoolAttendance: {
        Row: {
          id: string
          qrCode: string
          personId: string
          personType: 'student' | 'guardian'
          personName: string
          firstName: string | null
          lastName: string | null
          profilePhotoUrl: string | null
          action: 'check_in' | 'check_out'
          timestamp: string
          deviceId: string | null
          location: string | null
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['SchoolAttendance']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['SchoolAttendance']['Insert']>
      }
      Gate: {
        Row: {
          id: string
          gateName: string
          deviceId: string
          isActive: boolean
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Gate']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Gate']['Insert']>
      }
      GuardianNotification: {
        Row: {
          id: string
          guardianId: string
          type: string
          title: string
          body: string
          data: any | null
          readAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['GuardianNotification']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['GuardianNotification']['Insert']>
      }
      SchoolNotification: {
        Row: {
          id: string
          type: string
          studentId: string | null
          studentName: string | null
          guardianId: string
          action: string | null
          location: string | null
          timestamp: string
          read: boolean
          photoUrl: string | null
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['SchoolNotification']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['SchoolNotification']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}