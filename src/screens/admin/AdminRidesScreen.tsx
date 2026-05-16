/**
 * ============================================================================
 * GO WITH SALLY - ADMIN RIDES SCREEN (v2.1.0 - FIXED)
 * ============================================================================
 * Historique et gestion des courses - Connecté à l'API
 * 
 * FIXED v2.1.0:
 * - Protection contre _id undefined (erreur substring)
 * - Protection contre pickup/destination undefined
 * - Compatible avec les données API et mock
 * - Helpers sécurisés pour tous les accès aux données
 * 
 * Fonctionnalités:
 * - Liste des courses avec filtres (toutes, en cours, terminées, annulées)
 * - Modal de détails avec itinéraire, participants, informations
 * - Statistiques en haut (total, terminées, en cours, revenus)
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminRidesScreen
 * @version 2.1.0
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
  Modal,
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

const FILE_NAME = '[AdminRidesScreen]';
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

type RideStatus = 'completed' | 'cancelled' | 'in_progress' | 'searching' | 'accepted' | 'arriving';
type PaymentMethod = 'cash' | 'card' | 'wallet';
type FilterType = 'all' | 'completed' | 'active' | 'cancelled';

interface Location {
  name?: string;
  address?: string;
  coordinates?: {
    coordinates: [number, number];
  };
}

interface Ride {
  _id?: string;
  id?: string;
  status?: RideStatus;
  user?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  };
  driver?: {
    _id?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  passenger?: {
    firstName?: string;
    lastName?: string;
  };
  pickup?: Location;
  destination?: Location;
  price?: number;
  estimatedPrice?: number;
  distance?: number | string;
  duration?: number | string;
  paymentMethod?: PaymentMethod;
  createdAt?: string;
  completedAt?: string;
  rating?: {
    driverRating?: number;
    passengerRating?: number;
  };
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_RIDES: Ride[] = [
  {
    _id: 'ride_001',
    status: 'completed',
    user: { _id: 'u1', firstName: 'Fatima', lastName: 'Benali' },
    driver: { _id: 'd1', user: { firstName: 'Amina', lastName: 'El Amrani' } },
    pickup: { name: 'Gare Casa Voyageurs', address: 'Boulevard Mohammed V, Casablanca' },
    destination: { name: 'Morocco Mall', address: 'Boulevard de la Corniche, Casablanca' },
    price: 45,
    distance: 8500,
    duration: 1200,
    paymentMethod: 'cash',
    createdAt: '2025-01-05T14:30:00Z',
    completedAt: '2025-01-05T14:50:00Z',
    rating: { driverRating: 5 },
  },
  {
    _id: 'ride_002',
    status: 'in_progress',
    user: { _id: 'u2', firstName: 'Salma', lastName: 'Tazi' },
    driver: { _id: 'd2', user: { firstName: 'Nadia', lastName: 'Chaoui' } },
    pickup: { name: 'Anfa Place', address: 'Boulevard d\'Anfa, Casablanca' },
    destination: { name: 'Aéroport Mohammed V', address: 'Nouaceur' },
    estimatedPrice: 180,
    distance: 32000,
    duration: 2400,
    paymentMethod: 'card',
    createdAt: '2025-01-05T15:00:00Z',
  },
  {
    _id: 'ride_003',
    status: 'searching',
    user: { _id: 'u3', firstName: 'Khadija', lastName: 'Alaoui' },
    pickup: { name: 'Twin Center', address: 'Boulevard Zerktouni, Casablanca' },
    destination: { name: 'Ain Diab', address: 'Corniche Ain Diab, Casablanca' },
    estimatedPrice: 35,
    distance: 5000,
    duration: 900,
    paymentMethod: 'wallet',
    createdAt: '2025-01-05T15:10:00Z',
  },
  {
    _id: 'ride_004',
    status: 'cancelled',
    user: { _id: 'u4', firstName: 'Rachida', lastName: 'Bennani' },
    pickup: { name: 'Maarif', address: 'Rue Ibnou Rochd, Casablanca' },
    destination: { name: 'Sidi Maarouf', address: 'Casablanca' },
    estimatedPrice: 55,
    distance: 9000,
    duration: 1500,
    paymentMethod: 'cash',
    createdAt: '2025-01-05T13:00:00Z',
  },
  {
    _id: 'ride_005',
    status: 'completed',
    user: { _id: 'u5', firstName: 'Layla', lastName: 'Idrissi' },
    driver: { _id: 'd3', user: { firstName: 'Zineb', lastName: 'Hassani' } },
    pickup: { name: 'Derb Sultan', address: 'Casablanca' },
    destination: { name: 'Hay Mohammadi', address: 'Casablanca' },
    price: 28,
    distance: 4200,
    duration: 720,
    paymentMethod: 'cash',
    createdAt: '2025-01-05T12:00:00Z',
    completedAt: '2025-01-05T12:12:00Z',
    rating: { driverRating: 4 },
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminRidesScreen: React.FC = () => {
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
  // HELPERS SÉCURISÉS - 🆕 FIXED v2.1.0
  // ==========================================================================

  /**
   * 🆕 FIXED: Obtenir l'ID d'une course de manière sécurisée
   * Supporte à la fois _id (MongoDB) et id (API)
   */
  const getRideId = useCallback((ride: Ride): string => {
    return ride?._id || ride?.id || '';
  }, []);

  /**
   * 🆕 FIXED: Obtenir l'ID court d'une course (6 derniers caractères)
   * Protégé contre undefined et chaînes trop courtes
   */
  const getRideShortId = useCallback((ride: Ride): string => {
    const id = getRideId(ride);
    if (!id) return 'N/A';
    if (id.length < 6) return id.toUpperCase();
    return id.substring(id.length - 6).toUpperCase();
  }, [getRideId]);

  /**
   * 🆕 FIXED: Obtenir le nom/adresse de pickup de manière sécurisée
   */
  const getPickupDisplay = useCallback((ride: Ride): string => {
    if (!ride?.pickup) return t('admin.rides.departure');
    return ride.pickup.name || ride.pickup.address || t('admin.rides.departure');
  }, [t]);

  /**
   * 🆕 FIXED: Obtenir le nom/adresse de destination de manière sécurisée
   */
  const getDestinationDisplay = useCallback((ride: Ride): string => {
    if (!ride?.destination) return t('admin.rides.arrival');
    return ride.destination.name || ride.destination.address || t('admin.rides.arrival');
  }, [t]);

  /**
   * 🆕 FIXED: Obtenir l'adresse de pickup de manière sécurisée
   */
  const getPickupAddress = useCallback((ride: Ride): string => {
    return ride?.pickup?.address || t('admin.rides.addressNA');
  }, [t]);

  /**
   * 🆕 FIXED: Obtenir l'adresse de destination de manière sécurisée
   */
  const getDestinationAddress = useCallback((ride: Ride): string => {
    return ride?.destination?.address || t('admin.rides.addressNA');
  }, [t]);

  /**
   * 🆕 FIXED: Obtenir le prix de manière sécurisée
   */
  const getPrice = useCallback((ride: Ride): number => {
    return ride?.price || ride?.estimatedPrice || 0;
  }, []);

  /**
   * 🆕 FIXED: Obtenir le status de manière sécurisée
   */
  const getRideStatus = useCallback((ride: Ride): RideStatus => {
    return ride?.status || 'searching';
  }, []);

  const getPassengerName = useCallback((ride: Ride): string => {
    if (ride?.user?.firstName) {
      return `${ride.user.firstName} ${ride.user.lastName || ''}`.trim();
    }
    if (ride?.passenger?.firstName) {
      return `${ride.passenger.firstName} ${ride.passenger.lastName || ''}`.trim();
    }
    return t('admin.rides.unknownPassenger');
  }, [t]);

  const getDriverName = useCallback((ride: Ride): string => {
    if (ride?.driver?.user?.firstName) {
      return `${ride.driver.user.firstName} ${ride.driver.user.lastName || ''}`.trim();
    }
    return t('admin.rides.noDriver');
  }, [t]);

  const getStatusColor = useCallback((status?: RideStatus): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'searching':
        return '#FF9800';
      case 'accepted':
        return '#9C27B0';
      case 'arriving':
        return '#00BCD4';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }, []);

  const getStatusLabel = useCallback(
    (status?: RideStatus): string => {
      switch (status) {
        case 'completed':
          return t('admin.rides.statusCompleted');
        case 'in_progress':
          return t('admin.rides.statusInProgress');
        case 'searching':
          return t('admin.rides.statusSearching');
        case 'accepted':
          return t('admin.rides.statusAccepted');
        case 'arriving':
          return t('admin.rides.statusArriving');
        case 'cancelled':
          return t('admin.rides.statusCancelled');
        default:
          return status || 'N/A';
      }
    },
    [t]
  );

  const getPaymentIcon = useCallback((payment?: PaymentMethod): string => {
    switch (payment) {
      case 'card':
        return 'credit-card';
      case 'wallet':
        return 'wallet';
      default:
        return 'cash';
    }
  }, []);

  const getPaymentLabel = useCallback(
    (payment?: PaymentMethod): string => {
      switch (payment) {
        case 'cash':
          return t('admin.rides.paymentCash');
        case 'card':
          return t('admin.rides.paymentCard');
        case 'wallet':
          return t('admin.rides.paymentWallet');
        default:
          return 'N/A';
      }
    },
    [t]
  );

  const formatDistance = useCallback((distance?: number | string): string => {
    if (distance === undefined || distance === null) return 'N/A';
    if (typeof distance === 'string') return distance;
    return `${(distance / 1000).toFixed(1)} km`;
  }, []);

  const formatDuration = useCallback((duration?: number | string): string => {
    if (duration === undefined || duration === null) return 'N/A';
    if (typeof duration === 'string') return duration;
    return `${Math.round(duration / 60)} min`;
  }, []);

  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }, [i18n.language]);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadRides = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des courses (${filter})...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = MOCK_RIDES;
      if (filter === 'active') {
        filtered = MOCK_RIDES.filter((r) =>
          ['searching', 'accepted', 'arriving', 'in_progress'].includes(r.status || '')
        );
      } else if (filter === 'completed') {
        filtered = MOCK_RIDES.filter((r) => r.status === 'completed');
      } else if (filter === 'cancelled') {
        filtered = MOCK_RIDES.filter((r) => r.status === 'cancelled');
      }

      setRides(filtered);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ ${filtered.length} courses (mock)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getRides...`);

      let response;
      if (filter === 'active') {
        response = await adminAPI.getActiveRides();
      } else {
        response = await adminAPI.getRides({
          page: 1,
          limit: 50,
          status: filter === 'all' ? undefined : filter,
        });
      }

      if (response.data.success) {
        const fetchedRides = response.data.data.rides || [];
        setRides(fetchedRides);
        console.log(`${FILE_NAME} ✅ ${fetchedRides.length} courses`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        let filtered = MOCK_RIDES;
        if (filter === 'active') {
          filtered = MOCK_RIDES.filter((r) =>
            ['searching', 'accepted', 'arriving', 'in_progress'].includes(r.status || '')
          );
        } else if (filter === 'completed') {
          filtered = MOCK_RIDES.filter((r) => r.status === 'completed');
        } else if (filter === 'cancelled') {
          filtered = MOCK_RIDES.filter((r) => r.status === 'cancelled');
        }
        setRides(filtered);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.rides.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, t]);

  useEffect(() => {
    setLoading(true);
    loadRides();
  }, [filter, loadRides]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadRides();
  }, [loadRides]);

  const handleViewDetails = useCallback((ride: Ride) => {
    const rideId = getRideId(ride);
    console.log(`${FILE_NAME} 🚗 Détails: ${rideId}`);
    setSelectedRide(ride);
    setModalVisible(true);
  }, [getRideId]);

  // Stats - 🆕 FIXED: Utiliser les helpers sécurisés
  const stats = {
    total: rides.length,
    completed: rides.filter((r) => r.status === 'completed').length,
    active: rides.filter((r) =>
      ['searching', 'accepted', 'arriving', 'in_progress'].includes(r.status || '')
    ).length,
    totalRevenue: rides
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + getPrice(r), 0),
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('admin.rides.filterAll') },
    { key: 'active', label: t('admin.rides.filterActive') },
    { key: 'completed', label: t('admin.rides.filterCompleted') },
    { key: 'cancelled', label: t('admin.rides.filterCancelled') },
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

  if (loading && rides.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.rides.loading')}
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

        <Text style={styles.headerTitle}>{t('admin.rides.title')}</Text>

        {__DEV__ ? <ModeBadge /> : <View style={{ width: 40 }} />}
      </View>

      {/* Stats */}
      <View style={[styles.statsSummary, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{stats.total}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            {t('admin.rides.total')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{stats.completed}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            {t('admin.rides.completed')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryValue, { color: '#2196F3' }]}>{stats.active}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            {t('admin.rides.active')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{stats.totalRevenue} DH</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            {t('admin.rides.revenue')}
          </Text>
        </View>
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
              { backgroundColor: filter === f.key ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
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

      {/* List */}
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
          {rides.map((ride, index) => (
            <TouchableOpacity
              key={getRideId(ride) || `ride-${index}`}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleViewDetails(ride)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  {/* 🆕 FIXED: Utiliser getRideShortId au lieu de substring direct */}
                  <Text style={[styles.rideId, { color: theme.colors.primary }]}>
                    #{getRideShortId(ride)}
                  </Text>
                  <Text style={[styles.rideDate, { color: theme.colors.textSecondary }]}>
                    {formatDate(ride.createdAt)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ride.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
                    {getStatusLabel(ride.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={[styles.routePoint, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
                  <Text
                    style={[styles.routeText, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                    numberOfLines={1}
                  >
                    {/* 🆕 FIXED: Utiliser getPickupDisplay */}
                    {getPickupDisplay(ride)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.routeLine,
                    {
                      backgroundColor: theme.colors.border,
                      marginLeft: isRTL ? 0 : 4,
                      marginRight: isRTL ? 4 : 0,
                    },
                  ]}
                />
                <View style={[styles.routePoint, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
                  <Text
                    style={[styles.routeText, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                    numberOfLines={1}
                  >
                    {/* 🆕 FIXED: Utiliser getDestinationDisplay */}
                    {getDestinationDisplay(ride)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.cardFooter,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                  {/* 🆕 FIXED: Utiliser getPrice */}
                  {getPrice(ride)} DH
                </Text>
                <Text style={[styles.distanceText, { color: theme.colors.textSecondary }]}>
                  {formatDistance(ride.distance)} • {formatDuration(ride.duration)}
                </Text>
                <MaterialCommunityIcons
                  name={getPaymentIcon(ride.paymentMethod) as any}
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}

          {rides.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-off" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('admin.rides.empty')}
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

      {/* Modal Détails */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {selectedRide && (
              <>
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  {/* 🆕 FIXED: Utiliser getRideShortId */}
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('admin.rides.rideDetails')} #{getRideShortId(selectedRide)}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Status & Price */}
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View
                        style={[
                          styles.statusBadgeLarge,
                          { backgroundColor: `${getStatusColor(selectedRide.status)}20` },
                        ]}
                      >
                        <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedRide.status) }]}>
                          {getStatusLabel(selectedRide.status)}
                        </Text>
                      </View>
                      <Text style={[styles.priceLarge, { color: theme.colors.primary }]}>
                        {/* 🆕 FIXED: Utiliser getPrice */}
                        {getPrice(selectedRide)} DH
                      </Text>
                    </View>
                  </View>

                  {/* Route */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.rides.route')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.routeDetailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.routeDotLarge, { backgroundColor: '#4CAF50' }]} />
                      <View style={[styles.routeInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.routeLabel, { color: theme.colors.textSecondary }]}>
                          {t('admin.rides.departureLabel')}
                        </Text>
                        <Text style={[styles.routeName, { color: theme.colors.text }]}>
                          {/* 🆕 FIXED: Utiliser getPickupDisplay */}
                          {getPickupDisplay(selectedRide)}
                        </Text>
                        <Text style={[styles.routeAddress, { color: theme.colors.textSecondary }]}>
                          {/* 🆕 FIXED: Utiliser getPickupAddress */}
                          {getPickupAddress(selectedRide)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.routeLineLarge,
                        {
                          backgroundColor: theme.colors.border,
                          marginLeft: isRTL ? 0 : 6,
                          marginRight: isRTL ? 6 : 0,
                        },
                      ]}
                    />
                    <View style={[styles.routeDetailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.routeDotLarge, { backgroundColor: theme.colors.primary }]} />
                      <View style={[styles.routeInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.routeLabel, { color: theme.colors.textSecondary }]}>
                          {t('admin.rides.arrivalLabel')}
                        </Text>
                        <Text style={[styles.routeName, { color: theme.colors.text }]}>
                          {/* 🆕 FIXED: Utiliser getDestinationDisplay */}
                          {getDestinationDisplay(selectedRide)}
                        </Text>
                        <Text style={[styles.routeAddress, { color: theme.colors.textSecondary }]}>
                          {/* 🆕 FIXED: Utiliser getDestinationAddress */}
                          {getDestinationAddress(selectedRide)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Participants */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.rides.participants')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.participantRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
                      <Text style={[styles.participantLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.passenger')}:
                      </Text>
                      <Text style={[styles.participantName, { color: theme.colors.text }]}>
                        {getPassengerName(selectedRide)}
                      </Text>
                    </View>
                    <View style={[styles.participantRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="steering" size={20} color="#4CAF50" />
                      <Text style={[styles.participantLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.driver')}:
                      </Text>
                      <Text style={[styles.participantName, { color: theme.colors.text }]}>
                        {getDriverName(selectedRide)}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.rides.details')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.distance')}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {formatDistance(selectedRide.distance)}
                      </Text>
                    </View>
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.duration')}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {formatDuration(selectedRide.duration)}
                      </Text>
                    </View>
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.payment')}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {getPaymentLabel(selectedRide.paymentMethod)}
                      </Text>
                    </View>
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.rides.createdAt')}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {formatDate(selectedRide.createdAt)}
                      </Text>
                    </View>
                    {selectedRide.completedAt && (
                      <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('admin.rides.completedAt')}
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                          {formatDate(selectedRide.completedAt)}
                        </Text>
                      </View>
                    )}
                    {selectedRide.rating?.driverRating && (
                      <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {t('admin.rides.driverRating')}
                        </Text>
                        <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                            {selectedRide.rating.driverRating}/5
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  // Stats
  statsSummary: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  summaryLabel: { fontSize: 10, marginTop: 2 },

  // Filter
  filterRow: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Card
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rideId: { fontSize: 14, fontWeight: 'bold' },
  rideDate: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Route
  routeContainer: { marginBottom: 12 },
  routePoint: { alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 14 },
  routeLine: { width: 2, height: 16, marginVertical: 2 },

  // Card Footer
  cardFooter: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  priceText: { fontSize: 18, fontWeight: 'bold' },
  distanceText: { fontSize: 12 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },

  // Mode Footer
  modeFooter: { alignItems: 'center', paddingTop: 20 },
  modeFooterText: { fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 16 },
  modalSection: { borderRadius: 16, padding: 16, marginBottom: 16 },
  modalRow: { justifyContent: 'space-between', alignItems: 'center' },
  statusBadgeLarge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  statusTextLarge: { fontSize: 14, fontWeight: '600' },
  priceLarge: { fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  routeDetailRow: { alignItems: 'flex-start', gap: 12 },
  routeDotLarge: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '600' },
  routeName: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  routeAddress: { fontSize: 13, marginTop: 2 },
  routeLineLarge: { width: 2, height: 20, marginVertical: 4 },
  participantRow: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  participantLabel: { fontSize: 13 },
  participantName: { flex: 1, fontSize: 14, fontWeight: '600' },
  detailRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  ratingRow: { alignItems: 'center', gap: 4 },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminRidesScreen;