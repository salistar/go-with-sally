/**
 * ============================================================================
 * GO WITH SALLY - PRICE PROPOSAL SCREEN
 * ============================================================================
 * Écran dédié à la proposition de prix avec slider et likelihood
 * Peut être utilisé comme modal ou écran standalone
 * 
 * @module screens/user/PriceProposalScreen
 * @version 1.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Services
import { pricingService } from '../../services/pricingService';

// Constants
import { SERVICE_CONFIGS } from '../../constants/services';
import { 
  PRICING_CONFIG,
  LIKELIHOOD_CONFIGS,
  roundPrice,
  LikelihoodLevel,
} from '../../constants/pricing';

// ============================================================================
// CONSTANTS
// ============================================================================

const FILE_NAME = '[PriceProposalScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const PriceProposalScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // ==========================================================================
  // PARAMÈTRES DE LA ROUTE
  // ==========================================================================

  const {
    serviceType = 'sally_standard' as ServiceType,
    suggestedPrice: initialSuggested = 30,
    minPrice: initialMin = 20,
    maxPrice: initialMax = 45,
    distance = 5,
    duration = 15,
    onPriceSelected,
  } = route.params || {};

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [proposedPrice, setProposedPrice] = useState<number>(initialSuggested);
  const [suggestedPrice] = useState<number>(initialSuggested);
  const [minPrice] = useState<number>(initialMin);
  const [maxPrice] = useState<number>(initialMax);
  const [likelihood, setLikelihood] = useState<{
    level: LikelihoodLevel;
    percentage: number;
    emoji: string;
    color: string;
  }>({
    level: 'high',
    percentage: 80,
    emoji: '⚡',
    color: '#84CC16',
  });

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} Service: ${serviceType} | Suggéré: ${suggestedPrice} DH`);
    
    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animation de pulsation
    startPulseAnimation();
  }, []);

  // Mettre à jour likelihood quand le prix change
  useEffect(() => {
    updateLikelihood();
  }, [proposedPrice]);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
  };

  const animateScale = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ==========================================================================
  // CALCULS
  // ==========================================================================

  const updateLikelihood = () => {
    const result = pricingService.calculateAcceptanceLikelihood(proposedPrice, suggestedPrice);
    setLikelihood({
      level: result.level,
      percentage: result.percentage,
      emoji: result.emoji,
      color: result.color,
    });
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handlePriceChange = (value: number) => {
    const rounded = roundPrice(value);
    if (rounded !== proposedPrice) {
      setProposedPrice(rounded);
      Vibration.vibrate(10);
    }
  };

  const handleQuickPrice = (type: 'min' | 'suggested' | 'max') => {
    let newPrice: number;
    switch (type) {
      case 'min':
        newPrice = minPrice;
        break;
      case 'suggested':
        newPrice = suggestedPrice;
        break;
      case 'max':
        newPrice = maxPrice;
        break;
    }
    setProposedPrice(newPrice);
    animateScale();
    Vibration.vibrate(20);
  };

  const handleIncrement = () => {
    const newPrice = Math.min(proposedPrice + PRICING_CONFIG.priceStep, maxPrice);
    setProposedPrice(newPrice);
    animateScale();
    Vibration.vibrate(10);
  };

  const handleDecrement = () => {
    const newPrice = Math.max(proposedPrice - PRICING_CONFIG.priceStep, minPrice);
    setProposedPrice(newPrice);
    animateScale();
    Vibration.vibrate(10);
  };

  const handleConfirm = () => {
    console.log(`${FILE_NAME} ✅ Prix confirmé: ${proposedPrice} DH`);
    
    if (onPriceSelected) {
      onPriceSelected(proposedPrice);
    }
    
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const serviceKey = serviceType as keyof typeof SERVICE_CONFIGS;
  const serviceConfig = SERVICE_CONFIGS[serviceKey];
  const serviceColor = serviceConfig?.color || '#3B82F6';

  const getLikelihoodMessage = (): string => {
    switch (likelihood.level) {
      case 'very_high':
        return t('price.likelihoodVeryHigh') || 'Acceptation quasi instantanée !';
      case 'high':
        return t('price.likelihoodHigh') || 'Très bonne chance d\'acceptation';
      case 'medium':
        return t('price.likelihoodMedium') || 'Chance moyenne, peut prendre du temps';
      case 'low':
        return t('price.likelihoodLow') || 'Prix bas, peu de conductrices accepteront';
      default:
        return '';
    }
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('price.proposePrice') || 'Proposer un prix'}
        </Text>
        
        <View style={{ width: 44 }} />
      </View>

      {/* Service Info */}
      <View style={[styles.serviceInfo, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.serviceIcon, { backgroundColor: serviceColor + '20' }]}>
          <Text style={styles.serviceEmoji}>{serviceConfig?.emoji || '🚗'}</Text>
        </View>
        <View style={styles.serviceDetails}>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>
            {serviceConfig?.name?.fr || 'Sally Standard'}
          </Text>
          <Text style={[styles.serviceRoute, { color: theme.colors.textSecondary }]}>
            {distance} km • {duration} min
          </Text>
        </View>
      </View>

      {/* Main Price Display */}
      <View style={styles.priceSection}>
        {/* Likelihood Badge */}
        <Animated.View 
          style={[
            styles.likelihoodBadge, 
            { 
              backgroundColor: likelihood.color + '20',
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          <Text style={styles.likelihoodEmoji}>{likelihood.emoji}</Text>
          <Text style={[styles.likelihoodPercentage, { color: likelihood.color }]}>
            {likelihood.percentage}%
          </Text>
          <Text style={[styles.likelihoodLabel, { color: likelihood.color }]}>
            {t('price.acceptanceChance') || 'd\'acceptation'}
          </Text>
        </Animated.View>

        {/* Price Display with +/- buttons */}
        <View style={styles.priceControls}>
          <TouchableOpacity
            style={[
              styles.priceButton,
              { backgroundColor: theme.colors.surface },
              proposedPrice <= minPrice && styles.priceButtonDisabled,
            ]}
            onPress={handleDecrement}
            disabled={proposedPrice <= minPrice}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="minus" 
              size={28} 
              color={proposedPrice <= minPrice ? theme.colors.border : serviceColor} 
            />
          </TouchableOpacity>

          <Animated.View style={[styles.priceDisplay, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={[styles.priceValue, { color: theme.colors.text }]}>
              {proposedPrice}
            </Text>
            <Text style={[styles.priceCurrency, { color: theme.colors.textSecondary }]}>
              {PRICING_CONFIG.currencySymbol}
            </Text>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.priceButton,
              { backgroundColor: theme.colors.surface },
              proposedPrice >= maxPrice && styles.priceButtonDisabled,
            ]}
            onPress={handleIncrement}
            disabled={proposedPrice >= maxPrice}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="plus" 
              size={28} 
              color={proposedPrice >= maxPrice ? theme.colors.border : serviceColor} 
            />
          </TouchableOpacity>
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
            {minPrice} DH
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={minPrice}
            maximumValue={maxPrice}
            value={proposedPrice}
            onValueChange={handlePriceChange}
            minimumTrackTintColor={serviceColor}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={serviceColor}
            step={PRICING_CONFIG.priceStep}
          />
          <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
            {maxPrice} DH
          </Text>
        </View>

        {/* Quick Price Buttons */}
        <View style={styles.quickPrices}>
          <TouchableOpacity
            style={[
              styles.quickPriceBtn,
              { 
                backgroundColor: proposedPrice === minPrice ? serviceColor : theme.colors.surface,
                borderColor: serviceColor,
              },
            ]}
            onPress={() => handleQuickPrice('min')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.quickPriceValue,
              { color: proposedPrice === minPrice ? 'white' : theme.colors.text },
            ]}>
              {minPrice} DH
            </Text>
            <Text style={[
              styles.quickPriceLabel,
              { color: proposedPrice === minPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
            ]}>
              🐢 Minimum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickPriceBtn,
              styles.quickPriceBtnSuggested,
              { 
                backgroundColor: proposedPrice === suggestedPrice ? serviceColor : theme.colors.surface,
                borderColor: serviceColor,
              },
            ]}
            onPress={() => handleQuickPrice('suggested')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.quickPriceValue,
              { color: proposedPrice === suggestedPrice ? 'white' : theme.colors.text },
            ]}>
              {suggestedPrice} DH
            </Text>
            <Text style={[
              styles.quickPriceLabel,
              { color: proposedPrice === suggestedPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
            ]}>
              ⭐ Suggéré
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickPriceBtn,
              { 
                backgroundColor: proposedPrice === maxPrice ? serviceColor : theme.colors.surface,
                borderColor: serviceColor,
              },
            ]}
            onPress={() => handleQuickPrice('max')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.quickPriceValue,
              { color: proposedPrice === maxPrice ? 'white' : theme.colors.text },
            ]}>
              {maxPrice} DH
            </Text>
            <Text style={[
              styles.quickPriceLabel,
              { color: proposedPrice === maxPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
            ]}>
              🚀 Rapide
            </Text>
          </TouchableOpacity>
        </View>

        {/* Likelihood Message */}
        <View style={[styles.likelihoodMessage, { backgroundColor: likelihood.color + '10' }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={likelihood.color} />
          <Text style={[styles.likelihoodMessageText, { color: likelihood.color }]}>
            {getLikelihoodMessage()}
          </Text>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[serviceColor, serviceColor + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <MaterialCommunityIcons name="check" size={24} color="white" />
            <Text style={styles.confirmText}>
              {t('price.confirm') || 'Confirmer'} {proposedPrice} DH
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tip */}
        <Text style={[styles.tipText, { color: theme.colors.textLight }]}>
          💡 {t('price.tip') || 'Un prix plus élevé = acceptation plus rapide'}
        </Text>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Service Info
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
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
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceDetails: {
    marginLeft: 14,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceRoute: {
    fontSize: 13,
    marginTop: 2,
  },

  // Price Section
  priceSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  // Likelihood Badge
  likelihoodBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    marginBottom: 30,
  },
  likelihoodEmoji: {
    fontSize: 20,
  },
  likelihoodPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  likelihoodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Price Controls
  priceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  priceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  priceButtonDisabled: {
    opacity: 0.5,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '600',
  },

  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 50,
    textAlign: 'center',
  },

  // Quick Prices
  quickPrices: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickPriceBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
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
  quickPriceBtnSuggested: {
    flex: 1.2,
  },
  quickPriceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickPriceLabel: {
    fontSize: 11,
    marginTop: 4,
  },

  // Likelihood Message
  likelihoodMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  likelihoodMessageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
  },
  confirmButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    gap: 10,
  },
  confirmText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default PriceProposalScreen;