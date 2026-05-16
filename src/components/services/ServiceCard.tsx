/**
 * GO WITH SALLY - SERVICE CARD COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ServiceType, ServiceConfig } from '../../types/services.types';
import { SERVICE_CONFIGS } from '../../constants/services';

interface ServiceCardProps {
  serviceType: ServiceType;
  price?: number;
  eta?: number;
  isSelected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  serviceType,
  price,
  eta,
  isSelected = false,
  onPress,
  compact = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'ar' | 'en';

  const config = SERVICE_CONFIGS[serviceType];

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          {
            backgroundColor: isSelected ? `${config.color}15` : theme.colors.surface,
            borderColor: isSelected ? config.color : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>{config.icon}</Text>
        <Text style={[styles.compactName, { color: theme.colors.text }]} numberOfLines={1}>
          {config.name[lang]}
        </Text>
        {price !== undefined && (
          <Text style={[styles.compactPrice, { color: config.color }]}>
            {price} MAD
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? `${config.color}10` : theme.colors.surface,
          borderColor: isSelected ? config.color : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {config.name[lang]}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {config.description[lang]}
          </Text>
        </View>

        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: config.color }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </View>

      {(price !== undefined || eta !== undefined) && (
        <View style={styles.footer}>
          {price !== undefined && (
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>
                {t('common.price')}
              </Text>
              <Text style={[styles.footerValue, { color: config.color }]}>
                {price} MAD
              </Text>
            </View>
          )}
          {eta !== undefined && (
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>
                {t('common.eta')}
              </Text>
              <Text style={[styles.footerValue, { color: theme.colors.text }]}>
                {eta} min
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Features */}
      <View style={styles.features}>
        {config.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={[styles.featureBadge, { backgroundColor: `${config.color}15` }]}>
            <Text style={[styles.featureText, { color: config.color }]}>
              {feature[lang]}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  featureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 140,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiceCard;