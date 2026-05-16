/**
 * ============================================================================
 * GO WITH SALLY - RECEIPT SCREEN
 * ============================================================================
 * Écran d'affichage du reçu de course avec téléchargement PDF
 * 
 * Fonctionnalités:
 * - Affichage détaillé du reçu
 * - Téléchargement PDF (3 modes: offline/hybrid/online)
 * - Partage via système natif
 * - Envoi par email
 * - Support multilingue (FR, AR, EN)
 * - Support RTL pour l'arabe
 * 
 * @module screens/common/ReceiptScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Services
import { receiptService, RideData } from '../../services/receiptService';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[ReceiptScreen]';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ReceiptScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  // ========================================================================
  // LOGS
  // ========================================================================
  
  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🧾 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ========================================================================
  // ÉTATS
  // ========================================================================

  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Paramètres de la route
  const rideData: RideData = route.params?.rideData || {};
  const {
    rideId = 'SALLY-' + Date.now().toString().slice(-8),
    pickup = { address: 'Point de départ' },
    destination = { address: 'Destination' },
    driver = { firstName: 'Conductrice', lastName: '', rating: 4.9 },
    vehicle = { brand: 'Dacia', model: 'Logan', plateNumber: '12345-A-1' },
    fare = 35,
    distance = '5.2 km',
    duration = '18 min',
    date = new Date().toISOString(),
    paymentMethod = 'cash',
    tip = 0,
    discount = 0,
    promoCode = null,
  } = rideData;

  // Calculs
  const baseFare = rideData.baseFare ?? Math.round(fare * 0.6);
  const distanceFare = rideData.distanceFare ?? Math.round(fare * 0.3);
  const timeFare = rideData.timeFare ?? Math.round(fare * 0.1);
  const subtotal = fare;
  const total = fare + tip - discount;

  // ========================================================================
  // HELPERS
  // ========================================================================

  const formatDate = useCallback((dateString: string) => {
    const d = new Date(dateString);
    const lang = i18n.language;
    return d.toLocaleDateString(
      lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR',
      { day: '2-digit', month: 'long', year: 'numeric' }
    );
  }, [i18n.language]);

  const formatTime = useCallback((dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const getPaymentIcon = useCallback((method: string) => {
    switch (method) {
      case 'card': return 'credit-card';
      case 'wallet': return 'wallet';
      case 'apple_pay': return 'apple';
      case 'google_pay': return 'google';
      default: return 'cash';
    }
  }, []);

  const getPaymentLabel = useCallback((method: string) => {
    switch (method) {
      case 'card': return t('payment.card');
      case 'wallet': return t('payment.wallet');
      case 'apple_pay': return t('payment.applePay');
      case 'google_pay': return t('payment.googlePay');
      default: return t('payment.cash');
    }
  }, [t]);

  // Construire l'objet RideData complet pour le service
  const buildRideData = useCallback((): RideData => ({
    rideId,
    pickup,
    destination,
    driver,
    vehicle,
    fare,
    distance,
    duration,
    date,
    paymentMethod: paymentMethod as RideData['paymentMethod'],
    tip,
    discount,
    promoCode,
    baseFare,
    distanceFare,
    timeFare,
  }), [rideId, pickup, destination, driver, vehicle, fare, distance, duration, date, paymentMethod, tip, discount, promoCode, baseFare, distanceFare, timeFare]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Télécharger le reçu PDF
   */
  const handleDownload = useCallback(async () => {
    console.log(`${FILE_NAME} 📥 Téléchargement du reçu...`);
    setIsDownloading(true);

    try {
      const result = await receiptService.downloadReceipt(buildRideData(), i18n.language);
      
      if (result.success) {
        console.log(`${FILE_NAME} ✅ Téléchargement réussi - Mode: ${result.mode}`);
        
        // Si on a un filePath, proposer de le partager/sauvegarder
        if (result.filePath) {
          Toast.show({
            type: 'success',
            text1: t('receipt.download'),
            text2: getModeLabel(result.mode),
            visibilityTime: 3000,
          });
        }
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur téléchargement:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message || t('errors.somethingWrong'),
      });
    } finally {
      setIsDownloading(false);
    }
  }, [buildRideData, t, i18n.language]);

  /**
   * Partager le reçu (texte simple)
   */
  const handleShare = useCallback(async () => {
    console.log(`${FILE_NAME} 📤 Partage du reçu...`);
    setIsSharing(true);

    try {
      const message = `
🚗 ${t('receipt.rideReceipt')} - Go With Sally

📍 ${t('receipt.from')}: ${pickup.address}
📍 ${t('receipt.to')}: ${destination.address}

📅 ${t('receipt.date')}: ${formatDate(date)}
🕐 ${t('receipt.time')}: ${formatTime(date)}

📏 ${t('receipt.distance')}: ${distance}
⏱️ ${t('receipt.duration')}: ${duration}

👩‍✈️ ${t('receipt.driver')}: ${driver.firstName}
🚙 ${t('receipt.vehicle')}: ${vehicle.brand} ${vehicle.model}

💰 ${t('receipt.total')}: ${total} DH

${t('receipt.rideId')}: ${rideId}

${t('receipt.thankYou')}
      `.trim();

      await Share.share({
        message,
        title: t('receipt.title'),
      });

      console.log(`${FILE_NAME} ✅ Partage réussi`);
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error(`${FILE_NAME} ❌ Erreur partage:`, error.message);
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: error.message,
        });
      }
    } finally {
      setIsSharing(false);
    }
  }, [pickup, destination, date, distance, duration, driver, vehicle, total, rideId, t, formatDate, formatTime]);

  /**
   * Partager le reçu PDF
   */
  const handleSharePDF = useCallback(async () => {
    console.log(`${FILE_NAME} 📤 Partage PDF du reçu...`);
    setIsSharing(true);

    try {
      const result = await receiptService.shareReceipt(buildRideData(), i18n.language);
      
      if (result.success) {
        console.log(`${FILE_NAME} ✅ Partage PDF réussi - Mode: ${result.mode}`);
      } else {
        throw new Error(result.error || 'Erreur partage');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur partage PDF:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
    } finally {
      setIsSharing(false);
    }
  }, [buildRideData, i18n.language, t]);

  /**
   * Envoyer le reçu par email
   */
  const handleEmail = useCallback(async () => {
    console.log(`${FILE_NAME} 📧 Envoi par email...`);
    setIsEmailing(true);

    try {
      const result = await receiptService.emailReceipt(buildRideData(), i18n.language);
      
      if (result.success) {
        console.log(`${FILE_NAME} ✅ Email réussi - Mode: ${result.mode}`);
        Toast.show({
          type: 'success',
          text1: t('receipt.email'),
          text2: getModeLabel(result.mode),
        });
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur email:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message || t('errors.somethingWrong'),
      });
    } finally {
      setIsEmailing(false);
    }
  }, [buildRideData, t, i18n.language]);

  /**
   * Prévisualiser le reçu (Print preview)
   */
  const handlePreview = useCallback(async () => {
    console.log(`${FILE_NAME} 👁️ Prévisualisation...`);
    
    try {
      const result = await receiptService.previewReceipt(buildRideData(), i18n.language);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur preview');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur preview:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
    }
  }, [buildRideData, i18n.language, t]);

  /**
   * Obtenir le label du mode
   */
  const getModeLabel = (mode: string): string => {
    switch (mode) {
      case 'offline': return '🔴 ' + t('modes.offline');
      case 'hybrid': return '🟡 ' + t('modes.hybrid');
      case 'online': return '🟢 ' + t('modes.online');
      default: return mode;
    }
  };

  // ========================================================================
  // COMPOSANTS INTERNES
  // ========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  // ========================================================================
  // RENDU
  // ========================================================================

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

        {/* Mode Badge (DEV) */}
        {__DEV__ && (
          <View style={styles.headerModeBadge}>
            <ModeBadge />
          </View>
        )}
        
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="receipt" size={40} color="white" />
          <Text style={styles.headerTitle}>{t('receipt.title')}</Text>
          <Text style={styles.headerSubtitle}>{rideId}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Summary Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('receipt.tripSummary')}
          </Text>

          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.routeTextContainer}>
                <Text style={[styles.routeLabel, { color: theme.colors.textSecondary }]}>
                  {t('receipt.from')}
                </Text>
                <Text style={[styles.routeAddress, { color: theme.colors.text }]} numberOfLines={2}>
                  {pickup.address}
                </Text>
              </View>
            </View>

            <View style={[styles.routeLine, { backgroundColor: theme.colors.border }]} />

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.routeTextContainer}>
                <Text style={[styles.routeLabel, { color: theme.colors.textSecondary }]}>
                  {t('receipt.to')}
                </Text>
                <Text style={[styles.routeAddress, { color: theme.colors.text }]} numberOfLines={2}>
                  {destination.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatDate(date)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatTime(date)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{distance}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{duration}</Text>
            </View>
          </View>
        </View>

        {/* Driver Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('receipt.driver')}
          </Text>

          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.driverInitial}>
                {driver.firstName?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {driver.firstName} {driver.lastName?.[0] ? driver.lastName[0] + '.' : ''}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                  {driver.rating || 4.9}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.vehicleInfo, { borderTopColor: theme.colors.border }]}>
            <View style={styles.vehicleRow}>
              <Text style={[styles.vehicleLabel, { color: theme.colors.textSecondary }]}>
                {t('receipt.vehicle')}
              </Text>
              <Text style={[styles.vehicleValue, { color: theme.colors.text }]}>
                {vehicle.brand} {vehicle.model}
              </Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={[styles.vehicleLabel, { color: theme.colors.textSecondary }]}>
                {t('receipt.plateNumber')}
              </Text>
              <Text style={[styles.vehicleValue, { color: theme.colors.primary, fontWeight: '700' }]}>
                {vehicle.plateNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Fare Breakdown Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('receipt.fareBreakdown')}
          </Text>

          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>
              {t('receipt.baseFare')}
            </Text>
            <Text style={[styles.fareValue, { color: theme.colors.text }]}>
              {baseFare} DH
            </Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>
              {t('receipt.distanceFare')}
            </Text>
            <Text style={[styles.fareValue, { color: theme.colors.text }]}>
              {distanceFare} DH
            </Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>
              {t('receipt.timeFare')}
            </Text>
            <Text style={[styles.fareValue, { color: theme.colors.text }]}>
              {timeFare} DH
            </Text>
          </View>

          {tip > 0 && (
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>
                {t('receipt.tip')}
              </Text>
              <Text style={[styles.fareValue, { color: '#4CAF50' }]}>
                +{tip} DH
              </Text>
            </View>
          )}

          {discount > 0 && (
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>
                {t('receipt.discount')} {promoCode && `(${promoCode})`}
              </Text>
              <Text style={[styles.fareValue, { color: '#4CAF50' }]}>
                -{discount} DH
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, { borderTopColor: theme.colors.primary }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              {t('receipt.total')}
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              {total} DH
            </Text>
          </View>

          {/* Payment Method */}
          <View style={[styles.paymentRow, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons
              name={getPaymentIcon(paymentMethod)}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.paymentText, { color: theme.colors.text }]}>
              {getPaymentLabel(paymentMethod)}
            </Text>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        </View>

        {/* Actions - Primary */}
        <TouchableOpacity
          style={[styles.downloadButton, isDownloading && styles.buttonDisabled]}
          onPress={handleDownload}
          disabled={isDownloading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadButtonGradient}
          >
            {isDownloading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                <Text style={styles.downloadButtonText}>{t('receipt.download')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Actions - Secondary */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {t('receipt.share')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleEmail}
            disabled={isEmailing}
          >
            {isEmailing ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {t('receipt.email')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handlePreview}
          >
            <MaterialCommunityIcons name="printer" size={22} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {t('common.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Thank You */}
        <Text style={[styles.thankYou, { color: theme.colors.textSecondary }]}>
          {t('receipt.thankYou')}
        </Text>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {APP_MODE === 'offline' ? t('modes.offline') : 
              APP_MODE === 'hybrid' ? t('modes.hybrid') : t('modes.online')}
          </Text>
        </View>
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
    paddingBottom: 30,
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
  headerModeBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
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
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    marginEnd: 12,
  },
  routeLine: {
    width: 2,
    height: 30,
    marginStart: 5,
    marginVertical: 4,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  driverDetails: {
    marginStart: 14,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  vehicleInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 14,
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 14,
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  downloadButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    minHeight: 70,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  thankYou: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  modeFooter: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

export default ReceiptScreen;