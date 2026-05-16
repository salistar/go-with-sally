// ============================================================
// 📄 PricingBreakdown.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PricingBreakdown.tsx] ▶ Module loaded')
//   • console.log('[PricingBreakdown.tsx] ▶ PricingBreakdown() rendered')
//   • console.log('[PricingBreakdown.tsx] ▶ toggleBreakdown() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[PricingBreakdown.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface PricingBreakdownProps {
  basePrice: number;
  distancePrice: number;
  durationPrice: number;
  surgeMultiplier?: number;
  surgePrice?: number;
  discountPrice?: number;
  totalPrice: number;
  currency: string;
  distance: number;
  duration: number; // in minutes
}

interface PriceItem {
  label: string;
  amount: number;
  percentage: number;
  icon: string;
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  basePrice,
  distancePrice,
  durationPrice,
  surgeMultiplier = 1,
  surgePrice = 0,
  discountPrice = 0,
  totalPrice,
  currency,
  distance,
  duration,
}) => {
  console.log(`${FILE_NAME} ▶ PricingBreakdown() rendered with total: ${totalPrice}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleBreakdown = () => {
    console.log(`${FILE_NAME} ▶ toggleBreakdown() called`);
    setIsExpanded(!isExpanded);
  };

  const priceItems: PriceItem[] = [
    {
      label: t('pricing.base', 'Prix de base'),
      amount: basePrice,
      percentage: (basePrice / totalPrice) * 100,
      icon: 'map-marker',
    },
    {
      label: t('pricing.distance', 'Distance'),
      amount: distancePrice,
      percentage: (distancePrice / totalPrice) * 100,
      icon: 'map-marker-distance',
    },
    {
      label: t('pricing.duration', 'Durée'),
      amount: durationPrice,
      percentage: (durationPrice / totalPrice) * 100,
      icon: 'clock-outline',
    },
  ];

  const getBreakdownColor = (index: number): string => {
    const colors = ['#4CAF50', '#2196F3', '#FF9800'];
    return colors[index % colors.length];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleBreakdown}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('pricing.breakdown', 'Détails du prix')}
          </Text>
          <Text style={[styles.surgeInfo, { color: surgeMultiplier > 1 ? '#FF6B6B' : theme.colors.textSecondary }]}>
            {surgeMultiplier > 1 ? `${t('pricing.surge', 'Pic de demande')} x${surgeMultiplier.toFixed(2)}` : t('pricing.normalPrice', 'Prix normal')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.totalPrice, { color: theme.colors.text }]}>
            {totalPrice.toFixed(0)} {currency}
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
          {/* Breakdown Items */}
          <View style={styles.itemsContainer}>
            {priceItems.map((item, index) => (
              <View key={index} style={styles.priceItem}>
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.itemIcon,
                      { backgroundColor: getBreakdownColor(index) + '20' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={16}
                      color={getBreakdownColor(index)}
                    />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                      {item.label}
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.itemDetail, { color: theme.colors.textSecondary }]}>
                        {item.label === t('pricing.base', 'Prix de base')
                          ? t('pricing.baseFare', 'Trajet')
                          : item.label === t('pricing.distance', 'Distance')
                          ? `${distance.toFixed(1)} km`
                          : `${duration} min`}
                      </Text>
                      <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>
                        {item.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                  {item.amount.toFixed(0)} {currency}
                </Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Modifiers */}
          {(surgePrice > 0 || discountPrice > 0) && (
            <View style={styles.modifiersContainer}>
              {surgePrice > 0 && (
                <View style={styles.modifier}>
                  <View style={styles.modifierLeft}>
                    <MaterialCommunityIcons
                      name="flash"
                      size={16}
                      color="#FF6B6B"
                    />
                    <Text style={[styles.modifierLabel, { color: theme.colors.text }]}>
                      {t('pricing.surgeCharge', 'Frais de pic')}
                    </Text>
                  </View>
                  <Text style={[styles.modifierPrice, { color: '#FF6B6B' }]}>
                    +{surgePrice.toFixed(0)} {currency}
                  </Text>
                </View>
              )}

              {discountPrice > 0 && (
                <View style={styles.modifier}>
                  <View style={styles.modifierLeft}>
                    <MaterialCommunityIcons
                      name="percent"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={[styles.modifierLabel, { color: theme.colors.text }]}>
                      {t('pricing.discount', 'Réduction')}
                    </Text>
                  </View>
                  <Text style={[styles.modifierPrice, { color: '#4CAF50' }]}>
                    -{discountPrice.toFixed(0)} {currency}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Total */}
          <View
            style={[
              styles.totalRow,
              { backgroundColor: theme.colors.primary + '10' },
            ]}
          >
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              {t('pricing.totalFare', 'Tarif total')}
            </Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              {totalPrice.toFixed(0)} {currency}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {t('pricing.surgeInfo', 'Prix ajusté selon la demande et les conditions')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  surgeInfo: {
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
  },
  itemsContainer: {
    paddingHorizontal: 14,
    gap: 12,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetail: {
    fontSize: 11,
  },
  percentage: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 14,
  },
  modifiersContainer: {
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  modifier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modifierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modifierLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modifierPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  infoText: {
    fontSize: 11,
    flex: 1,
  },
});

export default PricingBreakdown;
