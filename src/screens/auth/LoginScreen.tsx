/**
 * ============================================================================
 * GO WITH SALLY - LOGIN SCREEN (MIS À JOUR v3.6)
 * ============================================================================
 * ⚠️ CORRECTIONS v3.6:
 * - Reset isLoading au montage du composant
 * - Ajout timeout de 10s pour éviter loading infini en mode hybrid
 * - Fallback vers données mock si API timeout
 * 
 * Comptes de test (Mode Offline/Hybrid):
 * ✅ VÉRIFIÉS (accès direct):
 *    • user@test.com     / test123  → Utilisatrice vérifiée
 *    • driver@test.com   / test123  → Conductrice Premium
 *    • elite@test.com    / test123  → Conductrice Elite
 *    • basic@test.com    / test123  → Conductrice Basic
 *    • admin@test.com    / test123  → Admin
 * 
 * 🆕 NON VÉRIFIÉS (flux complet):
 *    • newuser@test.com    / test123  → phone→email→gender→face
 *    • newdriver@test.com  / test123  → phone→email→gender→face→documents
 *    • nogender@test.com   / test123  → gender→face (phone+email OK)
 *    • noface@test.com     / test123  → face (phone+email+gender OK)
 * 
 * @module screens/auth/LoginScreen
 * @version 3.6.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Redux
import { login, clearError, setLoading } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';

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

const FILE_NAME = '[LoginScreen]';
const { width, height } = Dimensions.get('window');
const LOGIN_TIMEOUT_MS = 10000; // 10 secondes timeout

// ============================================================================
// TYPES
// ============================================================================

type TestAccountType = 
  | 'user' 
  | 'driver' 
  | 'elite'
  | 'basic'
  | 'admin' 
  | 'newuser' 
  | 'newdriver'
  | 'nogender'
  | 'noface';

interface TestAccountInfo {
  email: string;
  password: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  description: string;
  badge?: string;
}

// ============================================================================
// COMPTES DE TEST
// ============================================================================

// ============================================================================
// TEST ACCOUNTS - Both test (offline/mock) and production (hybrid mode)
// ============================================================================
// Note: In HYBRID mode, the app tries API first, then falls back to these mocks.
// Both test accounts (user@test.com) and production accounts (admin@gowithsally.ma)
// work in hybrid mode, allowing seamless testing with real DB credentials.

const TEST_ACCOUNTS: Record<TestAccountType, TestAccountInfo> = {
  // ✅ Comptes vérifiés (test)
  user: {
    email: 'user@test.com',
    password: 'test123',
    label: 'User',
    icon: 'account',
    color: '#4CAF50',
    description: 'Vérifiée',
  },
  driver: {
    email: 'driver@test.com',
    password: 'test123',
    label: 'Driver',
    icon: 'car',
    color: '#2196F3',
    description: 'Premium 💜',
    badge: '💜',
  },
  elite: {
    email: 'elite@test.com',
    password: 'test123',
    label: 'Elite',
    icon: 'crown',
    color: '#F59E0B',
    description: 'Elite 👑',
    badge: '👑',
  },
  basic: {
    email: 'basic@test.com',
    password: 'test123',
    label: 'Basic',
    icon: 'car-side',
    color: '#3B82F6',
    description: 'Basic 🔵',
    badge: '🔵',
  },
  admin: {
    email: 'admin@test.com',
    password: 'test123',
    label: 'Admin (Test)',
    icon: 'shield-crown',
    color: '#9C27B0',
    description: 'Test mode',
  },
  
  // 🆕 Comptes non vérifiés (pour tester le flux)
  newuser: {
    email: 'newuser@test.com',
    password: 'test123',
    label: '🆕 New User',
    icon: 'account-plus',
    color: '#FF5722',
    description: 'phone→email→gender→face',
  },
  newdriver: {
    email: 'newdriver@test.com',
    password: 'test123',
    label: '🆕 New Driver',
    icon: 'car-clock',
    color: '#E91E63',
    description: '+documents',
  },
  nogender: {
    email: 'nogender@test.com',
    password: 'test123',
    label: '⚡ Gender',
    icon: 'gender-female',
    color: '#EC4899',
    description: 'gender→face',
  },
  noface: {
    email: 'noface@test.com',
    password: 'test123',
    label: '⚡ Face',
    icon: 'face-recognition',
    color: '#8B5CF6',
    description: 'face only',
  },
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const LoginScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const { 
    isLoading: reduxIsLoading, 
    error, 
    isAuthenticated, 
    user, 
    verificationStep, 
    token,
    requiresDailyFaceCheck,
  } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // ÉTAT LOCAL POUR LE LOADING (plus fiable que Redux)
  // ==========================================================================
  const [localLoading, setLocalLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // LOGS DE DÉMARRAGE + RESET DU LOADING
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    // ⚠️ RESET du loading au montage
    dispatch(clearError());
    setLocalLoading(false);
    
    // Essayer de reset le loading Redux aussi
    try {
      dispatch(setLoading(false));
    } catch (e) {
      console.log(`${FILE_NAME} ⚠️ setLoading non disponible dans authSlice`);
    }

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
      // Nettoyer le timeout si présent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ⚠️ Le RootNavigator gère la navigation selon verificationStep
  useEffect(() => {
    if (token && user) {
      console.log(`${FILE_NAME} 🔐 Token présent`);
      console.log(`${FILE_NAME} 👤 User: ${user.firstName} (${user.role})`);
      console.log(`${FILE_NAME} 📋 verificationStep: ${verificationStep}`);
      console.log(`${FILE_NAME} 👩 genderVerified: ${user.genderVerified}`);
      console.log(`${FILE_NAME} 📸 faceEnrolled: ${user.faceEnrolled}`);
      console.log(`${FILE_NAME} 🔒 requiresDailyFaceCheck: ${requiresDailyFaceCheck}`);
      
      // Reset loading quand connecté
      setLocalLoading(false);
    }
  }, [token, user, verificationStep, requiresDailyFaceCheck]);

  // Afficher les erreurs Redux et reset loading
  useEffect(() => {
    if (error) {
      setLocalLoading(false); // ⚠️ Reset loading sur erreur
      Toast.show({
        type: 'error',
        text1: t('errors.error') || 'Erreur',
        text2: error,
      });
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  const validateEmail = useCallback(
    (value: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!value.trim()) {
        setEmailError(t('auth.emailRequired') || 'Email requis');
        return false;
      }
      if (!emailRegex.test(value)) {
        setEmailError(t('auth.emailInvalid') || 'Email invalide');
        return false;
      }
      setEmailError('');
      return true;
    },
    [t]
  );

  const validatePassword = useCallback(
    (value: string): boolean => {
      if (!value) {
        setPasswordError(t('auth.passwordRequired') || 'Mot de passe requis');
        return false;
      }
      if (value.length < 6) {
        setPasswordError(t('auth.passwordMinLength') || 'Minimum 6 caractères');
        return false;
      }
      setPasswordError('');
      return true;
    },
    [t]
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Connexion - utilise le thunk login() avec timeout
   */
  const handleLogin = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 🔐 === DÉBUT CONNEXION ===`);
    console.log(`${FILE_NAME} 📧 Email: ${email}`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      console.log(`${FILE_NAME} ❌ Validation échouée`);
      return;
    }

    // Démarrer le loading local
    setLocalLoading(true);

    // ⚠️ TIMEOUT pour éviter loading infini en mode hybrid
    timeoutRef.current = setTimeout(() => {
      console.log(`${FILE_NAME} ⏰ TIMEOUT - Arrêt du loading`);
      setLocalLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Connexion impossible',
        text2: 'Le serveur ne répond pas. Vérifiez votre connexion ou passez en mode offline.',
      });
    }, LOGIN_TIMEOUT_MS);

    try {
      const result = await dispatch(
        login({
          email: email.toLowerCase().trim(),
          password,
        })
      ).unwrap();

      // Annuler le timeout si succès
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log(`${FILE_NAME} ✅ Connexion réussie!`);
      console.log(`${FILE_NAME} 👤 User: ${result.user.firstName} (${result.user.role})`);
      console.log(`${FILE_NAME} 📋 verificationStep: ${result.verificationStep}`);
      console.log(`${FILE_NAME} 👩 genderVerified: ${result.user.genderVerified}`);
      console.log(`${FILE_NAME} 📸 faceEnrolled: ${result.user.faceEnrolled}`);
      console.log(`${FILE_NAME} 🔒 requiresDailyFaceCheck: ${result.requiresDailyFaceCheck}`);

      // Message de bienvenue personnalisé
      let welcomeMessage = `Bienvenue ${result.user.firstName}! 👋`;
      
      if (result.verificationStep !== 'complete') {
        const stepMessages: Record<string, string> = {
          phone: 'Vérifiez votre téléphone',
          email: 'Vérifiez votre email',
          gender: 'Confirmez votre identité',
          face: 'Enregistrez votre visage',
          documents: 'Uploadez vos documents',
        };
        welcomeMessage = stepMessages[result.verificationStep] || welcomeMessage;
      } else if (result.requiresDailyFaceCheck) {
        welcomeMessage = 'Vérification quotidienne requise 📸';
      }

      Toast.show({
        type: result.verificationStep === 'complete' && !result.requiresDailyFaceCheck ? 'success' : 'info',
        text1: t('common.success') || 'Succès',
        text2: welcomeMessage,
      });

      // Reset loading
      setLocalLoading(false);

    } catch (err: any) {
      console.error(`${FILE_NAME} ❌ Connexion échouée:`, err);
      
      // Annuler le timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // ⚠️ IMPORTANT: Reset loading sur erreur
      setLocalLoading(false);
    }

    console.log(`${FILE_NAME} 🔐 === FIN CONNEXION ===`);
  }, [email, password, validateEmail, validatePassword, dispatch, t]);

  /**
   * Remplir un compte de test
   */
  const fillTestAccount = useCallback((type: TestAccountType): void => {
    console.log(`${FILE_NAME} 🧪 Remplissage compte test: ${type}`);

    const account = TEST_ACCOUNTS[type];
    setEmail(account.email);
    setPassword(account.password);
    setEmailError('');
    setPasswordError('');

    Toast.show({
      type: 'info',
      text1: `${account.label} ${account.badge || ''}`,
      text2: account.description,
      visibilityTime: 2000,
    });
  }, []);

  const showTestAccountsInfo = useCallback((): void => {
    Alert.alert(
      '🧪 Comptes de Test',
      `✅ VÉRIFIÉS (accès direct):\n` +
      `• user@test.com (utilisatrice)\n` +
      `• driver@test.com (💜 Premium)\n` +
      `• elite@test.com (👑 Elite)\n` +
      `• basic@test.com (🔵 Basic)\n` +
      `• admin@test.com\n\n` +
      `🆕 NON VÉRIFIÉS (flux complet):\n` +
      `• newuser@test.com\n` +
      `  → phone→email→gender→face\n` +
      `• newdriver@test.com\n` +
      `  → +documents\n` +
      `• nogender@test.com\n` +
      `  → gender→face\n` +
      `• noface@test.com\n` +
      `  → face only\n\n` +
      `🔑 Password: test123`,
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  const handleForgotPassword = useCallback((): void => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  const handleRegister = useCallback((): void => {
    navigation.navigate('Register');
  }, [navigation]);

  const handleDriverRegister = useCallback((): void => {
    navigation.navigate('DriverRegister');
  }, [navigation]);

  const handleSocialLogin = useCallback(
    (provider: string): void => {
      Toast.show({
        type: 'info',
        text1: provider,
        text2: t('common.comingSoon') || 'Bientôt disponible',
      });
    },
    [t]
  );

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    const getBadgeText = () => {
      if (IS_OFFLINE) return 'MODE TEST';
      if (IS_HYBRID) return 'MODE HYBRIDE';
      return 'MODE API';
    };

    return (
      <TouchableOpacity
        style={[
          styles.modeBadge,
          {
            backgroundColor: getBadgeColor() + '20',
            borderColor: getBadgeColor(),
          },
        ]}
        onPress={IS_OFFLINE || IS_HYBRID ? showTestAccountsInfo : undefined}
        activeOpacity={0.7}
      >
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>{getBadgeText()}</Text>
      </TouchableOpacity>
    );
  };

  // ==========================================================================
  // RENDU - Utilise localLoading au lieu de reduxIsLoading
  // ==========================================================================

  const isLoading = localLoading; // ⚠️ Utiliser le state local

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Arrière-plan dégradé */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
        style={styles.gradient}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="car-side" size={50} color="white" />
          </View>

          <Text style={[styles.appName, { color: theme.colors.primary }]}>Go With Sally</Text>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('auth.welcome') || 'Bienvenue'}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.welcomeSubtitle') || 'Connectez-vous pour continuer'}
          </Text>

          <ModeBadge />
        </Animated.View>

        {/* ================================================================ */}
        {/* FORMULAIRE */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Champ Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              {t('auth.email') || 'Email'}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: emailError ? '#F44336' : theme.colors.border,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={22}
                color={emailError ? '#F44336' : theme.colors.textSecondary}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={t('auth.emailPlaceholder') || 'votre@email.com'}
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Champ Mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              {t('auth.password') || 'Mot de passe'}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: passwordError ? '#F44336' : theme.colors.border,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={22}
                color={passwordError ? '#F44336' : theme.colors.textSecondary}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={t('auth.passwordPlaceholder') || '••••••••'}
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Mot de passe oublié */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={[styles.forgotPasswordContainer, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}
            disabled={isLoading}
          >
            <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
              {t('auth.forgotPassword') || 'Mot de passe oublié ?'}
            </Text>
          </TouchableOpacity>

          {/* Bouton Connexion */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={22} color="white" />
                <Text style={styles.loginButtonText}>{t('auth.login') || 'Se connecter'}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ================================================================ */}
        {/* COMPTES DE TEST */}
        {/* ================================================================ */}
        {(IS_OFFLINE || IS_HYBRID) && (
          <Animated.View style={[styles.testAccountsContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.testAccountsTitle, { color: theme.colors.textSecondary }]}>
              🧪 {t('auth.quickLogin') || 'Connexion rapide'}
            </Text>

            {/* Rangée 1: Comptes vérifiés */}
            <View style={styles.testButtonsRow}>
              {(['user', 'driver', 'admin'] as TestAccountType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.testButton, { backgroundColor: TEST_ACCOUNTS[type].color }]}
                  onPress={() => fillTestAccount(type)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={TEST_ACCOUNTS[type].icon} size={16} color="white" />
                  <Text style={styles.testButtonText}>{TEST_ACCOUNTS[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rangée 2: Conductrices avec badges */}
            <View style={[styles.testButtonsRow, { marginTop: 8 }]}>
              {(['elite', 'basic'] as TestAccountType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.testButton, { backgroundColor: TEST_ACCOUNTS[type].color }]}
                  onPress={() => fillTestAccount(type)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.testButtonEmoji}>{TEST_ACCOUNTS[type].badge}</Text>
                  <Text style={styles.testButtonText}>{TEST_ACCOUNTS[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Séparateur */}
            <View style={styles.testDivider}>
              <View style={[styles.testDividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.testDividerText, { color: theme.colors.textSecondary }]}>
                🆕 Flux de vérification
              </Text>
              <View style={[styles.testDividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Rangée 3: Comptes non vérifiés */}
            <View style={styles.testButtonsRow}>
              {(['newuser', 'newdriver'] as TestAccountType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.testButton, styles.testButtonWide, { backgroundColor: TEST_ACCOUNTS[type].color }]}
                  onPress={() => fillTestAccount(type)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={TEST_ACCOUNTS[type].icon} size={16} color="white" />
                  <View style={styles.testButtonTextContainer}>
                    <Text style={styles.testButtonText}>{TEST_ACCOUNTS[type].label}</Text>
                    <Text style={styles.testButtonSubtext}>{TEST_ACCOUNTS[type].description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rangée 4: Tests spécifiques */}
            <View style={[styles.testButtonsRow, { marginTop: 8 }]}>
              {(['nogender', 'noface'] as TestAccountType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.testButton, styles.testButtonWide, { backgroundColor: TEST_ACCOUNTS[type].color }]}
                  onPress={() => fillTestAccount(type)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={TEST_ACCOUNTS[type].icon} size={16} color="white" />
                  <View style={styles.testButtonTextContainer}>
                    <Text style={styles.testButtonText}>{TEST_ACCOUNTS[type].label}</Text>
                    <Text style={styles.testButtonSubtext}>{TEST_ACCOUNTS[type].description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info box */}
            <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons name="information" size={16} color={theme.colors.primary} />
              <Text style={[styles.infoBoxText, { color: theme.colors.primary }]}>
                Testez le flux complet: phone → email → gender → face → (documents)
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('auth.noAccount') || "Pas de compte ?"}
          </Text>
          <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
            <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
              {t('auth.createAccount') || "S'inscrire"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lien conductrice */}
        <TouchableOpacity 
          style={styles.driverRegisterLink}
          onPress={handleDriverRegister}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="car" size={18} color={theme.colors.primary} />
          <Text style={[styles.driverRegisterText, { color: theme.colors.primary }]}>
            {t('auth.becomeDriver') || 'Devenir conductrice Sally'}
          </Text>
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
            {t('auth.orContinueWith') || 'ou continuer avec'}
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* Connexion sociale */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialLogin('Google')}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialLogin('Facebook')}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="facebook" size={24} color="#4267B2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialLogin('Apple')}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="apple" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        {/* Mention légale */}
        <Text style={[styles.legalText, { color: theme.colors.textSecondary }]}>
          {t('auth.agreeToTerms') || 'En continuant, vous acceptez nos'}{' '}
          <Text style={{ color: theme.colors.primary }}>{t('auth.termsOfService') || 'CGU'}</Text>{' '}
          {t('auth.and') || 'et'}{' '}
          <Text style={{ color: theme.colors.primary }}>{t('auth.privacyPolicy') || 'Politique de confidentialité'}</Text>
        </Text>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },

  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    gap: 6,
  },
  modeBadgeEmoji: {
    fontSize: 14,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Form
  formContainer: {
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputWrapper: {
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },

  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginTop: 6,
  },

  forgotPasswordContainer: {
    marginBottom: 20,
  },

  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  // Test Accounts
  testAccountsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  testAccountsTitle: {
    fontSize: 14,
    marginBottom: 12,
  },

  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },

  testButtonWide: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  testButtonEmoji: {
    fontSize: 14,
  },

  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },

  testButtonTextContainer: {
    alignItems: 'flex-start',
  },

  testButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '400',
  },

  testDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },

  testDividerLine: {
    flex: 1,
    height: 1,
  },

  testDividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },

  infoBoxText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },

  footerText: {
    fontSize: 14,
  },

  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  driverRegisterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },

  driverRegisterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
  },

  // Social
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
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

  // Legal
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default LoginScreen;