/**
 * ============================================================================
 * GO WITH SALLY - INCOMING RIDE SCREEN
 * ============================================================================
 * Écran de demande de course entrante pour les conductrices
 * 
 * Fonctionnalités:
 * - Carte Google Maps avec itinéraire prévisualisé
 * - Timer de réponse avec animation
 * - Infos passagère (nom, rating, paiement)
 * - Trajet (pickup → destination)
 * - Stats (distance, durée, prix)
 * - Boutons Accepter/Refuser
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * 
 * @module screens/driver/IncomingRideScreen
 * @version 2.0.0
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
  Easing,
  Vibration,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { driverAPI } from '../../services/api';

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

const FILE_NAME = '[IncomingRideScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;
const RESPONSE_TIMEOUT = 30; // Secondes pour répondre

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const IncomingRideScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // ==========================================================================
  // PARAMÈTRES DE LA ROUTE
  // ==========================================================================

  const request = route.params?.request || {
    id: 'ride_001',
    passenger: {
      id: 'user_001',
      firstName: 'Salma',
      lastName: 'Benani',
      phone: '+212600000000',
      rating: 4.8,
      totalRides: 23,
      avatar: null,
    },
    pickup: {
      name: 'Morocco Mall',
      address: 'Corniche, Casablanca',
      latitude: 33.5447,
      longitude: -7.6311,
    },
    destination: {
      name: 'Twin Center',
      address: 'Maarif, Casablanca',
      latitude: 33.5883,
      longitude: -7.6192,
    },
    estimatedPrice: 35,
    estimatedDistance: '5.2 km',
    estimatedDuration: '15 min',
    paymentMethod: 'cash',
    rideType: 'standard',
  };

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🚗 Request ID: ${request.id}`);
    console.log(`${FILE_NAME} 👤 Passagère: ${request.passenger.firstName}`);
    console.log(`${FILE_NAME} 📍 Pickup: ${request.pickup.name}`);
    console.log(`${FILE_NAME} 🏁 Destination: ${request.destination.name}`);
    console.log(`${FILE_NAME} 💰 Prix: ${request.estimatedPrice} DH`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [timeLeft, setTimeLeft] = useState<number>(RESPONSE_TIMEOUT);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isDeclining, setIsDeclining] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Vibration d'alerte
    Vibration.vibrate([500, 200, 500, 200, 500]);

    // Animation slide up
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation pulse du timer
    startPulseAnimation();

    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: RESPONSE_TIMEOUT * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
      if (timerRef.current) clearInterval(timerRef.current);
      Vibration.cancel();
    };
  }, []);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleTimeout = useCallback(() => {
    console.log(`${FILE_NAME} ⏰ Temps écoulé - Demande expirée`);
    if (timerRef.current) clearInterval(timerRef.current);

    Toast.show({
      type: 'error',
      text1: t('driver.requestExpired'),
      text2: t('driver.didNotRespond'),
    });

    navigation.goBack();
  }, [navigation, t]);

  const handleAccept = async () => {
    console.log(`${FILE_NAME} ✅ Acceptation de la course`);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAccepting(true);
    Vibration.cancel();

    try {
      // Appel API
      await driverAPI.acceptRide(request.id);
      console.log(`${FILE_NAME} ✅ Course acceptée avec succès`);

      Toast.show({
        type: 'success',
        text1: t('driver.rideAccepted') + ' 🎉',
        text2: t('driver.headToPickup'),
      });

      // Navigation vers l'écran de navigation au pickup
      navigation.replace('NavigateToPickup', {
        ride: {
          id: request.id,
          passenger: request.passenger,
          pickup: request.pickup,
          destination: request.destination,
          estimatedPrice: request.estimatedPrice,
          paymentMethod: request.paymentMethod,
        },
      });
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur acceptation:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    console.log(`${FILE_NAME} ❌ Refus de la course`);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsDeclining(true);
    Vibration.cancel();

    try {
      // Appel API
      await driverAPI.declineRide(request.id);
      console.log(`${FILE_NAME} ✅ Course refusée`);

      Toast.show({
        type: 'info',
        text1: t('driver.rideDeclined'),
      });

      navigation.goBack();
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur refus:`, error.message);
      // On navigue quand même en cas d'erreur
      navigation.goBack();
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        console.log(`${FILE_NAME} 🗺️ Carte prête`);
      }
    } catch (error) {
      // Ignorer
    }
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const timerProgress = timeLeft / RESPONSE_TIMEOUT;
  const timerColor = timerProgress > 0.3 ? '#4CAF50' : timerProgress > 0.15 ? '#FF9800' : '#F44336';
  const isUrgent = timeLeft <= 10;

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

  // Stat Box
  const StatBox = ({
    icon,
    value,
    color,
  }: {
    icon: string;
    value: string;
    color: string;
  }) => (
    <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );

  // ==========================================================================
  // HTML GOOGLE MAPS
  // ==========================================================================

  const generateMapHTML = () => {
    const primaryColor = theme.colors.primary;
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
    const primaryColor = "${primaryColor}";
    
    function initMap() {
      const pickup = { lat: ${request.pickup.latitude}, lng: ${request.pickup.longitude} };
      const destination = { lat: ${request.destination.latitude}, lng: ${request.destination.longitude} };
      
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
          strokeColor: primaryColor,
          strokeWeight: 5,
          strokeOpacity: 0.9
        }
      });

      // SVG Marqueur pickup (vert)
      const pickupSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#4CAF50" stroke="white" stroke-width="3"/><circle cx="20" cy="18" r="8" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: pickup,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pickupSvg),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        zIndex: 100
      });

      // SVG Marqueur destination (rose)
      const destSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><circle cx="20" cy="18" r="8" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: destination,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(destSvg),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        zIndex: 100
      });

      // Calculer et afficher l'itinéraire
      directionsService.route({
        origin: pickup,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
          
          // Ajuster la vue pour montrer tout l'itinéraire
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          map.fitBounds(bounds, { top: 100, right: 60, bottom: 380, left: 60 });
        }
      });

      // Notifier React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"></script>
</body>
</html>
    `;
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* ================================================================== */}
      {/* CARTE GOOGLE MAPS */}
      {/* ================================================================== */}
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        onMessage={handleWebViewMessage}
        originWhitelist={['*']}
      />

      {/* ================================================================== */}
      {/* TIMER HEADER */}
      {/* ================================================================== */}
      <Animated.View
        style={[
          styles.timerHeader,
          { top: insets.top + 20, opacity: fadeAnim },
        ]}
      >
        {/* Mode Badge */}
        <ModeBadge />

        {/* Timer Circle */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View
            style={[
              styles.timerCircle,
              { borderColor: timerColor, backgroundColor: timerColor + '10' },
            ]}
          >
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
            <Text style={[styles.timerUnit, { color: timerColor }]}>sec</Text>
          </View>
        </Animated.View>

        {/* Label */}
        <View style={styles.timerLabelContainer}>
          <MaterialCommunityIcons
            name={isUrgent ? 'alert-circle' : 'clock-outline'}
            size={16}
            color={timerColor}
          />
          <Text style={[styles.timerLabel, { color: theme.colors.text }]}>
            {isUrgent ? t('driver.hurryUp') : t('driver.respondWithin')}
          </Text>
        </View>
      </Animated.View>

      {/* ================================================================== */}
      {/* PROGRESS BAR */}
      {/* ================================================================== */}
      <View style={[styles.progressBarContainer, { top: insets.top + 140 }]}>
        <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: timerColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* ================================================================== */}
      {/* BOTTOM SHEET */}
      {/* ================================================================== */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* Titre */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('driver.newRideRequest')}
          </Text>
          <View style={[styles.newBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.newBadgeText}>{t('driver.new')}</Text>
          </View>
        </View>

        {/* Info passagère */}
        <View style={[styles.passengerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.passengerAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.passengerInitial, { color: theme.colors.primary }]}>
              {request.passenger.firstName[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={[styles.passengerName, { color: theme.colors.text }]}>
              {request.passenger.firstName} {request.passenger.lastName?.charAt(0)}.
            </Text>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                {request.passenger.rating}
              </Text>
              <Text style={[styles.ridesText, { color: theme.colors.textSecondary }]}>
                • {request.passenger.totalRides} {t('driver.rides')}
              </Text>
            </View>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: theme.colors.primary + '10' }]}>
            <MaterialCommunityIcons
              name={request.paymentMethod === 'cash' ? 'cash' : 'credit-card'}
              size={20}
              color={request.paymentMethod === 'cash' ? '#4CAF50' : theme.colors.primary}
            />
            <Text style={[styles.paymentText, { color: theme.colors.textSecondary }]}>
              {request.paymentMethod === 'cash' ? t('payment.cash') : t('payment.card')}
            </Text>
          </View>
        </View>

        {/* Trajet */}
        <View style={[styles.tripCard, { backgroundColor: theme.colors.surface }]}>
          {/* Pickup */}
          <View style={styles.tripRow}>
            <View style={[styles.tripDot, { backgroundColor: '#4CAF50' }]}>
              <View style={styles.tripDotInner} />
            </View>
            <View style={styles.tripInfo}>
              <Text style={[styles.tripLabel, { color: theme.colors.textSecondary }]}>
                {t('driver.pickup').toUpperCase()}
              </Text>
              <Text style={[styles.tripName, { color: theme.colors.text }]} numberOfLines={1}>
                {request.pickup.name}
              </Text>
              <Text style={[styles.tripAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {request.pickup.address}
              </Text>
            </View>
          </View>

          {/* Ligne de connexion */}
          <View style={styles.tripLineContainer}>
            <View style={[styles.tripLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Destination */}
          <View style={styles.tripRow}>
            <View style={[styles.tripDot, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="flag-checkered" size={12} color="white" />
            </View>
            <View style={styles.tripInfo}>
              <Text style={[styles.tripLabel, { color: theme.colors.textSecondary }]}>
                {t('driver.destination').toUpperCase()}
              </Text>
              <Text style={[styles.tripName, { color: theme.colors.text }]} numberOfLines={1}>
                {request.destination.name}
              </Text>
              <Text style={[styles.tripAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {request.destination.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <StatBox
            icon="map-marker-distance"
            value={request.estimatedDistance}
            color={theme.colors.primary}
          />
          <StatBox
            icon="clock-outline"
            value={request.estimatedDuration}
            color="#2196F3"
          />
          <StatBox
            icon="cash"
            value={`${request.estimatedPrice} DH`}
            color="#4CAF50"
          />
        </View>

        {/* Boutons */}
        <View style={styles.buttonsRow}>
          {/* Bouton Refuser */}
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: '#F44336' }]}
            onPress={handleDecline}
            disabled={isDeclining || isAccepting}
            activeOpacity={0.7}
          >
            {isDeclining ? (
              <ActivityIndicator color="#F44336" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="close" size={24} color="#F44336" />
                <Text style={styles.declineText}>{t('driver.decline')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bouton Accepter */}
          <TouchableOpacity
            style={[styles.acceptButton, (isDeclining || isAccepting) && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={isDeclining || isAccepting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptGradient}
            >
              {isAccepting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={24} color="white" />
                  <Text style={styles.acceptText}>{t('driver.accept')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// STYLES DE CARTE
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
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Carte
  map: {
    flex: 1,
  },

  // Timer Header
  timerHeader: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    marginTop: 10,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
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
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  timerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
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
  timerLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Progress Bar
  progressBarContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
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

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  newBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  // Passenger Card
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
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
  passengerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerInitial: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  passengerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  ridesText: {
    fontSize: 13,
    marginLeft: 4,
  },
  paymentBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  paymentText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  // Trip Card
  tripCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
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
  tripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  tripInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tripLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  tripAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  tripLineContainer: {
    paddingLeft: 11,
    paddingVertical: 2,
  },
  tripLine: {
    width: 2,
    height: 24,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statBox: {
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
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    gap: 8,
  },
  declineText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 12,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default IncomingRideScreen;