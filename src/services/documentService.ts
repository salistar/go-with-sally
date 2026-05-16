// services/documentService.ts
// Service de gestion des documents Go With Sally

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { 
  Document, 
  DocumentType, 
  DocumentStatus,
  DocumentUploadResponse,
  DocumentsState,
  OverallDocumentStatus,
  DriverVerificationStatus,
  DOCUMENT_REQUIREMENTS
} from '../types/documents';
import { 
  DOCUMENTS_CONFIG, 
  DOCUMENTS_STORAGE_KEYS,
  DOCUMENTS_ENDPOINTS,
  DOCUMENT_TYPES_INFO
} from '../constants/documents';
import { 
  mockUploadDocument, 
  mockDeleteDocument, 
  mockGetDocuments,
  mockGetDriverVerificationStatus,
  MOCK_EMPTY_DOCUMENTS_STATE 
} from '../mocks/documents.mock';
import { APP_MODE, IS_OFFLINE, IS_HYBRID, API_URL } from '../config/appMode';

// ==================== TYPES ====================

export interface UploadOptions {
  compress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DocumentFile {
  uri: string;
  type: string;
  name: string;
}

// ==================== SERVICE ====================

class DocumentService {
  private documents: Record<DocumentType, Document | null> = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
  private authToken: string | null = null;
  
  // ==================== INITIALIZATION ====================
  
  async initialize(token?: string): Promise<void> {
    console.log('[DocumentService] Initializing...');
    
    if (token) {
      this.authToken = token;
    }
    
    // Charger le cache local
    try {
      const cached = await AsyncStorage.getItem(DOCUMENTS_STORAGE_KEYS.DOCUMENTS_CACHE);
      if (cached) {
        this.documents = JSON.parse(cached);
      }
    } catch (error) {
      console.error('[DocumentService] Init error:', error);
    }
  }
  
  setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  // ==================== UPLOAD DOCUMENT ====================
  
  async uploadDocument(
    type: DocumentType,
    file: DocumentFile,
    onProgress?: (progress: number) => void,
    options: UploadOptions = {}
  ): Promise<DocumentUploadResponse> {
    console.log(`[DocumentService] Uploading ${type}...`);
    
    try {
      // Valider le fichier
      const validation = await this.validateFile(type, file);
      if (!validation.valid) {
        return {
          success: false,
          error: 'validation_failed',
          message: validation.error,
        };
      }
      
      // Compresser l'image si nécessaire
      let processedFile = file;
      if (options.compress !== false && file.type.startsWith('image/')) {
        processedFile = await this.compressImage(file, options);
      }
      
      let result: DocumentUploadResponse;
      
      if (IS_OFFLINE) {
        // Mode OFFLINE - Simulation locale
        result = await mockUploadDocument(type, processedFile, onProgress);
      } else if (IS_HYBRID) {
        // Mode HYBRID - Upload vers API avec mock processing
        result = await this.uploadToAPI(type, processedFile, onProgress, true);
      } else {
        // Mode ONLINE - Production
        result = await this.uploadToAPI(type, processedFile, onProgress, false);
      }
      
      if (result.success && result.document) {
        this.documents[type] = result.document;
        await this.saveToCache();
      }
      
      return result;
    } catch (error) {
      console.error(`[DocumentService] Upload error for ${type}:`, error);
      return {
        success: false,
        error: 'upload_failed',
        message: 'Failed to upload document. Please try again.',
      };
    }
  }
  
  private async uploadToAPI(
    type: DocumentType,
    file: DocumentFile,
    onProgress?: (progress: number) => void,
    isHybrid: boolean = false
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (isHybrid) {
      headers['X-App-Mode'] = 'hybrid';
    }
    
    // Note: Pour le progress réel, il faudrait utiliser XMLHttpRequest
    // ou une librairie comme axios avec onUploadProgress
    if (onProgress) {
      onProgress(50); // Simulation
    }
    
    const response = await fetch(`${API_URL}${DOCUMENTS_ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (onProgress) {
      onProgress(100);
    }
    
    return await response.json();
  }
  
  // ==================== DELETE DOCUMENT ====================
  
  async deleteDocument(type: DocumentType): Promise<{ success: boolean; error?: string }> {
    console.log(`[DocumentService] Deleting ${type}...`);
    
    const document = this.documents[type];
    if (!document) {
      return { success: true }; // Rien à supprimer
    }
    
    try {
      if (IS_OFFLINE) {
        await mockDeleteDocument(document.id);
      } else {
        const endpoint = DOCUMENTS_ENDPOINTS.DELETE.replace(':id', document.id);
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
        
        if (!response.ok) {
          throw new Error('Delete failed');
        }
      }
      
      this.documents[type] = null;
      await this.saveToCache();
      
      return { success: true };
    } catch (error) {
      console.error(`[DocumentService] Delete error for ${type}:`, error);
      return { success: false, error: 'Failed to delete document' };
    }
  }
  
  // ==================== GET DOCUMENTS ====================
  
  async getDocuments(forceRefresh: boolean = false): Promise<Record<DocumentType, Document | null>> {
    console.log('[DocumentService] Getting documents...');
    
    if (!forceRefresh && Object.values(this.documents).some(d => d !== null)) {
      return this.documents;
    }
    
    try {
      if (IS_OFFLINE) {
        this.documents = await mockGetDocuments();
      } else {
        const response = await fetch(`${API_URL}${DOCUMENTS_ENDPOINTS.LIST}`, {
          method: 'GET',
          headers: this.getHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          this.documents = this.transformAPIResponse(data.documents);
        }
      }
      
      await this.saveToCache();
      return this.documents;
    } catch (error) {
      console.error('[DocumentService] Get documents error:', error);
      return this.documents;
    }
  }
  
  getDocument(type: DocumentType): Document | null {
    return this.documents[type];
  }
  
  // ==================== STATUS ====================
  
  getOverallStatus(): OverallDocumentStatus {
    const docs = Object.values(this.documents).filter((d): d is Document => d !== null);
    
    if (docs.length === 0) {
      return 'not_submitted';
    }
    
    const hasRejected = docs.some(d => d.status === 'rejected');
    if (hasRejected) {
      return 'rejected';
    }
    
    const allTypes = Object.keys(this.documents) as DocumentType[];
    const allSubmitted = allTypes.every(type => this.documents[type] !== null);
    const allVerified = docs.every(d => d.status === 'verified');
    
    if (allSubmitted && allVerified) {
      return 'verified';
    }
    
    const hasPending = docs.some(d => d.status === 'pending_review');
    if (allSubmitted && hasPending) {
      return 'pending_review';
    }
    
    return 'partial';
  }
  
  getVerificationProgress(): number {
    const docs = Object.values(this.documents).filter((d): d is Document => d !== null);
    const verified = docs.filter(d => d.status === 'verified').length;
    const total = Object.keys(this.documents).length;
    return Math.round((verified / total) * 100);
  }
  
  getSubmissionProgress(): number {
    const docs = Object.values(this.documents).filter((d): d is Document => d !== null);
    const total = Object.keys(this.documents).length;
    return Math.round((docs.length / total) * 100);
  }
  
  getMissingDocuments(): DocumentType[] {
    return (Object.keys(this.documents) as DocumentType[])
      .filter(type => this.documents[type] === null);
  }
  
  getRejectedDocuments(): Document[] {
    return Object.values(this.documents)
      .filter((d): d is Document => d !== null && d.status === 'rejected');
  }
  
  getPendingDocuments(): Document[] {
    return Object.values(this.documents)
      .filter((d): d is Document => d !== null && d.status === 'pending_review');
  }
  
  async getDriverVerificationStatus(driverId: string): Promise<DriverVerificationStatus> {
    if (IS_OFFLINE || IS_HYBRID) {
      return await mockGetDriverVerificationStatus(driverId);
    }
    
    const response = await fetch(`${API_URL}/drivers/${driverId}/verification-status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return await response.json();
  }
  
  // ==================== VALIDATION ====================
  
  async validateFile(
    type: DocumentType,
    file: DocumentFile
  ): Promise<{ valid: boolean; error?: string }> {
    const requirement = DOCUMENT_REQUIREMENTS.find(r => r.type === type);
    if (!requirement) {
      return { valid: false, error: 'Unknown document type' };
    }
    
    // Vérifier le type MIME
    if (!requirement.allowedFormats.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file format. Allowed: ${requirement.allowedFormats.join(', ')}` 
      };
    }
    
    // Vérifier la taille du fichier
    try {
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        if (fileInfo.size > requirement.maxSizeBytes) {
          const maxMB = requirement.maxSizeBytes / (1024 * 1024);
          return { valid: false, error: `File too large. Maximum: ${maxMB}MB` };
        }
      }
    } catch (error) {
      console.warn('[DocumentService] Could not check file size:', error);
    }
    
    return { valid: true };
  }
  
  // ==================== IMAGE PROCESSING ====================
  
  private async compressImage(
    file: DocumentFile,
    options: UploadOptions
  ): Promise<DocumentFile> {
    try {
      const actions: ImageManipulator.Action[] = [];
      
      // Redimensionner si nécessaire
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
        });
      }
      
      const result = await ImageManipulator.manipulateAsync(
        file.uri,
        actions,
        {
          compress: options.quality || DOCUMENTS_CONFIG.IMAGE_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      return {
        uri: result.uri,
        type: 'image/jpeg',
        name: file.name.replace(/\.[^.]+$/, '.jpg'),
      };
    } catch (error) {
      console.warn('[DocumentService] Compression failed, using original:', error);
      return file;
    }
  }
  
  // ==================== HELPERS ====================
  
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    if (IS_HYBRID) {
      headers['X-App-Mode'] = 'hybrid';
    }
    
    return headers;
  }
  
  private async saveToCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        DOCUMENTS_STORAGE_KEYS.DOCUMENTS_CACHE,
        JSON.stringify(this.documents)
      );
      await AsyncStorage.setItem(
        DOCUMENTS_STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[DocumentService] Cache save error:', error);
    }
  }
  
  private transformAPIResponse(apiDocs: any[]): Record<DocumentType, Document | null> {
    const result: Record<DocumentType, Document | null> = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
    
    for (const doc of apiDocs) {
      if (doc.type in result) {
        result[doc.type as DocumentType] = doc;
      }
    }
    
    return result;
  }
  
  // ==================== CACHE ====================
  
  async clearCache(): Promise<void> {
    this.documents = { ...MOCK_EMPTY_DOCUMENTS_STATE.documents };
    await AsyncStorage.removeItem(DOCUMENTS_STORAGE_KEYS.DOCUMENTS_CACHE);
    await AsyncStorage.removeItem(DOCUMENTS_STORAGE_KEYS.LAST_SYNC);
  }
  
  async getLastSyncTime(): Promise<string | null> {
    return await AsyncStorage.getItem(DOCUMENTS_STORAGE_KEYS.LAST_SYNC);
  }
  
  // ==================== STATE ====================
  
  getState(): DocumentsState {
    return {
      documents: { ...this.documents },
      uploadProgress: {} as any,
      isLoading: false,
      isUploading: false,
      error: null,
      overallStatus: this.getOverallStatus(),
      verificationProgress: this.getVerificationProgress(),
      lastUpdated: null,
    };
  }
}

export const documentService = new DocumentService();
export default documentService;