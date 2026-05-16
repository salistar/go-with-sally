/**
 * ============================================================================
 * GO WITH SALLY - RIDE COMPLETED SCREEN (PASSENGER)
 * ============================================================================
 * Écran de fin de course passagère avec notation conductrice
 * 
 * Fonctionnalités:
 * - Récapitulatif de la course
 * - Système de notation 5 étoiles avec animations
 * - Commentaire optionnel
 * - Pourboire avec options prédéfinies
 * - Reçu téléchargeable
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/RideCompletedScreen
 * @version 2.1.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { rideAPI } from '../../services/api';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[RideCompletedScreen]';
const isRTL = I18nManager.isRTL;

// Options de pourboire
const TIP_OPTIONS = [
  { id: 'none', amount: 0, labelKey: 'ride.noTip' },
  { id: 'tip1', amount: 5 },
  { id: 'tip2', amount: 10 },
  { id: 'tip3', amount: 20 },
  { id: 'custom', amount: 0, isCustom: true, labelKey: 'ride.custom' },
];

// Labels de notation
const RATING_LABELS = [
  { rating: 1, labelKey: 'driver.rating1', emoji: '😞' },
  { rating: 2, labelKey: 'driver.rating2', emoji: '😕' },
  { rating: 3, labelKey: 'driver.rating3', emoji: '😐' },
  { rating: 4, labelKey: 'driver.rating4', emoji: '🙂' },
  { rating: 5, labelKey: 'driver.rating5', emoji: '😍' },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const RideCompletedScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Paramètres de la route
  const driver = route.params?.driver;
  const pickup = route.params?.pickup;
  const destination = route.params?.destination;
  const price = route.params?.price || 35;
  const duration = route.params?.duration || '18 min';
  const distance = route.params?.distance || '5.2 km';
  const rideId = route.params?.rideId;
  const vehicle = route.params?.vehicle || { brand: 'Dacia', model: 'Logan', plateNumber: '12345-A-1', color: 'Blanc' };
  const paymentMethod = route.params?.paymentMethod || 'cash';

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 💰 Prix: ${price} DH`);
    console.log(`${FILE_NAME} 🚗 Conductrice: ${driver?.firstName || 'N/A'}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<string>('none');
  const [customTip, setCustomTip] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const checkAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animation d'entrée séquencée
    Animated.sequence([
      // Check icon bounce
      Animated.spring(checkAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      // Fade et slide du contenu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation des étoiles avec délai
    starAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        delay: 500 + index * 80,
        useNativeDriver: true,
      }).start();
    });

    // Pulse animation pour le bouton submit
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ==========================================================================
  // FONCTIONS
  // ==========================================================================

  const getTipAmount = useCallback((): number => {
    if (selectedTip === 'none') return 0;
    if (selectedTip === 'custom') {
      return parseInt(customTip) || 0;
    }
    const tip = TIP_OPTIONS.find((t) => t.id === selectedTip);
    return tip?.amount || 0;
  }, [selectedTip, customTip]);

  const getTotal = useCallback((): number => {
    return price + getTipAmount();
  }, [price, getTipAmount]);

  const getRatingLabel = useCallback(() => {
    const ratingInfo = RATING_LABELS.find((r) => r.rating === rating);
    return ratingInfo ? { label: t(ratingInfo.labelKey), emoji: ratingInfo.emoji } : { label: '', emoji: '' };
  }, [rating, t]);

  const navigateToHome = useCallback(() => {
    console.log(`${FILE_NAME} 🏠 Navigation vers UserTabs`);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'UserTabs' }],
      })
    );
  }, [navigation]);

  // Build ride data object for Receipt and Share screens
  const buildRideData = useCallback(() => ({
    rideId: rideId || 'SALLY-' + Date.now().toString().slice(-8),
    pickup,
    destination,
    driver,
    vehicle,
    fare: price,
    distance,
    duration,
    date: new Date().toISOString(),
    paymentMethod,
    tip: getTipAmount(),
    discount: 0,
    promoCode: null,
  }), [rideId, pickup, destination, driver, vehicle, price, distance, duration, paymentMethod, getTipAmount]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} ⭐ === SOUMISSION NOTATION ===`);
    console.log(`${FILE_NAME} ⭐ Note: ${rating}/5`);
    console.log(`${FILE_NAME} 💬 Commentaire: ${comment || 'Aucun'}`);
    console.log(`${FILE_NAME} 💰 Pourboire: ${getTipAmount()} DH`);

    setIsSubmitting(true);

    try {
      if (IS_OFFLINE) {
        // Mode OFFLINE - Simulation
        console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Simulation`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else if (IS_HYBRID) {
        // Mode HYBRID - Tentative API avec fallback
        console.log(`${FILE_NAME} 🟡 Mode HYBRID - Tentative API`);
        try {
          if (rideId) {
            await rideAPI.rateRide(rideId, rating, comment);
          }
        } catch (error) {
          console.log(`${FILE_NAME} 🟡 Fallback simulation`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } else {
        // Mode ONLINE - API réelle
        console.log(`${FILE_NAME} 🟢 Mode ONLINE - API réelle`);
        if (rideId) {
          await rideAPI.rateRide(rideId, rating, comment);
        }
      }

      console.log(`${FILE_NAME} ✅ Notation soumise`);

      Toast.show({
        type: 'success',
        text1: t('ride.thankYou'),
        text2: t('ride.ratingSubmitted'),
      });

      navigateToHome();
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error?.message || t('errors.somethingWrong'),
      });
      setIsSubmitting(false);
    }
  }, [rating, comment, getTipAmount, rideId, navigateToHome, t]);

  const handleSkip = useCallback((): void => {
    console.log(`${FILE_NAME} ⏭️ Skip notation`);
    navigateToHome();
  }, [navigateToHome]);

  const handleViewReceipt = useCallback((): void => {
    console.log(`${FILE_NAME} 🧾 Voir reçu`);
    navigation.navigate('Receipt', { rideData: buildRideData() });
  }, [navigation, buildRideData]);

  const handleShareTrip = useCallback((): void => {
    console.log(`${FILE_NAME} 📤 Partager trajet`);
    navigation.navigate('ShareTrip', { tripData: buildRideData() });
  }, [navigation, buildRideData]);

  const handleStarPress = useCallback((star: number) => {
    console.log(`${FILE_NAME} ⭐ Note: ${star}`);
    setRating(star);
    
    // Animation bounce sur l'étoile sélectionnée
    Animated.sequence([
      Animated.timing(starAnims[star - 1], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starAnims[star - 1], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [starAnims]);

  const handleTipSelect = useCallback((tipId: string) => {
    console.log(`${FILE_NAME} 💰 Pourboire: ${tipId}`);
    setSelectedTip(tipId);
    if (tipId !== 'custom') {
      setCustomTip('');
    }
  }, []);

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

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

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* HEADER SUCCÈS */}
        {/* ================================================================ */}
        <LinearGradient
          colors={['#FF69B4', '#FF1493']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          {/* Mode Badge (DEV) */}
          {__DEV__ && (
            <View style={styles.headerModeBadge}>
              <ModeBadge />
            </View>
          )}

          {/* Check animé */}
          <Animated.View
            style={[
              styles.checkContainer,
              {
                transform: [
                  { scale: checkAnim },
                  {
                    rotate: checkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check" size={50} color="#4CAF50" />
            </View>
          </Animated.View>

          <Text style={styles.headerTitle}>{t('ride.rideCompleted')}</Text>
          <Text style={styles.headerSubtitle}>{t('ride.thankYouForRiding')}</Text>

          {/* Prix total */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('ride.total')}</Text>
            <Text style={styles.priceValue}>{price} DH</Text>
          </View>
        </LinearGradient>

        {/* ================================================================ */}
        {/* RÉCAPITULATIF */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Stats row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                <MaterialCommunityIcons name="map-marker-distance" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{distance}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {t('ride.distance')}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#2196F3' + '15' }]}>
                <MaterialCommunityIcons name="clock-outline" size={22} color="#2196F3" />
              </View>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{duration}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {t('ride.duration')}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#4CAF50' + '15' }]}>
                <MaterialCommunityIcons name="cash" size={22} color="#4CAF50" />
              </View>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{price} DH</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {t('ride.fare')}
              </Text>
            </View>
          </View>

          {/* Trajet */}
          <View style={[styles.tripSummary, { borderTopColor: theme.colors.border }]}>
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: '#4CAF50' }]}>
                <View style={styles.tripDotInner} />
              </View>
              <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
                {pickup?.name || pickup?.address || t('ride.pickup')}
              </Text>
            </View>
            <View style={[styles.tripLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.tripPoint}>
              <View style={[styles.tripDot, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="flag-checkered" size={10} color="white" />
              </View>
              <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
                {destination?.name || destination?.address || t('ride.destination')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ================================================================ */}
        {/* NOTATION CONDUCTRICE */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.ratingCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('ride.rateYourDriver')}
          </Text>

          {/* Info conductrice */}
          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.driverInitial, { color: theme.colors.primary }]}>
                {driver?.firstName?.[0]?.toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {driver?.firstName || 'Conductrice'} {driver?.lastName?.[0] ? driver.lastName[0] + '.' : ''}
              </Text>
              <View style={styles.driverRatingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                <Text style={[styles.driverRating, { color: theme.colors.textSecondary }]}>
                  {driver?.rating || '4.9'} • {driver?.totalRides || 120} {t('ride.rides')}
                </Text>
              </View>
            </View>
          </View>

          {/* Étoiles */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star, index) => (
              <Animated.View
                key={star}
                style={{ transform: [{ scale: starAnims[index] }] }}
              >
                <TouchableOpacity
                  onPress={() => handleStarPress(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={48}
                    color={star <= rating ? '#FFD700' : theme.colors.border}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Label de notation */}
          <View style={styles.ratingLabelContainer}>
            <Text style={styles.ratingEmoji}>{getRatingLabel().emoji}</Text>
            <Text style={[styles.ratingLabel, { color: theme.colors.primary }]}>
              {getRatingLabel().label}
            </Text>
          </View>

          {/* Commentaire */}
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={t('ride.leaveComment')}
            placeholderTextColor={theme.colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {comment.length}/200
          </Text>
        </Animated.View>

        {/* ================================================================ */}
        {/* POURBOIRE */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.tipCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="hand-heart" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginLeft: 10, marginBottom: 0 }]}>
              {t('ride.addTip')}
            </Text>
          </View>

          <View style={styles.tipOptions}>
            {TIP_OPTIONS.map((tip) => (
              <TouchableOpacity
                key={tip.id}
                style={[
                  styles.tipButton,
                  {
                    backgroundColor: selectedTip === tip.id
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: selectedTip === tip.id
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleTipSelect(tip.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tipButtonText,
                    { color: selectedTip === tip.id ? 'white' : theme.colors.text },
                  ]}
                >
                  {tip.labelKey ? t(tip.labelKey) : `${tip.amount} DH`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input custom */}
          {selectedTip === 'custom' && (
            <View style={styles.customTipContainer}>
              <TextInput
                style={[
                  styles.customTipInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.primary,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                value={customTip}
                onChangeText={setCustomTip}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={[styles.customTipCurrency, { color: theme.colors.text }]}>DH</Text>
            </View>
          )}

          {/* Total avec pourboire */}
          {getTipAmount() > 0 && (
            <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
                  {t('ride.fare')}: {price} DH
                </Text>
                <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
                  {t('driver.tip')}: +{getTipAmount()} DH
                </Text>
              </View>
              <View style={styles.totalValueContainer}>
                <Text style={[styles.totalValueLabel, { color: theme.colors.textSecondary }]}>
                  {t('ride.total')}
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                  {getTotal()} DH
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ================================================================ */}
        {/* BOUTONS */}
        {/* ================================================================ */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF69B4', '#FF1493']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                  <Text style={styles.submitButtonText}>{t('ride.submitRating')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Actions secondaires */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleViewReceipt}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="receipt" size={20} color={theme.colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              {t('ride.viewReceipt')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShareTrip}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              {t('ride.shareTrip')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
            {t('common.skip')}
          </Text>
        </TouchableOpacity>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
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
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerModeBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
  },
  checkContainer: {
    marginBottom: 20,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  // Mode Badge
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

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 50,
  },
  tripSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  tripText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 14,
  },
  tripLine: {
    width: 2,
    height: 20,
    marginLeft: 9,
    marginVertical: 4,
  },

  // Rating Card
  ratingCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  driverDetails: {
    marginLeft: 14,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  driverRating: {
    fontSize: 13,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },

  // Tip Card
  tipCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  customTipInput: {
    width: 100,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  customTipCurrency: {
    fontSize: 20,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  totalValueContainer: {
    alignItems: 'flex-end',
  },
  totalValueLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Submit Button
  submitButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 18,
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
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 15,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default RideCompletedScreen;