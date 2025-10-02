export interface NotificationsInterface {
  id: number;
  content: string;
}

export interface AccountNotificationsInterface {
  id?: number;
  notificationsId: number;
  receiverId: string;
  projectId: number;
  senderId: string;
  hasRead?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shared interfaces that match frontend structure
export interface NotificationSender {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface NotificationData {
  id: string;
  content: string;
  code: {
    key: string;
    message: string;
    showDialogModule: 'task' | 'discussion' | 'filing_approval' | string;
  };
  showDialogModule: 'task' | 'discussion' | 'filing_approval' | string;
  showDialogId?: string;
  createdAt: {
    timeAgo: string;
    date?: Date;
  };
  updatedAt?: Date;
}

export interface Notification {
  id: string;
  hasRead: boolean;
  notificationData: NotificationData;
  notificationSender: NotificationSender;
  project?: {
    id: string;
    name: string;
  };
}
