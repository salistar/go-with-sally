// ============================================================
// 📄 SurgeIndicator.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[SurgeIndicator.tsx] ▶ Module loaded')
//   • console.log('[SurgeIndicator.tsx] ▶ SurgeIndicator() rendered')
//   • console.log('[SurgeIndicator.tsx] ▶ toggleDetails() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[SurgeIndicator.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface SurgeIndicatorProps {
  multiplier: number;
  isSurging: boolean;
  description?: string;
  estimatedEndTime?: Date;
}

const SurgeIndicator: React.FC<SurgeIndicatorProps> = ({
  multiplier,
  isSurging,
  description,
  estimatedEndTime,
}) => {
  console.log(`${FILE_NAME} ▶ SurgeIndicator() rendered with multiplier: ${multiplier}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [isExpanded, setIsExpanded] = useState(false);
  const [countdownText, setCountdownText] = useState('');
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for surge
  useEffect(() => {
    if (isSurging && multiplier > 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isSurging, multiplier, scaleAnim]);

  // Update countdown
  useEffect(() => {
    if (!estimatedEndTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = estimatedEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText(t('surge.ended', 'Terminé'));
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdownText(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [estimatedEndTime, t]);

  const toggleDetails = () => {
    console.log(`${FILE_NAME} ▶ toggleDetails() called`);
    setIsExpanded(!isExpanded);
  };

  const getSurgeLevel = (mult: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (mult <= 1.2) return 'low';
    if (mult <= 1.5) return 'medium';
    if (mult <= 2) return 'high';
    return 'critical';
  };

  const getSurgeColor = (level: ReturnType<typeof getSurgeLevel>): string => {
    switch (level) {
      case 'low':
        return '#FFB74D';
      case 'medium':
        return '#FF8A65';
      case 'high':
        return '#FF6B6B';
      case 'critical':
        return '#D32F2F';
      default:
        return theme.colors.primary;
    }
  };

  const getSurgeIcon = (level: ReturnType<typeof getSurgeLevel>): string => {
    switch (level) {
      case 'critical':
        return 'alert-circle';
      case 'high':
        return 'flash';
      case 'medium':
        return 'fire';
      default:
        return 'trending-up';
    }
  };

  const getSurgeLabel = (level: ReturnType<typeof getSurgeLevel>): string => {
    switch (level) {
      case 'critical':
        return t('surge.critical', 'Très haute demande');
      case 'high':
        return t('surge.high', 'Haute demande');
      case 'medium':
        return t('surge.medium', 'Demande modérée');
      default:
        return t('surge.low', 'Demande faible');
    }
  };

  const level = getSurgeLevel(multiplier);
  const surgeColor = getSurgeColor(level);
  const surgeIcon = getSurgeIcon(level);
  const surgeLabel = getSurgeLabel(level);

  if (!isSurging || multiplier <= 1) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={toggleDetails}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.surgeContainer,
          {
            transform: [{ scale: scaleAnim }],
            borderColor: surgeColor,
          },
        ]}
      >
        <LinearGradient
          colors={[surgeColor + '20', surgeColor + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: surgeColor + '30' }]}>
              <MaterialCommunityIcons
                name={surgeIcon as any}
                size={20}
                color={surgeColor}
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContent}>
              <Text style={[styles.label, { color: surgeColor }]}>
                {surgeLabel}
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {description || t('surge.priceIncreased', 'Prix augmenté de')} x{multiplier.toFixed(2)}
              </Text>
            </View>

            {/* Multiplier Badge */}
            <View style={[styles.multiplierBadge, { backgroundColor: surgeColor }]}>
              <Text style={styles.multiplierText}>x{multiplier.toFixed(1)}</Text>
            </View>

            {/* Expand Icon */}
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={surgeColor}
            />
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View style={[styles.expandedContent, { borderTopColor: surgeColor + '30' }]}>
              {/* Surge Meter */}
              <View style={styles.meterContainer}>
                <Text style={[styles.meterLabel, { color: theme.colors.text }]}>
                  {t('surge.demandLevel', 'Niveau de demande')}
                </Text>
                <View
                  style={[
                    styles.meterBar,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.meterFill,
                      {
                        backgroundColor: surgeColor,
                        width: `${Math.min((multiplier - 1) * 50, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.meterLabels}>
                  <Text style={[styles.meterText, { color: theme.colors.textSecondary }]}>
                    {t('surge.normal', 'Normal')} (1x)
                  </Text>
                  <Text style={[styles.meterText, { color: theme.colors.textSecondary }]}>
                    {t('surge.peak', 'Pic')} (2x+)
                  </Text>
                </View>
              </View>

              {/* Info Text */}
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={14}
                  color={surgeColor}
                />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  {t('surge.explanation', 'Les tarifs augmentent pendant les pics de demande')}
                </Text>
              </View>

              {/* Countdown */}
              {estimatedEndTime && countdownText && (
                <View style={styles.countdownContainer}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.countdownText, { color: theme.colors.textSecondary }]}>
                    {t('surge.endsIn', 'Fin dans')} {countdownText}
                  </Text>
                </View>
              )}

              {/* Price Impact */}
              <View style={[styles.impactBox, { backgroundColor: surgeColor + '10' }]}>
                <Text style={[styles.impactLabel, { color: surgeColor }]}>
                  {t('surge.priceImpact', 'Impact sur le prix')}
                </Text>
                <Text style={[styles.impactValue, { color: surgeColor }]}>
                  +{((multiplier - 1) * 100).toFixed(0)}%
                </Text>
              </View>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
                  {t('surge.tip', 'Attendez quelques minutes pour un meilleur prix')}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  surgeContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  multiplierText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    gap: 12,
  },
  meterContainer: {
    gap: 8,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  meterBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterText: {
    fontSize: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 11,
    flex: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '600',
  },
  impactBox: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipsText: {
    fontSize: 11,
    flex: 1,
  },
});

export default SurgeIndicator;
