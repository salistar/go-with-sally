/**
 * GO WITH SALLY - SECURITY CONSTANTS
 * Configuration des fonctionnalités de sécurité
 */

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'police' | 'medical' | 'sally' | 'custom';
}

export interface SecurityConfig {
  tripSharing: {
    enabled: boolean;
    maxContacts: number;
    autoShare: boolean;
    shareInterval: number;
  };
  sos: {
    enabled: boolean;
    emergencyNumbers: EmergencyContact[];
    autoRecordOnActivation: boolean;
    notifyEmergencyContacts: boolean;
    notifySallyTeam: boolean;
    countdownSeconds: number;
  };
  qrVerification: {
    enabled: boolean;
    requiredBeforeRide: boolean;
    expiresIn: number;
  };
  safeZones: {
    enabled: boolean;
    alertOutsideZone: boolean;
    notifyIfDetour: boolean;
    maxDetourPercentage: number;
  };
  audioRecording: {
    enabled: boolean;
    requiresConsent: boolean;
    autoDeleteAfterHours: number;
    accessibleByAdmin: boolean;
  };
  faceVerification: {
    requiredAtEveryLogin: boolean;
    requiredDailyForDrivers: boolean;
    antiSpoofingEnabled: boolean;
    maxAttempts: number;
  };
  genderVerification: {
    requiredAtRegistration: boolean;
    confidenceThreshold: number;
    allowManualVerification: boolean;
  };
}

export const SECURITY_CONFIG: SecurityConfig = {
  tripSharing: {
    enabled: true,
    maxContacts: 5,
    autoShare: true,
    shareInterval: 60000, // 1 minute
  },
  sos: {
    enabled: true,
    emergencyNumbers: [
      { id: 'police', name: 'Police', number: '19', type: 'police' },
      { id: 'gendarmerie', name: 'Gendarmerie', number: '177', type: 'police' },
      { id: 'samu', name: 'SAMU', number: '141', type: 'medical' },
      { id: 'sally', name: 'Sally Urgence', number: '+212522000000', type: 'sally' },
    ],
    autoRecordOnActivation: true,
    notifyEmergencyContacts: true,
    notifySallyTeam: true,
    countdownSeconds: 5,
  },
  qrVerification: {
    enabled: true,
    requiredBeforeRide: true,
    expiresIn: 300000, // 5 minutes
  },
  safeZones: {
    enabled: true,
    alertOutsideZone: true,
    notifyIfDetour: true,
    maxDetourPercentage: 30,
  },
  audioRecording: {
    enabled: true,
    requiresConsent: true,
    autoDeleteAfterHours: 72,
    accessibleByAdmin: true,
  },
  faceVerification: {
    requiredAtEveryLogin: true,
    requiredDailyForDrivers: true,
    antiSpoofingEnabled: true,
    maxAttempts: 3,
  },
  genderVerification: {
    requiredAtRegistration: true,
    confidenceThreshold: 0.90,
    allowManualVerification: true,
  },
};

export const SAFETY_TIPS = {
  beforeRide: [
    { fr: 'Vérifiez la photo et le nom de votre conductrice', ar: 'تحققي من صورة واسم سائقتك', en: 'Check your driver\'s photo and name' },
    { fr: 'Confirmez la plaque d\'immatriculation', ar: 'تأكدي من لوحة الترخيص', en: 'Confirm the license plate' },
    { fr: 'Partagez votre trajet avec un proche', ar: 'شاركي رحلتك مع شخص قريب', en: 'Share your trip with a loved one' },
    { fr: 'Scannez le QR code pour confirmer', ar: 'امسحي رمز QR للتأكيد', en: 'Scan the QR code to confirm' },
  ],
  duringRide: [
    { fr: 'Gardez votre téléphone à portée de main', ar: 'احتفظي بهاتفك في متناول يدك', en: 'Keep your phone handy' },
    { fr: 'Suivez le trajet sur la carte', ar: 'تابعي الطريق على الخريطة', en: 'Follow the route on the map' },
    { fr: 'N\'hésitez pas à utiliser le bouton SOS', ar: 'لا تترددي في استخدام زر SOS', en: 'Don\'t hesitate to use the SOS button' },
  ],
  afterRide: [
    { fr: 'Notez votre conductrice', ar: 'قيمي سائقتك', en: 'Rate your driver' },
    { fr: 'Signalez tout comportement suspect', ar: 'أبلغي عن أي سلوك مشبوه', en: 'Report any suspicious behavior' },
  ],
};

export const SOS_MESSAGES = {
  default: {
    fr: 'URGENCE: J\'ai besoin d\'aide immédiatement. Ma position actuelle a été partagée.',
    ar: 'طوارئ: أحتاج مساعدة فورية. تم مشاركة موقعي الحالي.',
    en: 'EMERGENCY: I need help immediately. My current location has been shared.',
  },
  accident: {
    fr: 'ACCIDENT: Un accident s\'est produit. Envoyez de l\'aide à ma position.',
    ar: 'حادث: وقع حادث. أرسلوا المساعدة إلى موقعي.',
    en: 'ACCIDENT: An accident has occurred. Send help to my location.',
  },
  threat: {
    fr: 'MENACE: Je me sens en danger. Contactez les autorités.',
    ar: 'تهديد: أشعر بالخطر. اتصلوا بالسلطات.',
    en: 'THREAT: I feel in danger. Contact authorities.',
  },
};

export default {
  SECURITY_CONFIG,
  SAFETY_TIPS,
  SOS_MESSAGES,
};