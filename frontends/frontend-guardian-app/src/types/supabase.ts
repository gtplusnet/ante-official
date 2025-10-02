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
          profilePhotoId: string | null
          gradeLevel: string | null
          section: string | null
          isActive: boolean
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          studentNumber: string
          firstName: string
          lastName: string
          middleName?: string | null
          profilePhotoId?: string | null
          gradeLevel?: string | null
          section?: string | null
          isActive: boolean
          companyId: number
        }
        Update: Partial<{
          studentNumber?: string
          firstName?: string
          lastName?: string
          middleName?: string | null
          profilePhotoId?: string | null
          gradeLevel?: string | null
          section?: string | null
          isActive?: boolean
          companyId?: number
        }>
      }
      Guardian: {
        Row: {
          id: string
          firstName: string
          lastName: string
          middleName: string | null
          profilePhotoId: string | null
          phoneNumber: string | null
          email: string | null
          isActive: boolean
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          firstName: string
          lastName: string
          middleName?: string | null
          profilePhotoId?: string | null
          phoneNumber?: string | null
          email?: string | null
          isActive: boolean
          companyId: number
        }
        Update: Partial<{
          firstName?: string
          lastName?: string
          middleName?: string | null
          profilePhotoId?: string | null
          phoneNumber?: string | null
          email?: string | null
          isActive?: boolean
          companyId?: number
        }>
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
        Insert: {
          studentId: string
          guardianId: string
          relationship?: string | null
          isPrimary: boolean
        }
        Update: Partial<{
          studentId?: string
          guardianId?: string
          relationship?: string | null
          isPrimary?: boolean
        }>
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
          profilePhotoId: string | null
          action: 'check_in' | 'check_out'
          timestamp: string
          deviceId: string | null
          location: string | null
          companyId: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          qrCode: string
          personId: string
          personType: 'student' | 'guardian'
          personName: string
          firstName?: string | null
          lastName?: string | null
          profilePhotoId?: string | null
          action: 'check_in' | 'check_out'
          timestamp: string
          deviceId?: string | null
          location?: string | null
          companyId: number
        }
        Update: Partial<{
          qrCode?: string
          personId?: string
          personType?: 'student' | 'guardian'
          personName?: string
          firstName?: string | null
          lastName?: string | null
          profilePhotoId?: string | null
          action?: 'check_in' | 'check_out'
          timestamp?: string
          deviceId?: string | null
          location?: string | null
          companyId?: number
        }>
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
        Insert: {
          gateName: string
          deviceId: string
          isActive: boolean
          companyId: number
        }
        Update: Partial<{
          gateName?: string
          deviceId?: string
          isActive?: boolean
          companyId?: number
        }>
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
        Insert: {
          guardianId: string
          type: string
          title: string
          body: string
          data?: any | null
          readAt?: string | null
        }
        Update: Partial<{
          guardianId?: string
          type?: string
          title?: string
          body?: string
          data?: any | null
          readAt?: string | null
        }>
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
        Insert: {
          type: string
          studentId?: string | null
          studentName?: string | null
          guardianId: string
          action?: string | null
          location?: string | null
          timestamp: string
          read: boolean
          photoUrl?: string | null
          companyId: number
        }
        Update: Partial<{
          type?: string
          studentId?: string | null
          studentName?: string | null
          guardianId?: string
          action?: string | null
          location?: string | null
          timestamp?: string
          read?: boolean
          photoUrl?: string | null
          companyId?: number
        }>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}