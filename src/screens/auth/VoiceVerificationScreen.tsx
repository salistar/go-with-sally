// ============================================================
// 📄 VoiceVerificationScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[VoiceVerificationScreen] ▶ Module loaded')
//   • console.log('[VoiceVerificationScreen] ▶ Recording started')
// ============================================================
/**
 * Voice Gender Verification Screen
 * =================================
 * Record 5-second audio sample and send to AI API for gender verification.
 * Supports: male/female, confidence scoring, retry mechanism.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

console.log('[VoiceVerificationScreen] ▶ Module loaded');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  RECORDING_DURATION: 5000, // 5 seconds
  SAMPLE_RATE: 16000,
  API_ENDPOINT: process.env.REACT_APP_FACE_API_URL || 'http://localhost:8000',
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_RETRIES: 3,
};

const { width } = Dimensions.get('window');

// ============================================================
// COMPONENT
// ============================================================
export default function VoiceVerificationScreen({ navigation, route }: any) {
  console.log('[VoiceVerificationScreen] ▶ Component mounted');

  // State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingObject = useRef<Audio.Recording | null>(null);

  // ============================================================
  // LIFECYCLE
  // ============================================================
  useEffect(() => {
    console.log('[VoiceVerificationScreen] ▶ useEffect: requesting permissions');
    requestAudioPermissions();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (recordingObject.current) {
        recordingObject.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // ============================================================
  // PERMISSIONS
  // ============================================================
  const requestAudioPermissions = async () => {
    console.log('[VoiceVerificationScreen] ▶ requestAudioPermissions() called');

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.granted) {
        console.log('[VoiceVerificationScreen] ▶ Audio permission granted');
        setPermissionGranted(true);

        // Set up audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } else {
        console.log('[VoiceVerificationScreen] ▶ Audio permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone access is needed for voice verification.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      console.error('[VoiceVerificationScreen] ▶ Permission error:', err);
      Alert.alert('Error', 'Failed to request microphone permissions');
    }
  };

  // ============================================================
  // RECORDING
  // ============================================================
  const startRecording = async () => {
    console.log('[VoiceVerificationScreen] ▶ startRecording() called');

    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Microphone access not granted');
      return;
    }

    try {
      setIsRecording(true);
      setRecordingTime(0);
      setVerificationResult(null);

      const newRecording = new Audio.Recording();
      recordingObject.current = newRecording;

      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.PCM,
          audioEncoder: Audio.AndroidAudioEncoder.PCM,
          sampleRate: CONFIG.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: CONFIG.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMIsFloat: false,
        },
      });

      await newRecording.startAsync();
      console.log('[VoiceVerificationScreen] ▶ Recording started');
      setRecording(newRecording);

      // Timer
      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= CONFIG.RECORDING_DURATION / 1000) {
            stopRecording();
            return newTime;
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('[VoiceVerificationScreen] ▶ Recording start error:', err);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    console.log('[VoiceVerificationScreen] ▶ stopRecording() called');

    try {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      if (!recordingObject.current) {
        console.warn('[VoiceVerificationScreen] ▶ No active recording');
        return;
      }

      setIsRecording(false);
      await recordingObject.current.stopAndUnloadAsync();

      const uri = recordingObject.current.getURI();
      console.log('[VoiceVerificationScreen] ▶ Recording saved:', uri);

      if (uri) {
        await verifyVoice(uri);
      }

      setRecording(null);
      recordingObject.current = null;

    } catch (err) {
      console.error('[VoiceVerificationScreen] ▶ Recording stop error:', err);
      setIsRecording(false);
    }
  };

  // ============================================================
  // VOICE VERIFICATION
  // ============================================================
  const verifyVoice = async (audioUri: string) => {
    console.log('[VoiceVerificationScreen] ▶ verifyVoice() called');
    console.log(`[VoiceVerificationScreen] ▶ Audio URI: ${audioUri}`);

    setIsProcessing(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'voice_sample.wav',
      } as any);
      formData.append('user_id', route.params?.userId || 'unknown');

      console.log('[VoiceVerificationScreen] ▶ Sending to API');

      // Send to API
      const response = await axios.post(
        `${CONFIG.API_ENDPOINT}/api/voice/verify-gender`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      console.log('[VoiceVerificationScreen] ▶ API Response:', response.data);

      const { passed, gender, confidence, error } = response.data;

      if (passed && confidence >= CONFIG.CONFIDENCE_THRESHOLD) {
        console.log(`[VoiceVerificationScreen] ▶ Verification passed: ${gender} (${confidence})`);
        setVerificationResult({
          passed: true,
          gender,
          confidence,
        });

        // Auto-proceed after 2 seconds
        setTimeout(() => {
          navigation.navigate('VerificationSuccess', { method: 'voice', gender });
        }, 2000);

      } else {
        console.warn(
          `[VoiceVerificationScreen] ▶ Verification failed: ` +
          `passed=${passed}, confidence=${confidence}`
        );
        setVerificationResult({
          passed: false,
          reason: `${gender} (Confidence: ${(confidence * 100).toFixed(0)}%)`,
          error,
        });

        setRetryCount(prev => prev + 1);
      }

    } catch (err: any) {
      console.error('[VoiceVerificationScreen] ▶ Verification error:', err.message);

      setVerificationResult({
        passed: false,
        reason: 'API Error',
        error: err.message,
      });

      setRetryCount(prev => prev + 1);

      Alert.alert(
        'Verification Failed',
        err.response?.data?.detail || 'Failed to verify voice. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E94B3C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Verification</Text>
        <Text style={styles.subtitle}>
          Record a 5-second voice sample for gender verification
        </Text>
      </View>

      {/* Recording Section */}
      <View style={styles.recordingSection}>
        {isRecording ? (
          <View style={styles.recordingActive}>
            <MaterialCommunityIcons
              name="microphone-outline"
              size={60}
              color="#E94B3C"
            />
            <Text style={styles.recordingText}>Recording...</Text>
            <Text style={styles.timerText}>
              {recordingTime} / {CONFIG.RECORDING_DURATION / 1000}s
            </Text>
          </View>
        ) : verificationResult ? (
          <View
            style={[
              styles.resultBox,
              verificationResult.passed
                ? styles.resultSuccess
                : styles.resultFailure,
            ]}
          >
            <MaterialCommunityIcons
              name={verificationResult.passed ? 'check-circle' : 'close-circle'}
              size={60}
              color={verificationResult.passed ? '#4CAF50' : '#f44336'}
            />
            <Text
              style={[
                styles.resultText,
                {
                  color: verificationResult.passed ? '#4CAF50' : '#f44336',
                },
              ]}
            >
              {verificationResult.passed ? 'Verified!' : 'Not Verified'}
            </Text>
            {verificationResult.confidence !== undefined && (
              <Text style={styles.resultDetails}>
                Gender: {verificationResult.gender} ({(verificationResult.confidence * 100).toFixed(0)}%)
              </Text>
            )}
            {verificationResult.reason && (
              <Text style={styles.resultDetails}>{verificationResult.reason}</Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyRecording}>
            <MaterialCommunityIcons
              name="microphone-outline"
              size={60}
              color="#999"
            />
            <Text style={styles.emptyText}>Ready to record</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.recordButton]}
            onPress={startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="microphone"
                  size={24}
                  color="white"
                />
                <Text style={styles.buttonText}>Start Recording</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecording}
            disabled={isProcessing}
          >
            <MaterialCommunityIcons name="stop-circle" size={24} color="white" />
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}

        {verificationResult && !verificationResult.passed && (
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={() => {
              setVerificationResult(null);
              if (retryCount < CONFIG.MAX_RETRIES) {
                startRecording();
              } else {
                Alert.alert(
                  'Max Retries',
                  'Please try again later',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            }}
            disabled={retryCount >= CONFIG.MAX_RETRIES}
          >
            <Text style={styles.buttonText}>
              Retry ({retryCount}/{CONFIG.MAX_RETRIES})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Retry {retryCount}/{CONFIG.MAX_RETRIES}</Text>
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recordingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  recordingActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E94B3C',
    marginTop: 16,
  },
  timerText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  emptyRecording: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  resultBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 8,
  },
  resultSuccess: {
    backgroundColor: '#f1f8f6',
  },
  resultFailure: {
    backgroundColor: '#fef5f4',
  },
  resultText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  recordButton: {
    backgroundColor: '#E94B3C',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  retryButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
