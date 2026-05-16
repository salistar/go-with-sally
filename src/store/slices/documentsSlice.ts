// store/slices/documentsSlice.ts
// Redux slice pour les documents Go With Sally

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentsState,
  DocumentUploadResponse,
  DocumentUploadProgress,
  OverallDocumentStatus,
  DriverVerificationStatus
} from '../../types/documents';
import { documentService, DocumentFile, UploadOptions } from '../../services/documentService';
import { MOCK_EMPTY_DOCUMENTS_STATE } from '../../mocks/documents.mock';

// ==================== INITIAL STATE ====================

const initialState: DocumentsState = {
  ...MOCK_EMPTY_DOCUMENTS_STATE,
};

// ==================== ASYNC THUNKS ====================

export const fetchDocuments = createAsyncThunk<
  Record<DocumentType, Document | null>,
  { forceRefresh?: boolean } | void,
  { rejectValue: string }
>('documents/fetchAll', async (args, { rejectWithValue }) => {
  try {
    const forceRefresh = args?.forceRefresh ?? false;
    const documents = await documentService.getDocuments(forceRefresh);
    return documents;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch documents');
  }
});

export const uploadDocument = createAsyncThunk<
  DocumentUploadResponse,
  { 
    type: DocumentType; 
    file: DocumentFile; 
    options?: UploadOptions;
  },
  { rejectValue: string }
>('documents/upload', async ({ type, file, options }, { dispatch, rejectWithValue }) => {
  try {
    // Initialiser le progress
    dispatch(setUploadProgress({ 
      documentType: type, 
      progress: 0, 
      status: 'uploading' 
    }));
    
    const result = await documentService.uploadDocument(
      type,
      file,
      (progress) => {
        dispatch(setUploadProgress({ 
          documentType: type, 
          progress, 
          status: 'uploading' 
        }));
      },
      options
    );
    
    if (result.success) {
      dispatch(setUploadProgress({ 
        documentType: type, 
        progress: 100, 
        status: 'complete' 
      }));
    } else {
      dispatch(setUploadProgress({ 
        documentType: type, 
        progress: 0, 
        status: 'error',
        error: result.error 
      }));
    }
    
    return result;
  } catch (error: any) {
    dispatch(setUploadProgress({ 
      documentType: type, 
      progress: 0, 
      status: 'error',
      error: error.message 
    }));
    return rejectWithValue(error.message || 'Failed to upload document');
  }
});

export const deleteDocument = createAsyncThunk<
  { type: DocumentType; success: boolean },
  { type: DocumentType },
  { rejectValue: string }
>('documents/delete', async ({ type }, { rejectWithValue }) => {
  try {
    const result = await documentService.deleteDocument(type);
    return { type, success: result.success };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to delete document');
  }
});

export const fetchDriverVerificationStatus = createAsyncThunk<
  DriverVerificationStatus,
  { driverId: string },
  { rejectValue: string }
>('documents/fetchVerificationStatus', async ({ driverId }, { rejectWithValue }) => {
  try {
    const status = await documentService.getDriverVerificationStatus(driverId);
    return status;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch verification status');
  }
});

// ==================== SLICE ====================

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Set single document
    setDocument: (state, action: PayloadAction<{ type: DocumentType; document: Document | null }>) => {
      state.documents[action.payload.type] = action.payload.document;
      updateOverallStatus(state);
    },
    
    // Update document status
    updateDocumentStatus: (state, action: PayloadAction<{ type: DocumentType; status: DocumentStatus }>) => {
      const doc = state.documents[action.payload.type];
      if (doc) {
        doc.status = action.payload.status;
        if (action.payload.status === 'verified') {
          doc.verifiedAt = new Date().toISOString();
        } else if (action.payload.status === 'rejected') {
          doc.rejectedAt = new Date().toISOString();
        }
      }
      updateOverallStatus(state);
    },
    
    // Set rejection reason
    setRejectionReason: (state, action: PayloadAction<{ type: DocumentType; reason: string }>) => {
      const doc = state.documents[action.payload.type];
      if (doc) {
        doc.rejectionReason = action.payload.reason;
      }
    },
    
    // Upload progress
    setUploadProgress: (state, action: PayloadAction<DocumentUploadProgress>) => {
      state.uploadProgress[action.payload.documentType] = action.payload;
      state.isUploading = action.payload.status === 'uploading';
    },
    
    clearUploadProgress: (state, action: PayloadAction<DocumentType>) => {
      state.uploadProgress[action.payload] = null;
    },
    
    clearAllUploadProgress: (state) => {
      Object.keys(state.uploadProgress).forEach(key => {
        state.uploadProgress[key as DocumentType] = null;
      });
      state.isUploading = false;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Reset
    resetDocumentsState: (state) => {
      return initialState;
    },
    
    // Hydrate from cache
    hydrateDocumentsState: (state, action: PayloadAction<Partial<DocumentsState>>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch Documents
    builder.addCase(fetchDocuments.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDocuments.fulfilled, (state, action) => {
      state.isLoading = false;
      state.documents = action.payload;
      state.lastUpdated = new Date().toISOString();
      updateOverallStatus(state);
    });
    builder.addCase(fetchDocuments.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch documents';
    });
    
    // Upload Document
    builder.addCase(uploadDocument.pending, (state) => {
      state.isUploading = true;
      state.error = null;
    });
    builder.addCase(uploadDocument.fulfilled, (state, action) => {
      state.isUploading = false;
      if (action.payload.success && action.payload.document) {
        state.documents[action.payload.document.type] = action.payload.document;
        updateOverallStatus(state);
      } else {
        state.error = action.payload.error || 'Upload failed';
      }
    });
    builder.addCase(uploadDocument.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload || 'Upload failed';
    });
    
    // Delete Document
    builder.addCase(deleteDocument.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.success) {
        state.documents[action.payload.type] = null;
        updateOverallStatus(state);
      }
    });
    builder.addCase(deleteDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Delete failed';
    });
    
    // Fetch Verification Status
    builder.addCase(fetchDriverVerificationStatus.fulfilled, (state, action) => {
      state.overallStatus = action.payload.documentsStatus;
      state.verificationProgress = (action.payload.documentsVerified / action.payload.documentsTotal) * 100;
    });
  },
});

// ==================== HELPER FUNCTIONS ====================

function updateOverallStatus(state: DocumentsState): void {
  const docs = Object.values(state.documents).filter((d): d is Document => d !== null);
  const totalTypes = Object.keys(state.documents).length;
  
  if (docs.length === 0) {
    state.overallStatus = 'not_submitted';
    state.verificationProgress = 0;
    return;
  }
  
  const hasRejected = docs.some(d => d.status === 'rejected');
  if (hasRejected) {
    state.overallStatus = 'rejected';
  } else {
    const allVerified = docs.length === totalTypes && docs.every(d => d.status === 'verified');
    if (allVerified) {
      state.overallStatus = 'verified';
    } else {
      const allSubmitted = docs.length === totalTypes;
      const hasPending = docs.some(d => d.status === 'pending_review');
      
      if (allSubmitted && hasPending) {
        state.overallStatus = 'pending_review';
      } else {
        state.overallStatus = 'partial';
      }
    }
  }
  
  const verified = docs.filter(d => d.status === 'verified').length;
  state.verificationProgress = Math.round((verified / totalTypes) * 100);
}

// ==================== SELECTORS ====================

export const selectDocuments = (state: { documents: DocumentsState }) => state.documents.documents;
export const selectDocument = (type: DocumentType) => (state: { documents: DocumentsState }) => 
  state.documents.documents[type];
export const selectOverallStatus = (state: { documents: DocumentsState }) => state.documents.overallStatus;
export const selectVerificationProgress = (state: { documents: DocumentsState }) => 
  state.documents.verificationProgress;
export const selectIsLoading = (state: { documents: DocumentsState }) => state.documents.isLoading;
export const selectIsUploading = (state: { documents: DocumentsState }) => state.documents.isUploading;
export const selectError = (state: { documents: DocumentsState }) => state.documents.error;
export const selectUploadProgress = (type: DocumentType) => (state: { documents: DocumentsState }) => 
  state.documents.uploadProgress[type];

export const selectMissingDocuments = (state: { documents: DocumentsState }): DocumentType[] => {
  return (Object.keys(state.documents.documents) as DocumentType[])
    .filter(type => state.documents.documents[type] === null);
};

export const selectRejectedDocuments = (state: { documents: DocumentsState }): Document[] => {
  return Object.values(state.documents.documents)
    .filter((d): d is Document => d !== null && d.status === 'rejected');
};

export const selectPendingDocuments = (state: { documents: DocumentsState }): Document[] => {
  return Object.values(state.documents.documents)
    .filter((d): d is Document => d !== null && d.status === 'pending_review');
};

export const selectSubmittedCount = (state: { documents: DocumentsState }): number => {
  return Object.values(state.documents.documents)
    .filter((d): d is Document => d !== null).length;
};

export const selectVerifiedCount = (state: { documents: DocumentsState }): number => {
  return Object.values(state.documents.documents)
    .filter((d): d is Document => d !== null && d.status === 'verified').length;
};

export const {
  setDocument,
  updateDocumentStatus,
  setRejectionReason,
  setUploadProgress,
  clearUploadProgress,
  clearAllUploadProgress,
  setError,
  clearError,
  setLoading,
  resetDocumentsState,
  hydrateDocumentsState,
} = documentsSlice.actions;

export default documentsSlice.reducer;