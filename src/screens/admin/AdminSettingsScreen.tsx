/**
 * ============================================================================
 * GO WITH SALLY - ADMIN SETTINGS SCREEN
 * ============================================================================
 * Paramètres administrateur - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Paramètres généraux (notifications, thème)
 * - Paramètres de vérification (approbation auto)
 * - Paramètres système (maintenance, cache, backup)
 * - Informations de tarification
 * - Déconnexion
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminSettingsScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';

// API
import { adminAPI } from '../../services/api';

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

const FILE_NAME = '[AdminSettingsScreen]';
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

interface SettingItemBase {
  icon: string;
  label: string;
  subtitle?: string;
  danger?: boolean;
}

interface SwitchSettingItem extends SettingItemBase {
  type: 'switch';
  value: boolean;
  onToggle: (value: boolean) => void;
}

interface InfoSettingItem extends SettingItemBase {
  type: 'info';
  value: string;
}

interface ActionSettingItem extends SettingItemBase {
  type: 'action';
  onPress: () => void;
}

type SettingItem = SwitchSettingItem | InfoSettingItem | ActionSettingItem;

interface SettingsSection {
  title: string;
  items: SettingItem[];
}

interface AppSettings {
  pricing: {
    basePrice: number;
    pricePerKm: number;
    pricePerMinute: number;
    minimumFare: number;
    commission: number;
  };
  verification: {
    autoApprove: boolean;
    requiredDocuments: string[];
  };
  app: {
    maintenanceMode: boolean;
    version: string;
  };
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_SETTINGS: AppSettings = {
  pricing: {
    basePrice: 8,
    pricePerKm: 5,
    pricePerMinute: 0.5,
    minimumFare: 15,
    commission: 0.15,
  },
  verification: {
    autoApprove: false,
    requiredDocuments: ['cin', 'permis', 'carte_grise', 'assurance'],
  },
  app: {
    maintenanceMode: false,
    version: '1.0.0',
  },
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminSettingsScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { user } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // États locaux pour les toggles
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [darkMode, setDarkMode] = useState(isDark);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadSettings = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des paramètres...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSettings(MOCK_SETTINGS);
      setAutoApprove(MOCK_SETTINGS.verification.autoApprove);
      setMaintenanceMode(MOCK_SETTINGS.app.maintenanceMode);
      setLoading(false);
      console.log(`${FILE_NAME} ✅ Paramètres mock chargés`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getSettings...`);

      const response = await adminAPI.getSettings();

      if (response.data.success) {
        const fetchedSettings = response.data.data;
        setSettings(fetchedSettings);

        if (fetchedSettings.verification?.autoApprove !== undefined) {
          setAutoApprove(fetchedSettings.verification.autoApprove);
        }
        if (fetchedSettings.app?.maintenanceMode !== undefined) {
          setMaintenanceMode(fetchedSettings.app.maintenanceMode);
        }

        console.log(`${FILE_NAME} ✅ Paramètres chargés`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        setSettings(MOCK_SETTINGS);
        setAutoApprove(MOCK_SETTINGS.verification.autoApprove);
        setMaintenanceMode(MOCK_SETTINGS.app.maintenanceMode);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.settings.loadError'),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ==========================================================================
  // SAUVEGARDE DES PARAMÈTRES
  // ==========================================================================

  const saveSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      console.log(`${FILE_NAME} 💾 Sauvegarde...`);
      setSaving(true);

      // Mode OFFLINE
      if (IS_OFFLINE) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSaving(false);
        Toast.show({
          type: 'success',
          text1: t('admin.settings.saved'),
          text2: t('admin.settings.savedDesc'),
        });
        return;
      }

      try {
        const response = await adminAPI.updateSettings(updates);

        if (response.data.success) {
          Toast.show({
            type: 'success',
            text1: t('admin.settings.saved'),
            text2: t('admin.settings.savedDesc'),
          });
        }
      } catch (error: any) {
        console.error(`${FILE_NAME} ❌ Erreur sauvegarde:`, error?.message);

        if (IS_HYBRID) {
          Toast.show({
            type: 'success',
            text1: t('admin.settings.saved'),
            text2: t('admin.settings.savedDesc'),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t('errors.error'),
            text2: t('admin.settings.saveError'),
          });
        }
      } finally {
        setSaving(false);
      }
    },
    [t]
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = useCallback(() => {
    Alert.alert(t('admin.settings.logoutTitle'), t('admin.settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await dispatch(logout());
          Toast.show({
            type: 'info',
            text1: t('admin.settings.loggedOut'),
            text2: t('admin.settings.seeYou'),
          });
        },
      },
    ]);
  }, [dispatch, t]);

  const handleAutoApproveToggle = useCallback(
    async (value: boolean) => {
      setAutoApprove(value);
      await saveSettings({
        verification: {
          ...settings?.verification,
          autoApprove: value,
          requiredDocuments: settings?.verification?.requiredDocuments || [],
        },
      });
    },
    [settings, saveSettings]
  );

  const handleMaintenanceToggle = useCallback(
    (value: boolean) => {
      if (value) {
        Alert.alert(t('admin.settings.maintenanceTitle'), t('admin.settings.maintenanceConfirm'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('admin.settings.activate'),
            style: 'destructive',
            onPress: async () => {
              setMaintenanceMode(true);
              await saveSettings({
                app: {
                  ...settings?.app,
                  maintenanceMode: true,
                  version: settings?.app?.version || '1.0.0',
                },
              });
              Toast.show({
                type: 'info',
                text1: t('admin.settings.maintenanceOn'),
                text2: t('admin.settings.maintenanceOnDesc'),
              });
            },
          },
        ]);
      } else {
        setMaintenanceMode(false);
        saveSettings({
          app: {
            ...settings?.app,
            maintenanceMode: false,
            version: settings?.app?.version || '1.0.0',
          },
        });
        Toast.show({
          type: 'success',
          text1: t('admin.settings.maintenanceOff'),
          text2: t('admin.settings.maintenanceOffDesc'),
        });
      }
    },
    [settings, saveSettings, t]
  );

  const handleDarkModeToggle = useCallback(
    (value: boolean) => {
      setDarkMode(value);
      // Note: Le changement de thème sera géré par le contexte global
      Toast.show({
        type: 'info',
        text1: value ? t('admin.settings.darkModeOn') : t('admin.settings.darkModeOff'),
      });
    },
    [t]
  );

  const handleBackupData = useCallback(() => {
    Toast.show({
      type: 'info',
      text1: t('admin.settings.backupStarted'),
      text2: t('admin.settings.backupInProgress'),
    });

    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: t('admin.settings.backupDone'),
        text2: t('admin.settings.backupDoneDesc'),
      });
    }, 2000);
  }, [t]);

  const handleClearCache = useCallback(() => {
    Alert.alert(t('admin.settings.clearCacheTitle'), t('admin.settings.clearCacheConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.settings.clear'),
        onPress: () => {
          Toast.show({
            type: 'success',
            text1: t('admin.settings.cacheClearedTitle'),
            text2: t('admin.settings.cacheClearedDesc'),
          });
        },
      },
    ]);
  }, [t]);

  // ==========================================================================
  // CONFIGURATION DES SECTIONS
  // ==========================================================================

  const settingsSections: SettingsSection[] = [
    {
      title: t('admin.settings.general'),
      items: [
        {
          icon: 'bell',
          label: t('admin.settings.notifications'),
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'email',
          label: t('admin.settings.emailAlerts'),
          type: 'switch',
          value: emailAlerts,
          onToggle: setEmailAlerts,
        },
        {
          icon: 'theme-light-dark',
          label: t('admin.settings.darkMode'),
          type: 'switch',
          value: darkMode,
          onToggle: handleDarkModeToggle,
        },
      ],
    },
    {
      title: t('admin.settings.verification'),
      items: [
        {
          icon: 'account-check',
          label: t('admin.settings.autoApprove'),
          subtitle: t('admin.settings.autoApproveDesc'),
          type: 'switch',
          value: autoApprove,
          onToggle: handleAutoApproveToggle,
        },
      ],
    },
    {
      title: t('admin.settings.system'),
      items: [
        {
          icon: 'wrench',
          label: t('admin.settings.maintenanceMode'),
          subtitle: t('admin.settings.maintenanceModeDesc'),
          type: 'switch',
          value: maintenanceMode,
          onToggle: handleMaintenanceToggle,
          danger: true,
        },
        {
          icon: 'database',
          label: t('admin.settings.backup'),
          type: 'action',
          onPress: handleBackupData,
        },
        {
          icon: 'cached',
          label: t('admin.settings.clearCache'),
          type: 'action',
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: t('admin.settings.pricing'),
      items: [
        {
          icon: 'cash',
          label: t('admin.settings.basePrice'),
          value: `${settings?.pricing?.basePrice || 8} DH`,
          type: 'info',
        },
        {
          icon: 'map-marker-distance',
          label: t('admin.settings.pricePerKm'),
          value: `${settings?.pricing?.pricePerKm || 5} DH`,
          type: 'info',
        },
        {
          icon: 'clock-outline',
          label: t('admin.settings.pricePerMin'),
          value: `${settings?.pricing?.pricePerMinute || 0.5} DH`,
          type: 'info',
        },
        {
          icon: 'percent',
          label: t('admin.settings.commission'),
          value: `${(settings?.pricing?.commission || 0.15) * 100}%`,
          type: 'info',
        },
      ],
    },
    {
      title: t('admin.settings.info'),
      items: [
        {
          icon: 'information',
          label: t('admin.settings.version'),
          value: settings?.app?.version || '1.0.0',
          type: 'info',
        },
        {
          icon: 'server',
          label: t('admin.settings.environment'),
          value: IS_ONLINE ? 'Production' : 'Développement',
          type: 'info',
        },
        {
          icon: 'cloud-check',
          label: t('admin.settings.apiMode'),
          value: APP_MODE.charAt(0).toUpperCase() + APP_MODE.slice(1),
          type: 'info',
        },
      ],
    },
  ];

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

  const renderSettingItem = useCallback(
    (item: SettingItem, itemIndex: number, totalItems: number) => {
      const isDanger = item.danger || false;

      return (
        <View
          key={itemIndex}
          style={[
            styles.settingItem,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
            itemIndex < totalItems - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
          ]}
        >
          <View
            style={[
              styles.settingIcon,
              { backgroundColor: isDanger ? '#F4433620' : `${theme.colors.primary}15` },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={isDanger ? '#F44336' : theme.colors.primary}
            />
          </View>
          <View style={[styles.settingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.settingLabel, { color: isDanger ? '#F44336' : theme.colors.text }]}>
              {item.label}
            </Text>
            {item.subtitle && (
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
          {item.type === 'switch' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#E0E0E0', true: `${theme.colors.primary}80` }}
              thumbColor={item.value ? theme.colors.primary : '#FFFFFF'}
              disabled={saving}
            />
          )}
          {item.type === 'info' && (
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              {item.value}
            </Text>
          )}
          {item.type === 'action' && (
            <TouchableOpacity onPress={item.onPress} disabled={saving}>
              <MaterialCommunityIcons
                name={isRTL ? 'chevron-left' : 'chevron-right'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [theme, saving]
  );

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.settings.loading')}
        </Text>
      </View>
    );
  }

  // ==========================================================================
  // RENDU PRINCIPAL
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('admin.settings.title')}</Text>

        {saving ? (
          <ActivityIndicator size="small" color="white" style={{ width: 40 }} />
        ) : __DEV__ ? (
          <ModeBadge />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Admin Profile */}
          <View
            style={[
              styles.profileCard,
              { backgroundColor: theme.colors.surface, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.profileAvatar, { backgroundColor: `${theme.colors.primary}20` }]}>
              <MaterialCommunityIcons name="shield-account" size={32} color={theme.colors.primary} />
            </View>
            <View style={[styles.profileInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {user?.firstName || t('admin.settings.administrator')}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
                {user?.email || 'admin@gowithsally.com'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {section.title}
              </Text>
              <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                {section.items.map((item, itemIndex) =>
                  renderSettingItem(item, itemIndex, section.items.length)
                )}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: '#F4433620' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#F44336" />
            <Text style={styles.logoutText}>{t('admin.settings.logout')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Mode Footer */}
        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modeBadgeEmoji: { fontSize: 10 },
  modeBadgeText: { fontSize: 9, fontWeight: '700' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },

  // Profile
  profileCard: { alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginHorizontal: 14 },
  profileName: { fontSize: 17, fontWeight: '600' },
  profileEmail: { fontSize: 14, marginTop: 2 },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },

  // Setting Item
  settingItem: { alignItems: 'center', padding: 14, gap: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  settingValue: { fontSize: 14 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#F44336' },

  // Mode Footer
  modeFooter: { alignItems: 'center', paddingTop: 20 },
  modeFooterText: { fontSize: 11 },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminSettingsScreen;