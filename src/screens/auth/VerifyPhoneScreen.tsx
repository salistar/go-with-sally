/**
 * ============================================================================
 * GO WITH SALLY - VERIFY PHONE SCREEN
 * ============================================================================
 * Écran de vérification du numéro de téléphone par SMS
 * 
 * Fonctionnalités:
 * - Saisie du code à 6 chiffres
 * - Auto-focus sur le champ suivant
 * - Vérification automatique quand 6 chiffres saisis
 * - Compte à rebours pour renvoyer le code
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Design moderne avec animations
 * 
 * Code de test (Mode Offline/Hybrid): 123456
 * 
 * @module screens/auth/VerifyPhoneScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Redux
import { verifyPhone, setVerificationStep } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';

// API
import { authAPI } from '../../services/api';

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

const FILE_NAME = '[VerifyPhoneScreen]';
const SIMULATION_CODE = '123456';
const COUNTDOWN_DURATION = 60;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const VerifyPhoneScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isRTL } = useRTL();

  const { user, isLoading } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 📱 Phone: ${user?.phone}`);
    console.log(`${FILE_NAME} 🔑 Code test: ${SIMULATION_CODE}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    // Focus sur le premier input
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 500);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_DURATION);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
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

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const triggerShakeAnimation = (): void => {
    Vibration.vibrate(200);

    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleCodeChange = useCallback(
    (text: string, index: number): void => {
      setHasError(false);

      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Focus suivant
      if (text && index < 5) {
        inputs.current[index + 1]?.focus();
      }

      // Vérification auto si code complet
      if (text && index === 5) {
        const fullCode = newCode.join('');
        console.log(`${FILE_NAME} ✅ Code complet: ${fullCode}`);
        handleVerify(fullCode);
      }
    },
    [code]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number): void => {
      if (key === 'Backspace' && !code[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handleOfflineVerify = useCallback(
    async (codeToVerify: string): Promise<boolean> => {
      console.log(`${FILE_NAME} 🔐 Vérification OFFLINE`);
      console.log(`${FILE_NAME} 🔢 Code saisi: ${codeToVerify}`);

      setLocalLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLocalLoading(false);

      if (codeToVerify === SIMULATION_CODE) {
        console.log(`${FILE_NAME} ✅ Code correct!`);

        dispatch(setVerificationStep('face'));

        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('auth.phoneVerified'),
        });

        return true;
      } else {
        console.log(`${FILE_NAME} ❌ Code incorrect!`);
        return false;
      }
    },
    [dispatch, t]
  );

  const handleVerify = useCallback(
    async (fullCode?: string): Promise<void> => {
      const codeToVerify = fullCode || code.join('');
      console.log(`${FILE_NAME} 🔐 === VÉRIFICATION ===`);
      console.log(`${FILE_NAME} 🔢 Code: ${codeToVerify}`);

      if (codeToVerify.length !== 6) {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('auth.enterFullCode'),
        });
        return;
      }

      // Mode OFFLINE
      if (IS_OFFLINE) {
        console.log(`${FILE_NAME} 🔴 Mode OFFLINE`);
        const success = await handleOfflineVerify(codeToVerify);

        if (!success) {
          setHasError(true);
          triggerShakeAnimation();
          setCode(['', '', '', '', '', '']);
          inputs.current[0]?.focus();

          Toast.show({
            type: 'error',
            text1: t('errors.error'),
            text2: t('auth.invalidCode'),
          });
        }
        return;
      }

      // Mode HYBRID / ONLINE
      console.log(`${FILE_NAME} ${getModeEmoji()} Mode ${APP_MODE} - Vérification serveur...`);

      try {
        await dispatch(verifyPhone(codeToVerify)).unwrap();

        console.log(`${FILE_NAME} ✅ Vérification réussie!`);

        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('auth.phoneVerified'),
        });
      } catch (err: any) {
        console.error(`${FILE_NAME} ❌ Vérification échouée:`, err);

        // Fallback en mode HYBRID
        if (IS_HYBRID) {
          console.log(`${FILE_NAME} 🟡 Fallback vérification locale`);
          const success = await handleOfflineVerify(codeToVerify);

          if (!success) {
            setHasError(true);
            triggerShakeAnimation();
            setCode(['', '', '', '', '', '']);
            inputs.current[0]?.focus();

            Toast.show({
              type: 'error',
              text1: t('errors.error'),
              text2: t('auth.invalidCode'),
            });
          }
        } else {
          setHasError(true);
          triggerShakeAnimation();
          setCode(['', '', '', '', '', '']);
          inputs.current[0]?.focus();

          Toast.show({
            type: 'error',
            text1: t('errors.error'),
            text2: err.message || t('auth.invalidCode'),
          });
        }
      }
    },
    [code, handleOfflineVerify, dispatch, t]
  );

  const handleResend = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 📤 Renvoi du code`);

    if (countdown > 0) {
      console.log(`${FILE_NAME} ⏱️ Countdown actif: ${countdown}s`);
      return;
    }

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Simulation`);
      setCountdown(COUNTDOWN_DURATION);

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('auth.codeSent'),
      });
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API resendPhoneCode...`);
      await authAPI.resendPhoneCode();

      setCountdown(COUNTDOWN_DURATION);

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('auth.codeSent'),
      });
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur renvoi:`, error);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback simulation`);
        setCountdown(COUNTDOWN_DURATION);

        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('auth.codeSent'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('auth.resendError'),
        });
      }
    }
  }, [countdown, t]);

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
          {IS_OFFLINE ? 'TEST' : IS_HYBRID ? 'HYBRID' : 'API'}
        </Text>
      </View>
    );
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  const isFormLoading = isLoading || localLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
        style={styles.gradient}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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

      {/* Contenu */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Icône principale */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <MaterialCommunityIcons name="cellphone-message" size={50} color="white" />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('auth.verifyPhone')}
        </Text>

        {/* Sous-titre avec numéro */}
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('auth.codeSentTo')}
        </Text>
        <Text style={[styles.phoneNumber, { color: theme.colors.primary }]}>
          {user?.phone || '+212 6XX XXX XXX'}
        </Text>

        {/* Badge Mode Test */}
        {(IS_OFFLINE || IS_HYBRID) && (
          <View style={styles.testBadge}>
            <MaterialCommunityIcons name="information" size={16} color="#2196F3" />
            <Text style={styles.testBadgeText}>
              {t('auth.testCode')}: {SIMULATION_CODE}
            </Text>
          </View>
        )}

        {/* Conteneur du code avec animation shake */}
        <Animated.View
          style={[
            styles.codeContainer,
            {
              transform: [{ translateX: shakeAnimation }],
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[
                styles.codeInput,
                {
                  borderColor: hasError
                    ? '#F44336'
                    : digit
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text.replace(/[^0-9]/g, ''), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!isFormLoading}
            />
          ))}
        </Animated.View>

        {/* Bouton Vérifier */}
        <Button
          title={t('auth.verify')}
          onPress={() => handleVerify()}
          loading={isFormLoading}
          style={styles.verifyButton}
          icon="check-circle"
        />

        {/* Lien Renvoyer le code */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0}
          style={[styles.resendContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={countdown > 0 ? 'timer-sand' : 'refresh'}
            size={18}
            color={countdown > 0 ? theme.colors.textSecondary : theme.colors.primary}
          />
          <Text
            style={[
              styles.resendText,
              { color: countdown > 0 ? theme.colors.textSecondary : theme.colors.primary },
            ]}
          >
            {countdown > 0 ? `${t('auth.resendIn')} ${countdown}s` : t('auth.resendCode')}
          </Text>
        </TouchableOpacity>

        {/* Info sécurité */}
        <View style={[styles.securityInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            {t('auth.securityNotice')}
          </Text>
        </View>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </Animated.View>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },

  backButton: {
    width: 48,
    height: 48,
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

  // Contenu
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Container icône
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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

  // Titre
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Sous-titre
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Numéro de téléphone
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },

  // Badge test
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
    gap: 8,
  },

  testBadgeText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },

  // Container du code
  codeContainer: {
    gap: 10,
    marginBottom: 32,
  },

  // Input du code
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Bouton vérifier
  verifyButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 24,
  },

  // Container renvoyer
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },

  // Texte renvoyer
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Info sécurité
  securityInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 8,
  },

  securityText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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

export default VerifyPhoneScreen;