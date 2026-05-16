/**
 * ============================================================================
 * GO WITH SALLY - SHARE TRIP SCREEN
 * ============================================================================
 * Écran de partage de trajet avec contacts
 * 
 * @module screens/common/ShareTripScreen
 * @version 1.0.0
 * ============================================================================
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ShareTripScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Paramètres de la route
  const tripData = route.params?.tripData || {};
  const {
    rideId = 'SALLY-' + Date.now().toString().slice(-8),
    pickup = { address: 'Point de départ', lat: 33.5731, lng: -7.5898 },
    destination = { address: 'Destination', lat: 33.5892, lng: -7.6033 },
    driver = { firstName: 'Conductrice', lastName: '', rating: 4.9 },
    vehicle = { brand: 'Dacia', model: 'Logan', plateNumber: '12345-A-1', color: 'Blanc' },
    eta = '15 min',
  } = tripData;

  // State
  const [liveShareEnabled, setLiveShareEnabled] = useState(false);
  const shareLink = `https://gowithsally.ma/track/${rideId}`;

  // Générer le message de partage
  const generateShareMessage = useCallback(() => {
    return `
🚗 ${t('share.shareMessage')}

📍 ${t('share.tripInfo')}:
• ${t('receipt.from')}: ${pickup.address}
• ${t('receipt.to')}: ${destination.address}
• ${t('share.eta')}: ${eta}

👩‍✈️ ${t('share.driver')}: ${driver.firstName}
🚙 ${t('share.vehicle')}: ${vehicle.brand} ${vehicle.model} (${vehicle.color})
🔢 ${t('receipt.plateNumber')}: ${vehicle.plateNumber}

${liveShareEnabled ? `📡 ${t('share.liveTracking')}: ${shareLink}` : ''}

- Go With Sally 💖
    `.trim();
  }, [pickup, destination, driver, vehicle, eta, liveShareEnabled, shareLink, t]);

  // Partager via système natif
  const handleShareNative = async () => {
    try {
      const message = generateShareMessage();
      await Share.share({
        message,
        title: t('share.shareTrip'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Partager via WhatsApp
  const handleShareWhatsApp = async () => {
    const message = encodeURIComponent(generateShareMessage());
    const url = `whatsapp://send?text=${message}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: 'error',
          text1: 'WhatsApp',
          text2: t('common.unavailable'),
        });
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
    }
  };

  // Partager via SMS
  const handleShareSMS = async () => {
    const message = encodeURIComponent(generateShareMessage());
    const url = Platform.OS === 'ios'
      ? `sms:&body=${message}`
      : `sms:?body=${message}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('SMS share error:', error);
    }
  };

  // Partager via Email
  const handleShareEmail = async () => {
    const subject = encodeURIComponent(t('share.shareTrip') + ' - Go With Sally');
    const body = encodeURIComponent(generateShareMessage());
    const url = `mailto:?subject=${subject}&body=${body}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Email share error:', error);
    }
  };

  // Copier le lien
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareLink);
    Toast.show({
      type: 'success',
      text1: t('share.linkCopied'),
    });
  };

  // Options de partage
  const shareOptions = [
    {
      id: 'whatsapp',
      icon: 'whatsapp',
      label: t('share.whatsapp'),
      color: '#25D366',
      action: handleShareWhatsApp,
    },
    {
      id: 'sms',
      icon: 'message-text',
      label: t('share.sms'),
      color: '#4CAF50',
      action: handleShareSMS,
    },
    {
      id: 'email',
      icon: 'email',
      label: t('share.email'),
      color: '#EA4335',
      action: handleShareEmail,
    },
    {
      id: 'more',
      icon: 'share-variant',
      label: t('share.more'),
      color: '#9E9E9E',
      action: handleShareNative,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FF69B4', '#FF1493']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="share-variant" size={36} color="white" />
          <Text style={styles.headerTitle}>{t('share.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('share.shareDetails')}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('share.tripInfo')}
          </Text>

          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.routeText, { color: theme.colors.text }]} numberOfLines={2}>
                {pickup.address}
              </Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.routeText, { color: theme.colors.text }]} numberOfLines={2}>
                {destination.address}
              </Text>
            </View>
          </View>

          {/* ETA */}
          <View style={[styles.etaRow, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.etaLabel, { color: theme.colors.textSecondary }]}>
              {t('share.eta')}:
            </Text>
            <Text style={[styles.etaValue, { color: theme.colors.text }]}>{eta}</Text>
          </View>
        </View>

        {/* Driver Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.driverRow}>
            <View style={styles.driverInfo}>
              <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.driverInitial}>
                  {driver.firstName?.charAt(0).toUpperCase() || 'C'}
                </Text>
              </View>
              <View>
                <Text style={[styles.driverLabel, { color: theme.colors.textSecondary }]}>
                  {t('share.driver')}
                </Text>
                <Text style={[styles.driverName, { color: theme.colors.text }]}>
                  {driver.firstName}
                </Text>
              </View>
            </View>

            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleLabel, { color: theme.colors.textSecondary }]}>
                {t('share.vehicle')}
              </Text>
              <Text style={[styles.vehicleValue, { color: theme.colors.text }]}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={[styles.plateNumber, { color: theme.colors.primary }]}>
                {vehicle.plateNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Share Toggle */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons
                name="access-point"
                size={24}
                color={liveShareEnabled ? '#4CAF50' : theme.colors.textSecondary}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>
                  {t('share.liveTracking')}
                </Text>
                <Text style={[styles.toggleDesc, { color: theme.colors.textSecondary }]}>
                  {liveShareEnabled ? t('share.disableLiveShare') : t('share.enableLiveShare')}
                </Text>
              </View>
            </View>
            <Switch
              value={liveShareEnabled}
              onValueChange={setLiveShareEnabled}
              trackColor={{ false: theme.colors.border, true: '#4CAF50' + '60' }}
              thumbColor={liveShareEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* Share Link */}
          {liveShareEnabled && (
            <TouchableOpacity
              style={[styles.linkRow, { backgroundColor: theme.colors.background }]}
              onPress={handleCopyLink}
            >
              <MaterialCommunityIcons name="link" size={20} color={theme.colors.primary} />
              <Text
                style={[styles.linkText, { color: theme.colors.primary }]}
                numberOfLines={1}
              >
                {shareLink}
              </Text>
              <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Share Options */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('share.shareVia')}
          </Text>

          <View style={styles.shareOptionsGrid}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.shareOption}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: option.color }]}>
                  <MaterialCommunityIcons name={option.icon as any} size={28} color="white" />
                </View>
                <Text style={[styles.shareOptionLabel, { color: theme.colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <TouchableOpacity
          style={[styles.emergencyButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => Toast.show({ type: 'info', text1: t('common.comingSoon') })}
        >
          <MaterialCommunityIcons name="shield-account" size={24} color="#F44336" />
          <View style={styles.emergencyTextContainer}>
            <Text style={[styles.emergencyTitle, { color: theme.colors.text }]}>
              {t('share.emergencyContacts')}
            </Text>
            <Text style={[styles.emergencyDesc, { color: theme.colors.textSecondary }]}>
              {t('share.selectContacts')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  etaLabel: {
    fontSize: 14,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  driverLabel: {
    fontSize: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehicleLabel: {
    fontSize: 12,
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    width: 70,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emergencyDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ShareTripScreen;