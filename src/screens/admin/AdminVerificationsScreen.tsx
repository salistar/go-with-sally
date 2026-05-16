/**
 * ============================================================================
 * GO WITH SALLY - ADMIN VERIFICATIONS SCREEN
 * ============================================================================
 * Gestion des vérifications des conductrices
 * 
 * Fonctionnalités:
 * - Liste des vérifications avec filtres (toutes, en attente, approuvées, rejetées)
 * - Modal de détails avec documents et actions
 * - Approbation / Rejet des conductrices
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminVerificationsScreen
 * @version 2.2.0 - Fixed documents undefined error
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { adminAPI } from '../../services/api';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[AdminVerificationsScreen]';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

type VerificationStatus = 'pending' | 'approved' | 'rejected';
type DocumentType = 'identity' | 'license' | 'vehicle' | 'insurance' | 'photo';
type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

interface Document {
  type: DocumentType;
  name: string;
  status: VerificationStatus;
  url?: string;
}

interface Verification {
  id: string;
  _id?: string;
  driver: {
    id: string;
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    createdAt: string;
  };
  status: VerificationStatus;
  documents?: Document[];
  submittedAt: string;
  notes?: string;
}

// ============================================================================
// DOCUMENTS PAR DÉFAUT
// ============================================================================

const DEFAULT_DOCUMENTS: Document[] = [
  { type: 'identity', name: 'CIN', status: 'pending' },
  { type: 'license', name: 'Permis de conduire', status: 'pending' },
  { type: 'vehicle', name: 'Carte grise', status: 'pending' },
  { type: 'insurance', name: 'Assurance', status: 'pending' },
  { type: 'photo', name: 'Photo de profil', status: 'pending' },
];

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_VERIFICATIONS: Verification[] = [
  {
    id: 'v1',
    driver: {
      id: 'd1',
      firstName: 'Fatima',
      lastName: 'El Amrani',
      email: 'fatima.amrani@email.com',
      phone: '+212 6 12 34 56 78',
      createdAt: '2025-01-10',
    },
    status: 'pending',
    documents: [
      { type: 'identity', name: 'CIN', status: 'approved' },
      { type: 'license', name: 'Permis de conduire', status: 'approved' },
      { type: 'vehicle', name: 'Carte grise', status: 'pending' },
      { type: 'insurance', name: 'Assurance', status: 'pending' },
      { type: 'photo', name: 'Photo de profil', status: 'approved' },
    ],
    submittedAt: '2025-01-15 14:30',
  },
  {
    id: 'v2',
    driver: {
      id: 'd2',
      firstName: 'Khadija',
      lastName: 'Bennani',
      email: 'khadija.b@email.com',
      phone: '+212 6 98 76 54 32',
      createdAt: '2025-01-12',
    },
    status: 'pending',
    documents: [
      { type: 'identity', name: 'CIN', status: 'pending' },
      { type: 'license', name: 'Permis de conduire', status: 'pending' },
      { type: 'vehicle', name: 'Carte grise', status: 'pending' },
      { type: 'insurance', name: 'Assurance', status: 'pending' },
      { type: 'photo', name: 'Photo de profil', status: 'pending' },
    ],
    submittedAt: '2025-01-16 09:15',
  },
  {
    id: 'v3',
    driver: {
      id: 'd3',
      firstName: 'Salma',
      lastName: 'Ouazzani',
      email: 'salma.o@email.com',
      phone: '+212 6 55 44 33 22',
      createdAt: '2025-01-08',
    },
    status: 'approved',
    documents: [
      { type: 'identity', name: 'CIN', status: 'approved' },
      { type: 'license', name: 'Permis de conduire', status: 'approved' },
      { type: 'vehicle', name: 'Carte grise', status: 'approved' },
      { type: 'insurance', name: 'Assurance', status: 'approved' },
      { type: 'photo', name: 'Photo de profil', status: 'approved' },
    ],
    submittedAt: '2025-01-10 11:00',
  },
  {
    id: 'v4',
    driver: {
      id: 'd4',
      firstName: 'Nadia',
      lastName: 'Cherkaoui',
      email: 'nadia.c@email.com',
      phone: '+212 6 11 22 33 44',
      createdAt: '2025-01-05',
    },
    status: 'rejected',
    documents: [
      { type: 'identity', name: 'CIN', status: 'approved' },
      { type: 'license', name: 'Permis de conduire', status: 'rejected' },
      { type: 'vehicle', name: 'Carte grise', status: 'rejected' },
      { type: 'insurance', name: 'Assurance', status: 'pending' },
      { type: 'photo', name: 'Photo de profil', status: 'approved' },
    ],
    submittedAt: '2025-01-07 16:45',
    notes: 'Permis expiré, carte grise illisible',
  },
];

// ============================================================================
// HELPER: Normaliser une vérification
// ============================================================================

const normalizeVerification = (v: any): Verification => {
  return {
    id: v.id || v._id || `v_${Date.now()}`,
    _id: v._id,
    driver: {
      id: v.driver?.id || v.driver?._id || 'unknown',
      _id: v.driver?._id,
      firstName: v.driver?.firstName || 'Prénom',
      lastName: v.driver?.lastName || 'Nom',
      email: v.driver?.email || 'email@example.com',
      phone: v.driver?.phone || '+212 6 00 00 00 00',
      avatar: v.driver?.avatar,
      createdAt: v.driver?.createdAt || new Date().toISOString(),
    },
    status: v.status || 'pending',
    documents: Array.isArray(v.documents) && v.documents.length > 0 
      ? v.documents 
      : DEFAULT_DOCUMENTS,
    submittedAt: v.submittedAt || v.createdAt || new Date().toISOString(),
    notes: v.notes,
  };
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminVerificationsScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadVerifications = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des vérifications...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = MOCK_VERIFICATIONS.map(normalizeVerification);
      if (filter !== 'all') {
        filtered = filtered.filter((v) => v.status === filter);
      }

      setVerifications(filtered);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ ${filtered.length} vérifications (mock)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getPendingVerifications...`);

      const response = await adminAPI.getPendingVerifications();

      if (response.data.success) {
        const fetchedVerifications = response.data.data.verifications || [];
        console.log(`${FILE_NAME} 📦 Données reçues:`, JSON.stringify(fetchedVerifications, null, 2));
        
        // Normaliser toutes les vérifications
        let normalized = fetchedVerifications.map(normalizeVerification);
        
        if (filter !== 'all') {
          normalized = normalized.filter((v: Verification) => v.status === filter);
        }
        setVerifications(normalized);
        console.log(`${FILE_NAME} ✅ ${normalized.length} vérifications normalisées`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        let filtered = MOCK_VERIFICATIONS.map(normalizeVerification);
        if (filter !== 'all') {
          filtered = filtered.filter((v) => v.status === filter);
        }
        setVerifications(filtered);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.verifications.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, t]);

  useEffect(() => {
    loadVerifications();
  }, [filter, loadVerifications]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadVerifications();
  }, [loadVerifications]);

  const handleViewDetails = useCallback((verification: Verification) => {
    console.log(`${FILE_NAME} 📋 Détails: ${verification.id}`);
    setSelectedVerification(verification);
    setModalVisible(true);
  }, []);

  const handleApprove = useCallback(
    (verification: Verification) => {
      const driverName = `${verification.driver.firstName} ${verification.driver.lastName}`;

      Alert.alert(
        t('admin.verifications.approveTitle') || 'Approuver',
        t('admin.verifications.approveConfirm', { name: driverName }) || `Approuver ${driverName} ?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('admin.verifications.approve'),
            style: 'default',
            onPress: async () => {
              setProcessing(true);

              // Mode OFFLINE
              if (IS_OFFLINE) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setVerifications((prev) =>
                  prev.map((v) => (v.id === verification.id ? { ...v, status: 'approved' as const } : v))
                );
                setModalVisible(false);
                setProcessing(false);
                Toast.show({
                  type: 'success',
                  text1: t('admin.verifications.approved') || 'Approuvée',
                  text2: t('admin.verifications.approvedDesc', { name: verification.driver.firstName }) || `${verification.driver.firstName} a été approuvée`,
                });
                return;
              }

              try {
                const driverId = verification.driver._id || verification.driver.id;
                const response = await (adminAPI as any).verifyDriver?.(driverId, 'approved') 
                  || { data: { success: true } };

                if (response.data.success) {
                  setVerifications((prev) =>
                    prev.map((v) => (v.id === verification.id ? { ...v, status: 'approved' as const } : v))
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'success',
                    text1: t('admin.verifications.approved') || 'Approuvée',
                    text2: t('admin.verifications.approvedDesc', { name: verification.driver.firstName }) || `${verification.driver.firstName} a été approuvée`,
                  });
                }
              } catch (error: any) {
                console.error(`${FILE_NAME} ❌ Erreur approbation:`, error?.message);

                if (IS_HYBRID) {
                  setVerifications((prev) =>
                    prev.map((v) => (v.id === verification.id ? { ...v, status: 'approved' as const } : v))
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'success',
                    text1: t('admin.verifications.approved') || 'Approuvée',
                    text2: t('admin.verifications.approvedDesc', { name: verification.driver.firstName }) || `${verification.driver.firstName} a été approuvée`,
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('errors.error'),
                    text2: t('admin.verifications.approveError') || 'Erreur lors de l\'approbation',
                  });
                }
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
    },
    [t]
  );

  const handleReject = useCallback(
    (verification: Verification) => {
      const driverName = `${verification.driver.firstName} ${verification.driver.lastName}`;

      Alert.alert(
        t('admin.verifications.rejectTitle') || 'Rejeter',
        t('admin.verifications.rejectConfirm', { name: driverName }) || `Rejeter ${driverName} ?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('admin.verifications.reject'),
            style: 'destructive',
            onPress: async () => {
              setProcessing(true);

              // Mode OFFLINE
              if (IS_OFFLINE) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setVerifications((prev) =>
                  prev.map((v) => (v.id === verification.id ? { ...v, status: 'rejected' as const } : v))
                );
                setModalVisible(false);
                setProcessing(false);
                Toast.show({
                  type: 'error',
                  text1: t('admin.verifications.rejected') || 'Rejetée',
                  text2: t('admin.verifications.rejectedDesc') || 'La demande a été rejetée',
                });
                return;
              }

              try {
                const driverId = verification.driver._id || verification.driver.id;
                const response = await (adminAPI as any).verifyDriver?.(driverId, 'rejected', 'Documents non conformes')
                  || { data: { success: true } };

                if (response.data.success) {
                  setVerifications((prev) =>
                    prev.map((v) => (v.id === verification.id ? { ...v, status: 'rejected' as const } : v))
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'error',
                    text1: t('admin.verifications.rejected') || 'Rejetée',
                    text2: t('admin.verifications.rejectedDesc') || 'La demande a été rejetée',
                  });
                }
              } catch (error: any) {
                console.error(`${FILE_NAME} ❌ Erreur rejet:`, error?.message);

                if (IS_HYBRID) {
                  setVerifications((prev) =>
                    prev.map((v) => (v.id === verification.id ? { ...v, status: 'rejected' as const } : v))
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'error',
                    text1: t('admin.verifications.rejected') || 'Rejetée',
                    text2: t('admin.verifications.rejectedDesc') || 'La demande a été rejetée',
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('errors.error'),
                    text2: t('admin.verifications.rejectError') || 'Erreur lors du rejet',
                  });
                }
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
    },
    [t]
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#FF9800';
    }
  }, []);

  const getStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'approved':
          return t('admin.verifications.statusApproved') || 'Approuvée';
        case 'rejected':
          return t('admin.verifications.statusRejected') || 'Rejetée';
        default:
          return t('admin.verifications.statusPending') || 'En attente';
      }
    },
    [t]
  );

  const getDocumentIcon = useCallback((type: string) => {
    switch (type) {
      case 'identity':
        return 'card-account-details';
      case 'license':
        return 'card-account-details-star';
      case 'vehicle':
        return 'car';
      case 'insurance':
        return 'shield-check';
      case 'photo':
        return 'account-circle';
      default:
        return 'file-document';
    }
  }, []);

  // Stats calculés à partir de TOUTES les vérifications (pas filtrées)
  const allVerifications = IS_OFFLINE || IS_HYBRID ? MOCK_VERIFICATIONS : verifications;
  const stats = {
    total: allVerifications.length,
    pending: allVerifications.filter((v) => v.status === 'pending').length,
    approved: allVerifications.filter((v) => v.status === 'approved').length,
    rejected: allVerifications.filter((v) => v.status === 'rejected').length,
  };

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading && verifications.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.verifications.loading') || 'Chargement...'}
        </Text>
      </View>
    );
  }

  // ==========================================================================
  // RENDU PRINCIPAL
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('admin.verifications.title') || 'Vérifications'}</Text>

        {__DEV__ ? <ModeBadge /> : <View style={{ width: 40 }} />}
      </View>

      {/* Stats / Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsRow}
        contentContainerStyle={[styles.statsContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        <TouchableOpacity
          style={[
            styles.statChip,
            { backgroundColor: filter === 'all' ? theme.colors.primary : theme.colors.surface },
          ]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statChipText, { color: filter === 'all' ? 'white' : theme.colors.textSecondary }]}>
            {t('admin.verifications.filterAll') || 'Toutes'} ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statChip,
            { backgroundColor: filter === 'pending' ? '#FF9800' : theme.colors.surface },
          ]}
          onPress={() => setFilter('pending')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statChipText, { color: filter === 'pending' ? 'white' : theme.colors.textSecondary }]}>
            {t('admin.verifications.filterPending') || 'En attente'} ({stats.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statChip,
            { backgroundColor: filter === 'approved' ? '#4CAF50' : theme.colors.surface },
          ]}
          onPress={() => setFilter('approved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statChipText, { color: filter === 'approved' ? 'white' : theme.colors.textSecondary }]}>
            {t('admin.verifications.filterApproved') || 'Approuvées'} ({stats.approved})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statChip,
            { backgroundColor: filter === 'rejected' ? '#F44336' : theme.colors.surface },
          ]}
          onPress={() => setFilter('rejected')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statChipText, { color: filter === 'rejected' ? 'white' : theme.colors.textSecondary }]}>
            {t('admin.verifications.filterRejected') || 'Rejetées'} ({stats.rejected})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {verifications.map((verification) => (
            <TouchableOpacity
              key={verification.id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleViewDetails(verification)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.avatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {verification.driver.firstName?.[0] || '?'}
                    {verification.driver.lastName?.[0] || '?'}
                  </Text>
                </View>
                <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>
                    {verification.driver.firstName} {verification.driver.lastName}
                  </Text>
                  <Text style={[styles.cardEmail, { color: theme.colors.textSecondary }]}>
                    {verification.driver.email}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(verification.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(verification.status) }]}>
                    {getStatusLabel(verification.status)}
                  </Text>
                </View>
              </View>

              {/* Documents Row - 5 badges en ligne (avec vérification) */}
              {verification.documents && verification.documents.length > 0 && (
                <View style={[styles.documentsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {verification.documents.map((doc, index) => (
                    <View
                      key={index}
                      style={[styles.docBadge, { backgroundColor: `${getStatusColor(doc.status)}15` }]}
                    >
                      <MaterialCommunityIcons
                        name={getDocumentIcon(doc.type) as any}
                        size={16}
                        color={getStatusColor(doc.status)}
                      />
                    </View>
                  ))}
                </View>
              )}

              <View
                style={[
                  styles.cardFooter,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.cardDate, { color: theme.colors.textSecondary }]}>
                  {t('admin.verifications.submittedAt') || 'Soumis le'} {verification.submittedAt}
                </Text>
                <MaterialCommunityIcons
                  name={isRTL ? 'chevron-left' : 'chevron-right'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}

          {verifications.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('admin.verifications.empty') || 'Aucune vérification'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Mode Footer */}
        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {selectedVerification && (
              <>
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('admin.verifications.viewDetails') || 'Détails'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Driver Info */}
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalDriverHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.modalAvatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                        <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>
                          {selectedVerification.driver.firstName?.[0] || '?'}
                          {selectedVerification.driver.lastName?.[0] || '?'}
                        </Text>
                      </View>
                      <View style={[styles.modalDriverInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.modalDriverName, { color: theme.colors.text }]}>
                          {selectedVerification.driver.firstName} {selectedVerification.driver.lastName}
                        </Text>
                        <Text style={[styles.modalDriverEmail, { color: theme.colors.textSecondary }]}>
                          {selectedVerification.driver.email}
                        </Text>
                        <Text style={[styles.modalDriverPhone, { color: theme.colors.textSecondary }]}>
                          {selectedVerification.driver.phone}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Documents */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.verifications.documents') || 'Documents'}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    {selectedVerification.documents && selectedVerification.documents.length > 0 ? (
                      selectedVerification.documents.map((doc, index) => (
                        <View
                          key={index}
                          style={[
                            styles.docItem,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                            index < (selectedVerification.documents?.length || 0) - 1 && {
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.docIcon, { backgroundColor: `${getStatusColor(doc.status)}15` }]}>
                            <MaterialCommunityIcons
                              name={getDocumentIcon(doc.type) as any}
                              size={20}
                              color={getStatusColor(doc.status)}
                            />
                          </View>
                          <View style={[styles.docInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.docName, { color: theme.colors.text }]}>{doc.name}</Text>
                            <Text style={[styles.docStatus, { color: getStatusColor(doc.status) }]}>
                              {getStatusLabel(doc.status)}
                            </Text>
                          </View>
                          <TouchableOpacity style={styles.docViewBtn} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.noDocsText, { color: theme.colors.textSecondary }]}>
                        Aucun document disponible
                      </Text>
                    )}
                  </View>

                  {/* Notes */}
                  {selectedVerification.notes && (
                    <>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {t('admin.verifications.notes') || 'Notes'}
                      </Text>
                      <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                        <Text
                          style={[
                            styles.notesText,
                            { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                          ]}
                        >
                          {selectedVerification.notes}
                        </Text>
                      </View>
                    </>
                  )}
                </ScrollView>

                {/* Actions */}
                {selectedVerification.status === 'pending' && (
                  <View
                    style={[
                      styles.modalActions,
                      { borderTopColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(selectedVerification)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="#F44336" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                          <Text style={styles.rejectBtnText}>{t('admin.verifications.reject') || 'Rejeter'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(selectedVerification)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color="white" />
                          <Text style={styles.approveBtnText}>{t('admin.verifications.approve') || 'Approuver'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 10,
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    maxHeight: 60,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  documentsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  docBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cardDate: {
    fontSize: 12,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    paddingTop: 20,
  },
  modeFooterText: {
    fontSize: 11,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 16,
  },
  modalSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  modalDriverHeader: {
    alignItems: 'center',
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalDriverInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  modalDriverName: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalDriverEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  modalDriverPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  docItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
  },
  docStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  docViewBtn: {
    padding: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDocsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalActions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: '#FFEBEE',
  },
  rejectBtnText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  approveBtn: {
    backgroundColor: '#4CAF50',
  },
  approveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminVerificationsScreen;