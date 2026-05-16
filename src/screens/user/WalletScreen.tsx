// ============================================================
// 📄 WalletScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[WalletScreen.tsx] ▶ Module loaded')
//   • console.log('[WalletScreen.tsx] ▶ WalletScreen() rendered')
//   • console.log('[WalletScreen.tsx] ▶ useEffect() mounted')
//   • console.log('[WalletScreen.tsx] ▶ loadWalletData() called')
//   • console.log('[WalletScreen.tsx] ▶ handleTopUp() called')
//   • console.log('[WalletScreen.tsx] ▶ handleRefresh() called')
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Services
import { walletAPI } from '../../services/api';

// Components
import WalletBalance from '../../components/payment/WalletBalance';
import PaymentMethodCard from '../../components/payment/PaymentMethodCard';

const FILE_NAME = '[WalletScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface Transaction {
  _id: string;
  type: 'topup' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  paymentMethod?: string;
  rideId?: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  lastTopUp?: string;
  transactions: Transaction[];
}

const WalletScreen: React.FC = () => {
  console.log(`${FILE_NAME} ▶ WalletScreen() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    console.log(`${FILE_NAME} ▶ loadWalletData() called`);

    try {
      const response = await walletAPI.getWallet();
      if (response.success && response.data) {
        console.log(`${FILE_NAME} ▶ Wallet data loaded: ${response.data.wallet.balance} ${response.data.wallet.currency}`);
        setWalletData(response.data.wallet);
      } else {
        console.error(`${FILE_NAME} ✗ Failed to load wallet: ${response.error}`);
        Toast.show({
          type: 'error',
          text1: t('wallet.error', 'Erreur'),
          text2: response.error || t('wallet.loadFailed', 'Impossible de charger le portefeuille'),
          duration: 3000,
        });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception during wallet load:`, error);
      Alert.alert(
        t('wallet.error', 'Erreur'),
        t('wallet.loadFailed', 'Impossible de charger le portefeuille')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    console.log(`${FILE_NAME} ▶ useEffect() mounted`);
    loadWalletData();
  }, [loadWalletData]);

  const handleTopUp = useCallback(() => {
    console.log(`${FILE_NAME} ▶ handleTopUp() called`);
    navigation.navigate('TopUpWallet');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    console.log(`${FILE_NAME} ▶ handleRefresh() called`);
    setRefreshing(true);
    loadWalletData();
  }, [loadWalletData]);

  const handleTransactionPress = (transactionId: string) => {
    console.log(`${FILE_NAME} ▶ handleTransactionPress() called for ${transactionId}`);
    // Navigate to transaction detail if needed
  };

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'topup':
        return 'plus-circle';
      case 'payment':
        return 'minus-circle';
      case 'refund':
        return 'undo';
      case 'withdrawal':
        return 'bank-transfer-out';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'topup':
        return '#4CAF50';
      case 'payment':
        return '#FF6B6B';
      case 'refund':
        return '#2196F3';
      case 'withdrawal':
        return '#FF9800';
      default:
        return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('wallet.title', 'Portefeuille')}
          </Text>
        </View>

        {/* Balance Card */}
        {walletData && (
          <WalletBalance
            balance={walletData.balance}
            currency={walletData.currency}
            lastTopUp={walletData.lastTopUp}
          />
        )}

        {/* Top Up Button */}
        <TouchableOpacity
          style={[styles.topUpBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleTopUp}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.topUpBtnText}>
            {t('wallet.topUp', 'Recharger')}
          </Text>
        </TouchableOpacity>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('wallet.paymentMethods', 'Moyens de paiement')}
          </Text>
          <PaymentMethodCard method="wallet" isSelected={true} />
          <PaymentMethodCard method="cash" />
          <PaymentMethodCard method="card" />
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('wallet.transactions', 'Historique')}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: theme.colors.primary }]}>
                {t('common.viewAll', 'Voir tout')}
              </Text>
            </TouchableOpacity>
          </View>

          {walletData && walletData.transactions.length > 0 ? (
            walletData.transactions.slice(0, 5).map((transaction) => (
              <TouchableOpacity
                key={transaction._id}
                style={[styles.transactionItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleTransactionPress(transaction._id)}
              >
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: getTransactionColor(transaction.type) + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getTransactionIcon(transaction.type) as any}
                    size={20}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>

                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionType, { color: theme.colors.text }]}>
                    {t(`wallet.${transaction.type}`, transaction.type)}
                  </Text>
                  <Text style={[styles.transactionTime, { color: theme.colors.textSecondary }]}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'topup' || transaction.type === 'refund' ? '#4CAF50' : '#FF6B6B',
                    },
                  ]}
                >
                  {transaction.type === 'topup' || transaction.type === 'refund' ? '+' : '-'}
                  {Math.abs(transaction.amount).toFixed(0)} {walletData.currency}
                </Text>

                <View style={[styles.statusBadge, { backgroundColor: transaction.status === 'completed' ? '#4CAF5020' : '#FF980020' }]}>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: transaction.status === 'completed' ? '#4CAF50' : '#FF9800',
                      },
                    ]}
                  >
                    {t(`wallet.${transaction.status}`, transaction.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="history"
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('wallet.noTransactions', 'Aucune transaction')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  topUpBtn: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topUpBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default WalletScreen;
