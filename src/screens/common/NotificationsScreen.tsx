// ============================================================
// 📄 NotificationsScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[NotificationsScreen.tsx] ▶ Module loaded')
//   • console.log('[NotificationsScreen.tsx] ▶ NotificationsScreen() rendered')
//   • console.log('[NotificationsScreen.tsx] ▶ loadNotifications() called')
//   • console.log('[NotificationsScreen.tsx] ▶ handleMarkAsRead() called')
//   • console.log('[NotificationsScreen.tsx] ▶ handleDeleteNotification() called')
//   • console.log('[NotificationsScreen.tsx] ▶ handleMarkAllAsRead() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  I18nManager,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[NotificationsScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Notification interface
 */
interface Notification {
  id: string;
  type: 'ride' | 'payment' | 'message' | 'system' | 'badge';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

/**
 * NotificationsScreen Component
 * Displays user notifications with read/unread status
 */
const NotificationsScreen = () => {
  console.log(`${FILE_NAME} ▶ NotificationsScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ride',
      title: t('notifications.rideCompleted', 'Trajet terminé'),
      message: t('notifications.rideCompletedMessage', 'Votre trajet avec Fatima a été complété'),
      icon: 'car-checkmark',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isRead: false,
    },
    {
      id: '2',
      type: 'payment',
      title: t('notifications.paymentSuccess', 'Paiement confirmé'),
      message: t('notifications.paymentSuccessMessage', '45 MAD débité pour votre dernier trajet'),
      icon: 'credit-card-check',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
    },
    {
      id: '3',
      type: 'badge',
      title: t('notifications.badgeUnlocked', 'Badge débloqué'),
      message: t('notifications.badgeMessage', 'Vous avez débloqué le badge "Voyageuse"'),
      icon: 'badge-check',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isRead: true,
    },
    {
      id: '4',
      type: 'message',
      title: t('notifications.newMessage', 'Nouveau message'),
      message: t('notifications.newMessageFrom', 'Fatima : Merci pour ce trajet!'),
      icon: 'message-text',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      isRead: true,
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    console.log(`${FILE_NAME} ▶ loadNotifications() called`);
    // In a real app, fetch from backend
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = (id: string) => {
    console.log(`${FILE_NAME} ▶ handleMarkAsRead() called with id: ${id}`);

    setNotifications(notifs =>
      notifs.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  const handleDeleteNotification = (id: string) => {
    console.log(`${FILE_NAME} ▶ handleDeleteNotification() called with id: ${id}`);

    Alert.alert(
      t('notifications.deleteConfirm', 'Supprimer cette notification?'),
      '',
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: () => {
            setNotifications(notifs => notifs.filter(n => n.id !== id));
            Toast.show({
              type: 'success',
              text1: t('notifications.deleted', 'Notification supprimée'),
              position: 'bottom',
            });
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    console.log(`${FILE_NAME} ▶ handleMarkAllAsRead() called`);

    setNotifications(notifs => notifs.map(n => ({ ...n, isRead: true })));
    Toast.show({
      type: 'success',
      text1: t('notifications.allMarkedAsRead', 'Toutes les notifications marquées comme lues'),
      position: 'bottom',
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'ride':
        return theme.colors.primary;
      case 'payment':
        return '#4CAF50';
      case 'badge':
        return '#FF9800';
      case 'message':
        return '#2196F3';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow', 'À l\'instant');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.isRead ? theme.colors.surface : theme.colors.background,
          borderLeftColor: getNotificationColor(item.type),
          borderLeftWidth: 4,
        },
      ]}
      onPress={() => handleMarkAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: `${getNotificationColor(item.type)}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>

          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text
              style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>

          <View style={styles.notificationRight}>
            {!item.isRead && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: getNotificationColor(item.type) },
                ]}
              />
            )}
          </View>
        </View>

        <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteNotification(item.id)}
      >
        <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const emptyNotifications = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="bell-off-outline"
        size={60}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('notifications.empty', 'Aucune notification')}
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {t('notifications.emptyMessage', 'Vous verrez ici vos notifications')}
      </Text>
    </View>
  );

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
        <View style={styles.headerTitle}>
          <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
            {t('notifications.title', 'Notifications')}
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: theme.colors.primary }]}>
              {unreadCount} {t('notifications.new', 'nouveau')}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllBtn, { color: theme.colors.primary }]}>
              {t('notifications.markAllAsRead', 'Tout marquer comme lu')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        ListEmptyComponent={emptyNotifications}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      />
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
    flex: 1,
    marginLeft: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  unreadCount: {
    fontSize: 12,
    marginTop: 2,
  },
  markAllBtn: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationRight: {
    marginLeft: 8,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 8,
  },
  deleteBtn: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
