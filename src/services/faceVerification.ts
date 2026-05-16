// services/faceVerification.ts
// Service de vérification faciale Go With Sally

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  FaceVerificationResponse, 
  FaceVerificationResult,
  FaceData 
} from '../types/verification';
import { 
  FACE_VERIFICATION, 
  VERIFICATION_STORAGE_KEYS,
  VERIFICATION_ENDPOINTS 
} from '../constants/verification';
import { mockFaceEnroll, mockFaceVerify, mockFaceDetection, MockFaceDetectionResult } from '../mocks/verification.mock';
import { APP_MODE, IS_OFFLINE, IS_HYBRID, API_URL } from '../config/appMode';

// ==================== TYPES ====================

export interface FaceVerificationConfig {
  minConfidence: number;
  maxFailedAttempts: number;
  sessionDurationHours: number;
  lockDurationMinutes: number;
}

export interface FaceSessionData {
  sessionId: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  deviceId: string;
}

// ==================== SERVICE ====================

class FaceVerificationService {
  private config: FaceVerificationConfig = {
    minConfidence: FACE_VERIFICATION.MIN_CONFIDENCE,
    maxFailedAttempts: FACE_VERIFICATION.MAX_FAILED_ATTEMPTS,
    sessionDurationHours: FACE_VERIFICATION.SESSION_DURATION_HOURS,
    lockDurationMinutes: FACE_VERIFICATION.LOCK_DURATION_MINUTES,
  };
  
  private failedAttempts: number = 0;
  private isLocked: boolean = false;
  private lockUntil: Date | null = null;
  
  // ==================== INITIALIZATION ====================
  
  async initialize(): Promise<void> {
    console.log('[FaceVerification] Initializing service...');
    
    // Charger l'état depuis le stockage
    try {
      const sessionData = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.FACE_SESSION);
      if (sessionData) {
        const session: FaceSessionData = JSON.parse(sessionData);
        if (new Date(session.expiresAt) < new Date()) {
          console.log('[FaceVerification] Session expired, clearing...');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('[FaceVerification] Init error:', error);
    }
  }
  
  // ==================== FACE ENROLLMENT ====================
  
  async enrollFace(
    faceDescriptor: number[],
    userId: string
  ): Promise<FaceVerificationResponse> {
    console.log('[FaceVerification] Enrolling face for user:', userId);
    
    try {
      if (IS_OFFLINE) {
        // Mode OFFLINE - Simulation locale
        return await mockFaceEnroll(faceDescriptor);
      }
      
      if (IS_HYBRID) {
        // Mode HYBRID - API avec mock data
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.FACE_ENROLL}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ 
            faceDescriptor, 
            userId,
            deviceId: await this.getDeviceId()
          }),
        });
        return await response.json();
      }
      
      // Mode ONLINE - Production
      const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.FACE_ENROLL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          faceDescriptor, 
          userId,
          deviceId: await this.getDeviceId()
        }),
      });
      
      const result: FaceVerificationResponse = await response.json();
      
      if (result.success && result.sessionId) {
        await this.saveSession({
          sessionId: result.sessionId,
          userId,
          expiresAt: result.expiresAt!,
          createdAt: new Date().toISOString(),
          deviceId: await this.getDeviceId(),
        });
        await AsyncStorage.setItem(VERIFICATION_STORAGE_KEYS.FACE_ENROLLED, 'true');
      }
      
      return result;
    } catch (error) {
      console.error('[FaceVerification] Enroll error:', error);
      return {
        success: false,
        verified: false,
        error: 'network_error',
        message: 'Failed to enroll face. Please check your connection.',
      };
    }
  }
  
  // ==================== FACE VERIFICATION ====================
  
  async verifyFace(faceDescriptor: number[]): Promise<FaceVerificationResponse> {
    console.log('[FaceVerification] Verifying face...');
    
    // Vérifier si le compte est verrouillé
    if (this.isLocked && this.lockUntil && this.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((this.lockUntil.getTime() - Date.now()) / 60000);
      return {
        success: false,
        verified: false,
        error: 'account_locked',
        message: `Account locked. Try again in ${remainingMinutes} minutes.`,
      };
    }
    
    // Réinitialiser le verrouillage si expiré
    if (this.isLocked && this.lockUntil && this.lockUntil <= new Date()) {
      this.isLocked = false;
      this.lockUntil = null;
      this.failedAttempts = 0;
    }
    
    try {
      let result: FaceVerificationResponse;
      
      if (IS_OFFLINE) {
        result = await mockFaceVerify(faceDescriptor);
      } else if (IS_HYBRID) {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.FACE_VERIFY}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ 
            faceDescriptor,
            deviceId: await this.getDeviceId()
          }),
        });
        result = await response.json();
      } else {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.FACE_VERIFY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            faceDescriptor,
            deviceId: await this.getDeviceId()
          }),
        });
        result = await response.json();
      }
      
      if (result.verified) {
        this.failedAttempts = 0;
        
        if (result.sessionId) {
          await this.updateSessionExpiry(result.expiresAt!);
        }
        
        await AsyncStorage.setItem(
          VERIFICATION_STORAGE_KEYS.LAST_VERIFICATION,
          new Date().toISOString()
        );
      } else {
        this.failedAttempts++;
        
        if (this.failedAttempts >= this.config.maxFailedAttempts) {
          this.isLocked = true;
          this.lockUntil = new Date(Date.now() + this.config.lockDurationMinutes * 60000);
          
          return {
            ...result,
            error: 'account_locked',
            message: `Too many failed attempts. Account locked for ${this.config.lockDurationMinutes} minutes.`,
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('[FaceVerification] Verify error:', error);
      return {
        success: false,
        verified: false,
        error: 'network_error',
        message: 'Failed to verify face. Please check your connection.',
      };
    }
  }
  
  // ==================== FACE DETECTION ====================
  
  async detectFace(): Promise<MockFaceDetectionResult> {
    // En mode offline/hybrid, utiliser la détection mock
    if (IS_OFFLINE || IS_HYBRID) {
      return await mockFaceDetection();
    }
    
    // En production, ceci serait remplacé par une vraie détection
    // avec ML Kit, Vision API, ou autre service
    return await mockFaceDetection();
  }
  
  // ==================== SESSION MANAGEMENT ====================
  
  async isSessionValid(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.FACE_SESSION);
      if (!sessionData) return false;
      
      const session: FaceSessionData = JSON.parse(sessionData);
      return new Date(session.expiresAt) > new Date();
    } catch {
      return false;
    }
  }
  
  async getSession(): Promise<FaceSessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.FACE_SESSION);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }
  
  private async saveSession(session: FaceSessionData): Promise<void> {
    await AsyncStorage.setItem(
      VERIFICATION_STORAGE_KEYS.FACE_SESSION,
      JSON.stringify(session)
    );
  }
  
  private async updateSessionExpiry(expiresAt: string): Promise<void> {
    const session = await this.getSession();
    if (session) {
      session.expiresAt = expiresAt;
      await this.saveSession(session);
    }
  }
  
  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEYS.FACE_SESSION);
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEYS.LAST_VERIFICATION);
  }
  
  // ==================== ENROLLMENT STATUS ====================
  
  async isEnrolled(): Promise<boolean> {
    const enrolled = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.FACE_ENROLLED);
    return enrolled === 'true';
  }
  
  async getLastVerification(): Promise<string | null> {
    return await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.LAST_VERIFICATION);
  }
  
  // ==================== DEVICE ID ====================
  
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem(VERIFICATION_STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }
  
  // ==================== STATUS ====================
  
  getStatus() {
    return {
      failedAttempts: this.failedAttempts,
      maxAttempts: this.config.maxFailedAttempts,
      isLocked: this.isLocked,
      lockUntil: this.lockUntil?.toISOString() || null,
      remainingAttempts: this.config.maxFailedAttempts - this.failedAttempts,
    };
  }
  
  // ==================== RESET ====================
  
  reset(): void {
    this.failedAttempts = 0;
    this.isLocked = false;
    this.lockUntil = null;
  }
}

export const faceVerificationService = new FaceVerificationService();
export default faceVerificationService;