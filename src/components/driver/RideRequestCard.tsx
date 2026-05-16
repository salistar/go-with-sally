// ============================================================
// 📄 RideRequestCard.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[RideRequestCard.tsx] ▶ Module loaded')
//   • console.log('[RideRequestCard.tsx] ▶ RideRequestCard() rendered')
//   • console.log('[RideRequestCard.tsx] ▶ handleAccept() called')
//   • console.log('[RideRequestCard.tsx] ▶ handleReject() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[RideRequestCard.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Ride request interface
 */
interface RideRequest {
  id: string;
  passengerName: string;
  passengerRating: number;
  pickupLocation: string;
  dropoffLocation: string;
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
  offeredPrice: number;
  currency: string;
  passengerImage?: string;
  isNew?: boolean;
  expiresIn?: number; // seconds
}

/**
 * RideRequestCard Props
 */
interface RideRequestCardProps {
  request: RideRequest;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  loading?: boolean;
}

/**
 * RideRequestCard Component
 * Displays incoming ride request for driver
 */
const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  loading = false,
}) => {
  console.log(`${FILE_NAME} ▶ RideRequestCard() rendered for request ${request.id}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = () => {
    console.log(`${FILE_NAME} ▶ handleAccept() called for request ${request.id}`);

    setIsAccepting(true);
    onAccept?.(request.id);
  };

  const handleReject = () => {
    console.log(`${FILE_NAME} ▶ handleReject() called for request ${request.id}`);

    onReject?.(request.id);
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#8BC34A';
    if (rating >= 3.5) return '#FFC107';
    return '#FF9800';
  };

  const getUrgencyColor = (): string => {
    if (request.expiresIn && request.expiresIn < 10) return '#F44336';
    if (request.expiresIn && request.expiresIn < 30) return '#FF9800';
    return theme.colors.primary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header with Urgency Indicator */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {request.isNew && (
            <View style={[styles.newBadge, { backgroundColor: '#F44336' }]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <View style={styles.passengerInfo}>
            <View style={[styles.passengerImage, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.passengerDetails}>
              <Text style={[styles.passengerName, { color: theme.colors.text }]}>
                {request.passengerName}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons
                  name="star"
                  size={12}
                  color={getRatingColor(request.passengerRating)}
                />
                <Text style={[styles.rating, { color: getRatingColor(request.passengerRating) }]}>
                  {request.passengerRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {request.expiresIn !== undefined && (
          <View style={styles.timer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={getUrgencyColor()}
            />
            <Text style={[styles.timerText, { color: getUrgencyColor() }]}>
              {request.expiresIn}s
            </Text>
          </View>
        )}
      </View>

      {/* Route Information */}
      <View style={styles.routeSection}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <MaterialCommunityIcons
              name="map-marker-check"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {request.pickupLocation}
          </Text>
        </View>

        {/* Connector */}
        <View style={styles.connector}>
          <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* Dropoff */}
        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {request.dropoffLocation}
          </Text>
        </View>
      </View>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {request.estimatedDistance.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {request.estimatedDuration} min
          </Text>
        </View>
      </View>

      {/* Price Section */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.priceSection}
      >
        <Text style={styles.priceLabel}>
          {t('driver.offerPrice', 'Prix proposé')}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>
            {request.offeredPrice.toFixed(0)}
          </Text>
          <Text style={styles.priceCurrency}> {request.currency}</Text>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.rejectBtn, { backgroundColor: theme.colors.background }]}
          onPress={handleReject}
          disabled={loading || isAccepting}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleAccept}
          disabled={loading || isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={24} color="white" />
              <Text style={styles.acceptBtnText}>
                {t('driver.accept', 'Accepter')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  passengerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeSection: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  connector: {
    marginLeft: 11,
    marginVertical: 4,
    height: 16,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    height: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  priceSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  priceCurrency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  acceptBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RideRequestCard;
