/**
 * ============================================================================
 * GO WITH SALLY - CONFIGURATION i18n
 * ============================================================================
 * Fichier: src/i18n/index.ts
 * Description: Configuration de l'internationalisation avec support RTL
 * Auteur: Go With Sally Team
 * Date: Janvier 2025
 * Version: 2.0.0
 * 
 * Langues supportées:
 * - Français (fr) - Par défaut
 * - Arabe (ar) - RTL
 * - Anglais (en)
 * ============================================================================
 */

import i18n, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[i18n/index.ts]';
const LANGUAGE_KEY = '@GoWithSally:language';

console.log(`${FILE_NAME} 🌍 Chargement du module i18n...`);

// ============================================================================
// IMPORT DES TRADUCTIONS
// ============================================================================

// Import des fichiers de traduction
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

console.log(`${FILE_NAME} 📚 Fichiers de traduction importés: FR, AR, EN`);

// ============================================================================
// CONFIGURATION DES LANGUES SUPPORTÉES
// ============================================================================

/**
 * Langues supportées avec leurs métadonnées
 * @constant {Array}
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇲🇦', rtl: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
];

/**
 * Codes des langues supportées
 * @type {Array<string>}
 */
export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(lang => lang.code);

console.log(`${FILE_NAME} 🔧 Langues supportées: ${LANGUAGE_CODES.join(', ')}`);

// ============================================================================
// RESSOURCES DE TRADUCTION
// ============================================================================

/**
 * Ressources de traduction pour i18next
 * @constant {Object}
 */
const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
};

console.log(`${FILE_NAME} 📦 Ressources configurées pour ${Object.keys(resources).length} langues`);

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupérer la langue sauvegardée dans AsyncStorage
 * @returns {Promise<string | null>} Code de la langue ou null
 */
export const getSavedLanguage = async (): Promise<string | null> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    console.log(`${FILE_NAME} 📖 Langue sauvegardée récupérée: ${language || 'aucune'}`);
    return language;
  } catch (error) {
    console.log(`${FILE_NAME} ❌ Erreur récupération langue:`, error);
    return null;
  }
};

/**
 * Sauvegarder la langue dans AsyncStorage
 * @param {string} language - Code de la langue
 * @returns {Promise<void>}
 */
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    console.log(`${FILE_NAME} 💾 Langue sauvegardée: ${language}`);
  } catch (error) {
    console.log(`${FILE_NAME} ❌ Erreur sauvegarde langue:`, error);
  }
};

/**
 * Détecter la langue du système
 * @returns {string} Code de la langue (fr par défaut si non supportée)
 */
export const detectSystemLanguage = (): string => {
  console.log(`${FILE_NAME} 🔍 Détection de la langue système...`);
  
  // Récupérer la locale du système
  const systemLocale = Localization.locale;
  console.log(`${FILE_NAME} 📱 Locale système: ${systemLocale}`);
  
  // Extraire le code de langue (ex: "fr-FR" -> "fr")
  const systemLanguage = systemLocale.split('-')[0].toLowerCase();
  console.log(`${FILE_NAME} 🏷️ Code langue extrait: ${systemLanguage}`);
  
  // Vérifier si la langue est supportée
  const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === systemLanguage);
  const detectedLanguage = isSupported ? systemLanguage : 'fr';
  
  console.log(`${FILE_NAME} ✅ Langue détectée: ${detectedLanguage} (supportée: ${isSupported})`);
  
  return detectedLanguage;
};

/**
 * Vérifier si une langue est RTL (Right-to-Left)
 * @param {string} language - Code de la langue
 * @returns {boolean} True si RTL
 */
export const isRTL = (language: string): boolean => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const rtl = lang?.rtl || false;
  console.log(`${FILE_NAME} 📐 isRTL(${language}): ${rtl}`);
  return rtl;
};

/**
 * Obtenir les informations d'une langue
 * @param {string} languageCode - Code de la langue
 * @returns {Object | undefined} Informations de la langue
 */
export const getLanguageInfo = (languageCode: string) => {
  return SUPPORTED_LANGUAGES.find((l) => l.code === languageCode);
};

/**
 * Configurer le mode RTL de l'application
 * @param {boolean} shouldBeRTL - True pour activer RTL
 * @returns {boolean} True si un rechargement est nécessaire
 */
export const configureRTL = (shouldBeRTL: boolean): boolean => {
  console.log(`${FILE_NAME} 📐 Configuration RTL demandée: ${shouldBeRTL}`);
  console.log(`${FILE_NAME} 📐 RTL actuel: ${I18nManager.isRTL}`);
  
  const needsReload = I18nManager.isRTL !== shouldBeRTL;
  
  if (needsReload) {
    console.log(`${FILE_NAME} 🔄 Changement RTL: ${I18nManager.isRTL} -> ${shouldBeRTL}`);
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    console.log(`${FILE_NAME} ⚠️ Rechargement de l'app nécessaire pour appliquer RTL`);
  } else {
    console.log(`${FILE_NAME} ✅ RTL déjà correctement configuré`);
  }
  
  return needsReload;
};

// ============================================================================
// INITIALISATION i18n
// ============================================================================

/**
 * Variable pour suivre l'état d'initialisation
 */
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialiser i18next avec la configuration
 * @returns {Promise<void>}
 */
const initI18n = async (): Promise<void> => {
  // Éviter la double initialisation
  if (isInitialized) {
    console.log(`${FILE_NAME} ⚠️ i18n déjà initialisé, ignoré`);
    return;
  }
  
  console.log(`${FILE_NAME} 🚀 Démarrage initialisation i18n...`);
  
  try {
    // 1. Récupérer la langue sauvegardée ou détecter
    const savedLanguage = await getSavedLanguage();
    const initialLanguage = savedLanguage || detectSystemLanguage();
    
    console.log(`${FILE_NAME} 🎯 Langue initiale: ${initialLanguage}`);
    
    // 2. Configurer RTL si nécessaire (arabe)
    const shouldBeRTL = isRTL(initialLanguage);
    configureRTL(shouldBeRTL);
    
    // 3. Configuration i18n
    const i18nConfig: InitOptions = {
      resources,
      lng: initialLanguage,
      fallbackLng: 'fr',
      
      // Interpolation
      interpolation: {
        escapeValue: false, // React gère déjà l'échappement
      },
      
      // Configuration React
      react: {
        useSuspense: false, // Évite les problèmes avec React Native
      },
      
      // Compatibilité JSON v4 (version actuelle de i18next)
      compatibilityJSON: 'v4',
      
      // Debug en développement
      debug: __DEV__,
    };
    
    // 4. Initialiser i18next
    await i18n
      .use(initReactI18next)
      .init(i18nConfig);
    
    isInitialized = true;
    
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
    console.log(`${FILE_NAME} ✅ i18n initialisé avec succès`);
    console.log(`${FILE_NAME} 🌐 Langue active: ${i18n.language}`);
    console.log(`${FILE_NAME} 📐 Mode RTL: ${I18nManager.isRTL}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
    
  } catch (error) {
    console.error(`${FILE_NAME} ❌ Erreur initialisation i18n:`, error);
    
    // Fallback en cas d'erreur - initialiser avec français
    try {
      await i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: 'fr',
          fallbackLng: 'fr',
          interpolation: { escapeValue: false },
          react: { useSuspense: false },
          compatibilityJSON: 'v4',
        });
      
      isInitialized = true;
      console.log(`${FILE_NAME} ⚠️ Fallback sur français effectué`);
    } catch (fallbackError) {
      console.error(`${FILE_NAME} ❌ Erreur fallback:`, fallbackError);
    }
  }
};

// Créer une promesse pour l'initialisation (permet d'attendre que i18n soit prêt)
initializationPromise = initI18n();

// ============================================================================
// FONCTIONS DE CHANGEMENT DE LANGUE
// ============================================================================

/**
 * Changer la langue de l'application
 * @param {string} language - Code de la nouvelle langue
 * @returns {Promise<{ success: boolean; needsReload: boolean }>}
 */
export const changeLanguage = async (language: string): Promise<{ success: boolean; needsReload: boolean }> => {
  console.log(`${FILE_NAME} 🔄 Demande changement de langue: ${language}`);
  
  // Vérifier si la langue est supportée
  if (!LANGUAGE_CODES.includes(language)) {
    console.error(`${FILE_NAME} ❌ Langue non supportée: ${language}`);
    return { success: false, needsReload: false };
  }
  
  try {
    // 1. Changer la langue i18n
    await i18n.changeLanguage(language);
    console.log(`${FILE_NAME} ✅ Langue i18n changée: ${language}`);
    
    // 2. Sauvegarder le choix
    await saveLanguage(language);
    
    // 3. Configurer RTL si nécessaire
    const shouldBeRTL = isRTL(language);
    const needsReload = configureRTL(shouldBeRTL);
    
    console.log(`${FILE_NAME} ✅ Langue changée avec succès: ${language}`);
    console.log(`${FILE_NAME} 📐 Rechargement nécessaire: ${needsReload}`);
    
    return { success: true, needsReload };
    
  } catch (error) {
    console.error(`${FILE_NAME} ❌ Erreur changement langue:`, error);
    return { success: false, needsReload: false };
  }
};

/**
 * Obtenir la langue actuellement active
 * @returns {string} Code de la langue active
 */
export const getCurrentLanguage = (): string => {
  const currentLang = i18n.language || 'fr';
  console.log(`${FILE_NAME} 📖 Langue actuelle: ${currentLang}`);
  return currentLang;
};

/**
 * Obtenir les informations de la langue actuelle
 * @returns {Object | undefined} Informations de la langue
 */
export const getCurrentLanguageInfo = () => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language);
};

/**
 * Vérifier si la langue active est RTL
 * @returns {boolean} True si RTL
 */
export const isCurrentLanguageRTL = (): boolean => {
  return isRTL(getCurrentLanguage());
};

/**
 * Attendre que i18n soit initialisé
 * @returns {Promise<void>}
 */
export const waitForI18nInit = async (): Promise<void> => {
  if (initializationPromise) {
    await initializationPromise;
  }
};

/**
 * Vérifier si i18n est initialisé
 * @returns {boolean}
 */
export const isI18nInitialized = (): boolean => {
  return isInitialized;
};

// ============================================================================
// EXPORT
// ============================================================================

console.log(`${FILE_NAME} 📦 Module i18n exporté`);

export default i18n;