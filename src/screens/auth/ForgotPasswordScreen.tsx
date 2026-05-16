/**
 * ============================================================================
 * GO WITH SALLY - FORGOT PASSWORD SCREEN
 * ============================================================================
 * Écran de récupération de mot de passe
 * 
 * Fonctionnalités:
 * - Saisie email pour récupération
 * - Envoi du lien de réinitialisation
 * - Confirmation d'envoi
 * - Option de renvoi
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * @module screens/auth/ForgotPasswordScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Components
import Button from '../../components/common/Button';

// API
import { authAPI } from '../../services/api';

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

const FILE_NAME = '[ForgotPasswordScreen]';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ForgotPasswordScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
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

  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isSent) {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isSent]);

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValue.trim()) {
      setEmailError(t('auth.emailRequired'));
      return false;
    }

    if (!emailRegex.test(emailValue)) {
      setEmailError(t('auth.emailInvalid'));
      return false;
    }

    setEmailError('');
    return true;
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSendLink = async (): Promise<void> => {
    console.log(`${FILE_NAME} 📤 Envoi lien récupération`);
    console.log(`${FILE_NAME} 📧 Email: ${email}`);

    if (!validateEmail(email)) {
      console.log(`${FILE_NAME} ❌ Validation échouée`);
      return;
    }

    setIsLoading(true);

    if (IS_OFFLINE) {
      // Mode OFFLINE - Simulation
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Simulation`);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSent(true);
      setIsLoading(false);

      Toast.show({
        type: 'success',
        text1: t('auth.resetEmailSent'),
        text2: t('auth.checkInbox'),
      });

      console.log(`${FILE_NAME} ✅ Email envoyé (simulation)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API forgotPassword`);

      await authAPI.forgotPassword(email);

      setIsSent(true);

      Toast.show({
        type: 'success',
        text1: t('auth.resetEmailSent'),
        text2: t('auth.checkInbox'),
      });

      console.log(`${FILE_NAME} ✅ Email envoyé avec succès`);
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);

      if (IS_HYBRID) {
        // Fallback simulation en mode HYBRID
        console.log(`${FILE_NAME} 🟡 Fallback simulation`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSent(true);
        Toast.show({
          type: 'success',
          text1: t('auth.resetEmailSent'),
          text2: t('auth.checkInbox'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: error.message || t('auth.resetEmailError'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async (): Promise<void> => {
    console.log(`${FILE_NAME} 🔄 Renvoi du lien`);
    setIsSent(false);
    successAnim.setValue(0);
    await handleSendLink();
  };

  const handleBackToLogin = (): void => {
    console.log(`${FILE_NAME} 🔙 Retour à la connexion`);
    navigation.navigate('Login');
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
  // RENDU
  // ==========================================================================

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {__DEV__ && <ModeBadge />}
        </View>

        {/* ================================================================ */}
        {/* CONTENU */}
        {/* ================================================================ */}
        {!isSent ? (
          // ============================================================
          // FORMULAIRE
          // ============================================================
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Icône */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={60}
                color={theme.colors.primary}
              />
            </View>

            {/* Titre */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('auth.forgotPassword')}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t('auth.forgotPasswordDesc')}
            </Text>

            {/* Champ Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                {t('auth.email')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: emailError ? '#F44336' : theme.colors.border,
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
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Bouton Envoyer */}
            <Button
              title={t('auth.sendResetLink')}
              onPress={handleSendLink}
              loading={isLoading}
              style={styles.submitButton}
              icon="send"
            />

            {/* Lien retour connexion */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isRTL ? 'arrow-right' : 'arrow-left'}
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.backToLoginText, { color: theme.colors.primary }]}>
                {t('auth.backToLogin')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          // ============================================================
          // CONFIRMATION
          // ============================================================
          <Animated.View
            style={[
              styles.content,
              {
                opacity: successAnim,
                transform: [
                  {
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Icône succès */}
            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5015' }]}>
              <MaterialCommunityIcons name="email-check" size={60} color="#4CAF50" />
            </View>

            {/* Titre */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('auth.checkYourEmail')}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t('auth.resetEmailSentTo')}
            </Text>

            {/* Email affiché */}
            <View style={[styles.emailBadge, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name="email"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.emailDisplay, { color: theme.colors.text }]}>{email}</Text>
            </View>

            {/* Instructions */}
            <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
              {t('auth.resetEmailInstructions')}
            </Text>

            {/* Bouton Renvoyer */}
            <Button
              title={t('auth.resendEmail')}
              onPress={handleResendLink}
              loading={isLoading}
              style={styles.submitButton}
              variant="outline"
              icon="refresh"
            />

            {/* Bouton retour connexion */}
            <Button
              title={t('auth.backToLogin')}
              onPress={handleBackToLogin}
              style={styles.loginButton}
              icon="login"
            />
          </Animated.View>
        )}

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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },

  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  // Input
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
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

  // Buttons
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
  },

  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
  },

  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 6,
  },

  backToLoginText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Confirmation
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
  },

  emailDisplay: {
    fontSize: 16,
    fontWeight: '600',
  },

  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default ForgotPasswordScreen;