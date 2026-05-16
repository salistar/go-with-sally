/**
 * ============================================================================
 * GO WITH SALLY - DRIVER RIDE COMPLETED SCREEN
 * ============================================================================
 * Écran de fin de course côté conductrice
 * 
 * Fonctionnalités:
 * - Récapitulatif des gains (tarif, commission, pourboire)
 * - Système de notation de la passagère
 * - Animation de succès
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/driver/DriverRideCompletedScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
  I18nManager,
  Dimensions,
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

const FILE_NAME = '[DriverRideCompletedScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// Taux de commission Sally
const COMMISSION_RATE = 0.15; // 15%

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const DriverRideCompletedScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Paramètres de la route
  const ride = route.params?.ride;
  const rideId = route.params?.rideId || ride?.id;

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 🚗 Ride ID: ${rideId}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // CALCULS DES GAINS
  // ==========================================================================

  const fareAmount = ride?.estimatedPrice || ride?.price || ride?.fare || 35;
  const commission = Math.round(fareAmount * COMMISSION_RATE);
  const netEarnings = fareAmount - commission;
  const tip = ride?.tip || 5;
  const totalEarnings = netEarnings + tip;
  const distance = ride?.finalDistance || ride?.distance || ride?.estimatedDistance || '5.2 km';
  const duration = ride?.duration || ride?.estimatedDuration || '18 min';

  console.log(`${FILE_NAME} 💰 Tarif: ${fareAmount} DH | Commission: ${commission} DH | Net: ${netEarnings} DH | Tip: ${tip} DH | Total: ${totalEarnings} DH`);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animation d'entrée séquencée
    Animated.sequence([
      // 1. Scale du check
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      // 2. Fade + Slide des cartes
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation des étoiles
    starAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        delay: 600 + index * 80,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Naviguer vers l'accueil conductrice
   */
  const navigateToHome = useCallback(() => {
    console.log(`${FILE_NAME} 🏠 Navigation vers DriverTabs`);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'DriverTabs' }],
      })
    );
  }, [navigation]);

  /**
   * Soumettre la notation
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} ⭐ Soumission notation: ${rating}/5`);

    setIsSubmitting(true);

    try {
      // Appel API
      if (rideId) {
        await rideAPI.ratePassenger(rideId, rating);
        console.log(`${FILE_NAME} ✅ Notation soumise`);
      }

      Toast.show({
        type: 'success',
        text1: t('driver.thankYou'),
        text2: t('driver.ratingSubmitted'),
      });

      // Navigation vers l'accueil
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
  }, [rating, rideId, navigateToHome, t]);

  /**
   * Skip notation
   */
  const handleSkip = useCallback((): void => {
    console.log(`${FILE_NAME} ⏭️ Skip notation`);
    navigateToHome();
  }, [navigateToHome]);

  /**
   * Sélectionner une étoile
   */
  const handleStarPress = useCallback((star: number) => {
    console.log(`${FILE_NAME} ⭐ Note sélectionnée: ${star}`);
    setRating(star);
  }, []);

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  // Badge du mode
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

  // Ligne de gain
  const EarningsRow = ({
    label,
    value,
    color,
    isTotal = false,
    prefix = '',
  }: {
    label: string;
    value: number | string;
    color?: string;
    isTotal?: boolean;
    prefix?: string;
  }) => (
    <View style={[styles.earningsRow, isTotal && styles.totalRow]}>
      <Text
        style={[
          isTotal ? styles.totalLabel : styles.earningsLabel,
          { color: isTotal ? theme.colors.text : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          isTotal ? styles.totalValue : styles.earningsValue,
          { color: color || theme.colors.text },
        ]}
      >
        {prefix}{value} DH
      </Text>
    </View>
  );

  // Stat Item
  const StatItem = ({
    icon,
    value,
    label,
  }: {
    icon: string;
    value: string;
    label: string;
  }) => (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={theme.colors.primary}
        />
      </View>
      <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  // Rating description
  const getRatingDescription = () => {
    switch (rating) {
      case 5: return t('driver.rating5', { defaultValue: 'Excellente passagère!' });
      case 4: return t('driver.rating4', { defaultValue: 'Bonne passagère' });
      case 3: return t('driver.rating3', { defaultValue: 'Passagère correcte' });
      case 2: return t('driver.rating2', { defaultValue: 'Peut mieux faire' });
      case 1: return t('driver.rating1', { defaultValue: 'Passagère difficile' });
      default: return '';
    }
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* HEADER SUCCÈS */}
        {/* ================================================================ */}
        <LinearGradient
          colors={['#4CAF50', '#45a049', '#388E3C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 30 }]}
        >
          {/* Mode Badge */}
          <View style={styles.headerTop}>
            <ModeBadge />
          </View>

          {/* Icône de succès */}
          <Animated.View
            style={[
              styles.successIcon,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.successIconInner}>
              <MaterialCommunityIcons name="check" size={50} color="#4CAF50" />
            </View>
          </Animated.View>

          <Text style={styles.headerTitle}>
            {t('driver.rideCompleted', { defaultValue: 'Course terminée!' })}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('driver.greatJob', { defaultValue: 'Excellent travail!' })} 🎉
          </Text>
        </LinearGradient>

        {/* ================================================================ */}
        {/* CARTE DES GAINS */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.earningsCard,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('driver.yourEarnings', { defaultValue: 'Vos gains' })}
            </Text>
          </View>

          {/* Tarif course */}
          <EarningsRow
            label={t('driver.fare', { defaultValue: 'Tarif course' })}
            value={fareAmount}
          />

          {/* Commission Sally */}
          <EarningsRow
            label={`${t('driver.sallyCommission', { defaultValue: 'Commission Sally' })} (15%)`}
            value={commission}
            color="#F44336"
            prefix="-"
          />

          {/* Pourboire */}
          {tip > 0 && (
            <EarningsRow
              label={t('driver.tip', { defaultValue: 'Pourboire' })}
              value={tip}
              color="#4CAF50"
              prefix="+"
            />
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Total */}
          <EarningsRow
            label={t('driver.totalEarnings', { defaultValue: 'Total gagné' })}
            value={totalEarnings}
            color="#4CAF50"
            isTotal
          />

          {/* Badge bonus */}
          {tip > 0 && (
            <View style={styles.bonusBadge}>
              <MaterialCommunityIcons name="gift" size={16} color="#FF69B4" />
              <Text style={styles.bonusBadgeText}>
                {t('driver.tipReceived', { defaultValue: 'Pourboire reçu!' })} 🎁
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ================================================================ */}
        {/* RÉSUMÉ COURSE */}
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
          <View style={styles.summaryRow}>
            <StatItem
              icon="clock-outline"
              value={typeof duration === 'string' ? duration : `${duration} min`}
              label={t('driver.duration', { defaultValue: 'Durée' })}
            />

            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

            <StatItem
              icon="map-marker-distance"
              value={typeof distance === 'string' ? distance : `${distance} km`}
              label={t('driver.distance', { defaultValue: 'Distance' })}
            />

            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

            <StatItem
              icon="wallet"
              value={`${Math.round(netEarnings / (parseFloat(String(distance)) || 5.2))}`}
              label="DH/km"
            />
          </View>
        </Animated.View>

        {/* ================================================================ */}
        {/* NOTATION PASSAGÈRE */}
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
            {t('driver.ratePassenger', { defaultValue: 'Noter la passagère' })}
          </Text>

          {/* Info passagère */}
          <View style={styles.passengerInfo}>
            <View style={[styles.passengerAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.passengerInitial, { color: theme.colors.primary }]}>
                {(ride?.passenger?.firstName || ride?.user?.firstName || 'P')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.passengerDetails}>
              <Text style={[styles.passengerName, { color: theme.colors.text }]}>
                {ride?.passenger?.firstName || ride?.user?.firstName || t('driver.passenger', { defaultValue: 'Passagère' })}
              </Text>
              <Text style={[styles.passengerSubtext, { color: theme.colors.textSecondary }]}>
                {t('driver.howWasYourRide', { defaultValue: 'Comment était cette course?' })}
              </Text>
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

          {/* Rating text */}
          <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
            {getRatingDescription()}
          </Text>
        </Animated.View>

        {/* ================================================================ */}
        {/* BOUTONS */}
        {/* ================================================================ */}
        <View style={styles.buttonsContainer}>
          {/* Bouton Soumettre */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF69B4', '#FF1493']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                  <Text style={styles.submitButtonText}>
                    {t('driver.submitAndContinue', { defaultValue: 'Envoyer et continuer' })}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton Passer */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              {t('common.skip', { defaultValue: 'Passer' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>

        {/* Espace en bas */}
        <View style={{ height: insets.bottom + 20 }} />
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
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successIconInner: {
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
        shadowRadius: 12,
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
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: 16,
    marginTop: -30,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalRow: {
    marginBottom: 0,
    marginTop: 4,
  },
  earningsLabel: {
    fontSize: 15,
  },
  earningsValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    gap: 6,
  },
  bonusBadgeText: {
    fontSize: 13,
    color: '#FF69B4',
    fontWeight: '600',
  },

  // Summary Card
  summaryCard: {
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
        elevation: 3,
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
  summaryIconContainer: {
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
        elevation: 3,
      },
    }),
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  passengerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  passengerDetails: {
    marginLeft: 14,
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  passengerSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
  },

  // Buttons
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  submitButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default DriverRideCompletedScreen;