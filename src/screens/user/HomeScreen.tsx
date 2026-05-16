/**
 * ============================================================================
 * GO WITH SALLY - HOME SCREEN (PASSENGER) - MIS À JOUR v5.0
 * ============================================================================
 * Écran d'accueil passagère avec carte Google Maps
 * 
 * MISES À JOUR v5.0:
 * - Intégration mode simulation (offline/hybrid/online)
 * - Sélection du service (sally_eco, sally_standard, sally_confort, sally_pool)
 * - Affichage badges conductrices
 * - Banner requiresDailyFaceCheck
 * - Quick services buttons
 * - Pricing preview
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/HomeScreen
 * @version 5.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  I18nManager,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useAppSelector } from '../../store';
import { useSocket } from '../../services/SocketContext';
import { useRTL } from '../../hooks/useRTL';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// Constants
import { SERVICE_CONFIGS } from '../../constants/services';
import { BADGE_CONFIGS } from '../../constants/badges';

// Types locaux (évite les problèmes d'import circulaire)
type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[HomeScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';

// Hauteurs du bottom sheet
const SHEET_MIN_HEIGHT = 240;
const SHEET_MAX_HEIGHT = 520;

const DEFAULT_LOCATION = {
  latitude: 33.5731, // Casablanca
  longitude: -7.5898,
};

// ============================================================================
// TYPES
// ============================================================================

interface Driver {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  rating: number;
  time: string;
  vehicle: string;
  badge?: string;
  servicesOffered?: string[];
}

interface Favorite {
  id: string;
  type: 'home' | 'work';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RecentPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// ============================================================================
// DONNÉES MOCK (MODE OFFLINE/HYBRID)
// ============================================================================

const MOCK_DRIVERS: Driver[] = [
  { 
    id: '1', 
    latitude: 33.576, 
    longitude: -7.586, 
    name: 'Amina', 
    rating: 4.9, 
    time: '2 min', 
    vehicle: 'Toyota Yaris',
    badge: BADGE_CONFIGS.premium.icon,
    servicesOffered: ['sally_eco', 'sally_standard', 'sally_confort'],
  },
  { 
    id: '2', 
    latitude: 33.571, 
    longitude: -7.596, 
    name: 'Fatima', 
    rating: 4.8, 
    time: '4 min', 
    vehicle: 'Dacia Logan',
    badge: BADGE_CONFIGS.verified.icon,
    servicesOffered: ['sally_eco', 'sally_standard', 'sally_pool'],
  },
  { 
    id: '3', 
    latitude: 33.569, 
    longitude: -7.584, 
    name: 'Khadija', 
    rating: 4.95, 
    time: '5 min', 
    vehicle: 'Mercedes Classe E',
    badge: BADGE_CONFIGS.elite.icon,
    servicesOffered: ['sally_eco', 'sally_standard', 'sally_confort', 'sally_pool'],
  },
  { 
    id: '4', 
    latitude: 33.578, 
    longitude: -7.592, 
    name: 'Salma', 
    rating: 4.7, 
    time: '3 min', 
    vehicle: 'Renault Clio',
    badge: BADGE_CONFIGS.basic.icon,
    servicesOffered: ['sally_eco', 'sally_standard'],
  },
  { 
    id: '5', 
    latitude: 33.574, 
    longitude: -7.590, 
    name: 'Nadia', 
    rating: 4.85, 
    time: '6 min', 
    vehicle: 'Peugeot 308',
    badge: BADGE_CONFIGS.verified.icon,
    servicesOffered: ['sally_eco', 'sally_standard', 'sally_pool'],
  },
];

const MOCK_FAVORITES: Favorite[] = [
  { id: 'home', type: 'home', name: 'Maison', address: 'Bd Mohammed V, Casablanca', latitude: 33.5889, longitude: -7.6111 },
  { id: 'work', type: 'work', name: 'Travail', address: 'Maarif, Casablanca', latitude: 33.5850, longitude: -7.6300 },
];

const MOCK_RECENT: RecentPlace[] = [
  { id: '1', name: 'Morocco Mall', address: 'Corniche', latitude: 33.5447, longitude: -7.6311 },
  { id: '2', name: 'Casa Port', address: 'Port de Casablanca', latitude: 33.6075, longitude: -7.6169 },
  { id: '3', name: 'Aéroport Mohammed V', address: 'Nouaceur', latitude: 33.3675, longitude: -7.5897 },
];

// ============================================================================
// SERVICE OPTIONS
// ============================================================================

const SERVICE_OPTIONS: Array<{ type: ServiceType; icon: string; emoji: string; color: string }> = [
  { type: 'sally_eco', icon: 'leaf', emoji: '🌱', color: '#22C55E' },
  { type: 'sally_standard', icon: 'car', emoji: '🚗', color: '#3B82F6' },
  { type: 'sally_confort', icon: 'car-sports', emoji: '✨', color: '#A855F7' },
  { type: 'sally_pool', icon: 'account-group', emoji: '👥', color: '#06B6D4' },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const HomeScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  const { user, requiresDailyFaceCheck } = useAppSelector((state) => state.auth);
  
  // Local state for service and simulation (until slices are added to store)
  const [selectedService, setSelectedService] = useState<ServiceType>('sally_standard');
  const [simulationMode] = useState<'offline' | 'hybrid' | 'online'>(IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online');
  const isSimulationEnabled = IS_OFFLINE || IS_HYBRID;
  
  const { isConnected, emit, on, off } = useSocket();
  const webViewRef = useRef<WebView>(null);

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎮 Simulation: ${simulationMode} (${isSimulationEnabled ? 'ON' : 'OFF'})`);
    console.log(`${FILE_NAME} 🔌 Socket: ${isConnected ? 'Connecté' : 'Déconnecté'}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 👤 User: ${user?.firstName || 'Guest'}`);
    console.log(`${FILE_NAME} 🔒 DailyFaceCheck: ${requiresDailyFaceCheck}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>(IS_OFFLINE || IS_HYBRID ? MOCK_DRIVERS : []);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [favorites] = useState<Favorite[]>(MOCK_FAVORITES);
  const [recentPlaces] = useState<RecentPlace[]>(MOCK_RECENT);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState(3);
  const [showDailyFaceBanner, setShowDailyFaceBanner] = useState(requiresDailyFaceCheck);

  // Animation
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(requiresDailyFaceCheck ? 1 : 0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    initializeLocation();

    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  // Filtrer les conductrices par service sélectionné
  useEffect(() => {
    const filtered = drivers.filter((d) => {
      if (!d.servicesOffered || d.servicesOffered.length === 0) return true;
      return d.servicesOffered.includes(selectedService);
    });
    setFilteredDrivers(filtered);
    console.log(`${FILE_NAME} 🚗 Conductrices filtrées pour ${selectedService}: ${filtered.length}`);
  }, [drivers, selectedService]);

  // Écouter les conductrices à proximité (MODE ONLINE)
  useEffect(() => {
    if (IS_ONLINE && isConnected) {
      console.log(`${FILE_NAME} 🔌 Configuration des listeners socket`);

      const handleNearbyDrivers = (data: any) => {
        console.log(`${FILE_NAME} 🚗 Conductrices reçues:`, data.count || data.drivers?.length);
        if (data.drivers && Array.isArray(data.drivers)) {
          const formattedDrivers: Driver[] = data.drivers.map((d: any) => ({
            id: d.id,
            latitude: d.location?.[1] || d.latitude || DEFAULT_LOCATION.latitude,
            longitude: d.location?.[0] || d.longitude || DEFAULT_LOCATION.longitude,
            name: d.name || d.firstName || 'Conductrice',
            rating: d.rating || 4.5,
            time: d.eta || d.time || '3 min',
            vehicle: d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : 'Véhicule',
            badge: d.badge?.icon || '✅',
            servicesOffered: d.servicesOffered || ['sally_standard'],
          }));
          setDrivers(formattedDrivers);
        }
        setIsLoadingDrivers(false);
      };

      on('ride:nearbyDrivers', handleNearbyDrivers);

      return () => {
        off('ride:nearbyDrivers', handleNearbyDrivers);
      };
    }
  }, [isConnected, on, off]);

  // Demander les conductrices à proximité quand on a la position
  useEffect(() => {
    if (userLocation && userLocation.latitude !== DEFAULT_LOCATION.latitude) {
      fetchNearbyDrivers();
    }
  }, [userLocation, isConnected]);

  // Banner daily face check
  useEffect(() => {
    if (requiresDailyFaceCheck) {
      setShowDailyFaceBanner(true);
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [requiresDailyFaceCheck]);

  // ==========================================================================
  // FONCTIONS
  // ==========================================================================

  const initializeLocation = async () => {
    console.log(`${FILE_NAME} 📍 Demande de permission localisation...`);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        console.log(`${FILE_NAME} ✅ Permission accordée`);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        console.log(`${FILE_NAME} 📍 Position: ${newLocation.latitude}, ${newLocation.longitude}`);
        setUserLocation(newLocation);
      } else {
        console.log(`${FILE_NAME} ❌ Permission refusée`);
        Toast.show({
          type: 'error',
          text1: t('errors.locationError') || 'Erreur localisation',
          text2: t('errors.permissionDenied') || 'Permission refusée',
        });
      }
    } catch (error: any) {
      console.log(`${FILE_NAME} ❌ Erreur localisation:`, error.message);
    }
  };

  const fetchNearbyDrivers = useCallback(async () => {
    if (IS_OFFLINE || isSimulationEnabled) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE/Simulation - Données mock`);
      setDrivers(MOCK_DRIVERS);
      return;
    }

    if (IS_HYBRID) {
      console.log(`${FILE_NAME} 🟡 Mode HYBRID - Tentative API + Fallback`);
    } else {
      console.log(`${FILE_NAME} 🟢 Mode ONLINE - API réelle`);
    }

    setIsLoadingDrivers(true);

    // Via Socket si connecté
    if (isConnected) {
      emit('ride:requestNearbyDrivers', {
        coordinates: [userLocation.longitude, userLocation.latitude],
        radius: 5000,
        serviceType: selectedService,
      });
    } else if (IS_HYBRID) {
      // Fallback en mode hybrid
      console.log(`${FILE_NAME} ⚠️ Socket non connecté, fallback mock`);
      setDrivers(MOCK_DRIVERS);
      setIsLoadingDrivers(false);
    } else {
      console.log(`${FILE_NAME} ⚠️ Socket non connecté`);
      setIsLoadingDrivers(false);
    }
  }, [userLocation, isConnected, emit, selectedService, isSimulationEnabled]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNearbyDrivers();
    setRefreshing(false);
  }, [fetchNearbyDrivers]);

  const toggleSheet = useCallback(() => {
    const toValue = isExpanded ? SHEET_MIN_HEIGHT : SHEET_MAX_HEIGHT;
    setIsExpanded(!isExpanded);

    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
      tension: 50,
    }).start();
  }, [isExpanded, sheetHeight]);

  const handleMapMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapReady') {
        console.log(`${FILE_NAME} 🗺️ Carte prête`);
        setIsMapReady(true);
      } else if (data.type === 'driverSelected') {
        console.log(`${FILE_NAME} 🚗 Conductrice sélectionnée:`, data.driver.name);
        Toast.show({
          type: 'success',
          text1: `${data.driver.badge || '✅'} ${data.driver.name} - ${data.driver.vehicle}`,
          text2: `⭐ ${data.driver.rating} • ${t('home.arrivalIn') || 'Arrivée dans'} ${data.driver.time}`,
        });
      }
    } catch (e) {
      // Ignorer
    }
  }, [t]);

  const centerOnUser = useCallback(() => {
    console.log(`${FILE_NAME} 🎯 Centrer sur utilisateur`);
    webViewRef.current?.injectJavaScript(
      `centerMap(${userLocation.latitude}, ${userLocation.longitude}); true;`
    );
  }, [userLocation]);

  const handleSearchPress = useCallback(() => {
    console.log(`${FILE_NAME} 🔍 Navigation: SearchLocation`);
    navigation.navigate('SearchLocation', { 
      currentLocation: userLocation,
      selectedService,
    });
  }, [navigation, userLocation, selectedService]);

  const handleServiceSelect = useCallback((service: ServiceType) => {
    console.log(`${FILE_NAME} 🎯 Service sélectionné: ${service}`);
    setSelectedService(service);
    
    const serviceKey = service as keyof typeof SERVICE_CONFIGS;
    const config = SERVICE_CONFIGS[serviceKey];
    Toast.show({
      type: 'info',
      text1: config.name.fr,
      text2: config.shortDescription.fr,
      visibilityTime: 1500,
    });
  }, []);

  const handleFavoritePress = useCallback((favorite: Favorite) => {
    console.log(`${FILE_NAME} ⭐ Favori sélectionné:`, favorite.name);
    navigation.navigate('ConfirmRide', {
      pickup: {
        name: t('home.myPosition') || 'Ma position',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
      destination: {
        name: favorite.name,
        address: favorite.address,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      },
      selectedService,
    });
  }, [navigation, userLocation, t, selectedService]);

  const handleRecentPress = useCallback((place: RecentPlace) => {
    console.log(`${FILE_NAME} 🕐 Récent sélectionné:`, place.name);
    navigation.navigate('ConfirmRide', {
      pickup: {
        name: t('home.myPosition') || 'Ma position',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
      destination: {
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      },
      selectedService,
    });
  }, [navigation, userLocation, t, selectedService]);

  const handleNotificationsPress = useCallback(() => {
    console.log(`${FILE_NAME} 🔔 Notifications`);
    navigation.navigate('Notifications');
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    console.log(`${FILE_NAME} ☰ Menu`);
    navigation.openDrawer?.() || navigation.navigate('Profile');
  }, [navigation]);

  const handleDailyFaceCheck = useCallback(() => {
    console.log(`${FILE_NAME} 📸 Navigation: FaceLock (daily check)`);
    navigation.navigate('FaceLock', { isDailyCheck: true });
  }, [navigation]);

  const dismissDailyFaceBanner = useCallback(() => {
    Animated.timing(bannerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowDailyFaceBanner(false);
    });
  }, [bannerAnim]);

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  // Badge du mode
  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE || isSimulationEnabled) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() }]}>
        <Text style={styles.modeBadgeText}>{isSimulationEnabled ? '🎮' : getModeEmoji()}</Text>
      </View>
    );
  };

  // Greeting basé sur l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning') || 'Bonjour';
    if (hour < 18) return t('home.goodAfternoon') || 'Bon après-midi';
    return t('home.goodEvening') || 'Bonsoir';
  };

  // ==========================================================================
  // HTML GOOGLE MAPS
  // ==========================================================================

  const generateMapHTML = useCallback(() => {
    const primaryColor = theme.colors.primary;
    const mapStyle = isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

    const driversData = filteredDrivers.map(d => ({
      id: d.id,
      lat: d.latitude,
      lng: d.longitude,
      name: d.name,
      rating: d.rating,
      time: d.time,
      vehicle: d.vehicle,
      badge: d.badge || '✅',
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
    .driver-info {
      background: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      color: #333;
      transform: translateY(8px);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    const primaryColor = "${primaryColor}";
    const drivers = ${JSON.stringify(driversData)};
    
    function initMap() {
      const userLocation = { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} };
      
      map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 15,
        disableDefaultUI: true,
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: ${mapStyle}
      });

      // Cercle de zone
      new google.maps.Circle({
        map: map,
        center: userLocation,
        radius: 500,
        fillColor: primaryColor,
        fillOpacity: 0.06,
        strokeColor: primaryColor,
        strokeOpacity: 0.2,
        strokeWeight: 2
      });

      // Marqueur utilisateur (point bleu)
      const userSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#4285F4" stroke="white" stroke-width="3"/><circle cx="14" cy="14" r="5" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(userSvg),
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14)
        },
        zIndex: 1000
      });

      // Marqueurs conductrices
      drivers.forEach(function(driver) {
        var carSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><g transform="translate(10, 13)" fill="white"><path d="M2 7h1l1.5-4A1.5 1.5 0 016 2h14a1.5 1.5 0 011.5 1L23 7h1a1 1 0 011 1v5a1 1 0 01-1 1h-1v1.5a1 1 0 01-1 1h-1.5a1 1 0 01-1-1V14H5.5v1.5a1 1 0 01-1 1H3a1 1 0 01-1-1V14H1a1 1 0 01-1-1V8a1 1 0 011-1zm4 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm14 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></g></svg>';
        
        var marker = new google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carSvg),
            scaledSize: new google.maps.Size(46, 46),
            anchor: new google.maps.Point(23, 23)
          }
        });

        var infoWindow = new google.maps.InfoWindow({
          content: '<div class="driver-info">' + driver.badge + ' ' + driver.time + '</div>',
          disableAutoPan: true
        });
        infoWindow.open(map, marker);

        marker.addListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'driverSelected', 
            driver: driver 
          }));
        });
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function centerMap(lat, lng) {
      if (map) {
        map.panTo({ lat: lat, lng: lng });
        map.setZoom(15);
      }
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"></script>
</body>
</html>`;
  }, [theme.colors.primary, isDark, filteredDrivers, userLocation]);

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
        onMessage={handleMapMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />

      {/* ================================================================== */}
      {/* BANNER DAILY FACE CHECK */}
      {/* ================================================================== */}
      {showDailyFaceBanner && (
        <Animated.View 
          style={[
            styles.dailyFaceBanner,
            { 
              top: insets.top + 70,
              opacity: bannerAnim,
              transform: [{ 
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                })
              }],
            }
          ]}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dailyFaceBannerGradient}
          >
            <MaterialCommunityIcons name="face-recognition" size={20} color="white" />
            <View style={styles.dailyFaceBannerText}>
              <Text style={styles.dailyFaceBannerTitle}>
                {t('home.dailyFaceCheckTitle') || 'Vérification quotidienne'}
              </Text>
              <Text style={styles.dailyFaceBannerSubtitle}>
                {t('home.dailyFaceCheckSubtitle') || 'Confirmez votre identité pour continuer'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.dailyFaceBannerBtn}
              onPress={handleDailyFaceCheck}
            >
              <Text style={styles.dailyFaceBannerBtnText}>
                {t('home.verify') || 'Vérifier'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dailyFaceBannerClose}
              onPress={dismissDailyFaceBanner}
            >
              <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <Animated.View style={[styles.header, { top: insets.top + 10, opacity: fadeAnim }]}>
        {/* Bouton Menu */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="menu" size={24} color={theme.colors.text} />
          <ModeBadge />
        </TouchableOpacity>

        {/* Bouton Notifications */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleNotificationsPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ================================================================== */}
      {/* BADGE CONDUCTRICES */}
      {/* ================================================================== */}
      <Animated.View style={[styles.driversBadgeContainer, { top: insets.top + (showDailyFaceBanner ? 140 : 70), opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#FF69B4', '#FF1493']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.driversBadge}
        >
          <MaterialCommunityIcons name="car-multiple" size={18} color="white" />
          <Text style={styles.driversBadgeText}>
            {filteredDrivers.length} {t('home.drivers') || 'conductrices'}
          </Text>
          {isLoadingDrivers && (
            <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />
          )}
        </LinearGradient>
      </Animated.View>

      {/* ================================================================== */}
      {/* INDICATEURS DEV */}
      {/* ================================================================== */}
      {__DEV__ && (
        <View style={[styles.devBadgesContainer, { top: insets.top + (showDailyFaceBanner ? 190 : 120) }]}>
          {/* Mode Badge */}
          <View
            style={[
              styles.devBadge,
              { backgroundColor: IS_OFFLINE || isSimulationEnabled ? '#EF4444' : IS_HYBRID ? '#F59E0B' : '#10B981' },
            ]}
          >
            <Text style={styles.devBadgeText}>
              {isSimulationEnabled ? '🎮 SIM' : `${getModeEmoji()} ${APP_MODE.toUpperCase()}`}
            </Text>
          </View>

          {/* Socket Badge */}
          {!IS_OFFLINE && !isSimulationEnabled && (
            <View
              style={[
                styles.devBadge,
                { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
              ]}
            >
              <MaterialCommunityIcons
                name={isConnected ? 'wifi' : 'wifi-off'}
                size={12}
                color="white"
              />
              <Text style={styles.devBadgeText}>{isConnected ? 'WS' : 'OFF'}</Text>
            </View>
          )}

          {/* Service Badge */}
          <View
            style={[
              styles.devBadge,
              { backgroundColor: SERVICE_OPTIONS.find(s => s.type === selectedService)?.color || '#3B82F6' },
            ]}
          >
            <Text style={styles.devBadgeText}>
              {SERVICE_OPTIONS.find(s => s.type === selectedService)?.emoji || '🚗'} {selectedService.replace('sally_', '')}
            </Text>
          </View>
        </View>
      )}

      {/* ================================================================== */}
      {/* BOUTON CENTRER */}
      {/* ================================================================== */}
      <Animated.View
        style={[
          styles.centerBtnContainer,
          {
            bottom: sheetHeight.interpolate({
              inputRange: [SHEET_MIN_HEIGHT, SHEET_MAX_HEIGHT],
              outputRange: [SHEET_MIN_HEIGHT + 20, SHEET_MAX_HEIGHT + 20],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.centerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={centerOnUser}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ================================================================== */}
      {/* BOTTOM SHEET */}
      {/* ================================================================== */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { backgroundColor: theme.colors.background, height: sheetHeight },
        ]}
      >
        {/* Handle */}
        <TouchableOpacity
          style={styles.handleContainer}
          onPress={toggleSheet}
          activeOpacity={0.8}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        </TouchableOpacity>

        {/* Salutation */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            {getGreeting()}, {user?.firstName || t('home.guest') || 'Invitée'} 👋
          </Text>
        </View>

        {/* 🆕 Services Selector */}
        <View style={styles.servicesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScroll}
          >
            {SERVICE_OPTIONS.map((service) => {
              const isSelected = selectedService === service.type;
              const serviceKey = service.type as keyof typeof SERVICE_CONFIGS;
              const config = SERVICE_CONFIGS[serviceKey];
              
              return (
                <TouchableOpacity
                  key={service.type}
                  style={[
                    styles.serviceChip,
                    { 
                      backgroundColor: isSelected ? service.color : theme.colors.surface,
                      borderColor: isSelected ? service.color : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleServiceSelect(service.type)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                  <Text 
                    style={[
                      styles.serviceText, 
                      { color: isSelected ? 'white' : theme.colors.text }
                    ]}
                  >
                    {config.shortDescription.fr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Barre de recherche */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <View style={[styles.searchIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.primary} />
          </View>
          <Text style={[styles.searchText, { color: theme.colors.textSecondary }]}>
            {t('home.whereToGo') || 'Où allez-vous ?'}
          </Text>
          <MaterialCommunityIcons name="microphone-outline" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Bouton expand (si rétracté) */}
        {!isExpanded && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleSheet}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-up" size={22} color={theme.colors.primary} />
            <Text style={[styles.expandText, { color: theme.colors.primary }]}>
              {t('home.seeFavoritesAndRecent') || 'Voir favoris et récents'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Contenu étendu */}
        {isExpanded && (
          <ScrollView
            style={styles.expandedContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Favoris */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('home.favorites') || 'Favoris'}
            </Text>
            <View style={styles.favoritesContainer}>
              {favorites.map((fav) => (
                <TouchableOpacity
                  key={fav.id}
                  style={[styles.favoriteCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleFavoritePress(fav)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.favoriteIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <MaterialCommunityIcons
                      name={fav.type === 'home' ? 'home' : 'briefcase'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.favoriteInfo}>
                    <Text style={[styles.favoriteName, { color: theme.colors.text }]}>
                      {fav.type === 'home' ? (t('home.home') || 'Maison') : (t('home.work') || 'Travail')}
                    </Text>
                    <Text
                      style={[styles.favoriteAddress, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {fav.address}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Récents */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
              {t('home.recentDestinations') || 'Destinations récentes'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentScroll}
            >
              {recentPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.recentCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleRecentPress(place)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.recentIcon, { backgroundColor: theme.colors.primary + '10' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.recentName, { color: theme.colors.text }]} numberOfLines={1}>
                    {place.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bouton rétracter */}
            <TouchableOpacity
              style={styles.collapseButton}
              onPress={toggleSheet}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-down" size={22} color={theme.colors.textSecondary} />
              <Text style={[styles.collapseText, { color: theme.colors.textSecondary }]}>
                {t('home.collapse') || 'Réduire'}
              </Text>
            </TouchableOpacity>

            {/* Mode Footer */}
            <View style={styles.modeFooter}>
              <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
                {isSimulationEnabled ? '🎮 Mode Simulation' : `${getModeEmoji()} ${getModeDescription()}`}
              </Text>
            </View>
          </ScrollView>
        )}
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
    ...StyleSheet.absoluteFillObject,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Daily Face Banner
  dailyFaceBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  dailyFaceBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  dailyFaceBannerText: {
    flex: 1,
  },
  dailyFaceBannerTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  dailyFaceBannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  dailyFaceBannerBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dailyFaceBannerBtnText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  dailyFaceBannerClose: {
    padding: 4,
  },

  // Header
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Mode Badge
  modeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modeBadgeText: {
    fontSize: 10,
  },

  // Badge conductrices
  driversBadgeContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  driversBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  driversBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dev Badges
  devBadgesContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  devBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Bouton centrer
  centerBtnContainer: {
    position: 'absolute',
    right: 16,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },

  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },

  // Greeting
  greetingContainer: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Services
  servicesContainer: {
    marginBottom: 14,
  },
  servicesScroll: {
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  serviceEmoji: {
    fontSize: 16,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Recherche
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 14,
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
  searchIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 14,
  },

  // Bouton expand
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Contenu étendu
  expandedContent: {
    flex: 1,
    marginTop: 14,
  },

  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Favoris
  favoritesContainer: {
    gap: 10,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
  favoriteIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteInfo: {
    flex: 1,
    marginLeft: 14,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteAddress: {
    fontSize: 13,
    marginTop: 2,
  },

  // Récents
  recentScroll: {
    marginBottom: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 12,
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
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    maxWidth: 120,
  },

  // Bouton collapse
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  collapseText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default HomeScreen;