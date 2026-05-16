/**
 * ============================================================================
 * GO WITH SALLY - API SERVICE
 * ============================================================================
 * Service de communication avec le backend
 * 
 * Supporte 3 modes:
 * - OFFLINE: Simulation complète (pas de backend requis)
 * - HYBRID: API réelle avec fallback sur simulation si erreur
 * - ONLINE: API réelle uniquement (production)
 * 
 * Configuration via fichier .env:
 * - EXPO_PUBLIC_APP_MODE: 'offline' | 'hybrid' | 'online'
 * - EXPO_PUBLIC_API_URL: URL du backend
 * 
 * @module services/api
 * @version 4.0.0
 * @author Go With Sally Team
 * @date Janvier 2025
 * ============================================================================
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import de la configuration centralisée des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  USE_MOCK_DATA,
  CAN_USE_API,
  getModeDescription,
  getModeEmoji,
} from '../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[api.ts]';
const VERSION = '4.0.0';

// ============================================================================
// 🔧 CONFIGURATION DEPUIS .ENV
// ============================================================================

/**
 * Récupération des variables d'environnement
 * Expo utilise EXPO_PUBLIC_* pour les variables accessibles côté client
 */
const ENV = {
  // URL de l'API (développement)
  API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://192.168.1.11:5000',

  // URL de l'API (production)
  API_URL_PROD:
    process.env.EXPO_PUBLIC_API_URL_PROD ||
    process.env.API_URL_PROD ||
    'https://api.gowithsally.ma',

  // Environnement
  NODE_ENV: process.env.NODE_ENV || 'development',
};

/**
 * URL du backend selon l'environnement
 */
const API_BASE_URL: string = __DEV__ ? ENV.API_URL : ENV.API_URL_PROD;

/**
 * ⚠️ COMPATIBILITÉ: Export OFFLINE_MODE pour les anciens écrans
 * Utiliser plutôt IS_OFFLINE, IS_HYBRID, IS_ONLINE depuis config/appMode.ts
 */
export const OFFLINE_MODE: boolean = IS_OFFLINE;

// ============================================================================
// LOGS DE DÉMARRAGE
// ============================================================================

console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
console.log(`${FILE_NAME} 🚀 API Service v${VERSION}`);
console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${getModeDescription()}`);
console.log(`${FILE_NAME} 📍 APP_MODE: ${APP_MODE}`);
console.log(`${FILE_NAME} 🔧 IS_OFFLINE: ${IS_OFFLINE}`);
console.log(`${FILE_NAME} 🔧 IS_HYBRID: ${IS_HYBRID}`);
console.log(`${FILE_NAME} 🔧 IS_ONLINE: ${IS_ONLINE}`);
console.log(`${FILE_NAME} 🔧 USE_MOCK_DATA: ${USE_MOCK_DATA}`);
console.log(`${FILE_NAME} 🔧 CAN_USE_API: ${CAN_USE_API}`);
console.log(`${FILE_NAME} 🌐 Environment: ${__DEV__ ? 'Development' : 'Production'}`);
console.log(`${FILE_NAME} 🔗 API URL: ${API_BASE_URL}`);
console.log(`${FILE_NAME} ════════════════════════════════════════════════`);

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'user' | 'driver' | 'admin' | 'support' | 'moderator';
export type RideStatus = 'pending' | 'searching' | 'accepted' | 'arriving' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'apple_pay' | 'google_pay';
export type ServiceType = 'sally_eco' | 'sally_standard' | 'sally_confort' | 'sally_premium' | 'sally_xl' | 'sally_pool';

interface MockUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: UserRole;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  faceVerified: boolean;
  preferredLanguage: string;
  points: number;
  level: string;
  totalRides: number;
  stats: { totalRides: number; averageRating: number };
  vehicle?: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  isOnline?: boolean;
  rating?: number;
}

// ============================================================================
// TYPES CHAT
// ============================================================================

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'file' | 'location';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageMedia {
  uri: string;
  thumbnail?: string;
  duration?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface MessageLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  rideId?: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  recipient: string;
  type: MessageType;
  content?: string;
  media?: MessageMedia;
  location?: MessageLocation;
  status: MessageStatus;
  readAt?: string;
  deliveredAt?: string;
  isDeleted?: boolean;
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  }>;
  rideId?: string;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  conversationId: string;
  recipientId: string;
  content: string;
  rideId?: string;
  clientMessageId?: string;
  replyTo?: string;
}

export interface SendMediaData {
  conversationId: string;
  recipientId: string;
  type: MessageType;
  rideId?: string;
  clientMessageId?: string;
  duration?: number;
}

export interface SendLocationData {
  conversationId: string;
  recipientId: string;
  latitude: number;
  longitude: number;
  address?: string;
  rideId?: string;
  clientMessageId?: string;
}

// ============================================================================
// TYPES VERIFICATION & DOCUMENTS
// ============================================================================

export type DocumentType = 
  | 'driving_license'
  | 'id_card'
  | 'vehicle_registration'
  | 'insurance'
  | 'criminal_record'
  | 'profile_photo';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DriverDocument {
  _id: string;
  driverId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  expiryDate?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

export interface OTPVerification {
  id: string;
  type: 'phone' | 'email';
  target: string;
  verified: boolean;
  expiresAt: string;
  attemptsRemaining: number;
}

// ============================================================================
// TYPES NOTIFICATIONS (➕ NOUVEAU v4.0.0)
// ============================================================================

export type NotificationType = 'ride' | 'payment' | 'promo' | 'system' | 'chat' | 'verification' | 'safety' | 'rating' | 'referral' | 'achievement';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

// ============================================================================
// TYPES BADGES (➕ NOUVEAU v4.0.0)
// ============================================================================

export interface Badge {
  _id: string;
  key: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  category: 'rides' | 'loyalty' | 'rating' | 'referral' | 'special' | 'safety';
  requirement: { type: string; value: number };
  points: number;
  isSecret: boolean;
  unlockedAt?: string;
}

// ============================================================================
// TYPES PRICING (➕ NOUVEAU v4.0.0)
// ============================================================================

export interface PriceEstimate {
  serviceType: ServiceType;
  name: string;
  nameAr: string;
  icon: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  bookingFee: number;
  surgeMultiplier: number;
  totalFare: number;
  currency: string;
  estimatedDuration: number;
  estimatedDistance: number;
  eta: number;
}

// ============================================================================
// DONNÉES MOCK POUR MODE OFFLINE/HYBRID
// ============================================================================

const MOCK_USER: MockUserData = {
  id: 'user_001',
  firstName: 'Fatima',
  lastName: 'Benali',
  email: 'fatima@test.com',
  phone: '+212612345678',
  avatar: null,
  role: 'user',
  isVerified: true,
  emailVerified: true,
  phoneVerified: true,
  faceVerified: true,
  preferredLanguage: 'fr',
  points: 1250,
  level: 'Gold',
  totalRides: 47,
  stats: { totalRides: 47, averageRating: 4.8 },
};

const MOCK_DRIVER: MockUserData = {
  id: 'driver_001',
  firstName: 'Amina',
  lastName: 'El Amrani',
  email: 'amina.driver@test.com',
  phone: '+212698765432',
  avatar: null,
  role: 'driver',
  isVerified: true,
  emailVerified: true,
  phoneVerified: true,
  faceVerified: true,
  preferredLanguage: 'fr',
  points: 0,
  level: 'Gold',
  totalRides: 542,
  stats: { totalRides: 542, averageRating: 4.9 },
  isOnline: true,
  rating: 4.9,
  vehicle: {
    brand: 'Dacia',
    model: 'Logan',
    color: 'Blanc',
    plateNumber: '12345-A-1',
  },
};

const MOCK_ADMIN: MockUserData = {
  id: 'admin_001',
  firstName: 'Admin',
  lastName: 'Sally',
  email: 'admin@gowithsally.com',
  phone: '+212600000000',
  avatar: null,
  role: 'admin',
  isVerified: true,
  emailVerified: true,
  phoneVerified: true,
  faceVerified: true,
  preferredLanguage: 'fr',
  points: 0,
  level: 'Diamond',
  totalRides: 0,
  stats: { totalRides: 0, averageRating: 5.0 },
};

const MOCK_TOKEN = 'mock_token_123456789';
const MOCK_REFRESH_TOKEN = 'mock_refresh_token_987654321';

// ============================================================================
// DONNÉES MOCK CHAT
// ============================================================================

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    _id: 'conv_001',
    participants: [
      { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali', phone: '+212612345678' },
      { _id: 'driver_001', firstName: 'Amina', lastName: 'El Amrani', phone: '+212698765432' },
    ],
    rideId: 'ride_001',
    lastMessage: {
      _id: 'msg_003',
      conversationId: 'conv_001',
      sender: { _id: 'driver_001', firstName: 'Amina', lastName: 'El Amrani' },
      recipient: 'user_001',
      type: 'text',
      content: 'Je suis arrivée devant l\'entrée principale',
      status: 'read',
      createdAt: new Date(Date.now() - 300000).toISOString(),
      updatedAt: new Date(Date.now() - 300000).toISOString(),
    },
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    _id: 'conv_002',
    participants: [
      { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali', phone: '+212612345678' },
      { _id: 'driver_002', firstName: 'Khadija', lastName: 'Ouazzani', phone: '+212655443322' },
    ],
    rideId: 'ride_002',
    lastMessage: {
      _id: 'msg_010',
      conversationId: 'conv_002',
      sender: { _id: 'driver_002', firstName: 'Khadija', lastName: 'Ouazzani' },
      recipient: 'user_001',
      type: 'text',
      content: 'Merci pour le pourboire! Bonne journée 😊',
      status: 'delivered',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    unreadCount: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    _id: 'msg_001',
    conversationId: 'conv_001',
    sender: { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali' },
    recipient: 'driver_001',
    type: 'text',
    content: 'Bonjour, je suis devant Morocco Mall',
    status: 'read',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    _id: 'msg_002',
    conversationId: 'conv_001',
    sender: { _id: 'driver_001', firstName: 'Amina', lastName: 'El Amrani' },
    recipient: 'user_001',
    type: 'text',
    content: 'D\'accord, j\'arrive dans 3 minutes',
    status: 'read',
    createdAt: new Date(Date.now() - 480000).toISOString(),
    updatedAt: new Date(Date.now() - 480000).toISOString(),
  },
  {
    _id: 'msg_003',
    conversationId: 'conv_001',
    sender: { _id: 'driver_001', firstName: 'Amina', lastName: 'El Amrani' },
    recipient: 'user_001',
    type: 'text',
    content: 'Je suis arrivée devant l\'entrée principale',
    status: 'read',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    _id: 'msg_004',
    conversationId: 'conv_001',
    sender: { _id: 'driver_001', firstName: 'Amina', lastName: 'El Amrani' },
    recipient: 'user_001',
    type: 'location',
    location: {
      latitude: 33.5447,
      longitude: -7.6311,
      address: 'Morocco Mall, Casablanca',
    },
    status: 'read',
    createdAt: new Date(Date.now() - 290000).toISOString(),
    updatedAt: new Date(Date.now() - 290000).toISOString(),
  },
  {
    _id: 'msg_005',
    conversationId: 'conv_001',
    sender: { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali' },
    recipient: 'driver_001',
    type: 'audio',
    media: {
      uri: 'https://example.com/audio/voice_001.m4a',
      duration: 5,
      mimeType: 'audio/m4a',
    },
    status: 'read',
    createdAt: new Date(Date.now() - 250000).toISOString(),
    updatedAt: new Date(Date.now() - 250000).toISOString(),
  },
];

// ============================================================================
// DONNÉES MOCK DOCUMENTS
// ============================================================================

const MOCK_DOCUMENTS: DriverDocument[] = [
  {
    _id: 'doc_001',
    driverId: 'driver_001',
    type: 'driving_license',
    status: 'approved',
    fileUrl: 'https://example.com/docs/license.jpg',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      fileName: 'permis_conduire.jpg',
      fileSize: 1250000,
      mimeType: 'image/jpeg',
    },
  },
  {
    _id: 'doc_002',
    driverId: 'driver_001',
    type: 'id_card',
    status: 'approved',
    fileUrl: 'https://example.com/docs/cin.jpg',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      fileName: 'cin.jpg',
      fileSize: 980000,
      mimeType: 'image/jpeg',
    },
  },
  {
    _id: 'doc_003',
    driverId: 'driver_001',
    type: 'vehicle_registration',
    status: 'pending',
    fileUrl: 'https://example.com/docs/carte_grise.jpg',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      fileName: 'carte_grise.jpg',
      fileSize: 1100000,
      mimeType: 'image/jpeg',
    },
  },
  {
    _id: 'doc_004',
    driverId: 'driver_001',
    type: 'insurance',
    status: 'rejected',
    fileUrl: 'https://example.com/docs/assurance.jpg',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    rejectionReason: 'Document illisible, veuillez renvoyer une photo plus nette',
    metadata: {
      fileName: 'assurance.jpg',
      fileSize: 850000,
      mimeType: 'image/jpeg',
    },
  },
];

// ============================================================================
// DONNÉES MOCK NOTIFICATIONS (➕ NOUVEAU v4.0.0)
// ============================================================================

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: 'notif_001',
    userId: 'user_001',
    type: 'ride',
    title: 'Course terminée',
    titleAr: 'انتهت الرحلة',
    body: 'Votre course vers Twin Center est terminée. Montant: 35 DH',
    bodyAr: 'انتهت رحلتك إلى توين سنتر. المبلغ: 35 درهم',
    priority: 'normal',
    isRead: false,
    data: { rideId: 'ride_001' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'notif_002',
    userId: 'user_001',
    type: 'promo',
    title: '🎉 -20% sur votre prochaine course!',
    titleAr: '🎉 خصم 20% على رحلتك القادمة!',
    body: 'Utilisez le code SALLY20 avant dimanche',
    bodyAr: 'استخدمي الكود SALLY20 قبل يوم الأحد',
    priority: 'normal',
    isRead: true,
    data: { promoCode: 'SALLY20' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'notif_003',
    userId: 'user_001',
    type: 'achievement',
    title: '🏆 Nouveau badge débloqué!',
    titleAr: '🏆 شارة جديدة!',
    body: 'Vous avez débloqué le badge "Fidèle 50"',
    bodyAr: 'لقد فتحت شارة "وفية 50"',
    priority: 'high',
    isRead: false,
    data: { badgeKey: 'loyal_50' },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: 'notif_004',
    userId: 'user_001',
    type: 'safety',
    title: '🛡️ Rappel sécurité',
    titleAr: '🛡️ تذكير أمني',
    body: 'N\'oubliez pas de partager votre trajet avec vos proches',
    bodyAr: 'لا تنسي مشاركة رحلتك مع أحبائك',
    priority: 'low',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    _id: 'notif_005',
    userId: 'user_001',
    type: 'referral',
    title: '👭 Parrainage réussi!',
    titleAr: '👭 إحالة ناجحة!',
    body: 'Sara a utilisé votre code! Vous gagnez 50 DH',
    bodyAr: 'سارة استخدمت كودك! ربحت 50 درهم',
    priority: 'high',
    isRead: false,
    data: { referredUser: 'Sara', bonus: 50 },
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

// ============================================================================
// DONNÉES MOCK BADGES (➕ NOUVEAU v4.0.0)
// ============================================================================

const MOCK_BADGES: Badge[] = [
  {
    _id: 'badge_001',
    key: 'first_ride',
    name: 'Première Course',
    nameAr: 'الرحلة الأولى',
    description: 'Complétez votre première course',
    descriptionAr: 'أكملي رحلتك الأولى',
    icon: '🚗',
    color: '#4CAF50',
    category: 'rides',
    requirement: { type: 'rides', value: 1 },
    points: 50,
    isSecret: false,
    unlockedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    _id: 'badge_002',
    key: 'loyal_10',
    name: 'Fidèle 10',
    nameAr: 'وفية 10',
    description: 'Complétez 10 courses',
    descriptionAr: 'أكملي 10 رحلات',
    icon: '⭐',
    color: '#FFC107',
    category: 'loyalty',
    requirement: { type: 'rides', value: 10 },
    points: 100,
    isSecret: false,
    unlockedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    _id: 'badge_003',
    key: 'loyal_50',
    name: 'Fidèle 50',
    nameAr: 'وفية 50',
    description: 'Complétez 50 courses',
    descriptionAr: 'أكملي 50 رحلة',
    icon: '🌟',
    color: '#FF9800',
    category: 'loyalty',
    requirement: { type: 'rides', value: 50 },
    points: 500,
    isSecret: false,
  },
  {
    _id: 'badge_004',
    key: 'loyal_100',
    name: 'Fidèle 100',
    nameAr: 'وفية 100',
    description: 'Complétez 100 courses',
    descriptionAr: 'أكملي 100 رحلة',
    icon: '💫',
    color: '#E91E63',
    category: 'loyalty',
    requirement: { type: 'rides', value: 100 },
    points: 1000,
    isSecret: false,
  },
  {
    _id: 'badge_005',
    key: 'perfect_rating',
    name: 'Note Parfaite',
    nameAr: 'تقييم مثالي',
    description: 'Maintenez une note de 5.0 sur 10 courses',
    descriptionAr: 'حافظي على تقييم 5.0 في 10 رحلات',
    icon: '💎',
    color: '#9C27B0',
    category: 'rating',
    requirement: { type: 'rating', value: 5 },
    points: 200,
    isSecret: false,
  },
  {
    _id: 'badge_006',
    key: 'referral_master',
    name: 'Ambassadrice',
    nameAr: 'سفيرة',
    description: 'Parrainez 5 amies',
    descriptionAr: 'قومي بإحالة 5 صديقات',
    icon: '👭',
    color: '#00BCD4',
    category: 'referral',
    requirement: { type: 'referrals', value: 5 },
    points: 300,
    isSecret: false,
  },
  {
    _id: 'badge_007',
    key: 'night_owl',
    name: 'Noctambule',
    nameAr: 'بومة الليل',
    description: 'Effectuez 10 courses après 22h',
    descriptionAr: 'قومي بـ 10 رحلات بعد الساعة 22',
    icon: '🦉',
    color: '#3F51B5',
    category: 'special',
    requirement: { type: 'night_rides', value: 10 },
    points: 150,
    isSecret: true,
  },
  {
    _id: 'badge_008',
    key: 'safety_first',
    name: 'Sécurité d\'abord',
    nameAr: 'السلامة أولاً',
    description: 'Partagez votre trajet 20 fois',
    descriptionAr: 'شاركي رحلتك 20 مرة',
    icon: '🛡️',
    color: '#607D8B',
    category: 'safety',
    requirement: { type: 'shares', value: 20 },
    points: 250,
    isSecret: false,
  },
];

// ============================================================================
// INSTANCE AXIOS
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================================
// INTERCEPTEURS (seulement si API utilisable)
// ============================================================================

if (CAN_USE_API) {
  // Request interceptor
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`${FILE_NAME} 📡 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error(`${FILE_NAME} ❌ Request error:`, error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      console.log(`${FILE_NAME} ✅ ${response.config.url} - ${response.status}`);
      return response;
    },
    async (error: AxiosError) => {
      const url = error.config?.url || 'unknown';
      const status = error.response?.status || 'network';
      console.log(`${FILE_NAME} ❌ ${url} - ${status}`);

      // Refresh token si 401
      if (error.response?.status === 401 && error.config && !(error.config as any)._retry) {
        (error.config as any)._retry = true;
        try {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
              refreshToken,
            });
            if (data.success) {
              await AsyncStorage.setItem('token', data.data.token);
              if (error.config.headers) {
                error.config.headers.Authorization = `Bearer ${data.data.token}`;
              }
              return api.request(error.config);
            }
          }
        } catch (e) {
          console.error(`${FILE_NAME} ❌ Token refresh failed`);
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        }
      }

      return Promise.reject({
        message: (error.response?.data as any)?.message || error.message || 'Erreur',
        status: error.response?.status || 500,
        isNetworkError: !error.response,
      });
    }
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Simuler délai réseau
 */
const mockDelay = (ms: number = 800): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Créer une réponse mock au format AxiosResponse
 */
function createMockResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

/**
 * Wrapper pour les appels API avec support HYBRID
 * En mode HYBRID: tente l'API réelle, fallback sur mock si erreur
 */
async function apiCallWithFallback<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  mockCall: () => Promise<AxiosResponse<T>>,
  endpoint: string
): Promise<AxiosResponse<T>> {
  // Mode OFFLINE: toujours mock
  if (IS_OFFLINE) {
    console.log(`${FILE_NAME} 🔴 [OFFLINE] ${endpoint} → Mock`);
    return mockCall();
  }

  // Mode ONLINE: toujours API (pas de fallback)
  if (IS_ONLINE) {
    console.log(`${FILE_NAME} 🟢 [ONLINE] ${endpoint} → API`);
    return apiCall();
  }

  // Mode HYBRID: essayer API, fallback sur mock si erreur
  if (IS_HYBRID) {
    try {
      console.log(`${FILE_NAME} 🟡 [HYBRID] ${endpoint} → Trying API...`);
      const result = await apiCall();
      console.log(`${FILE_NAME} 🟡 [HYBRID] ${endpoint} → API Success ✅`);
      return result;
    } catch (error: any) {
      console.warn(`${FILE_NAME} 🟡 [HYBRID] ${endpoint} → API Failed, using Mock`);
      console.warn(`${FILE_NAME} 🟡 [HYBRID] Error: ${error.message || error}`);
      return mockCall();
    }
  }

  // Fallback par défaut (ne devrait jamais arriver)
  console.warn(`${FILE_NAME} ⚠️ Unknown mode, using mock`);
  return mockCall();
}

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  /**
   * Inscription
   */
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'user' | 'driver';
  }) => {
    const endpoint = 'auth/register';
    console.log(`${FILE_NAME} 📝 ${endpoint}: ${data.email}`);

    const mockCall = async () => {
      await mockDelay();
      const newUser = {
        ...MOCK_USER,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role || 'user',
        phoneVerified: false,
        faceVerified: false,
        isVerified: false,
      };
      return createMockResponse({
        success: true,
        data: {
          user: newUser,
          token: MOCK_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
          verificationStep: 'phone',
        },
      });
    };

    const apiCall = () => api.post('/auth/register', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Connexion
   */
  login: async (data: { email: string; password: string }) => {
    const endpoint = 'auth/login';
    console.log(`${FILE_NAME} 🔑 ${endpoint}: ${data.email}`);

    const mockCall = async () => {
      await mockDelay();

      // Simuler différents utilisateurs selon l'email
      let user: MockUserData = { ...MOCK_USER };
      const verificationStep = 'complete';

      if (data.email.includes('driver')) {
        user = { ...MOCK_DRIVER };
      } else if (data.email.includes('admin')) {
        user = { ...MOCK_ADMIN, email: data.email };
      } else {
        user = { ...MOCK_USER, email: data.email };
      }

      // Simuler erreur si mauvais mot de passe
      if (data.password !== 'password123' && data.password !== 'admin123' && data.password !== 'test123') {
        throw { message: 'Email ou mot de passe incorrect', status: 401 };
      }

      return createMockResponse({
        success: true,
        data: {
          user,
          token: MOCK_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
          verificationStep,
        },
      });
    };

    const apiCall = () => api.post('/auth/login', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérification téléphone
   */
  verifyPhone: async (code: string) => {
    const endpoint = 'auth/verify-phone';
    console.log(`${FILE_NAME} 📱 ${endpoint}: ${code}`);

    const mockCall = async () => {
      await mockDelay();

      // Accepter n'importe quel code de 6 chiffres ou "123456"
      if (code.length !== 6 && code !== '123456') {
        throw { message: 'Code invalide', status: 400 };
      }

      return createMockResponse({
        success: true,
        data: {
          verified: true,
          nextStep: 'face',
        },
      });
    };

    const apiCall = () => api.post('/auth/verify-phone', { code });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Renvoyer code SMS
   */
  resendPhoneCode: async () => {
    const endpoint = 'auth/resend-phone-code';
    console.log(`${FILE_NAME} 📲 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Code renvoyé' });
    };

    const apiCall = () => api.post('/auth/resend-phone-code');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérification faciale
   */
  verifyFace: async (faceImage: string) => {
    const endpoint = 'auth/verify-face';
    console.log(`${FILE_NAME} 👤 ${endpoint} - Image size: ${faceImage.length}`);

    const mockCall = async () => {
      await mockDelay(1500);
      return createMockResponse({
        success: true,
        data: {
          verified: true,
          confidence: 0.95,
          message: 'Vérification réussie',
        },
      });
    };

    const apiCall = () => api.post('/auth/verify-face', { faceImage });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mot de passe oublié
   */
  forgotPassword: async (email: string) => {
    const endpoint = 'auth/forgot-password';
    console.log(`${FILE_NAME} 🔒 ${endpoint}: ${email}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Email envoyé' });
    };

    const apiCall = () => api.post('/auth/forgot-password', { email });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Réinitialiser mot de passe
   */
  resetPassword: async (token: string, password: string) => {
    const endpoint = 'auth/reset-password';
    console.log(`${FILE_NAME} 🔑 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Mot de passe réinitialisé' });
    };

    const apiCall = () => api.post('/auth/reset-password', { token, password });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Changer le mot de passe (➕ NOUVEAU v4.0.0)
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const endpoint = 'auth/change-password';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Mot de passe modifié avec succès' });
    };

    const apiCall = () => api.post('/auth/change-password', { currentPassword, newPassword });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    const endpoint = 'auth/logout';
    console.log(`${FILE_NAME} 🚪 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post('/auth/logout');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string) => {
    const endpoint = 'auth/refresh-token';
    console.log(`${FILE_NAME} 🔄 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);
      return createMockResponse({
        success: true,
        data: { token: MOCK_TOKEN, refreshToken: MOCK_REFRESH_TOKEN },
      });
    };

    const apiCall = () => api.post('/auth/refresh-token', { refreshToken });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer utilisateur connecté
   */
  getMe: async () => {
    const endpoint = 'auth/me';
    console.log(`${FILE_NAME} 👤 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);
      return createMockResponse({ success: true, data: { user: MOCK_USER } });
    };

    const apiCall = () => api.get('/auth/me');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Supprimer le compte (➕ NOUVEAU v4.0.0)
   */
  deleteAccount: async (password: string, reason?: string) => {
    const endpoint = 'auth/delete-account';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Compte supprimé avec succès' });
    };

    const apiCall = () => api.delete('/auth/account', { data: { password, reason } });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// VERIFICATION API (➕ NOUVEAU)
// ============================================================================

export const verificationAPI = {
  /**
   * Envoyer un OTP par SMS
   */
  sendPhoneOTP: async (phone: string) => {
    const endpoint = 'verification/phone/send';
    console.log(`${FILE_NAME} 📱 ${endpoint}: ${phone}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Code envoyé par SMS',
        data: {
          expiresIn: 300, // 5 minutes
          attemptsRemaining: 3,
        },
      });
    };

    const apiCall = () => api.post('/verification/phone/send', { phone });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérifier un OTP téléphone
   */
  verifyPhoneOTP: async (phone: string, code: string) => {
    const endpoint = 'verification/phone/verify';
    console.log(`${FILE_NAME} ✅ ${endpoint}: ${phone} - ${code}`);

    const mockCall = async () => {
      await mockDelay();

      // Accepter 123456 ou tout code de 6 chiffres en mode offline
      if (code !== '123456' && code.length !== 6) {
        throw { message: 'Code invalide', status: 400 };
      }

      return createMockResponse({
        success: true,
        message: 'Téléphone vérifié avec succès',
        data: {
          verified: true,
          phone,
        },
      });
    };

    const apiCall = () => api.post('/verification/phone/verify', { phone, code });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Renvoyer OTP téléphone
   */
  resendPhoneOTP: async (phone: string) => {
    const endpoint = 'verification/phone/resend';
    console.log(`${FILE_NAME} 🔄 ${endpoint}: ${phone}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Nouveau code envoyé',
        data: {
          expiresIn: 300,
          attemptsRemaining: 3,
        },
      });
    };

    const apiCall = () => api.post('/verification/phone/resend', { phone });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Envoyer un OTP par email
   */
  sendEmailOTP: async (email: string) => {
    const endpoint = 'verification/email/send';
    console.log(`${FILE_NAME} 📧 ${endpoint}: ${email}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Code envoyé par email',
        data: {
          expiresIn: 600, // 10 minutes
          attemptsRemaining: 3,
        },
      });
    };

    const apiCall = () => api.post('/verification/email/send', { email });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérifier un OTP email
   */
  verifyEmailOTP: async (email: string, code: string) => {
    const endpoint = 'verification/email/verify';
    console.log(`${FILE_NAME} ✅ ${endpoint}: ${email} - ${code}`);

    const mockCall = async () => {
      await mockDelay();

      // Accepter 123456 ou tout code de 6 chiffres en mode offline
      if (code !== '123456' && code.length !== 6) {
        throw { message: 'Code invalide', status: 400 };
      }

      return createMockResponse({
        success: true,
        message: 'Email vérifié avec succès',
        data: {
          verified: true,
          email,
        },
      });
    };

    const apiCall = () => api.post('/verification/email/verify', { email, code });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Renvoyer OTP email
   */
  resendEmailOTP: async (email: string) => {
    const endpoint = 'verification/email/resend';
    console.log(`${FILE_NAME} 🔄 ${endpoint}: ${email}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Nouveau code envoyé',
        data: {
          expiresIn: 600,
          attemptsRemaining: 3,
        },
      });
    };

    const apiCall = () => api.post('/verification/email/resend', { email });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérification faciale (Face Lock)
   */
  verifyFace: async (faceImage: string, userId?: string) => {
    const endpoint = 'verification/face/verify';
    console.log(`${FILE_NAME} 👤 ${endpoint} - Image size: ${faceImage.length}`);

    const mockCall = async () => {
      await mockDelay(1500);
      return createMockResponse({
        success: true,
        message: 'Vérification faciale réussie',
        data: {
          verified: true,
          confidence: 0.95,
          matchScore: 0.92,
        },
      });
    };

    const apiCall = () => api.post('/verification/face/verify', { faceImage, userId });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Enregistrer le visage de référence
   */
  registerFace: async (faceImage: string) => {
    const endpoint = 'verification/face/register';
    console.log(`${FILE_NAME} 👤 ${endpoint} - Registering face`);

    const mockCall = async () => {
      await mockDelay(2000);
      return createMockResponse({
        success: true,
        message: 'Visage enregistré avec succès',
        data: {
          registered: true,
          faceId: `face_${Date.now()}`,
        },
      });
    };

    const apiCall = () => api.post('/verification/face/register', { faceImage });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer le statut de vérification
   */
  getStatus: async () => {
    const endpoint = 'verification/status';
    console.log(`${FILE_NAME} 📊 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);
      return createMockResponse({
        success: true,
        data: {
          phoneVerified: true,
          emailVerified: true,
          faceVerified: true,
          documentsVerified: false,
          overallStatus: 'partial',
        },
      });
    };

    const apiCall = () => api.get('/verification/status');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// DOCUMENTS API (➕ NOUVEAU)
// ============================================================================

export const documentsAPI = {
  /**
   * Récupérer tous les documents du conducteur
   */
  getMyDocuments: async () => {
    const endpoint = 'documents/me';
    console.log(`${FILE_NAME} 📄 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          documents: MOCK_DOCUMENTS,
          summary: {
            total: 4,
            approved: 2,
            pending: 1,
            rejected: 1,
            missing: 2,
          },
        },
      });
    };

    const apiCall = () => api.get('/documents/me');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer un document par type
   */
  getDocumentByType: async (type: DocumentType) => {
    const endpoint = `documents/type/${type}`;
    console.log(`${FILE_NAME} 📄 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      const doc = MOCK_DOCUMENTS.find(d => d.type === type);
      
      if (!doc) {
        return createMockResponse({
          success: true,
          data: { document: null },
        });
      }

      return createMockResponse({
        success: true,
        data: { document: doc },
      });
    };

    const apiCall = () => api.get(`/documents/type/${type}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Télécharger un document
   */
  uploadDocument: async (type: DocumentType, file: {
    uri: string;
    type: string;
    name: string;
  }, expiryDate?: string) => {
    const endpoint = 'documents/upload';
    console.log(`${FILE_NAME} 📤 ${endpoint} - type: ${type}`);

    const mockCall = async () => {
      await mockDelay(2000);

      const newDoc: DriverDocument = {
        _id: `doc_${Date.now()}`,
        driverId: 'driver_001',
        type,
        status: 'pending',
        fileUrl: file.uri,
        uploadedAt: new Date().toISOString(),
        expiryDate,
        metadata: {
          fileName: file.name,
          fileSize: 1000000,
          mimeType: file.type,
        },
      };

      return createMockResponse({
        success: true,
        message: 'Document téléchargé avec succès',
        data: { document: newDoc },
      });
    };

    const apiCall = async () => {
      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
      formData.append('type', type);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      return api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    };

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Supprimer un document
   */
  deleteDocument: async (documentId: string) => {
    const endpoint = `documents/${documentId}`;
    console.log(`${FILE_NAME} 🗑️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Document supprimé',
      });
    };

    const apiCall = () => api.delete(`/documents/${documentId}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Remplacer un document existant
   */
  replaceDocument: async (documentId: string, file: {
    uri: string;
    type: string;
    name: string;
  }, expiryDate?: string) => {
    const endpoint = `documents/${documentId}/replace`;
    console.log(`${FILE_NAME} 🔄 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(2000);

      const existingDoc = MOCK_DOCUMENTS.find(d => d._id === documentId);
      const updatedDoc: DriverDocument = {
        ...existingDoc!,
        status: 'pending',
        fileUrl: file.uri,
        uploadedAt: new Date().toISOString(),
        reviewedAt: undefined,
        rejectionReason: undefined,
        expiryDate,
        metadata: {
          fileName: file.name,
          fileSize: 1000000,
          mimeType: file.type,
        },
      };

      return createMockResponse({
        success: true,
        message: 'Document remplacé avec succès',
        data: { document: updatedDoc },
      });
    };

    const apiCall = async () => {
      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      return api.put(`/documents/${documentId}/replace`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    };

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les types de documents requis
   */
  getRequiredDocuments: async () => {
    const endpoint = 'documents/required';
    console.log(`${FILE_NAME} 📋 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);
      return createMockResponse({
        success: true,
        data: {
          required: [
            {
              type: 'driving_license',
              label: 'Permis de conduire',
              labelAr: 'رخصة السياقة',
              description: 'Permis de conduire valide catégorie B minimum',
              required: true,
              hasExpiry: true,
            },
            {
              type: 'id_card',
              label: 'Carte d\'identité nationale',
              labelAr: 'بطاقة التعريف الوطنية',
              description: 'CIN recto-verso',
              required: true,
              hasExpiry: true,
            },
            {
              type: 'vehicle_registration',
              label: 'Carte grise',
              labelAr: 'البطاقة الرمادية',
              description: 'Carte grise du véhicule à votre nom',
              required: true,
              hasExpiry: false,
            },
            {
              type: 'insurance',
              label: 'Assurance',
              labelAr: 'التأمين',
              description: 'Attestation d\'assurance en cours de validité',
              required: true,
              hasExpiry: true,
            },
            {
              type: 'criminal_record',
              label: 'Casier judiciaire',
              labelAr: 'السجل العدلي',
              description: 'Extrait de casier judiciaire de moins de 3 mois',
              required: true,
              hasExpiry: false,
            },
            {
              type: 'profile_photo',
              label: 'Photo de profil',
              labelAr: 'صورة الملف الشخصي',
              description: 'Photo récente, visage visible',
              required: true,
              hasExpiry: false,
            },
          ],
        },
      });
    };

    const apiCall = () => api.get('/documents/required');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Vérifier la complétude des documents
   */
  checkCompleteness: async () => {
    const endpoint = 'documents/check';
    console.log(`${FILE_NAME} ✅ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(500);
      return createMockResponse({
        success: true,
        data: {
          isComplete: false,
          missingDocuments: ['insurance', 'criminal_record', 'profile_photo'],
          pendingDocuments: ['vehicle_registration'],
          rejectedDocuments: [],
          canDrive: false,
          message: 'Veuillez compléter tous les documents requis',
        },
      });
    };

    const apiCall = () => api.get('/documents/check');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
  /**
   * Récupérer le profil utilisateur
   */
  getMe: async () => {
    const endpoint = 'users/me';
    console.log(`${FILE_NAME} 👤 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { user: MOCK_USER } });
    };

    const apiCall = () => api.get('/users/me');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mettre à jour le profil
   */
  updateMe: async (data: any) => {
    const endpoint = 'users/me';
    console.log(`${FILE_NAME} ✏️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { user: { ...MOCK_USER, ...data } } });
    };

    const apiCall = () => api.put('/users/me', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les contacts d'urgence
   */
  getEmergencyContacts: async () => {
    const endpoint = 'users/emergency-contacts';
    console.log(`${FILE_NAME} 🚨 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          contacts: [
            { id: '1', name: 'Maman', phone: '+212612345678', relationship: 'Mère' },
            { id: '2', name: 'Sœur', phone: '+212698765432', relationship: 'Sœur' },
          ],
        },
      });
    };

    const apiCall = () => api.get('/users/emergency-contacts');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Ajouter un contact d'urgence
   */
  addEmergencyContact: async (data: any) => {
    const endpoint = 'users/emergency-contacts';
    console.log(`${FILE_NAME} ➕ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: { contact: { id: Date.now().toString(), ...data } },
      });
    };

    const apiCall = () => api.post('/users/emergency-contacts', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Supprimer un contact d'urgence
   */
  deleteEmergencyContact: async (id: string) => {
    const endpoint = `users/emergency-contacts/${id}`;
    console.log(`${FILE_NAME} 🗑️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.delete(`/users/emergency-contacts/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les lieux favoris
   */
  getSavedPlaces: async () => {
    const endpoint = 'users/saved-places';
    console.log(`${FILE_NAME} 📍 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          places: [
            {
              id: '1',
              name: 'Maison',
              address: 'Hay Riad, Rabat',
              type: 'home',
              coordinates: [-6.8498, 33.9716],
            },
            {
              id: '2',
              name: 'Travail',
              address: 'Technopolis, Salé',
              type: 'work',
              coordinates: [-6.7239, 33.9877],
            },
          ],
        },
      });
    };

    const apiCall = () => api.get('/users/saved-places');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Ajouter un lieu favori
   */
  addSavedPlace: async (data: any) => {
    const endpoint = 'users/saved-places';
    console.log(`${FILE_NAME} ➕ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: { place: { id: Date.now().toString(), ...data } },
      });
    };

    const apiCall = () => api.post('/users/saved-places', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Supprimer un lieu favori
   */
  deleteSavedPlace: async (id: string) => {
    const endpoint = `users/saved-places/${id}`;
    console.log(`${FILE_NAME} 🗑️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.delete(`/users/saved-places/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les préférences utilisateur (➕ NOUVEAU v4.0.0)
   */
  getPreferences: async () => {
    const endpoint = 'users/preferences';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          preferences: {
            notifications: { push: true, email: true, sms: false, promotions: true },
            ride: { defaultPaymentMethod: 'cash', preferFemaleDriverOnly: true, preferQuietRide: false, defaultServiceType: 'sally_standard' },
            privacy: { showProfilePhoto: true, showRating: true, allowLocationSharing: true },
            language: 'fr',
          },
        },
      });
    };

    const apiCall = () => api.get('/users/preferences');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mettre à jour les préférences (➕ NOUVEAU v4.0.0)
   */
  updatePreferences: async (preferences: any) => {
    const endpoint = 'users/preferences';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { preferences } });
    };

    const apiCall = () => api.put('/users/preferences', { preferences });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer le portefeuille (➕ NOUVEAU v4.0.0)
   */
  getWallet: async () => {
    const endpoint = 'users/wallet';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          wallet: { balance: 150, currency: 'MAD', lastTopUp: new Date(Date.now() - 86400000).toISOString() },
          transactions: [
            { _id: 't1', type: 'topup', amount: 100, status: 'completed', paymentMethod: 'card', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { _id: 't2', type: 'payment', amount: -35, status: 'completed', rideId: 'ride_001', createdAt: new Date(Date.now() - 172800000).toISOString() },
            { _id: 't3', type: 'refund', amount: 15, status: 'completed', rideId: 'ride_003', reason: 'Annulation course', createdAt: new Date(Date.now() - 259200000).toISOString() },
          ],
        },
      });
    };

    const apiCall = () => api.get('/users/wallet');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Recharger le portefeuille (➕ NOUVEAU v4.0.0)
   */
  topUpWallet: async (amount: number, paymentMethod: string) => {
    const endpoint = 'users/wallet/topup';

    const mockCall = async () => {
      await mockDelay(1000);
      return createMockResponse({ success: true, data: { newBalance: 150 + amount, transactionId: `txn_${Date.now()}` } });
    };

    const apiCall = () => api.post('/users/wallet/topup', { amount, paymentMethod });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les infos de parrainage (➕ NOUVEAU v4.0.0)
   */
  getReferralInfo: async () => {
    const endpoint = 'users/referral';

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          referralCode: 'FATIMA2024',
          referralsCount: 5,
          totalEarnings: 250,
          pendingEarnings: 50,
          referralBonus: 50,
          referredBonus: 25,
          referrals: [
            { name: 'Sara', status: 'completed', bonus: 50, date: new Date(Date.now() - 86400000).toISOString() },
            { name: 'Khadija', status: 'pending', bonus: 0, date: new Date().toISOString() },
          ],
        },
      });
    };

    const apiCall = () => api.get('/users/referral');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Appliquer un code de parrainage (➕ NOUVEAU v4.0.0)
   */
  applyReferralCode: async (code: string) => {
    const endpoint = 'users/referral/apply';

    const mockCall = async () => {
      await mockDelay();
      if (code.length < 5) throw { message: 'Code de parrainage invalide', status: 400 };
      return createMockResponse({ success: true, message: 'Code de parrainage appliqué avec succès', data: { bonus: 25 } });
    };

    const apiCall = () => api.post('/users/referral/apply', { code });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// CHAT API
// ============================================================================

export const chatAPI = {
  /**
   * Récupérer la liste des conversations
   */
  getConversations: async () => {
    const endpoint = 'chat/conversations';
    console.log(`${FILE_NAME} 💬 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        conversations: MOCK_CONVERSATIONS,
      });
    };

    const apiCall = () => api.get('/chat/conversations');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Créer ou récupérer une conversation
   */
  getOrCreateConversation: async (recipientId: string, rideId?: string) => {
    const endpoint = 'chat/conversation';
    console.log(`${FILE_NAME} 💬 ${endpoint} - recipient: ${recipientId}`);

    const mockCall = async () => {
      await mockDelay();
      
      // Chercher une conversation existante
      let conversation = MOCK_CONVERSATIONS.find(c => 
        c.participants.some(p => p._id === recipientId)
      );

      if (!conversation) {
        // Créer une nouvelle conversation mock
        conversation = {
          _id: `conv_${Date.now()}`,
          participants: [
            { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali', phone: '+212612345678' },
            { _id: recipientId, firstName: 'Conductrice', lastName: 'Sally', phone: '+212600000000' },
          ],
          rideId,
          isActive: true,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return createMockResponse({
        success: true,
        conversation,
      });
    };

    const apiCall = () => api.post('/chat/conversation', { recipientId, rideId });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages: async (conversationId: string, page: number = 1, limit: number = 50) => {
    const endpoint = `chat/messages/${conversationId}`;
    console.log(`${FILE_NAME} 💬 ${endpoint} - page: ${page}`);

    const mockCall = async () => {
      await mockDelay();
      
      const messages = MOCK_MESSAGES.filter(m => m.conversationId === conversationId);

      return createMockResponse({
        success: true,
        messages,
        page,
        hasMore: false,
      });
    };

    const apiCall = () => api.get(`/chat/messages/${conversationId}`, { params: { page, limit } });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Envoyer un message texte
   */
  sendMessage: async (data: SendMessageData) => {
    const endpoint = 'chat/messages';
    console.log(`${FILE_NAME} 💬 ${endpoint} - to: ${data.recipientId}`);

    const mockCall = async () => {
      await mockDelay(300);

      const newMessage: ChatMessage = {
        _id: `msg_${Date.now()}`,
        conversationId: data.conversationId,
        rideId: data.rideId,
        sender: { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali' },
        recipient: data.recipientId,
        type: 'text',
        content: data.content,
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return createMockResponse({
        success: true,
        message: newMessage,
      });
    };

    const apiCall = () => api.post('/chat/messages', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Envoyer un message média (image, video, audio, file)
   */
  sendMediaMessage: async (data: SendMediaData, file: {
    uri: string;
    type: string;
    name: string;
  }) => {
    const endpoint = 'chat/messages/media';
    console.log(`${FILE_NAME} 📎 ${endpoint} - type: ${data.type}`);

    const mockCall = async () => {
      await mockDelay(1000);

      const newMessage: ChatMessage = {
        _id: `msg_${Date.now()}`,
        conversationId: data.conversationId,
        rideId: data.rideId,
        sender: { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali' },
        recipient: data.recipientId,
        type: data.type,
        media: {
          uri: file.uri,
          fileName: file.name,
          mimeType: file.type,
          duration: data.duration,
        },
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return createMockResponse({
        success: true,
        message: newMessage,
      });
    };

    const apiCall = async () => {
      const formData = new FormData();
      formData.append('media', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
      formData.append('conversationId', data.conversationId);
      formData.append('recipientId', data.recipientId);
      formData.append('type', data.type);
      if (data.rideId) formData.append('rideId', data.rideId);
      if (data.clientMessageId) formData.append('clientMessageId', data.clientMessageId);
      if (data.duration) formData.append('duration', String(data.duration));

      return api.post('/chat/messages/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    };

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Envoyer une position
   */
  sendLocationMessage: async (data: SendLocationData) => {
    const endpoint = 'chat/messages/location';
    console.log(`${FILE_NAME} 📍 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(300);

      const newMessage: ChatMessage = {
        _id: `msg_${Date.now()}`,
        conversationId: data.conversationId,
        rideId: data.rideId,
        sender: { _id: 'user_001', firstName: 'Fatima', lastName: 'Benali' },
        recipient: data.recipientId,
        type: 'location',
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
        },
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return createMockResponse({
        success: true,
        message: newMessage,
      });
    };

    const apiCall = () => api.post('/chat/messages/location', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mettre à jour le statut d'un message
   */
  updateMessageStatus: async (messageId: string, status: 'delivered' | 'read') => {
    const endpoint = `chat/messages/${messageId}/status`;
    console.log(`${FILE_NAME} ✓ ${endpoint} - status: ${status}`);

    const mockCall = async () => {
      await mockDelay(100);
      return createMockResponse({
        success: true,
        message: { _id: messageId, status },
      });
    };

    const apiCall = () => api.patch(`/chat/messages/${messageId}/status`, { status });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Supprimer un message
   */
  deleteMessage: async (messageId: string) => {
    const endpoint = `chat/messages/${messageId}`;
    console.log(`${FILE_NAME} 🗑️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Message supprimé',
      });
    };

    const apiCall = () => api.delete(`/chat/messages/${messageId}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer le nombre de messages non lus
   */
  getUnreadCount: async () => {
    const endpoint = 'chat/unread-count';
    console.log(`${FILE_NAME} 🔔 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(100);
      const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return createMockResponse({
        success: true,
        unreadCount: totalUnread,
      });
    };

    const apiCall = () => api.get('/chat/unread-count');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// RIDE API
// ============================================================================

export const rideAPI = {
  /**
   * Demander une course
   */
  requestRide: async (data: any) => {
    const endpoint = 'rides/request';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(1000);
      return createMockResponse({
        success: true,
        data: {
          ride: {
            id: `ride_${Date.now()}`,
            status: 'searching',
            pickup: data.pickup,
            dropoff: data.dropoff,
            estimatedPrice: Math.floor(Math.random() * 40) + 25,
            estimatedDuration: Math.floor(Math.random() * 20) + 10,
            estimatedDistance: (Math.random() * 8 + 2).toFixed(1),
            rideType: data.rideType || 'standard',
            paymentMethod: data.paymentMethod || 'cash',
            createdAt: new Date().toISOString(),
          },
        },
      });
    };

    const apiCall = () => api.post('/rides/request', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les détails d'une course
   */
  getRide: async (id: string) => {
    const endpoint = `rides/${id}`;
    console.log(`${FILE_NAME} 🔍 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          ride: {
            id,
            status: 'in_progress',
            driver: MOCK_DRIVER,
            pickup: {
              address: 'Morocco Mall, Casablanca',
              coordinates: [-7.6311, 33.5447],
            },
            dropoff: {
              address: 'Twin Center, Casablanca',
              coordinates: [-7.6192, 33.5883],
            },
            estimatedPrice: 35,
          },
        },
      });
    };

    const apiCall = () => api.get(`/rides/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Annuler une course
   */
  cancelRide: async (id: string, reason?: string) => {
    const endpoint = `rides/${id}/cancel`;
    console.log(`${FILE_NAME} ❌ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Course annulée' });
    };

    const apiCall = () => api.post(`/rides/${id}/cancel`, { reason });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Noter la conductrice (côté passagère)
   */
  rateRide: async (id: string, rating: number, review?: string) => {
    const endpoint = `rides/${id}/rate`;
    console.log(`${FILE_NAME} ⭐ ${endpoint}: ${rating}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Merci pour votre avis!' });
    };

    const apiCall = () => api.post(`/rides/${id}/rate`, { rating, review });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Noter la passagère (côté conductrice)
   */
  ratePassenger: async (id: string, rating: number, comment?: string) => {
    const endpoint = `rides/${id}/rate-passenger`;
    console.log(`${FILE_NAME} ⭐ ${endpoint}: ${rating}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Note enregistrée!' });
    };

    const apiCall = () => api.post(`/rides/${id}/rate-passenger`, { rating, comment });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer l'historique des courses
   */
  getHistory: async () => {
    const endpoint = 'rides/user/history';
    console.log(`${FILE_NAME} 📜 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          rides: [
            {
              id: 'ride_001',
              status: 'completed',
              pickup: { address: 'Morocco Mall' },
              dropoff: { address: 'Twin Center' },
              fare: 35,
              driver: { firstName: 'Amina', rating: 4.9 },
              rating: 5,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'ride_002',
              status: 'completed',
              pickup: { address: 'Gare Casa Voyageurs' },
              dropoff: { address: 'Aéroport Mohammed V' },
              fare: 150,
              driver: { firstName: 'Khadija', rating: 4.8 },
              rating: 4,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
            {
              id: 'ride_003',
              status: 'cancelled',
              pickup: { address: 'Maarif' },
              dropoff: { address: 'Anfa' },
              fare: 0,
              createdAt: new Date(Date.now() - 259200000).toISOString(),
            },
          ],
        },
      });
    };

    const apiCall = () => api.get('/rides/user/history');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Déclencher une alerte SOS
   */
  triggerSOS: async (id: string) => {
    const endpoint = `rides/${id}/sos`;
    console.log(`${FILE_NAME} 🚨 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(500);
      return createMockResponse({ success: true, message: 'Alerte SOS envoyée' });
    };

    const apiCall = () => api.post(`/rides/${id}/sos`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Estimer le prix d'une course
   */
  estimatePrice: async (data: any) => {
    const endpoint = 'rides/estimate';
    console.log(`${FILE_NAME} 💰 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay(500);
      const distance = Math.random() * 10 + 2;
      const baseFare = 8;
      const pricePerKm = 5;
      const price = Math.round(baseFare + distance * pricePerKm);
      return createMockResponse({
        success: true,
        data: {
          estimates: [
            { type: 'standard', price, duration: Math.round(distance * 3) },
            { type: 'comfort', price: Math.round(price * 1.3), duration: Math.round(distance * 3) },
            { type: 'premium', price: Math.round(price * 1.8), duration: Math.round(distance * 3) },
          ],
        },
      });
    };

    const apiCall = () => api.post('/rides/estimate', data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer la course active
   */
  getActiveRide: async () => {
    const endpoint = 'rides/active';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { ride: null } });
    };

    const apiCall = () => api.get('/rides/active');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// DRIVER API
// ============================================================================

export const driverAPI = {
  /**
   * Récupérer le profil conductrice
   */
  getMe: async () => {
    const endpoint = 'drivers/me';
    console.log(`${FILE_NAME} 👤 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { driver: MOCK_DRIVER } });
    };

    const apiCall = () => api.get('/drivers/me');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Passer en ligne
   */
  goOnline: async () => {
    const endpoint = 'drivers/online';
    console.log(`${FILE_NAME} 🟢 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { isOnline: true, isAvailable: true } });
    };

    const apiCall = () => api.post('/drivers/online');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Passer hors ligne
   */
  goOffline: async () => {
    const endpoint = 'drivers/offline';
    console.log(`${FILE_NAME} 🔴 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { isOnline: false, isAvailable: false } });
    };

    const apiCall = () => api.post('/drivers/offline');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mettre à jour la position
   */
  updateLocation: async (coordinates: number[], heading?: number, speed?: number) => {
    const endpoint = 'drivers/location';
    // Pas de log pour éviter le spam (appelé fréquemment)

    const mockCall = async () => {
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post('/drivers/location', { coordinates, heading, speed });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les gains
   */
  getEarnings: async (period?: 'today' | 'week' | 'month') => {
    const endpoint = 'drivers/earnings';
    console.log(`${FILE_NAME} 💰 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          today: 450,
          week: 2850,
          month: 12500,
          totalRides: 245,
          totalHours: 180,
          avgRating: 4.9,
          history: [
            { date: new Date().toISOString(), amount: 450, rides: 12 },
            { date: new Date(Date.now() - 86400000).toISOString(), amount: 520, rides: 14 },
            { date: new Date(Date.now() - 172800000).toISOString(), amount: 380, rides: 10 },
          ],
        },
      });
    };

    const apiCall = () => api.get('/drivers/earnings', { params: { period } });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Accepter une course
   */
  acceptRide: async (rideId: string) => {
    const endpoint = `rides/${rideId}/accept`;
    console.log(`${FILE_NAME} ✅ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Course acceptée' });
    };

    const apiCall = () => api.post(`/rides/${rideId}/accept`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Refuser une course
   */
  declineRide: async (rideId: string, reason?: string) => {
    const endpoint = `rides/${rideId}/decline`;
    console.log(`${FILE_NAME} ❌ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post(`/rides/${rideId}/decline`, { reason });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Signaler l'arrivée au point de prise en charge
   */
  arrivedAtPickup: async (rideId: string) => {
    const endpoint = `rides/${rideId}/arrived`;
    console.log(`${FILE_NAME} 📍 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post(`/rides/${rideId}/arrived`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Démarrer la course
   */
  startRide: async (rideId: string) => {
    const endpoint = `rides/${rideId}/start`;
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post(`/rides/${rideId}/start`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Terminer la course
   */
  completeRide: async (rideId: string, data?: any) => {
    const endpoint = `rides/${rideId}/complete`;
    console.log(`${FILE_NAME} 🏁 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true });
    };

    const apiCall = () => api.post(`/rides/${rideId}/complete`, data);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer l'historique des courses (conductrice)
   */
  getRideHistory: async () => {
    const endpoint = 'drivers/rides/history';
    console.log(`${FILE_NAME} 📜 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          rides: [
            {
              id: 'ride_d001',
              status: 'completed',
              pickup: { address: 'Hay Riad, Rabat' },
              dropoff: { address: 'Agdal, Rabat' },
              fare: 45,
              passenger: { firstName: 'Fatima' },
              passengerRating: 5,
              tip: 5,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'ride_d002',
              status: 'completed',
              pickup: { address: 'Gare Rabat Ville' },
              dropoff: { address: 'Technopolis, Salé' },
              fare: 55,
              passenger: { firstName: 'Sara' },
              passengerRating: 4,
              tip: 0,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ],
        },
      });
    };

    const apiCall = () => api.get('/drivers/rides/history');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer la course active (conductrice)
   */
  getActiveRide: async () => {
    const endpoint = 'drivers/rides/active';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { ride: null } });
    };

    const apiCall = () => api.get('/drivers/rides/active');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// ADMIN API
// ============================================================================

export const adminAPI = {
  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  /**
   * Récupérer les statistiques du dashboard
   */
  getDashboardStats: async () => {
    const endpoint = 'admin/dashboard';
    console.log(`${FILE_NAME} 📊 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          totalUsers: 1250,
          totalDrivers: 89,
          totalRides: 4520,
          activeRides: 12,
          pendingVerifications: 5,
          revenue: {
            today: 4850,
            week: 28500,
            month: 125000,
          },
        },
      });
    };

    const apiCall = () => api.get('/admin/dashboard');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // USERS
  // ==========================================================================

  /**
   * Récupérer la liste des utilisateurs
   */
  getUsers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const endpoint = 'admin/users';
    console.log(`${FILE_NAME} 👥 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          users: [
            {
              _id: 'u1',
              firstName: 'Fatima',
              lastName: 'Benali',
              email: 'fatima@test.com',
              phone: '+212612345678',
              isActive: true,
              totalRides: 47,
              createdAt: new Date().toISOString(),
            },
            {
              _id: 'u2',
              firstName: 'Sara',
              lastName: 'El Amrani',
              email: 'sara@test.com',
              phone: '+212698765432',
              isActive: true,
              totalRides: 23,
              createdAt: new Date().toISOString(),
            },
            {
              _id: 'u3',
              firstName: 'Yasmine',
              lastName: 'Cherkaoui',
              email: 'yasmine@test.com',
              phone: '+212655443322',
              isActive: false,
              totalRides: 5,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1250,
          page: params?.page || 1,
          pages: 63,
        },
      });
    };

    const apiCall = () => api.get('/admin/users', { params });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer un utilisateur par ID
   */
  getUser: async (id: string) => {
    const endpoint = `admin/users/${id}`;
    console.log(`${FILE_NAME} 👤 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          user: {
            _id: id,
            firstName: 'Fatima',
            lastName: 'Benali',
            email: 'fatima@test.com',
            phone: '+212612345678',
            isActive: true,
          },
          stats: { totalRides: 47, completedRides: 45 },
        },
      });
    };

    const apiCall = () => api.get(`/admin/users/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Bloquer/Débloquer un utilisateur
   */
  toggleBlockUser: async (id: string) => {
    const endpoint = `admin/users/${id}/block`;
    console.log(`${FILE_NAME} 🚫 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Statut mis à jour',
        data: { isActive: false },
      });
    };

    const apiCall = () => api.post(`/admin/users/${id}/block`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // DRIVERS
  // ==========================================================================

  /**
   * Récupérer la liste des conductrices
   */
  getDrivers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const endpoint = 'admin/drivers';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          drivers: [
            {
              _id: 'd1',
              firstName: 'Amina',
              lastName: 'El Amrani',
              email: 'amina.driver@test.com',
              phone: '+212698765432',
              isActive: true,
              isVerified: true,
              rating: 4.9,
              totalRides: 542,
              driverInfo: {
                vehicle: { brand: 'Dacia', model: 'Logan', plateNumber: '12345-A-1' },
              },
            },
            {
              _id: 'd2',
              firstName: 'Khadija',
              lastName: 'Ouazzani',
              email: 'khadija.driver@test.com',
              phone: '+212655443322',
              isActive: true,
              isVerified: true,
              rating: 4.8,
              totalRides: 328,
            },
            {
              _id: 'd3',
              firstName: 'Hanane',
              lastName: 'Bennani',
              email: 'hanane.driver@test.com',
              phone: '+212677889900',
              isActive: false,
              isVerified: false,
              rating: 0,
              totalRides: 0,
            },
          ],
          total: 89,
          page: params?.page || 1,
          pages: 5,
        },
      });
    };

    const apiCall = () => api.get('/admin/drivers', { params });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer une conductrice par ID
   */
  getDriver: async (id: string) => {
    const endpoint = `admin/drivers/${id}`;
    console.log(`${FILE_NAME} 👤 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          driver: {
            _id: id,
            firstName: 'Amina',
            lastName: 'El Amrani',
            email: 'amina.driver@test.com',
            rating: 4.9,
          },
          stats: { totalRides: 542, completedRides: 540, totalEarnings: 45000 },
        },
      });
    };

    const apiCall = () => api.get(`/admin/drivers/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Bloquer/Débloquer une conductrice
   */
  toggleBlockDriver: async (id: string) => {
    const endpoint = `admin/drivers/${id}/block`;
    console.log(`${FILE_NAME} 🚫 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        message: 'Statut mis à jour',
        data: { isActive: false },
      });
    };

    const apiCall = () => api.post(`/admin/drivers/${id}/block`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // VERIFICATIONS
  // ==========================================================================

  /**
   * Récupérer les vérifications
   */
  getVerifications: async (params?: { status?: string; page?: number; limit?: number }) => {
    const endpoint = 'admin/verifications';
    console.log(`${FILE_NAME} ✅ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          verifications: [
            {
              id: 'v1',
              driver: { firstName: 'Nadia', lastName: 'Tazi', email: 'nadia@test.com' },
              verification: { status: 'pending' },
              createdAt: new Date().toISOString(),
            },
            {
              id: 'v2',
              driver: { firstName: 'Laila', lastName: 'Benali', email: 'laila@test.com' },
              verification: { status: 'pending' },
              createdAt: new Date().toISOString(),
            },
          ],
          total: 5,
          page: 1,
          pages: 1,
        },
      });
    };

    const apiCall = () => api.get('/admin/verifications', { params });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les vérifications en attente
   */
  getPendingVerifications: async () => {
    const endpoint = 'admin/verifications/pending';
    console.log(`${FILE_NAME} ⏳ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          verifications: [
            {
              id: 'v1',
              driver: { firstName: 'Nadia', lastName: 'Tazi' },
              documents: { cin: true, license: true, insurance: true },
              createdAt: new Date().toISOString(),
            },
            {
              id: 'v2',
              driver: { firstName: 'Laila', lastName: 'Benali' },
              documents: { cin: true, license: false, insurance: true },
              createdAt: new Date().toISOString(),
            },
          ],
          count: 5,
        },
      });
    };

    const apiCall = () => api.get('/admin/verifications/pending');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Approuver une vérification
   */
  approveVerification: async (id: string) => {
    const endpoint = `admin/verifications/${id}/approve`;
    console.log(`${FILE_NAME} ✅ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Conductrice approuvée avec succès' });
    };

    const apiCall = () => api.post(`/admin/verifications/${id}/approve`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Rejeter une vérification
   */
  rejectVerification: async (id: string, reason: string) => {
    const endpoint = `admin/verifications/${id}/reject`;
    console.log(`${FILE_NAME} ❌ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Vérification rejetée' });
    };

    const apiCall = () => api.post(`/admin/verifications/${id}/reject`, { reason });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // RIDES
  // ==========================================================================

  /**
   * Récupérer la liste des courses
   */
  getRides: async (params?: { page?: number; limit?: number; status?: string }) => {
    const endpoint = 'admin/rides';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          rides: [
            {
              _id: 'r1',
              status: 'completed',
              user: { firstName: 'Fatima' },
              driver: { firstName: 'Amina' },
              fare: 35,
              pickup: { address: 'Morocco Mall' },
              dropoff: { address: 'Twin Center' },
              createdAt: new Date().toISOString(),
            },
            {
              _id: 'r2',
              status: 'in_progress',
              user: { firstName: 'Sara' },
              driver: { firstName: 'Khadija' },
              fare: 45,
              pickup: { address: 'Gare Casa' },
              dropoff: { address: 'Aéroport' },
              createdAt: new Date().toISOString(),
            },
            {
              _id: 'r3',
              status: 'cancelled',
              user: { firstName: 'Yasmine' },
              driver: null,
              fare: 0,
              pickup: { address: 'Maarif' },
              dropoff: { address: 'Anfa' },
              createdAt: new Date().toISOString(),
            },
          ],
          total: 4520,
          page: params?.page || 1,
          pages: 226,
        },
      });
    };

    const apiCall = () => api.get('/admin/rides', { params });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les courses actives
   */
  getActiveRides: async () => {
    const endpoint = 'admin/rides/active';
    console.log(`${FILE_NAME} 🚗 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          rides: [
            {
              _id: 'r2',
              status: 'in_progress',
              user: { firstName: 'Sara' },
              driver: { firstName: 'Khadija' },
              fare: 45,
            },
          ],
          count: 12,
        },
      });
    };

    const apiCall = () => api.get('/admin/rides/active');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer une course par ID
   */
  getRide: async (id: string) => {
    const endpoint = `admin/rides/${id}`;
    console.log(`${FILE_NAME} 🔍 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          ride: {
            _id: id,
            status: 'completed',
            user: { firstName: 'Fatima', lastName: 'Benali' },
            driver: { firstName: 'Amina', lastName: 'El Amrani' },
            fare: 35,
          },
        },
      });
    };

    const apiCall = () => api.get(`/admin/rides/${id}`);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Récupérer les rapports
   */
  getReportsOverview: async (period: 'day' | 'week' | 'month' | 'year' = 'week') => {
    const endpoint = 'admin/reports/overview';
    console.log(`${FILE_NAME} 📊 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          period,
          ridesStats: [
            { _id: 'completed', count: 342, totalFare: 12500 },
            { _id: 'cancelled', count: 28, totalFare: 0 },
          ],
          newUsers: 85,
          newDrivers: 12,
          topDrivers: [
            { _id: 'd1', name: 'Amina El Amrani', rides: 45, earnings: 3850, avgRating: 4.9 },
            { _id: 'd2', name: 'Khadija Ouazzani', rides: 38, earnings: 3200, avgRating: 4.8 },
          ],
        },
      });
    };

    const apiCall = () => api.get('/admin/reports/overview', { params: { period } });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Récupérer les stats par heure
   */
  getHourlyStats: async () => {
    const endpoint = 'admin/reports/hourly';
    console.log(`${FILE_NAME} 📈 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      const hourlyStats = [];
      for (let i = 0; i < 24; i++) {
        hourlyStats.push({
          hour: `${i.toString().padStart(2, '0')}h`,
          rides: Math.floor(Math.random() * 50) + 5,
          revenue: Math.floor(Math.random() * 2000) + 200,
        });
      }
      return createMockResponse({ success: true, data: { hourlyStats } });
    };

    const apiCall = () => api.get('/admin/reports/hourly');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // ACTIVITIES
  // ==========================================================================

  /**
   * Récupérer le journal des activités
   */
  getActivities: async (params?: { type?: string; limit?: number }) => {
    const endpoint = 'admin/activities';
    console.log(`${FILE_NAME} 📋 ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          activities: [
            {
              id: 'a1',
              type: 'verification',
              action: 'Nouvelle demande',
              description: 'Fatima El Amrani a soumis ses documents',
              timestamp: 'Il y a 5 min',
            },
            {
              id: 'a2',
              type: 'ride',
              action: 'Course terminée',
              description: 'Course #R1234 terminée avec succès',
              timestamp: 'Il y a 12 min',
            },
            {
              id: 'a3',
              type: 'user',
              action: 'Nouveau compte',
              description: "Yasmine Bennani s'est inscrite",
              timestamp: 'Il y a 25 min',
            },
            {
              id: 'a4',
              type: 'payment',
              action: 'Paiement reçu',
              description: 'Paiement de 45 DH reçu',
              timestamp: 'Il y a 30 min',
            },
          ],
        },
      });
    };

    const apiCall = () => api.get('/admin/activities', { params });

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  /**
   * Récupérer les paramètres
   */
  getSettings: async () => {
    const endpoint = 'admin/settings';
    console.log(`${FILE_NAME} ⚙️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          pricing: {
            baseFare: 8,
            pricePerKm: 5,
            pricePerMinute: 0.5,
            commission: 0.15,
            minimumFare: 15,
          },
          verification: {
            autoApprove: false,
            requireFaceVerification: true,
            requirePhoneVerification: true,
          },
          app: {
            maintenanceMode: false,
            version: '1.0.0',
            environment: 'development',
          },
        },
      });
    };

    const apiCall = () => api.get('/admin/settings');

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  /**
   * Mettre à jour les paramètres
   */
  updateSettings: async (settings: any) => {
    const endpoint = 'admin/settings';
    console.log(`${FILE_NAME} ⚙️ ${endpoint}`);

    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, message: 'Paramètres mis à jour' });
    };

    const apiCall = () => api.put('/admin/settings', settings);

    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// NOTIFICATIONS API (➕ NOUVEAU v4.0.0)
// ============================================================================

export const notificationsAPI = {
  getAll: async (params?: { page?: number; limit?: number; type?: NotificationType; unreadOnly?: boolean }) => {
    const endpoint = 'notifications';
    const mockCall = async () => {
      await mockDelay();
      let notifications = [...MOCK_NOTIFICATIONS];
      if (params?.unreadOnly) notifications = notifications.filter(n => !n.isRead);
      if (params?.type) notifications = notifications.filter(n => n.type === params.type);
      return createMockResponse({ success: true, data: { notifications, total: notifications.length, page: params?.page || 1, hasMore: false } });
    };
    const apiCall = () => api.get('/notifications', { params });
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getUnreadCount: async () => {
    const endpoint = 'notifications/unread-count';
    const mockCall = async () => { await mockDelay(100); return createMockResponse({ success: true, data: { count: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length } }); };
    const apiCall = () => api.get('/notifications/unread-count');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  markAsRead: async (notificationId: string) => {
    const endpoint = `notifications/${notificationId}/read`;
    const mockCall = async () => { await mockDelay(100); return createMockResponse({ success: true }); };
    const apiCall = () => api.patch(`/notifications/${notificationId}/read`);
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  markAllAsRead: async () => {
    const endpoint = 'notifications/read-all';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true, data: { updatedCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length } }); };
    const apiCall = () => api.patch('/notifications/read-all');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  delete: async (notificationId: string) => {
    const endpoint = `notifications/${notificationId}`;
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true }); };
    const apiCall = () => api.delete(`/notifications/${notificationId}`);
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  deleteAll: async () => {
    const endpoint = 'notifications';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true }); };
    const apiCall = () => api.delete('/notifications');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  updatePushToken: async (token: string, platform: 'ios' | 'android') => {
    const endpoint = 'notifications/push-token';
    const mockCall = async () => { await mockDelay(100); return createMockResponse({ success: true }); };
    const apiCall = () => api.post('/notifications/push-token', { token, platform });
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getPreferences: async () => {
    const endpoint = 'notifications/preferences';
    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { preferences: { push: true, email: true, sms: false, types: { ride: true, payment: true, promo: true, system: true, chat: true, verification: true, safety: true, rating: true, referral: true, achievement: true }, quietHours: { enabled: false, start: '22:00', end: '07:00' } } } });
    };
    const apiCall = () => api.get('/notifications/preferences');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  updatePreferences: async (preferences: any) => {
    const endpoint = 'notifications/preferences';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true, data: { preferences } }); };
    const apiCall = () => api.put('/notifications/preferences', { preferences });
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// BADGES API (➕ NOUVEAU v4.0.0)
// ============================================================================

export const badgesAPI = {
  getAll: async () => {
    const endpoint = 'badges';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true, data: { badges: MOCK_BADGES, stats: { total: MOCK_BADGES.length, unlocked: MOCK_BADGES.filter(b => b.unlockedAt).length, totalPoints: 650 } } }); };
    const apiCall = () => api.get('/badges');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getMyBadges: async () => {
    const endpoint = 'badges/me';
    const mockCall = async () => { await mockDelay(); const unlockedBadges = MOCK_BADGES.filter(b => b.unlockedAt); return createMockResponse({ success: true, data: { badges: unlockedBadges, count: unlockedBadges.length } }); };
    const apiCall = () => api.get('/badges/me');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getProgress: async () => {
    const endpoint = 'badges/progress';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true, data: { progress: MOCK_BADGES.map(badge => ({ badge, currentValue: badge.unlockedAt ? badge.requirement.value : Math.floor(badge.requirement.value * 0.7), targetValue: badge.requirement.value, percentage: badge.unlockedAt ? 100 : 70, isUnlocked: !!badge.unlockedAt })) } }); };
    const apiCall = () => api.get('/badges/progress');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  checkNewBadges: async () => {
    const endpoint = 'badges/check';
    const mockCall = async () => { await mockDelay(); return createMockResponse({ success: true, data: { newBadges: [], hasNew: false } }); };
    const apiCall = () => api.post('/badges/check');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// SERVICES API (➕ NOUVEAU v4.0.0)
// ============================================================================

export const servicesAPI = {
  getAll: async () => {
    const endpoint = 'services';
    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          services: [
            { key: 'sally_eco', name: 'Sally Eco', nameAr: 'سالي إيكو', icon: '🌱', description: 'Économique et écologique', multiplier: 0.85, maxPassengers: 4, active: true },
            { key: 'sally_standard', name: 'Sally Standard', nameAr: 'سالي عادي', icon: '🚗', description: 'Confort quotidien', multiplier: 1.0, maxPassengers: 4, active: true },
            { key: 'sally_confort', name: 'Sally Confort', nameAr: 'سالي مريح', icon: '✨', description: 'Plus d\'espace et de confort', multiplier: 1.3, maxPassengers: 4, active: true },
            { key: 'sally_premium', name: 'Sally Premium', nameAr: 'سالي ممتاز', icon: '💎', description: 'Véhicules haut de gamme', multiplier: 1.8, maxPassengers: 4, active: true },
            { key: 'sally_xl', name: 'Sally XL', nameAr: 'سالي كبير', icon: '🚐', description: 'Pour les grands groupes', multiplier: 1.5, maxPassengers: 6, active: true },
            { key: 'sally_pool', name: 'Sally Pool', nameAr: 'سالي مشترك', icon: '👥', description: 'Partagez votre trajet', multiplier: 0.6, maxPassengers: 3, active: false },
          ],
        },
      });
    };
    const apiCall = () => api.get('/services');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getActive: async () => {
    const endpoint = 'services/active';
    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({
        success: true,
        data: {
          services: [
            { key: 'sally_eco', name: 'Sally Eco', nameAr: 'سالي إيكو', icon: '🌱', multiplier: 0.85, maxPassengers: 4 },
            { key: 'sally_standard', name: 'Sally Standard', nameAr: 'سالي عادي', icon: '🚗', multiplier: 1.0, maxPassengers: 4 },
            { key: 'sally_confort', name: 'Sally Confort', nameAr: 'سالي مريح', icon: '✨', multiplier: 1.3, maxPassengers: 4 },
            { key: 'sally_premium', name: 'Sally Premium', nameAr: 'سالي ممتاز', icon: '💎', multiplier: 1.8, maxPassengers: 4 },
            { key: 'sally_xl', name: 'Sally XL', nameAr: 'سالي كبير', icon: '🚐', multiplier: 1.5, maxPassengers: 6 },
          ],
        },
      });
    };
    const apiCall = () => api.get('/services/active');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// PRICING API (➕ NOUVEAU v4.0.0)
// ============================================================================

export const pricingAPI = {
  estimate: async (data: { pickup: { coordinates: number[] }; dropoff: { coordinates: number[] }; serviceType?: ServiceType }) => {
    const endpoint = 'pricing/estimate';
    const mockCall = async () => {
      await mockDelay(500);
      const distance = 5 + Math.random() * 10;
      const duration = Math.round(distance * 3);
      const baseFare = 8;
      const pricePerKm = 5;
      const basePrice = Math.round(baseFare + distance * pricePerKm);
      const estimates: PriceEstimate[] = [
        { serviceType: 'sally_eco', name: 'Sally Eco', nameAr: 'سالي إيكو', icon: '🌱', baseFare: 8, distanceFare: distance * 4.25, timeFare: duration * 0.4, bookingFee: 3, surgeMultiplier: 1, totalFare: Math.round(basePrice * 0.85), currency: 'MAD', estimatedDuration: duration, estimatedDistance: distance, eta: 3 },
        { serviceType: 'sally_standard', name: 'Sally Standard', nameAr: 'سالي عادي', icon: '🚗', baseFare: 8, distanceFare: distance * 5, timeFare: duration * 0.5, bookingFee: 3, surgeMultiplier: 1, totalFare: basePrice, currency: 'MAD', estimatedDuration: duration, estimatedDistance: distance, eta: 4 },
        { serviceType: 'sally_confort', name: 'Sally Confort', nameAr: 'سالي مريح', icon: '✨', baseFare: 10, distanceFare: distance * 6.5, timeFare: duration * 0.6, bookingFee: 5, surgeMultiplier: 1, totalFare: Math.round(basePrice * 1.3), currency: 'MAD', estimatedDuration: duration, estimatedDistance: distance, eta: 5 },
        { serviceType: 'sally_premium', name: 'Sally Premium', nameAr: 'سالي ممتاز', icon: '💎', baseFare: 15, distanceFare: distance * 9, timeFare: duration * 0.8, bookingFee: 5, surgeMultiplier: 1, totalFare: Math.round(basePrice * 1.8), currency: 'MAD', estimatedDuration: duration, estimatedDistance: distance, eta: 6 },
        { serviceType: 'sally_xl', name: 'Sally XL', nameAr: 'سالي كبير', icon: '🚐', baseFare: 12, distanceFare: distance * 7.5, timeFare: duration * 0.7, bookingFee: 5, surgeMultiplier: 1, totalFare: Math.round(basePrice * 1.5), currency: 'MAD', estimatedDuration: duration, estimatedDistance: distance, eta: 7 },
      ];
      return createMockResponse({ success: true, data: { estimates, surge: { active: false, multiplier: 1 } } });
    };
    const apiCall = () => api.post('/pricing/estimate', data);
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getSurge: async (coordinates: number[]) => {
    const endpoint = 'pricing/surge';
    const mockCall = async () => {
      await mockDelay(200);
      const surge = Math.random() > 0.7 ? 1.25 + Math.random() * 0.5 : 1;
      return createMockResponse({ success: true, data: { surge: { active: surge > 1, multiplier: surge, reason: surge > 1 ? 'Forte demande dans cette zone' : null } } });
    };
    const apiCall = () => api.post('/pricing/surge', { coordinates });
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  getConfig: async () => {
    const endpoint = 'pricing/config';
    const mockCall = async () => {
      await mockDelay();
      return createMockResponse({ success: true, data: { pricing: { currency: 'MAD', currencySymbol: 'DH', baseFare: 8, pricePerKm: 5, pricePerMinute: 0.5, bookingFee: 3, minimumFare: 15, maximumFare: 500, cancellationFee: 10, freeCancellationMinutes: 2 } } });
    };
    const apiCall = () => api.get('/pricing/config');
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },

  applyPromoCode: async (code: string, rideDetails: { pickup: any; dropoff: any; serviceType: ServiceType }) => {
    const endpoint = 'pricing/promo';
    const mockCall = async () => {
      await mockDelay();
      const validCodes: Record<string, { discount: number; type: 'percentage' | 'fixed'; maxDiscount?: number }> = {
        'SALLY20': { discount: 20, type: 'percentage', maxDiscount: 50 },
        'BIENVENUE': { discount: 25, type: 'fixed' },
        'VIP50': { discount: 50, type: 'percentage', maxDiscount: 100 },
      };
      const promo = validCodes[code.toUpperCase()];
      if (!promo) throw { message: 'Code promo invalide ou expiré', status: 400 };
      return createMockResponse({ success: true, data: { valid: true, discount: promo.discount, discountType: promo.type, maxDiscount: promo.maxDiscount, message: promo.type === 'percentage' ? `-${promo.discount}% appliqué!` : `-${promo.discount} DH appliqué!` } });
    };
    const apiCall = () => api.post('/pricing/promo', { code, ...rideDetails });
    return apiCallWithFallback(apiCall, mockCall, endpoint);
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Récupérer l'URL de base de l'API
 */
export const getApiBaseUrl = (): string => API_BASE_URL;

/**
 * Récupérer le mode actuel
 */
export const getAppMode = (): string => APP_MODE;

/**
 * Vérifier si on utilise les données mock
 */
export const isUsingMockData = (): boolean => USE_MOCK_DATA;

/**
 * Vérifier si l'API est disponible
 */
export const canUseApi = (): boolean => CAN_USE_API;

// Export de l'instance Axios pour usage avancé
export default api;
