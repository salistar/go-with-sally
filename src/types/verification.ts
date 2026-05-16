// types/verification.ts
// Types pour le système de vérification Go With Sally

// ==================== STATUS TYPES ====================

/**
 * Status de la vérification faciale
 * Utilisé par FaceCamera, FaceOverlay, FaceLockScreen
 */
export type FaceVerificationStatus = 
  | 'idle'       // En attente
  | 'detecting'  // Visage détecté, en cours de positionnement
  | 'verifying'  // Vérification en cours
  | 'success'    // Succès
  | 'failed'     // Échec
  | 'error'      // Erreur technique
  | 'locked';    // Compte verrouillé (trop de tentatives)

/**
 * Étapes de vérification
 */
export type VerificationStep = 
  | 'none'              // Pas encore commencé
  | 'phone'             // Vérification téléphone
  | 'phone_pending'     // En attente vérification téléphone
  | 'email'             // Vérification email
  | 'email_pending'     // En attente vérification email
  | 'face'              // Vérification faciale
  | 'face_enrollment'   // Enrôlement facial
  | 'documents'         // Documents conducteur
  | 'documents_pending' // En attente validation documents
  | 'complete';         // Terminé

/**
 * Status de document
 */
export type DocumentStatus = 
  | 'pending'   // En attente
  | 'uploaded'  // Uploadé
  | 'verified'  // Vérifié
  | 'rejected'; // Rejeté

/**
 * Types de documents conducteur
 */
export type DriverDocumentType = 
  | 'license_front'        // Permis recto
  | 'license_back'         // Permis verso
  | 'id_front'             // Carte d'identité recto
  | 'id_back'              // Carte d'identité verso
  | 'vehicle_registration' // Carte grise
  | 'insurance'            // Assurance
  | 'profile_photo';       // Photo de profil

// ==================== DATA INTERFACES ====================

/**
 * Interface pour un document
 */
export interface DriverDocument {
  id: string;
  type: DriverDocumentType;
  status: DocumentStatus;
  uri?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

/**
 * Données de visage détecté
 */
export interface FaceData {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  faceID?: number;
  rollAngle?: number;
  yawAngle?: number;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

/**
 * Résultat de vérification faciale
 */
export interface FaceVerificationResult {
  success: boolean;
  confidence?: number;
  message?: string;
  faceId?: string;
}

/**
 * Configuration de vérification
 */
export interface VerificationConfig {
  maxAttempts: number;
  lockDuration: number;      // en secondes
  autoCaptureDelay: number;  // en millisecondes
  minConfidence: number;     // 0-1
}

/**
 * État de vérification utilisateur
 */
export interface UserVerificationState {
  phoneVerified: boolean;
  emailVerified: boolean;
  faceVerified: boolean;
  documentsVerified: boolean;
  isVerified: boolean;
  currentStep: VerificationStep;
}

// ==================== STATE INTERFACES ====================

/**
 * État de la vérification faciale (Redux)
 */
export interface FaceVerificationState {
  isVerified: boolean;
  isVerifying: boolean;
  isLocked: boolean;
  lockUntil: string | null;
  failedAttempts: number;
  maxAttempts: number;
  lastVerification: string | null;
  sessionExpiry: string | null;
  confidence: number | null;
  faceId: string | null;
  error: string | null;
}

/**
 * État OTP (Redux)
 */
export interface OTPState {
  phone: string | null;
  countryCode: string;
  sessionId: string | null;
  expiresAt: string | null;
  remainingTime: number;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  isVerifying: boolean;
  isSending: boolean;
  canResend: boolean;
  resendCooldown: number;
  error: string | null;
}

/**
 * État de vérification email (Redux)
 */
export interface EmailVerificationState {
  email: string | null;
  isVerified: boolean;
  isVerifying: boolean;
  isSending: boolean;
  sentAt: string | null;
  verifiedAt: string | null;
  error: string | null;
}

/**
 * État global de vérification (Redux)
 */
export interface VerificationState {
  face: FaceVerificationState;
  otp: OTPState;
  email: EmailVerificationState;
  isFullyVerified: boolean;
  verificationStep: VerificationStep;
}

// ==================== RESPONSE INTERFACES ====================

/**
 * Réponse de vérification faciale API
 */
export interface FaceVerificationResponse {
  success: boolean;
  verified?: boolean;
  confidence?: number;
  faceId?: string;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
  message?: string;
}

/**
 * Réponse d'envoi OTP API
 */
export interface OTPSendResponse {
  success: boolean;
  sessionId: string | null;
  expiresAt: string | null;
  error?: string;
  message?: string;
}

/**
 * Réponse de vérification OTP API
 */
export interface OTPVerifyResponse {
  success: boolean;
  verified: boolean;
  token?: string;
  error?: string;
  message?: string;
  remainingAttempts?: number;
}

/**
 * Réponse de vérification email API
 */
export interface EmailVerificationResponse {
  success: boolean;
  verified?: boolean;
  error?: string;
  message?: string;
}

// ==================== REQUEST INTERFACES ====================

/**
 * Requête d'envoi OTP
 */
export interface OTPSendRequest {
  phone: string;
  countryCode: string;
  type: 'sms' | 'whatsapp' | 'call';
}

/**
 * Requête de vérification OTP
 */
export interface OTPVerifyRequest {
  code: string;
  sessionId?: string;
}

/**
 * Requête de vérification faciale
 */
export interface FaceVerifyRequest {
  faceDescriptor: number[];
  userId?: string;
}

/**
 * Requête d'envoi email
 */
export interface EmailSendRequest {
  email: string;
}

/**
 * Requête de vérification email
 */
export interface EmailVerifyRequest {
  token: string;
}

// ==================== MOCK TYPES ====================

/**
 * Configuration pour les mocks de vérification
 */
export interface MockVerificationConfig {
  faceVerificationDelay: number;
  faceVerificationSuccessRate: number;
  otpSendDelay: number;
  otpVerifyDelay: number;
  emailSendDelay: number;
  emailVerifyDelay: number;
  mockOTPCode: string;
}