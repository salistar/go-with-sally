// ============================================================
// 📄 DriverStats.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[DriverStats.tsx] ▶ Module loaded')
//   • console.log('[DriverStats.tsx] ▶ DriverStats() rendered')
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[DriverStats.tsx]';
console.log(`${FILE_NAME} ▶ DriverStats() rendered`);

interface DriverStatsProps {
  totalEarnings: number;
  averageRating: number;
  acceptanceRate: number;
  totalRides: number;
  cancellationRate?: number;
}

const DriverStats: React.FC<DriverStatsProps> = ({
  totalEarnings,
  averageRating,
  acceptanceRate,
  totalRides,
  cancellationRate = 0,
}) => {
  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const stats = useMemo(
    () => [
      {
        id: '1',
        icon: 'cash',
        label: 'Revenus',
        value: `${totalEarnings.toFixed(2)} dh`,
        color: '#4CAF50',
        secondaryText: 'Ce mois-ci',
      },
      {
        id: '2',
        icon: 'star',
        label: 'Note moyenne',
        value: averageRating.toFixed(1),
        color: '#FFB300',
        secondaryText: 'Basée sur les avis',
      },
      {
        id: '3',
        icon: 'check-circle',
        label: 'Taux acceptation',
        value: `${acceptanceRate.toFixed(0)}%`,
        color: '#2196F3',
        secondaryText: 'Trajets acceptés',
      },
      {
        id: '4',
        icon: 'alert-circle',
        label: 'Annulations',
        value: `${cancellationRate.toFixed(0)}%`,
        color: '#FF6B6B',
        secondaryText: 'À éviter',
      },
    ],
    [totalEarnings, averageRating, acceptanceRate, cancellationRate]
  );

  return (
    <View style={styles.container}>
      {/* Main earnings card */}
      <LinearGradient
        colors={['#4CAF5025', '#4CAF5010']}
        style={[
          styles.mainCard,
          {
            borderColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.mainCardContent}>
          <View>
            <Text
              style={[
                styles.mainLabel,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Revenus totaux
            </Text>
            <Text
              style={[
                styles.mainValue,
                {
                  color: '#4CAF50',
                },
              ]}
            >
              {totalEarnings.toFixed(2)} dh
            </Text>
          </View>
          <View
            style={[
              styles.mainIcon,
              {
                backgroundColor: '#4CAF5030',
              },
            ]}
          >
            <MaterialCommunityIcons name="cash" size={32} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.subStats}>
          <View style={styles.subStat}>
            <Text
              style={[
                styles.subLabel,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Trajets
            </Text>
            <Text
              style={[
                styles.subValue,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              {totalRides}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.subStat}>
            <Text
              style={[
                styles.subLabel,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Moyenne/trajet
            </Text>
            <Text
              style={[
                styles.subValue,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              {(totalEarnings / Math.max(totalRides, 1)).toFixed(2)} dh
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Other stats grid */}
      <View style={styles.statsGrid}>
        {stats.slice(1).map(stat => (
          <LinearGradient
            key={stat.id}
            colors={[stat.color + '15', stat.color + '05']}
            style={[
              styles.statCard,
              {
                borderColor: theme.colors.background,
              },
            ]}
          >
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: stat.color + '25',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={stat.icon as any}
                  size={20}
                  color={stat.color}
                />
              </View>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: stat.color,
                  },
                ]}
              >
                {stat.value}
              </Text>
            </View>

            <View style={styles.statFooter}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                {stat.label}
              </Text>
              <Text
                style={[
                  styles.statSecondary,
                  {
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                {stat.secondaryText}
              </Text>
            </View>
          </LinearGradient>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 12,
  },
  mainCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  mainValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  mainIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  subStat: {
    alignItems: 'center',
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statFooter: {
    gap: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statSecondary: {
    fontSize: 11,
  },
});

export default DriverStats;
