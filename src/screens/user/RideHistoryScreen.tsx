/**
 * ============================================================================
 * GO WITH SALLY - RIDE HISTORY SCREEN
 * ============================================================================
 * Historique des courses de la passagère
 * 
 * Fonctionnalités:
 * - Liste des courses avec filtres
 * - Détails de chaque course
 * - Statistiques globales
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/RideHistoryScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  RefreshControl,
  ActivityIndicator,
  I18nManager,
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

// API
import { rideAPI } from '../../services/api';

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

const FILE_NAME = '[RideHistoryScreen]';
const isRTL = I18nManager.isRTL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const FILTERS = [
  { id: 'all', labelKey: 'history.all', icon: 'format-list-bulleted' as IconName },
  { id: 'completed', labelKey: 'history.completed', icon: 'check-circle' as IconName },
  { id: 'cancelled', labelKey: 'history.cancelled', icon: 'close-circle' as IconName },
];

const MOCK_RIDES = [
  {
    id: 'ride_001',
    date: '2025-01-02T14:30:00',
    pickup: { name: 'Morocco Mall', address: 'Boulevard de la Corniche' },
    destination: { name: 'Twin Center', address: 'Boulevard Zerktouni' },
    driver: { firstName: 'Amina', lastName: 'E.', rating: 4.9, avatar: null },
    price: 35,
    distance: '5.2 km',
    duration: '18 min',
    status: 'completed',
    paymentMethod: 'cash',
  },
  {
    id: 'ride_002',
    date: '2025-01-01T09:15:00',
    pickup: { name: 'Gare Casa Voyageurs', address: 'Boulevard Mohamed V' },
    destination: { name: 'Aéroport Mohammed V', address: 'Nouaceur' },
    driver: { firstName: 'Fatima', lastName: 'B.', rating: 4.8, avatar: null },
    price: 120,
    distance: '28 km',
    duration: '35 min',
    status: 'completed',
    paymentMethod: 'card',
  },
  {
    id: 'ride_003',
    date: '2024-12-30T18:45:00',
    pickup: { name: 'Anfa Place', address: 'Boulevard de la Corniche' },
    destination: { name: 'Ain Diab', address: 'Casablanca' },
    driver: { firstName: 'Khadija', lastName: 'M.', rating: 4.7, avatar: null },
    price: 25,
    distance: '3.5 km',
    duration: '12 min',
    status: 'completed',
    paymentMethod: 'wallet',
  },
  {
    id: 'ride_004',
    date: '2024-12-28T12:00:00',
    pickup: { name: 'Marina Shopping', address: 'Marina de Casablanca' },
    destination: { name: 'Maarif', address: 'Casablanca' },
    driver: null,
    price: 0,
    distance: '4.2 km',
    duration: null,
    status: 'cancelled',
    cancellationReason: 'user',
    paymentMethod: null,
  },
  {
    id: 'ride_005',
    date: '2024-12-25T20:30:00',
    pickup: { name: 'Derb Sultan', address: 'Casablanca' },
    destination: { name: 'Habous', address: 'Casablanca' },
    driver: { firstName: 'Sara', lastName: 'K.', rating: 5.0, avatar: null },
    price: 18,
    distance: '2.8 km',
    duration: '10 min',
    status: 'completed',
    paymentMethod: 'cash',
  },
  {
    id: 'ride_006',
    date: '2024-12-20T16:00:00',
    pickup: { name: 'Bouskoura', address: 'Casablanca' },
    destination: { name: 'Centre Ville', address: 'Casablanca' },
    driver: { firstName: 'Nadia', lastName: 'H.', rating: 4.6, avatar: null },
    price: 45,
    distance: '12 km',
    duration: '25 min',
    status: 'completed',
    paymentMethod: 'card',
  },
];

// ============================================================================
// INTERFACES
// ============================================================================

interface Ride {
  id: string;
  date: string;
  pickup: { name: string; address: string };
  destination: { name: string; address: string };
  driver: { firstName: string; lastName: string; rating: number; avatar?: string | null } | null;
  price: number;
  distance: string;
  duration: string | null;
  status: 'completed' | 'cancelled' | 'in_progress';
  paymentMethod: string | null;
  cancellationReason?: string;
}

interface Stats {
  totalRides: number;
  totalSpent: number;
  totalDistance: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const RideHistoryScreen: React.FC = () => {
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

  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats>({ totalRides: 0, totalSpent: 0, totalDistance: 0 });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
        useNativeDriver: true,
      }),
    ]).start();

    loadRides();
  }, []);

  useEffect(() => {
    filterRides();
  }, [rides, activeFilter]);

  // ==========================================================================
  // FONCTIONS API
  // ==========================================================================

  const loadRides = async (): Promise<void> => {
    console.log(`${FILE_NAME} 📦 Chargement historique...`);

    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRides(MOCK_RIDES as Ride[]);
      calculateStats(MOCK_RIDES as Ride[]);
      setIsLoading(false);
      return;
    }

    try {
      if (IS_HYBRID || IS_ONLINE) {
        console.log(`${FILE_NAME} ${getModeEmoji()} Appel API...`);
        const response = await rideAPI.getHistory();
        if (response?.data) {
          const ridesData = Array.isArray(response.data) ? response.data : response.data.rides || [];
          setRides(ridesData);
          calculateStats(ridesData);
          console.log(`${FILE_NAME} ✅ ${ridesData.length} courses chargées`);
        } else {
          throw new Error('No rides data');
        }
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback sur données mock`);
        setRides(MOCK_RIDES as Ride[]);
        calculateStats(MOCK_RIDES as Ride[]);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('errors.somethingWrong'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    console.log(`${FILE_NAME} 🔄 Refresh`);
    setIsRefreshing(true);
    await loadRides();
    setIsRefreshing(false);
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const calculateStats = (ridesList: Ride[]): void => {
    const completedRides = ridesList.filter((r) => r.status === 'completed');
    const totalSpent = completedRides.reduce((sum, r) => sum + r.price, 0);
    const totalDistance = completedRides.reduce((sum, r) => {
      const km = parseFloat(r.distance.replace(' km', ''));
      return sum + (isNaN(km) ? 0 : km);
    }, 0);

    setStats({
      totalRides: completedRides.length,
      totalSpent,
      totalDistance: Math.round(totalDistance * 10) / 10,
    });
  };

  const filterRides = (): void => {
    if (activeFilter === 'all') {
      setFilteredRides(rides);
    } else {
      setFilteredRides(rides.filter((ride) => ride.status === activeFilter));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('history.today');
    if (date.toDateString() === yesterday.toDateString()) return t('history.yesterday');

    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string | null): IconName => {
    switch (method) {
      case 'cash':
        return 'cash';
      case 'card':
        return 'credit-card';
      case 'wallet':
        return 'wallet';
      default:
        return 'help-circle';
    }
  };

  const getPaymentColor = (method: string | null): string => {
    switch (method) {
      case 'cash':
        return '#4CAF50';
      case 'card':
        return '#2196F3';
      case 'wallet':
        return '#FF9800';
      default:
        return theme.colors.textSecondary;
    }
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

  // ==========================================================================
  // RENDER STATS HEADER
  // ==========================================================================

  const renderStatsHeader = () => (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FF69B4', '#FF1493']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <MaterialCommunityIcons name="car-multiple" size={22} color="#FF69B4" />
          </View>
          <Text style={styles.statValue}>{stats.totalRides}</Text>
          <Text style={styles.statLabel}>{t('profile.totalRides')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <MaterialCommunityIcons name="cash-multiple" size={22} color="#FF69B4" />
          </View>
          <Text style={styles.statValue}>{stats.totalSpent} DH</Text>
          <Text style={styles.statLabel}>{t('ride.total')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <MaterialCommunityIcons name="map-marker-distance" size={22} color="#FF69B4" />
          </View>
          <Text style={styles.statValue}>{stats.totalDistance} km</Text>
          <Text style={styles.statLabel}>{t('ride.distance')}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // ==========================================================================
  // RENDER ITEM
  // ==========================================================================

  const renderRideItem = ({ item, index }: { item: Ride; index: number }) => {
    const isCancelled = item.status === 'cancelled';
    const paymentIconName = getPaymentIcon(item.paymentMethod);
    const paymentColor = getPaymentColor(item.paymentMethod);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30 + index * 10],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[styles.rideCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('RideDetails', { ride: item })}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.rideHeader}>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {formatDate(item.date)}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {formatTime(item.date)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isCancelled ? '#F4433615' : '#4CAF5015' },
              ]}
            >
              <MaterialCommunityIcons
                name={isCancelled ? 'close-circle' : 'check-circle'}
                size={14}
                color={isCancelled ? '#F44336' : '#4CAF50'}
              />
              <Text style={[styles.statusText, { color: isCancelled ? '#F44336' : '#4CAF50' }]}>
                {isCancelled ? t('history.cancelled') : t('history.completed')}
              </Text>
            </View>
          </View>

          {/* Trip Container */}
          <View style={styles.tripContainer}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: '#4CAF50' }]}>
                <View style={styles.tripDotInner} />
              </View>
              <View style={styles.tripTextContainer}>
                <Text style={[styles.tripName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.pickup.name}
                </Text>
                <Text
                  style={[styles.tripAddress, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.pickup.address}
                </Text>
              </View>
            </View>
            <View style={[styles.tripLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="flag-checkered" size={8} color="white" />
              </View>
              <View style={styles.tripTextContainer}>
                <Text style={[styles.tripName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.destination.name}
                </Text>
                <Text
                  style={[styles.tripAddress, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.destination.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.rideFooter, { borderTopColor: theme.colors.border }]}>
            {item.driver ? (
              <View style={styles.driverInfo}>
                <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.driverInitial, { color: theme.colors.primary }]}>
                    {item.driver.firstName[0]}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.driverName, { color: theme.colors.text }]}>
                    {item.driver.firstName} {item.driver.lastName}
                  </Text>
                  <View style={styles.driverRatingRow}>
                    <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                    <Text style={[styles.driverRating, { color: theme.colors.textSecondary }]}>
                      {item.driver.rating}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.driverInfo}>
                <View style={[styles.driverAvatar, { backgroundColor: theme.colors.border }]}>
                  <MaterialCommunityIcons name="account-off" size={18} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.noDriverText, { color: theme.colors.textSecondary }]}>
                  {t('history.noDriver')}
                </Text>
              </View>
            )}

            <View style={styles.rideStats}>
              {item.duration && (
                <View style={styles.rideStat}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                    {item.duration}
                  </Text>
                </View>
              )}
              {item.price > 0 && (
                <View style={[styles.priceContainer, { backgroundColor: paymentColor + '15' }]}>
                  <MaterialCommunityIcons name={paymentIconName} size={16} color={paymentColor} />
                  <Text style={[styles.priceText, { color: paymentColor }]}>{item.price} DH</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ==========================================================================
  // RENDER EMPTY
  // ==========================================================================

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
        <MaterialCommunityIcons name="car-off" size={50} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('history.noRides')}</Text>
      <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
        {t('history.noRidesDesc')}
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={20} color="white" />
        <Text style={styles.emptyButtonText}>{t('home.bookNow')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ==========================================================================
  // RENDU PRINCIPAL
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.colors.surface }]}>
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
          {t('profile.rideHistory')}
        </Text>
        {__DEV__ ? <ModeBadge /> : <View style={styles.backButton} />}
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === filter.id ? theme.colors.primary : theme.colors.background,
              },
            ]}
            onPress={() => setActiveFilter(filter.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={filter.icon}
              size={16}
              color={activeFilter === filter.id ? 'white' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === filter.id ? 'white' : theme.colors.textSecondary },
              ]}
            >
              {t(filter.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          ListHeaderComponent={rides.length > 0 ? renderStatsHeader : null}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* Mode Footer */}
      {!isLoading && (
        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 10 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      )}
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

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 10,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Ride Card
  rideCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Trip
  tripContainer: {
    marginBottom: 16,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  tripDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  tripTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  tripName: {
    fontSize: 14,
    fontWeight: '600',
  },
  tripAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  tripLine: {
    width: 2,
    height: 20,
    marginLeft: 8,
    marginVertical: 4,
  },

  // Footer
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: 13,
    fontWeight: '600',
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  driverRating: {
    fontSize: 12,
  },
  noDriverText: {
    fontSize: 13,
  },
  rideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rideStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Mode Footer
  modeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default RideHistoryScreen;