/**
 * ============================================================================
 * GO WITH SALLY - Main App Entry Point
 * ============================================================================
 * Point d'entrée principal de l'application mobile
 * 
 * Providers utilisés (dans l'ordre):
 * - GestureHandlerRootView: Gestion des gestes
 * - Provider (Redux): State management global
 * - PersistGate: Persistance du state Redux
 * - SafeAreaProvider: Gestion des zones sûres (notch, etc.)
 * - ThemeProvider: Thème clair/sombre
 * - LanguageProvider: Internationalisation (i18n)
 * - NavigationContainer: Navigation React Navigation
 * - SocketProvider: WebSocket temps réel
 * 
 * @module App
 * @version 2.0.0
 * @author Go With Sally Team
 * @date Janvier 2025
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { 
  StatusBar, 
  View, 
  ActivityIndicator, 
  Text, 
  StyleSheet,
  I18nManager,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';

// Store Redux
import { store, persistor } from './src/store';

// Providers
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { SocketProvider } from './src/services/SocketContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Config
import { toastConfig } from './src/utils/toastConfig';

// Initialisation i18n
import './src/i18n';

// ============================================================================
// LOADING SCREEN
// ============================================================================

/**
 * Écran de chargement affiché pendant l'initialisation
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="white" />
    <Text style={styles.loadingText}>Go With Sally</Text>
    <Text style={styles.loadingSubtext}>Chargement...</Text>
  </View>
);

// ============================================================================
// APP CONTENT (avec accès aux contextes Theme et Language)
// ============================================================================

/**
 * Contenu principal de l'app avec thème et navigation
 */
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();

  // Configuration du thème pour React Navigation
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <>
      {/* StatusBar adaptée au thème */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />

      {/* Container de navigation */}
      <NavigationContainer theme={navigationTheme}>
        {/* Provider WebSocket pour temps réel */}
        <SocketProvider>
          <RootNavigator />
        </SocketProvider>
      </NavigationContainer>

      {/* Toast notifications */}
      <Toast config={toastConfig} />
    </>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

/**
 * Composant principal de l'application
 * Configure tous les providers dans le bon ordre
 */
const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Initialisation de l'application
     * - Préparation des ressources
     * - Configuration RTL si nécessaire
     */
    const prepareApp = async () => {
      try {
        // Log de démarrage
        console.log('🚀 [App] ════════════════════════════════════════');
        console.log('🚀 [App] Go With Sally - Démarrage');
        console.log('🚀 [App] Platform:', Platform.OS);
        console.log('🚀 [App] RTL enabled:', I18nManager.isRTL);
        console.log('🚀 [App] ════════════════════════════════════════');

        // Simuler un petit délai pour le splash screen
        await new Promise(resolve => setTimeout(resolve, 500));

        setAppIsReady(true);
      } catch (error) {
        console.error('❌ [App] Erreur initialisation:', error);
        setAppIsReady(true); // Continuer malgré l'erreur
      }
    };

    prepareApp();
  }, []);

  // Afficher l'écran de chargement pendant l'initialisation
  if (!appIsReady) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Redux Store */}
      <Provider store={store}>
        {/* Persistance Redux */}
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          {/* Safe Area (gestion du notch) */}
          <SafeAreaProvider>
            {/* Thème (clair/sombre) */}
            <ThemeProvider>
              {/* Langue (fr/ar/en) avec support RTL */}
              <LanguageProvider>
                {/* Contenu de l'app */}
                <AppContent />
              </LanguageProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF69B4', // Rose Sally
  },
  loadingText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
});

export default App;