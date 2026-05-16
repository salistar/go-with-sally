/**
 * ============================================================================
 * GO WITH SALLY - ADMIN DRIVERS SCREEN
 * ============================================================================
 * Gestion des conductrices - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Liste des conductrices avec recherche
 * - Filtres par statut (actives, en attente, suspendues)
 * - Modal de détails avec actions (appeler, suspendre, activer)
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminDriversScreen
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
  Dimensions,
  Platform,
  RefreshControl,
  TextInput,
  Alert,
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

const FILE_NAME = '[AdminDriversScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

interface Driver {
  _id: string;
  id?: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status: 'approved' | 'pending' | 'suspended' | 'rejected';
  isOnline?: boolean;
  isAvailable?: boolean;
  isActive?: boolean;
  stats?: {
    averageRating: number;
    totalRides: number;
    totalEarnings: number;
  };
  rating?: number;
  totalRides?: number;
  totalEarnings?: number;
  vehicle?: {
    brand: string;
    model: string;
    plateNumber?: string;
    plate?: string;
    color: string;
  };
  createdAt?: string;
  joinedAt?: string;
  lastActive?: string;
}

type FilterType = 'all' | 'active' | 'pending' | 'blocked';

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_DRIVERS: Driver[] = [
  {
    _id: 'drv_001',
    firstName: 'Fatima',
    lastName: 'Benali',
    email: 'fatima.benali@email.com',
    phone: '+212612345678',
    status: 'approved',
    isOnline: true,
    isActive: true,
    stats: { averageRating: 4.8, totalRides: 156, totalEarnings: 12450 },
    vehicle: { brand: 'Toyota', model: 'Yaris', plateNumber: 'A-12345-01', color: 'Blanc' },
    createdAt: '2024-06-15',
    lastActive: 'En ligne',
  },
  {
    _id: 'drv_002',
    firstName: 'Amina',
    lastName: 'El Amrani',
    email: 'amina.elamrani@email.com',
    phone: '+212698765432',
    status: 'approved',
    isOnline: false,
    isActive: true,
    stats: { averageRating: 4.6, totalRides: 89, totalEarnings: 7200 },
    vehicle: { brand: 'Dacia', model: 'Sandero', plateNumber: 'B-67890-02', color: 'Gris' },
    createdAt: '2024-08-20',
    lastActive: 'Il y a 2h',
  },
  {
    _id: 'drv_003',
    firstName: 'Salma',
    lastName: 'Tazi',
    email: 'salma.tazi@email.com',
    phone: '+212655443322',
    status: 'pending',
    isOnline: false,
    isActive: false,
    stats: { averageRating: 0, totalRides: 0, totalEarnings: 0 },
    vehicle: { brand: 'Renault', model: 'Clio', plateNumber: 'C-11223-03', color: 'Rouge' },
    createdAt: '2025-01-02',
  },
  {
    _id: 'drv_004',
    firstName: 'Nadia',
    lastName: 'Chaoui',
    email: 'nadia.chaoui@email.com',
    phone: '+212677889900',
    status: 'suspended',
    isOnline: false,
    isActive: false,
    stats: { averageRating: 3.2, totalRides: 45, totalEarnings: 3600 },
    vehicle: { brand: 'Peugeot', model: '208', plateNumber: 'D-44556-04', color: 'Noir' },
    createdAt: '2024-05-10',
    lastActive: 'Suspendue',
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminDriversScreen: React.FC = () => {
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

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const loadDrivers = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des conductrices...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setDrivers(MOCK_DRIVERS);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ ${MOCK_DRIVERS.length} conductrices (mock)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getDrivers...`);

      const response = await adminAPI.getDrivers({
        page: 1,
        limit: 50,
        search: searchQuery || undefined,
        status: filter === 'all' ? undefined : filter,
      });

      if (response.data.success) {
        const fetchedDrivers = response.data.data.drivers || [];
        setDrivers(fetchedDrivers);
        console.log(`${FILE_NAME} ✅ ${fetchedDrivers.length} conductrices`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        setDrivers(MOCK_DRIVERS);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.drivers.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter, t]);

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        loadDrivers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadDrivers();
  }, [loadDrivers]);

  const handleViewDetails = useCallback((driver: Driver) => {
    console.log(`${FILE_NAME} 👤 Détails: ${driver._id}`);
    setSelectedDriver(driver);
    setModalVisible(true);
  }, []);

  const handleSuspend = useCallback(
    async (driver: Driver) => {
      const driverName = driver.user?.firstName || driver.firstName || t('admin.drivers.driver');

      Alert.alert(t('admin.drivers.suspendTitle'), t('admin.drivers.suspendConfirm', { name: driverName }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.drivers.suspend'),
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);

            // Mode OFFLINE
            if (IS_OFFLINE) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              setDrivers((prev) =>
                prev.map((d) =>
                  d._id === driver._id ? { ...d, isActive: false, status: 'suspended' as const } : d
                )
              );
              setModalVisible(false);
              setProcessing(false);
              Toast.show({
                type: 'info',
                text1: t('admin.drivers.suspended'),
                text2: t('admin.drivers.suspendedDesc', { name: driverName }),
              });
              return;
            }

            try {
              const response = await adminAPI.toggleBlockDriver(driver._id);

              if (response.data.success) {
                setDrivers((prev) =>
                  prev.map((d) =>
                    d._id === driver._id ? { ...d, isActive: false, status: 'suspended' as const } : d
                  )
                );
                setModalVisible(false);
                Toast.show({
                  type: 'info',
                  text1: t('admin.drivers.suspended'),
                  text2: t('admin.drivers.suspendedDesc', { name: driverName }),
                });
              }
            } catch (error: any) {
              console.error(`${FILE_NAME} ❌ Erreur suspension:`, error?.message);

              if (IS_HYBRID) {
                setDrivers((prev) =>
                  prev.map((d) =>
                    d._id === driver._id ? { ...d, isActive: false, status: 'suspended' as const } : d
                  )
                );
                setModalVisible(false);
                Toast.show({
                  type: 'info',
                  text1: t('admin.drivers.suspended'),
                  text2: t('admin.drivers.suspendedDesc', { name: driverName }),
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: t('errors.error'),
                  text2: error?.message || t('admin.drivers.suspendError'),
                });
              }
            } finally {
              setProcessing(false);
            }
          },
        },
      ]);
    },
    [t]
  );

  const handleActivate = useCallback(
    async (driver: Driver) => {
      const driverName = driver.user?.firstName || driver.firstName || t('admin.drivers.driver');

      setProcessing(true);

      // Mode OFFLINE
      if (IS_OFFLINE) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setDrivers((prev) =>
          prev.map((d) =>
            d._id === driver._id ? { ...d, isActive: true, status: 'approved' as const } : d
          )
        );
        setModalVisible(false);
        setProcessing(false);
        Toast.show({
          type: 'success',
          text1: t('admin.drivers.activated'),
          text2: t('admin.drivers.activatedDesc', { name: driverName }),
        });
        return;
      }

      try {
        const response = await adminAPI.toggleBlockDriver(driver._id);

        if (response.data.success) {
          setDrivers((prev) =>
            prev.map((d) =>
              d._id === driver._id ? { ...d, isActive: true, status: 'approved' as const } : d
            )
          );
          setModalVisible(false);
          Toast.show({
            type: 'success',
            text1: t('admin.drivers.activated'),
            text2: t('admin.drivers.activatedDesc', { name: driverName }),
          });
        }
      } catch (error: any) {
        console.error(`${FILE_NAME} ❌ Erreur activation:`, error?.message);

        if (IS_HYBRID) {
          setDrivers((prev) =>
            prev.map((d) =>
              d._id === driver._id ? { ...d, isActive: true, status: 'approved' as const } : d
            )
          );
          setModalVisible(false);
          Toast.show({
            type: 'success',
            text1: t('admin.drivers.activated'),
            text2: t('admin.drivers.activatedDesc', { name: driverName }),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t('errors.error'),
            text2: error?.message || t('admin.drivers.activateError'),
          });
        }
      } finally {
        setProcessing(false);
      }
    },
    [t]
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getDriverName = useCallback((driver: Driver) => {
    if (driver.user?.firstName) {
      return `${driver.user.firstName} ${driver.user.lastName || ''}`;
    }
    return `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Conductrice';
  }, []);

  const getDriverInitials = useCallback((driver: Driver) => {
    const firstName = driver.user?.firstName || driver.firstName || '?';
    const lastName = driver.user?.lastName || driver.lastName || '?';
    return `${firstName[0]}${lastName[0]}`;
  }, []);

  const getDriverEmail = useCallback((driver: Driver) => {
    return driver.user?.email || driver.email || 'N/A';
  }, []);

  const getDriverPhone = useCallback((driver: Driver) => {
    return driver.user?.phone || driver.phone || 'N/A';
  }, []);

  const getDriverRating = useCallback((driver: Driver) => {
    return driver.stats?.averageRating || driver.rating || 0;
  }, []);

  const getDriverRides = useCallback((driver: Driver) => {
    return driver.stats?.totalRides || driver.totalRides || 0;
  }, []);

  const getDriverEarnings = useCallback((driver: Driver) => {
    return driver.stats?.totalEarnings || driver.totalEarnings || 0;
  }, []);

  const getStatusColor = useCallback((driver: Driver) => {
    if (driver.status === 'suspended' || driver.isActive === false) return '#F44336';
    if (driver.status === 'pending') return '#FF9800';
    if (driver.status === 'approved' && driver.isOnline) return '#4CAF50';
    if (driver.status === 'approved') return '#2196F3';
    return '#9E9E9E';
  }, []);

  const getStatusLabel = useCallback(
    (driver: Driver) => {
      if (driver.status === 'suspended' || driver.isActive === false) return t('admin.drivers.statusSuspended');
      if (driver.status === 'pending') return t('admin.drivers.statusPending');
      if (driver.status === 'approved' && driver.isOnline) return t('admin.drivers.statusOnline');
      if (driver.status === 'approved') return t('admin.drivers.statusActive');
      return driver.status;
    },
    [t]
  );

  // Stats
  const stats = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === 'approved' && d.isActive !== false).length,
    pending: drivers.filter((d) => d.status === 'pending').length,
    blocked: drivers.filter((d) => d.status === 'suspended' || d.isActive === false).length,
  };

  // Filtrer
  const filteredDrivers = drivers.filter((d) => {
    const name = getDriverName(d).toLowerCase();
    const email = getDriverEmail(d).toLowerCase();
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && d.status === 'approved' && d.isActive !== false;
    if (filter === 'pending') return matchesSearch && d.status === 'pending';
    if (filter === 'blocked')
      return matchesSearch && (d.status === 'suspended' || d.isActive === false);
    return matchesSearch;
  });

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

  if (loading && drivers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.drivers.loading')}
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

        <Text style={styles.headerTitle}>{t('admin.drivers.title')}</Text>

        <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {__DEV__ && <ModeBadge />}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminVerifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.colors.surface, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('admin.drivers.searchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={[styles.filterContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {[
          { key: 'all', label: `${t('admin.drivers.filterAll')} (${stats.total})` },
          { key: 'active', label: `${t('admin.drivers.filterActive')} (${stats.active})` },
          { key: 'pending', label: `${t('admin.drivers.filterPending')} (${stats.pending})` },
          { key: 'blocked', label: `${t('admin.drivers.filterSuspended')} (${stats.blocked})` },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.key ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={() => setFilter(f.key as FilterType)}
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
          {filteredDrivers.map((driver) => (
            <TouchableOpacity
              key={driver._id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleViewDetails(driver)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.avatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {getDriverInitials(driver)}
                  </Text>
                </View>
                <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>
                    {getDriverName(driver)}
                  </Text>
                  <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                    <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                      {getDriverRating(driver).toFixed(1)}
                    </Text>
                    <Text style={[styles.ridesText, { color: theme.colors.textSecondary }]}>
                      • {getDriverRides(driver)} {t('admin.drivers.rides')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(driver)}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(driver) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(driver) }]}>
                    {getStatusLabel(driver)}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.cardStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <MaterialCommunityIcons name="car" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.cardStatText, { color: theme.colors.textSecondary }]}>
                    {driver.vehicle?.brand || 'N/A'} {driver.vehicle?.model || ''}
                  </Text>
                </View>
                <View style={[styles.cardStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <MaterialCommunityIcons name="cash" size={16} color="#4CAF50" />
                  <Text style={[styles.cardStatText, { color: theme.colors.text }]}>
                    {getDriverEarnings(driver).toLocaleString()} DH
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.cardFooter,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.lastActive, { color: theme.colors.textSecondary }]}>
                  {driver.lastActive || `${t('admin.drivers.joined')}: ${driver.createdAt?.substring(0, 10) || 'N/A'}`}
                </Text>
                <MaterialCommunityIcons
                  name={isRTL ? 'chevron-left' : 'chevron-right'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}

          {filteredDrivers.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('admin.drivers.empty')}
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

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {selectedDriver && (
              <>
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('admin.drivers.profileTitle')}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Driver Info */}
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalDriverHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.modalAvatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                        <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>
                          {getDriverInitials(selectedDriver)}
                        </Text>
                      </View>
                      <View style={[styles.modalDriverInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.modalDriverName, { color: theme.colors.text }]}>
                          {getDriverName(selectedDriver)}
                        </Text>
                        <View style={[styles.modalRatingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                          <Text style={[styles.modalRating, { color: theme.colors.text }]}>
                            {getDriverRating(selectedDriver).toFixed(1)}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: `${getStatusColor(selectedDriver)}20`, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
                            ]}
                          >
                            <Text style={[styles.statusText, { color: getStatusColor(selectedDriver) }]}>
                              {getStatusLabel(selectedDriver)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Contact */}
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('admin.drivers.contact')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {getDriverEmail(selectedDriver)}
                      </Text>
                    </View>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {getDriverPhone(selectedDriver)}
                      </Text>
                    </View>
                  </View>

                  {/* Vehicle */}
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('admin.drivers.vehicle')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="car" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {selectedDriver.vehicle?.brand || 'N/A'} {selectedDriver.vehicle?.model || ''}
                      </Text>
                    </View>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="card-text" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {selectedDriver.vehicle?.plateNumber || selectedDriver.vehicle?.plate || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="palette" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {selectedDriver.vehicle?.color || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('admin.drivers.statistics')}
                  </Text>
                  <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                      <MaterialCommunityIcons name="car-multiple" size={24} color={theme.colors.primary} />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {getDriverRides(selectedDriver)}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.drivers.rides')}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                      <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {getDriverEarnings(selectedDriver).toLocaleString()}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        DH {t('admin.drivers.earned')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Actions */}
                <View
                  style={[
                    styles.modalActions,
                    { borderTopColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="phone" size={20} color="#4CAF50" />
                    <Text style={styles.callBtnText}>{t('admin.drivers.call')}</Text>
                  </TouchableOpacity>
                  {selectedDriver.status === 'suspended' || selectedDriver.isActive === false ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleActivate(selectedDriver)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color="white" />
                          <Text style={styles.activateBtnText}>{t('admin.drivers.activate')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.suspendBtn]}
                      onPress={() => handleSuspend(selectedDriver)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="block-helper" size={20} color="white" />
                          <Text style={styles.suspendBtnText}>{t('admin.drivers.suspend')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
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
  headerRight: { alignItems: 'center', gap: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modeBadgeEmoji: { fontSize: 10 },
  modeBadgeText: { fontSize: 9, fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

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
  cardHeader: { alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginHorizontal: 12 },
  cardName: { fontSize: 16, fontWeight: '600' },
  ratingRow: { alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  ridesText: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardStats: { justifyContent: 'space-between', marginTop: 12 },
  cardStat: { alignItems: 'center', gap: 6 },
  cardStatText: { fontSize: 13 },
  cardFooter: { justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  lastActive: { fontSize: 12 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },

  // Mode Footer
  modeFooter: { alignItems: 'center', paddingTop: 20 },
  modeFooterText: { fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 16 },
  modalSection: { borderRadius: 16, padding: 16, marginBottom: 16 },
  modalDriverHeader: { alignItems: 'center' },
  modalAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { fontSize: 20, fontWeight: 'bold' },
  modalDriverInfo: { marginHorizontal: 16 },
  modalDriverName: { fontSize: 18, fontWeight: '600' },
  modalRatingRow: { alignItems: 'center', marginTop: 4, gap: 4 },
  modalRating: { fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoRow: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  infoText: { fontSize: 14 },
  statsGrid: { gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  modalActions: { padding: 16, gap: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  callBtn: { backgroundColor: '#E8F5E9' },
  callBtnText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  suspendBtn: { backgroundColor: '#F44336' },
  suspendBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  activateBtn: { backgroundColor: '#4CAF50' },
  activateBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminDriversScreen;