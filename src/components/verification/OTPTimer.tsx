// components/verification/OTPTimer.tsx
// Composant timer OTP Go With Sally

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// ==================== TYPES ====================

interface OTPTimerProps {
  /** Temps restant en secondes */
  remainingTime: number;
  /** Temps formaté (ex: "4:30") */
  formattedTime: string;
  /** Si le timer est expiré */
  isExpired: boolean;
}

// ==================== COMPONENT ====================

const OTPTimer: React.FC<OTPTimerProps> = ({
  remainingTime,
  formattedTime,
  isExpired,
}) => {
  const { t } = useTranslation();
  
  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animation quand le temps est presque écoulé
  useEffect(() => {
    if (remainingTime <= 30 && remainingTime > 0) {
      // Pulsation quand il reste moins de 30 secondes
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (isExpired) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [remainingTime, isExpired, pulseAnim]);
  
  // Calculer la couleur selon le temps restant
  const getColor = () => {
    if (isExpired) return '#E74C3C';
    if (remainingTime < 60) return '#E67E22';
    return '#27AE60';
  };
  
  const color = getColor();
  
  return (
    <View style={styles.container}>
      {/* Timer principal */}
      <View style={[styles.timerBox, { borderColor: color }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons 
            name={isExpired ? 'alert-circle' : 'time-outline'} 
            size={20} 
            color={color} 
          />
        </Animated.View>
        
        <Text style={[styles.timerText, { color }]}>
          {isExpired 
            ? (t('verification.codeExpired') || 'Code expiré')
            : formattedTime
          }
        </Text>
      </View>
      
      {!isExpired && (
        <Text style={styles.hintText}>
          {t('verification.codeExpiresIn') || 'Le code expire dans'}
        </Text>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});

export default OTPTimer;