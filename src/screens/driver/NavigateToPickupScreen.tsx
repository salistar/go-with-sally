/**
 * ============================================================================
 * GO WITH SALLY - NAVIGATE TO PICKUP SCREEN
 * ============================================================================
 * Navigation GPS vers le point de pickup (prise en charge)
 * 
 * Fonctionnalités:
 * - Carte Google Maps avec itinéraire vers le pickup
 * - ETA dynamique
 * - Contact passagère (appel, message)
 * - Bouton "Je suis arrivée"
 * - Bouton "Démarrer la course"
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * 
 * @module screens/driver/NavigateToPickupScreen
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
  ActivityIndicator,
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

const FILE_NAME = '[NavigateToPickupScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const NavigateToPickupScreen: React.FC = () => {
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
      totalRides: 23,
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
  };

  // Position initiale conductrice (un peu avant le pickup)
  const initialDriverPos = {
    latitude: ride.pickup.latitude - 0.008,
    longitude: ride.pickup.longitude + 0.005,
  };

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🚗 Ride ID: ${ride.id}`);
    console.log(`${FILE_NAME} 👤 Passagère: ${ride.passenger.firstName}`);
    console.log(`${FILE_NAME} 📍 Pickup: ${ride.pickup.name}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('3 min');
  const [distance, setDistance] = useState<string>('1.2 km');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Simulation ref
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Simulation navigation (mode dev)
    if (IS_OFFLINE || IS_HYBRID) {
      simulateNavigation();
    }

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // Animation pulse quand arrivé
  useEffect(() => {
    if (hasArrived) {
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
    }
  }, [hasArrived]);

  // ==========================================================================
  // SIMULATION
  // ==========================================================================

  const simulateNavigation = () => {
    let progress = 0;

    simulationRef.current = setInterval(() => {
      progress += 0.12;

      if (progress >= 1) {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setHasArrived(true);
        setEstimatedTime(t('driver.arrived'));
        setDistance('0 m');

        Toast.show({
          type: 'success',
          text1: t('driver.arrivedAtPickup') + ' 📍',
          text2: t('driver.waitingForPassenger'),
        });
        return;
      }

      // Mettre à jour le temps et distance estimés
      const remainingMin = Math.max(1, Math.round((1 - progress) * 3));
      const remainingDist = ((1 - progress) * 1.2).toFixed(1);
      setEstimatedTime(`${remainingMin} min`);
      setDistance(`${remainingDist} km`);

      // Mettre à jour la position sur la carte
      updateDriverPosition(progress);
    }, 2000);
  };

  const updateDriverPosition = (progress: number) => {
    if (!mapReady) return;

    const newLat = initialDriverPos.latitude + (ride.pickup.latitude - initialDriverPos.latitude) * progress;
    const newLng = initialDriverPos.longitude + (ride.pickup.longitude - initialDriverPos.longitude) * progress;

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
              ios: `comgooglemaps://?daddr=${ride.pickup.latitude},${ride.pickup.longitude}&directionsmode=driving`,
              android: `google.navigation:q=${ride.pickup.latitude},${ride.pickup.longitude}`,
            });
            if (url) {
              Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                  Linking.openURL(url);
                } else {
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup.latitude},${ride.pickup.longitude}`);
                }
              });
            }
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://?ll=${ride.pickup.latitude},${ride.pickup.longitude}&navigate=yes`;
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

  const handleArrived = async () => {
    console.log(`${FILE_NAME} 📍 Arrivée au pickup`);
    setIsLoading(true);

    try {
      // Appel API
      await driverAPI.arrivedAtPickup(ride.id);

      if (simulationRef.current) clearInterval(simulationRef.current);
      setHasArrived(true);
      setEstimatedTime(t('driver.arrived'));
      setDistance('0 m');

      Toast.show({
        type: 'success',
        text1: t('driver.arrivedAtPickup') + ' 📍',
        text2: t('driver.waitingForPassenger'),
      });
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRide = async () => {
    console.log(`${FILE_NAME} 🚀 Démarrer la course`);
    setIsLoading(true);

    try {
      // Appel API
      await driverAPI.startRide(ride.id);

      Toast.show({
        type: 'success',
        text1: t('driver.rideStarted') + ' 🚗',
        text2: t('driver.headToDestination'),
      });

      navigation.replace('DriverRideInProgress', {
        ride: {
          ...ride,
          startTime: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      t('driver.passengerNoShow'),
      t('driver.cancelBecauseNoShow'),
      [
        { text: t('driver.wait'), style: 'cancel' },
        {
          text: t('driver.cancelRide'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Appel API pour annuler
              // await driverAPI.cancelRide(ride.id, 'passenger_no_show');
              Toast.show({ type: 'info', text1: t('driver.rideCancelled') });
              navigation.navigate('DriverHome');
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message });
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
    let driverPos = { lat: ${initialDriverPos.latitude}, lng: ${initialDriverPos.longitude} };
    
    function initMap() {
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

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4CAF50',
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

      // SVG Passagère (pickup - vert)
      const pickupSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#4CAF50" stroke="white" stroke-width="3"/><g transform="translate(12, 11)" fill="white"><circle cx="12" cy="5" r="5"/><path d="M12 12c-5 0-10 2.5-10 6v4h20v-4c0-3.5-5-6-10-6z"/></g></svg>';
      
      new google.maps.Marker({
        position: pickupPos,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pickupSvg),
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 24)
        },
        zIndex: 100
      });

      // Calculer l'itinéraire
      calculateRoute();

      // Notifier React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function calculateRoute() {
      directionsService.route({
        origin: driverPos,
        destination: pickupPos,
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
          
          // Ajuster la vue
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(driverPos);
          bounds.extend(pickupPos);
          map.fitBounds(bounds, { top: 120, right: 60, bottom: 380, left: 60 });
        }
      });
    }

    function updateDriverPosition(lat, lng) {
      driverPos = { lat, lng };
      
      if (driverMarker) {
        driverMarker.setPosition(driverPos);
      }
      
      map.panTo(driverPos);
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

        {/* ETA Badge */}
        <LinearGradient
          colors={hasArrived ? ['#4CAF50', '#45a049'] : ['#FF69B4', '#FF1493']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.etaBadge}
        >
          <MaterialCommunityIcons
            name={hasArrived ? 'check-circle' : 'clock-outline'}
            size={18}
            color="white"
          />
          <Text style={styles.etaText}>{estimatedTime}</Text>
          {!hasArrived && (
            <>
              <View style={styles.etaDivider} />
              <Text style={styles.etaDistance}>{distance}</Text>
            </>
          )}
        </LinearGradient>

        {/* Bouton Fermer */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
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
        <Animated.View
          style={[
            styles.statusBadge,
            {
              backgroundColor: hasArrived ? '#4CAF50' + '15' : '#2196F3' + '15',
              transform: hasArrived ? [{ scale: pulseAnim }] : [],
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: hasArrived ? '#4CAF50' : '#2196F3' }]} />
          <MaterialCommunityIcons
            name={hasArrived ? 'account-clock' : 'navigation'}
            size={18}
            color={hasArrived ? '#4CAF50' : '#2196F3'}
          />
          <Text style={[styles.statusText, { color: hasArrived ? '#4CAF50' : '#2196F3' }]}>
            {hasArrived ? t('driver.waitingForPassenger') : t('driver.navigatingToPickup')}
          </Text>
        </Animated.View>

        {/* Carte passagère */}
        <View style={[styles.passengerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.passengerAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.passengerInitial, { color: theme.colors.primary }]}>
              {ride.passenger.firstName[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.passengerInfo}>
            <Text style={[styles.passengerName, { color: theme.colors.text }]}>
              {ride.passenger.firstName} {ride.passenger.lastName?.charAt(0)}.
            </Text>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                {ride.passenger.rating}
              </Text>
              <Text style={[styles.ridesCount, { color: theme.colors.textSecondary }]}>
                • {ride.passenger.totalRides || 23} {t('driver.rides')}
              </Text>
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

        {/* Adresse pickup */}
        <View style={[styles.addressCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.addressIcon, { backgroundColor: '#4CAF50' + '15' }]}>
            <MaterialCommunityIcons name="map-marker" size={22} color="#4CAF50" />
          </View>
          <View style={styles.addressInfo}>
            <Text style={[styles.addressLabel, { color: theme.colors.textSecondary }]}>
              {t('driver.pickup').toUpperCase()}
            </Text>
            <Text style={[styles.addressName, { color: theme.colors.text }]} numberOfLines={1}>
              {ride.pickup.name}
            </Text>
            <Text style={[styles.addressDetail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {ride.pickup.address}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: '#4285F4' + '15' }]}
            onPress={handleOpenMaps}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="directions" size={22} color="#4285F4" />
          </TouchableOpacity>
        </View>

        {/* Destination preview */}
        <View style={[styles.destPreview, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color={theme.colors.primary} />
          <Text style={[styles.destPreviewText, { color: theme.colors.textSecondary }]}>
            {t('driver.thenTo')}: {ride.destination.name}
          </Text>
          <Text style={[styles.destPrice, { color: theme.colors.primary }]}>
            {ride.estimatedPrice} DH
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.buttonsRow}>
          {hasArrived ? (
            <>
              {/* Bouton Absente */}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: '#F44336' }]}
                onPress={handleCancelRide}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="account-off" size={20} color="#F44336" />
                <Text style={styles.cancelBtnText}>{t('driver.noShow')}</Text>
              </TouchableOpacity>

              {/* Bouton Démarrer */}
              <TouchableOpacity
                style={[styles.startBtn, isLoading && styles.buttonDisabled]}
                onPress={handleStartRide}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF69B4', '#FF1493']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="play" size={22} color="white" />
                      <Text style={styles.startBtnText}>{t('driver.startRide')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* Bouton Je suis arrivée */
            <TouchableOpacity
              style={[styles.arrivedBtn, isLoading && styles.buttonDisabled]}
              onPress={handleArrived}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.arrivedBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="map-marker-check" size={22} color="white" />
                    <Text style={styles.arrivedBtnText}>{t('driver.iArrived')}</Text>
                  </>
                )}
              </LinearGradient>
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

  // ETA Badge
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
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
  etaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  etaDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  etaDistance: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
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
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ridesCount: {
    fontSize: 13,
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

  // Address Card
  addressCard: {
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
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 14,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  addressDetail: {
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

  // Destination Preview
  destPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  destPreviewText: {
    flex: 1,
    fontSize: 13,
  },
  destPrice: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  arrivedBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  arrivedBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  arrivedBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtnText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  startBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: {
    color: 'white',
    fontSize: 17,
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

export default NavigateToPickupScreen;