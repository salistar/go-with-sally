/**
 * ============================================================================
 * GO WITH SALLY - APP CONFIGURATION
 * ============================================================================
 * Configuration centralisée de l'application mobile
 * 
 * Ce fichier exporte toutes les configurations de l'app:
 * - Modes (OFFLINE/HYBRID/ONLINE)
 * - URLs API
 * - Configuration Map
 * - Tarification
 * - Couleurs thème
 * 
 * @module config/index
 * @version 2.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTS
// ============================================================================

import appMode, {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  USE_MOCK_DATA,
  CAN_USE_API,
  API_BASE_URL,
  API_URL,
  SOCKET_URL,
  ENV,
  getModeDescription,
  getModeEmoji,
  canUseMockData,
  requiresApiConnection,
} from './appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[config/index.ts]';

console.log(`${FILE_NAME} 🔧 Chargement de la configuration...`);

// ============================================================================
// RE-EXPORT DES MODES
// ============================================================================

export {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  USE_MOCK_DATA,
  CAN_USE_API,
  API_BASE_URL,
  API_URL,
  SOCKET_URL,
  ENV,
  getModeDescription,
  getModeEmoji,
  canUseMockData,
  requiresApiConnection,
};

// Compatibilité avec l'ancien code (OFFLINE_MODE)
export const OFFLINE_MODE = IS_OFFLINE;

// ============================================================================
// CONFIGURATION PRINCIPALE
// ============================================================================

export const APP_CONFIG = {
  APP_MODE: APP_MODE,
  OFFLINE_MODE: IS_OFFLINE,
  API_URL: API_BASE_URL,
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  APP_NAME: 'Go With Sally',
  APP_DESCRIPTION: 'VTC 100% féminin au Maroc',
  SUPPORT_EMAIL: 'support@gowithsally.ma',
  SUPPORT_PHONE: '+212 5 22 00 00 00',
};

console.log(`${FILE_NAME} ✅ APP_CONFIG - Mode: ${APP_CONFIG.APP_MODE}`);

// ============================================================================
// CONFIGURATION API
// ============================================================================

export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 300000,
};

// ============================================================================
// CONFIGURATION MAP
// ============================================================================

export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 33.5731,
    longitude: -7.5898,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  SEARCH_RADIUS: 5000,
  DRIVER_LOCATION_INTERVAL: 10000,
  ZOOM_LEVELS: {
    CITY: 0.05,
    NEIGHBORHOOD: 0.02,
    STREET: 0.005,
    BUILDING: 0.001,
  },
};

// ============================================================================
// CONFIGURATION TARIFICATION
// ============================================================================

export const PRICING_CONFIG = {
  BASE_FARE: 8,
  PRICE_PER_KM: 5,
  PRICE_PER_MINUTE: 0.5,
  MIN_FARE: 15,
  BOOKING_FEE: 2,
  CANCELLATION_FEE: 10,
  VEHICLE_MULTIPLIERS: {
    standard: 1.0,
    comfort: 1.3,
    premium: 1.8,
    xl: 1.5,
  },
  SALLY_COMMISSION: 0.15,
  SURGE_MULTIPLIERS: {
    low: 1.0,
    medium: 1.25,
    high: 1.5,
    veryHigh: 2.0,
  },
};

// ============================================================================
// CONFIGURATION SOCKET
// ============================================================================

export const SOCKET_CONFIG = {
  RECONNECTION_ATTEMPTS: 10,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  TIMEOUT: 20000,
  EVENTS: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    RIDE_UPDATE: 'ride:update',
    DRIVER_LOCATION: 'driver:location',
    NEW_RIDE_REQUEST: 'ride:new_request',
    MESSAGE: 'chat:message',
  },
};

// ============================================================================
// CONFIGURATION NOTIFICATIONS
// ============================================================================

export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    RIDES: 'ride_notifications',
    MESSAGES: 'message_notifications',
    PROMOTIONS: 'promo_notifications',
    SOS: 'sos_notifications',
  },
};

// ============================================================================
// CONFIGURATION LANGUES
// ============================================================================

export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇲🇦', rtl: true },
  { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
];

// ============================================================================
// NUMÉROS D'URGENCE
// ============================================================================

export const EMERGENCY_NUMBERS = {
  POLICE: '19',
  AMBULANCE: '15',
  FIRE: '15',
  GENDARMERIE: '177',
  SALLY_SUPPORT: '+212600000000',
};

// ============================================================================
// COULEURS THÈME
// ============================================================================

export const COLORS = {
  PRIMARY: '#FF69B4',
  PRIMARY_DARK: '#FF1493',
  PRIMARY_LIGHT: '#FFB6C1',
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FF9800',
  INFO: '#2196F3',
};

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

console.log(`${FILE_NAME} ✅ Configuration complète chargée`);

export default APP_CONFIG;