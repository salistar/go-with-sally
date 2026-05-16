/**
 * ============================================================================
 * GO WITH SALLY - SERVICE SELECTION SCREEN
 * ============================================================================
 * Écran de sélection du type de service Sally
 * 
 * FONCTIONNALITÉS:
 * - Liste des 4 services Sally (eco, standard, confort, pool)
 * - Prix estimés dynamiques
 * - Temps d'attente estimé
 * - Badges conductrice
 * - Animation de sélection
 * - Support RTL
 * 
 * @module screens/user/ServiceSelectionScreen
 * @version 1.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useAppSelector } from '../../store';

// Services
import { pricingService } from '../../services/pricingService';

// Constants
import { SERVICE_CONFIGS } from '../../constants/services';
import { PRICING_CONFIG } from '../../constants/pricing';

// Types
import { ServiceType } from '../../types/services.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const FILE_NAME = '[ServiceSelectionScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// Ordre d'affichage des services
const SERVICE_ORDER: ServiceType[] = ['sally_eco', 'sally_standard', 'sally_confort', 'sally_pool'];

// ============================================================================
// TYPES
// ============================================================================

interface ServiceEstimate {
  price: number;
  minPrice: number;
  maxPrice: number;
  waitTime: number;
  available: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ServiceSelectionScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const currentLang = i18n.language as 'fr' | 'ar' | 'en';

  // ==========================================================================
  // REDUX
  // ==========================================================================

  const user = useAppSelector((state) => state.auth.user);
  const userBadge = user?.badge?.level || 'none';

  // ==========================================================================
  // ROUTE PARAMS
  // ==========================================================================

  const {
    pickup,
    destination,
    distance = 5,
    duration = 15,
  } = route.params || {};

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [selectedService, setSelectedService] = useState<ServiceType>('sally_standard');
  const [estimates, setEstimates] = useState<Record<ServiceType, ServiceEstimate>>({} as any);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(SERVICE_ORDER.map(() => new Animated.Value(50))).current;
  const scaleAnims = useRef(SERVICE_ORDER.map(() => new Animated.Value(1))).current;

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Initialisation | Distance: ${distance}km, Durée: ${duration}min`);
    calculateEstimates();
    startAnimations();
  }, []);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startAnimations = () => {
    // Fade in global
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Slide in séquentiel pour chaque service
    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const animateSelection = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ==========================================================================
  // CALCULS
  // ==========================================================================

  const calculateEstimates = () => {
    setIsLoading(true);
    
    const newEstimates: Record<ServiceType, ServiceEstimate> = {} as any;

    SERVICE_ORDER.forEach((serviceType) => {
      const { estimate, surgeInfo } = pricingService.calculateEstimate({
        distanceKm: distance,
        durationMinutes: duration,
        serviceType,
      });

      // Temps d'attente simulé (plus long pour confort, plus court pour standard)
      const baseWaitTime = {
        sally_eco: 8,
        sally_standard: 5,
        sally_confort: 7,
        sally_pool: 10,
      };

      newEstimates[serviceType] = {
        price: estimate.suggestedPrice,
        minPrice: estimate.minPrice,
        maxPrice: estimate.maxPrice,
        waitTime: baseWaitTime[serviceType] + Math.floor(Math.random() * 3),
        available: true,
      };
    });

    setEstimates(newEstimates);
    setIsLoading(false);
    
    console.log(`${FILE_NAME} 💰 Estimations calculées`);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSelectService = (serviceType: ServiceType, index: number) => {
    // Vérifier si le service nécessite un badge
    const config = SERVICE_CONFIGS[serviceType];
    if (config.requiredBadge && userBadge === 'none') {
      // TODO: Afficher modal d'info sur les badges
      console.log(`${FILE_NAME} ⚠️ Badge requis pour ${serviceType}`);
    }

    setSelectedService(serviceType);
    animateSelection(index);
  };

  const handleConfirm = () => {
    const estimate = estimates[selectedService];
    
    console.log(`${FILE_NAME} ✅ Service sélectionné: ${selectedService} | Prix: ${estimate?.price} DH`);

    navigation.navigate('ConfirmRide', {
      pickup,
      destination,
      distance,
      duration,
      serviceType: selectedService,
      suggestedPrice: estimate?.price,
      minPrice: estimate?.minPrice,
      maxPrice: estimate?.maxPrice,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderServiceCard = (serviceType: ServiceType, index: number) => {
    const config = SERVICE_CONFIGS[serviceType];
    const estimate = estimates[serviceType];
    const isSelected = selectedService === serviceType;
    const isLocked = config.requiredBadge && userBadge === 'none';

    return (
      <Animated.View
        key={serviceType}
        style={[
          styles.serviceCardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnims[index] },
              { scale: scaleAnims[index] },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.serviceCard,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: isSelected ? config.color : theme.colors.border,
              borderWidth: isSelected ? 2 : 1,
            },
            isLocked && styles.serviceCardLocked,
          ]}
          onPress={() => handleSelectService(serviceType, index)}
          activeOpacity={0.7}
          disabled={isLocked}
        >
          {/* Badge Premium/Elite */}
          {config.requiredBadge && (
            <View style={[styles.premiumBadge, { backgroundColor: config.color }]}>
              <MaterialCommunityIcons name="crown" size={10} color="white" />
              <Text style={styles.premiumBadgeText}>
                {config.requiredBadge === 'premium' ? 'PREMIUM' : 'ELITE'}
              </Text>
            </View>
          )}

          {/* Locked Overlay */}
          {isLocked && (
            <View style={styles.lockedOverlay}>
              <MaterialCommunityIcons name="lock" size={24} color={theme.colors.textLight} />
            </View>
          )}

          {/* Selection Indicator */}
          {isSelected && (
            <View style={[styles.selectionIndicator, { backgroundColor: config.color }]}>
              <MaterialCommunityIcons name="check" size={16} color="white" />
            </View>
          )}

          <View style={styles.serviceContent}>
            {/* Left: Icon & Info */}
            <View style={styles.serviceLeft}>
              <View style={[styles.serviceIcon, { backgroundColor: config.color + '20' }]}>
                <Text style={styles.serviceEmoji}>{config.emoji}</Text>
              </View>
              
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                  {config.name[currentLang]}
                </Text>
                <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {config.description[currentLang]}
                </Text>
                
                {/* Features Tags */}
                <View style={styles.featureTags}>
                  {config.features.slice(0, 2).map((feature, i) => (
                    <View 
                      key={i} 
                      style={[styles.featureTag, { backgroundColor: config.color + '15' }]}
                    >
                      <Text style={[styles.featureTagText, { color: config.color }]}>
                        {feature[currentLang]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Right: Price & Wait Time */}
            <View style={styles.serviceRight}>
              <Text style={[styles.servicePrice, { color: theme.colors.text }]}>
                {estimate?.price || '--'} <Text style={styles.serviceCurrency}>DH</Text>
              </Text>
              
              <View style={styles.waitTimeContainer}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={12} 
                  color={theme.colors.textSecondary} 
                />
                <Text style={[styles.waitTimeText, { color: theme.colors.textSecondary }]}>
                  ~{estimate?.waitTime || '--'} min
                </Text>
              </View>
            </View>
          </View>

          {/* Capacity Info */}
          <View style={[styles.capacityBar, { backgroundColor: theme.colors.background }]}>
            <View style={styles.capacityItem}>
              <MaterialCommunityIcons name="account" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.capacityText, { color: theme.colors.textSecondary }]}>
                {config.capacity.max} {t('services.passengers') || 'passagères'}
              </Text>
            </View>
            
            {serviceType === 'sally_pool' && (
              <View style={styles.capacityItem}>
                <MaterialCommunityIcons name="account-group" size={14} color={config.color} />
                <Text style={[styles.capacityText, { color: config.color }]}>
                  {t('services.shared') || 'Partagé'}
                </Text>
              </View>
            )}
            
            {config.requiredBadge && (
              <View style={styles.capacityItem}>
                <MaterialCommunityIcons name="shield-check" size={14} color={config.color} />
                <Text style={[styles.capacityText, { color: config.color }]}>
                  {t('services.verified') || 'Conductrices vérifiées'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const selectedConfig = SERVICE_CONFIGS[selectedService];
  const selectedEstimate = estimates[selectedService];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isRTL ? 'chevron-right' : 'chevron-left'} 
            size={28} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('services.selectService') || 'Choisir un service'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {distance} km • {duration} min
          </Text>
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Route Summary */}
      <View style={[styles.routeSummary, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
          <Text 
            style={[styles.routeText, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {pickup?.address || 'Point de départ'}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
          <Text 
            style={[styles.routeText, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {destination?.address || 'Destination'}
          </Text>
        </View>
      </View>

      {/* Services List */}
      <ScrollView 
        style={styles.servicesList}
        contentContainerStyle={styles.servicesContent}
        showsVerticalScrollIndicator={false}
      >
        {SERVICE_ORDER.map((serviceType, index) => renderServiceCard(serviceType, index))}
        
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('services.priceInfo') || 'Les prix sont des estimations. Vous pourrez ajuster votre offre à l\'écran suivant.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Confirmation */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.selectedSummary}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedEmoji}>{selectedConfig.emoji}</Text>
            <View>
              <Text style={[styles.selectedName, { color: theme.colors.text }]}>
                {selectedConfig.name[currentLang]}
              </Text>
              <Text style={[styles.selectedPrice, { color: theme.colors.textSecondary }]}>
                {selectedEstimate?.minPrice} - {selectedEstimate?.maxPrice} DH
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[selectedConfig.color, selectedConfig.color + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Text style={styles.confirmText}>
              {t('services.continue') || 'Continuer'}
            </Text>
            <MaterialCommunityIcons 
              name={isRTL ? 'arrow-left' : 'arrow-right'} 
              size={20} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Route Summary
  routeSummary: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
  },

  // Services List
  servicesList: {
    flex: 1,
  },
  servicesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Service Card
  serviceCardContainer: {
    marginBottom: 12,
  },
  serviceCard: {
    borderRadius: 18,
    overflow: 'hidden',
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
  serviceCardLocked: {
    opacity: 0.7,
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    gap: 4,
    zIndex: 10,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 26,
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  featureTags: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  serviceCurrency: {
    fontSize: 14,
    fontWeight: '600',
  },
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  waitTimeText: {
    fontSize: 12,
  },
  capacityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 16,
  },
  capacityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 11,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  selectedSummary: {
    marginBottom: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 28,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPrice: {
    fontSize: 13,
    marginTop: 2,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 8,
  },
  confirmText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default ServiceSelectionScreen;