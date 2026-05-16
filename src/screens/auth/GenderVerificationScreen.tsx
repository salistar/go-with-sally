/**
 * GO WITH SALLY - GENDER VERIFICATION SCREEN
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useGenderVerification } from '../../hooks/useGenderVerification';
import { setGenderVerified } from '../../store/slices/authSlice';

export const GenderVerificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cameraRef = useRef<CameraView>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<'intro' | 'camera' | 'processing' | 'success' | 'failed'>('intro');

  const { isLoading, verifyFromFace, error, reset } = useGenderVerification();

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleStartVerification = () => {
    setStep('camera');
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      setStep('processing');
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      
      if (photo?.base64) {
        const isVerified = await verifyFromFace(photo.base64);
        
        if (isVerified) {
          setStep('success');
          dispatch(setGenderVerified(true));
          setTimeout(() => {
            navigation.navigate('VerifyFace' as never);
          }, 2000);
        } else {
          setStep('failed');
        }
      }
    } catch (err) {
      setStep('failed');
    }
  };

  const handleRetry = () => {
    reset();
    setStep('camera');
  };

  const handleManualVerification = () => {
    Alert.alert(
      t('verification.gender.manualTitle'),
      t('verification.gender.manualMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => navigation.navigate('ManualVerification' as never) },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorIcon}>📷</Text>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          {t('verification.gender.cameraPermission')}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>{t('common.grantPermission')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Intro Step */}
      {step === 'intro' && (
        <View style={styles.introContainer}>
          <Text style={styles.introIcon}>👩</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('verification.gender.introTitle')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('verification.gender.introDesc')}
          </Text>

          <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {t('verification.gender.privacyInfo')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleStartVerification}
          >
            <Text style={styles.buttonText}>{t('verification.gender.startButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleManualVerification}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {t('verification.gender.manualLink')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera Step */}
      {step === 'camera' && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.faceGuide} />
              <Text style={styles.cameraHint}>{t('verification.gender.cameraHint')}</Text>
            </View>
          </CameraView>

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCapture}
              disabled={!cameraReady}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.processingText, { color: theme.colors.text }]}>
            {t('verification.gender.processing')}
          </Text>
        </View>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <View style={styles.centerContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            {t('verification.gender.successTitle')}
          </Text>
          <Text style={[styles.successDesc, { color: theme.colors.textSecondary }]}>
            {t('verification.gender.successDesc')}
          </Text>
        </View>
      )}

      {/* Failed Step */}
      {step === 'failed' && (
        <View style={styles.centerContainer}>
          <Text style={styles.failedIcon}>❌</Text>
          <Text style={[styles.failedTitle, { color: theme.colors.text }]}>
            {t('verification.gender.failedTitle')}
          </Text>
          <Text style={[styles.failedDesc, { color: theme.colors.textSecondary }]}>
            {error || t('verification.gender.failedDesc')}
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.buttonText}>{t('common.retry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleManualVerification}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {t('verification.gender.requestManual')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  introIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  },
  faceGuide: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  cameraHint: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 16,
    textAlign: 'center',
  },
  failedIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  failedDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default GenderVerificationScreen;