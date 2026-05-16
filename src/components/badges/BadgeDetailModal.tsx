// ============================================================
// 📄 BadgeDetailModal.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[BadgeDetailModal.tsx] ▶ Module loaded')
//   • console.log('[BadgeDetailModal.tsx] ▶ BadgeDetailModal() rendered')
//   • console.log('[BadgeDetailModal.tsx] ▶ handleClose() called')
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[BadgeDetailModal.tsx]';
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
  unlockedDate?: Date;
  progress?: number;
  requirement: string;
  category: string;
}

/**
 * BadgeDetailModal Props
 */
interface BadgeDetailModalProps {
  visible: boolean;
  badge?: Badge;
  onClose?: () => void;
}

/**
 * BadgeDetailModal Component
 * Displays detailed information about a badge
 */
const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  visible,
  badge,
  onClose,
}) => {
  console.log(`${FILE_NAME} ▶ BadgeDetailModal() rendered with visible: ${visible}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const handleClose = () => {
    console.log(`${FILE_NAME} ▶ handleClose() called`);
    onClose?.();
  };

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {/* Badge Header */}
          <LinearGradient
            colors={[badge.color, badge.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <MaterialCommunityIcons
              name={badge.icon as any}
              size={64}
              color="white"
            />
            <Text style={styles.headerName}>{badge.name}</Text>
            <Text style={styles.headerCategory}>{badge.category}</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.description,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              {badge.description}
            </Text>

            <View
              style={[
                styles.requirementBox,
                {
                  backgroundColor: `${theme.colors.primary}15`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="target"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.requirementText}>
                <Text
                  style={[
                    styles.requirementLabel,
                    {
                      color: theme.colors.textSecondary,
                    },
                  ]}
                >
                  {t('badges.requirement', 'Exigence')}
                </Text>
                <Text
                  style={[
                    styles.requirementValue,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {badge.requirement}
                </Text>
              </View>
            </View>

            {/* Status Section */}
            {badge.isUnlocked ? (
              <View
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: `${badge.color}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={badge.color}
                />
                <View style={styles.statusText}>
                  <Text
                    style={[
                      styles.statusLabel,
                      {
                        color: badge.color,
                      },
                    ]}
                  >
                    {t('badges.unlockedStatus', 'Débloqué')}
                  </Text>
                  {badge.unlockedDate && (
                    <Text
                      style={[
                        styles.statusDate,
                        {
                          color: badge.color,
                        },
                      ]}
                    >
                      {badge.unlockedDate.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: `${theme.colors.textSecondary}15`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <View style={styles.statusText}>
                  <Text
                    style={[
                      styles.statusLabel,
                      {
                        color: theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {t('badges.lockedStatus', 'Verrouillé')}
                  </Text>
                  {badge.progress !== undefined && (
                    <Text
                      style={[
                        styles.statusDate,
                        {
                          color: theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {badge.progress}% {t('badges.complete', 'complet')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Progress Bar */}
            {!badge.isUnlocked && badge.progress !== undefined && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
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
                    },
                  ]}
                >
                  {badge.progress}% {t('badges.progress', 'progression')}
                </Text>
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={handleClose}
          >
            <Text style={styles.footerText}>
              {t('common.close', 'Fermer')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  headerName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  requirementBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  requirementText: {
    flex: 1,
  },
  requirementLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  requirementValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  statusText: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressSection: {
    gap: 8,
    paddingTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BadgeDetailModal;
