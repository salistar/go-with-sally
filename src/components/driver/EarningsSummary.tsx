// ============================================================
// 📄 EarningsSummary.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[EarningsSummary.tsx] ▶ Module loaded')
//   • console.log('[EarningsSummary.tsx] ▶ EarningsSummary() rendered')
//   • console.log('[EarningsSummary.tsx] ▶ handlePeriodChange() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[EarningsSummary.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

type Period = 'day' | 'week' | 'month';

interface EarningStats {
  totalEarnings: number;
  ridesCompleted: number;
  averageRating: number;
  acceptanceRate: number;
  cancelledRides: number;
  distance: number;
  duration: number; // minutes
}

interface EarningsSummaryProps {
  stats: EarningStats;
  currency: string;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({
  stats,
  currency,
  period = 'day',
  onPeriodChange,
}) => {
  console.log(`${FILE_NAME} ▶ EarningsSummary() rendered for period: ${period}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);

  const handlePeriodChange = (newPeriod: Period) => {
    console.log(`${FILE_NAME} ▶ handlePeriodChange() called for period: ${newPeriod}`);
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const periods: { value: Period; label: string }[] = [
    { value: 'day', label: t('earnings.day', 'Aujourd\'hui') },
    { value: 'week', label: t('earnings.week', 'Cette semaine') },
    { value: 'month', label: t('earnings.month', 'Ce mois') },
  ];

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.8) return '#4CAF50';
    if (rating >= 4.5) return '#8BC34A';
    if (rating >= 4.0) return '#FFC107';
    return '#FF9800';
  };

  const getAcceptanceColor = (rate: number): string => {
    if (rate >= 95) return '#4CAF50';
    if (rate >= 85) return '#8BC34A';
    if (rate >= 75) return '#FF9800';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === p.value ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => handlePeriodChange(p.value)}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color: selectedPeriod === p.value ? 'white' : theme.colors.textSecondary,
                  fontWeight: selectedPeriod === p.value ? '700' : '500',
                },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Earnings Card */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.earningsCard}
      >
        <View style={styles.cardContent}>
          <Text style={styles.label}>
            {t('earnings.totalEarnings', 'Gains totaux')}
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {stats.totalEarnings.toFixed(0)}
            </Text>
            <Text style={styles.currency}>{currency}</Text>
          </View>
          <Text style={styles.subtitle}>
            {t('earnings.forPeriod', 'Pour cette période')}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Rides */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="car"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats.ridesCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.ridesCompleted', 'Trajets')}
          </Text>
        </View>

        {/* Rating */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="star"
              size={20}
              color={getRatingColor(stats.averageRating)}
            />
          </View>
          <Text style={[styles.statValue, { color: getRatingColor(stats.averageRating) }]}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.rating', 'Note')}
          </Text>
        </View>

        {/* Acceptance */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={getAcceptanceColor(stats.acceptanceRate)}
            />
          </View>
          <Text style={[styles.statValue, { color: getAcceptanceColor(stats.acceptanceRate) }]}>
            {stats.acceptanceRate}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.acceptance', 'Acceptation')}
          </Text>
        </View>

        {/* Cancelled */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#FF6B6B"
            />
          </View>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            {stats.cancelledRides}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.cancelled', 'Annulés')}
          </Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              {t('earnings.distance', 'Distance')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {stats.distance.toFixed(0)} km
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              {t('earnings.duration', 'Durée')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {(stats.duration / 60).toFixed(1)} h
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    textAlign: 'center',
  },
  earningsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardContent: {
    gap: 8,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    color: 'white',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  currency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  infoSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
});

export default EarningsSummary;
