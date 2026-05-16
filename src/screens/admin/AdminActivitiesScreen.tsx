/**
 * ============================================================================
 * GO WITH SALLY - ADMIN ACTIVITIES SCREEN
 * ============================================================================
 * Journal des activités - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Liste des activités récentes avec timeline
 * - Filtres par type (vérifications, courses, utilisatrices, paiements)
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminActivitiesScreen
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
  RefreshControl,
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

const FILE_NAME = '[AdminActivitiesScreen]';
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

type ActivityType = 'verification' | 'ride' | 'user' | 'driver' | 'payment' | 'system' | 'report';
type FilterType = 'all' | 'verification' | 'ride' | 'user' | 'payment';

interface Activity {
  id: string;
  _id?: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  user?: string;
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_001',
    type: 'verification',
    action: 'Vérification approuvée',
    description: 'Fatima Benali a été vérifiée comme conductrice',
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
    description: 'Paiement de 85 MAD reçu pour course #1233',
    timestamp: 'Il y a 1h',
  },
  {
    id: 'act_005',
    type: 'driver',
    action: 'Conductrice en ligne',
    description: 'Salma Tazi est maintenant disponible',
    timestamp: 'Il y a 2h',
  },
  {
    id: 'act_006',
    type: 'report',
    action: 'Signalement traité',
    description: 'Signalement #456 résolu',
    timestamp: 'Il y a 3h',
  },
  {
    id: 'act_007',
    type: 'system',
    action: 'Mise à jour système',
    description: 'Maintenance planifiée terminée',
    timestamp: 'Il y a 5h',
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminActivitiesScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

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

  const loadActivities = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des activités...`);
    console.log(`${FILE_NAME} 🔍 Filtre: ${filter}`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = MOCK_ACTIVITIES;
      if (filter !== 'all') {
        filtered = MOCK_ACTIVITIES.filter((a) => a.type === filter);
      }

      setActivities(filtered);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ ${filtered.length} activités chargées (mock)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getActivities...`);

      const response = await adminAPI.getActivities({
        type: filter === 'all' ? undefined : filter,
        limit: 50,
      });

      if (response.data.success) {
        const fetchedActivities = response.data.data.activities || [];
        const normalizedActivities = fetchedActivities.map((a: any) => ({
          ...a,
          id: a._id || a.id,
        }));
        setActivities(normalizedActivities);
        console.log(`${FILE_NAME} ✅ ${normalizedActivities.length} activités chargées`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        let filtered = MOCK_ACTIVITIES;
        if (filter !== 'all') {
          filtered = MOCK_ACTIVITIES.filter((a) => a.type === filter);
        }
        setActivities(filtered);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.activities.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, t]);

  useEffect(() => {
    setLoading(true);
    loadActivities();
  }, [filter, loadActivities]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadActivities();
  }, [loadActivities]);

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
            text2: activity.description,
          });
      }
    },
    [navigation]
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getTypeConfig = useCallback((type: string) => {
    switch (type) {
      case 'verification':
        return { icon: 'account-check', color: '#FF9800', bg: '#FF980020' };
      case 'ride':
        return { icon: 'car', color: '#2196F3', bg: '#2196F320' };
      case 'user':
        return { icon: 'account', color: '#9C27B0', bg: '#9C27B020' };
      case 'driver':
        return { icon: 'steering', color: '#4CAF50', bg: '#4CAF5020' };
      case 'payment':
        return { icon: 'cash', color: '#4CAF50', bg: '#4CAF5020' };
      case 'system':
        return { icon: 'cog', color: '#607D8B', bg: '#607D8B20' };
      case 'report':
        return { icon: 'flag', color: '#F44336', bg: '#F4433620' };
      default:
        return { icon: 'information', color: '#9E9E9E', bg: '#9E9E9E20' };
    }
  }, []);

  const filterOptions: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: t('admin.activities.filterAll'), icon: 'view-list' },
    { key: 'verification', label: t('admin.activities.filterVerifications'), icon: 'account-check' },
    { key: 'ride', label: t('admin.activities.filterRides'), icon: 'car' },
    { key: 'user', label: t('admin.activities.filterUsers'), icon: 'account' },
    { key: 'payment', label: t('admin.activities.filterPayments'), icon: 'cash' },
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

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.activities.loading')}
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

        <Text style={styles.headerTitle}>{t('admin.activities.title')}</Text>

        {__DEV__ ? <ModeBadge /> : <View style={{ width: 40 }} />}
      </View>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={[styles.filterContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {filterOptions.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? theme.colors.primary : theme.colors.surface,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={f.icon as any}
              size={16}
              color={filter === f.key ? 'white' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filter === f.key ? 'white' : theme.colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activities List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
          {activities.map((activity, index) => {
            const config = getTypeConfig(activity.type);
            return (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleActivityPress(activity)}
                activeOpacity={0.7}
              >
                <View style={[styles.activityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.activityIcon, { backgroundColor: config.bg }]}>
                    <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
                  </View>
                  <View style={[styles.activityContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <View
                      style={[
                        styles.activityHeader,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <Text style={[styles.activityAction, { color: theme.colors.text }]}>
                        {activity.action}
                      </Text>
                      <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                        {activity.timestamp}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.activityDescription,
                        { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {activity.description}
                    </Text>
                  </View>
                </View>

                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: theme.colors.border,
                        left: isRTL ? undefined : 37,
                        right: isRTL ? 37 : undefined,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {activities.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('admin.activities.empty')}
              </Text>
            </View>
          )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 10,
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Filter
  filterRow: {
    maxHeight: 60,
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Activity Card
  activityCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activityRow: {
    gap: 14,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
  },
  activityDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  timelineLine: {
    position: 'absolute',
    bottom: -12,
    width: 2,
    height: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
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

export default AdminActivitiesScreen;