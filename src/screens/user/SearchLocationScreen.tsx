/**
 * ============================================================================
 * GO WITH SALLY - SEARCH LOCATION SCREEN
 * ============================================================================
 * Recherche d'adresse avec Google Places Autocomplete (via WebView)
 * 
 * Fonctionnalités:
 * - Recherche Google Places Autocomplete
 * - Favoris (Maison, Travail)
 * - Adresses récentes
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/user/SearchLocationScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  I18nManager,
  Animated,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

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

const FILE_NAME = '[SearchLocationScreen]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAhMNp4u70bsprZjUHwRvPME4JSn9O3xbk';
const isRTL = I18nManager.isRTL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Favoris simulés
const MOCK_FAVORITES = [
  {
    id: 'home',
    type: 'home' as const,
    nameKey: 'search.home',
    address: 'Rue Mohammed V, Rabat',
    lat: 33.9889,
    lng: -6.7311,
  },
  {
    id: 'work',
    type: 'work' as const,
    nameKey: 'search.work',
    address: 'Agdal, Rabat',
    lat: 33.995,
    lng: -6.85,
  },
];

// Récents simulés
const MOCK_RECENTS = [
  { id: '1', name: 'Mega Mall', address: 'Hay Riad, Rabat', lat: 33.9619, lng: -6.8478 },
  { id: '2', name: 'Gare Rabat Ville', address: 'Centre Ville', lat: 34.0175, lng: -6.8369 },
  { id: '3', name: 'Aéroport Rabat-Salé', address: 'Salé', lat: 34.0514, lng: -6.7515 },
  { id: '4', name: 'Morocco Mall', address: 'Casablanca', lat: 33.5731, lng: -7.6298 },
];

// Suggestions offline
const MOCK_SUGGESTIONS = [
  { id: 's1', name: 'Twin Center', address: 'Boulevard Zerktouni, Casablanca', lat: 33.5883, lng: -7.6192 },
  { id: 's2', name: 'Hassan II Mosque', address: 'Casablanca', lat: 33.6086, lng: -7.6328 },
  { id: 's3', name: 'Rabat Agdal', address: 'Rabat', lat: 33.9950, lng: -6.8500 },
  { id: 's4', name: 'Marrakech Medina', address: 'Marrakech', lat: 31.6295, lng: -7.9811 },
];

// ============================================================================
// INTERFACES
// ============================================================================

interface Location {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Favorite {
  id: string;
  type: 'home' | 'work';
  nameKey: string;
  address: string;
  lat: number;
  lng: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const SearchLocationScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const inputRef = useRef<TextInput>(null);

  // Paramètres
  const currentLocation = route.params?.currentLocation;
  const fieldType = route.params?.fieldType || 'destination'; // 'pickup' ou 'destination'

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 📍 Type: ${fieldType}`);
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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [showWebView, setShowWebView] = useState<boolean>(!IS_OFFLINE);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Focus sur l'input après montage
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  // Recherche offline avec debounce
  useEffect(() => {
    if (IS_OFFLINE && searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const filtered = MOCK_SUGGESTIONS.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(
          filtered.map((s) => ({
            name: s.name,
            address: s.address,
            latitude: s.lat,
            longitude: s.lng,
          }))
        );
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timer);
    } else if (IS_OFFLINE) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`${FILE_NAME} Message WebView:`, data.type);

      if (data.type === 'placeSelected') {
        navigateToConfirm({
          name: data.name,
          address: data.address,
          latitude: data.lat,
          longitude: data.lng,
        });
      } else if (data.type === 'back') {
        navigation.goBack();
      }
    } catch (e) {
      console.error(`${FILE_NAME} Erreur parsing:`, e);
    }
  };

  const navigateToConfirm = (location: Location) => {
    console.log(`${FILE_NAME} ✅ Lieu sélectionné: ${location.name}`);

    Toast.show({
      type: 'success',
      text1: location.name,
      text2: location.address,
      visibilityTime: 1500,
    });

    if (fieldType === 'pickup') {
      navigation.navigate('ConfirmRide', {
        pickup: location,
        destination: route.params?.destination,
      });
    } else {
      navigation.navigate('ConfirmRide', {
        pickup: currentLocation ? { name: t('search.myLocation'), ...currentLocation } : null,
        destination: location,
      });
    }
  };

  const handleFavorite = (fav: Favorite) => {
    console.log(`${FILE_NAME} 📍 Favori sélectionné: ${fav.id}`);
    navigateToConfirm({
      name: t(fav.nameKey),
      address: fav.address,
      latitude: fav.lat,
      longitude: fav.lng,
    });
  };

  const handleRecent = (rec: (typeof MOCK_RECENTS)[0]) => {
    console.log(`${FILE_NAME} 🕐 Récent sélectionné: ${rec.name}`);
    navigateToConfirm({
      name: rec.name,
      address: rec.address,
      latitude: rec.lat,
      longitude: rec.lng,
    });
  };

  const handleSearchResult = (location: Location) => {
    console.log(`${FILE_NAME} 🔍 Résultat sélectionné: ${location.name}`);
    navigateToConfirm(location);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
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
  // RENDER OFFLINE SEARCH
  // ==========================================================================

  const renderOfflineSearch = () => (
    <Animated.View style={[styles.offlineContainer, { opacity: fadeAnim }]}>
      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={theme.colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('search.results')}
          </Text>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleSearchResult(result)}
              activeOpacity={0.7}
            >
              <View style={[styles.resultIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultName, { color: theme.colors.text }]} numberOfLines={1}>
                  {result.name}
                </Text>
                <Text
                  style={[styles.resultAddress, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {result.address}
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
      )}

      {/* No Results */}
      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <View style={styles.noResults}>
          <MaterialCommunityIcons
            name="map-marker-off"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>
            {t('search.noResults')}
          </Text>
        </View>
      )}

      {/* Suggestions (when no search) */}
      {searchQuery.length < 2 && (
        <View style={styles.suggestionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('search.suggestions')}
          </Text>
          {MOCK_SUGGESTIONS.slice(0, 3).map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
              onPress={() =>
                handleSearchResult({
                  name: suggestion.name,
                  address: suggestion.address,
                  latitude: suggestion.lat,
                  longitude: suggestion.lng,
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.resultIcon, { backgroundColor: '#9C27B015' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#9C27B0" />
              </View>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultName, { color: theme.colors.text }]} numberOfLines={1}>
                  {suggestion.name}
                </Text>
                <Text
                  style={[styles.resultAddress, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {suggestion.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );

  // ==========================================================================
  // HTML GOOGLE PLACES
  // ==========================================================================

  const generateSearchHTML = () => {
    const lang = i18n.language === 'ar' ? 'ar' : i18n.language === 'en' ? 'en' : 'fr';
    const direction = isRTL ? 'rtl' : 'ltr';

    return `
<!DOCTYPE html>
<html dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    body {
      background: ${theme.colors.background};
      min-height: 100vh;
      direction: ${direction};
    }
    
    .search-container {
      padding: 16px;
      background: ${theme.colors.background};
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .search-box {
      display: flex;
      align-items: center;
      background: ${theme.colors.surface};
      border-radius: 16px;
      padding: 0 16px;
      height: 54px;
      gap: 12px;
    }
    
    .search-icon {
      color: ${theme.colors.primary};
      font-size: 20px;
    }
    
    #search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      color: ${theme.colors.text};
      outline: none;
      text-align: ${isRTL ? 'right' : 'left'};
    }
    
    #search-input::placeholder {
      color: ${theme.colors.textSecondary};
    }
    
    .clear-btn {
      background: none;
      border: none;
      color: ${theme.colors.textSecondary};
      font-size: 18px;
      cursor: pointer;
      padding: 8px;
      display: none;
    }
    
    .results-container {
      padding: 0 16px;
    }
    
    .result-item {
      display: flex;
      align-items: center;
      padding: 14px;
      background: ${theme.colors.surface};
      border-radius: 16px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: transform 0.1s;
      gap: 14px;
    }
    
    .result-item:active {
      transform: scale(0.98);
    }
    
    .result-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: ${theme.colors.primary}20;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.colors.primary};
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .result-info {
      flex: 1;
      min-width: 0;
    }
    
    .result-main {
      font-size: 15px;
      font-weight: 600;
      color: ${theme.colors.text};
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .result-secondary {
      font-size: 13px;
      color: ${theme.colors.textSecondary};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: ${theme.colors.text};
      padding: 16px 16px 12px;
    }
    
    .loading {
      display: none;
      text-align: center;
      padding: 30px;
      color: ${theme.colors.textSecondary};
    }
    
    .no-results {
      display: none;
      text-align: center;
      padding: 50px 20px;
      color: ${theme.colors.textSecondary};
    }
    
    .no-results-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="search-container">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        id="search-input" 
        placeholder="${t('search.placeholder')}" 
        autocomplete="off"
      />
      <button class="clear-btn" id="clear-btn" onclick="clearSearch()">✕</button>
    </div>
  </div>

  <div id="loading" class="loading">${t('common.loading')}</div>
  <div id="no-results" class="no-results">
    <div class="no-results-icon">🔍</div>
    <div>${t('search.noResults')}</div>
  </div>

  <div id="results-container" class="results-container"></div>

  <div id="default-content">
    <div class="section-title">${t('search.suggestions')}</div>
    <div class="results-container" id="suggestions"></div>
  </div>

  <script>
    let autocompleteService;
    let placesService;
    let debounceTimer;
    
    function initPlaces() {
      autocompleteService = new google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService = new google.maps.places.PlacesService(map);
      console.log('Google Places initialisé');
    }

    function searchPlaces(query) {
      if (query.length < 2) {
        document.getElementById('results-container').innerHTML = '';
        document.getElementById('default-content').style.display = 'block';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        return;
      }

      document.getElementById('default-content').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      document.getElementById('no-results').style.display = 'none';

      const request = {
        input: query,
        componentRestrictions: { country: 'ma' },
        language: '${lang}',
        ${currentLocation ? `location: new google.maps.LatLng(${currentLocation.latitude}, ${currentLocation.longitude}),
        radius: 50000,` : ''}
      };

      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        document.getElementById('loading').style.display = 'none';
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          displayResults(predictions);
        } else {
          document.getElementById('results-container').innerHTML = '';
          document.getElementById('no-results').style.display = 'block';
        }
      });
    }

    function displayResults(predictions) {
      const container = document.getElementById('results-container');
      container.innerHTML = '';
      document.getElementById('no-results').style.display = 'none';

      predictions.forEach(prediction => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = \`
          <div class="result-icon">📍</div>
          <div class="result-info">
            <div class="result-main">\${prediction.structured_formatting.main_text}</div>
            <div class="result-secondary">\${prediction.structured_formatting.secondary_text || ''}</div>
          </div>
        \`;
        div.onclick = () => selectPlace(prediction.place_id, prediction.description);
        container.appendChild(div);
      });
    }

    function selectPlace(placeId, description) {
      placesService.getDetails({ placeId, fields: ['name', 'formatted_address', 'geometry'] }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'placeSelected',
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }));
        }
      });
    }

    function clearSearch() {
      document.getElementById('search-input').value = '';
      document.getElementById('clear-btn').style.display = 'none';
      document.getElementById('results-container').innerHTML = '';
      document.getElementById('default-content').style.display = 'block';
      document.getElementById('no-results').style.display = 'none';
    }

    document.getElementById('search-input').addEventListener('input', (e) => {
      const query = e.target.value;
      document.getElementById('clear-btn').style.display = query.length > 0 ? 'block' : 'none';
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchPlaces(query);
      }, 300);
    });

    setTimeout(() => {
      document.getElementById('search-input').focus();
    }, 500);
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initPlaces"></script>
</body>
</html>
    `;
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={26}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {fieldType === 'pickup' ? t('search.pickup') : t('search.destination')}
        </Text>
        {__DEV__ ? <ModeBadge /> : <View style={styles.placeholder} />}
      </View>

      {/* Favoris rapides */}
      <View style={styles.quickAccess}>
        {MOCK_FAVORITES.map((fav) => (
          <TouchableOpacity
            key={fav.id}
            style={[styles.quickBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleFavorite(fav)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name={fav.type === 'home' ? 'home' : 'briefcase'}
                size={16}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.quickText, { color: theme.colors.text }]}>{t(fav.nameKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu principal */}
      {IS_OFFLINE ? (
        renderOfflineSearch()
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: generateSearchHTML() }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={true}
          keyboardDisplayRequiresUserAction={false}
        />
      )}

      {/* Récents en bas */}
      <View
        style={[
          styles.recentsContainer,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom + 10,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('search.recent')}</Text>
        <View style={styles.recentsRow}>
          {MOCK_RECENTS.slice(0, 4).map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={[styles.recentChip, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleRecent(rec)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="history" size={14} color={theme.colors.primary} />
              <Text style={[styles.recentText, { color: theme.colors.text }]} numberOfLines={1}>
                {rec.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mode Footer */}
      <View style={[styles.modeFooter, { paddingBottom: insets.bottom > 0 ? 0 : 10 }]}>
        <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
          {getModeEmoji()} {getModeDescription()}
        </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
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

  // Quick Access
  quickAccess: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  quickIconBg: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // WebView
  webview: {
    flex: 1,
  },

  // Offline Container
  offlineContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Search Box (Offline)
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },

  // Results
  resultsSection: {
    marginTop: 8,
  },
  suggestionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 13,
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    fontSize: 14,
    marginTop: 12,
  },

  // Recents
  recentsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  recentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  recentText: {
    fontSize: 13,
    maxWidth: 90,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default SearchLocationScreen;