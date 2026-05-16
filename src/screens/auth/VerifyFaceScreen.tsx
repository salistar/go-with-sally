/**
 * ============================================================================
 * GO WITH SALLY - VERIFY FACE SCREEN
 * ============================================================================
 * Écran de vérification faciale pour confirmer l'identité
 * 
 * Fonctionnalités:
 * - Instructions avant la capture
 * - Capture de 3 photos du visage
 * - Vérification que l'utilisatrice est une femme
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Design moderne avec animations
 * 
 * @module screens/auth/VerifyFaceScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  I18nManager,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Redux
import { verifyFace, setVerificationStep } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store';

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

const FILE_NAME = '[VerifyFaceScreen]';
const { width, height } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;
const SIMULATION_DELAY = 3000;

// ============================================================================
// TYPES
// ============================================================================

type ScreenStep = 'instructions' | 'camera' | 'processing' | 'success';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const VerifyFaceScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [permission, requestPermission] = useCameraPermissions();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} 📷 Permission: ${permission?.granted ? 'Accordée' : 'Non accordée'}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    startPulseAnimation();

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [step, setStep] = useState<ScreenStep>('instructions');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureProgress, setCaptureProgress] = useState<number>(0);
  const [photosTaken, setPhotosTaken] = useState<number>(0);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // DONNÉES
  // ==========================================================================

  const tips = [
    {
      icon: 'lightbulb-outline',
      text: t('auth.goodLighting'),
    },
    {
      icon: 'eye-outline',
      text: t('auth.lookAtCamera'),
    },
    {
      icon: 'head-sync-outline',
      text: t('auth.moveSlightly'),
    },
    {
      icon: 'gender-female',
      text: t('auth.womenOnly'),
    },
  ];

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
    if (step === 'processing') {
      startRotateAnimation();
    }
    if (step === 'success') {
      startSuccessAnimation();
    }
  }, [step]);

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  const startPulseAnimation = (): void => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  };

  const startRotateAnimation = (): void => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  };

  const startSuccessAnimation = (): void => {
    Animated.spring(successAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleOfflineVerification = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 🔐 Simulation OFFLINE`);

    setStep('processing');

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setCaptureProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, SIMULATION_DELAY / 10);

    await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY));

    console.log(`${FILE_NAME} ✅ Simulation terminée`);

    setStep('success');

    Toast.show({
      type: 'success',
      text1: t('common.success'),
      text2: t('auth.faceVerified'),
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    dispatch(setVerificationStep('complete'));

    console.log(`${FILE_NAME} 🎉 Vérification complète`);
  }, [dispatch, t]);

  const startCapture = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 📷 === DÉBUT CAPTURE ===`);

    // Mode OFFLINE - Simulation
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Simulation`);
      await handleOfflineVerification();
      return;
    }

    // Mode HYBRID / ONLINE
    if (!cameraRef.current) {
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: t('auth.cameraError'),
      });
      return;
    }

    setIsCapturing(true);
    setPhotosTaken(0);

    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Capture de 3 photos...`);
      const images: string[] = [];

      for (let i = 0; i < 3; i++) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });

        if (photo?.base64) {
          images.push(`data:image/jpeg;base64,${photo.base64}`);
          setPhotosTaken(i + 1);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`${FILE_NAME} 📷 ${images.length} photos capturées`);

      setStep('processing');

      if (images.length > 0) {
        console.log(`${FILE_NAME} 📤 Envoi au serveur...`);

        try {
          const result = await dispatch(verifyFace(images[0])).unwrap();

          console.log(`${FILE_NAME} ✅ Vérification réussie!`);
          setStep('success');

          Toast.show({
            type: 'success',
            text1: t('common.success'),
            text2: t('auth.faceVerified'),
          });
        } catch (err: any) {
          console.error(`${FILE_NAME} ❌ Vérification échouée:`, err);

          // Fallback en mode HYBRID
          if (IS_HYBRID) {
            console.log(`${FILE_NAME} 🟡 Fallback simulation`);
            await handleOfflineVerification();
          } else {
            setStep('camera');
            Toast.show({
              type: 'error',
              text1: t('errors.error'),
              text2: err.message || t('auth.verificationFailed'),
            });
          }
        }
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur capture:`, error);
      setStep('camera');

      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: t('auth.captureError'),
      });
    }

    setIsCapturing(false);
    console.log(`${FILE_NAME} 📷 === FIN CAPTURE ===`);
  }, [handleOfflineVerification, dispatch, t]);

  const goToCamera = (): void => {
    console.log(`${FILE_NAME} 📷 → Étape caméra`);
    setStep('camera');
  };

  const goToInstructions = (): void => {
    console.log(`${FILE_NAME} 📋 → Étape instructions`);
    setStep('instructions');
  };

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = ({ style }: { style?: any }) => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20', borderColor: getBadgeColor() }, style]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {IS_OFFLINE ? 'SIMULATION' : IS_HYBRID ? 'HYBRID' : 'API'}
        </Text>
      </View>
    );
  };

  // ==========================================================================
  // RENDU - Permission non accordée
  // ==========================================================================

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
          style={styles.gradient}
        />

        <View style={[styles.permissionContent, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="camera-off" size={50} color="white" />
          </View>

          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            {t('auth.cameraPermissionTitle')}
          </Text>

          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            {t('auth.cameraPermissionDesc')}
          </Text>

          <Button
            title={t('auth.allowCamera')}
            onPress={requestPermission}
            style={styles.permissionButton}
            icon="camera"
          />
        </View>

        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // RENDU - Instructions
  // ==========================================================================

  if (step === 'instructions') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

        <Animated.View
          style={[
            styles.instructionsContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Icône principale */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="face-recognition" size={50} color="white" />
          </View>

          {/* Titre */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('auth.faceVerification')}
          </Text>

          {/* Sous-titre */}
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.faceVerificationSubtitle')}
          </Text>

          {/* Badge Simulation */}
          {(IS_OFFLINE || IS_HYBRID) && (
            <View style={styles.testBadge}>
              <MaterialCommunityIcons name="test-tube" size={16} color="#4CAF50" />
              <Text style={styles.testBadgeText}>{t('auth.simulationMode')}</Text>
            </View>
          )}

          {/* Liste des conseils */}
          <View style={[styles.tipsContainer, { backgroundColor: theme.colors.surface }]}>
            {tips.map((tip, index) => (
              <View key={index} style={[styles.tipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.tipIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialCommunityIcons
                    name={tip.icon as any}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={[styles.tipTitle, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {tip.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Bouton Démarrer */}
          <Button
            title={t('auth.startVerification')}
            onPress={goToCamera}
            style={styles.startButton}
            icon="camera-iris"
          />

          {/* Info sécurité */}
          <View style={styles.securityInfo}>
            <MaterialCommunityIcons name="shield-check" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
              {t('auth.faceDataSecure')}
            </Text>
          </View>
        </Animated.View>

        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // RENDU - Processing
  // ==========================================================================

  if (step === 'processing') {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
          style={styles.gradient}
        />

        <View style={[styles.processingContent, { paddingTop: insets.top }]}>
          {/* Animation de chargement */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={[styles.processingIconContainer, { borderColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="face-recognition" size={60} color={theme.colors.primary} />
            </View>
          </Animated.View>

          {/* Titre */}
          <Text style={[styles.processingTitle, { color: theme.colors.text }]}>
            {t('auth.verifyingFace')}
          </Text>

          {/* Sous-titre */}
          <Text style={[styles.processingSubtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.pleaseWait')}
          </Text>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${captureProgress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {captureProgress}%
            </Text>
          </View>

          {/* Étapes */}
          <View style={styles.stepsContainer}>
            <View style={[styles.stepRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons
                name={captureProgress >= 30 ? 'check-circle' : 'circle-outline'}
                size={20}
                color={captureProgress >= 30 ? '#4CAF50' : theme.colors.textSecondary}
              />
              <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                {t('auth.analyzingImage')}
              </Text>
            </View>
            <View style={[styles.stepRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons
                name={captureProgress >= 60 ? 'check-circle' : 'circle-outline'}
                size={20}
                color={captureProgress >= 60 ? '#4CAF50' : theme.colors.textSecondary}
              />
              <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                {t('auth.detectingFace')}
              </Text>
            </View>
            <View style={[styles.stepRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons
                name={captureProgress >= 100 ? 'check-circle' : 'circle-outline'}
                size={20}
                color={captureProgress >= 100 ? '#4CAF50' : theme.colors.textSecondary}
              />
              <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                {t('auth.verifyingIdentity')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // RENDU - Success
  // ==========================================================================

  if (step === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
          style={styles.gradient}
        />

        <View style={[styles.successContent, { paddingTop: insets.top }]}>
          {/* Animation de succès */}
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                backgroundColor: '#4CAF50',
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <MaterialCommunityIcons name="check" size={60} color="white" />
          </Animated.View>

          {/* Titre */}
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            {t('auth.verificationComplete')}
          </Text>

          {/* Sous-titre */}
          <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.welcomeToSally')}
          </Text>

          {/* Confetti */}
          <View style={styles.celebrationContainer}>
            <MaterialCommunityIcons name="party-popper" size={40} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // RENDU - Caméra
  // ==========================================================================

  return (
    <View style={styles.cameraContainer}>
      {/* Vue Caméra */}
      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        {/* Overlay */}
        <View style={styles.cameraOverlay}>
          {/* Bouton Retour */}
          <TouchableOpacity
            style={[styles.cameraBackButton, { top: insets.top + 10 }]}
            onPress={goToInstructions}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          {/* Badge Mode */}
          {__DEV__ && (
            <ModeBadge style={[styles.cameraBadge, { top: insets.top + 10 }]} />
          )}

          {/* Guide du visage */}
          <Animated.View
            style={[
              styles.faceGuide,
              {
                borderColor: isCapturing ? '#4CAF50' : theme.colors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Texte guide */}
          <View style={styles.guideTextContainer}>
            <Text style={styles.guideText}>
              {isCapturing ? t('auth.capturing') : t('auth.positionFace')}
            </Text>
            {isCapturing && (
              <Text style={styles.photoCount}>
                {t('auth.photosTaken', { count: photosTaken, total: 3 })}
              </Text>
            )}
          </View>
        </View>
      </CameraView>

      {/* Contrôles */}
      <View
        style={[
          styles.controlsContainer,
          { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Instructions */}
        <Text style={[styles.controlsText, { color: theme.colors.textSecondary }]}>
          {t('auth.tapToCapture')}
        </Text>

        {/* Bouton de capture */}
        <TouchableOpacity
          style={[
            styles.captureButton,
            {
              backgroundColor: isCapturing ? '#4CAF50' : theme.colors.primary,
              opacity: isCapturing ? 0.7 : 1,
            },
          ]}
          onPress={startCapture}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <MaterialCommunityIcons name="camera" size={36} color="white" />
          )}
        </TouchableOpacity>

        {/* Texte sous le bouton */}
        <Text style={[styles.captureHint, { color: theme.colors.textSecondary }]}>
          {isCapturing ? t('auth.holdStill') : t('auth.startCapture')}
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

  // Permission
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },

  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  permissionButton: {
    width: '80%',
    height: 56,
    borderRadius: 16,
  },

  // Instructions
  instructionsContent: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },

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

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },

  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    gap: 8,
  },

  testBadgeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },

  tipsContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },

  tipRow: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },

  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
  },

  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },

  securityText: {
    fontSize: 13,
    textAlign: 'center',
  },

  // Processing
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  processingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },

  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },

  processingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },

  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 32,
  },

  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },

  stepsContainer: {
    width: '80%',
  },

  stepRow: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  stepText: {
    fontSize: 14,
  },

  // Success
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },

  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  successSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },

  celebrationContainer: {
    marginTop: 20,
  },

  // Camera
  cameraContainer: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  cameraBackButton: {
    position: 'absolute',
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraBadge: {
    position: 'absolute',
    right: 24,
  },

  faceGuide: {
    width: 260,
    height: 340,
    borderRadius: 130,
    borderWidth: 4,
    borderStyle: 'dashed',
  },

  guideTextContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  guideText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  photoCount: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },

  controlsContainer: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },

  controlsText: {
    fontSize: 14,
    marginBottom: 20,
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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

  captureHint: {
    fontSize: 14,
    marginTop: 16,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    paddingTop: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default VerifyFaceScreen;