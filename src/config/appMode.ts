/**
 * ============================================================================
 * GO WITH SALLY - APP MODE CONFIGURATION
 * ============================================================================
 * Configuration centralisée des modes de l'application
 * 
 * 3 MODES DISPONIBLES:
 * - OFFLINE  : Simulation complète sans backend (développement UI)
 * - HYBRID   : API réelle avec fallback sur simulation si erreur
 * - ONLINE   : API réelle uniquement (production)
 * 
 * Configuration via fichier .env:
 *   EXPO_PUBLIC_APP_MODE=offline|hybrid|online
 * 
 * @module config/appMode
 * @version 1.0.0
 * ============================================================================
 */

// ============================================================================
// CONSTANTES - NOM DU FICHIER POUR LOGS
// ============================================================================

const FILE_NAME = '[config/appMode.ts]';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Modes de l'application
 * @type {'offline' | 'hybrid' | 'online'}
 */
export type AppMode = 'offline' | 'hybrid' | 'online';

/**
 * Configuration de l'environnement
 */
export interface EnvConfig {
  APP_MODE: AppMode;
  API_URL: string;
  API_URL_PROD: string;
  SOCKET_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// ============================================================================
// LECTURE DES VARIABLES D'ENVIRONNEMENT
// ============================================================================

console.log(`${FILE_NAME} 🔧 Lecture des variables d'environnement...`);

/**
 * Récupération sécurisée des variables d'environnement Expo
 * Expo utilise EXPO_PUBLIC_* pour les variables accessibles côté client
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Essayer d'abord avec le préfixe EXPO_PUBLIC_
  const expoKey = `EXPO_PUBLIC_${key}`;
  
  // @ts-ignore - process.env peut contenir des clés dynamiques
  const value = process.env[expoKey] || process.env[key] || defaultValue;
  
  console.log(`${FILE_NAME} 📝 ${key}: ${value || '(non défini)'}`);
  
  return value;
};

// ============================================================================
// CONFIGURATION ENVIRONNEMENT
// ============================================================================

/**
 * Configuration complète de l'environnement
 * @constant {EnvConfig}
 */
export const ENV: EnvConfig = {
  // Mode de l'application (offline, hybrid, online)
  APP_MODE: (getEnvVar('APP_MODE', 'offline') as AppMode),
  
  // URL de l'API en développement
  API_URL: getEnvVar('API_URL', 'http://192.168.1.100:5000'),
  
  // URL de l'API en production
  API_URL_PROD: getEnvVar('API_URL_PROD', 'https://api.gowithsally.ma'),
  
  // URL du serveur Socket.IO
  SOCKET_URL: getEnvVar('SOCKET_URL', 'http://192.168.1.100:5000'),
  
  // Clé API Google Maps
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY', ''),
  
  // Environnement Node
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
};

// ============================================================================
// DÉRIVATION DU MODE
// ============================================================================

/**
 * Mode actuel de l'application
 * @constant {AppMode}
 */
export const APP_MODE: AppMode = ENV.APP_MODE;

/**
 * Vérifie si l'app est en mode OFFLINE (simulation complète)
 * @constant {boolean}
 */
export const IS_OFFLINE: boolean = APP_MODE === 'offline';

/**
 * Vérifie si l'app est en mode HYBRID (API + fallback simulation)
 * @constant {boolean}
 */
export const IS_HYBRID: boolean = APP_MODE === 'hybrid';

/**
 * Vérifie si l'app est en mode ONLINE (API uniquement)
 * @constant {boolean}
 */
export const IS_ONLINE: boolean = APP_MODE === 'online';

/**
 * Détermine si on doit utiliser des données simulées
 * - OFFLINE: toujours true
 * - HYBRID: true en cas d'erreur API (géré dans api.ts)
 * - ONLINE: toujours false
 * @constant {boolean}
 */
export const USE_MOCK_DATA: boolean = IS_OFFLINE;

/**
 * Détermine si on peut faire des appels API
 * - OFFLINE: false
 * - HYBRID: true
 * - ONLINE: true
 * @constant {boolean}
 */
export const CAN_USE_API: boolean = !IS_OFFLINE;

// ============================================================================
// URL DE L'API
// ============================================================================

/**
 * URL de base de l'API selon l'environnement
 * - En développement (__DEV__): utilise API_URL
 * - En production: utilise API_URL_PROD
 * @constant {string}
 */
export const API_BASE_URL: string = __DEV__ ? ENV.API_URL : ENV.API_URL_PROD;

/**
 * URL complète de l'API (avec /api)
 * @constant {string}
 */
export const API_URL: string = `${API_BASE_URL}/api`;

/**
 * URL du serveur Socket.IO
 * @constant {string}
 */
export const SOCKET_URL: string = __DEV__ ? ENV.SOCKET_URL : ENV.API_URL_PROD;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retourne une description textuelle du mode actuel
 * @returns {string} Description du mode
 */
export const getModeDescription = (): string => {
  switch (APP_MODE) {
    case 'offline':
      return '🔴 OFFLINE - Simulation complète (pas de backend)';
    case 'hybrid':
      return '🟡 HYBRID - API avec fallback simulation';
    case 'online':
      return '🟢 ONLINE - API réelle uniquement';
    default:
      return '❓ Mode inconnu';
  }
};

/**
 * Retourne l'emoji du mode actuel
 * @returns {string} Emoji
 */
export const getModeEmoji = (): string => {
  switch (APP_MODE) {
    case 'offline':
      return '🔴';
    case 'hybrid':
      return '🟡';
    case 'online':
      return '🟢';
    default:
      return '❓';
  }
};

/**
 * Vérifie si le mode permet les données simulées
 * @returns {boolean}
 */
export const canUseMockData = (): boolean => {
  return APP_MODE === 'offline' || APP_MODE === 'hybrid';
};

/**
 * Vérifie si le mode requiert une connexion API
 * @returns {boolean}
 */
export const requiresApiConnection = (): boolean => {
  return APP_MODE === 'online';
};

// ============================================================================
// LOGS DE CONFIGURATION
// ============================================================================

console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
console.log(`${FILE_NAME} 🚗 GO WITH SALLY - Configuration des Modes`);
console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
console.log(`${FILE_NAME} ${getModeDescription()}`);
console.log(`${FILE_NAME} 📍 API URL: ${API_BASE_URL}`);
console.log(`${FILE_NAME} 🔌 Socket URL: ${SOCKET_URL}`);
console.log(`${FILE_NAME} 🏗️  Environment: ${__DEV__ ? 'Development' : 'Production'}`);
console.log(`${FILE_NAME} 📊 USE_MOCK_DATA: ${USE_MOCK_DATA}`);
console.log(`${FILE_NAME} 📡 CAN_USE_API: ${CAN_USE_API}`);
console.log(`${FILE_NAME} ════════════════════════════════════════════════`);

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================
§
export default {
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