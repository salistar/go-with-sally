/**
 * ============================================================================
 * GO WITH SALLY - SETTINGS SCREEN
 * ============================================================================
 * Fichier: src/screens/common/SettingsScreen.tsx
 * Description: Écran des paramètres de l'application
 * Auteur: Go With Sally Team
 * Date: Janvier 2025
 * Version: 2.0.0
 * 
 * Fonctionnalités:
 * - Sélecteur de langue (FR/AR/EN) avec support RTL
 * - Sélecteur de thème (Clair/Sombre/Système)
 * - Configuration des notifications
 * - Sélecteur de mode app (Offline/Hybrid/Online) - DEV uniquement
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';

// Navigation
import { useNavigation } from '@react-navigation/native';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setLanguage, setTheme as setThemeAction, updateNotifications } from '../../store/slices/settingsSlice';

// i18n
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/LanguageContext';

// Thème
import { useTheme } from '../../utils/ThemeContext';

// Config (pour les modes)
import { APP_MODE, IS_OFFLINE, IS_HYBRID, IS_ONLINE, getModeEmoji } from '../../config';

// Icônes
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Toast
import Toast from 'react-native-toast-message';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[SettingsScreen.tsx]';

/**
 * Configuration des thèmes disponibles
 */
const THEMES = [
  { value: 'light', icon: 'white-balance-sunny', label: 'settings.lightMode' },
  { value: 'dark', icon: 'moon-waning-crescent', label: 'settings.darkMode' },
  { value: 'system', icon: 'cellphone', label: 'settings.systemMode' },
] as const;

/**
 * Configuration des modes de l'app (DEV uniquement)
 */
const APP_MODES = [
  { value: 'offline', icon: 'wifi-off', label: 'Offline', color: '#F44336' },
  { value: 'hybrid', icon: 'wifi-strength-2', label: 'Hybrid', color: '#FF9800' },
  { value: 'online', icon: 'wifi', label: 'Online', color: '#4CAF50' },
] as const;

// ============================================================================
// TYPES
// ============================================================================

type ThemeMode = 'light' | 'dark' | 'system';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const SettingsScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  console.log(`${FILE_NAME} 🚀 Initialisation du composant`);

  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Utiliser useLanguage pour la gestion des langues
  const { 
    currentLanguage, 
    setLanguage: setAppLanguage, 
    supportedLanguages,
    isRTL,
    isChanging: isLanguageChanging 
  } = useLanguage();

  // Redux state
  const { notifications } = useSelector((state: RootState) => state.settings);

  console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
  console.log(`${FILE_NAME} 🌐 Langue: ${currentLanguage}`);
  console.log(`${FILE_NAME} 📐 RTL: ${isRTL}`);
  console.log(`${FILE_NAME} 📱 Mode App: ${APP_MODE}`);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ✅ Composant monté`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Changer la langue de l'application
   */
  const handleLanguageChange = async (langCode: string): Promise<void> => {
    console.log(`${FILE_NAME} 🌐 Changement de langue: ${currentLanguage} -> ${langCode}`);
    
    if (langCode === currentLanguage) {
      console.log(`${FILE_NAME} ⚠️ Même langue, ignoré`);
      return;
    }
    
    try {
      // Utiliser le contexte de langue (gère RTL + sauvegarde + toast)
      await setAppLanguage(langCode);
      
      // Synchroniser avec Redux
      dispatch(setLanguage(langCode as 'fr' | 'ar' | 'en'));
      
      console.log(`${FILE_NAME} ✅ Langue changée: ${langCode}`);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Erreur changement langue:`, error);
    }
  };

  /**
   * Changer le thème de l'application
   */
  const handleThemeChange = (value: ThemeMode): void => {
    console.log(`${FILE_NAME} 🎨 Changement de thème: ${themeMode} -> ${value}`);
    
    // Mettre à jour le contexte de thème
    setThemeMode(value);
    
    // Synchroniser avec Redux
    dispatch(setThemeAction(value));
    
    // Toast de confirmation
    Toast.show({
      type: 'success',
      text1: t('settings.themeChanged'),
      visibilityTime: 1500,
    });
    
    console.log(`${FILE_NAME} ✅ Thème changé: ${value}`);
  };

  /**
   * Changer une notification
   */
  const handleNotificationChange = (key: string, value: boolean): void => {
    console.log(`${FILE_NAME} 🔔 Notification ${key}: ${value}`);
    
    // Dispatch avec le bon type
    dispatch(updateNotifications({ [key]: value }));
  };

  /**
   * Afficher info mode app (DEV uniquement)
   */
  const handleModeInfo = (): void => {
    Toast.show({
      type: 'info',
      text1: `Mode: ${APP_MODE}`,
      text2: 'Modifier dans .env: EXPO_PUBLIC_APP_MODE',
      visibilityTime: 4000,
    });
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  console.log(`${FILE_NAME} 🎨 Rendu du composant`);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.settings')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ================================================================== */}
      {/* SECTION LANGUE */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.language')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {supportedLanguages.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                currentLanguage === lang.code && { 
                  backgroundColor: theme.colors.primary + '15' 
                },
                index < supportedLanguages.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
              disabled={isLanguageChanging}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: theme.colors.text }]}>
                  {lang.nativeName}
                </Text>
                <Text style={[styles.languageNameSecondary, { color: theme.colors.textSecondary }]}>
                  {lang.name}
                </Text>
              </View>
              {isLanguageChanging && currentLanguage !== lang.code ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : currentLanguage === lang.code ? (
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              ) : (
                <MaterialCommunityIcons 
                  name="circle-outline" 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Indicateur RTL */}
        {isRTL && (
          <View style={[styles.rtlBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialCommunityIcons name="format-textdirection-r-to-l" size={16} color={theme.colors.primary} />
            <Text style={[styles.rtlText, { color: theme.colors.primary }]}>
              Mode RTL actif
            </Text>
          </View>
        )}
      </View>

      {/* ================================================================== */}
      {/* SECTION THÈME */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.theme')}
        </Text>
        
        <View style={[styles.themeRow, { backgroundColor: theme.colors.surface }]}>
          {THEMES.map((themeOption) => (
            <TouchableOpacity
              key={themeOption.value}
              style={[
                styles.themeOption,
                themeMode === themeOption.value && { 
                  backgroundColor: theme.colors.primary 
                },
              ]}
              onPress={() => handleThemeChange(themeOption.value)}
            >
              <MaterialCommunityIcons
                name={themeOption.icon as any}
                size={24}
                color={themeMode === themeOption.value ? 'white' : theme.colors.text}
              />
              <Text style={[
                styles.themeLabel,
                { color: themeMode === themeOption.value ? 'white' : theme.colors.textSecondary }
              ]}>
                {t(themeOption.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ================================================================== */}
      {/* SECTION NOTIFICATIONS */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.notifications')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {/* Push Notifications */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <MaterialCommunityIcons name="bell" size={22} color={theme.colors.primary} />
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                {t('settings.pushNotifications')}
              </Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value: boolean) => handleNotificationChange('push', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={notifications.push ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Ride Notifications */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <MaterialCommunityIcons name="car" size={22} color={theme.colors.primary} />
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                {t('settings.rideNotifications')}
              </Text>
            </View>
            <Switch
              value={notifications.rideUpdates}
              onValueChange={(value: boolean) => handleNotificationChange('rideUpdates', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={notifications.rideUpdates ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <MaterialCommunityIcons name="email" size={22} color={theme.colors.primary} />
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Email
              </Text>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value: boolean) => handleNotificationChange('email', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={notifications.email ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          {/* SMS Notifications */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <MaterialCommunityIcons name="message-text" size={22} color={theme.colors.primary} />
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                SMS
              </Text>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={(value: boolean) => handleNotificationChange('sms', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={notifications.sms ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Promotions */}
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={styles.switchInfo}>
              <MaterialCommunityIcons name="tag" size={22} color={theme.colors.primary} />
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                {t('settings.promoNotifications')}
              </Text>
            </View>
            <Switch
              value={notifications.promotions}
              onValueChange={(value: boolean) => handleNotificationChange('promotions', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={notifications.promotions ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* ================================================================== */}
      {/* SECTION MODE APP (DEV UNIQUEMENT) */}
      {/* ================================================================== */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🛠️ Mode Application (DEV)
          </Text>
          
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={handleModeInfo}
          >
            <View style={styles.modeRow}>
              {APP_MODES.map((mode) => (
                <View
                  key={mode.value}
                  style={[
                    styles.modeOption,
                    APP_MODE === mode.value && { 
                      backgroundColor: mode.color + '20',
                      borderColor: mode.color,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={mode.icon as any}
                    size={20}
                    color={APP_MODE === mode.value ? mode.color : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.modeLabel,
                    { color: APP_MODE === mode.value ? mode.color : theme.colors.textSecondary }
                  ]}>
                    {mode.label}
                  </Text>
                  {APP_MODE === mode.value && (
                    <MaterialCommunityIcons name="check" size={16} color={mode.color} />
                  )}
                </View>
              ))}
            </View>
            
            <Text style={[styles.modeHint, { color: theme.colors.textSecondary }]}>
              Modifier dans .env: EXPO_PUBLIC_APP_MODE
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================================================================== */}
      {/* SECTION À PROPOS */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('settings.about')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.aboutRow}>
            <MaterialCommunityIcons name="file-document" size={22} color={theme.colors.primary} />
            <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>
              {t('settings.termsOfService')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutRow}>
            <MaterialCommunityIcons name="shield-lock" size={22} color={theme.colors.primary} />
            <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>
              {t('settings.privacyPolicy')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
            <MaterialCommunityIcons name="information" size={22} color={theme.colors.primary} />
            <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>
              {t('settings.version')}
            </Text>
            <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>
        </View>
      </View>

      {/* Espace en bas */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Langue
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  languageFlag: {
    fontSize: 28,
  },

  languageInfo: {
    flex: 1,
  },

  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },

  languageNameSecondary: {
    fontSize: 13,
    marginTop: 2,
  },

  rtlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },

  rtlText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Thème
  themeRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 8,
    gap: 8,
  },

  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },

  themeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  switchLabel: {
    fontSize: 15,
  },

  // Mode App
  modeRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },

  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },

  modeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  modeHint: {
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 12,
  },

  // À propos
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  aboutLabel: {
    flex: 1,
    fontSize: 15,
  },

  versionText: {
    fontSize: 14,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default SettingsScreen;