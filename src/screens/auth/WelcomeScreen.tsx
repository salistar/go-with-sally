/**
 * ============================================================================
 * GO WITH SALLY - WELCOME SCREEN
 * ============================================================================
 * Écran de bienvenue avec slides d'onboarding
 * 
 * Fonctionnalités:
 * - 4 slides de présentation de l'application
 * - Sélecteur de langue (FR, AR, EN)
 * - Navigation vers Login
 * - Pagination animée
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue complet
 * - Design moderne avec icônes et dégradés
 * 
 * @module screens/auth/WelcomeScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Components
import Button from '../../components/common/Button';

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

const FILE_NAME = '[WelcomeScreen]';
const { width, height } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface Slide {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

// ============================================================================
// DONNÉES
// ============================================================================

const slides: Slide[] = [
  {
    key: '1',
    icon: 'shield-check',
    title: 'slide1.title',
    subtitle: 'slide1.subtitle',
    color: '#FF69B4',
  },
  {
    key: '2',
    icon: 'face-recognition',
    title: 'slide2.title',
    subtitle: 'slide2.subtitle',
    color: '#FF1493',
  },
  {
    key: '3',
    icon: 'map-marker-radius',
    title: 'slide3.title',
    subtitle: 'slide3.subtitle',
    color: '#DB7093',
  },
  {
    key: '4',
    icon: 'account-group',
    title: 'slide4.title',
    subtitle: 'slide4.subtitle',
    color: '#FF69B4',
  },
];

const LANGUAGES = [
  { code: 'fr', label: '🇫🇷', name: 'Français' },
  { code: 'ar', label: '🇲🇦', name: 'العربية' },
  { code: 'en', label: '🇬🇧', name: 'English' },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const WelcomeScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 📐 RTL: ${isRTL}`);
    console.log(`${FILE_NAME} 📱 Dimensions: ${width}x${height}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Log changement de slide
  useEffect(() => {
    console.log(`${FILE_NAME} 📍 Slide: ${currentIndex + 1}/${slides.length}`);
  }, [currentIndex]);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const animateButtonPress = (): void => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleNext = useCallback((): void => {
    animateButtonPress();

    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log(`${FILE_NAME} ➡️ Slide ${nextIndex + 1}`);

      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      console.log(`${FILE_NAME} 🔗 → Login`);
      navigation.navigate('Login');
    }
  }, [currentIndex, navigation]);

  const handlePrevious = useCallback((): void => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      console.log(`${FILE_NAME} ⬅️ Slide ${prevIndex + 1}`);

      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  }, [currentIndex]);

  const handleLanguageChange = useCallback(
    (langCode: string): void => {
      console.log(`${FILE_NAME} 🌍 Langue: ${langCode}`);
      i18n.changeLanguage(langCode);

      const langName = LANGUAGES.find((l) => l.code === langCode)?.name;
      Toast.show({
        type: 'success',
        text1: langName,
        text2: langCode === 'ar' ? 'تم تغيير اللغة' : langCode === 'fr' ? 'Langue changée' : 'Language changed',
        visibilityTime: 1500,
      });
    },
    [i18n]
  );

  const handleLoginPress = useCallback((): void => {
    console.log(`${FILE_NAME} 🔗 → Login (lien)`);
    navigation.navigate('Login');
  }, [navigation]);

  const handleSkip = useCallback((): void => {
    console.log(`${FILE_NAME} ⏭️ Skip → Login`);
    navigation.navigate('Login');
  }, [navigation]);

  const handleMomentumScrollEnd = useCallback((event: any): void => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  }, []);

  const goToSlide = useCallback((index: number): void => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, []);

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
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20', borderColor: getBadgeColor() }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }): JSX.Element => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* Container de l'icône avec cercle coloré */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.color + '20',
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name={item.icon as any} size={80} color={item.color} />
        </Animated.View>

        {/* Titre du slide */}
        <Text style={[styles.slideTitle, { color: theme.colors.text }]}>
          {t(`welcome.${item.title}`)}
        </Text>

        {/* Sous-titre du slide */}
        <Text style={[styles.slideSubtitle, { color: theme.colors.textSecondary }]}>
          {t(`welcome.${item.subtitle}`)}
        </Text>
      </View>
    );
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient Background */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
        style={styles.gradient}
      />

      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            opacity: fadeAnim,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        {/* Sélecteur de langue */}
        <View style={[styles.langSelector, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;

            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langEmoji}>{lang.label}</Text>
                <Text
                  style={[
                    styles.langText,
                    { color: isSelected ? 'white' : theme.colors.textSecondary },
                  ]}
                >
                  {lang.code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mode Badge (DEV) + Skip */}
        <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {__DEV__ && <ModeBadge />}

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              {t('welcome.skip')}
            </Text>
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ================================================================ */}
      {/* SLIDES */}
      {/* ================================================================ */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        inverted={isRTL}
      />

      {/* ================================================================ */}
      {/* PAGINATION */}
      {/* ================================================================ */}
      <View style={[styles.pagination, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              style={styles.dotTouchable}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
                    width: isActive ? 28 : 10,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <Animated.View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Indicateur de progression */}
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {currentIndex + 1} / {slides.length}
        </Text>

        {/* Navigation Buttons */}
        <View style={[styles.navButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Bouton Précédent */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.prevButton, { backgroundColor: theme.colors.surface }]}
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isRTL ? 'arrow-right' : 'arrow-left'}
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          )}

          {/* Bouton Principal */}
          <Animated.View style={[styles.mainButtonContainer, { transform: [{ scale: buttonScale }] }]}>
            <Button
              title={currentIndex === slides.length - 1 ? t('welcome.start') : t('welcome.next')}
              onPress={handleNext}
              style={styles.mainButton}
              icon={currentIndex === slides.length - 1 ? 'rocket-launch' : isRTL ? 'arrow-left' : 'arrow-right'}
            />
          </Animated.View>
        </View>

        {/* Lien vers Login */}
        <TouchableOpacity
          onPress={handleLoginPress}
          style={[styles.loginLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
            {t('welcome.hasAccount')}{' '}
          </Text>
          <Text style={[styles.loginLinkText, { color: theme.colors.primary }]}>
            {t('welcome.login')}
          </Text>
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
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // Header
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  langSelector: {
    gap: 8,
  },

  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 4,
  },

  langEmoji: {
    fontSize: 14,
  },

  langText: {
    fontSize: 12,
    fontWeight: '700',
  },

  headerRight: {
    alignItems: 'center',
    gap: 12,
  },

  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },

  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Slide
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },

  slideSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Pagination
  pagination: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  dotTouchable: {
    padding: 4,
  },

  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  progressText: {
    fontSize: 12,
    marginBottom: 16,
  },

  navButtons: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  prevButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  mainButtonContainer: {
    flex: 1,
  },

  mainButton: {
    height: 56,
    borderRadius: 16,
  },

  loginLink: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },

  loginText: {
    fontSize: 14,
  },

  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default WelcomeScreen;