/**
 * ============================================================================
 * GO WITH SALLY - LANGUAGE CONTEXT
 * ============================================================================
 * Fichier: src/i18n/LanguageContext.tsx
 * Description: Contexte React pour la gestion de la langue
 * Auteur: Go With Sally Team
 * Date: Janvier 2025
 * Version: 2.0.0
 * 
 * Fonctionnalités:
 * - Gestion de la langue actuelle
 * - Support RTL (arabe)
 * - Changement de langue avec sauvegarde
 * - Hook useLanguage() pour accès facile
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

// Import des fonctions i18n
import {
  changeLanguage,
  getCurrentLanguage,
  isRTL,
  SUPPORTED_LANGUAGES,
} from './index';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[LanguageContext.tsx]';

console.log(`${FILE_NAME} 🌍 Chargement du LanguageContext...`);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type pour le contexte de langue
 */
interface LanguageContextType {
  /** Code de la langue actuelle (fr, ar, en) */
  currentLanguage: string;
  /** True si la langue actuelle est RTL (arabe) */
  isRTL: boolean;
  /** Liste des langues supportées */
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  /** Fonction pour changer de langue */
  setLanguage: (language: string) => Promise<void>;
  /** True si un changement de langue est en cours */
  isChanging: boolean;
}

/**
 * Props du provider
 */
interface LanguageProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXTE
// ============================================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  
  const { t } = useTranslation();

  // ==========================================================================
  // ÉTATS
  // ==========================================================================
  
  const [currentLanguage, setCurrentLanguage] = useState<string>(getCurrentLanguage());
  const [rtl, setRtl] = useState<boolean>(isRTL(getCurrentLanguage()));
  const [isChanging, setIsChanging] = useState<boolean>(false);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 LanguageProvider monté`);
    console.log(`${FILE_NAME} 🌐 Langue actuelle: ${currentLanguage}`);
    console.log(`${FILE_NAME} 📐 RTL: ${rtl}`);
    console.log(`${FILE_NAME} 📐 I18nManager.isRTL: ${I18nManager.isRTL}`);
    
    // Synchroniser avec i18n au montage
    const lang = getCurrentLanguage();
    if (lang !== currentLanguage) {
      console.log(`${FILE_NAME} 🔄 Synchronisation: ${currentLanguage} -> ${lang}`);
      setCurrentLanguage(lang);
      setRtl(isRTL(lang));
    }
    
    return () => {
      console.log(`${FILE_NAME} 👋 LanguageProvider démonté`);
    };
  }, []);

  // ==========================================================================
  // FONCTIONS
  // ==========================================================================

  /**
   * Recharger l'application (nécessaire pour appliquer RTL)
   */
  const reloadApp = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 🔄 Rechargement de l'application...`);
    
    try {
      if (__DEV__) {
        // En mode développement, on ne peut pas recharger automatiquement
        console.log(`${FILE_NAME} ⚠️ Mode DEV - Rechargement manuel nécessaire`);
        Alert.alert(
          'Redémarrage requis',
          'Pour appliquer le changement de direction (RTL/LTR), veuillez fermer et relancer l\'application.',
          [{ text: 'OK' }]
        );
      } else {
        // En production, utiliser expo-updates
        console.log(`${FILE_NAME} 🔄 Rechargement via expo-updates...`);
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Erreur rechargement:`, error);
    }
  }, []);

  /**
   * Changer la langue de l'application
   * @param {string} language - Code de la nouvelle langue (fr, ar, en)
   */
  const setLanguage = useCallback(async (language: string): Promise<void> => {
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🔄 Demande changement de langue`);
    console.log(`${FILE_NAME} 📍 De: ${currentLanguage} -> Vers: ${language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════════════`);

    // Vérifier si c'est la même langue
    if (language === currentLanguage) {
      console.log(`${FILE_NAME} ⚠️ Même langue, pas de changement nécessaire`);
      return;
    }

    // Marquer le début du changement
    setIsChanging(true);

    try {
      // 1. Changer la langue via i18n
      console.log(`${FILE_NAME} 📝 Étape 1: Changement i18n...`);
      await changeLanguage(language);
      console.log(`${FILE_NAME} ✅ i18n changé vers: ${language}`);
      
      // 2. Mettre à jour l'état local
      console.log(`${FILE_NAME} 📝 Étape 2: Mise à jour état local...`);
      setCurrentLanguage(language);
      
      // 3. Gérer RTL
      console.log(`${FILE_NAME} 📝 Étape 3: Vérification RTL...`);
      const newIsRTL = isRTL(language);
      const rtlChanged = I18nManager.isRTL !== newIsRTL;
      
      console.log(`${FILE_NAME} 📐 Ancien RTL: ${I18nManager.isRTL}`);
      console.log(`${FILE_NAME} 📐 Nouveau RTL: ${newIsRTL}`);
      console.log(`${FILE_NAME} 📐 RTL changé: ${rtlChanged}`);
      
      setRtl(newIsRTL);

      // 4. Si changement RTL nécessaire
      if (rtlChanged) {
        console.log(`${FILE_NAME} 🔄 Changement RTL nécessaire: ${I18nManager.isRTL} -> ${newIsRTL}`);
        
        // Configurer I18nManager
        I18nManager.allowRTL(newIsRTL);
        I18nManager.forceRTL(newIsRTL);
        
        console.log(`${FILE_NAME} ✅ I18nManager configuré`);

        // Afficher un toast
        Toast.show({
          type: 'success',
          text1: t('settings.languageChanged'),
          text2: SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language,
          visibilityTime: 2000,
        });

        // Proposer de recharger l'app
        console.log(`${FILE_NAME} ⚠️ Rechargement nécessaire pour appliquer RTL`);
        
        // Délai pour laisser le toast s'afficher
        setTimeout(() => {
          Alert.alert(
            'Redémarrage requis',
            'Pour appliquer complètement le changement de direction (RTL/LTR), l\'application doit être redémarrée.',
            [
              { 
                text: 'Plus tard', 
                style: 'cancel',
                onPress: () => console.log(`${FILE_NAME} 📍 Rechargement reporté`)
              },
              { 
                text: 'Redémarrer', 
                onPress: reloadApp 
              },
            ]
          );
        }, 500);
      } else {
        // Pas de changement RTL, juste afficher le toast
        console.log(`${FILE_NAME} ✅ Pas de changement RTL nécessaire`);
        
        Toast.show({
          type: 'success',
          text1: t('settings.languageChanged'),
          text2: SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language,
          visibilityTime: 2000,
        });
      }

      console.log(`${FILE_NAME} ✅ Langue changée avec succès: ${language}`);
      
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Erreur changement langue:`, error);
      
      // Afficher erreur
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Impossible de changer la langue',
        visibilityTime: 3000,
      });
    } finally {
      // Marquer la fin du changement
      setIsChanging(false);
      console.log(`${FILE_NAME} 🏁 Fin du processus de changement de langue`);
    }
  }, [currentLanguage, t, reloadApp]);

  // ==========================================================================
  // VALEUR DU CONTEXTE
  // ==========================================================================

  const value: LanguageContextType = {
    currentLanguage,
    isRTL: rtl,
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage,
    isChanging,
  };

  console.log(`${FILE_NAME} 🎨 Rendu LanguageProvider - Langue: ${currentLanguage}, RTL: ${rtl}`);

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// ============================================================================
// HOOK PERSONNALISÉ
// ============================================================================

/**
 * Hook pour accéder au contexte de langue
 * 
 * @example
 * const { currentLanguage, setLanguage, isRTL, supportedLanguages } = useLanguage();
 * 
 * // Changer la langue
 * await setLanguage('ar');
 * 
 * // Vérifier RTL
 * if (isRTL) {
 *   // Appliquer styles RTL
 * }
 * 
 * @returns {LanguageContextType} Contexte de langue
 * @throws {Error} Si utilisé en dehors du LanguageProvider
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    console.error(`${FILE_NAME} ❌ useLanguage appelé hors du LanguageProvider!`);
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

// ============================================================================
// EXPORT
// ============================================================================

console.log(`${FILE_NAME} 📦 LanguageContext exporté`);

export default LanguageContext;