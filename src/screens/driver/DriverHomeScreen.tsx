/**
 * ============================================================================
 * GO WITH SALLY - DRIVER HOME SCREEN
 * ============================================================================
 * Écran principal pour les conductrices avec:
 * - Carte Google Maps (WebView)
 * - Toggle en ligne/hors ligne
 * - Statistiques du jour
 * - Demandes de courses entrantes
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * 
 * @module screens/driver/DriverHomeScreen
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
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Store
import { useTheme } from '../../utils/ThemeContext';
import { useAppSelector } from '../../store';

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

const FILE_NAME = '[DriverHomeScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

const DEFAULT_LOCATION = {
  latitude: 33.5731,
  longitude: -7.5898, // Casablanca
};

// Demande de course simulée
const MOCK_RIDE_REQUEST = {
  id: 'ride_request_001',
  passenger: {
    id: 'user_001',
    firstName: 'Salma',
    lastName: 'Benani',
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

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const DriverHomeScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const webViewRef = useRef<WebView>(null);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [todayStats, setTodayStats] = useState({
    rides: 0,
    earnings: 0,
    hours: 0,
    rating: 5.0,
  });

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 👤 Driver: ${user?.firstName} ${user?.lastName}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // INITIALISATION
  // ==========================================================================

  useEffect(() => {
    requestLocationPermission();
    loadTodayStats();

    // Animation d'entrée
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // Animation pulse quand en ligne
  useEffect(() => {
    if (isOnline) {
      startPulseAnimation();
      updateMapOnlineStatus(true);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      updateMapOnlineStatus(false);
    }
  }, [isOnline]);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadTodayStats = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des stats du jour...`);

    try {
      const response = await driverAPI.getEarnings('today');

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setTodayStats({
          rides: data.totalRides || 5,
          earnings: data.today || 320,
          hours: data.totalHours || 4.5,
          rating: data.avgRating || 4.9,
        });
        console.log(`${FILE_NAME} ✅ Stats chargées`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur stats:`, error.message);
      // Garder les valeurs par défaut en cas d'erreur
      setTodayStats({
        rides: 5,
        earnings: 320,
        hours: 4.5,
        rating: 4.9,
      });
    }
  }, []);

  // ==========================================================================
  // LOCALISATION
  // ==========================================================================

  const requestLocationPermission = async () => {
    try {
      console.log(`${FILE_NAME} 📍 Demande permission localisation...`);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(newLocation);
        console.log(`${FILE_NAME} 📍 Position:`, newLocation);

        // Centrer la carte
        if (mapReady) {
          centerMap(newLocation.latitude, newLocation.longitude);
        }
      } else {
        console.log(`${FILE_NAME} ⚠️ Permission localisation refusée`);
        Toast.show({
          type: 'error',
          text1: t('errors.locationPermission'),
          text2: t('errors.enableLocation'),
        });
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur localisation:`, error.message);
    }
  };

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // ==========================================================================
  // WEBVIEW HANDLERS
  // ==========================================================================

  const updateMapOnlineStatus = (online: boolean) => {
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`
        if (typeof updateOnlineStatus === 'function') {
          updateOnlineStatus(${online});
        }
        true;
      `);
    }
  };

  const centerMap = (lat: number, lng: number) => {
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`
        if (typeof centerMap === 'function') {
          centerMap(${lat}, ${lng});
        }
        true;
      `);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`${FILE_NAME} 📨 WebView message:`, data.type);

      if (data.type === 'mapReady') {
        setMapReady(true);
        // Centrer sur la position actuelle
        centerMap(currentLocation.latitude, currentLocation.longitude);
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    console.log(`${FILE_NAME} 🔄 Toggle Online: ${newStatus}`);

    setIsLoading(true);

    try {
      // Appel API
      if (newStatus) {
        await driverAPI.goOnline();
      } else {
        await driverAPI.goOffline();
      }

      setIsOnline(newStatus);

      if (newStatus) {
        Toast.show({
          type: 'success',
          text1: t('driver.youAreOnline'),
          text2: t('driver.readyForRides'),
        });

        // Simulation demande de course (mode développement)
        if (IS_OFFLINE || IS_HYBRID) {
          setTimeout(() => {
            if (newStatus) {
              handleSimulateRideRequest();
            }
          }, 10000);
        }
      } else {
        Toast.show({
          type: 'info',
          text1: t('driver.youAreOffline'),
          text2: t('driver.noMoreRides'),
        });
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur toggle:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateRideRequest = () => {
    console.log(`${FILE_NAME} 🚗 Simulation demande de course`);
    navigation.navigate('IncomingRide', { request: MOCK_RIDE_REQUEST });
  };

  const handleCenterMap = () => {
    console.log(`${FILE_NAME} 🎯 Centrer carte`);
    centerMap(currentLocation.latitude, currentLocation.longitude);
  };

  const handleOpenMenu = () => {
    navigation.openDrawer();
  };

  const handleOpenEarnings = () => {
    navigation.navigate('DriverEarnings');
  };

  const handleOpenNotifications = () => {
    navigation.navigate('Notifications');
  };

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
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() }]}>
        <Text style={styles.modeBadgeText}>{getModeEmoji()}</Text>
      </View>
    );
  };

  // Stat Item
  const StatItem = ({
    icon,
    value,
    label,
    color,
  }: {
    icon: string;
    value: string | number;
    label: string;
    color: string;
  }) => (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
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
    let driverMarker;
    let searchCircle;
    let isOnline = false;
    let pulseInterval;
    const primaryColor = "${primaryColor}";
    
    function initMap() {
      const driverPos = { lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude} };
      
      map = new google.maps.Map(document.getElementById("map"), {
        center: driverPos,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: ${mapStyle}
      });

      // SVG de la voiture
      const carSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><g transform="translate(14, 18)" fill="white"><path d="M2 6h1l2-4.5A1.5 1.5 0 016.5 1h15a1.5 1.5 0 011.4 1L25 6h1a1 1 0 011 1v5a1 1 0 01-1 1h-1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2H6v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2H1a1 1 0 01-1-1V7a1 1 0 011-1zm4 5a2 2 0 100-4 2 2 0 000 4zm16 0a2 2 0 100-4 2 2 0 000 4z"/></g></svg>';
      
      driverMarker = new google.maps.Marker({
        position: driverPos,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carSvg),
          scaledSize: new google.maps.Size(56, 56),
          anchor: new google.maps.Point(28, 28)
        },
        zIndex: 100
      });

      // Cercle de recherche
      searchCircle = new google.maps.Circle({
        map: map,
        center: driverPos,
        radius: 1500,
        fillColor: primaryColor,
        fillOpacity: 0,
        strokeColor: primaryColor,
        strokeOpacity: 0,
        strokeWeight: 2
      });

      // Notifier React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function updateOnlineStatus(online) {
      isOnline = online;
      
      if (pulseInterval) {
        clearInterval(pulseInterval);
        pulseInterval = null;
      }
      
      if (online) {
        searchCircle.setOptions({
          fillOpacity: 0.08,
          strokeOpacity: 0.4
        });
        
        let radius = 800;
        let growing = true;
        pulseInterval = setInterval(() => {
          if (!isOnline) return;
          
          if (growing) {
            radius += 30;
            if (radius >= 2000) growing = false;
          } else {
            radius -= 30;
            if (radius <= 800) growing = true;
          }
          searchCircle.setRadius(radius);
        }, 50);
      } else {
        searchCircle.setOptions({
          fillOpacity: 0,
          strokeOpacity: 0,
          radius: 1500
        });
      }
    }

    function centerMap(lat, lng) {
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(15);
        if (driverMarker) {
          driverMarker.setPosition({ lat, lng });
        }
        if (searchCircle) {
          searchCircle.setCenter({ lat, lng });
        }
      }
    }

    function updateDriverPosition(lat, lng, heading) {
      if (driverMarker) {
        driverMarker.setPosition({ lat, lng });
      }
      if (searchCircle) {
        searchCircle.setCenter({ lat, lng });
      }
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
      {/* HEADER */}
      {/* ================================================================== */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        {/* Menu Button */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenMenu}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={theme.colors.text}
          />
          <ModeBadge />
        </TouchableOpacity>

        {/* Status Badge */}
        <Animated.View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOnline ? '#4CAF50' : theme.colors.surface,
              transform: [{ scale: isOnline ? pulseAnim : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? 'white' : '#F44336' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? 'white' : theme.colors.text },
            ]}
          >
            {isOnline ? t('driver.online') : t('driver.offline')}
          </Text>
        </Animated.View>

        {/* Notifications Button */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenNotifications}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={theme.colors.text}
          />
          {/* Badge notification */}
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ================================================================== */}
      {/* BOUTON CENTRER */}
      {/* ================================================================== */}
      <TouchableOpacity
        style={[styles.centerBtn, { backgroundColor: theme.colors.surface }]}
        onPress={handleCenterMap}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

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

        {/* Salutation */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: theme.colors.textSecondary }]}>
            {t('driver.hello')},
          </Text>
          <Text style={[styles.driverName, { color: theme.colors.text }]}>
            {user?.firstName || 'Conductrice'} 👋
          </Text>
        </View>

        {/* Statistiques */}
        <TouchableOpacity
          style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenEarnings}
          activeOpacity={0.9}
        >
          <StatItem
            icon="car-multiple"
            value={todayStats.rides}
            label={t('driver.rides')}
            color={theme.colors.primary}
          />

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <StatItem
            icon="cash"
            value={`${todayStats.earnings}`}
            label="DH"
            color="#4CAF50"
          />

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <StatItem
            icon="clock-outline"
            value={`${todayStats.hours}h`}
            label={t('driver.online')}
            color="#2196F3"
          />

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <StatItem
            icon="star"
            value={todayStats.rating.toFixed(1)}
            label={t('driver.rating')}
            color="#FFD700"
          />

          {/* Chevron */}
          <MaterialCommunityIcons
            name={isRTL ? 'chevron-left' : 'chevron-right'}
            size={20}
            color={theme.colors.textLight}
            style={styles.statsChevron}
          />
        </TouchableOpacity>

        {/* Bouton Toggle Online */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: isOnline ? '#F44336' : theme.colors.primary,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          onPress={handleToggleOnline}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons
              name={isOnline ? 'power-off' : 'power'}
              size={28}
              color="white"
            />
          )}
          <Text style={styles.toggleButtonText}>
            {isOnline ? t('driver.goOffline') : t('driver.goOnline')}
          </Text>
        </TouchableOpacity>

        {/* Message info */}
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          {isOnline ? t('driver.waitingForRides') : t('driver.goOnlineToReceive')}
        </Text>

        {/* Bouton test (mode développement) */}
        {(IS_OFFLINE || IS_HYBRID) && isOnline && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleSimulateRideRequest}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="test-tube"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={[styles.testButtonText, { color: theme.colors.primary }]}>
              {t('driver.simulateRequest')}
            </Text>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV</Text>
            </View>
          </TouchableOpacity>
        )}

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
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
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

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Notification Badge
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Bouton centrer
  centerBtn: {
    position: 'absolute',
    right: 16,
    bottom: 340,
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

  // Greeting
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 6,
  },
  greetingText: {
    fontSize: 14,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
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
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statsChevron: {
    marginLeft: 4,
  },

  // Toggle Button
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Info text
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
  },

  // Test button
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  devBadge: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  devBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
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

export default DriverHomeScreen;