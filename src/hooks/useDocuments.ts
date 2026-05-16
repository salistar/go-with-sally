// hooks/useDocuments.ts
// Hook pour la gestion des documents Go With Sally

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  selectDocuments,
  selectDocument,
  selectOverallStatus,
  selectVerificationProgress,
  selectIsLoading,
  selectIsUploading,
  selectError,
  selectUploadProgress,
  selectMissingDocuments,
  selectRejectedDocuments,
  selectPendingDocuments,
  selectSubmittedCount,
  selectVerifiedCount,
  clearError,
  clearUploadProgress,
} from '../store/slices/documentsSlice';
import { documentService, DocumentFile, UploadOptions } from '../services/documentService';
import { 
  Document, 
  DocumentType, 
  OverallDocumentStatus,
  DocumentUploadProgress,
  DOCUMENT_REQUIREMENTS 
} from '../types/documents';
import { DOCUMENT_BADGES, DocumentBadgeType } from '../types/documents';
import { AppDispatch, RootState } from '../store';

// ==================== TYPES ====================

interface UseDocumentsOptions {
  autoFetch?: boolean;
  driverId?: string;
}

interface UseDocumentsReturn {
  // Documents
  documents: Record<DocumentType, Document | null>;
  getDocument: (type: DocumentType) => Document | null;
  
  // Status
  overallStatus: OverallDocumentStatus;
  verificationProgress: number;
  submittedCount: number;
  verifiedCount: number;
  totalCount: number;
  
  // Lists
  missingDocuments: DocumentType[];
  rejectedDocuments: Document[];
  pendingDocuments: Document[];
  
  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Upload progress
  getUploadProgress: (type: DocumentType) => DocumentUploadProgress | null;
  
  // Actions
  refresh: (force?: boolean) => Promise<void>;
  upload: (type: DocumentType, file: DocumentFile, options?: UploadOptions) => Promise<boolean>;
  remove: (type: DocumentType) => Promise<boolean>;
  clearDocumentError: () => void;
  
  // Badge
  getBadgeType: () => DocumentBadgeType;
  getBadgeInfo: () => typeof DOCUMENT_BADGES[DocumentBadgeType];
  
  // Requirements
  getRequirement: (type: DocumentType) => typeof DOCUMENT_REQUIREMENTS[0] | undefined;
  
  // Helpers
  canSubmitForReview: boolean;
  isComplete: boolean;
}

// ==================== HOOK ====================

export function useDocuments(
  options: UseDocumentsOptions = {}
): UseDocumentsReturn {
  const { autoFetch = true, driverId } = options;
  
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const documents = useSelector(selectDocuments);
  const overallStatus = useSelector(selectOverallStatus);
  const verificationProgress = useSelector(selectVerificationProgress);
  const isLoading = useSelector(selectIsLoading);
  const isUploading = useSelector(selectIsUploading);
  const error = useSelector(selectError);
  const missingDocuments = useSelector(selectMissingDocuments);
  const rejectedDocuments = useSelector(selectRejectedDocuments);
  const pendingDocuments = useSelector(selectPendingDocuments);
  const submittedCount = useSelector(selectSubmittedCount);
  const verifiedCount = useSelector(selectVerifiedCount);
  
  // Total documents count
  const totalCount = Object.keys(documents).length;
  
  // ==================== EFFECTS ====================
  
  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchDocuments());
    }
  }, [dispatch, autoFetch]);
  
  // ==================== ACTIONS ====================
  
  const refresh = useCallback(async (force: boolean = false) => {
    await dispatch(fetchDocuments({ forceRefresh: force }));
  }, [dispatch]);
  
  const upload = useCallback(async (
    type: DocumentType,
    file: DocumentFile,
    uploadOptions?: UploadOptions
  ): Promise<boolean> => {
    try {
      const result = await dispatch(uploadDocument({ 
        type, 
        file, 
        options: uploadOptions 
      })).unwrap();
      
      return result.success;
    } catch (error) {
      console.error('[useDocuments] Upload failed:', error);
      return false;
    }
  }, [dispatch]);
  
  const remove = useCallback(async (type: DocumentType): Promise<boolean> => {
    try {
      const result = await dispatch(deleteDocument({ type })).unwrap();
      return result.success;
    } catch (error) {
      console.error('[useDocuments] Delete failed:', error);
      return false;
    }
  }, [dispatch]);
  
  const clearDocumentError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // ==================== GETTERS ====================
  
  const getDocument = useCallback((type: DocumentType): Document | null => {
    return documents[type];
  }, [documents]);
  
  const getUploadProgress = useCallback((type: DocumentType): DocumentUploadProgress | null => {
    return useSelector((state: RootState) => selectUploadProgress(type)(state));
  }, []);
  
  const getRequirement = useCallback((type: DocumentType) => {
    return DOCUMENT_REQUIREMENTS.find(r => r.type === type);
  }, []);
  
  // ==================== BADGE ====================
  
  const getBadgeType = useCallback((): DocumentBadgeType => {
    switch (overallStatus) {
      case 'not_submitted':
        return 'not_submitted';
      case 'partial':
        return 'not_submitted';
      case 'pending_review':
        return 'pending_verification';
      case 'verified':
        return 'verified';
      case 'rejected':
        return 'rejected';
      default:
        return 'not_submitted';
    }
  }, [overallStatus]);
  
  const getBadgeInfo = useCallback(() => {
    return DOCUMENT_BADGES[getBadgeType()];
  }, [getBadgeType]);
  
  // ==================== COMPUTED ====================
  
  // Peut soumettre pour révision (tous les documents sont uploadés)
  const canSubmitForReview = missingDocuments.length === 0 && 
    rejectedDocuments.length === 0;
  
  // Tous les documents sont vérifiés
  const isComplete = overallStatus === 'verified';
  
  return {
    // Documents
    documents,
    getDocument,
    
    // Status
    overallStatus,
    verificationProgress,
    submittedCount,
    verifiedCount,
    totalCount,
    
    // Lists
    missingDocuments,
    rejectedDocuments,
    pendingDocuments,
    
    // Loading states
    isLoading,
    isUploading,
    error,
    
    // Upload progress
    getUploadProgress,
    
    // Actions
    refresh,
    upload,
    remove,
    clearDocumentError,
    
    // Badge
    getBadgeType,
    getBadgeInfo,
    
    // Requirements
    getRequirement,
    
    // Helpers
    canSubmitForReview,
    isComplete,
  };
}

export default useDocuments;
