/**
 * GO WITH SALLY - DRIVER BADGE COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { BadgeLevel } from '../../types/badges.types';
import { BADGE_CONFIGS } from '../../constants/badges';

interface DriverBadgeProps {
  level: BadgeLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showProgress?: boolean;
  documentsVerified?: number;
  documentsTotal?: number;
  onPress?: () => void;
}

export const DriverBadge: React.FC<DriverBadgeProps> = ({
  level,
  size = 'medium',
  showLabel = true,
  showProgress = false,
  documentsVerified = 0,
  documentsTotal = 9,
  onPress,
}) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'ar' | 'en';

  const config = BADGE_CONFIGS[level];

  const sizes = {
    small: { badge: 28, icon: 14, text: 10, progress: 40 },
    medium: { badge: 40, icon: 20, text: 12, progress: 60 },
    large: { badge: 56, icon: 28, text: 14, progress: 80 },
  };

  const currentSize = sizes[size];
  const progressPercentage = documentsTotal > 0 ? (documentsVerified / documentsTotal) * 100 : 0;

  const content = (
    <View style={styles.container}>
      {/* Badge Circle */}
      <View
        style={[
          styles.badge,
          {
            width: currentSize.badge,
            height: currentSize.badge,
            borderRadius: currentSize.badge / 2,
            backgroundColor: config.backgroundColor,
            borderColor: config.color,
            borderWidth: 2,
          },
        ]}
      >
        <Text style={{ fontSize: currentSize.icon }}>{config.icon}</Text>
      </View>

      {/* Label */}
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: currentSize.text,
              color: config.color,
            },
          ]}
        >
          {config.name[lang]}
        </Text>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <View style={[styles.progressContainer, I18nManager.isRTL && styles.progressContainerRTL]}>
          <View
            style={[
              styles.progressTrack,
              {
                width: currentSize.progress,
                backgroundColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: config.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary, fontSize: currentSize.text - 2 }, I18nManager.isRTL && styles.progressTextRTL]}>
            {documentsVerified}/{documentsTotal}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Inline Badge (for display in lists)
export const DriverBadgeInline: React.FC<{ level: BadgeLevel }> = ({ level }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'ar' | 'en';
  const config = BADGE_CONFIGS[level];

  return (
    <View style={[styles.inlineBadge, { backgroundColor: config.backgroundColor }]}>
      <Text style={styles.inlineIcon}>{config.icon}</Text>
      <Text style={[styles.inlineLabel, { color: config.color }]}>
        {config.name[lang]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    marginTop: 6,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressContainerRTL: {
    flexDirection: 'row-reverse',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginLeft: 6,
  },
  progressTextRTL: {
    marginLeft: 0,
    marginRight: 6,
  },
  // Inline styles
  inlineBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inlineIcon: {
    fontSize: 12,
    marginRight: I18nManager.isRTL ? 0 : 4,
    marginLeft: I18nManager.isRTL ? 4 : 0,
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DriverBadge;