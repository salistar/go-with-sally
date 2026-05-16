// ============================================================
// 📄 ServiceComparator.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ServiceComparator.tsx] ▶ Module loaded')
//   • console.log('[ServiceComparator.tsx] ▶ ServiceComparator() rendered')
//   • console.log('[ServiceComparator.tsx] ▶ handleServiceSelect() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ServiceComparator.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

type ServiceType = 'eco' | 'standard' | 'confort' | 'pool';

interface ServiceOption {
  type: ServiceType;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  perKm: number;
  perMinute: number;
  capacity: number;
  features: string[];
  badge?: string;
  color: string;
}

interface ServiceComparatorProps {
  selectedService: ServiceType;
  onServiceSelect: (service: ServiceType) => void;
  distance: number;
  duration: number;
  currency: string;
}

const ServiceComparator: React.FC<ServiceComparatorProps> = ({
  selectedService,
  onServiceSelect,
  distance,
  duration,
  currency,
}) => {
  console.log(`${FILE_NAME} ▶ ServiceComparator() rendered for service: ${selectedService}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const services: ServiceOption[] = [
    {
      type: 'eco',
      name: t('service.eco', 'Éco'),
      description: t('service.ecoDesc', 'Option économique'),
      icon: 'leaf',
      basePrice: 5,
      perKm: 1.2,
      perMinute: 0.15,
      capacity: 4,
      features: [t('service.basic', 'Basique'), t('service.wifi', 'WiFi')],
      badge: t('service.cheapest', 'Moins cher'),
      color: '#4CAF50',
    },
    {
      type: 'standard',
      name: t('service.standard', 'Standard'),
      description: t('service.standardDesc', 'Option recommandée'),
      icon: 'car',
      basePrice: 8,
      perKm: 1.8,
      perMinute: 0.22,
      capacity: 4,
      features: [t('service.comfort', 'Confort'), t('service.music', 'Musique'), t('service.charger', 'Chargeur')],
      badge: t('service.popular', 'Populaire'),
      color: '#2196F3',
    },
    {
      type: 'confort',
      name: t('service.confort', 'Confort'),
      description: t('service.confortDesc', 'Premium'),
      icon: 'premium',
      basePrice: 12,
      perKm: 2.5,
      perMinute: 0.30,
      capacity: 4,
      features: [t('service.premium', 'Premium'), t('service.aircon', 'Climatisation'), t('service.bottled', 'Eau gratuite')],
      badge: t('service.best', 'Meilleur'),
      color: '#FF9800',
    },
    {
      type: 'pool',
      name: t('service.pool', 'Partage'),
      description: t('service.poolDesc', 'Partage de trajet'),
      icon: 'account-multiple',
      basePrice: 3,
      perKm: 0.8,
      perMinute: 0.10,
      capacity: 4,
      features: [t('service.shared', 'Partagé'), t('service.eco', 'Écologique'), t('service.cheap', 'Pas cher')],
      color: '#9C27B0',
    },
  ];

  const handleServiceSelect = (service: ServiceType) => {
    console.log(`${FILE_NAME} ▶ handleServiceSelect() called for service: ${service}`);
    onServiceSelect(service);
  };

  const calculatePrice = (service: ServiceOption): number => {
    const distancePrice = distance * service.perKm;
    const durationPrice = duration * service.perMinute;
    return service.basePrice + distancePrice + durationPrice;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('pricing.selectService', 'Sélectionner un service')}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        contentContainerStyle={styles.scrollContainer}
      >
        {services.map((service) => {
          const isSelected = selectedService === service.type;
          const estimatedPrice = calculatePrice(service);

          return (
            <TouchableOpacity
              key={service.type}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: isSelected ? service.color + '20' : theme.colors.surface,
                  borderColor: isSelected ? service.color : theme.colors.border,
                },
              ]}
              onPress={() => handleServiceSelect(service.type)}
              activeOpacity={0.7}
            >
              {/* Badge */}
              {service.badge && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: service.color },
                  ]}
                >
                  <Text style={styles.badgeText}>{service.badge}</Text>
                </View>
              )}

              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: service.color + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name={service.icon as any}
                  size={28}
                  color={service.color}
                />
              </View>

              {/* Service Name */}
              <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                {service.name}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {service.description}
              </Text>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: service.color }]}>
                  {estimatedPrice.toFixed(0)}
                </Text>
                <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>
                  {currency}
                </Text>
              </View>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {service.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <MaterialCommunityIcons
                      name="check-small"
                      size={14}
                      color={service.color}
                    />
                    <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Selection Indicator */}
              {isSelected && (
                <View style={[styles.selectionIndicator, { backgroundColor: service.color }]}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="white"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Service Details */}
      <View style={[styles.detailsContainer, { backgroundColor: theme.colors.surface }]}>
        {services
          .filter((s) => s.type === selectedService)
          .map((service) => (
            <View key={service.type} style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('pricing.basePrice', 'Prix de base')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {service.basePrice} {currency}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('pricing.perKm', 'Par km')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {service.perKm} {currency}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('pricing.perMinute', 'Par minute')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {service.perMinute.toFixed(2)} {currency}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  {t('pricing.capacity', 'Capacité')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {service.capacity} {t('pricing.passengers', 'passagers')}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  serviceCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  currency: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 10,
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: -8,
    borderRadius: 12,
    padding: 4,
  },
  detailsContainer: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ServiceComparator;
