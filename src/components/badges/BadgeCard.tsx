// ============================================================
// 📄 BadgeCard.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[BadgeCard.tsx] ▶ Module loaded')
//   • console.log('[BadgeCard.tsx] ▶ BadgeCard() rendered')
//   • console.log('[BadgeCard.tsx] ▶ handlePress() called')
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[BadgeCard.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Badge interface
 */
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  progress?: number;
}

/**
 * BadgeCard Props
 */
interface BadgeCardProps {
  badge: Badge;
  onPress?: (badge: Badge) => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * BadgeCard Component
 * Reusable badge card component for displaying badge information
 */
const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onPress,
  size = 'medium',
}) => {
  console.log(`${FILE_NAME} ▶ BadgeCard() rendered for badge ${badge.id}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const handlePress = () => {
    console.log(`${FILE_NAME} ▶ handlePress() called for badge ${badge.id}`);
    onPress?.(badge);
  };

  const sizeConfig = {
    small: {
      iconSize: 24,
      nameSize: 11,
      descSize: 9,
      padding: 8,
      iconWrapperSize: 40,
    },
    medium: {
      iconSize: 32,
      nameSize: 13,
      descSize: 11,
      padding: 12,
      iconWrapperSize: 56,
    },
    large: {
      iconSize: 40,
      nameSize: 15,
      descSize: 12,
      padding: 16,
      iconWrapperSize: 72,
    },
  };

  const config = sizeConfig[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: badge.isUnlocked ? theme.colors.surface : theme.colors.background,
          padding: config.padding,
          opacity: badge.isUnlocked ? 1 : 0.6,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon Wrapper */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: config.iconWrapperSize,
            height: config.iconWrapperSize,
            borderRadius: config.iconWrapperSize / 2,
            backgroundColor: `${badge.color}20`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={badge.icon as any}
          size={config.iconSize}
          color={badge.color}
        />
      </View>

      {/* Badge Info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.text,
              fontSize: config.nameSize,
            },
          ]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.textSecondary,
              fontSize: config.descSize,
            },
          ]}
          numberOfLines={2}
        >
          {badge.description}
        </Text>

        {/* Progress Bar */}
        {!badge.isUnlocked && badge.progress !== undefined && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: badge.color,
                    width: `${badge.progress}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: config.descSize - 1,
                },
              ]}
            >
              {badge.progress}%
            </Text>
          </View>
        )}
      </View>

      {/* Check Icon for Unlocked */}
      {badge.isUnlocked && (
        <View style={styles.checkIcon}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={badge.color}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 6,
  },
  progressContainer: {
    width: '100%',
    gap: 4,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default BadgeCard;
