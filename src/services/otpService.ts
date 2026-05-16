// services/otpService.ts
// Service OTP pour Go With Sally

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  OTPSendResponse, 
  OTPVerifyResponse,
  OTPState 
} from '../types/verification';
import { 
  OTP_VERIFICATION, 
  VERIFICATION_STORAGE_KEYS,
  VERIFICATION_ENDPOINTS,
  VERIFICATION_PATTERNS
} from '../constants/verification';
import { mockOTPSend, mockOTPVerify, MOCK_VERIFICATION_CONFIG } from '../mocks/verification.mock';
import { APP_MODE, IS_OFFLINE, IS_HYBRID, API_URL } from '../config/appMode';

// ==================== TYPES ====================

export interface OTPSession {
  sessionId: string;
  phone: string;
  countryCode: string;
  expiresAt: string;
  attempts: number;
  resendCount: number;
  lastSentAt: string;
}

export type OTPSendType = 'sms' | 'whatsapp' | 'call';

// ==================== SERVICE ====================

class OTPService {
  private session: OTPSession | null = null;
  private timer: NodeJS.Timeout | null = null;
  private resendTimer: NodeJS.Timeout | null = null;
  
  // ==================== INITIALIZATION ====================
  
  async initialize(): Promise<void> {
    console.log('[OTPService] Initializing...');
    
    try {
      const sessionData = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.OTP_SESSION);
      if (sessionData) {
        this.session = JSON.parse(sessionData);
        
        // Vérifier si la session est expirée
        if (this.session && new Date(this.session.expiresAt) < new Date()) {
          console.log('[OTPService] Session expired, clearing...');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('[OTPService] Init error:', error);
    }
  }
  
  // ==================== SEND OTP ====================
  
  async sendOTP(
    phone: string,
    countryCode: string = '+212',
    type: OTPSendType = 'sms'
  ): Promise<OTPSendResponse> {
    console.log(`[OTPService] Sending OTP to ${countryCode}${phone} via ${type}`);
    
    // Valider le numéro de téléphone
    const fullPhone = `${countryCode}${phone.replace(/^0/, '')}`;
    if (!this.validatePhone(fullPhone)) {
      return {
        success: false,
        sessionId: null,
        expiresAt: null,
        error: OTP_VERIFICATION.ERRORS.INVALID_PHONE,
        message: 'Invalid phone number format',
      };
    }
    
    // Vérifier le rate limiting
    if (this.session && !this.canResend()) {
      const cooldown = this.getResendCooldown();
      return {
        success: false,
        sessionId: null,
        expiresAt: null,
        error: OTP_VERIFICATION.ERRORS.RATE_LIMITED,
        message: `Please wait ${cooldown} seconds before requesting a new code`,
      };
    }
    
    try {
      let result: OTPSendResponse;
      
      if (IS_OFFLINE) {
        result = await mockOTPSend(fullPhone, type);
      } else if (IS_HYBRID) {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.OTP_SEND}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ phone: fullPhone, type }),
        });
        result = await response.json();
      } else {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.OTP_SEND}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, type }),
        });
        result = await response.json();
      }
      
      if (result.success && result.sessionId && result.expiresAt) {
        this.session = {
          sessionId: result.sessionId,
          phone: fullPhone,
          countryCode,
          expiresAt: result.expiresAt,
          attempts: 0,
          resendCount: (this.session?.resendCount || 0) + 1,
          lastSentAt: new Date().toISOString(),
        };
        
        await this.saveSession();
        this.startExpiryTimer();
      }
      
      return result;
    } catch (error) {
      console.error('[OTPService] Send error:', error);
      return {
        success: false,
        sessionId: null,
        expiresAt: null,
        error: OTP_VERIFICATION.ERRORS.NETWORK_ERROR,
        message: 'Failed to send OTP. Please check your connection.',
      };
    }
  }
  
  // ==================== VERIFY OTP ====================
  
  async verifyOTP(code: string): Promise<OTPVerifyResponse> {
    console.log('[OTPService] Verifying OTP...');
    
    if (!this.session) {
      return {
        success: false,
        verified: false,
        error: 'no_session',
        message: 'No active OTP session. Please request a new code.',
      };
    }
    
    // Valider le format du code
    if (!VERIFICATION_PATTERNS.OTP_CODE.test(code)) {
      return {
        success: false,
        verified: false,
        error: OTP_VERIFICATION.ERRORS.INVALID_CODE,
        message: 'Invalid code format. Please enter 6 digits.',
      };
    }
    
    // Vérifier si la session est expirée
    if (new Date(this.session.expiresAt) < new Date()) {
      return {
        success: false,
        verified: false,
        error: OTP_VERIFICATION.ERRORS.CODE_EXPIRED,
        message: 'Code expired. Please request a new one.',
      };
    }
    
    // Vérifier les tentatives
    if (this.session.attempts >= OTP_VERIFICATION.MAX_ATTEMPTS) {
      return {
        success: false,
        verified: false,
        error: OTP_VERIFICATION.ERRORS.MAX_ATTEMPTS_REACHED,
        message: 'Maximum attempts reached. Please request a new code.',
        remainingAttempts: 0,
      };
    }
    
    try {
      let result: OTPVerifyResponse;
      
      if (IS_OFFLINE) {
        result = await mockOTPVerify(code, this.session.sessionId);
      } else if (IS_HYBRID) {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.OTP_VERIFY}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ 
            code, 
            sessionId: this.session.sessionId 
          }),
        });
        result = await response.json();
      } else {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.OTP_VERIFY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code, 
            sessionId: this.session.sessionId 
          }),
        });
        result = await response.json();
      }
      
      if (result.verified) {
        await this.clearSession();
      } else {
        this.session.attempts++;
        await this.saveSession();
        result.remainingAttempts = OTP_VERIFICATION.MAX_ATTEMPTS - this.session.attempts;
      }
      
      return result;
    } catch (error) {
      console.error('[OTPService] Verify error:', error);
      return {
        success: false,
        verified: false,
        error: OTP_VERIFICATION.ERRORS.NETWORK_ERROR,
        message: 'Failed to verify OTP. Please check your connection.',
      };
    }
  }
  
  // ==================== RESEND OTP ====================
  
  async resendOTP(type: OTPSendType = 'sms'): Promise<OTPSendResponse> {
    if (!this.session) {
      return {
        success: false,
        sessionId: null,
        expiresAt: null,
        error: 'no_session',
        message: 'No active session to resend.',
      };
    }
    
    if (this.session.resendCount >= OTP_VERIFICATION.MAX_RESEND_ATTEMPTS) {
      return {
        success: false,
        sessionId: null,
        expiresAt: null,
        error: OTP_VERIFICATION.ERRORS.MAX_ATTEMPTS_REACHED,
        message: 'Maximum resend attempts reached. Please try again later.',
      };
    }
    
    const phone = this.session.phone.replace(this.session.countryCode, '');
    return this.sendOTP(phone, this.session.countryCode, type);
  }
  
  // ==================== VALIDATION ====================
  
  validatePhone(phone: string): boolean {
    return VERIFICATION_PATTERNS.MOROCCO_PHONE.test(phone);
  }
  
  formatPhone(phone: string, countryCode: string = '+212'): string {
    // Supprimer les espaces et caractères non numériques
    let cleaned = phone.replace(/\D/g, '');
    
    // Supprimer le 0 initial si présent
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Supprimer le code pays s'il est déjà présent
    if (cleaned.startsWith('212')) {
      cleaned = cleaned.substring(3);
    }
    
    return `${countryCode}${cleaned}`;
  }
  
  // ==================== TIMER MANAGEMENT ====================
  
  private startExpiryTimer(): void {
    this.stopTimers();
    
    if (!this.session) return;
    
    const expiresAt = new Date(this.session.expiresAt);
    const timeout = expiresAt.getTime() - Date.now();
    
    if (timeout > 0) {
      this.timer = setTimeout(() => {
        console.log('[OTPService] Session expired');
        this.clearSession();
      }, timeout);
    }
  }
  
  private stopTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.resendTimer) {
      clearTimeout(this.resendTimer);
      this.resendTimer = null;
    }
  }
  
  // ==================== SESSION MANAGEMENT ====================
  
  private async saveSession(): Promise<void> {
    if (this.session) {
      await AsyncStorage.setItem(
        VERIFICATION_STORAGE_KEYS.OTP_SESSION,
        JSON.stringify(this.session)
      );
    }
  }
  
  async clearSession(): Promise<void> {
    this.stopTimers();
    this.session = null;
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEYS.OTP_SESSION);
  }
  
  // ==================== STATUS ====================
  
  getSession(): OTPSession | null {
    return this.session;
  }
  
  getRemainingTime(): number {
    if (!this.session) return 0;
    
    const expiresAt = new Date(this.session.expiresAt);
    const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    return remaining;
  }
  
  getResendCooldown(): number {
    if (!this.session) return 0;
    
    const lastSent = new Date(this.session.lastSentAt);
    const cooldownEnd = lastSent.getTime() + OTP_VERIFICATION.RESEND_COOLDOWN_SECONDS * 1000;
    const remaining = Math.max(0, Math.floor((cooldownEnd - Date.now()) / 1000));
    return remaining;
  }
  
  canResend(): boolean {
    return this.getResendCooldown() === 0;
  }
  
  getRemainingAttempts(): number {
    if (!this.session) return OTP_VERIFICATION.MAX_ATTEMPTS;
    return Math.max(0, OTP_VERIFICATION.MAX_ATTEMPTS - this.session.attempts);
  }
  
  isExpired(): boolean {
    if (!this.session) return true;
    return new Date(this.session.expiresAt) < new Date();
  }
  
  getState(): OTPState {
    return {
      phone: this.session?.phone || null,
      countryCode: this.session?.countryCode || '+212',
      isVerified: false,
      isSending: false,
      isVerifying: false,
      expiresAt: this.session?.expiresAt || null,
      remainingTime: this.getRemainingTime(),
      attempts: this.session?.attempts || 0,
      maxAttempts: OTP_VERIFICATION.MAX_ATTEMPTS,
      canResend: this.canResend(),
      resendCooldown: this.getResendCooldown(),
      sessionId: this.session?.sessionId || null,
      error: null,
    };
  }
  
  // ==================== MOCK CODE (Dev Only) ====================
  
  getMockCode(): string | null {
    if (IS_OFFLINE || IS_HYBRID) {
      return MOCK_VERIFICATION_CONFIG.mockOTPCode;
    }
    return null;
  }
}

export const otpService = new OTPService();
export default otpService;