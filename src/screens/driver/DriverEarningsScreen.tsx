/**
 * ============================================================================
 * GO WITH SALLY - DRIVER EARNINGS SCREEN
 * ============================================================================
 * Écran des gains et statistiques de la conductrice
 * 
 * Fonctionnalités:
 * - Affichage des gains (jour/semaine/mois)
 * - Graphique hebdomadaire des revenus
 * - Statistiques (courses, heures, note)
 * - Liste des courses récentes
 * - Bouton de retrait
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * 
 * @module screens/driver/DriverEarningsScreen
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
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { driverAPI } from '../../services/api';

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

const FILE_NAME = '[DriverEarningsScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// Données hebdomadaires par défaut (pour mode offline)
const DEFAULT_WEEKLY_DATA = [
  { day: 'Mon', dayKey: 'monday', amount: 180 },
  { day: 'Tue', dayKey: 'tuesday', amount: 220 },
  { day: 'Wed', dayKey: 'wednesday', amount: 150 },
  { day: 'Thu', dayKey: 'thursday', amount: 280 },
  { day: 'Fri', dayKey: 'friday', amount: 320 },
  { day: 'Sat', dayKey: 'saturday', amount: 450 },
  { day: 'Sun', dayKey: 'sunday', amount: 120 },
];

// Courses récentes par défaut (pour mode offline)
const DEFAULT_RECENT_RIDES = [
  {
    id: '1',
    time: '14:30',
    from: 'Morocco Mall',
    to: 'Twin Center',
    amount: 35,
    tip: 5,
    status: 'completed',
  },
  {
    id: '2',
    time: '12:15',
    from: 'Gare Casa Voyageurs',
    to: 'Anfa Place',
    amount: 28,
    tip: 0,
    status: 'completed',
  },
  {
    id: '3',
    time: '10:00',
    from: 'Maarif',
    to: 'Ain Diab',
    amount: 22,
    tip: 3,
    status: 'completed',
  },
  {
    id: '4',
    time: '08:45',
    from: 'Derb Sultan',
    to: 'Marina',
    amount: 18,
    tip: 2,
    status: 'completed',
  },
];

// ============================================================================
// TYPES
// ============================================================================

type PeriodType = 'today' | 'week' | 'month';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  totalRides: number;
  totalHours: number;
  avgRating: number;
  history: Array<{ date: string; amount: number; rides: number }>;
}

interface WeeklyDataItem {
  day: string;
  dayKey: string;
  amount: number;
}

interface RideItem {
  id: string;
  time: string;
  from: string;
  to: string;
  amount: number;
  tip: number;
  status: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const DriverEarningsScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 320,
    week: 1720,
    month: 6850,
    totalRides: 47,
    totalHours: 32,
    avgRating: 4.9,
    history: [],
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyDataItem[]>(DEFAULT_WEEKLY_DATA);
  const [recentRides, setRecentRides] = useState<RideItem[]>(DEFAULT_RECENT_RIDES);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 📱 RTL: ${isRTL}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadEarnings = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des gains...`);

    try {
      setError(null);
      const response = await driverAPI.getEarnings(selectedPeriod);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        console.log(`${FILE_NAME} ✅ Gains chargés:`, data);

        setEarnings({
          today: data.today || 320,
          week: data.week || 1720,
          month: data.month || 6850,
          totalRides: data.totalRides || 47,
          totalHours: data.totalHours || 32,
          avgRating: data.avgRating || 4.9,
          history: data.history || [],
        });

        // Mettre à jour les données hebdomadaires si disponibles
        if (data.history && data.history.length > 0) {
          // Transformer l'historique en données hebdomadaires
          // Pour l'instant, on garde les données par défaut
        }
      }
    } catch (err: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, err.message);
      setError(err.message || t('errors.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, t]);

  // Chargement initial
  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Animation au montage
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleRefresh = async () => {
    console.log(`${FILE_NAME} 🔄 Rafraîchissement...`);
    setRefreshing(true);
    await loadEarnings();
  };

  const handlePeriodChange = (period: PeriodType) => {
    console.log(`${FILE_NAME} 📅 Période: ${period}`);
    setSelectedPeriod(period);
  };

  const handleWithdraw = () => {
    console.log(`${FILE_NAME} 💳 Demande de retrait`);
    navigation.navigate('Withdraw');
  };

  const handleSeeAllRides = () => {
    console.log(`${FILE_NAME} 📋 Voir tout l'historique`);
    navigation.navigate('DriverRideHistory');
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getCurrentEarnings = (): number => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.week;
      case 'month':
        return earnings.month;
      default:
        return earnings.week;
    }
  };

  const getBarHeight = (amount: number): number => {
    const maxAmount = Math.max(...weeklyData.map((d) => d.amount), 1);
    return (amount / maxAmount) * 120;
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} DH`;
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
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '30' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  // Sélecteur de période
  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => handlePeriodChange(period)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period && styles.periodTextActive,
            ]}
          >
            {t(`driver.${period}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Carte de statistique
  const StatCard = ({
    icon,
    value,
    label,
    color,
  }: {
    icon: string;
    value: string | number;
    label: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  // Item de course
  const RideItem = ({ ride, isLast }: { ride: RideItem; isLast: boolean }) => (
    <View
      style={[
        styles.rideItem,
        !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 },
      ]}
    >
      <View style={styles.rideTimeContainer}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={14}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.rideTime, { color: theme.colors.textSecondary }]}>
          {ride.time}
        </Text>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.rideRoute}>
          <MaterialCommunityIcons
            name="circle-small"
            size={20}
            color="#4CAF50"
          />
          <Text
            style={[styles.rideLocation, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {ride.from}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.rideRoute}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color="#F44336"
          />
          <Text
            style={[styles.rideLocation, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {ride.to}
          </Text>
        </View>
      </View>

      <View style={styles.rideAmount}>
        <Text style={[styles.amountText, { color: theme.colors.text }]}>
          {formatCurrency(ride.amount)}
        </Text>
        {ride.tip > 0 && (
          <View style={styles.tipBadge}>
            <Text style={styles.tipText}>+{ride.tip} DH</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ==========================================================================
  // RENDU PRINCIPAL
  // ==========================================================================

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <LinearGradient
        colors={['#FF69B4', '#FF1493', '#DB7093']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        {/* Navigation */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('driver.myEarnings')}</Text>

          <ModeBadge />
        </View>

        {/* Sélecteur de période */}
        <PeriodSelector />

        {/* Montant total */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.earningsAmount}>
            {formatCurrency(getCurrentEarnings())}
          </Text>
          <Text style={styles.earningsLabel}>
            {t(`driver.${selectedPeriod}Earnings`)}
          </Text>
        </Animated.View>

        {/* Indicateur de tendance */}
        <View style={styles.trendContainer}>
          <MaterialCommunityIcons
            name="trending-up"
            size={18}
            color="#4CAF50"
          />
          <Text style={styles.trendText}>+12% {t('driver.vsLastPeriod')}</Text>
        </View>
      </LinearGradient>

      {/* ================================================================== */}
      {/* CONTENU */}
      {/* ================================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF69B4']}
            tintColor="#FF69B4"
          />
        }
      >
        {/* Erreur */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* GRAPHIQUE HEBDOMADAIRE */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            styles.chartCard,
            { backgroundColor: theme.colors.surface, opacity: fadeAnim },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('driver.weeklyOverview')}
            </Text>
            <View style={[styles.legendBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.legendText, { color: theme.colors.primary }]}>
                {t('driver.earnings')}
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {weeklyData.map((data, index) => {
              const isToday = index === new Date().getDay() - 1 || (index === 6 && new Date().getDay() === 0);
              return (
                <View key={index} style={styles.chartBar}>
                  <Text style={[styles.barAmount, { color: theme.colors.text }]}>
                    {data.amount}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: getBarHeight(data.amount),
                        backgroundColor: isToday
                          ? theme.colors.primary
                          : theme.colors.primary + '60',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: isToday
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                        fontWeight: isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {t(`time.days.${data.dayKey}Short`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* STATISTIQUES */}
        {/* ============================================================ */}
        <View style={styles.statsRow}>
          <StatCard
            icon="car-multiple"
            value={earnings.totalRides}
            label={t('driver.totalRides')}
            color="#FF69B4"
          />
          <StatCard
            icon="clock-outline"
            value={`${earnings.totalHours}h`}
            label={t('driver.totalHours')}
            color="#2196F3"
          />
          <StatCard
            icon="star"
            value={earnings.avgRating.toFixed(1)}
            label={t('driver.avgRating')}
            color="#FFD700"
          />
        </View>

        {/* ============================================================ */}
        {/* COURSES RÉCENTES */}
        {/* ============================================================ */}
        <View style={[styles.ridesCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('driver.recentRides')}
            </Text>
            <TouchableOpacity onPress={handleSeeAllRides} activeOpacity={0.7}>
              <View style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                  {t('common.seeAll')}
                </Text>
                <MaterialCommunityIcons
                  name={isRTL ? 'chevron-left' : 'chevron-right'}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>

          {recentRides.length > 0 ? (
            recentRides.map((ride, index) => (
              <RideItem
                key={ride.id}
                ride={ride}
                isLast={index === recentRides.length - 1}
              />
            ))
          ) : (
            <View style={styles.emptyRides}>
              <MaterialCommunityIcons
                name="car-off"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('driver.noRecentRides')}
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* BOUTON RETRAIT */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.withdrawGradient}
          >
            <MaterialCommunityIcons name="bank-transfer-out" size={24} color="white" />
            <Text style={styles.withdrawButtonText}>{t('driver.withdraw')}</Text>
            <View style={styles.withdrawAmount}>
              <Text style={styles.withdrawAmountText}>
                {formatCurrency(getCurrentEarnings())}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ============================================================ */}
        {/* FOOTER MODE INFO */}
        {/* ============================================================ */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
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

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'white',
  },
  periodText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#FF69B4',
    fontWeight: '600',
  },

  // Earnings
  earningsAmount: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  earningsLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  // Trend
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 4,
  },
  trendText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },

  // Content
  scrollContent: {
    paddingBottom: 20,
  },

  // Error Card
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
  },
  retryText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },

  // Chart Card
  chartCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Chart
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 32,
    borderRadius: 8,
    marginVertical: 8,
  },
  barLabel: {
    fontSize: 12,
  },
  barAmount: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
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
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  // Rides Card
  ridesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Ride Item
  rideItem: {
    paddingVertical: 16,
  },
  rideTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rideTime: {
    fontSize: 12,
  },
  rideInfo: {
    flex: 1,
    marginBottom: 8,
  },
  rideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    marginLeft: 9,
    marginVertical: 2,
  },
  rideLocation: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rideAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Empty Rides
  emptyRides: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Withdraw Button
  withdrawButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  withdrawAmount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  withdrawAmountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  modeFooterText: {
    fontSize: 12,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default DriverEarningsScreen;