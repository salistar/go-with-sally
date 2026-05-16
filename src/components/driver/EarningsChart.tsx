// ============================================================
// 📄 EarningsChart.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[EarningsChart.tsx] ▶ Module loaded')
//   • console.log('[EarningsChart.tsx] ▶ EarningsChart() rendered')
//   • console.log('[EarningsChart.tsx] ▶ calculateBarHeight() called')
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[EarningsChart.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface DayEarnings {
  day: string;
  earnings: number;
  rides: number;
}

interface EarningsChartProps {
  data: DayEarnings[];
  currency: string;
  maxHeight?: number;
}

const EarningsChart: React.FC<EarningsChartProps> = ({
  data,
  currency,
  maxHeight = 180,
}) => {
  console.log(`${FILE_NAME} ▶ EarningsChart() rendered with ${data.length} days`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const animatedValues = useMemo(() => {
    return data.map(() => new Animated.Value(0));
  }, [data]);

  // Animate bars on mount
  React.useEffect(() => {
    Animated.staggerOut(
      animatedValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        })
      ),
      100
    ).start();
  }, [animatedValues]);

  const calculateBarHeight = (earnings: number): number => {
    console.log(`${FILE_NAME} ▶ calculateBarHeight() called for earnings: ${earnings}`);

    if (data.length === 0) return 0;
    const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);
    return (earnings / maxEarnings) * maxHeight;
  };

  const totalEarnings = useMemo(() => {
    return data.reduce((sum, d) => sum + d.earnings, 0);
  }, [data]);

  const averageEarnings = useMemo(() => {
    return data.length > 0 ? totalEarnings / data.length : 0;
  }, [totalEarnings, data.length]);

  const maxDayEarnings = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.earnings)) : 0;
  }, [data]);

  const getDayLabel = (day: string): string => {
    const days = [
      t('day.monday', 'Lun'),
      t('day.tuesday', 'Mar'),
      t('day.wednesday', 'Mer'),
      t('day.thursday', 'Jeu'),
      t('day.friday', 'Ven'),
      t('day.saturday', 'Sam'),
      t('day.sunday', 'Dim'),
    ];
    const dayIndex = parseInt(day) - 1; // Assuming day is 1-7
    return days[dayIndex] || day;
  };

  const getBarColor = (earnings: number): string => {
    const percentage = (earnings / maxDayEarnings) * 100;
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#8BC34A';
    if (percentage >= 40) return '#FF9800';
    return '#FF6B6B';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('earnings.weeklyChart', 'Graphique hebdomadaire')}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.total', 'Total')}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {totalEarnings.toFixed(0)} {currency}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.average', 'Moyenne')}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {averageEarnings.toFixed(0)} {currency}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('earnings.best', 'Meilleur')}
          </Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {maxDayEarnings.toFixed(0)} {currency}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.yLabel, { color: theme.colors.textSecondary }]}>
            {maxDayEarnings.toFixed(0)}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.yLabel, { color: theme.colors.textSecondary }]}>
            {(maxDayEarnings / 2).toFixed(0)}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.yLabel, { color: theme.colors.textSecondary }]}>
            0
          </Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          <View style={styles.gridLines}>
            <View
              style={[
                styles.gridLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          <View style={styles.bars}>
            {data.map((item, index) => {
              const barHeight = calculateBarHeight(item.earnings);
              const heightPercent = (barHeight / maxHeight) * 100;

              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContent}>
                    {/* Tooltip */}
                    {item.earnings > 0 && (
                      <View
                        style={[
                          styles.tooltip,
                          { backgroundColor: getBarColor(item.earnings) },
                        ]}
                      >
                        <Text style={styles.tooltipText}>
                          {item.earnings.toFixed(0)}
                        </Text>
                      </View>
                    )}

                    {/* Bar */}
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: getBarColor(item.earnings),
                          height: animatedValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, barHeight],
                          }),
                        },
                      ]}
                    />
                  </View>

                  {/* Label */}
                  <Text
                    style={[
                      styles.barLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {getDayLabel(item.day)}
                  </Text>

                  {/* Rides */}
                  <Text
                    style={[
                      styles.ridesLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.rides}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#4CAF50' },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            {t('earnings.excellent', 'Excellent')} (80%+)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#FF9800' },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            {t('earnings.average', 'Moyen')} (40-80%)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#FF6B6B' },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            {t('earnings.low', 'Bas')} (&lt;40%)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 30,
    opacity: 0.2,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginVertical: 12,
    gap: 8,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 9,
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    width: '100%',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barContent: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tooltip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  tooltipText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ridesLabel: {
    fontSize: 9,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
  },
});

export default EarningsChart;
