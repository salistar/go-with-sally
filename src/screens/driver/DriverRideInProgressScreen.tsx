/**
 * ============================================================================
 * GO WITH SALLY - DRIVER RIDE IN PROGRESS SCREEN
 * ============================================================================
 * Écran de course en cours côté conductrice
 * 
 * Fonctionnalités:
 * - Carte Google Maps avec itinéraire en temps réel
 * - Chronomètre de course
 * - Stats (ETA, distance, prix)
 * - Contact passagère (appel, message)
 * - Navigation externe (Google Maps, Waze)
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * 
 * @module screens/driver/DriverRideInProgressScreen
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
  Linking,
  Alert,
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

const FILE_NAME = '[DriverRideInProgressScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const DriverRideInProgressScreen: React.FC = () => {
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

  const ride = route.params?.ride || {
    id: 'ride_001',
    passenger: {
      id: 'user_001',
      firstName: 'Salma',
      lastName: 'Benani',
      phone: '+212600000000',
      rating: 4.8,
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
    paymentMethod: 'cash',
    startTime: new Date().toISOString(),
  };

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🚗 Ride ID: ${ride.id}`);
    console.log(`${FILE_NAME} 📍 Destination: ${ride.destination.name}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [estimatedTime, setEstimatedTime] = useState<string>('15 min');
  const [distance, setDistance] = useState<string>('5.2 km');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Timer temps écoulé
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Animation d'entrée
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Animation pulse du timer
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

    // Simulation navigation (mode dev)
    if (IS_OFFLINE || IS_HYBRID) {
      simulateNavigation();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simulationRef.current) clearInterval(simulationRef.current);
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // SIMULATION
  // ==========================================================================

  const simulateNavigation = () => {
    let progress = 0;

    simulationRef.current = setInterval(() => {
      progress += 0.05;

      if (progress >= 1) {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setEstimatedTime(t('driver.arrived'));
        setDistance('0 km');
        return;
      }

      // Mettre à jour les stats
      const remainingMin = Math.round((1 - progress) * 15);
      const remainingDist = ((1 - progress) * 5.2).toFixed(1);
      setEstimatedTime(`${remainingMin} min`);
      setDistance(`${remainingDist} km`);

      // Mettre à jour la position sur la carte
      updateDriverPosition(progress);
    }, 3000);
  };

  const updateDriverPosition = (progress: number) => {
    if (!mapReady) return;

    const newLat = ride.pickup.latitude + (ride.destination.latitude - ride.pickup.latitude) * progress;
    const newLng = ride.pickup.longitude + (ride.destination.longitude - ride.pickup.longitude) * progress;

    webViewRef.current?.injectJavaScript(`
      if (typeof updateDriverPosition === 'function') {
        updateDriverPosition(${newLat}, ${newLng});
      }
      true;
    `);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const formatElapsedTime = (): string => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCallPassenger = () => {
    const phone = ride.passenger.phone || '+212600000000';
    console.log(`${FILE_NAME} 📞 Appel passagère: ${phone}`);
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessagePassenger = () => {
    console.log(`${FILE_NAME} 💬 Message passagère`);
    navigation.navigate('Chat', {
      recipientId: ride.passenger.id,
      recipientName: ride.passenger.firstName,
      rideId: ride.id,
    });
  };

  const handleOpenMaps = () => {
    console.log(`${FILE_NAME} 🗺️ Ouvrir navigation externe`);

    Alert.alert(
      t('driver.openNavigation'),
      t('driver.chooseNavigationApp'),
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?daddr=${ride.destination.latitude},${ride.destination.longitude}&directionsmode=driving`,
              android: `google.navigation:q=${ride.destination.latitude},${ride.destination.longitude}`,
            });
            if (url) {
              Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                  Linking.openURL(url);
                } else {
                  // Fallback web
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${ride.destination.latitude},${ride.destination.longitude}`);
                }
              });
            }
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://?ll=${ride.destination.latitude},${ride.destination.longitude}&navigate=yes`;
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Toast.show({
                  type: 'info',
                  text1: t('driver.wazeNotInstalled'),
                });
              }
            });
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleCompleteRide = async () => {
    console.log(`${FILE_NAME} ✅ Tentative de terminer la course`);

    Alert.alert(
      t('driver.confirmComplete'),
      t('driver.confirmCompleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('driver.complete'),
          style: 'default',
          onPress: async () => {
            setIsCompleting(true);

            try {
              // Appel API
              await driverAPI.completeRide(ride.id);
              console.log(`${FILE_NAME} ✅ Course terminée avec succès`);

              // Arrêter les timers
              if (timerRef.current) clearInterval(timerRef.current);
              if (simulationRef.current) clearInterval(simulationRef.current);

              Toast.show({
                type: 'success',
                text1: t('driver.rideCompleted') + ' 🎉',
                text2: `${ride.estimatedPrice} DH • ${formatElapsedTime()}`,
              });

              // Navigation vers écran de fin
              navigation.replace('DriverRideCompleted', {
                ride: {
                  ...ride,
                  endTime: new Date().toISOString(),
                  duration: formatElapsedTime(),
                  finalDistance: distance,
                },
              });
            } catch (error: any) {
              console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
              Toast.show({
                type: 'error',
                text1: t('errors.error'),
                text2: error.message,
              });
              setIsCompleting(false);
            }
          },
        },
      ]
    );
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
    value: string;
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
    let directionsService;
    let directionsRenderer;
    const primaryColor = "${primaryColor}";
    
    const pickupPos = { lat: ${ride.pickup.latitude}, lng: ${ride.pickup.longitude} };
    const destPos = { lat: ${ride.destination.latitude}, lng: ${ride.destination.longitude} };
    let driverPos = { ...pickupPos };
    
    function initMap() {
      map = new google.maps.Map(document.getElementById("map"), {
        center: pickupPos,
        zoom: 14,
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

      // SVG Voiture conductrice
      const carSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><g transform="translate(12, 16)" fill="white"><path d="M2 6h1l2-4.5A1.5 1.5 0 016.5 1h15a1.5 1.5 0 011.4 1L25 6h1a1 1 0 011 1v5a1 1 0 01-1 1h-1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2H6v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2H1a1 1 0 01-1-1V7a1 1 0 011-1zm4 5a2 2 0 100-4 2 2 0 000 4zm16 0a2 2 0 100-4 2 2 0 000 4z"/></g></svg>';
      
      driverMarker = new google.maps.Marker({
        position: driverPos,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carSvg),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 26)
        },
        zIndex: 200
      });

      // SVG Destination (pin rose)
      const destSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54"><path d="M22 0C10 0 0 10 0 22c0 16 22 32 22 32s22-16 22-32C44 10 34 0 22 0z" fill="' + primaryColor + '" stroke="white" stroke-width="3"/><circle cx="22" cy="20" r="9" fill="white"/></svg>';
      
      new google.maps.Marker({
        position: destPos,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(destSvg),
          scaledSize: new google.maps.Size(44, 54),
          anchor: new google.maps.Point(22, 54)
        },
        zIndex: 100
      });

      // Calculer l'itinéraire initial
      calculateRoute();

      // Notifier React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function calculateRoute() {
      directionsService.route({
        origin: driverPos,
        destination: destPos,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
          
          // Ajuster la vue pour montrer tout l'itinéraire
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(driverPos);
          bounds.extend(destPos);
          map.fitBounds(bounds, { top: 120, right: 60, bottom: 350, left: 60 });
        }
      });
    }

    function updateDriverPosition(lat, lng) {
      driverPos = { lat, lng };
      
      // Animation smooth du marqueur
      if (driverMarker) {
        driverMarker.setPosition(driverPos);
      }
      
      // Centrer la carte sur le conducteur
      map.panTo(driverPos);
      
      // Recalculer l'itinéraire restant
      calculateRoute();
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
        {/* Bouton Navigation */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleOpenMaps}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="navigation-variant" size={24} color="#4285F4" />
          <ModeBadge />
        </TouchableOpacity>

        {/* Timer Badge */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.timerBadge}
          >
            <MaterialCommunityIcons name="timer-outline" size={20} color="white" />
            <Text style={styles.timerText}>{formatElapsedTime()}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Placeholder pour équilibrer */}
        <View style={{ width: 50 }} />
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

        {/* Badge statut */}
        <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' + '15' }]}>
          <View style={styles.statusDot} />
          <MaterialCommunityIcons name="navigation" size={18} color="#4CAF50" />
          <Text style={[styles.statusText, { color: '#4CAF50' }]}>
            {t('driver.enRouteToDestination')}
          </Text>
        </View>

        {/* Statistiques */}
        <View style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}>
          <StatItem
            icon="clock-outline"
            value={estimatedTime}
            label="ETA"
            color={theme.colors.primary}
          />

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <StatItem
            icon="map-marker-distance"
            value={distance}
            label={t('driver.remaining')}
            color={theme.colors.primary}
          />

          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

          <StatItem
            icon="cash"
            value={`${ride.estimatedPrice} DH`}
            label={t('driver.price')}
            color="#4CAF50"
          />
        </View>

        {/* Carte destination */}
        <View style={[styles.destinationCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.destIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <MaterialCommunityIcons name="flag-checkered" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.destInfo}>
            <Text style={[styles.destLabel, { color: theme.colors.textSecondary }]}>
              {t('driver.destination').toUpperCase()}
            </Text>
            <Text style={[styles.destName, { color: theme.colors.text }]} numberOfLines={1}>
              {ride.destination.name}
            </Text>
            <Text style={[styles.destAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {ride.destination.address}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: '#4285F4' + '15' }]}
            onPress={handleOpenMaps}
          >
            <MaterialCommunityIcons name="directions" size={22} color="#4285F4" />
          </TouchableOpacity>
        </View>

        {/* Passagère + Contact */}
        <View style={styles.passengerRow}>
          <View style={styles.passengerInfo}>
            <View style={[styles.passengerAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.passengerInitial, { color: theme.colors.primary }]}>
                {ride.passenger.firstName[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.passengerName, { color: theme.colors.text }]}>
                {ride.passenger.firstName}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                  {ride.passenger.rating}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#4CAF50' + '15' }]}
              onPress={handleCallPassenger}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="phone" size={22} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#2196F3' + '15' }]}
              onPress={handleMessagePassenger}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="message-text" size={22} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton terminer */}
        <TouchableOpacity
          style={[styles.completeBtn, isCompleting && styles.completeBtnDisabled]}
          onPress={handleCompleteRide}
          disabled={isCompleting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeBtnGradient}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color="white" />
            <Text style={styles.completeBtnText}>
              {isCompleting ? t('common.loading') : t('driver.completeRide')}
            </Text>
          </LinearGradient>
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

  // Timer Badge
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
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
  timerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
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

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontSize: 17,
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

  // Destination Card
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
  destIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destInfo: {
    flex: 1,
    marginLeft: 14,
  },
  destLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  destName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  destAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Passenger Row
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Complete Button
  completeBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  completeBtnText: {
    color: 'white',
    fontSize: 18,
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

export default DriverRideInProgressScreen;