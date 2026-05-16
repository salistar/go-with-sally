// constants/documents.ts
// Constantes pour les documents Go With Sally

import { DocumentType, DocumentCategory, DocumentStatus } from '../types/documents';

// ==================== DOCUMENT CONFIGURATION ====================

export const DOCUMENTS_CONFIG = {
  // Limites de fichiers
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 15,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_DOCUMENT_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Dimensions minimales
  MIN_IMAGE_WIDTH: 800,
  MIN_IMAGE_HEIGHT: 600,
  MIN_PROFILE_SIZE: 400,
  
  // Compression
  IMAGE_QUALITY: 0.8,
  THUMBNAIL_SIZE: 200,
  
  // Expiration
  CRIMINAL_RECORD_VALIDITY_MONTHS: 3,
  INSURANCE_WARNING_DAYS: 30,
} as const;

// ==================== DOCUMENT CATEGORIES ====================

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, {
  label: { ar: string; fr: string; en: string };
  icon: string;
  order: number;
}> = {
  identity: {
    label: {
      ar: 'وثائق الهوية',
      fr: 'Documents d\'identité',
      en: 'Identity documents'
    },
    icon: 'card-account-details-outline',
    order: 1
  },
  vehicle: {
    label: {
      ar: 'وثائق السيارة',
      fr: 'Documents véhicule',
      en: 'Vehicle documents'
    },
    icon: 'car-outline',
    order: 2
  },
  legal: {
    label: {
      ar: 'الوثائق القانونية',
      fr: 'Documents légaux',
      en: 'Legal documents'
    },
    icon: 'file-document-outline',
    order: 3
  },
  profile: {
    label: {
      ar: 'الصور الشخصية',
      fr: 'Photos de profil',
      en: 'Profile photos'
    },
    icon: 'account-circle-outline',
    order: 4
  }
};

// ==================== DOCUMENT TYPES INFO ====================

export const DOCUMENT_TYPES_INFO: Record<DocumentType, {
  category: DocumentCategory;
  icon: string;
  order: number;
  paired?: DocumentType; // Document associé (recto/verso)
}> = {
  drivingLicense: {
    category: 'identity',
    icon: 'card-account-details',
    order: 1,
    paired: 'drivingLicenseBack'
  },
  drivingLicenseBack: {
    category: 'identity',
    icon: 'card-account-details-outline',
    order: 2,
    paired: 'drivingLicense'
  },
  nationalId: {
    category: 'identity',
    icon: 'badge-account',
    order: 3,
    paired: 'nationalIdBack'
  },
  nationalIdBack: {
    category: 'identity',
    icon: 'badge-account-outline',
    order: 4,
    paired: 'nationalId'
  },
  vehicleRegistration: {
    category: 'vehicle',
    icon: 'file-certificate',
    order: 5
  },
  insurance: {
    category: 'vehicle',
    icon: 'shield-check',
    order: 6
  },
  criminalRecord: {
    category: 'legal',
    icon: 'file-document-check',
    order: 7
  },
  vehicleFront: {
    category: 'vehicle',
    icon: 'car-side',
    order: 8,
    paired: 'vehicleBack'
  },
  vehicleBack: {
    category: 'vehicle',
    icon: 'car-back',
    order: 9,
    paired: 'vehicleFront'
  },
  profilePhoto: {
    category: 'profile',
    icon: 'account-circle',
    order: 10
  }
};

// ==================== DOCUMENT STATUS COLORS ====================

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, {
  color: string;
  backgroundColor: string;
  icon: string;
  label: { ar: string; fr: string; en: string };
}> = {
  not_submitted: {
    color: '#F39C12',
    backgroundColor: '#FEF9E7',
    icon: 'cloud-upload-outline',
    label: {
      ar: 'غير مرسل',
      fr: 'Non envoyé',
      en: 'Not submitted'
    }
  },
  pending_review: {
    color: '#3498DB',
    backgroundColor: '#EBF5FB',
    icon: 'clock-outline',
    label: {
      ar: 'قيد المراجعة',
      fr: 'En cours de vérification',
      en: 'Pending review'
    }
  },
  verified: {
    color: '#27AE60',
    backgroundColor: '#E9F7EF',
    icon: 'check-circle',
    label: {
      ar: 'تم التحقق',
      fr: 'Vérifié',
      en: 'Verified'
    }
  },
  rejected: {
    color: '#E74C3C',
    backgroundColor: '#FDEDEC',
    icon: 'close-circle',
    label: {
      ar: 'مرفوض',
      fr: 'Rejeté',
      en: 'Rejected'
    }
  }
};

// ==================== API ENDPOINTS ====================

export const DOCUMENTS_ENDPOINTS = {
  LIST: '/documents',
  UPLOAD: '/documents/upload',
  DELETE: '/documents/:id',
  STATUS: '/documents/status',
  DOWNLOAD: '/documents/:id/download',
  
  // Admin endpoints
  ADMIN_PENDING: '/admin/documents/pending',
  ADMIN_VERIFY: '/admin/documents/:id/verify',
  ADMIN_REJECT: '/admin/documents/:id/reject',
  ADMIN_REQUEST_CALL: '/admin/documents/request-call',
} as const;

// ==================== STORAGE KEYS ====================

export const DOCUMENTS_STORAGE_KEYS = {
  DOCUMENTS_CACHE: '@sally/documents_cache',
  UPLOAD_QUEUE: '@sally/upload_queue',
  LAST_SYNC: '@sally/documents_last_sync',
} as const;

// ==================== REJECTION REASONS ====================

export const REJECTION_REASONS = [
  {
    id: 'blurry',
    label: {
      ar: 'صورة غير واضحة',
      fr: 'Image floue',
      en: 'Blurry image'
    }
  },
  {
    id: 'incomplete',
    label: {
      ar: 'وثيقة غير كاملة',
      fr: 'Document incomplet',
      en: 'Incomplete document'
    }
  },
  {
    id: 'expired',
    label: {
      ar: 'وثيقة منتهية الصلاحية',
      fr: 'Document expiré',
      en: 'Expired document'
    }
  },
  {
    id: 'wrong_document',
    label: {
      ar: 'وثيقة خاطئة',
      fr: 'Mauvais document',
      en: 'Wrong document'
    }
  },
  {
    id: 'unreadable',
    label: {
      ar: 'غير قابل للقراءة',
      fr: 'Illisible',
      en: 'Unreadable'
    }
  },
  {
    id: 'modified',
    label: {
      ar: 'وثيقة معدلة',
      fr: 'Document modifié',
      en: 'Modified document'
    }
  },
  {
    id: 'mismatch',
    label: {
      ar: 'المعلومات غير متطابقة',
      fr: 'Informations non concordantes',
      en: 'Information mismatch'
    }
  },
  {
    id: 'other',
    label: {
      ar: 'سبب آخر',
      fr: 'Autre raison',
      en: 'Other reason'
    }
  }
];

// ==================== DOCUMENT ORDER FOR DISPLAY ====================

export const DOCUMENTS_DISPLAY_ORDER: DocumentType[] = [
  'profilePhoto',
  'nationalId',
  'nationalIdBack',
  'drivingLicense',
  'drivingLicenseBack',
  'vehicleRegistration',
  'insurance',
  'criminalRecord',
  'vehicleFront',
  'vehicleBack'
];

// ==================== UPLOAD TIPS ====================

export const UPLOAD_TIPS = {
  general: {
    ar: [
      'تأكد من إضاءة جيدة',
      'تجنب الانعكاسات والظلال',
      'تأكد من أن جميع الحواف مرئية',
      'استخدم خلفية بسيطة'
    ],
    fr: [
      'Assurez-vous d\'un bon éclairage',
      'Évitez les reflets et les ombres',
      'Assurez-vous que tous les bords sont visibles',
      'Utilisez un fond simple'
    ],
    en: [
      'Ensure good lighting',
      'Avoid reflections and shadows',
      'Make sure all edges are visible',
      'Use a plain background'
    ]
  },
  vehicle: {
    ar: [
      'التقط الصورة من مسافة 2-3 أمتار',
      'تأكد من ظهور لوحة الترقيم بوضوح',
      'التقط الصورة في ضوء النهار',
      'تأكد من نظافة السيارة'
    ],
    fr: [
      'Prenez la photo à 2-3 mètres de distance',
      'Assurez-vous que la plaque est bien visible',
      'Prenez la photo en plein jour',
      'Assurez-vous que le véhicule est propre'
    ],
    en: [
      'Take the photo from 2-3 meters away',
      'Make sure the plate is clearly visible',
      'Take the photo in daylight',
      'Make sure the vehicle is clean'
    ]
  },
  profile: {
    ar: [
      'انظر مباشرة إلى الكاميرا',
      'تعبير وجه محايد',
      'بدون نظارات شمسية أو قبعة',
      'خلفية فاتحة وموحدة'
    ],
    fr: [
      'Regardez directement l\'appareil photo',
      'Expression faciale neutre',
      'Sans lunettes de soleil ni chapeau',
      'Fond clair et uniforme'
    ],
    en: [
      'Look directly at the camera',
      'Neutral facial expression',
      'No sunglasses or hat',
      'Light and uniform background'
    ]
  }
};