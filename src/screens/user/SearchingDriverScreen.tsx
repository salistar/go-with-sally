/**
 * ============================================================================
 * GO WITH SALLY - SEARCHING DRIVER SCREEN
 * ============================================================================
 * Écran de recherche de conductrice avec carte Google Maps (WebView)
 * 
 * Fonctionnalités:
 * - Animation radar de recherche
 * - Carte avec conductrices proches animées
 * - Timer de recherche
 * - Résumé du trajet
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/SearchingDriverScreen
 * @version 2.0.0
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
  Animated,
  Easing,
  Alert,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API & Socket
import { rideAPI } from '../../services/api';
import { useSocket } from '../../services/SocketContext';

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

const FILE_NAME = '[SearchingDriverScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

// Conductrices proches simulées
const MOCK_NEARBY_DRIVERS = [
  { id: 'd1', latitude: 33.996, longitude: -6.718, heading: 45 },
  { id: 'd2', latitude: 33.991, longitude: -6.726, heading: 120 },
  { id: 'd3', latitude: 33.989, longitude: -6.714, heading: 270 },
  { id: 'd4', latitude: 33.998, longitude: -6.722, heading: 180 },
];

// Conductrice acceptée simulée
const MOCK_ACCEPTED_DRIVER = {
  id: 'driver_001',
  firstName: 'Amina',
  lastName: 'El Amrani',
  phone: '+212600000001',
  rating: 4.9,
  totalRides: 542,
  photo: null,
  vehicle: {
    brand: 'Dacia',
    model: 'Logan',
    color: 'Blanc',
    plateNumber: '12345-A-1',
  },
  location: {
    latitude: 33.996,
    longitude: -6.718,
  },
  estimatedArrival: 3,
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const SearchingDriverScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const { on, off, emit, isConnected } = useSocket();

  // Paramètres de la route
  const pickup = route.params?.pickup || {
    name: 'Position actuelle',
    latitude: 33.9937,
    longitude: -6.7210,
  };
  const destination = route.params?.destination || {
    name: 'Destination',
    latitude: 33.9619,
    longitude: -6.8478,
  };
  const price = route.params?.price || 35;
  const duration = route.params?.duration || 15;
  const rideId = route.params?.rideId;

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 📍 Pickup: ${pickup.name}`);
    console.log(`${FILE_NAME} 🎯 Destination: ${destination.name}`);
    console.log(`${FILE_NAME} 💰 Prix: ${price} DH`);
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

  const [searchTime, setSearchTime] = useState<number>(0);
  const [nearbyDrivers, setNearbyDrivers] = useState(MOCK_NEARBY_DRIVERS);
  const [isSearching, setIsSearching] = useState<boolean>(true);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animations d'entrée
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

    // Démarrer animations pulse
    startPulseAnimations();

    // Timer de recherche
    timerRef.current = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    // Comportement selon le mode
    if (IS_OFFLINE) {
      simulateDriverSearch();
    } else if (IS_HYBRID) {
      setupSocketListeners();
      simulateDriverSearch(); // Fallback
    } else {
      setupSocketListeners();
      requestNearbyDrivers();
    }

    return () => {
      cleanup();
    };
  }, []);

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!IS_OFFLINE) {
      off('ride:driverAccepted');
      off('ride:nearbyDrivers');
      off('ride:noDrivers');
    }
  };

  // ==========================================================================
  // SOCKET LISTENERS
  // ==========================================================================

  const setupSocketListeners = () => {
    console.log(`${FILE_NAME} 🔌 Configuration des listeners socket`);

    on('ride:driverAccepted', (data: any) => {
      console.log(`${FILE_NAME} 🎉 Conductrice acceptée:`, data.driver?.firstName);
      handleDriverFound(data.driver);
    });

    on('ride:nearbyDrivers', (data: any) => {
      console.log(`${FILE_NAME} 📍 ${data.drivers?.length || 0} conductrices proches`);
      if (data.drivers?.length > 0) {
        setNearbyDrivers(data.drivers);
        updateMapDrivers(data.drivers);
      }
    });

    on('ride:noDrivers', () => {
      console.log(`${FILE_NAME} ❌ Aucune conductrice disponible`);
      handleNoDriversFound();
    });
  };

  const requestNearbyDrivers = () => {
    console.log(`${FILE_NAME} 📡 Demande de conductrices proches`);
    emit('ride:requestNearbyDrivers', {
      coordinates: [pickup.longitude, pickup.latitude],
      rideId,
    });
  };

  // ==========================================================================
  // SIMULATION (OFFLINE/HYBRID)
  // ==========================================================================

  const simulateDriverSearch = () => {
    console.log(`${FILE_NAME} 🎮 Simulation recherche conductrice`);

    // Conductrice trouvée après 5 secondes
    searchTimeoutRef.current = setTimeout(() => {
      handleDriverFound(MOCK_ACCEPTED_DRIVER);
    }, 5000);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleDriverFound = (driver: any) => {
    console.log(`${FILE_NAME} 🎉 Conductrice trouvée: ${driver.firstName}`);
    setIsSearching(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    Toast.show({
      type: 'success',
      text1: t('ride.driverFound'),
      text2: t('ride.driverArriving', { minutes: driver.estimatedArrival || 3 }),
    });

    navigation.replace('RideInProgress', {
      driver,
      pickup,
      destination,
      price,
      rideId,
    });
  };

  const handleNoDriversFound = () => {
    console.log(`${FILE_NAME} ❌ Aucune conductrice trouvée`);
    setIsSearching(false);

    Toast.show({
      type: 'error',
      text1: t('ride.noDriversAvailable'),
      text2: t('ride.tryAgainLater'),
    });

    navigation.goBack();
  };

  const handleCancelSearch = () => {
    Alert.alert(
      t('ride.cancelSearchTitle'),
      t('ride.cancelSearchMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            console.log(`${FILE_NAME} ❌ Recherche annulée`);
            cleanup();

            // Annuler côté serveur si online
            if (!IS_OFFLINE && rideId) {
              try {
                await rideAPI.cancelRide(rideId);
              } catch (error) {
                console.error(`${FILE_NAME} Erreur annulation:`, error);
              }
            }

            Toast.show({
              type: 'info',
              text1: t('ride.searchCancelled'),
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ==========================================================================
  // MAP FUNCTIONS
  // ==========================================================================

  const updateMapDrivers = (drivers: any[]) => {
    const driversData = drivers.map((d) => ({
      id: d.id,
      lat: d.latitude || d.location?.latitude,
      lng: d.longitude || d.location?.longitude,
    }));

    webViewRef.current?.injectJavaScript(`
      updateDrivers(${JSON.stringify(driversData)});
      true;
    `);
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatSearchTime = (): string => {
    const minutes = Math.floor(searchTime / 60);
    const seconds = searchTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startPulseAnimations = () => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createPulse(pulseAnim1, 0);
    createPulse(pulseAnim2, 666);
    createPulse(pulseAnim3, 1333);
  };

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
  // HTML GOOGLE MAPS
  // ==========================================================================

  const generateMapHTML = () => {
    const primaryColor = theme.colors.primary;
    const mapStyle = isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

    const driversData = nearbyDrivers.map((d) => ({
      id: d.id,
      lat: d.latitude,
      lng: d.longitude,
      heading: d.heading,
    }));

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
    let driverMarkers = [];
    const primaryColor = "${primaryColor}";
    let drivers = ${JSON.stringify(driversData)};
    
    function initMap() {
      const pickupPos = { lat: ${pickup.latitude}, lng: ${pickup.longitude} };
      
      map = new google.maps.Map(document.getElementById("map"), {
        center: pickupPos,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: false,
        styles: ${mapStyle}
      });

      // Cercle de recherche
      new google.maps.Circle({
        map: map,
        center: pickupPos,
        radius: 800,
        fillColor: primaryColor,
        fillOpacity: 0.1,
        strokeColor: primaryColor,
        strokeOpacity: 0.4,
        strokeWeight: 2
      });

      // Cercle intérieur
      new google.maps.Circle({
        map: map,
        center: pickupPos,
        radius: 400,
        fillColor: primaryColor,
        fillOpacity: 0.15,
        strokeColor: primaryColor,
        strokeOpacity: 0.5,
        strokeWeight: 1
      });

      // Marqueur pickup (utilisateur)
      new google.maps.Marker({
        position: pickupPos,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
        zIndex: 1000
      });

      // Conductrices
      createDriverMarkers();

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function createDriverMarkers() {
      // Supprimer anciens marqueurs
      driverMarkers.forEach(m => m.setMap(null));
      driverMarkers = [];

      drivers.forEach((driver, index) => {
        const carSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><g transform="translate(9, 12)" fill="white"><path d="M2 6h1l1.5-3.5A1 1 0 015.5 2h13a1 1 0 01.9.5L21 6h1a1 1 0 011 1v4a1 1 0 01-1 1h-1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1H2a1 1 0 01-1-1V7a1 1 0 011-1zm3 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm14 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></g></svg>';
        
        const marker = new google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carSvg),
            scaledSize: new google.maps.Size(44, 44),
            anchor: new google.maps.Point(22, 22)
          },
          zIndex: 100
        });

        driverMarkers.push(marker);
        animateDriver(marker, driver, index);
      });
    }

    function updateDrivers(newDrivers) {
      drivers = newDrivers;
      createDriverMarkers();
    }

    function animateDriver(marker, driver, index) {
      let lat = driver.lat;
      let lng = driver.lng;
      const targetLat = ${pickup.latitude};
      const targetLng = ${pickup.longitude};
      
      setInterval(() => {
        lat += (targetLat - lat) * 0.015 + (Math.random() - 0.5) * 0.0008;
        lng += (targetLng - lng) * 0.015 + (Math.random() - 0.5) * 0.0008;
        marker.setPosition({ lat, lng });
      }, 400 + index * 80);
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"></script>
</body>
</html>
    `;
  };

  // ==========================================================================
  // INTERPOLATIONS ANIMATIONS
  // ==========================================================================

  const pulseScale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const pulseOpacity1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const pulseScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const pulseOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const pulseScale3 = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const pulseOpacity3 = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* ================================================================ */}
      {/* CARTE GOOGLE MAPS */}
      {/* ================================================================ */}
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
      />

      {/* ================================================================ */}
      {/* MODE BADGE (DEV) */}
      {/* ================================================================ */}
      {__DEV__ && (
        <View style={[styles.devBadge, { top: insets.top + 10 }]}>
          <ModeBadge />
        </View>
      )}

      {/* ================================================================ */}
      {/* ANIMATION RADAR AU CENTRE */}
      {/* ================================================================ */}
      <View style={[styles.radarContainer, { top: SCREEN_HEIGHT * 0.18 }]}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              borderColor: theme.colors.primary,
              transform: [{ scale: pulseScale1 }],
              opacity: pulseOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              borderColor: theme.colors.primary,
              transform: [{ scale: pulseScale2 }],
              opacity: pulseOpacity2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              borderColor: theme.colors.primary,
              transform: [{ scale: pulseScale3 }],
              opacity: pulseOpacity3,
            },
          ]}
        />

        <View style={[styles.carIconContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="car-connected" size={36} color={theme.colors.primary} />
        </View>
      </View>

      {/* ================================================================ */}
      {/* BOTTOM SHEET */}
      {/* ================================================================ */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom + 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('ride.searchingDriver')}
        </Text>

        {/* Timer */}
        <View style={[styles.timerContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.timerText, { color: theme.colors.text }]}>{formatSearchTime()}</Text>
        </View>

        {/* Info trajet */}
        <View style={[styles.tripInfo, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.tripRow}>
            <View style={[styles.tripDot, { backgroundColor: '#4CAF50' }]}>
              <View style={styles.tripDotInner} />
            </View>
            <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
              {pickup.name || pickup.address}
            </Text>
          </View>
          <View style={styles.tripLineContainer}>
            <View style={[styles.tripLine, { backgroundColor: theme.colors.border }]} />
          </View>
          <View style={styles.tripRow}>
            <View style={[styles.tripDot, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="flag-checkered" size={8} color="white" />
            </View>
            <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
              {destination.name || destination.address}
            </Text>
          </View>
        </View>

        {/* Prix et durée */}
        <View style={styles.infoRow}>
          <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="cash" size={20} color="#4CAF50" />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{price} DH</Text>
          </View>
          <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{duration} min</Text>
          </View>
          <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="car-multiple" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {nearbyDrivers.length}
            </Text>
          </View>
        </View>

        {/* Message */}
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {t('ride.searchingNearbyDrivers')}
        </Text>

        {/* Bouton Annuler */}
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: '#F44336' }]}
          onPress={handleCancelSearch}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={20} color="#F44336" />
          <Text style={styles.cancelButtonText}>{t('ride.cancelSearch')}</Text>
        </TouchableOpacity>

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
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
]`;

const DARK_MAP_STYLE = `[
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
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

  // Dev Badge
  devBadge: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
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

  // Animation Radar
  radarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  carIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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

  // Titre
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },

  // Trip Info
  tripInfo: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  tripText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 14,
  },
  tripLineContainer: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  tripLine: {
    width: 2,
    height: 18,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Message
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Cancel Button
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    marginBottom: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default SearchingDriverScreen;