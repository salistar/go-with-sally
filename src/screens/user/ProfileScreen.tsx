/**
 * ============================================================================
 * GO WITH SALLY - PROFILE SCREEN
 * ============================================================================
 * Écran de profil utilisatrice avec statistiques et menu
 * 
 * Fonctionnalités:
 * - Header avec avatar et infos utilisateur
 * - Statistiques (courses, points, niveau)
 * - Menu de navigation
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/ProfileScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  I18nManager,
  RefreshControl,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';

// API
import { userAPI } from '../../services/api';

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

const FILE_NAME = '[ProfileScreen]';
const isRTL = I18nManager.isRTL;

// Menu items
const MENU_ITEMS = [
  { id: 'editProfile', icon: 'account-edit', labelKey: 'profile.editProfile', screen: 'EditProfile', color: '#2196F3' },
  { id: 'rideHistory', icon: 'history', labelKey: 'profile.rideHistory', screen: 'RideHistory', color: '#4CAF50' },
  { id: 'paymentMethods', icon: 'credit-card', labelKey: 'profile.paymentMethods', screen: 'PaymentMethods', color: '#FF9800' },
  { id: 'favorites', icon: 'star', labelKey: 'profile.favorites', screen: 'Favorites', color: '#FFD700' },
  { id: 'emergency', icon: 'phone-alert', labelKey: 'profile.emergencyContacts', screen: 'EmergencyContacts', color: '#F44336' },
  { id: 'notifications', icon: 'bell', labelKey: 'profile.notifications', screen: 'NotificationSettings', color: '#9C27B0' },
  { id: 'settings', icon: 'cog', labelKey: 'profile.settings', screen: 'Settings', color: '#607D8B' },
  { id: 'help', icon: 'help-circle', labelKey: 'profile.help', screen: 'Help', color: '#00BCD4' },
];

// Données simulées
const MOCK_STATS = {
  totalRides: 47,
  points: 1250,
  level: 'Gold',
  memberSince: '2024',
  savedCO2: 12.5,
};

// Niveaux avec traductions
const LEVELS = {
  Bronze: { color: '#CD7F32', minPoints: 0, icon: 'medal-outline' },
  Silver: { color: '#C0C0C0', minPoints: 500, icon: 'medal' },
  Gold: { color: '#FFD700', minPoints: 1000, icon: 'medal' },
  Platinum: { color: '#E5E4E2', minPoints: 2500, icon: 'crown' },
  Diamond: { color: '#B9F2FF', minPoints: 5000, icon: 'diamond-stone' },
};

// ============================================================================
// TYPES
// ============================================================================

interface UserStats {
  totalRides: number;
  points: number;
  level: string;
  memberSince?: string;
  savedCO2?: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ProfileScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 👤 Utilisateur: ${user?.firstName || 'Non connecté'}`);
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

  const [stats, setStats] = useState<UserStats>(MOCK_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animation d'entrée
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

    // Charger les stats
    fetchUserStats();
  }, []);

  // ==========================================================================
  // FONCTIONS API
  // ==========================================================================

  const fetchUserStats = async () => {
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      setStats(MOCK_STATS);
      return;
    }

    console.log(`${FILE_NAME} ${getModeEmoji()} Chargement des stats...`);
    setIsLoading(true);

    try {
      const response = await userAPI.getMe();
      if (response?.data) {
        // Extraire les stats du profil utilisateur
        const userData = response.data;
        setStats({
          totalRides: userData.stats?.totalRides || userData.totalRides || MOCK_STATS.totalRides,
          points: userData.stats?.points || userData.points || MOCK_STATS.points,
          level: userData.stats?.level || userData.level || MOCK_STATS.level,
          memberSince: userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : MOCK_STATS.memberSince,
          savedCO2: userData.stats?.savedCO2 || userData.savedCO2 || MOCK_STATS.savedCO2,
        });
        console.log(`${FILE_NAME} ✅ Stats chargées`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback sur données mock`);
        setStats(MOCK_STATS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshing(false);
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleMenuPress = (item: typeof MENU_ITEMS[0]): void => {
    console.log(`${FILE_NAME} 📱 Navigation: ${item.screen}`);
    navigation.navigate(item.screen);
  };

  const handleEditAvatar = (): void => {
    console.log(`${FILE_NAME} 📷 Éditer avatar`);
    Toast.show({
      type: 'info',
      text1: t('common.comingSoon'),
      text2: t('profile.avatarComingSoon'),
    });
  };

  const handleLogout = (): void => {
    console.log(`${FILE_NAME} 🚪 Demande déconnexion`);

    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            console.log(`${FILE_NAME} 🚪 Déconnexion confirmée`);

            try {
              await dispatch(logout()).unwrap();
              console.log(`${FILE_NAME} ✅ Logout réussi`);
            } catch (error) {
              console.log(`${FILE_NAME} ⚠️ Logout error:`, error);
            }

            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  const handleBecomeDriver = (): void => {
    console.log(`${FILE_NAME} 🚗 Devenir conductrice`);
    navigation.navigate('BecomeDriver');
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getLevelInfo = () => {
    const level = stats.level as keyof typeof LEVELS;
    return LEVELS[level] || LEVELS.Bronze;
  };

  const isUserVerified = (): boolean => {
    if (!user) return false;
    return user.isVerified || user.phoneVerified || user.faceVerified || false;
  };

  const getInitials = (): string => {
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  // Badge du mode
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

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ================================================================ */}
        {/* HEADER GRADIENT */}
        {/* ================================================================ */}
        <LinearGradient
          colors={['#FF69B4', '#FF1493']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          {/* Bouton retour */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          {/* Mode Badge (DEV) */}
          {__DEV__ && (
            <View style={styles.headerModeBadge}>
              <ModeBadge />
            </View>
          )}

          {/* Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity onPress={handleEditAvatar} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {getInitials()}
                </Text>
              </View>
              <View style={styles.editAvatarBadge}>
                <MaterialCommunityIcons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Nom et email */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.userName}>
              {user?.firstName || t('profile.user')} {user?.lastName || ''}
            </Text>

            <View style={styles.emailRow}>
              <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
              {isUserVerified() && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Membre depuis */}
            <Text style={styles.memberSince}>
              {t('profile.memberSince')} {stats.memberSince || '2024'}
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* ================================================================ */}
        {/* STATS CARD */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <>
              {/* Courses */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="car-multiple" size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats.totalRides}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.totalRides')}
                </Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              {/* Points */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: '#FFD700' + '20' }]}>
                  <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {stats.points.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.points')}
                </Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              {/* Niveau */}
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: getLevelInfo().color + '20' }]}>
                  <MaterialCommunityIcons
                    name={getLevelInfo().icon as any}
                    size={24}
                    color={getLevelInfo().color}
                  />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {t(`profile.levels.${stats.level.toLowerCase()}`)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {t('profile.level')}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* ================================================================ */}
        {/* ECO IMPACT */}
        {/* ================================================================ */}
        <View style={[styles.ecoCard, { backgroundColor: '#4CAF50' + '15' }]}>
          <MaterialCommunityIcons name="leaf" size={24} color="#4CAF50" />
          <View style={styles.ecoInfo}>
            <Text style={[styles.ecoValue, { color: '#4CAF50' }]}>
              {stats.savedCO2 || 12.5} kg
            </Text>
            <Text style={[styles.ecoLabel, { color: theme.colors.textSecondary }]}>
              {t('profile.co2Saved')}
            </Text>
          </View>
          <MaterialCommunityIcons name="information-outline" size={20} color="#4CAF50" />
        </View>

        {/* ================================================================ */}
        {/* DEVENIR CONDUCTRICE */}
        {/* ================================================================ */}
        <TouchableOpacity
          style={styles.becomeDriverCard}
          onPress={handleBecomeDriver}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.becomeDriverGradient}
          >
            <View style={styles.becomeDriverIcon}>
              <MaterialCommunityIcons name="steering" size={28} color="white" />
            </View>
            <View style={styles.becomeDriverInfo}>
              <Text style={styles.becomeDriverTitle}>{t('profile.becomeDriver')}</Text>
              <Text style={styles.becomeDriverSubtitle}>{t('profile.earnMoney')}</Text>
            </View>
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={24}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* ================================================================ */}
        {/* MENU */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
            },
          ]}
        >
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
                {t(item.labelKey)}
              </Text>
              <MaterialCommunityIcons
                name={isRTL ? 'chevron-left' : 'chevron-right'}
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ================================================================ */}
        {/* DÉCONNEXION */}
        {/* ================================================================ */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#F44336" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <View style={styles.footer}>
          {/* Mode info */}
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>

          {/* Version */}
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Go With Sally v1.0.0
          </Text>
        </View>

        {/* Espace en bas */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
    alignItems: 'center',
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerModeBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
  },

  // Avatar
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },

  // User Info
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 2,
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
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

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 8,
  },

  // Eco Card
  ecoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  ecoInfo: {
    flex: 1,
  },
  ecoValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ecoLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Become Driver
  becomeDriverCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  becomeDriverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  becomeDriverIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  becomeDriverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  becomeDriverTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  becomeDriverSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Menu Card
  menuCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 14,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  modeFooterText: {
    fontSize: 11,
  },
  versionText: {
    fontSize: 12,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default ProfileScreen;