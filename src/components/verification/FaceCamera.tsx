// components/verification/FaceCamera.tsx
// Composant caméra pour la reconnaissance faciale Go With Sally
// Compatible avec expo-camera v15+ (sans onFacesDetected natif)

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FaceOverlay from './FaceOverlay';
import { FaceVerificationStatus, FaceData } from '../../types/verification';

// ==================== TYPES ====================

interface FaceCameraProps {
  onFaceDetected: (faces: FaceData[]) => void;
  onCapture: (photo: { uri: string; base64?: string }) => void;
  status: FaceVerificationStatus;
  isProcessing?: boolean;
  showGuide?: boolean;
  autoCapture?: boolean;
  autoCaptureDelay?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_SIZE = SCREEN_WIDTH * 0.85;

// ==================== COMPONENT ====================

const FaceCamera: React.FC<FaceCameraProps> = ({
  onFaceDetected,
  onCapture,
  status,
  isProcessing = false,
  showGuide = true,
  autoCapture = true,
  autoCaptureDelay = 3000,
}) => {
  const { t } = useTranslation();
  const cameraRef = useRef<CameraView>(null);
  
  // Nouvelle API expo-camera v15+
  const [permission, requestPermission] = useCameraPermissions();
  
  const [faceDetected, setFaceDetected] = useState(false);
  const [isFaceInPosition, setIsFaceInPosition] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== HELPER - Status check (évite erreur TypeScript) ====================
  const statusStr = String(status); // Convertir en string pour éviter les erreurs de type
  
  // ==================== FACE DETECTION SIMULATION ====================
  // expo-camera v15+ n'a plus onFacesDetected, on simule la détection
  // Dans un projet réel, utiliser react-native-vision-camera ou ML Kit
  
  useEffect(() => {
    // Utiliser statusStr pour les comparaisons
    if (!isReady || isProcessing || statusStr === 'verifying' || statusStr === 'success') {
      return;
    }
    
    // Simuler la détection de visage après un délai
    // L'utilisateur a le temps de positionner son visage
    simulationTimerRef.current = setTimeout(() => {
      console.log('[FaceCamera] Simulation: Face detected');
      
      // Simuler un visage détecté
      const simulatedFace: FaceData = {
        bounds: {
          origin: { x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.2 },
          size: { width: SCREEN_WIDTH * 0.5, height: SCREEN_WIDTH * 0.6 },
        },
        faceID: 1,
        rollAngle: 0,
        yawAngle: 0,
      };
      
      setFaceDetected(true);
      onFaceDetected([simulatedFace]);
      
      // Après 1s supplémentaire, considérer le visage "en position"
      setTimeout(() => {
        const currentStatusStr = String(status);
        if (!isProcessing && currentStatusStr !== 'verifying') {
          console.log('[FaceCamera] Simulation: Face in position');
          setIsFaceInPosition(true);
          
          // Démarrer l'auto-capture si activé
          if (autoCapture && !autoCaptureTimerRef.current) {
            startAutoCapture();
          }
        }
      }, 1000);
      
    }, 1500);
    
    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, [isReady, isProcessing, status, statusStr, autoCapture, onFaceDetected]);
  
  // ==================== AUTO CAPTURE ====================
  
  const startAutoCapture = useCallback(() => {
    console.log('[FaceCamera] Starting auto-capture countdown');
    const seconds = Math.ceil(autoCaptureDelay / 1000);
    setCountdown(seconds);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    autoCaptureTimerRef.current = setTimeout(() => {
      capturePhoto();
    }, autoCaptureDelay);
  }, [autoCaptureDelay]);
  
  const cancelAutoCapture = useCallback(() => {
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);
  
  // ==================== CAPTURE ====================
  
  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current || isProcessing) {
      console.log('[FaceCamera] Cannot capture: camera not ready or processing');
      return;
    }
    
    console.log('[FaceCamera] Capturing photo...');
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: Platform.OS === 'android',
      });
      
      if (photo) {
        console.log('[FaceCamera] Photo captured successfully');
        onCapture({
          uri: photo.uri,
          base64: photo.base64,
        });
      }
    } catch (error) {
      console.error('[FaceCamera] Capture error:', error);
    } finally {
      cancelAutoCapture();
    }
  }, [isProcessing, onCapture, cancelAutoCapture]);
  
  // Capture manuelle
  const handleManualCapture = useCallback(() => {
    const currentStatusStr = String(status);
    if (!isProcessing && currentStatusStr !== 'verifying') {
      cancelAutoCapture();
      capturePhoto();
    }
  }, [isProcessing, status, cancelAutoCapture, capturePhoto]);
  
  // ==================== CAMERA READY ====================
  
  const handleCameraReady = useCallback(() => {
    console.log('[FaceCamera] Camera ready');
    setIsReady(true);
  }, []);
  
  // ==================== CLEANUP ====================
  
  useEffect(() => {
    return () => {
      cancelAutoCapture();
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, [cancelAutoCapture]);
  
  // Reset quand le status change
  useEffect(() => {
    if (statusStr === 'idle') {
      setFaceDetected(false);
      setIsFaceInPosition(false);
      cancelAutoCapture();
    }
  }, [statusStr, cancelAutoCapture]);
  
  // ==================== RENDER ====================
  
  // Permission en attente
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('verification.requestingPermission') || 'Demande de permission...'}</Text>
      </View>
    );
  }
  
  // Permission refusée
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={48} color="#E74C3C" />
        <Text style={styles.message}>
          {t('verification.cameraPermissionDenied') || 'Permission caméra refusée'}
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>
            {t('verification.grantPermission') || 'Autoriser la caméra'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={handleCameraReady}
        />
        
        {showGuide && (
          <FaceOverlay
            faceDetected={faceDetected}
            isInPosition={isFaceInPosition}
            status={status}
          />
        )}
        
        {/* Countdown */}
        {countdown !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
        
        {/* Bouton capture manuel (visible si autoCapture désactivé ou en backup) */}
        {!autoCapture && isFaceInPosition && statusStr === 'idle' && (
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={handleManualCapture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          {getInstructionText(statusStr, faceDetected, isFaceInPosition, countdown, t)}
        </Text>
      </View>
    </View>
  );
};

// ==================== HELPERS ====================

function getInstructionText(
  status: string, // Utiliser string au lieu de FaceVerificationStatus
  faceDetected: boolean,
  isInPosition: boolean,
  countdown: number | null,
  t: (key: string) => string
): string {
  switch (status) {
    case 'detecting':
      return t('verification.faceDetected') || 'Visage détecté...';
    case 'verifying':
      return t('verification.processing') || 'Vérification en cours...';
    case 'success':
      return t('verification.success') || 'Vérification réussie!';
    case 'failed':
    case 'error':
      return t('verification.failed') || 'Échec de la vérification';
    case 'locked':
      return t('verification.accountLocked') || 'Compte verrouillé';
    default:
      if (!faceDetected) {
        return t('verification.positionFace') || 'Positionnez votre visage dans le cadre';
      }
      if (!isInPosition) {
        return t('verification.centerFace') || 'Centrez votre visage';
      }
      if (countdown !== null) {
        return t('verification.holdStill') || 'Ne bougez pas...';
      }
      return t('verification.holdStill') || 'Restez immobile';
  }
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  message: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EC4899',
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },
  instructionsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FaceCamera;