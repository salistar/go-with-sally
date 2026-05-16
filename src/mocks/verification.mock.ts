// mocks/verification.mock.ts
// Mock data pour le système de vérification Go With Sally

import { 
  FaceVerificationResult, 
  FaceVerificationResponse,
  OTPSendResponse,
  OTPVerifyResponse,
  EmailVerificationResponse,
  FaceVerificationState,
  OTPState,
  EmailVerificationState,
  MockVerificationConfig
} from '../types/verification';

// ==================== MOCK CONFIGURATION ====================

export const MOCK_VERIFICATION_CONFIG: MockVerificationConfig = {
  faceVerificationDelay: 2000,
  faceVerificationSuccessRate: 0.9,
  otpSendDelay: 1500,
  otpVerifyDelay: 1000,
  emailSendDelay: 1500,
  emailVerifyDelay: 1000,
  mockOTPCode: '123456',
};

// ==================== MOCK STATES ====================

export const MOCK_FACE_STATE: FaceVerificationState = {
  isVerified: false,
  isVerifying: false,
  lastVerification: null,
  sessionExpiry: null,
  failedAttempts: 0,
  maxAttempts: 3,
  isLocked: false,
  lockUntil: null,
  confidence: null,
  faceId: null,
  error: null,
};

export const MOCK_OTP_STATE: OTPState = {
  phone: null,
  countryCode: '+212',
  isVerified: false,
  isSending: false,
  isVerifying: false,
  expiresAt: null,
  remainingTime: 0,
  attempts: 0,
  maxAttempts: 3,
  canResend: true,
  resendCooldown: 0,
  sessionId: null,
  error: null,
};

export const MOCK_EMAIL_STATE: EmailVerificationState = {
  email: null,
  isVerified: false,
  isSending: false,
  isVerifying: false,
  sentAt: null,
  verifiedAt: null,
  error: null,
};

// ==================== MOCK API RESPONSES ====================

export const mockFaceEnroll = async (
  faceDescriptor: number[]
): Promise<FaceVerificationResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.faceVerificationDelay);
  
  return {
    success: true,
    verified: true,
    confidence: 0.95,
    sessionId: generateSessionId(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    message: 'Face enrolled successfully',
  };
};

export const mockFaceVerify = async (
  faceDescriptor: number[]
): Promise<FaceVerificationResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.faceVerificationDelay);
  
  const success = Math.random() < MOCK_VERIFICATION_CONFIG.faceVerificationSuccessRate;
  
  if (success) {
    return {
      success: true,
      verified: true,
      confidence: 0.85 + Math.random() * 0.14,
      sessionId: generateSessionId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: 'Face verified successfully',
    };
  } else {
    return {
      success: false,
      verified: false,
      confidence: 0.3 + Math.random() * 0.3,
      error: 'face_not_matched',
      message: 'Face verification failed',
    };
  }
};

export const mockOTPSend = async (
  phone: string,
  type: 'sms' | 'whatsapp' | 'call' = 'sms'
): Promise<OTPSendResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.otpSendDelay);
  
  console.log(`[MOCK] OTP sent to ${phone} via ${type}: ${MOCK_VERIFICATION_CONFIG.mockOTPCode}`);
  
  return {
    success: true,
    sessionId: generateSessionId(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    message: `OTP sent via ${type}`,
  };
};

export const mockOTPVerify = async (
  code: string,
  sessionId: string
): Promise<OTPVerifyResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.otpVerifyDelay);
  
  if (code === MOCK_VERIFICATION_CONFIG.mockOTPCode) {
    return {
      success: true,
      verified: true,
      token: generateToken(),
      message: 'Phone verified successfully',
    };
  } else {
    return {
      success: false,
      verified: false,
      error: 'invalid_code',
      message: 'Invalid OTP code',
      remainingAttempts: 2,
    };
  }
};

export const mockEmailSend = async (
  email: string
): Promise<EmailVerificationResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.emailSendDelay);
  
  console.log(`[MOCK] Email verification sent to ${email}`);
  
  return {
    success: true,
    message: 'Verification email sent',
  };
};

export const mockEmailVerify = async (
  token: string
): Promise<EmailVerificationResponse> => {
  await delay(MOCK_VERIFICATION_CONFIG.emailVerifyDelay);
  
  // Accept any token in mock mode
  return {
    success: true,
    verified: true,
    message: 'Email verified successfully',
  };
};

// ==================== MOCK FACE DETECTION ====================

export interface MockFaceDetectionResult {
  detected: boolean;
  faceCount: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
  };
  quality: {
    brightness: number;
    sharpness: number;
    pose: {
      yaw: number;
      pitch: number;
      roll: number;
    };
  };
}

export const mockFaceDetection = async (): Promise<MockFaceDetectionResult> => {
  await delay(500);
  
  // Simulate face detection with 85% success rate
  const detected = Math.random() < 0.85;
  
  if (detected) {
    return {
      detected: true,
      faceCount: 1,
      boundingBox: {
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50,
        width: 200 + Math.random() * 50,
        height: 250 + Math.random() * 50,
      },
      landmarks: {
        leftEye: { x: 150, y: 180 },
        rightEye: { x: 250, y: 180 },
        nose: { x: 200, y: 230 },
        mouth: { x: 200, y: 280 },
      },
      quality: {
        brightness: 0.7 + Math.random() * 0.2,
        sharpness: 0.8 + Math.random() * 0.15,
        pose: {
          yaw: (Math.random() - 0.5) * 20,
          pitch: (Math.random() - 0.5) * 15,
          roll: (Math.random() - 0.5) * 10,
        },
      },
    };
  } else {
    return {
      detected: false,
      faceCount: 0,
      quality: {
        brightness: 0.5,
        sharpness: 0.5,
        pose: { yaw: 0, pitch: 0, roll: 0 },
      },
    };
  }
};

// ==================== MOCK USER DATA ====================

export const MOCK_VERIFIED_USER = {
  id: 'user_001',
  phone: '+212612345678',
  phoneVerified: true,
  email: 'test@gowithsally.ma',
  emailVerified: true,
  faceEnrolled: true,
  lastFaceVerification: new Date().toISOString(),
};

export const MOCK_UNVERIFIED_USER = {
  id: 'user_002',
  phone: '+212698765432',
  phoneVerified: false,
  email: 'new@gowithsally.ma',
  emailVerified: false,
  faceEnrolled: false,
  lastFaceVerification: null,
};

// ==================== HELPER FUNCTIONS ====================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function generateToken(): string {
  return 'token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ==================== MOCK SERVICE CLASS ====================

export class MockVerificationService {
  private faceEnrolled: boolean = false;
  private phoneVerified: boolean = false;
  private emailVerified: boolean = false;
  private failedAttempts: number = 0;
  
  async enrollFace(descriptor: number[]): Promise<FaceVerificationResponse> {
    const response = await mockFaceEnroll(descriptor);
    if (response.success) {
      this.faceEnrolled = true;
    }
    return response;
  }
  
  async verifyFace(descriptor: number[]): Promise<FaceVerificationResponse> {
    if (!this.faceEnrolled) {
      return {
        success: false,
        verified: false,
        error: 'face_not_enrolled',
        message: 'Please enroll your face first',
      };
    }
    
    const response = await mockFaceVerify(descriptor);
    
    if (!response.success) {
      this.failedAttempts++;
    } else {
      this.failedAttempts = 0;
    }
    
    return response;
  }
  
  async sendOTP(phone: string, type: 'sms' | 'whatsapp' | 'call' = 'sms'): Promise<OTPSendResponse> {
    return mockOTPSend(phone, type);
  }
  
  async verifyOTP(code: string, sessionId: string): Promise<OTPVerifyResponse> {
    const response = await mockOTPVerify(code, sessionId);
    if (response.verified) {
      this.phoneVerified = true;
    }
    return response;
  }
  
  async sendEmailVerification(email: string): Promise<EmailVerificationResponse> {
    return mockEmailSend(email);
  }
  
  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    const response = await mockEmailVerify(token);
    if (response.verified) {
      this.emailVerified = true;
    }
    return response;
  }
  
  getStatus() {
    return {
      faceEnrolled: this.faceEnrolled,
      phoneVerified: this.phoneVerified,
      emailVerified: this.emailVerified,
      failedAttempts: this.failedAttempts,
      isFullyVerified: this.faceEnrolled && this.phoneVerified && this.emailVerified,
    };
  }
  
  reset() {
    this.faceEnrolled = false;
    this.phoneVerified = false;
    this.emailVerified = false;
    this.failedAttempts = 0;
  }
}

export const mockVerificationService = new MockVerificationService();
