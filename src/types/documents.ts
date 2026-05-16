// types/documents.ts
// Types pour les documents conductrice Go With Sally

// ==================== DOCUMENT TYPES ====================

export type DocumentType = 
  | 'drivingLicense'        // Permis de conduire
  | 'drivingLicenseBack'    // Permis de conduire (verso)
  | 'nationalId'            // Carte nationale (CIN)
  | 'nationalIdBack'        // Carte nationale (verso)
  | 'vehicleRegistration'   // Carte grise
  | 'insurance'             // Assurance
  | 'criminalRecord'        // Fiche anthropométrique
  | 'vehicleFront'          // Photo véhicule avant
  | 'vehicleBack'           // Photo véhicule arrière
  | 'profilePhoto';         // Photo de profil

export type DocumentStatus = 
  | 'not_submitted'         // Non soumis
  | 'pending_review'        // En attente de vérification
  | 'verified'              // Vérifié
  | 'rejected';             // Rejeté

export type DocumentCategory = 
  | 'identity'              // Documents d'identité
  | 'vehicle'               // Documents véhicule
  | 'legal'                 // Documents légaux
  | 'profile';              // Photos de profil

// ==================== DOCUMENT INTERFACES ====================

export interface Document {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  url: string | null;
  thumbnailUrl: string | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  expiryDate: string | null;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  extractedData?: ExtractedDocumentData;
}

export interface ExtractedDocumentData {
  documentNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  issueDate?: string;
  address?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleYear?: string;
}

// ==================== DOCUMENT UPLOAD ====================

export interface DocumentUploadRequest {
  type: DocumentType;
  file: {
    uri: string;
    type: string;
    name: string;
  };
  metadata?: Partial<DocumentMetadata>;
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  message?: string;
  error?: string;
}

export interface DocumentUploadProgress {
  documentType: DocumentType;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// ==================== DOCUMENTS STATE ====================

export interface DocumentsState {
  documents: Record<DocumentType, Document | null>;
  uploadProgress: Record<DocumentType, DocumentUploadProgress | null>;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  overallStatus: OverallDocumentStatus;
  verificationProgress: number;
  lastUpdated: string | null;
}

export type OverallDocumentStatus = 
  | 'not_submitted'         // Aucun document soumis
  | 'partial'               // Documents partiellement soumis
  | 'pending_review'        // Tous soumis, en attente
  | 'verified'              // Tous vérifiés
  | 'rejected'              // Au moins un rejeté
  | 'requires_update';      // Mise à jour requise

// ==================== DOCUMENT REQUIREMENTS ====================

export interface DocumentRequirement {
  type: DocumentType;
  category: DocumentCategory;
  required: boolean;
  allowedFormats: string[];
  maxSizeBytes: number;
  minWidth: number;
  minHeight: number;
  description: {
    ar: string;
    fr: string;
    en: string;
  };
  instructions: {
    ar: string;
    fr: string;
    en: string;
  };
}

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    type: 'drivingLicense',
    category: 'identity',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'رخصة السياقة (الوجه الأمامي)',
      fr: 'Permis de conduire (recto)',
      en: 'Driving license (front)'
    },
    instructions: {
      ar: 'التقط صورة واضحة لرخصة السياقة',
      fr: 'Prenez une photo claire de votre permis de conduire',
      en: 'Take a clear photo of your driving license'
    }
  },
  {
    type: 'drivingLicenseBack',
    category: 'identity',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'رخصة السياقة (الوجه الخلفي)',
      fr: 'Permis de conduire (verso)',
      en: 'Driving license (back)'
    },
    instructions: {
      ar: 'التقط صورة واضحة للوجه الخلفي لرخصة السياقة',
      fr: 'Prenez une photo claire du verso de votre permis',
      en: 'Take a clear photo of the back of your license'
    }
  },
  {
    type: 'nationalId',
    category: 'identity',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'البطاقة الوطنية (الوجه الأمامي)',
      fr: 'Carte nationale (recto)',
      en: 'National ID card (front)'
    },
    instructions: {
      ar: 'التقط صورة واضحة للبطاقة الوطنية',
      fr: 'Prenez une photo claire de votre CIN',
      en: 'Take a clear photo of your national ID'
    }
  },
  {
    type: 'nationalIdBack',
    category: 'identity',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'البطاقة الوطنية (الوجه الخلفي)',
      fr: 'Carte nationale (verso)',
      en: 'National ID card (back)'
    },
    instructions: {
      ar: 'التقط صورة واضحة للوجه الخلفي للبطاقة',
      fr: 'Prenez une photo claire du verso de votre CIN',
      en: 'Take a clear photo of the back of your ID'
    }
  },
  {
    type: 'vehicleRegistration',
    category: 'vehicle',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'البطاقة الرمادية',
      fr: 'Carte grise',
      en: 'Vehicle registration card'
    },
    instructions: {
      ar: 'التقط صورة واضحة للبطاقة الرمادية',
      fr: 'Prenez une photo claire de votre carte grise',
      en: 'Take a clear photo of your vehicle registration'
    }
  },
  {
    type: 'insurance',
    category: 'vehicle',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'شهادة التأمين',
      fr: 'Attestation d\'assurance',
      en: 'Insurance certificate'
    },
    instructions: {
      ar: 'التقط صورة واضحة لشهادة التأمين السارية',
      fr: 'Prenez une photo claire de votre attestation d\'assurance',
      en: 'Take a clear photo of your valid insurance certificate'
    }
  },
  {
    type: 'criminalRecord',
    category: 'legal',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    minWidth: 800,
    minHeight: 600,
    description: {
      ar: 'الفيش الأنثروبومتري',
      fr: 'Fiche anthropométrique',
      en: 'Criminal record certificate'
    },
    instructions: {
      ar: 'التقط صورة واضحة للفيش الأنثروبومتري (أقل من 3 أشهر)',
      fr: 'Prenez une photo claire de votre fiche anthropométrique (moins de 3 mois)',
      en: 'Take a clear photo of your criminal record (less than 3 months old)'
    }
  },
  {
    type: 'vehicleFront',
    category: 'vehicle',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png'],
    maxSizeBytes: 15 * 1024 * 1024,
    minWidth: 1200,
    minHeight: 800,
    description: {
      ar: 'صورة السيارة من الأمام',
      fr: 'Photo du véhicule (avant)',
      en: 'Vehicle photo (front)'
    },
    instructions: {
      ar: 'التقط صورة واضحة للسيارة من الأمام مع ظهور لوحة الترقيم',
      fr: 'Prenez une photo claire de l\'avant du véhicule avec la plaque visible',
      en: 'Take a clear photo of the front of your vehicle with visible plate'
    }
  },
  {
    type: 'vehicleBack',
    category: 'vehicle',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png'],
    maxSizeBytes: 15 * 1024 * 1024,
    minWidth: 1200,
    minHeight: 800,
    description: {
      ar: 'صورة السيارة من الخلف',
      fr: 'Photo du véhicule (arrière)',
      en: 'Vehicle photo (back)'
    },
    instructions: {
      ar: 'التقط صورة واضحة للسيارة من الخلف مع ظهور لوحة الترقيم',
      fr: 'Prenez une photo claire de l\'arrière du véhicule avec la plaque visible',
      en: 'Take a clear photo of the back of your vehicle with visible plate'
    }
  },
  {
    type: 'profilePhoto',
    category: 'profile',
    required: false,
    allowedFormats: ['image/jpeg', 'image/png'],
    maxSizeBytes: 5 * 1024 * 1024,
    minWidth: 400,
    minHeight: 400,
    description: {
      ar: 'صورة شخصية',
      fr: 'Photo de profil',
      en: 'Profile photo'
    },
    instructions: {
      ar: 'التقط صورة واضحة لوجهك مع خلفية بيضاء',
      fr: 'Prenez une photo claire de votre visage sur fond clair',
      en: 'Take a clear photo of your face against a light background'
    }
  }
];

// ==================== ADMIN VERIFICATION ====================

export interface DocumentVerification {
  documentId: string;
  status: 'verified' | 'rejected';
  verifiedBy: string;
  verifiedAt: string;
  rejectionReason?: string;
  notes?: string;
  callRequired?: boolean;
  callScheduledAt?: string;
  callCompletedAt?: string;
}

export interface DriverVerificationStatus {
  driverId: string;
  documentsStatus: OverallDocumentStatus;
  documentsVerified: number;
  documentsTotal: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  faceEnrolled: boolean;
  callVerified: boolean;
  isFullyVerified: boolean;
  canDrive: boolean;
  lastUpdated: string;
}

// ==================== BADGE TYPES ====================

export type DocumentBadgeType = 
  | 'not_submitted'         // Documents non envoyés
  | 'pending_verification'  // Documents en cours de vérification
  | 'verified'              // Documents vérifiés
  | 'rejected'              // Documents rejetés
  | 'call_required';        // Appel de vérification requis

export interface DocumentBadge {
  type: DocumentBadgeType;
  label: {
    ar: string;
    fr: string;
    en: string;
  };
  color: string;
  icon: string;
}

export const DOCUMENT_BADGES: Record<DocumentBadgeType, DocumentBadge> = {
  not_submitted: {
    type: 'not_submitted',
    label: {
      ar: 'الوثائق غير مرسلة',
      fr: 'Documents non envoyés',
      en: 'Documents not submitted'
    },
    color: '#F39C12',
    icon: 'alert-circle-outline'
  },
  pending_verification: {
    type: 'pending_verification',
    label: {
      ar: 'الوثائق قيد التحقق',
      fr: 'Documents en vérification',
      en: 'Documents pending verification'
    },
    color: '#3498DB',
    icon: 'clock-outline'
  },
  verified: {
    type: 'verified',
    label: {
      ar: 'الوثائق مُتحقق منها',
      fr: 'Documents vérifiés',
      en: 'Documents verified'
    },
    color: '#27AE60',
    icon: 'check-circle-outline'
  },
  rejected: {
    type: 'rejected',
    label: {
      ar: 'الوثائق مرفوضة',
      fr: 'Documents rejetés',
      en: 'Documents rejected'
    },
    color: '#E74C3C',
    icon: 'close-circle-outline'
  },
  call_required: {
    type: 'call_required',
    label: {
      ar: 'مكالمة تحقق مطلوبة',
      fr: 'Appel de vérification requis',
      en: 'Verification call required'
    },
    color: '#9B59B6',
    icon: 'phone-outline'
  }
};
