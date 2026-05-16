// ============================================================
// 📄 ChooseOnMapScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ChooseOnMapScreen.tsx] ▶ Module loaded')
//   • console.log('[ChooseOnMapScreen.tsx] ▶ ChooseOnMapScreen() rendered')
//   • console.log('[ChooseOnMapScreen.tsx] ▶ handleSelectLocation() called')
//   • console.log('[ChooseOnMapScreen.tsx] ▶ handleConfirmLocation() called')
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ChooseOnMapScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * ChooseOnMapScreen Component
 * Allows user to select a pickup or dropoff location on the map
 */
const ChooseOnMapScreen = ({ route }: any) => {
  console.log(`${FILE_NAME} ▶ ChooseOnMapScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const locationType = route?.params?.type || 'pickup'; // 'pickup' or 'dropoff'

  useFocusEffect(
    React.useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused for ${locationType}`);
      getCurrentLocation();
    }, [])
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error', 'Erreur'),
        text2: t('map.locationError', 'Impossible de récupérer votre localisation'),
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ) => {
    setLoadingAddress(true);
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (result.length > 0) {
        const address = `${result[0].street || ''} ${result[0].city || ''}`.trim();
        return address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapPress = async (event: any) => {
    console.log(`${FILE_NAME} ▶ handleSelectLocation() called`);

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setSelectedLocation({
      latitude,
      longitude,
      address,
    });
  };

  const handleConfirmLocation = () => {
    console.log(`${FILE_NAME} ▶ handleConfirmLocation() called`);

    if (!selectedLocation) {
      Alert.alert(
        t('map.selectLocation', 'Sélectionner un lieu'),
        t('map.selectLocationMessage', 'Veuillez sélectionner un lieu sur la carte')
      );
      return;
    }

    // Pass location back to previous screen
    navigation.navigate(route?.params?.returnScreen || 'HomeScreen', {
      [locationType === 'pickup' ? 'pickupLocation' : 'dropoffLocation']: selectedLocation,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Map */}
      {currentLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={t('map.selectedLocation', 'Lieu sélectionné')}
              pinColor={theme.colors.primary}
            />
          )}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={t('map.currentLocation', 'Ma position')}
              pinColor="#4CAF50"
            />
          )}
        </MapView>
      )}

      {/* Center Marker */}
      <View style={styles.centerMarkerContainer}>
        <MaterialCommunityIcons
          name="map-marker"
          size={32}
          color={theme.colors.primary}
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {locationType === 'pickup'
            ? t('map.choosePickup', 'Choisir le lieu de départ')
            : t('map.chooseDropoff', 'Choisir le lieu de destination')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bottom Card */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {selectedLocation && (
          <>
            <View style={styles.locationInfo}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.locationText}>
                <Text style={[styles.locationLabel, { color: theme.colors.textSecondary }]}>
                  {locationType === 'pickup'
                    ? t('map.departurePoint', 'Point de départ')
                    : t('map.arrivalPoint', 'Point d\'arrivée')}
                </Text>
                {loadingAddress ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text
                    style={[styles.locationAddress, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {selectedLocation.address ||
                      `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.confirmBtnText}>
                {t('map.confirmLocation', 'Confirmer ce lieu')}
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </>
        )}

        {!selectedLocation && (
          <View style={styles.instructionContainer}>
            <MaterialCommunityIcons
              name="map-search"
              size={32}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.instruction, { color: theme.colors.text }]}>
              {t('map.tapToSelect', 'Appuyez sur la carte pour sélectionner un lieu')}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View
        style={[
          styles.quickActions,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: theme.colors.background }]}
          onPress={() => {
            if (currentLocation) {
              setSelectedLocation(currentLocation);
            }
          }}
        >
          <MaterialCommunityIcons
            name="crosshairs"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
            {t('map.useCurrentLocation', 'Position actuelle')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  quickActions: {
    position: 'absolute',
    bottom: 180,
    right: 12,
    borderRadius: 8,
    padding: 0,
  },
  quickActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instruction: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ChooseOnMapScreen;
