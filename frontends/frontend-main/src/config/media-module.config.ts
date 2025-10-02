import { ModuleType, MediaModuleConfig } from 'src/types/media.types';

export const MODULE_CONFIGS: Record<ModuleType, MediaModuleConfig> = {
  [ModuleType.PROJECTS]: {
    module: ModuleType.PROJECTS,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.dwg',
      '.dxf',
      '.zip',
      '.rar'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    defaultFolders: [
      'Blueprints',
      'Contracts',
      'Progress Photos',
      'Reports',
      'Specifications',
      'Permits',
      'Invoices',
      'Change Orders'
    ],
    features: {
      allowFolders: true,
      allowTags: true,
      allowSharing: true,
      requireApproval: false
    },
    ui: {
      title: 'Project Media Library',
      icon: 'o_folder_open',
      description: 'Manage project documents, blueprints, progress photos, and reports'
    }
  },

  [ModuleType.ASSETS]: {
    module: ModuleType.ASSETS,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/quicktime'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    defaultFolders: [
      'Equipment Photos',
      'Maintenance Records',
      'User Manuals',
      'Warranties',
      'Inspection Reports',
      'Parts Catalogs',
      'Safety Data Sheets'
    ],
    features: {
      allowFolders: true,
      allowTags: true,
      allowSharing: false,
      requireApproval: false
    },
    ui: {
      title: 'Asset Media Library',
      icon: 'o_inventory_2',
      description: 'Store equipment photos, manuals, maintenance records, and warranties'
    }
  },

  [ModuleType.CALENDAR]: {
    module: ModuleType.CALENDAR,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    defaultFolders: [
      'Event Documents',
      'Meeting Minutes',
      'Schedules',
      'Attachments',
      'Presentations',
      'Agendas'
    ],
    features: {
      allowFolders: true,
      allowTags: false,
      allowSharing: true,
      requireApproval: false
    },
    ui: {
      title: 'Calendar Media Library',
      icon: 'o_event',
      description: 'Manage event documents, meeting minutes, and schedule attachments'
    }
  },

  [ModuleType.MANPOWER]: {
    module: ModuleType.MANPOWER,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    defaultFolders: [
      'Employee IDs',
      'Contracts',
      'Certificates',
      'Resumes',
      'Training Records',
      'Performance Reviews',
      'Medical Records',
      'Government IDs'
    ],
    features: {
      allowFolders: true,
      allowTags: false,
      allowSharing: false,
      requireApproval: true
    },
    ui: {
      title: 'HR Document Library',
      icon: 'o_people',
      description: 'Secure storage for employee documents, contracts, and HR records'
    }
  },

  [ModuleType.CRM]: {
    module: ModuleType.CRM,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    defaultFolders: [
      'Lead Documents',
      'Proposals',
      'Contracts',
      'Marketing Materials',
      'Client Communications',
      'Product Catalogs',
      'Presentations',
      'Brochures'
    ],
    features: {
      allowFolders: true,
      allowTags: true,
      allowSharing: true,
      requireApproval: false
    },
    ui: {
      title: 'CRM Media Library',
      icon: 'o_business_center',
      description: 'Store lead documents, proposals, marketing materials, and client files'
    }
  },

  [ModuleType.TREASURY]: {
    module: ModuleType.TREASURY,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    defaultFolders: [
      'Receipts',
      'Invoices',
      'Bank Statements',
      'Tax Documents',
      'Financial Reports',
      'Audit Documents',
      'Contracts',
      'Payment Vouchers'
    ],
    features: {
      allowFolders: true,
      allowTags: true,
      allowSharing: false,
      requireApproval: true
    },
    ui: {
      title: 'Treasury Document Library',
      icon: 'o_account_balance',
      description: 'Secure financial document storage for receipts, invoices, and reports'
    }
  },

  [ModuleType.CMS]: {
    module: ModuleType.CMS,
    allowedFileTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/*',
      '.json',
      '.xml',
      '.csv'
    ],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    defaultFolders: [
      'Images',
      'Videos',
      'Documents',
      'Audio',
      'Templates',
      'Assets',
      'Uploads',
      'Media'
    ],
    features: {
      allowFolders: true,
      allowTags: true,
      allowSharing: true,
      requireApproval: false
    },
    ui: {
      title: 'Content Management System',
      icon: 'o_content_copy',
      description: 'Comprehensive media library for all content types and formats'
    }
  },

  [ModuleType.SCHOOL]: {
    module: ModuleType.SCHOOL,
    allowedFileTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    defaultFolders: [
      'Student Records',
      'Enrollment Forms',
      'Academic Reports',
      'Certificates',
      'ID Photos',
      'Guardian Documents',
      'Grade Reports',
      'Attendance Records',
      'Disciplinary Records'
    ],
    features: {
      allowFolders: true,
      allowTags: false,
      allowSharing: false,
      requireApproval: true
    },
    ui: {
      title: 'School Document Library',
      icon: 'o_school',
      description: 'Secure student records, enrollment forms, and academic documents'
    }
  }
};

export function getModuleConfig(module: ModuleType): MediaModuleConfig {
  return MODULE_CONFIGS[module] || MODULE_CONFIGS[ModuleType.CMS];
}

export function getAllowedFileTypesForModule(module: ModuleType): string[] {
  return getModuleConfig(module).allowedFileTypes;
}

export function getMaxFileSizeForModule(module: ModuleType): number {
  return getModuleConfig(module).maxFileSize;
}

export function getDefaultFoldersForModule(module: ModuleType): string[] {
  return getModuleConfig(module).defaultFolders;
}

export function isFileTypeAllowedForModule(filename: string, mimetype: string, module: ModuleType): boolean {
  const config = getModuleConfig(module);
  const extension = filename.toLowerCase().split('.').pop();
  
  return config.allowedFileTypes.some(allowedType => {
    // Check mimetype patterns (e.g., 'image/*', 'application/pdf')
    if (allowedType.includes('/')) {
      if (allowedType.endsWith('/*')) {
        const baseType = allowedType.replace('/*', '');
        return mimetype.startsWith(baseType);
      }
      return mimetype === allowedType;
    }
    
    // Check extension patterns (e.g., '.dwg', '.dxf')
    if (allowedType.startsWith('.')) {
      return extension === allowedType.substring(1);
    }
    
    return false;
  });
}

export function validateFileForModule(
  file: File, 
  module: ModuleType
): { isValid: boolean; error?: string } {
  const config = getModuleConfig(module);
  
  // Check file size
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${module} module`
    };
  }
  
  // Check file type
  if (!isFileTypeAllowedForModule(file.name, file.type, module)) {
    return {
      isValid: false,
      error: `File type not allowed for ${module} module. Allowed types: ${config.allowedFileTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

export function getModuleDisplayInfo(module: ModuleType) {
  const config = getModuleConfig(module);
  return {
    name: config.ui.title,
    icon: config.ui.icon,
    description: config.ui.description
  };
}