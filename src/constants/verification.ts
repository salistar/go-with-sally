// constants/verification.ts
// Constantes pour le système de vérification Go With Sally

// ==================== FACE VERIFICATION ====================

export const FACE_VERIFICATION = {
  // Paramètres de détection
  MIN_CONFIDENCE: 0.85,
  MIN_MATCH_SCORE: 0.75,
  MAX_FAILED_ATTEMPTS: 3,
  LOCK_DURATION_MINUTES: 15,
  SESSION_DURATION_HOURS: 24,
  
  // Délais en ms
  DETECTION_TIMEOUT: 30000,
  VERIFICATION_TIMEOUT: 10000,
  
  // Messages d'erreur
  ERRORS: {
    NO_FACE_DETECTED: 'no_face_detected',
    MULTIPLE_FACES: 'multiple_faces',
    FACE_NOT_CENTERED: 'face_not_centered',
    LOW_LIGHT: 'low_light',
    VERIFICATION_FAILED: 'verification_failed',
    SESSION_EXPIRED: 'session_expired',
    ACCOUNT_LOCKED: 'account_locked',
    NETWORK_ERROR: 'network_error',
  }
} as const;

// ==================== OTP VERIFICATION ====================

export const OTP_VERIFICATION = {
  // Configuration
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_RESEND_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 30,
  
  // Types d'envoi
  SEND_TYPES: ['sms', 'whatsapp', 'call'] as const,
  
  // Messages d'erreur
  ERRORS: {
    INVALID_PHONE: 'invalid_phone',
    SEND_FAILED: 'send_failed',
    INVALID_CODE: 'invalid_code',
    CODE_EXPIRED: 'code_expired',
    MAX_ATTEMPTS_REACHED: 'max_attempts_reached',
    RATE_LIMITED: 'rate_limited',
    NETWORK_ERROR: 'network_error',
  }
} as const;

// ==================== EMAIL VERIFICATION ====================

export const EMAIL_VERIFICATION = {
  // Configuration
  TOKEN_EXPIRY_HOURS: 24,
  MAX_RESEND_ATTEMPTS: 5,
  RESEND_COOLDOWN_MINUTES: 5,
  
  // Messages d'erreur
  ERRORS: {
    INVALID_EMAIL: 'invalid_email',
    SEND_FAILED: 'send_failed',
    INVALID_TOKEN: 'invalid_token',
    TOKEN_EXPIRED: 'token_expired',
    ALREADY_VERIFIED: 'already_verified',
    NETWORK_ERROR: 'network_error',
  }
} as const;

// ==================== VERIFICATION STEPS ====================

export const VERIFICATION_STEPS = {
  PHONE: 'phone',
  EMAIL: 'email',
  FACE_ENROLLMENT: 'face_enrollment',
  FACE_VERIFICATION: 'face_verification',
  DOCUMENTS: 'documents',
  COMPLETE: 'complete',
} as const;

// ==================== ASYNC STORAGE KEYS ====================

export const VERIFICATION_STORAGE_KEYS = {
  FACE_SESSION: '@sally/face_session',
  FACE_ENROLLED: '@sally/face_enrolled',
  OTP_SESSION: '@sally/otp_session',
  EMAIL_VERIFIED: '@sally/email_verified',
  LAST_VERIFICATION: '@sally/last_verification',
  DEVICE_ID: '@sally/device_id',
} as const;

// ==================== API ENDPOINTS ====================

export const VERIFICATION_ENDPOINTS = {
  // Face verification
  FACE_ENROLL: '/verification/face/enroll',
  FACE_VERIFY: '/verification/face/verify',
  FACE_STATUS: '/verification/face/status',
  
  // OTP
  OTP_SEND: '/verification/otp/send',
  OTP_VERIFY: '/verification/otp/verify',
  OTP_RESEND: '/verification/otp/resend',
  OTP_STATUS: '/verification/otp/status',
  
  // Email
  EMAIL_SEND: '/verification/email/send',
  EMAIL_VERIFY: '/verification/email/verify',
  EMAIL_RESEND: '/verification/email/resend',
  EMAIL_STATUS: '/verification/email/status',
  
  // General
  VERIFICATION_STATUS: '/verification/status',
} as const;

// ==================== ANIMATION CONFIG ====================

export const VERIFICATION_ANIMATIONS = {
  FACE_OVERLAY: {
    DURATION: 2000,
    PULSE_SCALE: 1.1,
  },
  OTP_INPUT: {
    SHAKE_DURATION: 500,
    SUCCESS_DURATION: 1000,
  },
  SUCCESS_CHECK: {
    DURATION: 1500,
    SCALE: 1.2,
  },
} as const;

// ==================== REGEX PATTERNS ====================

export const VERIFICATION_PATTERNS = {
  MOROCCO_PHONE: /^(?:\+212|0)([5-7]\d{8})$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OTP_CODE: /^\d{6}$/,
} as const;

// ==================== COUNTRY CODES ====================

export const COUNTRY_CODES = [
  { code: '+212', country: 'MA', flag: '🇲🇦', name: { ar: 'المغرب', fr: 'Maroc', en: 'Morocco' } },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: { ar: 'فرنسا', fr: 'France', en: 'France' } },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: { ar: 'إسبانيا', fr: 'Espagne', en: 'Spain' } },
  { code: '+1', country: 'US', flag: '🇺🇸', name: { ar: 'الولايات المتحدة', fr: 'États-Unis', en: 'United States' } },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: { ar: 'المملكة المتحدة', fr: 'Royaume-Uni', en: 'United Kingdom' } },
] as const;
