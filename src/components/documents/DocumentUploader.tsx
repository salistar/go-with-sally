// components/documents/DocumentUploader.tsx
// Composant d'upload de document Go With Sally

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';

import { DocumentType, DOCUMENT_REQUIREMENTS } from '../../types/documents';
import { DOCUMENTS_CONFIG } from '../../constants/documents';

// ==================== TYPES ====================

interface DocumentUploaderProps {
  documentType: DocumentType;
  onFileSelected: (file: { uri: string; type: string; name: string }) => void;
  currentFile?: { uri: string; type: string; name: string } | null;
  onClear?: () => void;
  disabled?: boolean;
  error?: string;
}

// ==================== COMPONENT ====================

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  onFileSelected,
  currentFile,
  onClear,
  disabled = false,
  error,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [isLoading, setIsLoading] = useState(false);
  
  const requirement = DOCUMENT_REQUIREMENTS.find(r => r.type === documentType);
  const allowsPDF = requirement?.allowedFormats.includes('application/pdf');
  
  // ==================== HANDLERS ====================
  
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('documents.cameraPermissionRequired')
      );
      return false;
    }
    return true;
  };
  
  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('documents.galleryPermissionRequired')
      );
      return false;
    }
    return true;
  };
  
  const handleTakePhoto = useCallback(async () => {
    if (disabled || isLoading) return;
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    setIsLoading(true);
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: DOCUMENTS_CONFIG.IMAGE_QUALITY,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onFileSelected({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: `${documentType}_${Date.now()}.jpg`,
        });
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('documents.cameraError'));
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, documentType, onFileSelected, t]);
  
  const handlePickImage = useCallback(async () => {
    if (disabled || isLoading) return;
    
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    setIsLoading(true);
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: DOCUMENTS_CONFIG.IMAGE_QUALITY,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onFileSelected({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: `${documentType}_${Date.now()}.jpg`,
        });
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('documents.galleryError'));
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, documentType, onFileSelected, t]);
  
  const handlePickDocument = useCallback(async () => {
    if (disabled || isLoading || !allowsPDF) return;
    
    setIsLoading(true);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onFileSelected({
          uri: asset.uri,
          type: asset.mimeType || 'application/pdf',
          name: asset.name,
        });
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('documents.documentPickerError'));
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, allowsPDF, onFileSelected, t]);
  
  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    }
  }, [onClear]);
  
  const showOptions = useCallback(() => {
    const options = [
      { text: t('documents.takePhoto'), onPress: handleTakePhoto },
      { text: t('documents.chooseFromGallery'), onPress: handlePickImage },
    ];
    
    if (allowsPDF) {
      options.push({ text: t('documents.uploadPDF'), onPress: handlePickDocument });
    }
    
    options.push({ text: t('common.cancel'), style: 'cancel' as const });
    
    Alert.alert(
      t('documents.selectSource'),
      undefined,
      options
    );
  }, [t, allowsPDF, handleTakePhoto, handlePickImage, handlePickDocument]);
  
  // ==================== RENDER ====================
  
  if (currentFile) {
    const isImage = currentFile.type.startsWith('image/');
    
    return (
      <View style={styles.previewContainer}>
        {isImage ? (
          <Image 
            source={{ uri: currentFile.uri }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.pdfPreview}>
            <Ionicons name="document-text" size={48} color="#E74C3C" />
            <Text style={styles.pdfName} numberOfLines={1}>
              {currentFile.name}
            </Text>
          </View>
        )}
        
        {!disabled && (
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.changeButton}
              onPress={showOptions}
            >
              <Ionicons name="refresh" size={18} color="#8E44AD" />
              <Text style={styles.changeButtonText}>{t('documents.change')}</Text>
            </TouchableOpacity>
            
            {onClear && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Ionicons name="close" size={18} color="#E74C3C" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.uploadArea,
          disabled && styles.uploadAreaDisabled,
          error && styles.uploadAreaError,
        ]}
        onPress={showOptions}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#8E44AD" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-upload-outline" size={40} color="#8E44AD" />
            </View>
            <Text style={[styles.uploadText, isRTL && styles.rtlText]}>
              {t('documents.tapToUpload')}
            </Text>
            <Text style={[styles.uploadHint, isRTL && styles.rtlText]}>
              {allowsPDF 
                ? t('documents.supportedFormatsWithPDF')
                : t('documents.supportedFormats')
              }
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {/* Quick action buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={handleTakePhoto}
          disabled={disabled || isLoading}
        >
          <Ionicons name="camera" size={24} color="#666" />
          <Text style={styles.quickButtonText}>{t('documents.camera')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={handlePickImage}
          disabled={disabled || isLoading}
        >
          <Ionicons name="images" size={24} color="#666" />
          <Text style={styles.quickButtonText}>{t('documents.gallery')}</Text>
        </TouchableOpacity>
        
        {allowsPDF && (
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={handlePickDocument}
            disabled={disabled || isLoading}
          >
            <Ionicons name="document" size={24} color="#666" />
            <Text style={styles.quickButtonText}>PDF</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {},
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    minHeight: 180,
  },
  uploadAreaDisabled: {
    opacity: 0.5,
  },
  uploadAreaError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FEF5F5',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  rtlText: {
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  quickButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  quickButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  pdfPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF5E7',
  },
  pdfName: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '500',
    marginLeft: 6,
  },
  clearButton: {
    padding: 8,
    marginLeft: 12,
  },
});

export default DocumentUploader;