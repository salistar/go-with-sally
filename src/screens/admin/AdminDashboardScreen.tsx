/**
 * ============================================================================
 * GO WITH SALLY - ADMIN DASHBOARD SCREEN
 * ============================================================================
 * Tableau de bord administrateur - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Statistiques en temps réel (utilisatrices, conductrices, courses, revenus)
 * - Actions rapides vers les sections admin
 * - Activités récentes avec timeline
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminDashboardScreen
 * @version 2.2.0 - Fixed 3 columns layout
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Redux
import { useAppSelector } from '../../store';

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

const FILE_NAME = '[AdminDashboardScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  activeRides: number;
  pendingVerifications: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
}

interface Activity {
  id: string;
  type: 'verification' | 'ride' | 'user' | 'report' | 'payment' | 'driver' | 'system';
  action: string;
  description?: string;
  message?: string;
  timestamp: string;
  time?: string;
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_STATS: DashboardStats = {
  totalUsers: 1247,
  totalDrivers: 89,
  totalRides: 5632,
  activeRides: 12,
  pendingVerifications: 7,
  revenue: {
    today: 4850,
    week: 32400,
    month: 142000,
  },
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_001',
    type: 'verification',
    action: 'Nouvelle vérification',
    description: 'Fatima Benali demande à devenir conductrice',
    timestamp: 'Il y a 5 min',
  },
  {
    id: 'act_002',
    type: 'ride',
    action: 'Course terminée',
    description: 'Course #1234 complétée avec succès',
    timestamp: 'Il y a 15 min',
  },
  {
    id: 'act_003',
    type: 'user',
    action: 'Nouvelle inscription',
    description: 'Amina El Amrani a créé un compte',
    timestamp: 'Il y a 30 min',
  },
  {
    id: 'act_004',
    type: 'payment',
    action: 'Paiement reçu',
    description: '85 MAD pour course #1233',
    timestamp: 'Il y a 1h',
  },
  {
    id: 'act_005',
    type: 'driver',
    action: 'Conductrice en ligne',
    description: 'Salma Tazi est maintenant disponible',
    timestamp: 'Il y a 2h',
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminDashboardScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
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
    console.log(`${FILE_NAME} 👤 Admin: ${user?.firstName || 'Admin'}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadData = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des données...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStats(MOCK_STATS);
      setActivities(MOCK_ACTIVITIES);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ Données mock chargées`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getDashboardStats...`);

      // Charger les stats
      const statsResponse = await adminAPI.getDashboardStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
        console.log(`${FILE_NAME} ✅ Stats chargées`);
      }

      // Charger les activités
      const activitiesResponse = await adminAPI.getActivities({ limit: 5 });
      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data.activities || []);
        console.log(`${FILE_NAME} ✅ ${activitiesResponse.data.data.activities?.length || 0} activités`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        setStats(MOCK_STATS);
        setActivities(MOCK_ACTIVITIES);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.dashboard.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      console.log(`${FILE_NAME} 🔄 Focus - Rechargement`);
      loadData();
    }, [loadData])
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleQuickAction = useCallback(
    (action: string) => {
      console.log(`${FILE_NAME} 📱 Action: ${action}`);

      const routes: Record<string, string> = {
        users: 'AdminUsers',
        drivers: 'AdminDrivers',
        rides: 'AdminRides',
        verifications: 'AdminVerifications',
        reports: 'AdminReports',
        settings: 'AdminSettings',
      };

      if (routes[action]) {
        navigation.navigate(routes[action]);
      }
    },
    [navigation]
  );

  const handleActivityPress = useCallback(
    (activity: Activity) => {
      console.log(`${FILE_NAME} 📋 Activité: ${activity.id} (${activity.type})`);

      switch (activity.type) {
        case 'verification':
          navigation.navigate('AdminVerifications');
          break;
        case 'ride':
          navigation.navigate('AdminRides');
          break;
        case 'user':
          navigation.navigate('AdminUsers');
          break;
        case 'driver':
          navigation.navigate('AdminDrivers');
          break;
        default:
          Toast.show({
            type: 'info',
            text1: activity.action,
            text2: activity.description || activity.timestamp,
          });
      }
    },
    [navigation]
  );

  const handleViewAllActivities = useCallback(() => {
    console.log(`${FILE_NAME} 📋 → AdminActivities`);
    navigation.navigate('AdminActivities');
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    console.log(`${FILE_NAME} ⚙️ → AdminSettings`);
    navigation.navigate('AdminSettings');
  }, [navigation]);

  // ==========================================================================
  // DONNÉES D'AFFICHAGE - 6 Stats pour 3 colonnes x 2 lignes
  // ==========================================================================

  const statsCards = stats
    ? [
        {
          key: 'users',
          icon: 'account-group',
          label: t('admin.dashboard.totalUsers'),
          value: stats.totalUsers,
          color: '#2196F3',
        },
        {
          key: 'drivers',
          icon: 'car-multiple',
          label: t('admin.dashboard.totalDrivers'),
          value: stats.totalDrivers,
          color: theme.colors.primary,
        },
        {
          key: 'rides',
          icon: 'map-marker-path',
          label: t('admin.dashboard.activeRides'),
          value: stats.activeRides,
          color: '#4CAF50',
        },
        {
          key: 'revenue',
          icon: 'cash',
          label: t('admin.dashboard.todayRevenue'),
          value: stats.revenue?.today || 0,
          color: '#FF9800',
        },
        {
          key: 'verifications',
          icon: 'account-check',
          label: t('admin.dashboard.verifications'),
          value: stats.pendingVerifications,
          color: '#9C27B0',
        },
        {
          key: 'totalRides',
          icon: 'car',
          label: t('admin.dashboard.rides'),
          value: stats.totalRides,
          color: '#00BCD4',
        },
      ]
    : [];

  const quickActions = [
    {
      key: 'verifications',
      icon: 'account-check',
      label: t('admin.dashboard.verifications'),
      badge: stats?.pendingVerifications || 0,
    },
    { key: 'drivers', icon: 'steering', label: t('admin.dashboard.drivers'), badge: 0 },
    { key: 'users', icon: 'account-group', label: t('admin.dashboard.users'), badge: 0 },
    { key: 'rides', icon: 'car', label: t('admin.dashboard.rides'), badge: 0 },
    { key: 'reports', icon: 'chart-bar', label: t('admin.dashboard.reports'), badge: 0 },
    { key: 'settings', icon: 'cog', label: t('admin.dashboard.settings'), badge: 0 },
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
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '30' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'verification':
        return 'account-check';
      case 'ride':
        return 'car';
      case 'user':
        return 'account';
      case 'driver':
        return 'steering';
      case 'payment':
        return 'cash';
      case 'system':
        return 'cog';
      default:
        return 'flag';
    }
  };

  // Render une ligne de 3 cartes stats
  const renderStatsRow = (items: typeof statsCards, startIndex: number) => {
    const rowItems = items.slice(startIndex, startIndex + 3);
    return (
      <View key={`stats-row-${startIndex}`} style={[styles.gridRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {rowItems.map((stat) => (
          <TouchableOpacity
            key={stat.key}
            style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleQuickAction(stat.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
              <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {stat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render une ligne de 3 actions rapides
  const renderActionsRow = (items: typeof quickActions, startIndex: number) => {
    const rowItems = items.slice(startIndex, startIndex + 3);
    return (
      <View key={`actions-row-${startIndex}`} style={[styles.gridRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {rowItems.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleQuickAction(action.key)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={22}
                color={theme.colors.primary}
              />
              {action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </View>
            <Text 
              style={[styles.actionLabel, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.dashboard.loading')}
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
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.primary, paddingTop: insets.top + 10 },
        ]}
      >
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.headerGreeting}>
              {t('admin.dashboard.greeting', { name: user?.firstName || 'Admin' })} 👋
            </Text>
            <Text style={styles.headerSubtitle}>{t('admin.dashboard.subtitle')}</Text>
          </View>

          <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {__DEV__ && <ModeBadge />}
            <TouchableOpacity style={styles.menuBtn} onPress={handleMenuPress} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cog" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Stats Cards - 3 colonnes x 2 lignes */}
          <View style={styles.statsContainer}>
            {renderStatsRow(statsCards, 0)}
            {renderStatsRow(statsCards, 3)}
          </View>

          {/* Quick Actions - 3 colonnes x 2 lignes */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('admin.dashboard.quickActions')}
          </Text>
          <View style={styles.actionsContainer}>
            {renderActionsRow(quickActions, 0)}
            {renderActionsRow(quickActions, 3)}
          </View>

          {/* Recent Activities */}
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('admin.dashboard.recentActivities')}
            </Text>
            <TouchableOpacity onPress={handleViewAllActivities} activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                {t('admin.dashboard.viewAll')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.activitiesCard, { backgroundColor: theme.colors.surface }]}>
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    index < activities.length - 1 && {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                  onPress={() => handleActivityPress(activity)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(activity.type) as any}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View
                    style={[
                      styles.activityContent,
                      { alignItems: isRTL ? 'flex-end' : 'flex-start' },
                    ]}
                  >
                    <Text style={[styles.activityMessage, { color: theme.colors.text }]}>
                      {activity.action || activity.message}
                    </Text>
                    <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                      {activity.timestamp || activity.time}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyActivities}>
                <MaterialCommunityIcons name="history" size={40} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('admin.activities.noActivities')}
                </Text>
              </View>
            )}
          </View>
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
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },

  // Header
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
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

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Grid Row - 3 colonnes avec space-between
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Stats Container
  statsContainer: {
    marginBottom: 20,
  },

  // Stats Card - 31% de largeur pour 3 colonnes
  statCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
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
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Actions Container
  actionsContainer: {
    marginBottom: 20,
  },

  // Action Card - 31% de largeur pour 3 colonnes
  actionCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Activities
  activitiesCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activityItem: {
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyActivities: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    paddingTop: 20,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminDashboardScreen;