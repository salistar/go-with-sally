// components/documents/DocumentCard.tsx
// Carte de document Go With Sally

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Document, DocumentType, DocumentStatus, DOCUMENT_REQUIREMENTS } from '../../types/documents';
import { DOCUMENT_STATUS_CONFIG, DOCUMENT_TYPES_INFO } from '../../constants/documents';

// ==================== TYPES ====================

interface DocumentCardProps {
  type: DocumentType;
  document: Document | null;
  onPress: (type: DocumentType) => void;
  onUpload?: (type: DocumentType) => void;
  onView?: (document: Document) => void;
  onDelete?: (type: DocumentType) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ==================== COMPONENT ====================

const DocumentCard: React.FC<DocumentCardProps> = ({
  type,
  document,
  onPress,
  onUpload,
  onView,
  onDelete,
  disabled = false,
  compact = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ar' | 'fr' | 'en';
  
  const requirement = DOCUMENT_REQUIREMENTS.find(r => r.type === type);
  const typeInfo = DOCUMENT_TYPES_INFO[type];
  const statusConfig = document ? DOCUMENT_STATUS_CONFIG[document.status] : null;
  
  const handlePress = () => {
    if (disabled) return;
    
    if (document && document.status !== 'not_submitted') {
      onView?.(document);
    } else {
      onPress(type);
    }
  };
  
  const renderStatus = () => {
    if (!document || document.status === 'not_submitted') {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="cloud-upload-outline" size={14} color="#F59E0B" />
          <Text style={[styles.statusText, { color: '#F59E0B' }]}>
            {t('documents.notSubmitted')}
          </Text>
        </View>
      );
    }
    
    const config = DOCUMENT_STATUS_CONFIG[document.status];
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label[currentLang]}
        </Text>
      </View>
    );
  };
  
  const renderThumbnail = () => {
    if (document?.thumbnailUrl) {
      return (
        <Image
          source={{ uri: document.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIconName(typeInfo.icon)} 
          size={compact ? 24 : 32} 
          color="#9CA3AF" 
        />
      </View>
    );
  };
  
  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactContainer,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        {renderThumbnail()}
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {requirement?.description[currentLang]}
          </Text>
          {renderStatus()}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Pressable>
    );
  }
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        document?.status === 'rejected' && styles.rejectedContainer,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.header}>
        {renderThumbnail()}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {requirement?.description[currentLang]}
          </Text>
          {renderStatus()}
        </View>
      </View>
      
      {/* Instructions ou message de rejet */}
      <View style={styles.footer}>
        {document?.status === 'rejected' && document.rejectionReason ? (
          <View style={styles.rejectionContainer}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.rejectionText} numberOfLines={2}>
              {document.rejectionReason}
            </Text>
          </View>
        ) : (
          <Text style={styles.instructionText} numberOfLines={2}>
            {requirement?.instructions[currentLang]}
          </Text>
        )}
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        {!document || document.status === 'not_submitted' || document.status === 'rejected' ? (
          <Pressable
            style={styles.uploadButton}
            onPress={() => onUpload?.(type)}
          >
            <Ionicons name="cloud-upload" size={18} color="#FFF" />
            <Text style={styles.uploadButtonText}>
              {document?.status === 'rejected' 
                ? t('documents.reupload') 
                : t('documents.upload')
              }
            </Text>
          </Pressable>
        ) : (
          <View style={styles.viewActions}>
            <Pressable
              style={styles.viewButton}
              onPress={() => document && onView?.(document)}
            >
              <Ionicons name="eye-outline" size={18} color="#EC4899" />
              <Text style={styles.viewButtonText}>{t('documents.view')}</Text>
            </Pressable>
            
            {document.status !== 'verified' && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => onDelete?.(type)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

// ==================== HELPERS ====================

function getIconName(icon: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'card-account-details': 'card-outline',
    'card-account-details-outline': 'card-outline',
    'badge-account': 'person-outline',
    'badge-account-outline': 'person-outline',
    'file-certificate': 'document-text-outline',
    'shield-check': 'shield-checkmark-outline',
    'file-document-check': 'document-outline',
    'car-side': 'car-outline',
    'car-back': 'car-outline',
    'account-circle': 'person-circle-outline',
  };
  
  return iconMap[icon] || 'document-outline';
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  rejectedContainer: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EC4899',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EC4899',
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
  },
  compactContent: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
});

export default DocumentCard;