/**
 * ============================================================================
 * GO WITH SALLY - SETTINGS SCREEN
 * ============================================================================
 * Écran des paramètres de l'application
 * 
 * Fonctionnalités:
 * - Changement de langue (FR, AR, EN)
 * - Changement de thème (Clair, Sombre, Système)
 * - Gestion des notifications
 * - Paramètres de confidentialité
 * - Liens légaux
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/SettingsScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Linking,
  Alert,
  I18nManager,
  Animated,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useRTL } from '../../hooks/useRTL';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[SettingsScreen]';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const THEMES: { value: 'light' | 'dark' | 'system'; labelKey: string; icon: IconName }[] = [
  { value: 'light', labelKey: 'settings.lightMode', icon: 'white-balance-sunny' },
  { value: 'dark', labelKey: 'settings.darkMode', icon: 'moon-waning-crescent' },
  { value: 'system', labelKey: 'settings.systemMode', icon: 'cellphone-cog' },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const SettingsScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { setLanguage, isChanging } = useLanguage();
  const { isRTL } = useRTL();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${themeMode}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [rideNotifications, setRideNotifications] = useState<boolean>(true);
  const [promoNotifications, setPromoNotifications] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [shareLocation, setShareLocation] = useState<boolean>(true);
  const [shareRideStatus, setShareRideStatus] = useState<boolean>(true);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLanguageChange = async (langCode: string): Promise<void> => {
    console.log(`${FILE_NAME} 🌍 Changement langue: ${langCode}`);
    setShowLanguageModal(false);

    // Use LanguageContext to handle language change + RTL properly
    await setLanguage(langCode);
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system'): void => {
    console.log(`${FILE_NAME} 🎨 Changement thème: ${mode}`);
    setThemeMode(mode);
    setShowThemeModal(false);
    Toast.show({
      type: 'success',
      text1: t('settings.themeChanged'),
    });
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(t('settings.deleteAccountTitle'), t('settings.deleteAccountDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          Toast.show({
            type: 'info',
            text1: t('common.comingSoon'),
          });
        },
      },
    ]);
  };

  const handleOpenLink = (url: string): void => {
    console.log(`${FILE_NAME} 🔗 Ouverture: ${url}`);
    Linking.openURL(url).catch((err) => {
      console.error(`${FILE_NAME} ❌ Erreur ouverture lien:`, err);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
      });
    });
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getCurrentLanguageName = (): string => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language);
    return lang ? `${lang.flag} ${lang.name}` : '🇫🇷 Français';
  };

  const getCurrentThemeLabel = (): string => {
    const th = THEMES.find((item) => item.value === themeMode);
    return th ? t(th.labelKey) : t('settings.systemMode');
  };

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  const SettingRow = ({
    icon,
    iconColor,
    iconBg,
    label,
    description,
    value,
    onPress,
    rightElement,
    isSwitch = false,
    switchValue,
    onSwitchChange,
    showBorder = true,
    danger = false,
  }: {
    icon: IconName;
    iconColor: string;
    iconBg: string;
    label: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    showBorder?: boolean;
    danger?: boolean;
  }) => {
    const content = (
      <View
        style={[
          styles.settingRow,
          showBorder && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        ]}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
          </View>
          <View style={styles.settingLabelContainer}>
            <Text
              style={[styles.settingLabel, { color: danger ? '#F44336' : theme.colors.text }]}
            >
              {label}
            </Text>
            {description && (
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                {description}
              </Text>
            )}
          </View>
        </View>

        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="white"
          />
        ) : rightElement ? (
          rightElement
        ) : (
          <View style={styles.settingRight}>
            {value && (
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                {value}
              </Text>
            )}
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={22}
              color={danger ? '#F44336' : theme.colors.textSecondary}
            />
          </View>
        )}
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
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
        {__DEV__ ? <ModeBadge /> : <View style={styles.backButton} />}
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* ================================================================ */}
        {/* APPARENCE */}
        {/* ================================================================ */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('settings.appearance')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon="translate"
            iconColor="#2196F3"
            iconBg="#2196F320"
            label={t('settings.language')}
            value={getCurrentLanguageName()}
            onPress={() => setShowLanguageModal(true)}
          />
          <SettingRow
            icon={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
            iconColor="#9C27B0"
            iconBg="#9C27B020"
            label={t('settings.theme')}
            value={getCurrentThemeLabel()}
            onPress={() => setShowThemeModal(true)}
            showBorder={false}
          />
        </View>

        {/* ================================================================ */}
        {/* NOTIFICATIONS */}
        {/* ================================================================ */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('settings.notifications')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon="bell"
            iconColor="#FF9800"
            iconBg="#FF980020"
            label={t('settings.pushNotifications')}
            isSwitch
            switchValue={pushNotifications}
            onSwitchChange={setPushNotifications}
          />
          <SettingRow
            icon="car"
            iconColor="#4CAF50"
            iconBg="#4CAF5020"
            label={t('settings.rideNotifications')}
            isSwitch
            switchValue={rideNotifications}
            onSwitchChange={setRideNotifications}
          />
          <SettingRow
            icon="tag"
            iconColor="#E91E63"
            iconBg="#E91E6320"
            label={t('settings.promoNotifications')}
            isSwitch
            switchValue={promoNotifications}
            onSwitchChange={setPromoNotifications}
          />
          <SettingRow
            icon="volume-high"
            iconColor="#00BCD4"
            iconBg="#00BCD420"
            label={t('settings.sound')}
            isSwitch
            switchValue={soundEnabled}
            onSwitchChange={setSoundEnabled}
          />
          <SettingRow
            icon="vibrate"
            iconColor="#795548"
            iconBg="#79554820"
            label={t('settings.vibration')}
            isSwitch
            switchValue={vibrationEnabled}
            onSwitchChange={setVibrationEnabled}
            showBorder={false}
          />
        </View>

        {/* ================================================================ */}
        {/* CONFIDENTIALITÉ */}
        {/* ================================================================ */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('settings.privacy')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon="map-marker"
            iconColor="#F44336"
            iconBg="#F4433620"
            label={t('settings.shareLocation')}
            description={t('settings.shareLocationDesc')}
            isSwitch
            switchValue={shareLocation}
            onSwitchChange={setShareLocation}
          />
          <SettingRow
            icon="share-variant"
            iconColor="#3F51B5"
            iconBg="#3F51B520"
            label={t('settings.shareRideStatus')}
            description={t('settings.shareRideStatusDesc')}
            isSwitch
            switchValue={shareRideStatus}
            onSwitchChange={setShareRideStatus}
            showBorder={false}
          />
        </View>

        {/* ================================================================ */}
        {/* À PROPOS */}
        {/* ================================================================ */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('settings.about')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon="file-document"
            iconColor="#607D8B"
            iconBg="#607D8B20"
            label={t('settings.termsOfService')}
            onPress={() => handleOpenLink('https://gowithsally.com/terms')}
            rightElement={
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
          />
          <SettingRow
            icon="shield-lock"
            iconColor="#607D8B"
            iconBg="#607D8B20"
            label={t('settings.privacyPolicy')}
            onPress={() => handleOpenLink('https://gowithsally.com/privacy')}
            rightElement={
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
          />
          <SettingRow
            icon="information"
            iconColor={theme.colors.primary}
            iconBg={theme.colors.primary + '20'}
            label={t('settings.version')}
            rightElement={
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                1.0.0
              </Text>
            }
            showBorder={false}
          />
        </View>

        {/* ================================================================ */}
        {/* ZONE DANGER */}
        {/* ================================================================ */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('settings.dangerZone')}
        </Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon="delete-forever"
            iconColor="#F44336"
            iconBg="#F4433620"
            label={t('settings.deleteAccount')}
            onPress={handleDeleteAccount}
            showBorder={false}
            danger
          />
        </View>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </Animated.ScrollView>

      {/* ================================================================ */}
      {/* MODAL LANGUE */}
      {/* ================================================================ */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOption,
                  i18n.language === lang.code && {
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionFlag}>{lang.flag}</Text>
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>
                  {lang.name}
                </Text>
                {i18n.language === lang.code && (
                  <MaterialCommunityIcons name="check" size={22} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: theme.colors.border }]}
              onPress={() => setShowLanguageModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL THÈME */}
      {/* ================================================================ */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.selectTheme')}
            </Text>
            {THEMES.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.value}
                style={[
                  styles.modalOption,
                  themeMode === themeOption.value && {
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
                onPress={() => handleThemeChange(themeOption.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.themeIconBg, { backgroundColor: theme.colors.background }]}>
                  <MaterialCommunityIcons
                    name={themeOption.icon}
                    size={22}
                    color={theme.colors.text}
                  />
                </View>
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>
                  {t(themeOption.labelKey)}
                </Text>
                {themeMode === themeOption.value && (
                  <MaterialCommunityIcons name="check" size={22} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: theme.colors.border }]}
              onPress={() => setShowThemeModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 14,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 200,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalOptionFlag: {
    fontSize: 26,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  themeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancel: {
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default SettingsScreen;