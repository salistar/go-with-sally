// components/verification/FaceOverlay.tsx
// Overlay de guidage pour la reconnaissance faciale Go With Sally
// FIXED: Animation conflicts - shadowColor and borderColor are now state-based

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Svg, Ellipse, Defs, Mask, Rect } from 'react-native-svg';
import { FaceVerificationStatus } from '../../types/verification';

// ==================== TYPES ====================

interface FaceOverlayProps {
  faceDetected: boolean;
  isInPosition: boolean;
  status: FaceVerificationStatus;
  facePosition?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dimensions de l'ovale de guidage
const OVAL_WIDTH = SCREEN_WIDTH * 0.65;
const OVAL_HEIGHT = OVAL_WIDTH * 1.35;
const OVAL_CENTER_X = SCREEN_WIDTH * 0.425;
const OVAL_CENTER_Y = OVAL_HEIGHT * 0.55;

// ==================== HELPER FUNCTIONS ====================

const getBorderColor = (
  status: string,
  faceDetected: boolean,
  isInPosition: boolean
): string => {
  if (status === 'success') {
    return 'rgba(39, 174, 96, 1)'; // Vert
  } else if (status === 'failed' || status === 'locked' || status === 'error') {
    return 'rgba(231, 76, 60, 1)'; // Rouge
  } else if (isInPosition || status === 'detecting' || status === 'verifying') {
    return 'rgba(236, 72, 153, 0.9)'; // Rose
  } else if (faceDetected) {
    return 'rgba(241, 196, 15, 0.8)'; // Jaune
  }
  return 'rgba(255, 255, 255, 0.5)'; // Blanc (défaut)
};

const getShadowColor = (
  status: string,
  faceDetected: boolean,
  isInPosition: boolean
): string => {
  if (status === 'success') {
    return 'rgba(39, 174, 96, 0.4)';
  } else if (status === 'failed' || status === 'locked' || status === 'error') {
    return 'rgba(231, 76, 60, 0.4)';
  } else if (isInPosition || status === 'detecting' || status === 'verifying') {
    return 'rgba(236, 72, 153, 0.3)';
  } else if (faceDetected) {
    return 'rgba(241, 196, 15, 0.2)';
  }
  return 'rgba(255, 255, 255, 0.1)';
};

// ==================== COMPONENT ====================

const FaceOverlay: React.FC<FaceOverlayProps> = ({
  faceDetected,
  isInPosition,
  status,
  facePosition,
}) => {
  // Animation ONLY for scale (native driver compatible)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // State for colors (NOT animated - avoids native driver conflicts)
  const [borderColor, setBorderColor] = useState('rgba(255, 255, 255, 0.5)');
  const [shadowColor, setShadowColor] = useState('rgba(255, 255, 255, 0.1)');
  
  // Convert status to string
  const statusStr = status as string;
  
  // Pulse animation (native driver only - transform is compatible)
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (faceDetected && !isInPosition) {
      // Slow pulse when face detected but not in position
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    } else if (isInPosition) {
      // Fast pulse when in position
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    } else {
      // No pulse
      animation = Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      });
    }
    
    animation.start();
    return () => animation.stop();
  }, [faceDetected, isInPosition, pulseAnim]);
  
  // Update colors (no animation - direct state update)
  useEffect(() => {
    setBorderColor(getBorderColor(statusStr, faceDetected, isInPosition));
    setShadowColor(getShadowColor(statusStr, faceDetected, isInPosition));
  }, [statusStr, faceDetected, isInPosition]);
  
  // Render conditions
  const isSuccess = statusStr === 'success';
  const isFailed = statusStr === 'failed' || statusStr === 'locked' || statusStr === 'error';
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark mask with oval hole */}
      <Svg width="100%" height="100%">
        <Defs>
          <Mask id="mask">
            <Rect width="100%" height="100%" fill="white" />
            <Ellipse
              cx={OVAL_CENTER_X}
              cy={OVAL_CENTER_Y}
              rx={OVAL_WIDTH / 2}
              ry={OVAL_HEIGHT / 2}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#mask)"
        />
      </Svg>
      
      {/* Shadow layer (iOS only - not animated) */}
      {Platform.OS === 'ios' && (
        <View
          style={[
            styles.ovalShadow,
            { shadowColor: shadowColor },
          ]}
        />
      )}
      
      {/* Animated border (only transform is animated) */}
      <Animated.View
        style={[
          styles.ovalBorder,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: borderColor,
          },
        ]}
      />
      
      {/* Glow effect for Android */}
      {Platform.OS === 'android' && (isInPosition || isSuccess) && (
        <View
          style={[
            styles.ovalGlow,
            { backgroundColor: shadowColor },
          ]}
        />
      )}
      
      {/* Corner indicators */}
      <View style={styles.cornersContainer}>
        <CornerIndicator position="topLeft" active={isInPosition} />
        <CornerIndicator position="topRight" active={isInPosition} />
        <CornerIndicator position="bottomLeft" active={isInPosition} />
        <CornerIndicator position="bottomRight" active={isInPosition} />
      </View>
      
      {/* Success indicator */}
      {isSuccess && (
        <View style={styles.successIndicator}>
          <View style={styles.checkmark} />
        </View>
      )}
      
      {/* Fail indicator */}
      {isFailed && (
        <View style={styles.failIndicator}>
          <View style={styles.crossLine1} />
          <View style={styles.crossLine2} />
        </View>
      )}
    </View>
  );
};

// ==================== CORNER INDICATOR ====================

interface CornerIndicatorProps {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  active: boolean;
}

const CornerIndicator: React.FC<CornerIndicatorProps> = ({ position, active }) => {
  const getStyle = () => {
    const base = {
      position: 'absolute' as const,
      width: 30,
      height: 30,
      borderColor: active ? '#EC4899' : 'rgba(255, 255, 255, 0.5)',
      borderWidth: 3,
    };
    
    switch (position) {
      case 'topLeft':
        return {
          ...base,
          top: OVAL_CENTER_Y - OVAL_HEIGHT / 2 - 5,
          left: OVAL_CENTER_X - OVAL_WIDTH / 2 - 5,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderTopLeftRadius: 15,
        };
      case 'topRight':
        return {
          ...base,
          top: OVAL_CENTER_Y - OVAL_HEIGHT / 2 - 5,
          right: SCREEN_WIDTH - (OVAL_CENTER_X + OVAL_WIDTH / 2) - 5,
          borderLeftWidth: 0,
          borderBottomWidth: 0,
          borderTopRightRadius: 15,
        };
      case 'bottomLeft':
        return {
          ...base,
          bottom: SCREEN_HEIGHT * 0.35 - (OVAL_CENTER_Y + OVAL_HEIGHT / 2) - 5,
          left: OVAL_CENTER_X - OVAL_WIDTH / 2 - 5,
          borderRightWidth: 0,
          borderTopWidth: 0,
          borderBottomLeftRadius: 15,
        };
      case 'bottomRight':
        return {
          ...base,
          bottom: SCREEN_HEIGHT * 0.35 - (OVAL_CENTER_Y + OVAL_HEIGHT / 2) - 5,
          right: SCREEN_WIDTH - (OVAL_CENTER_X + OVAL_WIDTH / 2) - 5,
          borderLeftWidth: 0,
          borderTopWidth: 0,
          borderBottomRightRadius: 15,
        };
    }
  };
  
  return <View style={getStyle()} />;
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  ovalBorder: {
    position: 'absolute',
    top: OVAL_CENTER_Y - OVAL_HEIGHT / 2,
    left: OVAL_CENTER_X - OVAL_WIDTH / 2,
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH,
    borderWidth: 3,
    // NO shadowColor here - it's applied via state on a separate View
  },
  ovalShadow: {
    position: 'absolute',
    top: OVAL_CENTER_Y - OVAL_HEIGHT / 2,
    left: OVAL_CENTER_X - OVAL_WIDTH / 2,
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH,
    // iOS shadow properties (static, not animated)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  ovalGlow: {
    position: 'absolute',
    top: OVAL_CENTER_Y - OVAL_HEIGHT / 2 - 5,
    left: OVAL_CENTER_X - OVAL_WIDTH / 2 - 5,
    width: OVAL_WIDTH + 10,
    height: OVAL_HEIGHT + 10,
    borderRadius: OVAL_WIDTH,
    opacity: 0.3,
  },
  cornersContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  successIndicator: {
    position: 'absolute',
    top: OVAL_CENTER_Y - 30,
    left: OVAL_CENTER_X - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(39, 174, 96, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 20,
    height: 35,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#FFF',
    transform: [{ rotate: '45deg' }, { translateY: -5 }],
  },
  failIndicator: {
    position: 'absolute',
    top: OVAL_CENTER_Y - 30,
    left: OVAL_CENTER_X - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLine1: {
    position: 'absolute',
    width: 30,
    height: 5,
    backgroundColor: '#FFF',
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    position: 'absolute',
    width: 30,
    height: 5,
    backgroundColor: '#FFF',
    transform: [{ rotate: '-45deg' }],
  },
});

export default FaceOverlay;