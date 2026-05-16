/**
 * ============================================================================
 * GO WITH SALLY - CALL SCREEN
 * ============================================================================
 * Écran d'appel audio/vidéo avec la conductrice ou passagère
 * 
 * Fonctionnalités:
 * - Appel audio
 * - Appel vidéo (simulation)
 * - Contrôles: mute, speaker, camera flip
 * - Timer d'appel
 * - États: calling, ringing, connected, ended
 * - Support des 3 modes (offline/hybrid/online)
 * 
 * @module screens/common/CallScreen
 * @version 1.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
  Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  getModeEmoji,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[CallScreen]';

type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'noAnswer';
type CallType = 'audio' | 'video';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const CallScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Paramètres de la route
  const recipientId = route.params?.recipientId;
  const recipientName = route.params?.recipientName || t('chat.defaultRecipient');
  const recipientAvatar = route.params?.recipientAvatar;
  const callType: CallType = route.params?.callType || 'audio';
  const isIncoming = route.params?.isIncoming || false;

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [status, setStatus] = useState<CallStatus>(isIncoming ? 'ringing' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === 'video');
  const [isCameraOn, setIsCameraOn] = useState(callType === 'video');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [duration, setDuration] = useState(0);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Initialisation - Type: ${callType}, Incoming: ${isIncoming}`);
    
    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Démarrer l'animation de pulsation
    startPulseAnimation();

    // Simuler la connexion de l'appel
    if (!isIncoming) {
      simulateCall();
    } else {
      // Vibrer pour appel entrant
      Vibration.vibrate([0, 500, 200, 500], true);
    }

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // ==========================================================================
  // FONCTIONS
  // ==========================================================================

  const cleanup = async () => {
    Vibration.cancel();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (ringtoneRef.current) {
      await ringtoneRef.current.unloadAsync();
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const simulateCall = () => {
    // Simuler la recherche de connexion
    setTimeout(() => {
      if (status === 'calling') {
        // Simuler un appel répondu (80% de chance)
        if (Math.random() > 0.2) {
          setStatus('connected');
          Toast.show({
            type: 'success',
            text1: t('call.connected'),
          });
        } else {
          // Simuler pas de réponse
          setStatus('noAnswer');
          setTimeout(() => {
            handleEndCall();
          }, 2000);
        }
      }
    }, 3000 + Math.random() * 2000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = useCallback(() => {
    console.log(`${FILE_NAME} 📞 Fin de l'appel`);
    setStatus('ended');
    cleanup();
    
    Toast.show({
      type: 'info',
      text1: t('call.ended'),
      text2: duration > 0 ? t('call.duration', { duration: formatDuration(duration) }) : undefined,
    });

    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  }, [duration, navigation, t]);

  const handleAcceptCall = useCallback(() => {
    console.log(`${FILE_NAME} ✅ Appel accepté`);
    Vibration.cancel();
    setStatus('connected');
  }, []);

  const handleDeclineCall = useCallback(() => {
    console.log(`${FILE_NAME} ❌ Appel refusé`);
    Vibration.cancel();
    setStatus('declined');
    
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  }, [navigation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    Toast.show({
      type: 'info',
      text1: isMuted ? t('call.unmute') : t('call.mute'),
    });
  }, [isMuted, t]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
    Toast.show({
      type: 'info',
      text1: isSpeakerOn ? t('call.speakerOff') : t('call.speaker'),
    });
  }, [isSpeakerOn, t]);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const flipCamera = useCallback(() => {
    setIsFrontCamera((prev) => !prev);
  }, []);

  const getStatusText = (): string => {
    switch (status) {
      case 'calling':
        return t('call.calling');
      case 'ringing':
        return t('call.ringing');
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return t('call.ended');
      case 'declined':
        return t('call.declined');
      case 'noAnswer':
        return t('call.noAnswer');
      default:
        return '';
    }
  };

  // ==========================================================================
  // COMPOSANTS
  // ==========================================================================

  const renderAvatar = () => (
    <View style={styles.avatarSection}>
      <Animated.View
        style={[
          styles.avatarContainer,
          status === 'calling' || status === 'ringing'
            ? { transform: [{ scale: pulseAnim }] }
            : undefined,
        ]}
      >
        {recipientAvatar ? (
          <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Cercles de pulsation */}
        {(status === 'calling' || status === 'ringing') && (
          <>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.colors.primary,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.6, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing2,
                {
                  borderColor: theme.colors.primary,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
          </>
        )}
      </Animated.View>

      <Text style={styles.recipientName}>{recipientName}</Text>
      <Text style={styles.statusText}>{getStatusText()}</Text>
      
      {callType === 'video' && (
        <View style={styles.callTypeBadge}>
          <MaterialCommunityIcons name="video" size={16} color="white" />
          <Text style={styles.callTypeText}>{t('call.videoCall')}</Text>
        </View>
      )}
    </View>
  );

  const renderControls = () => {
    if (status === 'ended' || status === 'declined' || status === 'noAnswer') {
      return null;
    }

    if (isIncoming && status === 'ringing') {
      return (
        <View style={styles.incomingControls}>
          {/* Decline */}
          <TouchableOpacity
            style={[styles.controlButton, styles.declineButton]}
            onPress={handleDeclineCall}
          >
            <MaterialCommunityIcons name="phone-hangup" size={32} color="white" />
          </TouchableOpacity>

          {/* Accept */}
          <TouchableOpacity
            style={[styles.controlButton, styles.acceptButton]}
            onPress={handleAcceptCall}
          >
            <MaterialCommunityIcons name="phone" size={32} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.controls}>
        {/* Mute */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            isMuted && styles.activeButton,
          ]}
          onPress={toggleMute}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={28}
            color="white"
          />
          <Text style={styles.controlLabel}>
            {isMuted ? t('call.unmute') : t('call.mute')}
          </Text>
        </TouchableOpacity>

        {/* Speaker */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            isSpeakerOn && styles.activeButton,
          ]}
          onPress={toggleSpeaker}
        >
          <MaterialCommunityIcons
            name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
            size={28}
            color="white"
          />
          <Text style={styles.controlLabel}>
            {isSpeakerOn ? t('call.speakerOff') : t('call.speaker')}
          </Text>
        </TouchableOpacity>

        {/* Camera (video only) */}
        {callType === 'video' && (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryButton,
                !isCameraOn && styles.activeButton,
              ]}
              onPress={toggleCamera}
            >
              <MaterialCommunityIcons
                name={isCameraOn ? 'camera' : 'camera-off'}
                size={28}
                color="white"
              />
              <Text style={styles.controlLabel}>
                {isCameraOn ? t('call.cameraOff') : t('call.camera')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={flipCamera}
            >
              <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
              <Text style={styles.controlLabel}>{t('call.flipCamera')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderEndCallButton = () => {
    if (status === 'ended' || status === 'declined' || status === 'noAnswer') {
      return null;
    }
    if (isIncoming && status === 'ringing') {
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.endCallButton]}
        onPress={handleEndCall}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="phone-hangup" size={36} color="white" />
      </TouchableOpacity>
    );
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={
          callType === 'video'
            ? ['#1a1a2e', '#16213e', '#0f3460']
            : ['#667eea', '#764ba2', '#f953c6']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Mode Badge (DEV) */}
        {__DEV__ && (
          <View style={[styles.modeBadge, { top: insets.top + 10 }]}>
            <Text style={styles.modeBadgeText}>
              {getModeEmoji()} {APP_MODE.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-down" size={32} color="white" />
        </TouchableOpacity>

        {/* Avatar & Info */}
        {renderAvatar()}

        {/* Controls */}
        <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 30 }]}>
          {renderControls()}
          {renderEndCallButton()}
        </View>

        {/* Connection Quality Indicator */}
        {status === 'connected' && (
          <View style={styles.qualityIndicator}>
            <MaterialCommunityIcons name="signal-cellular-3" size={16} color="#4CAF50" />
            <Text style={styles.qualityText}>HD</Text>
          </View>
        )}
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modeBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  modeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Avatar Section
  avatarSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: 'white',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    top: -10,
    left: -10,
  },
  pulseRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    top: -20,
    left: -20,
  },
  recipientName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  callTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Controls
  controlsContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeButton: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  controlLabel: {
    color: 'white',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },

  // Incoming Call Controls
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  declineButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  acceptButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // End Call Button
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Quality Indicator
  qualityIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  qualityText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CallScreen;