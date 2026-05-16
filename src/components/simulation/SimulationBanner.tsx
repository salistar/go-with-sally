/**
 * GO WITH SALLY - SIMULATION BANNER COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { APP_MODE } from '../../config/appMode';

interface SimulationBannerProps {
  visible?: boolean;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  compact?: boolean;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  visible = true,
  onDismiss,
  position = 'top',
  compact = false,
}) => {
  const { t } = useTranslation();

  if (!visible || APP_MODE === 'online') {
    return null;
  }

  const modeConfig = {
    offline: {
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
      icon: '🔴',
      label: t('simulation.offlineMode'),
      description: t('simulation.offlineDesc'),
    },
    hybrid: {
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      icon: '🟡',
      label: t('simulation.hybridMode'),
      description: t('simulation.hybridDesc'),
    },
    online: {
      color: '#059669',
      backgroundColor: '#D1FAE5',
      icon: '🟢',
      label: t('simulation.onlineMode'),
      description: '',
    },
  };

  const config = modeConfig[APP_MODE];

  if (compact) {
    return (
      <View
        style={[
          styles.compactBanner,
          { backgroundColor: config.backgroundColor },
          position === 'bottom' && styles.bottomPosition,
        ]}
      >
        <Text style={styles.compactIcon}>{config.icon}</Text>
        <Text style={[styles.compactText, { color: config.color }]}>
          {config.label}
        </Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={[styles.dismissText, { color: config.color }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: config.backgroundColor },
        position === 'bottom' && styles.bottomPosition,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: config.color }]}>
            {config.label}
          </Text>
          {config.description && (
            <Text style={[styles.description, { color: config.color }]}>
              {config.description}
            </Text>
          )}
        </View>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={[styles.dismissText, { color: config.color }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Floating Badge Version
export const SimulationBadge: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();

  if (APP_MODE === 'online') {
    return null;
  }

  const config = {
    offline: { icon: '🔴', color: '#DC2626', bg: '#FEE2E2' },
    hybrid: { icon: '🟡', color: '#D97706', bg: '#FEF3C7' },
    online: { icon: '🟢', color: '#059669', bg: '#D1FAE5' },
  };

  const c = config[APP_MODE];

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: c.bg, borderColor: c.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.badgeIcon}>{c.icon}</Text>
      <Text style={[styles.badgeText, { color: c.color }]}>
        {APP_MODE === 'offline' ? 'OFFLINE' : 'HYBRID'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Compact styles
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SimulationBanner;