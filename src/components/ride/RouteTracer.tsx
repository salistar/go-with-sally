// ============================================================
// 📄 RouteTracer.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[RouteTracer.tsx] ▶ Module loaded')
//   • console.log('[RouteTracer.tsx] ▶ RouteTracer() rendered')
//   • console.log('[RouteTracer.tsx] ▶ loadRoute() called')
// ============================================================

import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[RouteTracer.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Route interface
 */
interface Route {
  distance: number; // in km
  duration: number; // in minutes
  polylinePoints?: Array<{ latitude: number; longitude: number }>;
  steps?: Array<{
    instruction: string;
    distance: number;
  }>;
}

/**
 * RouteTracer Props
 */
interface RouteTracerProps {
  pickupLocation?: { latitude: number; longitude: number; address?: string };
  dropoffLocation?: { latitude: number; longitude: number; address?: string };
  onRouteLoaded?: (route: Route) => void;
  loading?: boolean;
}

/**
 * RouteTracer Component
 * Displays route information and directions on map
 */
const RouteTracer: React.FC<RouteTracerProps> = ({
  pickupLocation,
  dropoffLocation,
  onRouteLoaded,
  loading = false,
}) => {
  console.log(`${FILE_NAME} ▶ RouteTracer() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      loadRoute();
    }
  }, [pickupLocation, dropoffLocation]);

  const loadRoute = async () => {
    console.log(`${FILE_NAME} ▶ loadRoute() called`);

    setIsLoading(true);
    try {
      // Simulate route loading - in real app, call Google Maps or similar API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock route data
      const mockRoute: Route = {
        distance: 12.5,
        duration: 28,
        polylinePoints: [
          { latitude: 33.5731, longitude: -7.5898 },
          { latitude: 33.5741, longitude: -7.5888 },
          { latitude: 33.5751, longitude: -7.5878 },
        ],
        steps: [
          {
            instruction: t('directions.startFromPickup', 'Partez du point de départ'),
            distance: 0.5,
          },
          {
            instruction: t('directions.continueStraight', 'Continuez tout droit'),
            distance: 8.2,
          },
          {
            instruction: t('directions.turnRight', 'Tournez à droite'),
            distance: 3.5,
          },
          {
            instruction: t('directions.arriveDestination', 'Vous êtes arrivé à destination'),
            distance: 0.3,
          },
        ],
      };

      setRoute(mockRoute);
      onRouteLoaded?.(mockRoute);
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (!pickupLocation || !dropoffLocation) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Route Summary Header */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <View style={styles.timeDistance}>
            <View style={styles.infoBlock}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {route ? formatDuration(route.duration) : '--'}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {t('route.estimatedTime', 'Temps')}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoBlock}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {route ? formatDistance(route.distance) : '--'}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {t('route.distance', 'Distance')}
              </Text>
            </View>
          </View>

          {isLoading && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>
      </View>

      {/* Location Points */}
      <View style={styles.pointsContainer}>
        {/* Pickup Point */}
        <View style={styles.pointRow}>
          <View style={styles.pointIcon}>
            <MaterialCommunityIcons
              name="map-marker-check"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.pointInfo}>
            <Text style={[styles.pointLabel, { color: theme.colors.textSecondary }]}>
              {t('route.pickupPoint', 'Lieu de départ')}
            </Text>
            <Text
              style={[styles.pointAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {pickupLocation.address || `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`}
            </Text>
          </View>
        </View>

        {/* Vertical Connector */}
        <View style={styles.connector}>
          <View
            style={[
              styles.connectorLine,
              { backgroundColor: theme.colors.border },
            ]}
          />
        </View>

        {/* Dropoff Point */}
        <View style={styles.pointRow}>
          <View style={styles.pointIcon}>
            <MaterialCommunityIcons
              name="map-marker"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.pointInfo}>
            <Text style={[styles.pointLabel, { color: theme.colors.textSecondary }]}>
              {t('route.dropoffPoint', 'Lieu de destination')}
            </Text>
            <Text
              style={[styles.pointAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {dropoffLocation.address || `${dropoffLocation.latitude.toFixed(4)}, ${dropoffLocation.longitude.toFixed(4)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Directions Steps */}
      {route && route.steps && (
        <View style={styles.directionsContainer}>
          <Text style={[styles.directionsTitle, { color: theme.colors.text }]}>
            {t('route.directions', 'Directions')}
          </Text>

          {route.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[styles.stepInstruction, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {step.instruction}
                </Text>
                {step.distance > 0 && (
                  <Text style={[styles.stepDistance, { color: theme.colors.textSecondary }]}>
                    {formatDistance(step.distance)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Reload Button */}
      <TouchableOpacity
        style={[styles.reloadBtn, { backgroundColor: theme.colors.background }]}
        onPress={loadRoute}
        disabled={isLoading}
      >
        <MaterialCommunityIcons
          name="reload"
          size={16}
          color={theme.colors.primary}
        />
        <Text style={[styles.reloadBtnText, { color: theme.colors.primary }]}>
          {t('route.recalculate', 'Recalculer')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoBlock: {
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  pointsContainer: {
    marginBottom: 16,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  pointAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  connector: {
    marginLeft: 15,
    marginVertical: 8,
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    height: 24,
  },
  directionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  directionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepDistance: {
    fontSize: 11,
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  reloadBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RouteTracer;
