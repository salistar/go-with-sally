/**
 * GO WITH SALLY - SERVICE SELECTOR COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ServiceType, ServiceConfig } from '../../types/services.types';
import { SERVICE_CONFIGS } from '../../constants/services';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
  availableServices?: ServiceType[];
  showEstimates?: boolean;
  estimates?: Record<ServiceType, { price: number; eta: number }>;
  disabled?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
  availableServices = ['sally_standard', 'sally_eco', 'sally_confort', 'sally_pool'],
  showEstimates = false,
  estimates,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'ar' | 'en';

  const renderServiceCard = (serviceType: ServiceType) => {
    const config = SERVICE_CONFIGS[serviceType];
    const isSelected = selectedService === serviceType;
    const estimate = estimates?.[serviceType];

    return (
      <TouchableOpacity
        key={serviceType}
        style={[
          styles.serviceCard,
          {
            backgroundColor: isSelected ? `${config.color}15` : theme.colors.surface,
            borderColor: isSelected ? config.color : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => onSelectService(serviceType)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {/* Icon & Name */}
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceIcon}>{config.icon}</Text>
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceName, { color: theme.colors.text }]}>
              {config.name[lang]}
            </Text>
            <Text style={[styles.serviceDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {config.description[lang]}
            </Text>
          </View>
        </View>

        {/* Estimates */}
        {showEstimates && estimate && (
          <View style={styles.estimateContainer}>
            <View style={styles.estimateItem}>
              <Text style={[styles.estimateLabel, { color: theme.colors.textSecondary }]}>
                {t('common.price')}
              </Text>
              <Text style={[styles.estimateValue, { color: config.color }]}>
                {estimate.price} MAD
              </Text>
            </View>
            <View style={styles.estimateItem}>
              <Text style={[styles.estimateLabel, { color: theme.colors.textSecondary }]}>
                {t('common.eta')}
              </Text>
              <Text style={[styles.estimateValue, { color: theme.colors.text }]}>
                {estimate.eta} min
              </Text>
            </View>
          </View>
        )}

        {/* Features (only for selected) */}
        {isSelected && (
          <View style={styles.featuresContainer}>
            {config.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={[styles.featureCheck, { color: config.color }]}>✓</Text>
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {feature[lang]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: config.color }]}>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('services.selectService')}
      </Text>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableServices.map(renderServiceCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  serviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  estimateContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  estimateItem: {
    flex: 1,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ServiceSelector;