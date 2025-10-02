export enum ModuleType {
  PROJECTS = 'PROJECTS',
  ASSETS = 'ASSETS',
  CALENDAR = 'CALENDAR',
  MANPOWER = 'MANPOWER',
  CRM = 'CRM',
  TREASURY = 'TREASURY',
  CMS = 'CMS',
  SCHOOL = 'SCHOOL'
}

export interface MediaModuleConfig {
  module: ModuleType;
  allowedFileTypes: string[];
  maxFileSize: number;
  defaultFolders: string[];
  features: {
    allowFolders: boolean;
    allowTags: boolean;
    allowSharing: boolean;
    requireApproval: boolean;
  };
  ui: {
    title: string;
    icon: string;
    description: string;
  };
}

export interface MediaUploadOptions {
  module: ModuleType;
  folderId?: number;
  folderName?: string;
  alternativeText?: string;
  caption?: string;
  tags?: string[];
  processInBackground?: boolean;
  metadata?: Record<string, any>;
}

export interface MediaQueryOptions {
  module?: ModuleType;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  folderId?: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tags?: string[];
}

export interface MediaFileExtended {
  id: number;
  name: string;
  originalName: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  mimetype: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  
  // Processing information
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
  
  // Optimization data
  variants?: Record<string, any>;
  blurPlaceholder?: string;
  dominantColor?: string;
  
  // Module and organization
  module: ModuleType;
  folderId?: number;
  folder?: MediaFolderExtended;
  
  // CMS specific
  alternativeText?: string;
  caption?: string;
  tags?: string[];
  
  // Tracking
  lastAccessedAt?: Date;
  accessCount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MediaFolderExtended {
  id: number;
  name: string;
  parentId?: number;
  path: string;
  module?: ModuleType;
  companyId?: number;
  createdAt: Date;
  updatedAt: Date;
  children?: MediaFolderExtended[];
  fileCount?: number;
  subfolderCount?: number;
  totalSize?: number;
}

export interface CreateFolderOptions {
  name: string;
  parentId?: number;
  module?: ModuleType;
}

export interface MediaLibraryDialogProps {
  modelValue: boolean;
  module: ModuleType;
  title?: string;
  selectionMode?: 'single' | 'multiple' | 'none';
  allowUpload?: boolean;
  allowFolders?: boolean;
  fileTypes?: string[];
  maxSelections?: number;
  defaultFolder?: string;
  confirmLabel?: string;
  libraryTitle?: string;
  customConfig?: Partial<MediaModuleConfig>;
}

export interface MediaLibraryCoreProps {
  mode: 'page' | 'dialog';
  module: ModuleType;
  selectionMode?: 'single' | 'multiple' | 'none';
  allowUpload?: boolean;
  allowFolders?: boolean;
  fileTypes?: string[];
  maxSelections?: number;
  initialFolder?: string;
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
  libraryTitle?: string;
  customConfig?: Partial<MediaModuleConfig>;
}

// Event types for media library components
export interface MediaSelectionEvent {
  files: MediaFileExtended[];
  selectionMode: 'single' | 'multiple';
}

export interface MediaUploadEvent {
  files: File[];
  options: MediaUploadOptions;
}

export interface MediaFolderNavigationEvent {
  folder: MediaFolderExtended | null;
  path: string[];
}

export interface MediaActionEvent {
  action: 'upload' | 'delete' | 'move' | 'rename' | 'preview';
  files?: MediaFileExtended[];
  folder?: MediaFolderExtended;
  data?: any;
}

// Utility types
export type MediaFilter = {
  search?: string;
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
};

export type MediaSortOption = {
  field: 'name' | 'createdAt' | 'size' | 'type';
  direction: 'asc' | 'desc';
};

export type ViewMode = 'grid' | 'list';