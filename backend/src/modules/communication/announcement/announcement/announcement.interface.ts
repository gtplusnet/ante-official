import { AnnouncementPriority } from '@prisma/client';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  icon?: string;
  iconColor?: string;
  priority?: AnnouncementPriority;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  icon?: string;
  iconColor?: string;
  priority?: AnnouncementPriority;
  isActive?: boolean;
}

export interface AnnouncementListDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  priority?: AnnouncementPriority;
  startDate?: string;
  endDate?: string;
}

export interface AnnouncementWithStats {
  id: number;
  title: string;
  content: string;
  icon: string;
  iconColor: string;
  priority: AnnouncementPriority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string;
  };
  viewCount: number;
  acknowledgmentCount: number;
  isViewed?: boolean;
  isAcknowledged?: boolean;
}

export interface AnnouncementStats {
  totalViews: number;
  totalAcknowledgments: number;
  viewDetails: Array<{
    viewedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    viewedAt: Date;
  }>;
  acknowledgmentDetails: Array<{
    acknowledgedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    acknowledgedAt: Date;
  }>;
}
