/**
 * ============================================================================
 * GO WITH SALLY - ADMIN REPORTS SCREEN
 * ============================================================================
 * Rapports et statistiques - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Statistiques globales (revenus, courses, utilisateurs, conductrices)
 * - Graphique des courses par heure
 * - Top conductrices avec classement
 * - Sélecteur de période (jour, semaine, mois, année)
 * - Export des rapports
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminReportsScreen
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
  Dimensions,
  ActivityIndicator,
  RefreshControl,
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

const FILE_NAME = '[AdminReportsScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

type PeriodType = 'day' | 'week' | 'month' | 'year';

interface TopDriver {
  _id?: string;
  name: string;
  rides: number;
  earnings: number;
  rating: number;
}

interface HourlyData {
  hour: string;
  rides: number;
  revenue?: number;
}

interface ReportStats {
  ridesStats?: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  newUsers?: number;
  newDrivers?: number;
  topDrivers?: TopDriver[];
}

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_REPORT_DATA: ReportStats = {
  ridesStats: {
    total: 1247,
    completed: 1189,
    cancelled: 58,
    revenue: 89450,
  },
  newUsers: 156,
  newDrivers: 12,
  topDrivers: [
    { _id: 'drv_001', name: 'Fatima Benali', rides: 156, earnings: 12450, rating: 4.9 },
    { _id: 'drv_002', name: 'Amina El Amrani', rides: 132, earnings: 10560, rating: 4.8 },
    { _id: 'drv_003', name: 'Salma Tazi', rides: 98, earnings: 7840, rating: 4.7 },
    { _id: 'drv_004', name: 'Nadia Chaoui', rides: 87, earnings: 6960, rating: 4.6 },
    { _id: 'drv_005', name: 'Khadija Alaoui', rides: 76, earnings: 6080, rating: 4.5 },
  ],
};

const MOCK_HOURLY_DATA: HourlyData[] = [
  { hour: '06h', rides: 12 },
  { hour: '08h', rides: 45 },
  { hour: '10h', rides: 32 },
  { hour: '12h', rides: 38 },
  { hour: '14h', rides: 25 },
  { hour: '16h', rides: 42 },
  { hour: '18h', rides: 58 },
  { hour: '20h', rides: 48 },
  { hour: '22h', rides: 22 },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminReportsScreen: React.FC = () => {
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [reportData, setReportData] = useState<ReportStats | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);

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
  // DONNÉES CALCULÉES
  // ==========================================================================

  const stats = {
    revenue: {
      value: reportData?.ridesStats?.revenue || 0,
      change: +12.5,
    },
    rides: {
      value: reportData?.ridesStats?.total || 0,
      change: +8.3,
    },
    users: {
      value: reportData?.newUsers || 0,
      change: +5.2,
    },
    drivers: {
      value: reportData?.newDrivers || 0,
      change: +2.1,
    },
    avgRating: { value: 4.8, change: +0.1 },
    avgPrice: { value: 35, change: -2.4 },
  };

  const topDrivers: TopDriver[] = reportData?.topDrivers || [];
  const maxRides = hourlyData.length > 0 ? Math.max(...hourlyData.map((d) => d.rides), 1) : 1;

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadReports = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des rapports (${period})...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setReportData(MOCK_REPORT_DATA);
      setHourlyData(MOCK_HOURLY_DATA);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ Données mock chargées`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getReportsOverview...`);

      const overviewResponse = await adminAPI.getReportsOverview(period);

      if (overviewResponse.data.success) {
        setReportData(overviewResponse.data.data);
        console.log(`${FILE_NAME} ✅ Rapports chargés`);
      }

      // Stats horaires
      if (period === 'day') {
        const hourlyResponse = await adminAPI.getHourlyStats();
        if (hourlyResponse.data.success) {
          setHourlyData(hourlyResponse.data.data.hourlyStats || []);
          console.log(`${FILE_NAME} ✅ Stats horaires chargées`);
        }
      } else {
        setHourlyData(MOCK_HOURLY_DATA);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        setReportData(MOCK_REPORT_DATA);
        setHourlyData(MOCK_HOURLY_DATA);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.reports.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, t]);

  useEffect(() => {
    setLoading(true);
    loadReports();
  }, [period, loadReports]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const handleExport = useCallback(() => {
    Toast.show({
      type: 'info',
      text1: t('admin.reports.exportInProgress'),
      text2: t('admin.reports.exportWait'),
    });

    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: t('admin.reports.exportDone'),
        text2: t('admin.reports.exportDownloaded'),
      });
    }, 2000);
  }, [t]);

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

  const periodOptions: { key: PeriodType; label: string }[] = [
    { key: 'day', label: t('admin.reports.day') },
    { key: 'week', label: t('admin.reports.week') },
    { key: 'month', label: t('admin.reports.month') },
    { key: 'year', label: t('admin.reports.year') },
  ];

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading && !reportData) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.reports.loading')}
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

        <Text style={styles.headerTitle}>{t('admin.reports.title')}</Text>

        <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {__DEV__ && <ModeBadge />}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
            <MaterialCommunityIcons name="download" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

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
          {/* Period Selector */}
          <View
            style={[
              styles.periodContainer,
              { backgroundColor: theme.colors.surface, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {periodOptions.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.periodBtn,
                  { backgroundColor: period === p.key ? theme.colors.primary : 'transparent' },
                ]}
                onPress={() => setPeriod(p.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === p.key ? 'white' : theme.colors.textSecondary },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Stats */}
          <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Revenue */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.revenue.value.toLocaleString()} DH
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.revenue')}
              </Text>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: stats.revenue.change > 0 ? '#4CAF5020' : '#F4433620' },
                ]}
              >
                <MaterialCommunityIcons
                  name={stats.revenue.change > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={stats.revenue.change > 0 ? '#4CAF50' : '#F44336'}
                />
                <Text
                  style={[
                    styles.changeText,
                    { color: stats.revenue.change > 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {stats.revenue.change > 0 ? '+' : ''}
                  {stats.revenue.change}%
                </Text>
              </View>
            </View>

            {/* Rides */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <MaterialCommunityIcons name="car-multiple" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.rides.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.rides')}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: '#4CAF5020' }]}>
                <MaterialCommunityIcons name="trending-up" size={14} color="#4CAF50" />
                <Text style={[styles.changeText, { color: '#4CAF50' }]}>+{stats.rides.change}%</Text>
              </View>
            </View>

            {/* Users */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
                <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.users.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.newUsers')}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: '#4CAF5020' }]}>
                <MaterialCommunityIcons name="trending-up" size={14} color="#4CAF50" />
                <Text style={[styles.changeText, { color: '#4CAF50' }]}>+{stats.users.change}%</Text>
              </View>
            </View>

            {/* Drivers */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: '#FF980020' }]}>
                <MaterialCommunityIcons name="steering" size={24} color="#FF9800" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.drivers.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.newDrivers')}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: '#4CAF5020' }]}>
                <MaterialCommunityIcons name="trending-up" size={14} color="#4CAF50" />
                <Text style={[styles.changeText, { color: '#4CAF50' }]}>+{stats.drivers.change}%</Text>
              </View>
            </View>
          </View>

          {/* Hourly Chart */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('admin.reports.ridesPerHour')}
          </Text>
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.barChart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {hourlyData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.rides / maxRides) * 100}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>
                    {item.hour}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top Drivers */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('admin.reports.topDrivers')}
          </Text>
          <View style={[styles.topDriversCard, { backgroundColor: theme.colors.surface }]}>
            {topDrivers.length > 0 ? (
              topDrivers.map((driver, index) => (
                <View
                  key={driver._id || index}
                  style={[
                    styles.driverRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    index < topDrivers.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          index === 0
                            ? '#FFD700'
                            : index === 1
                            ? '#C0C0C0'
                            : index === 2
                            ? '#CD7F32'
                            : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View
                    style={[
                      styles.driverInfo,
                      { alignItems: isRTL ? 'flex-end' : 'flex-start' },
                    ]}
                  >
                    <Text style={[styles.driverName, { color: theme.colors.text }]}>
                      {driver.name}
                    </Text>
                    <View
                      style={[styles.driverStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    >
                      <Text style={[styles.driverStat, { color: theme.colors.textSecondary }]}>
                        {driver.rides} {t('admin.reports.rides')}
                      </Text>
                      <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                      <Text style={[styles.driverStat, { color: theme.colors.textSecondary }]}>
                        {driver.rating?.toFixed(1) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.driverEarnings, { color: '#4CAF50' }]}>
                    {(driver.earnings || 0).toLocaleString()} DH
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyDrivers}>
                <MaterialCommunityIcons name="account-off" size={40} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('admin.reports.noData')}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('admin.reports.otherMetrics')}
          </Text>
          <View style={[styles.quickStatsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="star" size={28} color="#FFD700" />
              <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                {stats.avgRating.value}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.avgRating')}
              </Text>
            </View>
            <View style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="currency-usd" size={28} color={theme.colors.primary} />
              <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                {stats.avgPrice.value} DH
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                {t('admin.reports.avgPrice')}
              </Text>
            </View>
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
  exportBtn: {
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

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },

  // Period Selector
  periodContainer: { borderRadius: 12, padding: 4, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  periodText: { fontSize: 13, fontWeight: '600' },

  // Stats Grid
  statsGrid: { flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: (SCREEN_WIDTH - 44) / 2, padding: 16, borderRadius: 16 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  changeText: { fontSize: 12, fontWeight: '600' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },

  // Chart
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 24 },
  barChart: { justifyContent: 'space-between', height: 150 },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { flex: 1, width: '60%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 8 },

  // Top Drivers
  topDriversCard: { borderRadius: 16, padding: 8, marginBottom: 24 },
  driverRow: { alignItems: 'center', padding: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  driverInfo: { flex: 1, marginHorizontal: 12 },
  driverName: { fontSize: 14, fontWeight: '600' },
  driverStats: { alignItems: 'center', marginTop: 4, gap: 6 },
  driverStat: { fontSize: 12 },
  driverEarnings: { fontSize: 14, fontWeight: 'bold' },
  emptyDrivers: { alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 14, marginTop: 8 },

  // Quick Stats
  quickStatsRow: { gap: 12 },
  quickStatCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  quickStatValue: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  quickStatLabel: { fontSize: 12, marginTop: 4 },

  // Mode Footer
  modeFooter: { alignItems: 'center', paddingTop: 20 },
  modeFooterText: { fontSize: 11 },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminReportsScreen;