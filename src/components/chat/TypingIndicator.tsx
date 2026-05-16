// ============================================================
// 📄 TypingIndicator.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[TypingIndicator.tsx] ▶ Module loaded')
//   • console.log('[TypingIndicator.tsx] ▶ TypingIndicator() rendered')
// ============================================================

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[TypingIndicator.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, userName = 'Someone' }) => {
  console.log(`${FILE_NAME} ▶ TypingIndicator() rendered with isTyping: ${isTyping}`);

  const { theme } = useTheme();
  const [animations] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    if (isTyping) {
      const createLoop = (animation: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 600,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animations.forEach((anim, index) => {
        createLoop(anim, index * 200);
      });
    } else {
      animations.forEach(anim => anim.setValue(0));
    }
  }, [isTyping, animations]);

  if (!isTyping) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.typingBubble,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {animations.map((animation, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: theme.colors.textSecondary,
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 12,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    maxWidth: 60,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TypingIndicator;
