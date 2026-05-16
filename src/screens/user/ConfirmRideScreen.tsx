/**
 * ============================================================================
 * GO WITH SALLY - CONFIRM RIDE SCREEN (v3.1)
 * ============================================================================
 * Écran de confirmation de course côté passagère
 * 
 * FONCTIONNALITÉS v3.1:
 * - Services Sally (sally_eco, sally_standard, sally_confort, sally_pool)
 * - Pricing flexible avec slider
 * - Affichage acceptance likelihood
 * - Modes de paiement depuis constants
 * - Intégration simulation mode
 * - Support surge pricing
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - FIX v3.1: Correction boucle de rendu infinie (useCallback + useRef + useMemo)
 * 
 * @module screens/user/ConfirmRideScreen
 * @version 3.1.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useAppSelector } from '../../store';

// API
import { rideAPI } from '../../services/api';

// Services
import { pricingService } from '../../services/pricingService';

// Constants
import { SERVICE_CONFIGS, PAYMENT_CONFIGS } from '../../constants/services';
import { SURGE_CONFIGS, LIKELIHOOD_CONFIGS, roundPrice } from '../../constants/pricing';
import { BADGE_CONFIGS } from '../../constants/badges';

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

const FILE_NAME = '[ConfirmRideScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

// Types locaux
type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';
type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

// Services disponibles (ordonnés par prix croissant)
const AVAILABLE_SERVICES: ServiceType[] = ['sally_eco', 'sally_standard', 'sally_confort', 'sally_pool'];

// Paiements disponibles
const AVAILABLE_PAYMENTS: PaymentMethod[] = ['cash', 'card', 'wallet'];

// ============================================================================
// STYLES DE CARTE (déplacés en haut pour useMemo)
// ============================================================================

const LIGHT_MAP_STYLE = `[
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "stylers": [{ "visibility": "on" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
]`;

const DARK_MAP_STYLE = `[
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "stylers": [{ "visibility": "on" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
]`;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ConfirmRideScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const { user } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // PARAMÈTRES DE LA ROUTE (MEMOIZED pour éviter re-renders)
  // ==========================================================================

  const pickup = useMemo(() => route.params?.pickup || {
    name: t('ride.currentLocation') || 'Ma position',
    address: 'Casablanca, Maroc',
    latitude: 33.5731,
    longitude: -7.5898,
  }, [route.params?.pickup, t]);

  const destination = useMemo(() => route.params?.destination || {
    name: 'Morocco Mall',
    address: 'Corniche, Casablanca',
    latitude: 33.5447,
    longitude: -7.6311,
  }, [route.params?.destination]);

  const initialService: ServiceType = route.params?.selectedService || 'sally_standard';

  // ==========================================================================
  // REFS POUR ÉVITER LES BOUCLES INFINIES
  // ==========================================================================

  const isInitializedRef = useRef<boolean>(false);
  const lastServiceRef = useRef<ServiceType>(initialService);
  const lastPriceRef = useRef<number>(0);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [selectedService, setSelectedService] = useState<ServiceType>(initialService);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Estimations
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  
  // Surge & Likelihood
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [surgeReason, setSurgeReason] = useState<string | null>(null);
  const [acceptanceLikelihood, setAcceptanceLikelihood] = useState<{
    level: string;
    percentage: number;
    emoji: string;
    color: string;
  }>({ level: 'high', percentage: 80, emoji: '⚡', color: '#3B82F6' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const likelihoodAnim = useRef(new Animated.Value(1)).current;

  // ==========================================================================
  // FONCTIONS UTILITAIRES (MEMOIZED)
  // ==========================================================================

  const calculateHaversineDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getSelectedServiceETA = useCallback((): number => {
    const serviceKey = selectedService as keyof typeof SERVICE_CONFIGS;
    const config = SERVICE_CONFIGS[serviceKey];
    return config?.estimatedWaitTime?.min || 3;
  }, [selectedService]);

  // ==========================================================================
  // CALCULS (MEMOIZED POUR ÉVITER BOUCLES INFINIES)
  // ==========================================================================

  const calculatePricing = useCallback((distanceKm: number, durationMin: number, service: ServiceType) => {
    if (distanceKm === 0) return;

    // Utiliser le pricingService
    const { estimate, surgeInfo } = pricingService.calculateEstimate({
      distanceKm,
      durationMinutes: durationMin,
      serviceType: service,
    });

    setSurgeMultiplier(surgeInfo.multiplier);
    setSurgeReason(surgeInfo.reason);
    setSuggestedPrice(estimate.suggestedPrice);
    setProposedPrice(estimate.suggestedPrice);
    setMinPrice(estimate.minPrice);
    setMaxPrice(estimate.maxPrice);

    // Mettre à jour la ref pour éviter les recalculs inutiles
    lastPriceRef.current = estimate.suggestedPrice;

    console.log(`${FILE_NAME} 💰 Prix: ${estimate.suggestedPrice} DH (min: ${estimate.minPrice}, max: ${estimate.maxPrice}) | Surge: ${surgeInfo.multiplier}x`);
  }, []);

  const updateLikelihood = useCallback((currentPrice: number, suggested: number) => {
    if (suggested === 0) return;
    
    const likelihood = pricingService.calculateAcceptanceLikelihood(currentPrice, suggested);
    setAcceptanceLikelihood(likelihood);

    // Animation du badge
    Animated.sequence([
      Animated.timing(likelihoodAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.spring(likelihoodAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [likelihoodAnim]);

  const calculateEstimates = useCallback(() => {
    // Calcul distance Haversine
    const dist = calculateHaversineDistance(
      pickup.latitude,
      pickup.longitude,
      destination.latitude,
      destination.longitude
    );

    const distRounded = parseFloat(dist.toFixed(1));
    const durationEst = Math.round(dist * 3.5); // ~3.5 min/km en ville

    setDistance(distRounded);
    setDuration(durationEst);

    console.log(`${FILE_NAME} 📊 Distance: ${distRounded} km | Durée: ${durationEst} min`);

    // Calculer le pricing immédiatement avec les nouvelles valeurs
    calculatePricing(distRounded, durationEst, selectedService);
  }, [pickup.latitude, pickup.longitude, destination.latitude, destination.longitude, calculateHaversineDistance, calculatePricing, selectedService]);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  // Log de démarrage et initialisation (une seule fois)
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      console.log(`${FILE_NAME} ════════════════════════════════════════`);
      console.log(`${FILE_NAME} 🚀 Initialisation`);
      console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
      console.log(`${FILE_NAME} 📍 Pickup: ${pickup.name}`);
      console.log(`${FILE_NAME} 🏁 Destination: ${destination.name}`);
      console.log(`${FILE_NAME} 🚗 Service initial: ${initialService}`);
      console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
      console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
      console.log(`${FILE_NAME} ════════════════════════════════════════`);

      // Calculer les estimations
      calculateEstimates();

      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [calculateEstimates, fadeAnim, slideAnim, pickup.name, destination.name, initialService, isDark, i18n.language]);

  // Recalculer quand le service change (seulement si vraiment changé)
  useEffect(() => {
    if (isInitializedRef.current && distance > 0 && selectedService !== lastServiceRef.current) {
      lastServiceRef.current = selectedService;
      calculatePricing(distance, duration, selectedService);
    }
  }, [selectedService, distance, duration, calculatePricing]);

  // Recalculer likelihood quand le prix proposé change (seulement si significatif)
  useEffect(() => {
    if (suggestedPrice > 0 && proposedPrice !== lastPriceRef.current) {
      lastPriceRef.current = proposedPrice;
      updateLikelihood(proposedPrice, suggestedPrice);
    }
  }, [proposedPrice, suggestedPrice, updateLikelihood]);

  // ==========================================================================
  // HANDLERS (MEMOIZED)
  // ==========================================================================

  const handlePriceChange = useCallback((value: number) => {
    const rounded = roundPrice(value);
    setProposedPrice(rounded);
  }, []);

  const handleQuickPrice = useCallback((type: 'min' | 'suggested' | 'max') => {
    switch (type) {
      case 'min':
        setProposedPrice(minPrice);
        break;
      case 'suggested':
        setProposedPrice(suggestedPrice);
        break;
      case 'max':
        setProposedPrice(maxPrice);
        break;
    }
  }, [minPrice, suggestedPrice, maxPrice]);

  const handleConfirmRide = useCallback(async () => {
    console.log(`${FILE_NAME} 🚗 Confirmation course`);
    console.log(`${FILE_NAME} Service: ${selectedService} | Paiement: ${selectedPayment} | Prix: ${proposedPrice} DH`);

    setIsLoading(true);

    try {
      // Appel API pour créer la demande de course
      const rideData = {
        pickup,
        destination,
        serviceType: selectedService,
        paymentMethod: selectedPayment,
        proposedPrice,
        estimatedPrice: suggestedPrice,
        estimatedDistance: distance,
        estimatedDuration: duration,
        surgeMultiplier,
      };

      const response = await rideAPI.requestRide(rideData);
      console.log(`${FILE_NAME} ✅ Course demandée:`, response?.data?.id);

      Toast.show({
        type: 'success',
        text1: t('ride.searchingDriver') || 'Recherche de conductrice...',
        text2: `${proposedPrice} DH • ${duration} min`,
      });

      navigation.navigate('SearchingDriver', {
        rideId: response?.data?.id,
        pickup,
        destination,
        serviceType: selectedService,
        paymentMethod: selectedPayment,
        price: proposedPrice,
        distance,
        duration,
        acceptanceLikelihood,
      });
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error') || 'Erreur',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedService, selectedPayment, proposedPrice, suggestedPrice, distance, duration, surgeMultiplier, pickup, destination, acceptanceLikelihood, navigation, t]);

  const handleEditLocation = useCallback((type: 'pickup' | 'destination') => {
    console.log(`${FILE_NAME} ✏️ Modifier ${type}`);
    navigation.navigate('SearchLocation', { type });
  }, [navigation]);

  const handleSelectService = useCallback((service: ServiceType) => {
    console.log(`${FILE_NAME} 🚗 Service: ${service}`);
    setSelectedService(service);
  }, []);

  const handleSelectPayment = useCallback((payment: PaymentMethod) => {
    console.log(`${FILE_NAME} 💳 Paiement: ${payment}`);
    setSelectedPayment(payment);
  }, []);

  const handleMapMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        console.log(`${FILE_NAME} 🗺️ Carte prête`);
      }
    } catch (e) {}
  }, []);

  // ==========================================================================
  // COMPOSANTS INTERNES (MEMOIZED)
  // ==========================================================================

  // Badge du mode (memoized)
  const ModeBadge = useMemo(() => {
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
  }, []);

  // Service Card Component (memoized avec useCallback)
  const renderServiceCard = useCallback(({ service }: { service: ServiceType }) => {
    const serviceKey = service as keyof typeof SERVICE_CONFIGS;
    const config = SERVICE_CONFIGS[serviceKey];
    const isSelected = selectedService === service;
    
    // Calculer le prix pour ce service
    const { estimate } = pricingService.calculateEstimate({
      distanceKm: distance || 1,
      durationMinutes: duration || 5,
      serviceType: service,
    });
    const price = estimate.suggestedPrice;

    // Vérifier si le service est verrouillé (nécessite un badge premium/elite)
    const isLocked = config.requiredBadge === 'premium' || config.requiredBadge === 'elite';

    return (
      <TouchableOpacity
        key={service}
        style={[
          styles.serviceCard,
          { backgroundColor: theme.colors.surface },
          isSelected && { borderColor: config.color, borderWidth: 2 },
          isLocked && styles.serviceCardLocked,
        ]}
        onPress={() => !isLocked && handleSelectService(service)}
        activeOpacity={isLocked ? 1 : 0.7}
        disabled={isLocked}
      >
        <View
          style={[
            styles.serviceIcon,
            { backgroundColor: isSelected ? config.color + '20' : theme.colors.background },
          ]}
        >
          <Text style={styles.serviceEmoji}>{config.emoji}</Text>
        </View>

        <View style={styles.serviceInfo}>
          <View style={styles.serviceNameRow}>
            <Text style={[styles.serviceName, { color: isLocked ? theme.colors.textSecondary : theme.colors.text }]}>
              {config.shortDescription.fr}
            </Text>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: config.color }]}>
                <MaterialCommunityIcons name="check" size={12} color="white" />
              </View>
            )}
            {isLocked && (
              <View style={[styles.lockedBadge, { backgroundColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="lock" size={12} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
          <Text style={[styles.serviceDesc, { color: theme.colors.textSecondary }]}>
            {config.estimatedWaitTime.min}-{config.estimatedWaitTime.max} min
          </Text>
        </View>

        <View style={styles.servicePriceContainer}>
          <Text style={[styles.servicePrice, { color: isLocked ? theme.colors.textSecondary : theme.colors.text }]}>
            {price}
          </Text>
          <Text style={[styles.serviceCurrency, { color: theme.colors.textSecondary }]}>DH</Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedService, distance, duration, theme.colors, handleSelectService]);

  // ==========================================================================
  // HTML GOOGLE MAPS (MEMOIZED)
  // ==========================================================================

  const mapHTML = useMemo(() => {
    const serviceKey = selectedService as keyof typeof SERVICE_CONFIGS;
    const primaryColor = SERVICE_CONFIGS[serviceKey]?.color || theme.colors.primary;
    const mapStyle = isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let directionsService;
    let directionsRenderer;
    
    function initMap() {
      const pickup = { lat: ${pickup.latitude}, lng: ${pickup.longitude} };
      const destination = { lat: ${destination.latitude}, lng: ${destination.longitude} };
      
      const center = {
        lat: (pickup.lat + destination.lat) / 2,
        lng: (pickup.lng + destination.lng) / 2
      };
      
      map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: ${mapStyle}
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "${primaryColor}",
          strokeWeight: 5,
          strokeOpacity: 0.9
        }
      });

      // SVG Pickup (vert)
      const pickupSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="3"/><circle cx="12" cy="12" r="4" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: pickup,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pickupSvg),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        },
        zIndex: 100
      });

      // SVG Destination (couleur du service)
      const destSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54"><path d="M22 0C10 0 0 10 0 22c0 16 22 32 22 32s22-16 22-32C44 10 34 0 22 0z" fill="${primaryColor}" stroke="white" stroke-width="3"/><circle cx="22" cy="20" r="9" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: destination,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(destSvg),
          scaledSize: new google.maps.Size(44, 54),
          anchor: new google.maps.Point(22, 54)
        },
        zIndex: 100
      });

      // Calculer l'itinéraire
      directionsService.route({
        origin: pickup,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
          
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        } else {
          // Fallback
          const path = new google.maps.Polyline({
            path: [pickup, destination],
            strokeColor: "${primaryColor}",
            strokeWeight: 4,
            strokeOpacity: 0.8,
            map: map
          });
          
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          map.fitBounds(bounds);
        }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"></script>
</body>
</html>
    `;
  }, [pickup.latitude, pickup.longitude, destination.latitude, destination.longitude, selectedService, theme.colors.primary, isDark]);

  // ==========================================================================
  // VALEURS DÉRIVÉES
  // ==========================================================================

  const serviceKey = selectedService as keyof typeof SERVICE_CONFIGS;
  const selectedServiceConfig = SERVICE_CONFIGS[serviceKey];
  const selectedPaymentKey = selectedPayment as keyof typeof PAYMENT_CONFIGS;
  const selectedPaymentConfig = PAYMENT_CONFIGS[selectedPaymentKey];

  // Récupérer le surge config si actif
  const surgeConfig = surgeReason ? SURGE_CONFIGS[surgeReason as keyof typeof SURGE_CONFIGS] : null;

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ================================================================== */}
      {/* CARTE GOOGLE MAPS */}
      {/* ================================================================== */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.map}
          onMessage={handleMapMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
          originWhitelist={['*']}
        />

        {!mapReady && (
          <View style={[styles.mapLoading, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Bouton retour */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface, top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color={theme.colors.text}
          />
          {ModeBadge}
        </TouchableOpacity>

        {/* Surge Banner */}
        {surgeMultiplier > 1 && surgeConfig && (
          <View style={[styles.surgeBanner, { top: insets.top + 10 }]}>
            <LinearGradient
              colors={[surgeConfig.color, surgeConfig.color + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.surgeBannerGradient}
            >
              <Text style={styles.surgeBannerEmoji}>{surgeConfig.icon}</Text>
              <Text style={styles.surgeBannerText}>
                {surgeConfig.name.fr} • {surgeMultiplier}x
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* ================================================================== */}
      {/* BOTTOM SHEET */}
      {/* ================================================================== */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* ============================================================ */}
          {/* ADRESSES */}
          {/* ============================================================ */}
          <View style={[styles.addressCard, { backgroundColor: theme.colors.surface }]}>
            {/* Pickup */}
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => handleEditLocation('pickup')}
              activeOpacity={0.7}
            >
              <View style={[styles.addressDot, { backgroundColor: '#4CAF50' }]}>
                <View style={styles.addressDotInner} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: theme.colors.textSecondary }]}>
                  {t('ride.pickup') || 'Départ'}
                </Text>
                <Text style={[styles.addressValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {pickup.name}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Ligne verticale */}
            <View style={styles.addressLineContainer}>
              <View style={[styles.addressLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Destination */}
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => handleEditLocation('destination')}
              activeOpacity={0.7}
            >
              <View style={[styles.addressDot, { backgroundColor: selectedServiceConfig.color }]}>
                <MaterialCommunityIcons name="flag-checkered" size={10} color="white" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: theme.colors.textSecondary }]}>
                  {t('ride.destination') || 'Destination'}
                </Text>
                <Text style={[styles.addressValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {destination.name}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* ESTIMATION */}
          {/* ============================================================ */}
          <View style={styles.estimationRow}>
            <View style={[styles.estimationItem, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={selectedServiceConfig.color} />
              <Text style={[styles.estimationValue, { color: theme.colors.text }]}>{distance} km</Text>
            </View>
            <View style={[styles.estimationItem, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
              <Text style={[styles.estimationValue, { color: theme.colors.text }]}>{duration} min</Text>
            </View>
            <View style={[styles.estimationItem, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="car-clock" size={20} color="#FF9800" />
              <Text style={[styles.estimationValue, { color: theme.colors.text }]}>{getSelectedServiceETA()} min</Text>
              <Text style={[styles.estimationLabel, { color: theme.colors.textSecondary }]}>ETA</Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SERVICES */}
          {/* ============================================================ */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('ride.chooseService') || 'Choisir un service'}
          </Text>

          {AVAILABLE_SERVICES.map((service) => renderServiceCard({ service }))}

          {/* ============================================================ */}
          {/* PRIX FLEXIBLE */}
          {/* ============================================================ */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
            {t('ride.proposePrice') || 'Proposer un prix'}
          </Text>

          {/* Prix proposé */}
          <View style={[styles.priceCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.priceHeader}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                {t('ride.yourPrice') || 'Votre prix'}
              </Text>
              <Animated.View 
                style={[
                  styles.likelihoodBadge, 
                  { 
                    backgroundColor: acceptanceLikelihood.color + '20',
                    transform: [{ scale: likelihoodAnim }],
                  }
                ]}
              >
                <Text style={styles.likelihoodEmoji}>{acceptanceLikelihood.emoji}</Text>
                <Text style={[styles.likelihoodText, { color: acceptanceLikelihood.color }]}>
                  {acceptanceLikelihood.percentage}%
                </Text>
              </Animated.View>
            </View>

            <View style={styles.priceDisplay}>
              <Text style={[styles.priceValue, { color: theme.colors.text }]}>{proposedPrice}</Text>
              <Text style={[styles.priceCurrency, { color: theme.colors.textSecondary }]}>DH</Text>
            </View>

            {/* Slider */}
            <Slider
              style={styles.priceSlider}
              minimumValue={minPrice}
              maximumValue={maxPrice}
              value={proposedPrice}
              onValueChange={handlePriceChange}
              minimumTrackTintColor={selectedServiceConfig.color}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={selectedServiceConfig.color}
              step={5}
            />

            {/* Quick prices */}
            <View style={styles.quickPrices}>
              <TouchableOpacity
                style={[
                  styles.quickPriceBtn,
                  { backgroundColor: proposedPrice === minPrice ? selectedServiceConfig.color : theme.colors.background },
                ]}
                onPress={() => handleQuickPrice('min')}
              >
                <Text style={[
                  styles.quickPriceText,
                  { color: proposedPrice === minPrice ? 'white' : theme.colors.textSecondary },
                ]}>
                  {minPrice} DH
                </Text>
                <Text style={[
                  styles.quickPriceLabel,
                  { color: proposedPrice === minPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textLight },
                ]}>
                  Min
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickPriceBtn,
                  styles.quickPriceBtnSuggested,
                  { backgroundColor: proposedPrice === suggestedPrice ? selectedServiceConfig.color : theme.colors.background },
                ]}
                onPress={() => handleQuickPrice('suggested')}
              >
                <Text style={[
                  styles.quickPriceText,
                  { color: proposedPrice === suggestedPrice ? 'white' : theme.colors.textSecondary },
                ]}>
                  {suggestedPrice} DH
                </Text>
                <Text style={[
                  styles.quickPriceLabel,
                  { color: proposedPrice === suggestedPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textLight },
                ]}>
                  ⭐ {t('ride.suggestedPrice') || 'Suggéré'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickPriceBtn,
                  { backgroundColor: proposedPrice === maxPrice ? selectedServiceConfig.color : theme.colors.background },
                ]}
                onPress={() => handleQuickPrice('max')}
              >
                <Text style={[
                  styles.quickPriceText,
                  { color: proposedPrice === maxPrice ? 'white' : theme.colors.textSecondary },
                ]}>
                  {maxPrice} DH
                </Text>
                <Text style={[
                  styles.quickPriceLabel,
                  { color: proposedPrice === maxPrice ? 'rgba(255,255,255,0.8)' : theme.colors.textLight },
                ]}>
                  Max
                </Text>
              </TouchableOpacity>
            </View>

            {/* Likelihood info */}
            <View style={[styles.likelihoodInfo, { backgroundColor: acceptanceLikelihood.color + '10' }]}>
              <MaterialCommunityIcons name="information-outline" size={16} color={acceptanceLikelihood.color} />
              <Text style={[styles.likelihoodInfoText, { color: acceptanceLikelihood.color }]}>
                {acceptanceLikelihood.level === 'very_high' && (t('ride.likelihoodVeryHigh') || 'Très forte chance d\'acceptation')}
                {acceptanceLikelihood.level === 'high' && (t('ride.likelihoodHigh') || 'Bonne chance d\'acceptation')}
                {acceptanceLikelihood.level === 'medium' && (t('ride.likelihoodMedium') || 'Chance moyenne d\'acceptation')}
                {acceptanceLikelihood.level === 'low' && (t('ride.likelihoodLow') || 'Faible chance d\'acceptation')}
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* MODE DE PAIEMENT */}
          {/* ============================================================ */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
            {t('ride.paymentMethod') || 'Mode de paiement'}
          </Text>

          <View style={styles.paymentRow}>
            {AVAILABLE_PAYMENTS.map((payment) => {
              const paymentKey = payment as keyof typeof PAYMENT_CONFIGS;
              const config = PAYMENT_CONFIGS[paymentKey];
              const isSelected = selectedPayment === payment;
              
              return (
                <TouchableOpacity
                  key={payment}
                  style={[
                    styles.paymentOption,
                    { backgroundColor: theme.colors.surface },
                    isSelected && { borderColor: config.color, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectPayment(payment)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.paymentIconContainer,
                      { backgroundColor: isSelected ? config.color + '20' : theme.colors.background },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={config.icon as any}
                      size={22}
                      color={isSelected ? config.color : theme.colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentOptionText,
                      { color: isSelected ? theme.colors.text : theme.colors.textSecondary },
                    ]}
                  >
                    {config.name.fr}
                  </Text>
                  {isSelected && (
                    <View style={[styles.paymentCheck, { backgroundColor: config.color }]}>
                      <MaterialCommunityIcons name="check" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ============================================================ */}
          {/* BOUTON CONFIRMER */}
          {/* ============================================================ */}
          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
            onPress={handleConfirmRide}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[selectedServiceConfig.color, selectedServiceConfig.color + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.confirmEmoji}>{selectedServiceConfig.emoji}</Text>
                  <Text style={styles.confirmButtonText}>
                    {t('ride.confirm') || 'Confirmer'} • {proposedPrice} DH
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Mode Footer */}
          <View style={styles.modeFooter}>
            <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
              {getModeEmoji()} {getModeDescription()}
            </Text>
          </View>

          {/* Espace en bas */}
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </Animated.View>
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

  // Carte
  mapContainer: {
    height: SCREEN_HEIGHT * 0.32,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bouton retour
  backButton: {
    position: 'absolute',
    left: 16,
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Mode Badge
  modeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  modeBadgeEmoji: {
    fontSize: 8,
  },
  modeBadgeText: {
    fontSize: 7,
    fontWeight: '700',
  },

  // Surge Banner
  surgeBanner: {
    position: 'absolute',
    right: 16,
  },
  surgeBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  surgeBannerEmoji: {
    fontSize: 14,
  },
  surgeBannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Adresses
  addressCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 14,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  addressLineContainer: {
    paddingLeft: 9,
    paddingVertical: 4,
  },
  addressLine: {
    width: 2,
    height: 24,
  },

  // Estimation
  estimationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  estimationItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
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
  estimationValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  estimationLabel: {
    fontSize: 10,
    marginTop: -2,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Service Card
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
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
    opacity: 0.6,
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
  serviceInfo: {
    flex: 1,
    marginLeft: 14,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceCurrency: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Price Card
  priceCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  likelihoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  likelihoodEmoji: {
    fontSize: 14,
  },
  likelihoodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
  },
  priceSlider: {
    width: '100%',
    height: 40,
  },
  quickPrices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  quickPriceBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickPriceBtnSuggested: {
    flex: 1.2,
  },
  quickPriceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickPriceLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  likelihoodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  likelihoodInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },

  // Payment
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
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
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Confirm Button
  confirmButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    gap: 10,
  },
  confirmEmoji: {
    fontSize: 22,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default ConfirmRideScreen;