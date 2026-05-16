/**
 * GO WITH SALLY - GENDER VERIFICATION SERVICE
 * Service de vérification du genre pour garantir un service femme-only
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export type Gender = 'female' | 'male' | 'other' | 'unknown';

export type VerificationMethod = 'selfie' | 'document' | 'manual' | 'ai';

export type VerificationStatus = 
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'requires_review';

export interface GenderVerificationResult {
  isVerified: boolean;
  status: VerificationStatus;
  gender: Gender;
  confidence: number; // 0-100
  method: VerificationMethod;
  verifiedAt: string | null;
  expiresAt: string | null;
  rejectionReason?: string;
  requiresManualReview?: boolean;
}

export interface GenderAnalysisResult {
  gender: Gender;
  confidence: number;
  isFemale: boolean;
  faceDetected: boolean;
  analysisTime: number;
  rawScore?: {
    female: number;
    male: number;
  };
}

export interface DocumentVerificationResult {
  isValid: boolean;
  documentType: 'cin' | 'passport' | 'driving_license' | 'unknown';
  gender: Gender;
  confidence: number;
  extractedData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
  };
  error?: string;
}

export interface VerificationRequest {
  userId: string;
  imageUri?: string;
  documentUri?: string;
  selfDeclaration?: boolean;
}

export interface VerificationHistory {
  id: string;
  userId: string;
  method: VerificationMethod;
  status: VerificationStatus;
  result: Gender;
  confidence: number;
  createdAt: string;
  reviewedBy?: string;
  notes?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  VERIFICATION_STATUS: '@sally/gender_verification_status',
  VERIFICATION_RESULT: '@sally/gender_verification_result',
  VERIFICATION_HISTORY: '@sally/gender_verification_history',
  LAST_CHECK: '@sally/gender_last_check',
};

const VERIFICATION_EXPIRY_DAYS = 365; // 1 an
const MIN_CONFIDENCE_THRESHOLD = 85; // Seuil de confiance minimum

// ============================================================================
// SERVICE CLASS
// ============================================================================

class GenderVerificationService {
  private isInitialized = false;

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[GenderVerificationService] 🚀 Initialisation...');
    
    const result = await this.getStoredVerification();
    if (result) {
      console.log('[GenderVerificationService] ✅ Vérification existante:', result.status);
    }
    
    this.isInitialized = true;
  }

  // ==========================================================================
  // VERIFICATION METHODS
  // ==========================================================================

  /**
   * Vérifie le genre via selfie avec IA
   */
  async verifyWithSelfie(params: {
    userId: string;
    imageUri: string;
  }): Promise<GenderVerificationResult> {
    console.log('[GenderVerificationService] 📸 Vérification par selfie...');
    
    try {
      await this.simulateApiDelay(1500);
      
      // Simuler une vérification réussie
      const result: GenderVerificationResult = {
        isVerified: true,
        status: 'verified',
        gender: 'female',
        confidence: 95,
        method: 'selfie',
        verifiedAt: new Date().toISOString(),
        expiresAt: this.calculateExpiryDate(),
      };
      
      await this.storeVerification(result);
      await this.addToHistory({
        id: this.generateId(),
        userId: params.userId,
        method: 'selfie',
        status: 'verified',
        result: 'female',
        confidence: 95,
        createdAt: new Date().toISOString(),
      });
      
      console.log('[GenderVerificationService] ✅ Selfie vérifié avec succès');
      return result;
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Erreur selfie:', error.message);
      return {
        isVerified: false,
        status: 'rejected',
        gender: 'unknown',
        confidence: 0,
        method: 'selfie',
        verifiedAt: null,
        expiresAt: null,
        rejectionReason: error.message,
      };
    }
  }

  /**
   * Vérifie le genre via document d'identité
   */
  async verifyWithDocument(params: {
    userId: string;
    documentUri: string;
    documentType: 'cin' | 'passport' | 'driving_license';
  }): Promise<GenderVerificationResult> {
    console.log('[GenderVerificationService] 📄 Vérification par document...');
    
    try {
      await this.simulateApiDelay(2000);
      
      const result: GenderVerificationResult = {
        isVerified: true,
        status: 'verified',
        gender: 'female',
        confidence: 98,
        method: 'document',
        verifiedAt: new Date().toISOString(),
        expiresAt: this.calculateExpiryDate(),
      };
      
      await this.storeVerification(result);
      await this.addToHistory({
        id: this.generateId(),
        userId: params.userId,
        method: 'document',
        status: 'verified',
        result: 'female',
        confidence: 98,
        createdAt: new Date().toISOString(),
      });
      
      console.log('[GenderVerificationService] ✅ Document vérifié avec succès');
      return result;
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Erreur document:', error.message);
      return {
        isVerified: false,
        status: 'rejected',
        gender: 'unknown',
        confidence: 0,
        method: 'document',
        verifiedAt: null,
        expiresAt: null,
        rejectionReason: error.message,
      };
    }
  }

  /**
   * Auto-déclaration du genre (nécessite vérification ultérieure)
   */
  async selfDeclare(params: {
    userId: string;
    declaredGender: Gender;
  }): Promise<GenderVerificationResult> {
    console.log('[GenderVerificationService] ✋ Auto-déclaration...');
    
    if (params.declaredGender !== 'female') {
      return {
        isVerified: false,
        status: 'rejected',
        gender: params.declaredGender,
        confidence: 100,
        method: 'manual',
        verifiedAt: null,
        expiresAt: null,
        rejectionReason: 'Sally est un service réservé aux femmes',
      };
    }
    
    const result: GenderVerificationResult = {
      isVerified: false,
      status: 'pending',
      gender: 'female',
      confidence: 50,
      method: 'manual',
      verifiedAt: null,
      expiresAt: null,
      requiresManualReview: true,
    };
    
    await this.storeVerification(result);
    
    console.log('[GenderVerificationService] ⏳ Auto-déclaration en attente de vérification');
    return result;
  }

  /**
   * Analyse le genre à partir d'une image de visage
   */
  async analyzeGenderFromFace(imageUri: string): Promise<GenderAnalysisResult> {
    console.log('[GenderVerificationService] 🔍 Analyse du visage...');
    
    const startTime = Date.now();
    
    try {
      await this.simulateApiDelay(1200);
      
      // Simulation d'analyse IA - en production, appeler AWS Rekognition, Azure Face, etc.
      const femaleScore = 0.92 + Math.random() * 0.06; // 92-98%
      const maleScore = 1 - femaleScore;
      
      const result: GenderAnalysisResult = {
        gender: femaleScore > 0.5 ? 'female' : 'male',
        confidence: Math.round(Math.max(femaleScore, maleScore) * 100),
        isFemale: femaleScore > 0.5,
        faceDetected: true,
        analysisTime: Date.now() - startTime,
        rawScore: {
          female: Math.round(femaleScore * 100),
          male: Math.round(maleScore * 100),
        },
      };
      
      console.log('[GenderVerificationService] ✅ Analyse terminée:', result.gender, result.confidence + '%');
      return result;
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Erreur analyse:', error.message);
      return {
        gender: 'unknown',
        confidence: 0,
        isFemale: false,
        faceDetected: false,
        analysisTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Vérifie si l'image est celle d'une femme
   */
  async verifyIsFemale(imageUri: string): Promise<{
    isFemale: boolean;
    confidence: number;
    message: string;
  }> {
    console.log('[GenderVerificationService] 👩 Vérification femme...');
    
    const analysis = await this.analyzeGenderFromFace(imageUri);
    
    if (!analysis.faceDetected) {
      return {
        isFemale: false,
        confidence: 0,
        message: 'Aucun visage détecté dans l\'image',
      };
    }
    
    if (analysis.isFemale && analysis.confidence >= MIN_CONFIDENCE_THRESHOLD) {
      return {
        isFemale: true,
        confidence: analysis.confidence,
        message: 'Vérification réussie',
      };
    }
    
    if (analysis.isFemale && analysis.confidence < MIN_CONFIDENCE_THRESHOLD) {
      return {
        isFemale: false,
        confidence: analysis.confidence,
        message: 'Confiance insuffisante, veuillez réessayer avec une meilleure photo',
      };
    }
    
    return {
      isFemale: false,
      confidence: analysis.confidence,
      message: 'Sally est un service réservé exclusivement aux femmes',
    };
  }

  /**
   * Vérifie le genre à partir d'un document d'identité
   */
  async verifyGenderFromDocument(params: {
    documentUri: string;
    documentType: 'cin' | 'passport' | 'driving_license';
  }): Promise<DocumentVerificationResult> {
    console.log('[GenderVerificationService] 📄 Vérification document:', params.documentType);
    
    try {
      await this.simulateApiDelay(2000);
      
      // Simulation d'OCR et extraction - en production, utiliser AWS Textract, Google Vision, etc.
      const result: DocumentVerificationResult = {
        isValid: true,
        documentType: params.documentType,
        gender: 'female',
        confidence: 98,
        extractedData: {
          firstName: 'Fatima',
          lastName: 'Benali',
          dateOfBirth: '1990-05-15',
          documentNumber: 'AB123456',
        },
      };
      
      console.log('[GenderVerificationService] ✅ Document vérifié');
      return result;
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Erreur document:', error.message);
      return {
        isValid: false,
        documentType: 'unknown',
        gender: 'unknown',
        confidence: 0,
        error: error.message || 'Erreur lors de la vérification du document',
      };
    }
  }

  /**
   * Demande une vérification manuelle par un administrateur
   */
  async requestManualVerification(params: {
    userId: string;
    imageUri?: string;
    documentUri?: string;
    reason: string;
  }): Promise<{ requestId: string; status: 'submitted' | 'error'; message: string }> {
    console.log('[GenderVerificationService] 📝 Demande de vérification manuelle...');
    
    try {
      await this.simulateApiDelay(500);
      
      const requestId = `mvr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Stocker la demande en attente
      const result: GenderVerificationResult = {
        isVerified: false,
        status: 'requires_review',
        gender: 'unknown',
        confidence: 0,
        method: 'manual',
        verifiedAt: null,
        expiresAt: null,
        requiresManualReview: true,
      };
      
      await this.storeVerification(result);
      
      // Ajouter à l'historique
      await this.addToHistory({
        id: requestId,
        userId: params.userId,
        method: 'manual',
        status: 'requires_review',
        result: 'unknown',
        confidence: 0,
        createdAt: new Date().toISOString(),
        notes: params.reason,
      });
      
      console.log('[GenderVerificationService] ✅ Demande soumise:', requestId);
      return {
        requestId,
        status: 'submitted',
        message: 'Votre demande de vérification a été soumise. Vous serez notifiée sous 24-48h.',
      };
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Erreur demande manuelle:', error.message);
      return {
        requestId: '',
        status: 'error',
        message: error.message || 'Erreur lors de la soumission de la demande',
      };
    }
  }

  // ==========================================================================
  // DAILY FACE CHECK
  // ==========================================================================

  /**
   * Vérifie si une vérification quotidienne est nécessaire
   */
  async requiresDailyCheck(userId: string): Promise<boolean> {
    const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK);
    
    if (!lastCheck) return true;
    
    const lastCheckDate = new Date(lastCheck);
    const now = new Date();
    const daysSinceLastCheck = Math.floor(
      (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastCheck >= 1;
  }

  /**
   * Effectue la vérification quotidienne du visage
   */
  async performDailyFaceCheck(params: {
    userId: string;
    imageUri: string;
  }): Promise<{ success: boolean; message: string }> {
    console.log('[GenderVerificationService] 🔄 Vérification quotidienne...');
    
    try {
      await this.simulateApiDelay(1000);
      
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK, new Date().toISOString());
      
      console.log('[GenderVerificationService] ✅ Vérification quotidienne réussie');
      return {
        success: true,
        message: 'Vérification réussie',
      };
      
    } catch (error: any) {
      console.error('[GenderVerificationService] ❌ Échec vérification quotidienne:', error.message);
      return {
        success: false,
        message: error.message || 'Échec de la vérification',
      };
    }
  }

  // ==========================================================================
  // STATUS METHODS
  // ==========================================================================

  /**
   * Récupère le statut de vérification actuel
   */
  async getVerificationStatus(userId: string): Promise<GenderVerificationResult | null> {
    const result = await this.getStoredVerification();
    
    if (!result) return null;
    
    if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
      return {
        ...result,
        isVerified: false,
        status: 'expired',
      };
    }
    
    return result;
  }

  /**
   * Vérifie si l'utilisateur est vérifié
   */
  async isUserVerified(userId: string): Promise<boolean> {
    const status = await this.getVerificationStatus(userId);
    return status?.isVerified ?? false;
  }

  /**
   * Récupère l'historique des vérifications
   */
  async getVerificationHistory(userId: string): Promise<VerificationHistory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_HISTORY);
      if (!data) return [];
      
      const history: VerificationHistory[] = JSON.parse(data);
      return history.filter(h => h.userId === userId);
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // STORAGE METHODS
  // ==========================================================================

  private async getStoredVerification(): Promise<GenderVerificationResult | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_RESULT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private async storeVerification(result: GenderVerificationResult): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.VERIFICATION_RESULT,
        JSON.stringify(result)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.VERIFICATION_STATUS,
        result.status
      );
    } catch (error) {
      console.error('[GenderVerificationService] Erreur stockage:', error);
    }
  }

  private async addToHistory(entry: VerificationHistory): Promise<void> {
    try {
      const history = await this.getVerificationHistory(entry.userId);
      history.push(entry);
      await AsyncStorage.setItem(
        STORAGE_KEYS.VERIFICATION_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('[GenderVerificationService] Erreur historique:', error);
    }
  }

  // ==========================================================================
  // RESET / CLEAR
  // ==========================================================================

  /**
   * Réinitialise la vérification
   */
  async resetVerification(): Promise<void> {
    console.log('[GenderVerificationService] 🔄 Réinitialisation...');
    
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.VERIFICATION_STATUS,
      STORAGE_KEYS.VERIFICATION_RESULT,
      STORAGE_KEYS.LAST_CHECK,
    ]);
    
    console.log('[GenderVerificationService] ✅ Vérification réinitialisée');
  }

  /**
   * Efface tout l'historique
   */
  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_HISTORY);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private calculateExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + VERIFICATION_EXPIRY_DAYS);
    return date.toISOString();
  }

  private generateId(): string {
    return `gv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simulateApiDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Détermine l'étape suivante du flux de vérification
   */
  getNextVerificationStep(currentStatus: VerificationStatus): string {
    switch (currentStatus) {
      case 'pending':
        return 'upload_selfie';
      case 'in_progress':
        return 'wait_review';
      case 'rejected':
        return 'retry_verification';
      case 'expired':
        return 'renew_verification';
      case 'requires_review':
        return 'wait_manual_review';
      case 'verified':
        return 'complete';
      default:
        return 'start_verification';
    }
  }

  /**
   * Vérifie si le niveau de confiance est suffisant
   */
  isConfidenceSufficient(confidence: number): boolean {
    return confidence >= MIN_CONFIDENCE_THRESHOLD;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const genderVerificationService = new GenderVerificationService();
export default genderVerificationService;