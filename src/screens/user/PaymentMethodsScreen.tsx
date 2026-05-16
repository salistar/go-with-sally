// ============================================================
// 📄 PaymentMethodsScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PaymentMethodsScreen.tsx] ▶ Module loaded')
//   • console.log('[PaymentMethodsScreen.tsx] ▶ PaymentMethodsScreen() rendered')
//   • console.log('[PaymentMethodsScreen.tsx] ▶ handleSelectMethod() called')
//   • console.log('[PaymentMethodsScreen.tsx] ▶ handleAddPaymentMethod() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[PaymentMethodsScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Payment method interface
 */
interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'wallet';
  label: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  lastFourDigits?: string;
}

/**
 * PaymentMethodsScreen Component
 * Displays available payment methods and allows selection
 */
const PaymentMethodsScreen = () => {
  console.log(`${FILE_NAME} ▶ PaymentMethodsScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'cash',
      label: t('payment.cash', 'Espèces'),
      icon: 'cash',
      isDefault: true,
      isActive: true,
    },
    {
      id: '2',
      type: 'wallet',
      label: t('payment.wallet', 'Portefeuille Sally'),
      icon: 'wallet',
      isDefault: false,
      isActive: false,
      lastFourDigits: '5678',
    },
  ]);

  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
    }, [])
  );

  const handleSelectMethod = (id: string) => {
    console.log(`${FILE_NAME} ▶ handleSelectMethod() called with id: ${id}`);

    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );

    Toast.show({
      type: 'success',
      text1: t('payment.methodSelected', 'Méthode de paiement sélectionnée'),
      position: 'bottom',
    });
  };

  const handleAddPaymentMethod = () => {
    console.log(`${FILE_NAME} ▶ handleAddPaymentMethod() called`);

    Alert.alert(
      t('payment.addCard', 'Ajouter une carte'),
      t('payment.addCardMessage', 'Fonctionnalité bientôt disponible'),
      [{ text: t('common.ok', 'OK') }]
    );
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      t('payment.deleteMethod', 'Supprimer cette méthode?'),
      '',
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('payment.methods', 'Modes de paiement')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Payment Methods List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('payment.availableMethods', 'Méthodes disponibles')}
          </Text>

          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: method.isDefault ? theme.colors.primary : theme.colors.border,
                  borderWidth: method.isDefault ? 2 : 1,
                },
              ]}
              onPress={() => handleSelectMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <View
                  style={[
                    styles.methodIcon,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={24}
                    color={method.isDefault ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodLabel, { color: theme.colors.text }]}>
                    {method.label}
                  </Text>
                  {method.lastFourDigits && (
                    <Text style={[styles.methodDetail, { color: theme.colors.textSecondary }]}>
                      {t('payment.endsWith', 'Se termine par')} {method.lastFourDigits}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.methodRight}>
                {method.isDefault ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="circle-outline"
                    size={24}
                    color={theme.colors.border}
                  />
                )}
              </View>

              {method.type !== 'cash' && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteMethod(method.id)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Payment Method */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.addCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={handleAddPaymentMethod}
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.addCardText}>
              <Text style={[styles.addCardTitle, { color: theme.colors.primary }]}>
                {t('payment.addCard', 'Ajouter une carte')}
              </Text>
              <Text style={[styles.addCardSubtitle, { color: theme.colors.textSecondary }]}>
                {t('payment.addCardDescription', 'Ajouter une nouvelle carte bancaire')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('payment.secureMessage', 'Vos paiements sont sécurisés par une technologie de chiffrement avancée')}
          </Text>
        </View>
      </ScrollView>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  methodLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDetail: {
    fontSize: 12,
  },
  methodRight: {
    paddingLeft: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCardText: {
    marginLeft: 16,
    flex: 1,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addCardSubtitle: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
  },
});

export default PaymentMethodsScreen;
