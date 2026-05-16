// ============================================================
// 📄 DriverMarkers.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[DriverMarkers.tsx] ▶ Module loaded')
//   • console.log('[DriverMarkers.tsx] ▶ DriverMarkers() rendered')
//   • console.log('[DriverMarkers.tsx] ▶ handleDriverSelect() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[DriverMarkers.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Driver interface
 */
interface Driver {
  id: string;
  name: string;
  rating: number;
  rideCount: number;
  latitude: number;
  longitude: number;
  carModel?: string;
  carColor?: string;
  plateNumber?: string;
  profileImage?: string;
  badges?: string[];
}

/**
 * DriverMarkers Props
 */
interface DriverMarkersProps {
  drivers: Driver[];
  onDriverSelect?: (driver: Driver) => void;
  selectedDriverId?: string;
}

/**
 * DriverMarkers Component
 * Displays nearby drivers on map with their information
 */
const DriverMarkers: React.FC<DriverMarkersProps> = ({
  drivers,
  onDriverSelect,
  selectedDriverId,
}) => {
  console.log(`${FILE_NAME} ▶ DriverMarkers() rendered with ${drivers.length} drivers`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [visibleDrivers, setVisibleDrivers] = useState<Driver[]>(drivers);

  useEffect(() => {
    setVisibleDrivers(drivers);
  }, [drivers]);

  const handleDriverSelect = (driver: Driver) => {
    console.log(`${FILE_NAME} ▶ handleDriverSelect() called for driver ${driver.id}`);
    onDriverSelect?.(driver);
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#8BC34A';
    if (rating >= 3.5) return '#FFC107';
    return '#FF9800';
  };

  const DriverCard: React.FC<{ driver: Driver; isSelected: boolean }> = ({
    driver,
    isSelected,
  }) => (
    <TouchableOpacity
      style={[
        styles.driverCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={() => handleDriverSelect(driver)}
      activeOpacity={0.7}
    >
      {/* Header - Driver Info */}
      <View style={styles.cardHeader}>
        {/* Profile Image */}
        <View style={[styles.profileImage, { backgroundColor: theme.colors.background }]}>
          {driver.profileImage ? (
            <Image
              source={{ uri: driver.profileImage }}
              style={styles.profileImageContent}
            />
          ) : (
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={theme.colors.textSecondary}
            />
          )}
        </View>

        {/* Driver Name & Rating */}
        <View style={styles.driverInfo}>
          <Text style={[styles.driverName, { color: theme.colors.text }]}>
            {driver.name}
          </Text>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons
              name="star"
              size={14}
              color={getRatingColor(driver.rating)}
            />
            <Text style={[styles.rating, { color: getRatingColor(driver.rating) }]}>
              {driver.rating.toFixed(1)}
            </Text>
            <Text style={[styles.rideCount, { color: theme.colors.textSecondary }]}>
              ({driver.rideCount} {t('driver.rides', 'trajets')})
            </Text>
          </View>
        </View>

        {/* Distance Indicator */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="check" size={16} color="white" />
          </View>
        )}
      </View>

      {/* Car Details */}
      {driver.carModel && (
        <View style={styles.carDetails}>
          <View style={styles.carDetailRow}>
            <MaterialCommunityIcons
              name="car"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.carDetailText, { color: theme.colors.text }]}>
              {driver.carColor} {driver.carModel}
            </Text>
          </View>
          {driver.plateNumber && (
            <View style={styles.carDetailRow}>
              <MaterialCommunityIcons
                name="license"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.carDetailText, { color: theme.colors.textSecondary }]}>
                {driver.plateNumber}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Badges */}
      {driver.badges && driver.badges.length > 0 && (
        <View style={styles.badgesRow}>
          {driver.badges.map((badge, index) => (
            <View
              key={index}
              style={[styles.badge, { backgroundColor: `${theme.colors.primary}20` }]}
            >
              <MaterialCommunityIcons
                name="badge-check"
                size={12}
                color={theme.colors.primary}
              />
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {badge}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (drivers.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name="car-off"
          size={32}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          {t('driver.noDriversAvailable', 'Aucun conducteur disponible')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {visibleDrivers.map(driver => (
        <DriverCard
          key={driver.id}
          driver={driver}
          isSelected={driver.id === selectedDriverId}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    gap: 10,
  },
  driverCard: {
    padding: 12,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImageContent: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  rideCount: {
    fontSize: 11,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carDetails: {
    marginBottom: 8,
    gap: 4,
  },
  carDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carDetailText: {
    fontSize: 12,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default DriverMarkers;
