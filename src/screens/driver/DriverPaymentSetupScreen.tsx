/**
 * GO WITH SALLY - DRIVER PAYMENT SETUP SCREEN
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
import { PaymentMethod } from '../../types/services.types';
import { PAYMENT_CONFIGS } from '../../constants/services';

export const DriverPaymentSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const lang = i18n.language as 'fr' | 'ar' | 'en';

  const { user } = useSelector((state: RootState) => state.auth);

  const allPayments: PaymentMethod[] = ['cash', 'card', 'wallet', 'transfer'];

  const [selectedPayments, setSelectedPayments] = useState<PaymentMethod[]>(
    user?.paymentMethodsAccepted || ['cash']
  );

  const togglePayment = (method: PaymentMethod) => {
    const config = PAYMENT_CONFIGS[method];
    
    if (!config.isAvailable) {
      Alert.alert(t('payment.unavailable'), t('payment.comingSoon'));
      return;
    }

    setSelectedPayments(prev => {
      if (prev.includes(method)) {
        if (prev.length === 1) {
          Alert.alert(t('payment.error'), t('payment.minOneRequired'));
          return prev;
        }
        return prev.filter(p => p !== method);
      }
      return [...prev, method];
    });
  };

  const handleSave = () => {
    // Dispatch to update driver payments
    // dispatch(updateDriverPayments(selectedPayments));
    Alert.alert(t('common.success'), t('payment.saved'));
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
          {t('payment.myMethods')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('payment.acceptedMethods')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
          {t('payment.acceptedMethodsDesc')}
        </Text>

        {/* Payments List */}
        {allPayments.map((method) => {
          const config = PAYMENT_CONFIGS[method];
          const isSelected = selectedPayments.includes(method);
          const isAvailable = config.isAvailable;

          return (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentCard,
                {
                  backgroundColor: isSelected ? `${config.color}15` : theme.colors.surface,
                  borderColor: isSelected ? config.color : theme.colors.border,
                  opacity: isAvailable ? 1 : 0.6,
                },
              ]}
              onPress={() => togglePayment(method)}
              activeOpacity={0.7}
            >
              <View style={styles.paymentHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
                  <Text style={styles.paymentIcon}>{config.icon}</Text>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: theme.colors.text }]}>
                    {config.name[lang]}
                  </Text>
                  <Text style={[styles.paymentDesc, { color: theme.colors.textSecondary }]}>
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
                  <View style={[styles.comingSoonBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.comingSoonText, { color: '#B45309' }]}>
                      {t('common.comingSoon')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Setup Required */}
              {config.requiresSetup && isSelected && (
                <View style={[styles.setupRequired, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.setupIcon}>⚠️</Text>
                  <Text style={[styles.setupText, { color: '#B45309' }]}>
                    {t('payment.setupRequired')}
                  </Text>
                  <TouchableOpacity style={[styles.setupButton, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.setupButtonText}>{t('payment.configure')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('payment.infoText')}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Text style={[styles.selectedCount, { color: theme.colors.textSecondary }]}>
          {t('payment.selectedCount', { count: selectedPayments.length })}
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
  paymentCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 13,
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
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  setupRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  setupIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  setupText: {
    flex: 1,
    fontSize: 12,
  },
  setupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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

export default DriverPaymentSetupScreen;