// ============================================================
// 📄 UserStats.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[UserStats.tsx] ▶ Module loaded')
//   • console.log('[UserStats.tsx] ▶ UserStats() rendered')
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

const FILE_NAME = '[UserStats.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface UserStatsProps {
  totalRides: number;
  totalDistance: number;
  totalSavings: number;
  rating?: number;
}

const UserStats: React.FC<UserStatsProps> = ({
  totalRides,
  totalDistance,
  totalSavings,
  rating = 4.8,
}) => {
  console.log(`${FILE_NAME} ▶ UserStats() rendered`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const stats = useMemo(
    () => [
      {
        id: '1',
        icon: 'car',
        label: 'Trajets',
        value: totalRides.toString(),
        color: '#4CAF50',
      },
      {
        id: '2',
        icon: 'map-marker-distance',
        label: 'Distance',
        value: `${totalDistance.toFixed(1)} km`,
        color: '#2196F3',
      },
      {
        id: '3',
        icon: 'cash-multiple',
        label: 'Économies',
        value: `${totalSavings.toFixed(2)} dh`,
        color: '#FF9800',
      },
      {
        id: '4',
        icon: 'star',
        label: 'Note',
        value: rating.toFixed(1),
        color: '#FFB300',
      },
    ],
    [totalRides, totalDistance, totalSavings, rating]
  );

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <LinearGradient
          key={stat.id}
          colors={[stat.color + '15', stat.color + '05']}
          style={[
            styles.statCard,
            {
              borderColor: theme.colors.background,
              marginRight: index % 2 === 0 ? 6 : 0,
              marginLeft: index % 2 === 1 ? 6 : 0,
            },
          ]}
        >
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
              size={24}
              color={stat.color}
            />
          </View>

          <Text
            style={[
              styles.value,
              {
                color: stat.color,
              },
            ]}
          >
            {stat.value}
          </Text>

          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {stat.label}
          </Text>
        </LinearGradient>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default UserStats;
