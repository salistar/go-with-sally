/**
 * ============================================================================
 * GO WITH SALLY - RIDE IN PROGRESS SCREEN (PASSENGER)
 * ============================================================================
 * Écran de course en cours avec carte Google Maps (WebView)
 * 
 * Fonctionnalités:
 * - Carte Google Maps avec suivi en temps réel
 * - Statuts de course animés
 * - Contact conductrice (appel/message)
 * - Bouton SOS d'urgence
 * - Partage du trajet
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/RideInProgressScreen
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
  Linking,
  Share,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { rideAPI } from '../../services/api';

// Socket (pour le mode ONLINE)
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

const FILE_NAME = '[RideInProgressScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

// Statuts de course
type RideStatus = 'driver_arriving' | 'driver_arrived' | 'ride_started' | 'ride_completed';

// Mock driver par défaut
const MOCK_DRIVER = {
  id: 'driver_001',
  firstName: 'Amina',
  lastName: 'El Amrani',
  phone: '+212600000001',
  rating: 4.9,
  totalRides: 542,
  vehicle: {
    brand: 'Dacia',
    model: 'Logan',
    color: 'Blanc',
    plateNumber: '12345-A-1',
  },
  location: { latitude: 33.996, longitude: -6.718 },
  estimatedArrival: 3,
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const RideInProgressScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const { on, off, isConnected } = useSocket();

  // Paramètres de la route
  const driver = route.params?.driver || MOCK_DRIVER;
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
  const rideId = route.params?.rideId;

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🚗 Conductrice: ${driver.firstName}`);
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

  const [rideStatus, setRideStatus] = useState<RideStatus>('driver_arriving');
  const [estimatedArrival, setEstimatedArrival] = useState<number>(driver.estimatedArrival || 3);
  const [driverLocation, setDriverLocation] = useState(driver.location);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animation d'entrée du bottom sheet
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

    // Animation pulse pour le statut
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Démarrer le suivi selon le mode
    if (IS_OFFLINE) {
      simulateRide();
    } else if (IS_HYBRID) {
      setupSocketListeners();
      simulateRide(); // Fallback simulation
    } else {
      setupSocketListeners();
    }

    return () => {
      if (!IS_OFFLINE) {
        cleanupSocketListeners();
      }
    };
  }, []);

  // ==========================================================================
  // SOCKET LISTENERS
  // ==========================================================================

  const setupSocketListeners = () => {
    console.log(`${FILE_NAME} 🔌 Configuration des listeners socket`);

    on('driver:location', (data: any) => {
      console.log(`${FILE_NAME} 📍 Position conductrice mise à jour`);
      setDriverLocation(data.location);
      updateDriverPosition(data.location);
    });

    on('ride:status', (data: any) => {
      console.log(`${FILE_NAME} 📊 Statut course: ${data.status}`);
      handleStatusUpdate(data.status);
    });

    on('ride:arrived', () => {
      console.log(`${FILE_NAME} ✅ Conductrice arrivée`);
      setRideStatus('driver_arrived');
      updateMapStatus('arrived');
    });

    on('ride:started', () => {
      console.log(`${FILE_NAME} 🚀 Course démarrée`);
      setRideStatus('ride_started');
      updateMapStatus('started');
    });

    on('ride:completed', (data: any) => {
      console.log(`${FILE_NAME} 🎉 Course terminée`);
      handleRideCompleted(data);
    });
  };

  const cleanupSocketListeners = () => {
    off('driver:location');
    off('ride:status');
    off('ride:arrived');
    off('ride:started');
    off('ride:completed');
  };

  const handleStatusUpdate = (status: string) => {
    switch (status) {
      case 'arrived':
        setRideStatus('driver_arrived');
        updateMapStatus('arrived');
        Toast.show({
          type: 'success',
          text1: t('ride.driverArrived'),
          text2: t('ride.meetYourDriver'),
        });
        break;
      case 'started':
        setRideStatus('ride_started');
        updateMapStatus('started');
        Toast.show({
          type: 'info',
          text1: t('ride.rideStarted'),
          text2: t('ride.enjoyYourRide'),
        });
        break;
      case 'completed':
        setRideStatus('ride_completed');
        break;
    }
  };

  const handleRideCompleted = (data: any) => {
    Toast.show({
      type: 'success',
      text1: t('ride.arrived'),
    });

    navigation.replace('RideCompleted', {
      driver,
      pickup,
      destination,
      price: data?.fare || price,
      duration: data?.duration || '18 min',
      distance: data?.distance || '5.2 km',
      rideId,
    });
  };

  // ==========================================================================
  // SIMULATION (OFFLINE/HYBRID)
  // ==========================================================================

  const simulateRide = () => {
    console.log(`${FILE_NAME} 🎮 Démarrage simulation`);

    // Phase 1: Conductrice arrive (5 sec)
    setTimeout(() => {
      console.log(`${FILE_NAME} 📍 Conductrice arrivée (simulation)`);
      setRideStatus('driver_arrived');
      updateMapStatus('arrived');
      Toast.show({
        type: 'success',
        text1: t('ride.driverArrived'),
        text2: t('ride.meetYourDriver'),
      });
    }, 5000);

    // Phase 2: Course démarre (10 sec)
    setTimeout(() => {
      console.log(`${FILE_NAME} 🚀 Course démarrée (simulation)`);
      setRideStatus('ride_started');
      updateMapStatus('started');
      Toast.show({
        type: 'info',
        text1: t('ride.rideStarted'),
        text2: t('ride.enjoyYourRide'),
      });
    }, 10000);

    // Phase 3: Arrivée (25 sec)
    setTimeout(() => {
      console.log(`${FILE_NAME} 🎉 Arrivée destination (simulation)`);
      setRideStatus('ride_completed');
      Toast.show({
        type: 'success',
        text1: t('ride.arrived'),
      });

      navigation.replace('RideCompleted', {
        driver,
        pickup,
        destination,
        price,
        duration: '18 min',
        distance: '5.2 km',
        rideId,
      });
    }, 25000);
  };

  // ==========================================================================
  // MAP FUNCTIONS
  // ==========================================================================

  const updateMapStatus = (status: string) => {
    webViewRef.current?.injectJavaScript(`
      updateRideStatus('${status}');
      true;
    `);
  };

  const updateDriverPosition = (location: { latitude: number; longitude: number }) => {
    webViewRef.current?.injectJavaScript(`
      updateDriverPosition(${location.latitude}, ${location.longitude});
      true;
    `);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleCallDriver = async () => {
    console.log(`${FILE_NAME} 📞 Appel conductrice`);
    if (driver.phone) {
      try {
        await Linking.openURL(`tel:${driver.phone}`);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('errors.callFailed'),
        });
      }
    } else {
      Toast.show({
        type: 'info',
        text1: t('common.comingSoon'),
      });
    }
  };

  const handleMessageDriver = () => {
    console.log(`${FILE_NAME} 💬 Message conductrice`);
    navigation.navigate('Chat', {
      recipientId: driver.id,
      recipientName: `${driver.firstName} ${driver.lastName?.charAt(0)}.`,
    });
  };

  const handleSOS = async () => {
    console.log(`${FILE_NAME} 🆘 SOS`);

    // Appel API SOS si online
    if (!IS_OFFLINE && rideId) {
      try {
        await rideAPI.triggerSOS(rideId);
        console.log(`${FILE_NAME} ✅ SOS envoyé au serveur`);
      } catch (error) {
        console.error(`${FILE_NAME} ❌ Erreur SOS:`, error);
      }
    }

    navigation.navigate('SOS', { driver, rideId });
  };

  const handleShareTrip = async () => {
    console.log(`${FILE_NAME} 📤 Partage trajet`);
    try {
      const trackingUrl = `https://gowithsally.com/track/${rideId || 'demo'}`;
      await Share.share({
        message: t('ride.shareMessage', {
          destination: destination.name,
          driver: driver.firstName,
          url: trackingUrl,
        }),
      });
    } catch (error) {
      console.log(`${FILE_NAME} ❌ Erreur partage:`, error);
    }
  };

  const handleCancelRide = () => {
    console.log(`${FILE_NAME} ❌ Annulation course`);
    // Uniquement possible si conductrice pas encore arrivée
    if (rideStatus === 'driver_arriving') {
      navigation.navigate('CancelRide', { rideId, driver });
    }
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getStatusText = (): string => {
    switch (rideStatus) {
      case 'driver_arriving':
        return t('ride.driverArriving', { minutes: estimatedArrival });
      case 'driver_arrived':
        return t('ride.driverArrived');
      case 'ride_started':
        return t('ride.enRoute');
      case 'ride_completed':
        return t('ride.arrived');
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (rideStatus) {
      case 'driver_arriving':
        return '#2196F3';
      case 'driver_arrived':
        return '#4CAF50';
      case 'ride_started':
        return theme.colors.primary;
      case 'ride_completed':
        return '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  const getStatusIcon = (): string => {
    switch (rideStatus) {
      case 'driver_arriving':
        return 'car-clock';
      case 'driver_arrived':
        return 'car-side';
      case 'ride_started':
        return 'navigation';
      case 'ride_completed':
        return 'flag-checkered';
      default:
        return 'car';
    }
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
    let pickupMarker;
    let destinationMarker;
    let directionsService;
    let directionsRenderer;
    let currentStatus = 'arriving';
    
    const primaryColor = "${primaryColor}";
    const pickupPos = { lat: ${pickup.latitude}, lng: ${pickup.longitude} };
    const destPos = { lat: ${destination.latitude}, lng: ${destination.longitude} };
    let driverPos = { lat: ${driverLocation?.latitude || pickup.latitude}, lng: ${driverLocation?.longitude || pickup.longitude} };
    
    function initMap() {
      map = new google.maps.Map(document.getElementById("map"), {
        center: pickupPos,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: false,
        styles: ${mapStyle}
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: primaryColor,
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      // Marqueur pickup (vert)
      pickupMarker = new google.maps.Marker({
        position: pickupPos,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#4CAF50",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
        zIndex: 100
      });

      // Marqueur destination (rose)
      const destSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="' + primaryColor + '" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="8" fill="white"/></svg>';
      
      destinationMarker = new google.maps.Marker({
        position: destPos,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(destSvg),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        zIndex: 100
      });

      // Marqueur conductrice (voiture)
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

      // Tracer la route conductrice -> pickup
      calculateRoute(driverPos, pickupPos);
      animateDriverToPickup();

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function calculateRoute(origin, destination) {
      directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        }
      });
    }

    function updateDriverPosition(lat, lng) {
      driverPos = { lat, lng };
      driverMarker.setPosition(driverPos);
      map.panTo(driverPos);
    }

    function animateDriverToPickup() {
      const startLat = driverPos.lat;
      const startLng = driverPos.lng;
      const endLat = pickupPos.lat;
      const endLng = pickupPos.lng;
      let progress = 0;
      
      const interval = setInterval(() => {
        if (currentStatus !== 'arriving') {
          clearInterval(interval);
          return;
        }
        
        progress += 0.02;
        if (progress >= 1) {
          progress = 1;
          clearInterval(interval);
        }
        
        const lat = startLat + (endLat - startLat) * progress;
        const lng = startLng + (endLng - startLng) * progress;
        
        driverPos = { lat, lng };
        driverMarker.setPosition(driverPos);
      }, 100);
    }

    function animateDriverToDestination() {
      const startLat = pickupPos.lat;
      const startLng = pickupPos.lng;
      const endLat = destPos.lat;
      const endLng = destPos.lng;
      let progress = 0;
      
      calculateRoute(pickupPos, destPos);
      
      const interval = setInterval(() => {
        if (currentStatus === 'completed') {
          clearInterval(interval);
          return;
        }
        
        progress += 0.01;
        if (progress >= 1) {
          progress = 1;
          clearInterval(interval);
        }
        
        const lat = startLat + (endLat - startLat) * progress;
        const lng = startLng + (endLng - startLng) * progress;
        
        driverPos = { lat, lng };
        driverMarker.setPosition(driverPos);
        map.panTo(driverPos);
      }, 150);
    }

    function updateRideStatus(status) {
      currentStatus = status;
      
      if (status === 'arrived') {
        driverMarker.setPosition(pickupPos);
        pickupMarker.setMap(null);
        map.panTo(pickupPos);
        map.setZoom(16);
      } else if (status === 'started') {
        animateDriverToDestination();
        map.setZoom(14);
      } else if (status === 'completed') {
        driverMarker.setPosition(destPos);
        map.panTo(destPos);
        map.setZoom(16);
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
      {/* BOUTON SOS */}
      {/* ================================================================ */}
      <TouchableOpacity
        style={[styles.sosButton, { top: insets.top + 10 }]}
        onPress={handleSOS}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="shield-alert" size={22} color="white" />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

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

        {/* Badge statut */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
            <MaterialCommunityIcons
              name={getStatusIcon() as any}
              size={22}
              color={getStatusColor()}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </Animated.View>

        {/* Carte conductrice */}
        <View style={[styles.driverCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.driverRow}>
            {/* Avatar */}
            <View style={[styles.driverAvatar, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Text style={[styles.driverInitial, { color: theme.colors.primary }]}>
                {driver.firstName?.[0]?.toUpperCase() || 'C'}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {driver.firstName} {driver.lastName?.charAt(0)}.
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                  {driver.rating}
                </Text>
                <Text style={[styles.ridesCount, { color: theme.colors.textSecondary }]}>
                  • {driver.totalRides} {t('ride.rides')}
                </Text>
              </View>
            </View>

            {/* Boutons contact */}
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#4CAF5015' }]}
                onPress={handleCallDriver}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="phone" size={22} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#2196F315' }]}
                onPress={handleMessageDriver}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="message-text" size={22} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info véhicule */}
          <View style={[styles.vehicleRow, { borderTopColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="car" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.vehicleText, { color: theme.colors.text }]}>
              {driver.vehicle?.brand} {driver.vehicle?.model}
            </Text>
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor:
                    driver.vehicle?.color === 'Blanc' || driver.vehicle?.color === 'white'
                      ? '#f0f0f0'
                      : '#333',
                },
              ]}
            />
            <View style={[styles.plateBox, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.plateText, { color: theme.colors.text }]}>
                {driver.vehicle?.plateNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Trajet */}
        <View style={[styles.tripCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.tripPoint}>
            <View style={[styles.tripDot, { backgroundColor: '#4CAF50' }]}>
              <View style={styles.tripDotInner} />
            </View>
            <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
              {pickup.name || pickup.address}
            </Text>
          </View>
          <View style={[styles.tripLine, { backgroundColor: theme.colors.border }]} />
          <View style={styles.tripPoint}>
            <View style={[styles.tripDot, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="flag-checkered" size={8} color="white" />
            </View>
            <Text style={[styles.tripText, { color: theme.colors.text }]} numberOfLines={1}>
              {destination.name || destination.address}
            </Text>
            <Text style={[styles.priceText, { color: theme.colors.primary }]}>{price} DH</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShareTrip}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {t('ride.shareTrip')}
            </Text>
          </TouchableOpacity>

          {rideStatus === 'driver_arriving' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F4433615' }]}
              onPress={handleCancelRide}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={22} color="#F44336" />
              <Text style={[styles.actionText, { color: '#F44336' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
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

  // SOS
  sosButton: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sosText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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

  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Driver Card
  driverCard: {
    borderRadius: 20,
    overflow: 'hidden',
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
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  driverAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
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
  ridesCount: {
    fontSize: 13,
    marginLeft: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Vehicle
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  vehicleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  plateBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Trip Card
  tripCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  tripLine: {
    width: 2,
    height: 20,
    marginLeft: 9,
    marginVertical: 4,
  },
  tripText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default RideInProgressScreen;