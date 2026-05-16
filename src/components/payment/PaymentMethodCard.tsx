// ============================================================
// 📄 PaymentMethodCard.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PaymentMethodCard.tsx] ▶ Module loaded')
//   • console.log('[PaymentMethodCard.tsx] ▶ PaymentMethodCard() rendered')
//   • console.log('[PaymentMethodCard.tsx] ▶ handleSelect() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[PaymentMethodCard.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

type PaymentMethod = 'cash' | 'card' | 'wallet';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected?: boolean;
  onSelect?: (method: PaymentMethod) => void;
  lastDigits?: string;
  holderName?: string;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  isSelected = false,
  onSelect,
  lastDigits,
  holderName,
}) => {
  console.log(`${FILE_NAME} ▶ PaymentMethodCard() rendered for method: ${method}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const handleSelect = () => {
    console.log(`${FILE_NAME} ▶ handleSelect() called for method: ${method}`);
    onSelect?.(method);
  };

  const getMethodIcon = (): string => {
    switch (method) {
      case 'wallet':
        return 'wallet';
      case 'cash':
        return 'cash-multiple';
      case 'card':
        return 'credit-card';
      default:
        return 'help-circle';
    }
  };

  const getMethodLabel = (): string => {
    switch (method) {
      case 'wallet':
        return t('payment.wallet', 'Portefeuille');
      case 'cash':
        return t('payment.cash', 'Espèces');
      case 'card':
        return t('payment.card', 'Carte bancaire');
      default:
        return method;
    }
  };

  const getMethodDescription = (): string => {
    switch (method) {
      case 'wallet':
        return t('payment.walletDesc', 'Paiement par portefeuille');
      case 'cash':
        return t('payment.cashDesc', 'Paiement en espèces');
      case 'card':
        return t('payment.cardDesc', lastDigits ? `**** **** **** ${lastDigits}` : 'Carte bancaire');
      default:
        return '';
    }
  };

  const getMethodColor = (): string => {
    switch (method) {
      case 'wallet':
        return '#4CAF50';
      case 'cash':
        return '#FF9800';
      case 'card':
        return '#2196F3';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={handleSelect}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: getMethodColor() + '20',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={getMethodIcon() as any}
          size={24}
          color={getMethodColor()}
        />
      </View>

      <View style={[styles.details, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {getMethodLabel()}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {getMethodDescription()}
        </Text>
        {holderName && (
          <Text style={[styles.holder, { color: theme.colors.textSecondary }]}>
            {holderName}
          </Text>
        )}
      </View>

      {isSelected && (
        <View style={styles.checkContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 2,
  },
  holder: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  checkContainer: {
    marginLeft: 12,
  },
});

export default PaymentMethodCard;
