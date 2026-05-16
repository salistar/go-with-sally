// ============================================================
// 📄 BadgeCelebrationModal.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[BadgeCelebrationModal.tsx] ▶ Module loaded')
//   • console.log('[BadgeCelebrationModal.tsx] ▶ BadgeCelebrationModal() rendered')
//   • console.log('[BadgeCelebrationModal.tsx] ▶ handleClose() called')
// ============================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[BadgeCelebrationModal.tsx]';
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
}

/**
 * BadgeCelebrationModal Props
 */
interface BadgeCelebrationModalProps {
  visible: boolean;
  badge?: Badge;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

/**
 * BadgeCelebrationModal Component
 * Celebration animation when a badge is unlocked
 */
const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({
  visible,
  badge,
  onClose,
  autoClose = true,
  autoCloseDuration = 3000,
}) => {
  console.log(`${FILE_NAME} ▶ BadgeCelebrationModal() rendered with visible: ${visible}`);

  const { theme } = useTheme();
  const { t } = useTranslation();

  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    console.log(`${FILE_NAME} ▶ handleClose() called`);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
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
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={[badge.color, badge.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.background}
          >
            {/* Confetti-like decorations */}
            {[...Array(12)].map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name="star"
                size={20 + (i % 3) * 10}
                color={`rgba(255, 255, 255, ${0.3 + (i % 3) * 0.2})`}
                style={{
                  position: 'absolute',
                  top: `${20 + (i % 4) * 20}%`,
                  left: `${10 + (i % 5) * 18}%`,
                }}
              />
            ))}

            {/* Main Content */}
            <View style={styles.content}>
              {/* Badge Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={badge.icon as any}
                  size={80}
                  color="white"
                />
              </View>

              {/* Congratulations Text */}
              <Text style={styles.congratulations}>
                {t('badges.congratulations', 'Félicitations!')}
              </Text>

              {/* Badge Name */}
              <Text style={styles.badgeName}>{badge.name}</Text>

              {/* Badge Description */}
              <Text style={styles.badgeDescription}>
                {badge.description}
              </Text>

              {/* Unlock Status */}
              <View style={styles.unlockedBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="white"
                />
                <Text style={styles.unlockedText}>
                  {t('badges.badgeUnlocked', 'Badge débloqué!')}
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>
                {t('common.ok', 'OK')}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  background: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  congratulations: {
    color: 'white',
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: 1,
  },
  badgeName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    gap: 8,
  },
  unlockedText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BadgeCelebrationModal;
