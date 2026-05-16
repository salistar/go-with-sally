// ============================================================
// 📄 SOSButton.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[SOSButton.tsx] ▶ Module loaded')
//   • console.log('[SOSButton.tsx] ▶ SOSButton() rendered')
//   • console.log('[SOSButton.tsx] ▶ handlePressIn() called')
//   • console.log('[SOSButton.tsx] ▶ handlePressOut() called')
//   • console.log('[SOSButton.tsx] ▶ handleTriggerSOS() called')
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  I18nManager,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[SOSButton.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface SOSButtonProps {
  onSOS: () => void;
  isActive?: boolean;
  duration?: number;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  onSOS,
  isActive = true,
  duration = 3000,
}) => {
  console.log(`${FILE_NAME} ▶ SOSButton() rendered`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for idle state
  useEffect(() => {
    if (!isPressed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isPressed, pulseAnim]);

  const handlePressIn = () => {
    console.log(`${FILE_NAME} ▶ handlePressIn() called`);

    if (!isActive) return;

    setIsPressed(true);
    setShowCountdown(true);
    setProgress(0);

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    pressTimerRef.current = setTimeout(() => {
      handleTriggerSOS();
    }, duration);
  };

  const handlePressOut = () => {
    console.log(`${FILE_NAME} ▶ handlePressOut() called`);

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    setIsPressed(false);
    setShowCountdown(false);
    setProgress(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleTriggerSOS = () => {
    console.log(`${FILE_NAME} ▶ handleTriggerSOS() called`);

    setIsPressed(false);
    setShowCountdown(false);

    // Trigger vibration and alert
    onSOS();

    // Reset animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.1],
    outputRange: [0.3, 0],
  });

  const countdownText = Math.ceil(
    (duration - (progress * duration)) / 1000
  ).toString();

  return (
    <View style={styles.container}>
      {/* Pulse ring background */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Main SOS button */}
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isActive}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: scaleAnim }],
              opacity: isActive ? 1 : 0.5,
            },
          ]}
        >
          <View style={styles.innerButton}>
            <MaterialCommunityIcons
              name="phone-alert"
              size={40}
              color="white"
            />
            <Text style={styles.sosText}>SOS</Text>
          </View>

          {/* Progress ring */}
          {isPressed && (
            <Animated.View
              style={[
                styles.progressRing,
                {
                  width: progressPercentage,
                },
              ]}
            />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Countdown display */}
      {showCountdown && isPressed && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdownText}s</Text>
          <Text style={styles.countdownLabel}>Relâchez pour annuler</Text>
        </View>
      )}

      {/* Helper text */}
      {!isPressed && (
        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
          Appuyez et maintenez 3 secondes
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F44336',
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  innerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  sosText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  countdownContainer: {
    alignItems: 'center',
    gap: 4,
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SOSButton;
