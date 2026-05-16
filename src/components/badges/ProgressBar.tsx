// ============================================================
// 📄 ProgressBar.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ProgressBar.tsx] ▶ Module loaded')
//   • console.log('[ProgressBar.tsx] ▶ ProgressBar() rendered')
// ============================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ProgressBar.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * ProgressBar Props
 */
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  label?: string;
}

/**
 * ProgressBar Component
 * Animated progress bar with optional label and percentage
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  showLabel = false,
  showPercentage = true,
  animated = true,
  label,
}) => {
  console.log(`${FILE_NAME} ▶ ProgressBar() rendered with progress: ${progress}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const defaultColor = color || theme.colors.primary;
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: Math.min(progress, 100),
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(Math.min(progress, 100));
    }
  }, [progress]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Label */}
      {showLabel && label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label}
          </Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View
        style={[
          styles.barContainer,
          {
            height,
            backgroundColor: theme.colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: defaultColor,
              width: widthInterpolation,
              height,
            },
          ]}
        />
      </View>

      {/* Percentage without label */}
      {showPercentage && !showLabel && (
        <Text style={[styles.percentageStandalone, { color: theme.colors.textSecondary }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  barContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  percentageStandalone: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProgressBar;
