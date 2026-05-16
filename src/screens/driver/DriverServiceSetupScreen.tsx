/**
 * GO WITH SALLY - DRIVER SERVICE SETUP SCREEN
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { ServiceType } from '../../types/services.types';
import { SERVICE_CONFIGS, getAvailableServices } from '../../constants/services';
import { BADGE_CONFIGS } from '../../constants/badges';

export const DriverServiceSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const lang = i18n.language as 'fr' | 'ar' | 'en';

  const { user } = useSelector((state: RootState) => state.auth);
  const badgeLevel = user?.badge?.level || 'none';

  const availableServices = getAvailableServices(badgeLevel);
  const allServices: ServiceType[] = ['sally_eco', 'sally_standard', 'sally_confort', 'sally_pool'];

  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(
    user?.servicesOffered || ['sally_standard']
  );

  const toggleService = (service: ServiceType) => {
    if (!availableServices.includes(service)) {
      const requiredBadge = SERVICE_CONFIGS[service].requiredBadge;
      Alert.alert(
        t('services.locked'),
        t('services.lockedMessage', { badge: BADGE_CONFIGS[requiredBadge].name[lang] }),
        [{ text: t('common.ok') }]
      );
      return;
    }

    setSelectedServices(prev => {
      if (prev.includes(service)) {
        if (prev.length === 1) {
          Alert.alert(t('services.error'), t('services.minOneRequired'));
          return prev;
        }
        return prev.filter(s => s !== service);
      }
      return [...prev, service];
    });
  };

  const handleSave = () => {
    // Dispatch to update driver services
    // dispatch(updateDriverServices(selectedServices));
    Alert.alert(t('common.success'), t('services.saved'));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('services.myServices')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Badge Info */}
      <View style={[styles.badgeInfo, { backgroundColor: BADGE_CONFIGS[badgeLevel].backgroundColor }]}>
        <Text style={styles.badgeIcon}>{BADGE_CONFIGS[badgeLevel].icon}</Text>
        <View style={styles.badgeContent}>
          <Text style={[styles.badgeLabel, { color: BADGE_CONFIGS[badgeLevel].color }]}>
            {t('badges.yourLevel')}
          </Text>
          <Text style={[styles.badgeName, { color: BADGE_CONFIGS[badgeLevel].color }]}>
            {BADGE_CONFIGS[badgeLevel].name[lang]}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('services.selectServices')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
          {t('services.selectServicesDesc')}
        </Text>

        {/* Services List */}
        {allServices.map((serviceType) => {
          const config = SERVICE_CONFIGS[serviceType];
          const isSelected = selectedServices.includes(serviceType);
          const isAvailable = availableServices.includes(serviceType);
          const requiredBadge = BADGE_CONFIGS[config.requiredBadge];

          return (
            <TouchableOpacity
              key={serviceType}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: isSelected ? `${config.color}15` : theme.colors.surface,
                  borderColor: isSelected ? config.color : theme.colors.border,
                  opacity: isAvailable ? 1 : 0.6,
                },
              ]}
              onPress={() => toggleService(serviceType)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceHeader}>
                <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
                  <Text style={styles.serviceIcon}>{config.icon}</Text>
                </View>

                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                    {config.name[lang]}
                  </Text>
                  <Text style={[styles.serviceDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {config.description[lang]}
                  </Text>
                </View>

                {isAvailable ? (
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? config.color : 'transparent',
                        borderColor: config.color,
                      },
                    ]}
                  >
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                ) : (
                  <View style={[styles.lockBadge, { backgroundColor: requiredBadge.backgroundColor }]}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={[styles.lockText, { color: requiredBadge.color }]}>
                      {requiredBadge.name[lang]}
                    </Text>
                  </View>
                )}
              </View>

              {/* Features */}
              <View style={styles.features}>
                {config.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={[styles.featureBadge, { backgroundColor: `${config.color}10` }]}>
                    <Text style={[styles.featureText, { color: config.color }]}>
                      {feature[lang]}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Text style={[styles.selectedCount, { color: theme.colors.textSecondary }]}>
          {t('services.selectedCount', { count: selectedServices.length })}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  badgeContent: {},
  badgeLabel: {
    fontSize: 12,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  serviceCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  serviceHeader: {
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
  serviceIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  lockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverServiceSetupScreen;