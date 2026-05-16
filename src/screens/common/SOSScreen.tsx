// ============================================================
// 📄 SOSScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[SOSScreen.tsx] ▶ Module loaded')
//   • console.log('[SOSScreen.tsx] ▶ SOSScreen() rendered')
//   • console.log('[SOSScreen.tsx] ▶ handleEmergencyCall() called')
//   • console.log('[SOSScreen.tsx] ▶ handleEmergencyChat() called')
//   • console.log('[SOSScreen.tsx] ▶ handleReportIssue() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  I18nManager,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[SOSScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Emergency contact interface
 */
interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * SOSScreen Component
 * Emergency contact screen with quick access to emergency services
 */
const SOSScreen = () => {
  console.log(`${FILE_NAME} ▶ SOSScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: t('sos.ambulance', 'Ambulance'),
      number: '15',
      description: t('sos.ambulanceDesc', 'SAMU - Services médicaux'),
      icon: 'ambulance',
      color: '#F44336',
    },
    {
      id: '2',
      name: t('sos.police', 'Police'),
      number: '19',
      description: t('sos.policeDesc', 'Services de police'),
      icon: 'police-badge',
      color: '#2196F3',
    },
    {
      id: '3',
      name: t('sos.fire', 'Pompiers'),
      number: '15',
      description: t('sos.fireDesc', 'Pompiers et secours'),
      icon: 'fire-truck',
      color: '#FF9800',
    },
    {
      id: '4',
      name: t('sos.gendarmerie', 'Gendarmerie'),
      number: '17',
      description: t('sos.gendarmerieDesc', 'Gendarmerie nationale'),
      icon: 'shield-account',
      color: '#9C27B0',
    },
  ]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
    }, [])
  );

  const handleEmergencyCall = (number: string, name: string) => {
    console.log(`${FILE_NAME} ▶ handleEmergencyCall() called with number: ${number}`);

    Alert.alert(
      t('sos.callConfirm', 'Confirmer l\'appel'),
      t('sos.callConfirmMessage', `Appeler ${name} (${number})?`),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('sos.call', 'Appeler'),
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`).catch(err =>
              Alert.alert(t('common.error', 'Erreur'), t('sos.callError', 'Impossible d\'effectuer l\'appel'))
            );
          },
        },
      ]
    );
  };

  const handleEmergencyChat = () => {
    console.log(`${FILE_NAME} ▶ handleEmergencyChat() called`);

    Toast.show({
      type: 'info',
      text1: t('sos.chatTitle', 'Support Sally'),
      text2: t('sos.chatMessage', 'Un agent Sally va vous répondre dans quelques instants'),
      position: 'bottom',
    });

    // Navigate to chat with support
    setTimeout(() => {
      navigation.navigate('ConversationsList');
    }, 500);
  };

  const handleReportIssue = () => {
    console.log(`${FILE_NAME} ▶ handleReportIssue() called`);

    Alert.prompt(
      t('sos.reportIssue', 'Signaler un problème'),
      t('sos.reportMessage', 'Décrivez le problème rencontré'),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.send', 'Envoyer'),
          onPress: (text: string) => {
            if (text.trim()) {
              Toast.show({
                type: 'success',
                text1: t('sos.reportSent', 'Signalement envoyé'),
                text2: t('sos.reportThank', 'Merci de nous aider à améliorer le service'),
                position: 'bottom',
              });
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('sos.title', 'SOS - Urgence')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Warning Banner */}
        <LinearGradient
          colors={['#FFE0E0', '#FFF5F5']}
          style={[styles.warningBanner, { borderLeftColor: '#F44336' }]}
        >
          <MaterialCommunityIcons name="shield-alert" size={24} color="#F44336" />
          <View style={styles.warningText}>
            <Text style={[styles.warningTitle, { color: '#D32F2F' }]}>
              {t('sos.warning', 'En cas d\'urgence')}
            </Text>
            <Text style={[styles.warningMessage, { color: '#B71C1C' }]}>
              {t('sos.warningMessage', 'Appelez immédiatement les services d\'urgence')}
            </Text>
          </View>
        </LinearGradient>

        {/* Emergency Contacts Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('sos.emergencyNumbers', 'Numéros d\'urgence')}
          </Text>

          <View style={styles.contactsGrid}>
            {emergencyContacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleEmergencyCall(contact.number, contact.name)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.contactIconWrapper,
                    { backgroundColor: `${contact.color}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={contact.icon as any}
                    size={28}
                    color={contact.color}
                  />
                </View>
                <Text style={[styles.contactName, { color: theme.colors.text }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactNumber, { color: contact.color }]}>
                  {contact.number}
                </Text>
                <Text style={[styles.contactDesc, { color: theme.colors.textSecondary }]}>
                  {contact.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sally Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('sos.support', 'Support Sally')}
          </Text>

          <TouchableOpacity
            style={[styles.supportCard, { backgroundColor: theme.colors.primary }]}
            onPress={handleEmergencyChat}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chat-outline" size={24} color="white" />
            <View style={styles.supportText}>
              <Text style={styles.supportTitle}>{t('sos.contactSupport', 'Contacter le support')}</Text>
              <Text style={styles.supportDesc}>
                {t('sos.contactSupportMessage', 'Chat en direct avec un agent Sally')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Report Issue */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}
            onPress={handleReportIssue}
          >
            <MaterialCommunityIcons
              name="flag-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.reportText}>
              <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
                {t('sos.reportIssue', 'Signaler un problème')}
              </Text>
              <Text style={[styles.reportDesc, { color: theme.colors.textSecondary }]}>
                {t('sos.reportIssueMessage', 'Nous aider à améliorer la sécurité')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('sos.safetyTips', 'Conseils de sécurité')}
          </Text>

          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                {t('sos.tip1', 'Partagez votre trajet avec vos amis')}
              </Text>
            </View>

            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                {t('sos.tip2', 'Vérifiez les informations du conducteur')}
              </Text>
            </View>

            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                {t('sos.tip3', 'Gardez votre téléphone chargé')}
              </Text>
            </View>

            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                {t('sos.tip4', 'Signalez tout incident anormal')}
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  warningText: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  contactIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  supportText: {
    marginLeft: 16,
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  supportDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  reportText: {
    marginLeft: 16,
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDesc: {
    fontSize: 12,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
});

export default SOSScreen;
