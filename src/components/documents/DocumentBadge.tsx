// components/documents/DocumentBadge.tsx
// Badge de statut des documents Go With Sally

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DocumentBadgeType, DOCUMENT_BADGES, OverallDocumentStatus } from '../../types/documents';

// ==================== TYPES ====================

interface DocumentBadgeProps {
  status: OverallDocumentStatus;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
}

// ==================== COMPONENT ====================

const DocumentBadge: React.FC<DocumentBadgeProps> = ({
  status,
  onPress,
  size = 'medium',
  showLabel = true,
  style,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'ar' | 'fr' | 'en';
  
  const badgeType = getBadgeType(status);
  const badge = DOCUMENT_BADGES[badgeType];
  
  const sizeStyles = getSizeStyles(size);
  
  const content = (
    <View style={[styles.container, sizeStyles.container, { backgroundColor: badge.color + '15' }, style]}>
      <View style={[styles.iconContainer, sizeStyles.iconContainer, { backgroundColor: badge.color }]}>
        <Ionicons 
          name={badge.icon as any} 
          size={sizeStyles.iconSize} 
          color="#FFF" 
        />
      </View>
      {showLabel && (
        <Text 
          style={[styles.label, sizeStyles.label, { color: badge.color }]}
          numberOfLines={1}
        >
          {badge.label[currentLang]}
        </Text>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }
  
  return content;
};

// ==================== HELPERS ====================

function getBadgeType(status: OverallDocumentStatus): DocumentBadgeType {
  switch (status) {
    case 'not_submitted':
    case 'partial':
      return 'not_submitted';
    case 'pending_review':
      return 'pending_verification';
    case 'verified':
      return 'verified';
    case 'rejected':
      return 'rejected';
    case 'requires_update':
      return 'rejected';
    default:
      return 'not_submitted';
  }
}

function getSizeStyles(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
        iconContainer: { width: 20, height: 20, borderRadius: 10 },
        iconSize: 12,
        label: { fontSize: 11, marginLeft: 6 },
      };
    case 'large':
      return {
        container: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
        iconContainer: { width: 36, height: 36, borderRadius: 18 },
        iconSize: 20,
        label: { fontSize: 15, marginLeft: 12 },
      };
    default: // medium
      return {
        container: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
        iconContainer: { width: 28, height: 28, borderRadius: 14 },
        iconSize: 16,
        label: { fontSize: 13, marginLeft: 8 },
      };
  }
}

// ==================== COMPACT BADGE ====================

interface CompactBadgeProps {
  status: OverallDocumentStatus;
  progress?: number;
}

export const CompactDocumentBadge: React.FC<CompactBadgeProps> = ({ 
  status, 
  progress = 0 
}) => {
  const badgeType = getBadgeType(status);
  const badge = DOCUMENT_BADGES[badgeType];
  
  return (
    <View style={[styles.compactContainer, { borderColor: badge.color }]}>
      <Ionicons name={badge.icon as any} size={14} color={badge.color} />
      {progress > 0 && progress < 100 && (
        <Text style={[styles.progressText, { color: badge.color }]}>
          {progress}%
        </Text>
      )}
    </View>
  );
};

// ==================== INLINE BADGE ====================

interface InlineBadgeProps {
  status: OverallDocumentStatus;
}

export const InlineDocumentBadge: React.FC<InlineBadgeProps> = ({ status }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'ar' | 'fr' | 'en';
  
  const badgeType = getBadgeType(status);
  const badge = DOCUMENT_BADGES[badgeType];
  
  return (
    <View style={[styles.inlineContainer, { backgroundColor: badge.color + '15' }]}>
      <View style={[styles.inlineDot, { backgroundColor: badge.color }]} />
      <Text style={[styles.inlineText, { color: badge.color }]}>
        {badge.label[currentLang]}
      </Text>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DocumentBadge;