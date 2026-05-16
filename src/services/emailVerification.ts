// services/emailVerification.ts
// Service de vérification email Go With Sally

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  EmailVerificationResponse,
  EmailVerificationState 
} from '../types/verification';
import { 
  EMAIL_VERIFICATION, 
  VERIFICATION_STORAGE_KEYS,
  VERIFICATION_ENDPOINTS,
  VERIFICATION_PATTERNS
} from '../constants/verification';
import { mockEmailSend, mockEmailVerify } from '../mocks/verification.mock';
import { APP_MODE, IS_OFFLINE, IS_HYBRID, API_URL } from '../config/appMode';

// ==================== TYPES ====================

export interface EmailVerificationSession {
  email: string;
  sentAt: string;
  expiresAt: string;
  resendCount: number;
  lastResendAt: string | null;
}

// ==================== SERVICE ====================

class EmailVerificationService {
  private session: EmailVerificationSession | null = null;
  private isVerified: boolean = false;
  
  // ==================== INITIALIZATION ====================
  
  async initialize(): Promise<void> {
    console.log('[EmailVerification] Initializing...');
    
    try {
      const verifiedStatus = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED);
      this.isVerified = verifiedStatus === 'true';
    } catch (error) {
      console.error('[EmailVerification] Init error:', error);
    }
  }
  
  // ==================== SEND VERIFICATION ====================
  
  async sendVerificationEmail(email: string): Promise<EmailVerificationResponse> {
    console.log('[EmailVerification] Sending verification to:', email);
    
    // Valider l'email
    if (!this.validateEmail(email)) {
      return {
        success: false,
        error: EMAIL_VERIFICATION.ERRORS.INVALID_EMAIL,
        message: 'Invalid email format',
      };
    }
    
    // Vérifier si déjà vérifié
    if (this.isVerified) {
      return {
        success: false,
        error: EMAIL_VERIFICATION.ERRORS.ALREADY_VERIFIED,
        message: 'Email is already verified',
      };
    }
    
    // Vérifier le rate limiting
    if (this.session && !this.canResend()) {
      const cooldown = this.getResendCooldown();
      return {
        success: false,
        error: 'rate_limited',
        message: `Please wait ${Math.ceil(cooldown / 60)} minutes before requesting a new email`,
      };
    }
    
    // Vérifier le nombre de renvois
    if (this.session && this.session.resendCount >= EMAIL_VERIFICATION.MAX_RESEND_ATTEMPTS) {
      return {
        success: false,
        error: 'max_resends_reached',
        message: 'Maximum resend attempts reached. Please contact support.',
      };
    }
    
    try {
      let result: EmailVerificationResponse;
      
      if (IS_OFFLINE) {
        result = await mockEmailSend(email);
      } else if (IS_HYBRID) {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.EMAIL_SEND}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ email }),
        });
        result = await response.json();
      } else {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.EMAIL_SEND}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        result = await response.json();
      }
      
      if (result.success) {
        const now = new Date();
        this.session = {
          email,
          sentAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
          resendCount: (this.session?.resendCount || 0) + 1,
          lastResendAt: now.toISOString(),
        };
      }
      
      return result;
    } catch (error) {
      console.error('[EmailVerification] Send error:', error);
      return {
        success: false,
        error: EMAIL_VERIFICATION.ERRORS.NETWORK_ERROR,
        message: 'Failed to send verification email. Please check your connection.',
      };
    }
  }
  
  // ==================== VERIFY TOKEN ====================
  
  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    console.log('[EmailVerification] Verifying token...');
    
    if (this.isVerified) {
      return {
        success: true,
        verified: true,
        message: 'Email is already verified',
      };
    }
    
    try {
      let result: EmailVerificationResponse;
      
      if (IS_OFFLINE) {
        result = await mockEmailVerify(token);
      } else if (IS_HYBRID) {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.EMAIL_VERIFY}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Mode': 'hybrid'
          },
          body: JSON.stringify({ token }),
        });
        result = await response.json();
      } else {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.EMAIL_VERIFY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        result = await response.json();
      }
      
      if (result.verified) {
        this.isVerified = true;
        await AsyncStorage.setItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED, 'true');
        this.session = null;
      }
      
      return result;
    } catch (error) {
      console.error('[EmailVerification] Verify error:', error);
      return {
        success: false,
        error: EMAIL_VERIFICATION.ERRORS.NETWORK_ERROR,
        message: 'Failed to verify email. Please check your connection.',
      };
    }
  }
  
  // ==================== RESEND VERIFICATION ====================
  
  async resendVerification(): Promise<EmailVerificationResponse> {
    if (!this.session) {
      return {
        success: false,
        error: 'no_session',
        message: 'No pending verification. Please enter your email.',
      };
    }
    
    return this.sendVerificationEmail(this.session.email);
  }
  
  // ==================== VALIDATION ====================
  
  validateEmail(email: string): boolean {
    return VERIFICATION_PATTERNS.EMAIL.test(email);
  }
  
  // ==================== STATUS ====================
  
  getIsVerified(): boolean {
    return this.isVerified;
  }
  
  async checkVerificationStatus(): Promise<boolean> {
    // Vérifier le stockage local d'abord
    const localStatus = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED);
    if (localStatus === 'true') {
      this.isVerified = true;
      return true;
    }
    
    // Si en ligne, vérifier avec l'API
    if (!IS_OFFLINE) {
      try {
        const response = await fetch(`${API_URL}${VERIFICATION_ENDPOINTS.EMAIL_STATUS}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        
        if (result.verified) {
          this.isVerified = true;
          await AsyncStorage.setItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED, 'true');
          return true;
        }
      } catch (error) {
        console.error('[EmailVerification] Status check error:', error);
      }
    }
    
    return false;
  }
  
  getSession(): EmailVerificationSession | null {
    return this.session;
  }
  
  canResend(): boolean {
    return this.getResendCooldown() === 0;
  }
  
  getResendCooldown(): number {
    if (!this.session || !this.session.lastResendAt) return 0;
    
    const lastResend = new Date(this.session.lastResendAt);
    const cooldownEnd = lastResend.getTime() + EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60 * 1000;
    const remaining = Math.max(0, cooldownEnd - Date.now());
    return remaining;
  }
  
  getState(): EmailVerificationState {
    return {
      email: this.session?.email || null,
      isVerified: this.isVerified,
      isSending: false,
      isVerifying: false,
      sentAt: this.session?.sentAt || null,
      verifiedAt: this.isVerified ? new Date().toISOString() : null,
      error: null,
    };
  }
  
  // ==================== RESET ====================
  
  async reset(): Promise<void> {
    this.session = null;
    this.isVerified = false;
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED);
  }
  
  // Pour les tests - marquer comme vérifié directement
  async setVerified(email: string): Promise<void> {
    this.isVerified = true;
    await AsyncStorage.setItem(VERIFICATION_STORAGE_KEYS.EMAIL_VERIFIED, 'true');
    console.log('[EmailVerification] Email marked as verified:', email);
  }
}

export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;

