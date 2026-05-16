// ============================================================
// 📄 WalletBalance.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[WalletBalance.tsx] ▶ Module loaded')
//   • console.log('[WalletBalance.tsx] ▶ WalletBalance() rendered')
//   • console.log('[WalletBalance.tsx] ▶ toggleBalanceVisibility() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';

const FILE_NAME = '[WalletBalance.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface WalletBalanceProps {
  balance: number;
  currency: string;
  lastTopUp?: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  currency,
  lastTopUp,
}) => {
  console.log(`${FILE_NAME} ▶ WalletBalance() rendered with balance: ${balance}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const toggleBalanceVisibility = () => {
    console.log(`${FILE_NAME} ▶ toggleBalanceVisibility() called`);
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formattedBalance = balance.toFixed(0);
  const formattedLastTopUp = lastTopUp
    ? new Date(lastTopUp).toLocaleDateString()
    : t('wallet.noTopUp', 'Aucun rechargement');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color="white"
              />
              <Text style={styles.title}>
                {t('wallet.balance', 'Solde')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleBalanceVisibility}
              style={styles.visibilityBtn}
            >
              <MaterialCommunityIcons
                name={isBalanceVisible ? 'eye' : 'eye-off'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Balance Display */}
          <View style={[styles.balanceContainer, { marginLeft: isRTL ? 'auto' : 0, marginRight: isRTL ? 0 : 'auto' }]}>
            <Text style={styles.balanceAmount}>
              {isBalanceVisible ? formattedBalance : '●●●'}
            </Text>
            <Text style={styles.currency}>{currency}</Text>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color="rgba(255, 255, 255, 0.7)"
              />
              <View style={styles.footerText}>
                <Text style={styles.footerLabel}>
                  {t('wallet.lastTopUp', 'Dernier rechargement')}
                </Text>
                <Text style={styles.footerValue}>{formattedLastTopUp}</Text>
              </View>
            </View>

            {/* Secured Badge */}
            <View style={[styles.badge, { backgroundColor: 'rgba(76, 175, 80, 0.3)' }]}>
              <MaterialCommunityIcons
                name="shield-check"
                size={12}
                color="rgba(255, 255, 255, 0.9)"
              />
              <Text style={styles.badgeText}>
                {t('wallet.secured', 'Sécurisé')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statItem,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="trending-up"
              size={18}
              color="#4CAF50"
            />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('wallet.thisMonth', 'Ce mois-ci')}
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              +{(balance * 0.15).toFixed(0)} {currency}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('wallet.available', 'Disponible')}
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formattedBalance} {currency}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 12,
  },
  gradientCard: {
    borderRadius: 16,
    padding: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  visibilityBtn: {
    padding: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  currency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerText: {
    gap: 2,
  },
  footerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  footerValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WalletBalance;
