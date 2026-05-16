/**
 * ============================================================================
 * GO WITH SALLY - FACE LOCK SCREEN
 * ============================================================================
 * Écran de vérification faciale compatible avec les 3 modes:
 * - OFFLINE: Simulation automatique (bouton manuel)
 * - HYBRID: Caméra locale + API de vérification
 * - ONLINE: Full API avec caméra
 * 
 * NOTE: FaceCamera inclut déjà FaceOverlay en interne (showGuide={true})
 * 
 * @module screens/verification/FaceLockScreen
 * @version 3.3.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Components - FaceCamera inclut FaceOverlay en interne
import FaceCamera from '../../components/verification/FaceCamera';

// Hooks
import { useFaceVerification } from '../../hooks/useFaceVerification';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { verifyFace, logout } from '../../store/slices/authSlice';

// Config
import { IS_OFFLINE, IS_HYBRID, IS_ONLINE, getModeEmoji } from '../../config/appMode';

// Theme
import { useTheme } from '../../utils/ThemeContext';

// Types
import { FaceVerificationStatus, FaceData } from '../../types/verification';

// ============================================================================
// TYPES
// ============================================================================

interface FaceLockScreenProps {
  onVerificationSuccess?: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FILE_NAME = '[FaceLockScreen]';

// ============================================================================
// COMPONENT
// ============================================================================

const FaceLockScreen: React.FC<FaceLockScreenProps> = ({
  onVerificationSuccess,
  onSkip,
  allowSkip = false,
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const isRTL = i18n.language === 'ar';
  
  // Redux state
  const { isLoading: reduxLoading, error: reduxError, user } = useAppSelector((state) => state.auth);
  
  // Hook de vérification faciale (pour modes HYBRID/ONLINE)
  const {
    isVerified: hookVerified,
    isVerifying: hookVerifying,
    isLocked: hookLocked,
    failedAttempts,
    remainingAttempts,
    lockUntil,
    error: hookError,
    status: hookStatus,
    verify: hookVerify,
    reset: hookReset,
  } = useFaceVerification();
  
  // =========================================================================
  // STATE
  // =========================================================================
  
  // Status local unifié (type FaceVerificationStatus)
  const [localStatus, setLocalStatus] = useState<FaceVerificationStatus>('idle');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  
  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================
  
  // Status unifié pour FaceCamera (combine local et hook selon le mode)
  const cameraStatus: FaceVerificationStatus = IS_OFFLINE 
    ? localStatus 
    : (hookStatus as FaceVerificationStatus) || localStatus;
  
  const isVerified = IS_OFFLINE 
    ? localStatus === 'success' 
    : (hookVerified || localStatus === 'success');
    
  const isVerifying = IS_OFFLINE 
    ? localStatus === 'verifying' 
    : (hookVerifying || localStatus === 'verifying');
    
  const isLocked = IS_OFFLINE 
    ? localStatus === 'locked' 
    : (hookLocked || localStatus === 'locked');
    
  const currentError = IS_OFFLINE ? errorMessage : (hookError || errorMessage);
  
  // =========================================================================
  // EFFECTS
  // =========================================================================
  
  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Init - Mode: ${IS_OFFLINE ? 'OFFLINE' : IS_HYBRID ? 'HYBRID' : 'ONLINE'}`);
    console.log(`${FILE_NAME} 👤 User: ${user?.firstName || 'N/A'}`);
  }, []);
  
  // Animation de succès
  useEffect(() => {
    if (isVerified) {
      console.log(`${FILE_NAME} ✅ Vérification réussie!`);
      Vibration.vibrate([0, 100, 50, 100]);
      
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]).start(() => {
        console.log(`${FILE_NAME} 🚀 Callback onVerificationSuccess`);
        onVerificationSuccess?.();
      });
    }
  }, [isVerified, successAnim, onVerificationSuccess]);
  
  // Animation d'erreur
  useEffect(() => {
    if (currentError) {
      setShowError(true);
      setErrorMessage(currentError);
      Vibration.vibrate(200);
      
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => setShowError(false), 3000);
    }
  }, [currentError, shakeAnim]);
  
  // Countdown pour le lock
  useEffect(() => {
    if (isLocked && lockUntil) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 1000));
        setLockCountdown(remaining);
        
        if (remaining === 0) {
          hookReset?.();
          setLocalStatus('idle');
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockUntil, hookReset]);
  
  // Animation de pulsation pendant la vérification
  useEffect(() => {
    if (localStatus === 'verifying' || localStatus === 'detecting' || isVerifying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [localStatus, isVerifying, pulseAnim]);
  
  // =========================================================================
  // HANDLERS
  // =========================================================================
  
  /**
   * Callback appelé par FaceCamera quand un visage est détecté
   */
  const handleFaceDetected = useCallback((faces: FaceData[]) => {
    if (isProcessing || isVerifying || isVerified || isLocked) {
      return;
    }
    
    if (faces.length > 0) {
      console.log(`${FILE_NAME} 👤 Face detected - ID: ${faces[0].faceID}`);
      if (localStatus === 'idle') {
        setLocalStatus('detecting');
      }
    }
  }, [isProcessing, isVerifying, isVerified, isLocked, localStatus]);
  
  /**
   * Callback appelé par FaceCamera quand une photo est capturée
   */
  const handleCapture = useCallback(async (photo: { uri: string; base64?: string }) => {
    if (isProcessing || isVerifying || isVerified || isLocked) {
      return;
    }
    
    console.log(`${FILE_NAME} 📸 Photo capturée`);
    setIsProcessing(true);
    setLocalStatus('verifying');
    
    try {
      if (IS_HYBRID) {
        // ============================================
        // MODE HYBRID: Caméra locale + API
        // ============================================
        console.log(`${FILE_NAME} 🔄 Mode HYBRID - API + Local`);
        
        if (hookVerify) {
          await hookVerify(photo.base64 ? [1] : []);
        }
        
        await dispatch(verifyFace(photo.uri)).unwrap();
        
      } else if (IS_ONLINE) {
        // ============================================
        // MODE ONLINE: Full API
        // ============================================
        console.log(`${FILE_NAME} 🌐 Mode ONLINE - Full API`);
        
        if (hookVerify) {
          await hookVerify(photo.base64 ? [1] : []);
        }
        
        await dispatch(verifyFace(photo.uri)).unwrap();
      }
      
      setLocalStatus('success');
      
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur vérification:`, error);
      setLocalStatus('failed');
      setErrorMessage(error.message || t('verification.errors.verificationFailed') || 'Échec de la vérification');
      
      setTimeout(() => {
        setLocalStatus('idle');
        setIsProcessing(false);
      }, 2000);
    }
  }, [isProcessing, isVerifying, isVerified, isLocked, dispatch, hookVerify, t]);
  
  /**
   * Démarrage manuel du scan (pour mode OFFLINE)
   */
  const handleStartScan = useCallback(async () => {
    console.log(`${FILE_NAME} 👆 Démarrage scan manuel - Mode OFFLINE`);
    setLocalStatus('detecting');
    setOfflineProgress(0);
    
    // Simuler détection
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLocalStatus('verifying');
    
    try {
      // Simuler une progression
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setOfflineProgress(i);
      }
      
      // Simuler le délai de vérification
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dispatch Redux pour mettre à jour le state
      await dispatch(verifyFace('offline_face_' + Date.now())).unwrap();
      
      setLocalStatus('success');
      console.log(`${FILE_NAME} ✅ Mode OFFLINE - Succès`);
      
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur vérification OFFLINE:`, error);
      setLocalStatus('failed');
      setErrorMessage(error.message || 'Échec de la vérification');
      
      setTimeout(() => {
        setLocalStatus('idle');
        setOfflineProgress(0);
      }, 2000);
    }
  }, [dispatch]);
  
  /**
   * Réessayer
   */
  const handleRetry = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Retry`);
    setLocalStatus('idle');
    setOfflineProgress(0);
    setShowError(false);
    setErrorMessage('');
    setIsProcessing(false);
    hookReset?.();
  }, [hookReset]);
  
  /**
   * Skip
   */
  const handleSkip = useCallback(() => {
    console.log(`${FILE_NAME} ⏭️ Skip`);
    if (allowSkip && onSkip) {
      onSkip();
    }
  }, [allowSkip, onSkip]);
  
  /**
   * Logout
   */
  const handleLogout = useCallback(() => {
    console.log(`${FILE_NAME} 🚪 Logout`);
    dispatch(logout());
  }, [dispatch]);
  
  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  
  const renderStatus = () => {
    // Locked
    if (isLocked) {
      const minutes = Math.floor(lockCountdown / 60);
      const seconds = lockCountdown % 60;
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="lock-closed" size={24} color="#E74C3C" />
          <Text style={styles.lockedText}>
            {t('verification.accountLocked') || 'Compte temporairement verrouillé'}
          </Text>
          <Text style={styles.countdownText}>
            {t('verification.tryAgainIn', { time: `${minutes}:${seconds.toString().padStart(2, '0')}` }) || 
              `Réessayez dans ${minutes}:${seconds.toString().padStart(2, '0')}`}
          </Text>
        </View>
      );
    }
    
    // Success
    if (isVerified) {
      return (
        <Animated.View 
          style={[
            styles.statusContainer,
            { opacity: successAnim, transform: [{ scale: successAnim }] }
          ]}
        >
          <Ionicons name="checkmark-circle" size={48} color="#27AE60" />
          <Text style={styles.successText}>
            {t('verification.faceVerified') || 'Visage vérifié!'}
          </Text>
        </Animated.View>
      );
    }
    
    // Verifying
    if (isVerifying || localStatus === 'verifying') {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            {t('verification.verifying') || 'Vérification en cours...'}
          </Text>
          {IS_OFFLINE && offlineProgress > 0 && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${offlineProgress}%` }]} />
            </View>
          )}
        </View>
      );
    }
    
    // Detecting
    if (localStatus === 'detecting') {
      return (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: '#3498DB' }]}>
            {t('verification.faceDetected') || 'Visage détecté...'}
          </Text>
        </View>
      );
    }
    
    // Failed / Error
    if (localStatus === 'failed' || localStatus === 'error') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="close-circle" size={32} color="#E74C3C" />
          <Text style={styles.errorStatusText}>
            {errorMessage || t('verification.errors.verificationFailed') || 'Échec de la vérification'}
          </Text>
        </View>
      );
    }
    
    // Idle
    return (
      <View style={styles.statusContainer}>
        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
          {t('verification.positionFace') || 'Positionnez votre visage dans le cadre'}
        </Text>
        {failedAttempts > 0 && (
          <Text style={styles.attemptsText}>
            {t('verification.remainingAttempts', { count: remainingAttempts }) || 
              `${remainingAttempts} tentative(s) restante(s)`}
          </Text>
        )}
      </View>
    );
  };
  
  const renderModeIndicator = () => (
    <View style={[styles.modeIndicator, { 
      backgroundColor: IS_OFFLINE ? '#EF444420' : IS_HYBRID ? '#F59E0B20' : '#10B98120',
      borderColor: IS_OFFLINE ? '#EF4444' : IS_HYBRID ? '#F59E0B' : '#10B981',
    }]}>
      <Text style={styles.modeEmoji}>{getModeEmoji()}</Text>
      <Text style={[styles.modeText, { 
        color: IS_OFFLINE ? '#EF4444' : IS_HYBRID ? '#F59E0B' : '#10B981' 
      }]}>
        {IS_OFFLINE ? 'TEST' : IS_HYBRID ? 'HYBRID' : 'ONLINE'}
      </Text>
    </View>
  );
  
  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A2E' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
        </TouchableOpacity>
        
        <Text style={[styles.title, isRTL && styles.rtlText]}>
          {t('verification.faceVerification') || 'Vérification faciale'}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
          {t('verification.faceVerificationDescription') || 'Regardez la caméra pour vérifier votre identité'}
        </Text>
        
        {renderModeIndicator()}
      </View>
      
      {/* Camera Area */}
      <Animated.View 
        style={[
          styles.cameraContainer,
          { transform: [{ translateX: shakeAnim }, { scale: pulseAnim }] }
        ]}
      >
        {isLocked ? (
          // Locked state
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={64} color="#E74C3C" />
          </View>
        ) : isVerified ? (
          // Success state
          <View style={styles.successOverlay}>
            <Animated.View style={{ transform: [{ scale: successAnim }] }}>
              <Ionicons name="checkmark-circle" size={100} color="#27AE60" />
            </Animated.View>
          </View>
        ) : IS_OFFLINE ? (
          // ============================================
          // OFFLINE MODE - Simulated camera
          // ============================================
          <View style={styles.offlineCameraPlaceholder}>
            <MaterialCommunityIcons 
              name="face-recognition" 
              size={80} 
              color={localStatus === 'verifying' || localStatus === 'detecting' ? theme.colors.primary : '#666'} 
            />
            {localStatus === 'verifying' && (
              <Text style={styles.offlineProgressText}>{offlineProgress}%</Text>
            )}
            {localStatus === 'detecting' && (
              <Text style={styles.offlineDetectingText}>Détection...</Text>
            )}
            <Text style={styles.offlineModeText}>Mode Test</Text>
          </View>
        ) : (
          // ============================================
          // HYBRID / ONLINE MODE - Real camera
          // ============================================
          <FaceCamera
            onFaceDetected={handleFaceDetected}
            onCapture={handleCapture}
            status={cameraStatus}
            isProcessing={isProcessing}
            showGuide={true}
            autoCapture={true}
            autoCaptureDelay={3000}
          />
        )}
      </Animated.View>
      
      {/* Status */}
      {renderStatus()}
      
      {/* Error Toast */}
      {showError && currentError && (
        <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <Ionicons name="alert-circle" size={20} color="#E74C3C" />
          <Text style={styles.errorText}>
            {currentError}
          </Text>
        </Animated.View>
      )}
      
      {/* Actions */}
      <View style={styles.actionsContainer}>
        {/* Offline mode - Manual start button */}
        {IS_OFFLINE && localStatus === 'idle' && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleStartScan}
          >
            <MaterialCommunityIcons name="face-recognition" size={24} color="white" />
            <Text style={styles.primaryButtonText}>
              {t('verification.startScan') || 'Démarrer le scan'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Retry button */}
        {(localStatus === 'failed' || localStatus === 'error') && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#F44336' }]} 
            onPress={handleRetry}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="white" />
            <Text style={styles.primaryButtonText}>
              {t('common.retry') || 'Réessayer'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Skip button */}
        {allowSkip && !isVerified && localStatus !== 'verifying' && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>
              {t('common.skip') || 'Passer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, { backgroundColor: '#4CAF50' }]} />
        <View style={[styles.stepDot, { backgroundColor: '#4CAF50' }]} />
        <View style={[styles.stepDot, { backgroundColor: theme.colors.primary }]} />
        {user?.role === 'driver' && (
          <View style={[styles.stepDot, { backgroundColor: theme.colors.border }]} />
        )}
        <Text style={styles.stepText}>
          Étape 3/{user?.role === 'driver' ? '4' : '3'}
        </Text>
      </View>
    </SafeAreaView>
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
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  rtlText: {
    textAlign: 'right',
  },
  
  // Mode indicator
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    gap: 6,
  },
  modeEmoji: {
    fontSize: 12,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  
  // Camera
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  lockedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
  },
  offlineCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  offlineProgressText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  offlineDetectingText: {
    color: '#3498DB',
    fontSize: 16,
    marginTop: 10,
  },
  offlineModeText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },
  
  // Status
  statusContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#F39C12',
    marginTop: 8,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 12,
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginTop: 12,
  },
  errorStatusText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Progress bar
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    flex: 1,
  },
  
  // Actions
  actionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 30,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 10,
  },
});

export default FaceLockScreen;