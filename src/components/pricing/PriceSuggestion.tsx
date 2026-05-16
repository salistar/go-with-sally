/**
 * GO WITH SALLY - PRICE SUGGESTION COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { PriceEstimate, SurgeInfo } from '../../types/pricing.types';

interface PriceSuggestionProps {
  estimate: PriceEstimate;
  surgeInfo?: SurgeInfo | null;
  onSelectPrice?: (price: number) => void;
  showBreakdown?: boolean;
}

export const PriceSuggestion: React.FC<PriceSuggestionProps> = ({
  estimate,
  surgeInfo,
  onSelectPrice,
  showBreakdown = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const quickPrices = [
    { label: t('pricing.min'), value: estimate.minPrice, color: '#EF4444' },
    { label: t('pricing.suggested'), value: estimate.suggestedPrice, color: '#22C55E' },
    { label: t('pricing.max'), value: estimate.maxPrice, color: '#3B82F6' },
  ];

  return (
    <View style={styles.container}>
      {/* Surge Alert */}
      {surgeInfo?.isActive && (
        <View style={[styles.surgeAlert, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.surgeIcon}>⚡</Text>
          <View style={styles.surgeContent}>
            <Text style={[styles.surgeTitle, { color: '#92400E' }]}>
              {t('pricing.surgeActive')}
            </Text>
            <Text style={[styles.surgeReason, { color: '#B45309' }]}>
              {surgeInfo.reason} (x{surgeInfo.multiplier})
            </Text>
          </View>
        </View>
      )}

      {/* Quick Price Selection */}
      <View style={styles.quickPrices}>
        {quickPrices.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickPriceButton,
              { borderColor: item.color, backgroundColor: `${item.color}10` },
            ]}
            onPress={() => onSelectPrice?.(item.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickPriceLabel, { color: item.color }]}>
              {item.label}
            </Text>
            <Text style={[styles.quickPriceValue, { color: item.color }]}>
              {item.value} {estimate.currency}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price Breakdown */}
      {showBreakdown && (
        <View style={[styles.breakdown, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>
            {t('pricing.breakdown')}
          </Text>
          
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('pricing.baseFare')}
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {estimate.breakdown.base} {estimate.currency}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('pricing.distance')}
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {estimate.breakdown.distance} {estimate.currency}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              {t('pricing.duration')}
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {estimate.breakdown.duration} {estimate.currency}
            </Text>
          </View>

          {estimate.breakdown.service > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
                {t('pricing.serviceType')}
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                +{estimate.breakdown.service} {estimate.currency}
              </Text>
            </View>
          )}

          {estimate.breakdown.surge > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#F59E0B' }]}>
                ⚡ {t('pricing.surge')}
              </Text>
              <Text style={[styles.breakdownValue, { color: '#F59E0B' }]}>
                +{estimate.breakdown.surge} {estimate.currency}
              </Text>
            </View>
          )}

          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              {t('pricing.total')}
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              {estimate.suggestedPrice} {estimate.currency}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  surgeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  surgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  surgeContent: {
    flex: 1,
  },
  surgeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  surgeReason: {
    fontSize: 12,
    marginTop: 2,
  },
  quickPrices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickPriceButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  quickPriceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  quickPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  breakdown: {
    padding: 16,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default PriceSuggestion;