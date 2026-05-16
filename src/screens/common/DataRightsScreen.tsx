// ============================================================
// 📄 DataRightsScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[DataRightsScreen.tsx] ▶ Module loaded')
//   • console.log('[DataRightsScreen.tsx] ▶ DataRightsScreen() rendered')
//   • console.log('[DataRightsScreen.tsx] ▶ handleExportData() called')
//   • console.log('[DataRightsScreen.tsx] ▶ handleDeleteData() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Services
import { gdprAPI } from '../../services/api';

const FILE_NAME = '[DataRightsScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface DataRequest {
  id: string;
  type: 'export' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

const DataRightsScreen: React.FC = () => {
  console.log(`${FILE_NAME} ▶ DataRightsScreen() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log(`${FILE_NAME} ▶ useEffect() mounted`);
    loadDataRequests();
  }, []);

  const loadDataRequests = async () => {
    console.log(`${FILE_NAME} ▶ loadDataRequests() called`);
    try {
      setLoading(true);
      const response = await gdprAPI.getDataRequests();
      if (response.success && response.data) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Failed to load requests:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    console.log(`${FILE_NAME} ▶ handleExportData() called`);

    Alert.alert(
      t('dataRights.exportTitle', 'Exporter mes données'),
      t('dataRights.exportMsg', 'Vous recevrez un fichier contenant toutes vos données'),
      [
        { text: t('common.cancel', 'Annuler'), onPress: () => { } },
        {
          text: t('common.confirm', 'Confirmer'),
          onPress: async () => {
            setExporting(true);
            try {
              const response = await gdprAPI.requestDataExport();

              if (response.success) {
                console.log(`${FILE_NAME} ✓ Export request created: ${response.data?.requestId}`);
                Toast.show({
                  type: 'success',
                  text1: t('dataRights.exportStarted', 'Export démarré'),
                  text2: t('dataRights.emailSent', 'Vous recevrez un email'),
                  duration: 3000,
                });
                loadDataRequests();
              } else {
                throw new Error(response.error || 'Export failed');
              }
            } catch (error: any) {
              console.error(`${FILE_NAME} ✗ Export error:`, error);
              Alert.alert(
                t('common.error', 'Erreur'),
                error.message || t('dataRights.exportFailed', 'Export échoué')
              );
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteData = async () => {
    console.log(`${FILE_NAME} ▶ handleDeleteData() called`);

    Alert.alert(
      t('dataRights.deleteTitle', 'Supprimer mes données'),
      t('dataRights.deleteMsg', 'Cette action est irréversible. Toutes vos données seront supprimées.'),
      [
        { text: t('common.cancel', 'Annuler'), onPress: () => { } },
        {
          text: t('dataRights.deleteConfirm', 'Je comprends, supprimer'),
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await gdprAPI.requestDataDeletion();

              if (response.success) {
                console.log(`${FILE_NAME} ✓ Deletion request created: ${response.data?.requestId}`);
                Toast.show({
                  type: 'success',
                  text1: t('dataRights.deletionStarted', 'Suppression démarrée'),
                  text2: t('dataRights.confirmEmail', 'Confirmez par email'),
                  duration: 3000,
                });
                loadDataRequests();
              } else {
                throw new Error(response.error || 'Deletion failed');
              }
            } catch (error: any) {
              console.error(`${FILE_NAME} ✗ Deletion error:`, error);
              Alert.alert(
                t('common.error', 'Erreur'),
                error.message || t('dataRights.deletionFailed', 'Suppression échouée')
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (
    status: DataRequest['status']
  ): { icon: string; color: string } => {
    switch (status) {
      case 'pending':
        return { icon: 'clock-outline', color: '#FF9800' };
      case 'in_progress':
        return { icon: 'sync', color: '#2196F3' };
      case 'completed':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'failed':
        return { icon: 'alert-circle', color: '#FF6B6B' };
      default:
        return { icon: 'help-circle', color: theme.colors.textSecondary };
    }
  };

  const getStatusLabel = (status: DataRequest['status']): string => {
    switch (status) {
      case 'pending':
        return t('dataRights.pending', 'En attente');
      case 'in_progress':
        return t('dataRights.inProgress', 'En cours');
      case 'completed':
        return t('dataRights.completed', 'Complété');
      case 'failed':
        return t('dataRights.failed', 'Échoué');
      default:
        return status;
    }
  };

  const getRightCard = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    loading: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.rightCard,
        { backgroundColor: theme.colors.surface },
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: theme.colors.primary + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingHorizontal: 16 }}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="shield-account"
              size={48}
              color={theme.colors.primary}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('dataRights.title', 'Vos droits RGPD')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('dataRights.subtitle', 'Contrôlez vos données personnelles')}
            </Text>
          </View>

          {/* Main Rights */}
          <View style={styles.rightsContainer}>
            {getRightCard(
              t('dataRights.exportTitle', 'Télécharger mes données'),
              t('dataRights.exportDesc', 'Recevez une copie de toutes vos données'),
              'download',
              handleExportData,
              exporting
            )}

            {getRightCard(
              t('dataRights.deleteTitle', 'Supprimer mes données'),
              t('dataRights.deleteDesc', 'Demander la suppression de vos données'),
              'trash-can-outline',
              handleDeleteData,
              deleting
            )}
          </View>

          {/* Information Box */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.colors.primary + '10' },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {t('dataRights.infoText', 'Nous traiterons votre demande dans les 30 jours')}
            </Text>
          </View>

          {/* Pending Requests */}
          {requests.length > 0 && (
            <View style={styles.requestsContainer}>
              <Text style={[styles.requestsTitle, { color: theme.colors.text }]}>
                {t('dataRights.requestHistory', 'Historique des demandes')}
              </Text>

              {requests.map((request) => {
                const statusInfo = getStatusIcon(request.status);
                return (
                  <View
                    key={request.id}
                    style={[
                      styles.requestCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <View style={styles.requestLeft}>
                      <View
                        style={[
                          styles.statusIcon,
                          { backgroundColor: statusInfo.color + '20' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={statusInfo.icon as any}
                          size={18}
                          color={statusInfo.color}
                        />
                      </View>

                      <View style={styles.requestContent}>
                        <Text
                          style={[
                            styles.requestType,
                            { color: theme.colors.text },
                          ]}
                        >
                          {request.type === 'export'
                            ? t('dataRights.export', 'Export')
                            : t('dataRights.deletion', 'Suppression')}
                        </Text>
                        <Text
                          style={[
                            styles.requestDate,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusInfo.color + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusInfo.color },
                        ]}
                      >
                        {getStatusLabel(request.status)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Legal Information */}
          <View style={styles.legalSection}>
            <Text style={[styles.legalTitle, { color: theme.colors.text }]}>
              {t('dataRights.legalInfo', 'Informations légales')}
            </Text>

            <View
              style={[
                styles.legalItem,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open"
                size={18}
                color={theme.colors.primary}
              />
              <View style={styles.legalContent}>
                <Text style={[styles.legalItemTitle, { color: theme.colors.text }]}>
                  {t('dataRights.gdprCompliance', 'Conformité RGPD')}
                </Text>
                <Text
                  style={[
                    styles.legalItemText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('dataRights.gdprText', 'Nous respectons le Règlement Général sur la Protection des Données')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.legalItem,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name="phone"
                size={18}
                color={theme.colors.primary}
              />
              <View style={styles.legalContent}>
                <Text style={[styles.legalItemTitle, { color: theme.colors.text }]}>
                  {t('dataRights.contact', 'Nous contacter')}
                </Text>
                <Text
                  style={[
                    styles.legalItemText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  privacy@gowithsally.com
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  rightsContainer: {
    gap: 12,
    marginVertical: 16,
  },
  rightCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginVertical: 16,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  requestsContainer: {
    marginVertical: 16,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  requestCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestContent: {
    gap: 2,
  },
  requestType: {
    fontSize: 13,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legalSection: {
    marginVertical: 16,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  legalItem: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  legalContent: {
    flex: 1,
    gap: 4,
  },
  legalItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  legalItemText: {
    fontSize: 12,
  },
});

export default DataRightsScreen;
