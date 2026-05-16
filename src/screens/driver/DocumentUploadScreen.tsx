// screens/driver/DocumentUploadScreen.tsx
// Écran d'upload de document Go With Sally

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { useDocuments } from '../../hooks/useDocuments';
import { DocumentType, DOCUMENT_REQUIREMENTS } from '../../types/documents';
import { DOCUMENTS_CONFIG, DOCUMENT_STATUS_CONFIG, UPLOAD_TIPS } from '../../constants/documents';

// ==================== TYPES ====================

type RouteParams = {
  DocumentUpload: {
    documentType: DocumentType;
  };
};

// ==================== COMPONENT ====================

const DocumentUploadScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'DocumentUpload'>>();
  const isRTL = i18n.language === 'ar';
  
  const { documentType } = route.params;
  
  const { 
    documents, 
    upload, 
    remove, 
    isUploading,
    error,
  } = useDocuments({ autoFetch: false });
  
  const currentDocument = documents[documentType];
  const requirement = DOCUMENT_REQUIREMENTS.find(r => r.type === documentType);
  
  // Local state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // ==================== HANDLERS ====================
  
  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('common.permissionRequired'),
        t('documents.cameraPermissionRequired')
      );
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: DOCUMENTS_CONFIG.IMAGE_QUALITY,
      allowsEditing: true,
      aspect: [4, 3],
    });
    
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: `${documentType}_${Date.now()}.jpg`,
      });
    }
  }, [documentType, t]);
  
  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('common.permissionRequired'),
        t('documents.galleryPermissionRequired')
      );
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: DOCUMENTS_CONFIG.IMAGE_QUALITY,
      allowsEditing: true,
      aspect: [4, 3],
    });
    
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: `${documentType}_${Date.now()}.jpg`,
      });
    }
  }, [documentType, t]);
  
  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: requirement?.allowedFormats || ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    
    if (result.canceled === false && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: asset.mimeType || 'application/pdf',
        name: asset.name,
      });
    }
  }, [requirement]);
  
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    // Animation de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
    
    const success = await upload(documentType, selectedFile);
    
    if (success) {
      Alert.alert(
        t('documents.uploadSuccess'),
        t('documents.uploadSuccessDescription'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } else {
      progressAnim.setValue(0);
      Alert.alert(
        t('documents.uploadFailed'),
        error || t('documents.uploadFailedDescription')
      );
    }
  }, [selectedFile, upload, documentType, t, navigation, error, progressAnim]);
  
  const handleDelete = useCallback(async () => {
    Alert.alert(
      t('documents.deleteDocument'),
      t('documents.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            await remove(documentType);
            setSelectedFile(null);
          }
        },
      ]
    );
  }, [remove, documentType, t]);
  
  const handleBack = useCallback(() => {
    if (selectedFile && !currentDocument) {
      Alert.alert(
        t('documents.discardChanges'),
        t('documents.discardChangesDescription'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.discard'), onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [selectedFile, currentDocument, navigation, t]);
  
  // ==================== RENDER HELPERS ====================
  
  const renderTips = () => {
    const lang = i18n.language as 'ar' | 'fr' | 'en';
    const tips = documentType.includes('vehicle') 
      ? UPLOAD_TIPS.vehicle[lang]
      : documentType === 'profilePhoto'
        ? UPLOAD_TIPS.profile[lang]
        : UPLOAD_TIPS.general[lang];
    
    return (
      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, isRTL && styles.rtlText]}>
          {t('documents.tips')}
        </Text>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
            <Text style={[styles.tipText, isRTL && styles.rtlText]}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderCurrentDocument = () => {
    if (!currentDocument) return null;
    
    const statusConfig = DOCUMENT_STATUS_CONFIG[currentDocument.status];
    
    return (
      <View style={styles.currentDocContainer}>
        <View style={styles.currentDocHeader}>
          <Text style={[styles.currentDocTitle, isRTL && styles.rtlText]}>
            {t('documents.currentDocument')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label[i18n.language as 'ar' | 'fr' | 'en']}
            </Text>
          </View>
        </View>
        
        {currentDocument.url && (
          <TouchableOpacity 
            style={styles.currentDocPreview}
            onPress={() => setPreviewVisible(true)}
          >
            <Image 
              source={{ uri: currentDocument.url }} 
              style={styles.currentDocImage}
              resizeMode="cover"
            />
            <View style={styles.previewOverlay}>
              <Ionicons name="expand" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}
        
        {currentDocument.status === 'rejected' && currentDocument.rejectionReason && (
          <View style={styles.rejectionContainer}>
            <Ionicons name="alert-circle" size={16} color="#E74C3C" />
            <Text style={styles.rejectionText}>{currentDocument.rejectionReason}</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.replaceButton} onPress={handleDelete}>
          <Ionicons name="refresh" size={18} color="#8E44AD" />
          <Text style={styles.replaceButtonText}>{t('documents.replaceDocument')}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderUploadOptions = () => (
    <View style={styles.uploadOptions}>
      <TouchableOpacity style={styles.uploadOption} onPress={handleTakePhoto}>
        <View style={styles.uploadOptionIcon}>
          <Ionicons name="camera" size={32} color="#8E44AD" />
        </View>
        <Text style={[styles.uploadOptionText, isRTL && styles.rtlText]}>
          {t('documents.takePhoto')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.uploadOption} onPress={handlePickImage}>
        <View style={styles.uploadOptionIcon}>
          <Ionicons name="images" size={32} color="#8E44AD" />
        </View>
        <Text style={[styles.uploadOptionText, isRTL && styles.rtlText]}>
          {t('documents.chooseFromGallery')}
        </Text>
      </TouchableOpacity>
      
      {requirement?.allowedFormats.includes('application/pdf') && (
        <TouchableOpacity style={styles.uploadOption} onPress={handlePickDocument}>
          <View style={styles.uploadOptionIcon}>
            <Ionicons name="document" size={32} color="#8E44AD" />
          </View>
          <Text style={[styles.uploadOptionText, isRTL && styles.rtlText]}>
            {t('documents.uploadPDF')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  const renderSelectedFile = () => {
    if (!selectedFile) return null;
    
    const isImage = selectedFile.type.startsWith('image/');
    
    return (
      <View style={styles.selectedFileContainer}>
        {isImage ? (
          <Image 
            source={{ uri: selectedFile.uri }} 
            style={styles.selectedImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.pdfPreview}>
            <Ionicons name="document-text" size={48} color="#E74C3C" />
            <Text style={styles.pdfName}>{selectedFile.name}</Text>
          </View>
        )}
        
        <View style={styles.selectedFileActions}>
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={() => setSelectedFile(null)}
          >
            <Text style={styles.changeButtonText}>{t('documents.change')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // ==================== RENDER ====================
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons 
            name={isRTL ? 'arrow-forward' : 'arrow-back'} 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]} numberOfLines={1}>
          {requirement?.description[i18n.language as 'ar' | 'fr' | 'en']}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Instructions */}
        <Text style={[styles.instructions, isRTL && styles.rtlText]}>
          {requirement?.instructions[i18n.language as 'ar' | 'fr' | 'en']}
        </Text>
        
        {/* Tips */}
        {renderTips()}
        
        {/* Current Document */}
        {renderCurrentDocument()}
        
        {/* Upload Options or Selected File */}
        {!currentDocument && (
          selectedFile ? renderSelectedFile() : renderUploadOptions()
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#8E44AD" />
            <Text style={styles.uploadingText}>{t('documents.uploading')}</Text>
            <View style={styles.uploadProgressBar}>
              <Animated.View 
                style={[
                  styles.uploadProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Upload Button */}
      {selectedFile && !isUploading && !currentDocument && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Ionicons name="cloud-upload" size={20} color="#FFF" />
            <Text style={styles.uploadButtonText}>{t('documents.upload')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  rtlText: {
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#388E3C',
    marginLeft: 8,
    flex: 1,
  },
  currentDocContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currentDocTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  currentDocPreview: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  currentDocImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionText: {
    fontSize: 13,
    color: '#E74C3C',
    marginLeft: 8,
    flex: 1,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#8E44AD',
    borderRadius: 8,
  },
  replaceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    marginLeft: 8,
  },
  uploadOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  uploadOption: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedFileContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
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
  },
  selectedFileActions: {
    padding: 12,
    alignItems: 'center',
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '500',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  uploadProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#8E44AD',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});

export default DocumentUploadScreen;