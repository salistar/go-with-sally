// ============================================================
// 📄 PriceEstimator.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PriceEstimator.tsx] ▶ Module loaded')
//   • console.log('[PriceEstimator.tsx] ▶ PriceEstimator() rendered')
//   • console.log('[PriceEstimator.tsx] ▶ estimatePrice() called')
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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[PriceEstimator.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Price estimate interface
 */
interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgeMultiplier: number;
  totalPrice: number;
  currency: string;
}

/**
 * Service type interface
 */
interface ServiceType {
  id: string;
  name: string;
  icon: string;
  multiplier: number;
  description: string;
}

/**
 * PriceEstimator Props
 */
interface PriceEstimatorProps {
  distance?: number; // in km
  duration?: number; // in minutes
  serviceType?: string; // 'eco' | 'standard' | 'confort' | 'pool'
  onPriceUpdate?: (estimate: PriceEstimate) => void;
}

/**
 * PriceEstimator Component
 * Calculates and displays ride price estimate
 */
const PriceEstimator: React.FC<PriceEstimatorProps> = ({
  distance = 0,
  duration = 0,
  serviceType = 'standard',
  onPriceUpdate,
}) => {
  console.log(`${FILE_NAME} ▶ PriceEstimator() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const serviceTypes: Record<string, ServiceType> = {
    eco: {
      id: 'eco',
      name: t('service.eco', 'Sally Eco'),
      icon: 'leaf',
      multiplier: 0.8,
      description: t('service.ecoDesc', 'Économique'),
    },
    standard: {
      id: 'standard',
      name: t('service.standard', 'Sally Standard'),
      icon: 'car',
      multiplier: 1.0,
      description: t('service.standardDesc', 'Confortable'),
    },
    confort: {
      id: 'confort',
      name: t('service.confort', 'Sally Confort'),
      icon: 'car-premium',
      multiplier: 1.5,
      description: t('service.confortDesc', 'Premium'),
    },
    pool: {
      id: 'pool',
      name: t('service.pool', 'Sally Pool'),
      icon: 'people',
      multiplier: 0.6,
      description: t('service.poolDesc', 'Partage'),
    },
  };

  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (distance > 0 || duration > 0) {
      estimatePrice();
    }
  }, [distance, duration, serviceType]);

  const estimatePrice = async () => {
    console.log(`${FILE_NAME} ▶ estimatePrice() called`);

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const service = serviceTypes[serviceType] || serviceTypes.standard;

      // Price calculation logic
      const basePrice = 10; // Starting price in MAD
      const distancePrice = distance * 3.5; // 3.5 MAD per km
      const timePrice = Math.floor(duration / 5) * 1; // 1 MAD per 5 minutes
      const surgeMultiplier = Math.random() > 0.8 ? 1.2 : 1.0; // 20% chance of surge pricing
      const serviceMultiplier = service.multiplier;

      const totalPrice = Math.round(
        (basePrice + distancePrice + timePrice) * surgeMultiplier * serviceMultiplier * 100
      ) / 100;

      const estimate: PriceEstimate = {
        basePrice,
        distancePrice: Math.round(distancePrice * 100) / 100,
        timePrice: Math.round(timePrice * 100) / 100,
        surgeMultiplier,
        totalPrice,
        currency: 'MAD',
      };

      setPriceEstimate(estimate);
      onPriceUpdate?.(estimate);
    } catch (error) {
      console.error('Error estimating price:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!priceEstimate) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('price.calculating', 'Calcul du prix...')}
          </Text>
        </View>
      </View>
    );
  }

  const service = serviceTypes[serviceType] || serviceTypes.standard;
  const isSurgeActive = priceEstimate.surgeMultiplier > 1.0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Main Price Display */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.priceCard}
      >
        <Text style={styles.priceLabel}>
          {t('price.estimatedFare', 'Tarif estimé')}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>
            {priceEstimate.totalPrice.toFixed(2)}
          </Text>
          <Text style={styles.priceCurrency}> {priceEstimate.currency}</Text>
        </View>

        {isSurgeActive && (
          <View style={styles.surgeNotice}>
            <MaterialCommunityIcons name="alert" size={14} color="white" />
            <Text style={styles.surgeText}>
              {t('price.surgePricing', 'Tarif dynamique appliqué')} ({(priceEstimate.surgeMultiplier * 100).toFixed(0)}%)
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Service Type Display */}
      <View style={styles.serviceSection}>
        <View style={styles.serviceHeader}>
          <MaterialCommunityIcons name={service.icon as any} size={20} color={theme.colors.primary} />
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>
            {service.name}
          </Text>
        </View>
        <Text style={[styles.serviceDesc, { color: theme.colors.textSecondary }]}>
          {service.description}
        </Text>
      </View>

      {/* Price Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>
          {t('price.breakdown', 'Détail du prix')}
        </Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('price.baseFare', 'Prise en charge')}
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {priceEstimate.basePrice.toFixed(2)} {priceEstimate.currency}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('price.distance', 'Distance')} ({distance.toFixed(1)} km)
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {priceEstimate.distancePrice.toFixed(2)} {priceEstimate.currency}
            </Text>
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('price.time', 'Temps')} ({Math.round(duration)} min)
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {priceEstimate.timePrice.toFixed(2)} {priceEstimate.currency}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('price.serviceMultiplier', 'Multiplicateur')}
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              x{service.multiplier.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Notes */}
      <View style={styles.notesSection}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={theme.colors.primary}
        />
        <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
          {t('price.estimateNote', 'Ce prix est une estimation. Le tarif final peut varier selon le trafic et les circonstances.')}
        </Text>
      </View>

      {/* Recalculate Button */}
      <TouchableOpacity
        style={[styles.recalcBtn, { backgroundColor: theme.colors.background }]}
        onPress={estimatePrice}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="reload"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.recalcBtnText, { color: theme.colors.primary }]}>
              {t('price.recalculate', 'Recalculer')}
            </Text>
          </>
        )}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  priceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  priceCurrency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  surgeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  surgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  serviceSection: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 12,
    marginLeft: 30,
  },
  breakdownSection: {
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  breakdownItem: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  breakdownLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  recalcBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  recalcBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PriceEstimator;
