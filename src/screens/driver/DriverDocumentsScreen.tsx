// screens/driver/DriverDocumentsScreen.tsx
// Écran des documents conductrice Go With Sally

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// ==================== TYPES ====================

export interface DriverDocumentsScreenProps {
  onVerificationComplete?: () => void;
  onComplete?: () => void; // Alias for compatibility
}

type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'missing';

interface Document {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  expiresAt?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

type DocumentBadgeType = 'not_submitted' | 'pending_verification' | 'verified' | 'rejected';

// ==================== MOCK DATA ====================

const MOCK_DOCUMENTS: Document[] = [
  { id: '1', type: 'cin_front', name: 'CIN (Recto)', status: 'approved', uploadedAt: '2024-01-15' },
  { id: '2', type: 'cin_back', name: 'CIN (Verso)', status: 'approved', uploadedAt: '2024-01-15' },
  { id: '3', type: 'driving_license_front', name: 'Permis de conduire (Recto)', status: 'approved', uploadedAt: '2024-01-20' },
  { id: '4', type: 'driving_license_back', name: 'Permis de conduire (Verso)', status: 'approved', uploadedAt: '2024-01-20' },
  { id: '5', type: 'vehicle_registration', name: 'Carte grise', status: 'approved', uploadedAt: '2024-01-22' },
  { id: '6', type: 'insurance', name: 'Assurance véhicule', status: 'approved', uploadedAt: '2024-01-22' },
  { id: '7', type: 'vehicle_photo_front', name: 'Photo véhicule (Avant)', status: 'approved', uploadedAt: '2024-01-25' },
  { id: '8', type: 'vehicle_photo_back', name: 'Photo véhicule (Arrière)', status: 'approved', uploadedAt: '2024-01-25' },
  { id: '9', type: 'vehicle_photo_interior', name: 'Photo véhicule (Intérieur)', status: 'approved', uploadedAt: '2024-01-25' },
];

const DOCUMENT_CATEGORIES = {
  identity: {
    label: { ar: 'الهوية', fr: 'Identité', en: 'Identity' },
    icon: 'person-outline',
    order: 1,
    types: ['cin_front', 'cin_back'],
  },
  driving: {
    label: { ar: 'رخصة السياقة', fr: 'Permis', en: 'License' },
    icon: 'car-outline',
    order: 2,
    types: ['driving_license_front', 'driving_license_back'],
  },
  vehicle: {
    label: { ar: 'السيارة', fr: 'Véhicule', en: 'Vehicle' },
    icon: 'document-outline',
    order: 3,
    types: ['vehicle_registration', 'insurance'],
  },
  photos: {
    label: { ar: 'الصور', fr: 'Photos', en: 'Photos' },
    icon: 'camera-outline',
    order: 4,
    types: ['vehicle_photo_front', 'vehicle_photo_back', 'vehicle_photo_interior'],
  },
};

// ==================== COMPONENT ====================

const DriverDocumentsScreen: React.FC<DriverDocumentsScreenProps> = ({
  onVerificationComplete,
  onComplete,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = i18n.language === 'ar';
  
  // Use either callback
  const handleComplete = onVerificationComplete || onComplete;
  
  // State
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('identity');
  
  // ==================== COMPUTED ====================
  
  const totalDocuments = documents.length;
  const submittedCount = documents.filter(d => d.status !== 'missing').length;
  const verifiedCount = documents.filter(d => d.status === 'approved').length;
  const submissionProgress = totalDocuments > 0 ? (submittedCount / totalDocuments) * 100 : 0;
  const verificationProgress = totalDocuments > 0 ? (verifiedCount / totalDocuments) * 100 : 0;
  
  const missingDocuments = documents.filter(d => d.status === 'missing');
  const rejectedDocuments = documents.filter(d => d.status === 'rejected');
  const pendingDocuments = documents.filter(d => d.status === 'pending');
  
  const overallStatus: 'not_submitted' | 'partial' | 'pending_review' | 'verified' | 'rejected' = 
    verifiedCount === totalDocuments ? 'verified' :
    rejectedDocuments.length > 0 ? 'rejected' :
    pendingDocuments.length > 0 ? 'pending_review' :
    submittedCount > 0 ? 'partial' : 'not_submitted';
  
  // ==================== EFFECTS ====================
  
  useEffect(() => {
    // Si tous les documents sont approuvés, déclencher la completion
    if (overallStatus === 'verified' && handleComplete) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [overallStatus, handleComplete]);
  
  // ==================== HANDLERS ====================
  
  const fetchAll = useCallback(async (force?: boolean) => {
    // Mock fetch
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  }, [fetchAll]);
  
  const handleDocumentPress = useCallback((type: string) => {
    navigation.navigate('DocumentUpload', { documentType: type });
  }, [navigation]);
  
  const handleCategoryToggle = useCallback((category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  }, []);
  
  const getBadgeType = (): DocumentBadgeType => {
    switch (overallStatus) {
      case 'verified': return 'verified';
      case 'rejected': return 'rejected';
      case 'pending_review': return 'pending_verification';
      default: return 'not_submitted';
    }
  };
  
  // ==================== RENDER HELPERS ====================
  
  const renderDocumentBadge = () => {
    const badgeType = getBadgeType();
    const badges: Record<DocumentBadgeType, { icon: string; color: string; label: string }> = {
      not_submitted: { icon: 'document-outline', color: '#9CA3AF', label: 'Non soumis' },
      pending_verification: { icon: 'time-outline', color: '#F59E0B', label: 'En attente' },
      verified: { icon: 'checkmark-circle', color: '#10B981', label: 'Vérifié' },
      rejected: { icon: 'close-circle', color: '#EF4444', label: 'Refusé' },
    };
    const badge = badges[badgeType];
    
    return (
      <View style={[styles.badge, { backgroundColor: `${badge.color}20` }]}>
        <Ionicons name={badge.icon as any} size={32} color={badge.color} />
        <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
      </View>
    );
  };
  
  const renderProgressHeader = () => (
    <View style={styles.progressHeader}>
      {renderDocumentBadge()}
      
      <View style={styles.progressStats}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{t('documents.submitted') || 'Soumis'}</Text>
          <Text style={styles.progressValue}>{submittedCount}/{totalDocuments}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${submissionProgress}%` }]} />
        </View>
        
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{t('documents.verified') || 'Vérifiés'}</Text>
          <Text style={styles.progressValue}>{verifiedCount}/{totalDocuments}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              styles.progressBarVerified,
              { width: `${verificationProgress}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
  
  const renderRejectedAlert = () => {
    if (rejectedDocuments.length === 0) return null;
    
    return (
      <View style={styles.alertContainer}>
        <Ionicons name="alert-circle" size={24} color="#E74C3C" />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>
            {t('documents.documentsRejected', { count: rejectedDocuments.length }) || 
              `${rejectedDocuments.length} document(s) refusé(s)`}
          </Text>
          <Text style={styles.alertDescription}>
            {t('documents.pleaseResubmit') || 'Veuillez les soumettre à nouveau'}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderDocumentItem = (doc: Document) => {
    const statusConfig: Record<DocumentStatus, { icon: string; color: string }> = {
      approved: { icon: 'checkmark-circle', color: '#10B981' },
      pending: { icon: 'time-outline', color: '#F59E0B' },
      rejected: { icon: 'close-circle', color: '#EF4444' },
      expired: { icon: 'alert-circle', color: '#F97316' },
      missing: { icon: 'add-circle-outline', color: '#9CA3AF' },
    };
    const config = statusConfig[doc.status];
    
    return (
      <TouchableOpacity
        key={doc.id}
        style={styles.documentItem}
        onPress={() => handleDocumentPress(doc.type)}
      >
        <View style={[styles.documentIcon, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{doc.name}</Text>
          <Text style={[styles.documentStatus, { color: config.color }]}>
            {doc.status === 'approved' ? 'Approuvé' :
             doc.status === 'pending' ? 'En attente' :
             doc.status === 'rejected' ? 'Refusé' :
             doc.status === 'expired' ? 'Expiré' : 'Manquant'}
          </Text>
          {doc.rejectionReason && (
            <Text style={styles.rejectionReason}>{doc.rejectionReason}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };
  
  const renderCategory = (categoryKey: string) => {
    const category = DOCUMENT_CATEGORIES[categoryKey as keyof typeof DOCUMENT_CATEGORIES];
    if (!category) return null;
    
    const isExpanded = expandedCategory === categoryKey;
    const categoryDocs = documents.filter(d => category.types.includes(d.type));
    const categoryApproved = categoryDocs.filter(d => d.status === 'approved').length;
    
    return (
      <View key={categoryKey} style={styles.categoryContainer}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => handleCategoryToggle(categoryKey)}
        >
          <View style={styles.categoryInfo}>
            <Ionicons name={category.icon as any} size={24} color="#8E44AD" />
            <Text style={[styles.categoryTitle, isRTL && styles.rtlText]}>
              {category.label[i18n.language as 'ar' | 'fr' | 'en'] || category.label.fr}
            </Text>
          </View>
          
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCount}>
              {categoryApproved}/{categoryDocs.length}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.categoryContent}>
            {categoryDocs.map(renderDocumentItem)}
          </View>
        )}
      </View>
    );
  };
  
  // ==================== RENDER ====================
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name={isRTL ? 'arrow-forward' : 'arrow-back'} 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
          {t('documents.myDocuments') || 'Mes documents'}
        </Text>
        
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => Alert.alert(
            t('documents.help') || 'Aide',
            t('documents.helpDescription') || 'Tous les documents doivent être vérifiés pour conduire.'
          )}
        >
          <Ionicons name="help-circle-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8E44AD']}
            tintColor="#8E44AD"
          />
        }
      >
        {/* Progress Header */}
        {renderProgressHeader()}
        
        {/* Rejected Alert */}
        {renderRejectedAlert()}
        
        {/* Categories */}
        {Object.keys(DOCUMENT_CATEGORIES)
          .sort((a, b) => 
            DOCUMENT_CATEGORIES[a as keyof typeof DOCUMENT_CATEGORIES].order - 
            DOCUMENT_CATEGORIES[b as keyof typeof DOCUMENT_CATEGORIES].order
          )
          .map(renderCategory)
        }
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3498DB" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>
              {t('documents.whyDocuments') || 'Pourquoi ces documents ?'}
            </Text>
            <Text style={[styles.infoDescription, isRTL && styles.rtlText]}>
              {t('documents.documentsExplanation') || 
                'Ces documents sont nécessaires pour vérifier votre identité et votre véhicule.'}
            </Text>
          </View>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* CTA */}
      {overallStatus === 'verified' && (
        <View style={styles.ctaContainer}>
          <View style={styles.ctaSuccess}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
            <Text style={styles.ctaSuccessText}>
              {t('documents.allVerified') || 'Tous les documents sont vérifiés !'}
            </Text>
          </View>
        </View>
      )}
      
      {overallStatus !== 'verified' && missingDocuments.length > 0 && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => handleDocumentPress(missingDocuments[0].type)}
          >
            <Ionicons name="cloud-upload" size={20} color="#FFF" />
            <Text style={styles.ctaButtonText}>
              {t('documents.addDocument') || 'Ajouter un document'}
            </Text>
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
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  helpButton: {
    padding: 8,
  },
  rtlText: {
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  progressHeader: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  progressStats: {
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 4,
  },
  progressBarVerified: {
    backgroundColor: '#27AE60',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  alertDescription: {
    fontSize: 12,
    color: '#C0392B',
    marginTop: 2,
  },
  categoryContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  rejectionReason: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
    fontStyle: 'italic',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2980B9',
  },
  infoDescription: {
    fontSize: 12,
    color: '#5DADE2',
    marginTop: 4,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
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
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  ctaSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  ctaSuccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
    marginLeft: 8,
  },
});

export default DriverDocumentsScreen;