// ============================================================
// 📄 DriverStatusToggle.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[DriverStatusToggle.tsx] ▶ Module loaded')
//   • console.log('[DriverStatusToggle.tsx] ▶ DriverStatusToggle() rendered')
//   • console.log('[DriverStatusToggle.tsx] ▶ handleStatusChange() called')
//   • console.log('[DriverStatusToggle.tsx] ▶ handleGoOffline() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[DriverStatusToggle.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Driver status type
 */
type DriverStatus = 'online' | 'offline' | 'onride' | 'break';

/**
 * DriverStatusToggle Props
 */
interface DriverStatusToggleProps {
  currentStatus?: DriverStatus;
  onStatusChange?: (status: DriverStatus) => void;
  isProcessing?: boolean;
  earnings?: {
    today: number;
    week: number;
    month: number;
  };
}

/**
 * DriverStatusToggle Component
 * Toggle driver availability status with quick stats
 */
const DriverStatusToggle: React.FC<DriverStatusToggleProps> = ({
  currentStatus = 'offline',
  onStatusChange,
  isProcessing = false,
  earnings = { today: 450, week: 2100, month: 8500 },
}) => {
  console.log(`${FILE_NAME} ▶ DriverStatusToggle() rendered with status: ${currentStatus}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [status, setStatus] = useState<DriverStatus>(currentStatus);
  const [isOnline, setIsOnline] = useState(currentStatus === 'online');

  const statusConfigs: Record<DriverStatus, { icon: string; label: string; color: string; bgColor: string }> = {
    online: {
      icon: 'circle',
      label: t('driver.online', 'En ligne'),
      color: '#4CAF50',
      bgColor: '#E8F5E9',
    },
    offline: {
      icon: 'circle',
      label: t('driver.offline', 'Hors ligne'),
      color: '#757575',
      bgColor: '#F5F5F5',
    },
    onride: {
      icon: 'car',
      label: t('driver.onRide', 'En course'),
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    break: {
      icon: 'coffee',
      label: t('driver.onBreak', 'Pause'),
      color: '#FF9800',
      bgColor: '#FFF3E0',
    },
  };

  const handleStatusChange = (newStatus: DriverStatus) => {
    console.log(`${FILE_NAME} ▶ handleStatusChange() called with status: ${newStatus}`);

    if (newStatus === status) return;

    if (newStatus === 'online') {
      // Check conditions before going online
      Alert.alert(
        t('driver.goOnline', 'Vous allez en ligne'),
        t('driver.goOnlineMessage', 'Vous commencerez à recevoir des demandes de trajet'),
        [
          { text: t('common.cancel', 'Annuler'), style: 'cancel' },
          {
            text: t('common.confirm', 'Confirmer'),
            onPress: () => {
              setStatus(newStatus);
              setIsOnline(true);
              onStatusChange?.(newStatus);
              Toast.show({
                type: 'success',
                text1: t('driver.nowOnline', 'Vous êtes en ligne'),
                position: 'bottom',
              });
            },
          },
        ]
      );
    } else if (newStatus === 'offline') {
      handleGoOffline();
    } else {
      setStatus(newStatus);
      setIsOnline(false);
      onStatusChange?.(newStatus);
    }
  };

  const handleGoOffline = () => {
    console.log(`${FILE_NAME} ▶ handleGoOffline() called`);

    Alert.alert(
      t('driver.goOffline', 'Vous allez hors ligne'),
      t('driver.goOfflineMessage', 'Vous ne recevrez plus de demandes de trajet'),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.confirm', 'Confirmer'),
          style: 'destructive',
          onPress: () => {
            setStatus('offline');
            setIsOnline(false);
            onStatusChange?.('offline');
            Toast.show({
              type: 'info',
              text1: t('driver.nowOffline', 'Vous êtes hors ligne'),
              position: 'bottom',
            });
          },
        },
      ]
    );
  };

  const toggleSwitch = (value: boolean) => {
    if (value) {
      handleStatusChange('online');
    } else {
      handleStatusChange('offline');
    }
  };

  const statusConfig = statusConfigs[status];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Status Display */}
      <LinearGradient
        colors={[statusConfig.color, statusConfig.color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statusCard}
      >
        <View style={styles.statusLeft}>
          <View style={styles.statusIconWrapper}>
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={32}
              color="white"
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>
              {t('driver.currentStatus', 'Statut actuel')}
            </Text>
            <Text style={styles.statusValue}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Toggle Switch */}
        <Switch
          value={isOnline}
          onValueChange={toggleSwitch}
          disabled={isProcessing}
          trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.6)' }}
          thumbColor="white"
          style={styles.toggle}
        />
      </LinearGradient>

      {/* Status Options */}
      {status === 'online' && (
        <View style={styles.statusOptions}>
          <TouchableOpacity
            style={[styles.statusOption, { backgroundColor: theme.colors.background }]}
            onPress={() => handleStatusChange('break')}
          >
            <MaterialCommunityIcons
              name="coffee"
              size={20}
              color={statusConfigs.break.color}
            />
            <Text style={[styles.statusOptionText, { color: theme.colors.text }]}>
              {t('driver.takeBreak', 'Prendre une pause')}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Earnings Summary */}
      <View style={styles.earningsSection}>
        <Text style={[styles.earningsTitle, { color: theme.colors.text }]}>
          {t('driver.earnings', 'Vos gains')}
        </Text>

        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>
              {t('driver.today', 'Aujourd\'hui')}
            </Text>
            <Text style={[styles.earningsValue, { color: theme.colors.primary }]}>
              {earnings.today.toFixed(0)} MAD
            </Text>
          </View>

          <View style={styles.earningsCard}>
            <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>
              {t('driver.week', 'Cette semaine')}
            </Text>
            <Text style={[styles.earningsValue, { color: theme.colors.primary }]}>
              {earnings.week.toFixed(0)} MAD
            </Text>
          </View>

          <View style={styles.earningsCard}>
            <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>
              {t('driver.month', 'Ce mois')}
            </Text>
            <Text style={[styles.earningsValue, { color: theme.colors.primary }]}>
              {earnings.month.toFixed(0)} MAD
            </Text>
          </View>
        </View>
      </View>

      {/* Info Card */}
      {status === 'offline' && (
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}20` }]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {t('driver.goOnlineInfo', 'Activez votre statut pour commencer à recevoir des demandes')}
          </Text>
        </View>
      )}

      {status === 'online' && (
        <View style={[styles.infoCard, { backgroundColor: '#4CAF5020' }]}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={20}
            color="#4CAF50"
          />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {t('driver.youAreOnline', 'Vous êtes visible pour les passagères. Soyez prêt à accepter les demandes.')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  toggle: {
    marginLeft: 12,
  },
  statusOptions: {
    gap: 8,
    marginBottom: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  earningsSection: {
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  earningsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  earningsCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default DriverStatusToggle;
