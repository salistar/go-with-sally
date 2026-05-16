// mocks/documents.mock.ts
// Mock data pour les documents Go With Sally

import { 
  Document, 
  DocumentType, 
  DocumentStatus, 
  DocumentUploadResponse,
  DocumentsState,
  OverallDocumentStatus,
  DriverVerificationStatus,
  DocumentVerification
} from '../types/documents';
import { DOCUMENTS_DISPLAY_ORDER } from '../constants/documents';

// ==================== MOCK CONFIGURATION ====================

export const MOCK_DOCUMENTS_CONFIG = {
  uploadDelay: 2000,
  verificationDelay: 1000,
  uploadSuccessRate: 0.95,
  simulateProgress: true,
};

// ==================== MOCK DOCUMENTS ====================

const createMockDocument = (
  type: DocumentType, 
  status: DocumentStatus = 'not_submitted'
): Document => ({
  id: `doc_${type}_${Date.now()}`,
  type,
  category: getDocumentCategory(type),
  status,
  url: status !== 'not_submitted' ? `https://storage.gowithsally.ma/documents/${type}_sample.jpg` : null,
  thumbnailUrl: status !== 'not_submitted' ? `https://storage.gowithsally.ma/documents/${type}_thumb.jpg` : null,
  uploadedAt: status !== 'not_submitted' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
  verifiedAt: status === 'verified' ? new Date().toISOString() : null,
  rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
  rejectionReason: status === 'rejected' ? 'Image floue, veuillez renvoyer une photo plus nette' : null,
  expiryDate: type === 'insurance' ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() : null,
  metadata: {
    fileName: `${type}.jpg`,
    fileSize: 1024 * 1024 * (1 + Math.random() * 4),
    mimeType: 'image/jpeg',
    width: 1200,
    height: 900,
  },
});

function getDocumentCategory(type: DocumentType): Document['category'] {
  const categoryMap: Record<DocumentType, Document['category']> = {
    drivingLicense: 'identity',
    drivingLicenseBack: 'identity',
    nationalId: 'identity',
    nationalIdBack: 'identity',
    vehicleRegistration: 'vehicle',
    insurance: 'vehicle',
    criminalRecord: 'legal',
    vehicleFront: 'vehicle',
    vehicleBack: 'vehicle',
    profilePhoto: 'profile',
  };
  return categoryMap[type];
}

// ==================== MOCK STATES ====================

// État initial - aucun document
export const MOCK_EMPTY_DOCUMENTS_STATE: DocumentsState = {
  documents: {
    drivingLicense: null,
    drivingLicenseBack: null,
    nationalId: null,
    nationalIdBack: null,
    vehicleRegistration: null,
    insurance: null,
    criminalRecord: null,
    vehicleFront: null,
    vehicleBack: null,
    profilePhoto: null,
  },
  uploadProgress: {
    drivingLicense: null,
    drivingLicenseBack: null,
    nationalId: null,
    nationalIdBack: null,
    vehicleRegistration: null,
    insurance: null,
    criminalRecord: null,
    vehicleFront: null,
    vehicleBack: null,
    profilePhoto: null,
  },
  isLoading: false,
  isUploading: false,
  error: null,
  overallStatus: 'not_submitted',
  verificationProgress: 0,
  lastUpdated: null,
};

// État partiel - quelques documents soumis
export const MOCK_PARTIAL_DOCUMENTS: Record<DocumentType, Document | null> = {
  drivingLicense: createMockDocument('drivingLicense', 'pending_review'),
  drivingLicenseBack: createMockDocument('drivingLicenseBack', 'pending_review'),
  nationalId: createMockDocument('nationalId', 'verified'),
  nationalIdBack: createMockDocument('nationalIdBack', 'verified'),
  vehicleRegistration: null,
  insurance: null,
  criminalRecord: null,
  vehicleFront: createMockDocument('vehicleFront', 'pending_review'),
  vehicleBack: null,
  profilePhoto: createMockDocument('profilePhoto', 'verified'),
};

// État complet - tous les documents vérifiés
export const MOCK_VERIFIED_DOCUMENTS: Record<DocumentType, Document | null> = {
  drivingLicense: createMockDocument('drivingLicense', 'verified'),
  drivingLicenseBack: createMockDocument('drivingLicenseBack', 'verified'),
  nationalId: createMockDocument('nationalId', 'verified'),
  nationalIdBack: createMockDocument('nationalIdBack', 'verified'),
  vehicleRegistration: createMockDocument('vehicleRegistration', 'verified'),
  insurance: createMockDocument('insurance', 'verified'),
  criminalRecord: createMockDocument('criminalRecord', 'verified'),
  vehicleFront: createMockDocument('vehicleFront', 'verified'),
  vehicleBack: createMockDocument('vehicleBack', 'verified'),
  profilePhoto: createMockDocument('profilePhoto', 'verified'),
};

// État avec rejet - un document rejeté
export const MOCK_REJECTED_DOCUMENTS: Record<DocumentType, Document | null> = {
  ...MOCK_PARTIAL_DOCUMENTS,
  drivingLicense: createMockDocument('drivingLicense', 'rejected'),
};

// ==================== MOCK API FUNCTIONS ====================

export const mockUploadDocument = async (
  type: DocumentType,
  file: { uri: string; type: string; name: string },
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> => {
  // Simuler le progrès d'upload
  if (MOCK_DOCUMENTS_CONFIG.simulateProgress && onProgress) {
    for (let i = 0; i <= 100; i += 10) {
      await delay(MOCK_DOCUMENTS_CONFIG.uploadDelay / 10);
      onProgress(i);
    }
  } else {
    await delay(MOCK_DOCUMENTS_CONFIG.uploadDelay);
  }
  
  // Simuler le taux de succès
  if (Math.random() < MOCK_DOCUMENTS_CONFIG.uploadSuccessRate) {
    const document = createMockDocument(type, 'pending_review');
    document.url = file.uri;
    document.uploadedAt = new Date().toISOString();
    
    return {
      success: true,
      document,
      message: 'Document uploaded successfully',
    };
  } else {
    return {
      success: false,
      error: 'upload_failed',
      message: 'Failed to upload document. Please try again.',
    };
  }
};

export const mockDeleteDocument = async (documentId: string): Promise<{ success: boolean }> => {
  await delay(500);
  return { success: true };
};

export const mockGetDocuments = async (): Promise<Record<DocumentType, Document | null>> => {
  await delay(1000);
  return MOCK_PARTIAL_DOCUMENTS;
};

export const mockGetDocumentStatus = async (): Promise<OverallDocumentStatus> => {
  await delay(500);
  return calculateOverallStatus(MOCK_PARTIAL_DOCUMENTS);
};

// ==================== MOCK ADMIN FUNCTIONS ====================

export const mockVerifyDocument = async (
  documentId: string,
  status: 'verified' | 'rejected',
  rejectionReason?: string
): Promise<DocumentVerification> => {
  await delay(MOCK_DOCUMENTS_CONFIG.verificationDelay);
  
  return {
    documentId,
    status,
    verifiedBy: 'admin_001',
    verifiedAt: new Date().toISOString(),
    rejectionReason,
    notes: status === 'verified' ? 'Document validated' : undefined,
  };
};

export const mockGetPendingDocuments = async (): Promise<Document[]> => {
  await delay(1000);
  
  return Object.values(MOCK_PARTIAL_DOCUMENTS)
    .filter((doc): doc is Document => doc !== null && doc.status === 'pending_review');
};

export const mockScheduleVerificationCall = async (
  driverId: string,
  scheduledAt: string
): Promise<{ success: boolean; callId: string }> => {
  await delay(500);
  
  return {
    success: true,
    callId: `call_${Date.now()}`,
  };
};

// ==================== MOCK DRIVER VERIFICATION STATUS ====================

export const MOCK_DRIVER_VERIFICATION_STATUSES: Record<string, DriverVerificationStatus> = {
  driver_new: {
    driverId: 'driver_001',
    documentsStatus: 'not_submitted',
    documentsVerified: 0,
    documentsTotal: 10,
    phoneVerified: true,
    emailVerified: true,
    faceEnrolled: false,
    callVerified: false,
    isFullyVerified: false,
    canDrive: false,
    lastUpdated: new Date().toISOString(),
  },
  driver_partial: {
    driverId: 'driver_002',
    documentsStatus: 'partial',
    documentsVerified: 4,
    documentsTotal: 10,
    phoneVerified: true,
    emailVerified: true,
    faceEnrolled: true,
    callVerified: false,
    isFullyVerified: false,
    canDrive: false,
    lastUpdated: new Date().toISOString(),
  },
  driver_pending: {
    driverId: 'driver_003',
    documentsStatus: 'pending_review',
    documentsVerified: 0,
    documentsTotal: 10,
    phoneVerified: true,
    emailVerified: true,
    faceEnrolled: true,
    callVerified: false,
    isFullyVerified: false,
    canDrive: false,
    lastUpdated: new Date().toISOString(),
  },
  driver_verified: {
    driverId: 'driver_004',
    documentsStatus: 'verified',
    documentsVerified: 10,
    documentsTotal: 10,
    phoneVerified: true,
    emailVerified: true,
    faceEnrolled: true,
    callVerified: true,
    isFullyVerified: true,
    canDrive: true,
    lastUpdated: new Date().toISOString(),
  },
};

export const mockGetDriverVerificationStatus = async (
  driverId: string
): Promise<DriverVerificationStatus> => {
  await delay(500);
  
  return MOCK_DRIVER_VERIFICATION_STATUSES.driver_partial;
};

// ==================== HELPER FUNCTIONS ====================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateOverallStatus(
  documents: Record<DocumentType, Document | null>
): OverallDocumentStatus {
  const docs = Object.values(documents).filter((d): d is Document => d !== null);
  
  if (docs.length === 0) {
    return 'not_submitted';
  }
  
  const hasRejected = docs.some(d => d.status === 'rejected');
  if (hasRejected) {
    return 'rejected';
  }
  
  const allVerified = docs.length === 10 && docs.every(d => d.status === 'verified');
  if (allVerified) {
    return 'verified';
  }
  
  const hasPending = docs.some(d => d.status === 'pending_review');
  if (hasPending && docs.length === 10) {
    return 'pending_review';
  }
  
  return 'partial';
}

// ==================== MOCK SERVICE CLASS ====================

export class MockDocumentService {
  private documents: Record<DocumentType, Document | null> = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
  
  async uploadDocument(
    type: DocumentType,
    file: { uri: string; type: string; name: string },
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse> {
    const response = await mockUploadDocument(type, file, onProgress);
    
    if (response.success && response.document) {
      this.documents[type] = response.document;
    }
    
    return response;
  }
  
  async deleteDocument(type: DocumentType): Promise<{ success: boolean }> {
    await delay(500);
    this.documents[type] = null;
    return { success: true };
  }
  
  async getDocuments(): Promise<Record<DocumentType, Document | null>> {
    await delay(500);
    return { ...this.documents };
  }
  
  async getOverallStatus(): Promise<OverallDocumentStatus> {
    return calculateOverallStatus(this.documents);
  }
  
  getVerificationProgress(): number {
    const docs = Object.values(this.documents).filter((d): d is Document => d !== null);
    const verified = docs.filter(d => d.status === 'verified').length;
    return (verified / 10) * 100;
  }
  
  reset(): void {
    this.documents = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
  }
  
  // Pour les tests - charger un état prédéfini
  loadState(state: 'empty' | 'partial' | 'verified' | 'rejected'): void {
    switch (state) {
      case 'empty':
        this.documents = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
        break;
      case 'partial':
        this.documents = { ...MOCK_PARTIAL_DOCUMENTS };
        break;
      case 'verified':
        this.documents = { ...MOCK_VERIFIED_DOCUMENTS };
        break;
      case 'rejected':
        this.documents = { ...MOCK_REJECTED_DOCUMENTS };
        break;
    }
  }
}

export const mockDocumentService = new MockDocumentService();

// ==================== ENHANCED MOCK DATA FOR MULTIPLE DRIVERS ====================

/**
 * Comprehensive mock documents for different driver verification scenarios
 * Includes realistic Moroccan document data
 */

export const MOCK_DRIVER_DOCUMENTS: Record<string, Record<DocumentType, Document | null>> = {
  // Driver 1: Fully verified (elite status)
  driver_001: {
    drivingLicense: {
      id: 'doc_dl_001',
      type: 'drivingLicense',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/dl_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/dl_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'driving_license.jpg',
        fileSize: 2048576,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    drivingLicenseBack: {
      id: 'doc_dlb_001',
      type: 'drivingLicenseBack',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/dlb_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/dlb_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'driving_license_back.jpg',
        fileSize: 2097152,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    nationalId: {
      id: 'doc_nid_001',
      type: 'nationalId',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nid_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nid_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'national_id.jpg',
        fileSize: 1867776,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    nationalIdBack: {
      id: 'doc_nidb_001',
      type: 'nationalIdBack',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nidb_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nidb_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'national_id_back.jpg',
        fileSize: 1921024,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    vehicleRegistration: {
      id: 'doc_vreg_001',
      type: 'vehicleRegistration',
      category: 'vehicle',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/vreg_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/vreg_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'vehicle_registration.jpg',
        fileSize: 1810432,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    insurance: {
      id: 'doc_ins_001',
      type: 'insurance',
      category: 'vehicle',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/ins_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/ins_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'insurance.jpg',
        fileSize: 1728512,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    criminalRecord: {
      id: 'doc_cr_001',
      type: 'criminalRecord',
      category: 'legal',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/cr_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/cr_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'criminal_record.jpg',
        fileSize: 1572864,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    vehicleFront: {
      id: 'doc_vf_001',
      type: 'vehicleFront',
      category: 'vehicle',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/vf_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/vf_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'vehicle_front.jpg',
        fileSize: 3670016,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
      },
    },
    vehicleBack: {
      id: 'doc_vb_001',
      type: 'vehicleBack',
      category: 'vehicle',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/vb_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/vb_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'vehicle_back.jpg',
        fileSize: 3538944,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
      },
    },
    profilePhoto: {
      id: 'doc_pp_001',
      type: 'profilePhoto',
      category: 'profile',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/pp_001.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/pp_001_thumb.jpg',
      uploadedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'profile_photo.jpg',
        fileSize: 1269760,
        mimeType: 'image/jpeg',
        width: 800,
        height: 800,
      },
    },
  },

  // Driver 2: Partial documents (some pending)
  driver_002: {
    drivingLicense: {
      id: 'doc_dl_002',
      type: 'drivingLicense',
      category: 'identity',
      status: 'pending',
      url: 'https://storage.gowithsally.ma/documents/dl_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/dl_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'driving_license.jpg',
        fileSize: 2252800,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    drivingLicenseBack: null,
    nationalId: {
      id: 'doc_nid_002',
      type: 'nationalId',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nid_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nid_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'national_id.jpg',
        fileSize: 2052096,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    nationalIdBack: {
      id: 'doc_nidb_002',
      type: 'nationalIdBack',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nidb_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nidb_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'national_id_back.jpg',
        fileSize: 2088960,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    vehicleRegistration: {
      id: 'doc_vreg_002',
      type: 'vehicleRegistration',
      category: 'vehicle',
      status: 'pending',
      url: 'https://storage.gowithsally.ma/documents/vreg_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/vreg_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'vehicle_registration.jpg',
        fileSize: 1925120,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    insurance: null,
    criminalRecord: null,
    vehicleFront: {
      id: 'doc_vf_002',
      type: 'vehicleFront',
      category: 'vehicle',
      status: 'pending',
      url: 'https://storage.gowithsally.ma/documents/vf_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/vf_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'vehicle_front.jpg',
        fileSize: 3858432,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
      },
    },
    vehicleBack: null,
    profilePhoto: {
      id: 'doc_pp_002',
      type: 'profilePhoto',
      category: 'profile',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/pp_002.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/pp_002_thumb.jpg',
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'profile_photo.jpg',
        fileSize: 1146880,
        mimeType: 'image/jpeg',
        width: 800,
        height: 800,
      },
    },
  },

  // Driver 3: Has rejected document
  driver_003: {
    drivingLicense: {
      id: 'doc_dl_003',
      type: 'drivingLicense',
      category: 'identity',
      status: 'rejected',
      url: 'https://storage.gowithsally.ma/documents/dl_003.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/dl_003_thumb.jpg',
      uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: null,
      rejectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      rejectionReason: 'Image floue, veuillez renvoyer une photo plus nette',
      expiryDate: null,
      metadata: {
        fileName: 'driving_license.jpg',
        fileSize: 2228224,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    drivingLicenseBack: null,
    nationalId: {
      id: 'doc_nid_003',
      type: 'nationalId',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nid_003.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nid_003_thumb.jpg',
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        fileName: 'national_id.jpg',
        fileSize: 1974272,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    nationalIdBack: {
      id: 'doc_nidb_003',
      type: 'nationalIdBack',
      category: 'identity',
      status: 'verified',
      url: 'https://storage.gowithsally.ma/documents/nidb_003.jpg',
      thumbnailUrl: 'https://storage.gowithsally.ma/documents/nidb_003_thumb.jpg',
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      rejectedAt: null,
      rejectionReason: null,
      expiryDate: null,
      metadata: {
        fileName: 'national_id_back.jpg',
        fileSize: 2011136,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
    },
    vehicleRegistration: null,
    insurance: null,
    criminalRecord: null,
    vehicleFront: null,
    vehicleBack: null,
    profilePhoto: null,
  },
};