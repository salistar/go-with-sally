// ============================================================
// 📄 ShareLocationScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ShareLocationScreen.tsx] ▶ Module loaded')
//   • console.log('[ShareLocationScreen.tsx] ▶ ShareLocationScreen() rendered')
//   • console.log('[ShareLocationScreen.tsx] ▶ handleToggleShare() called')
//   • console.log('[ShareLocationScreen.tsx] ▶ handleDurationChange() called')
//   • console.log('[ShareLocationScreen.tsx] ▶ handleShareWith() called')
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Switch,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ShareLocationScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface SharedWith {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  isSharing: boolean;
}

const ShareLocationScreen = () => {
  console.log(`${FILE_NAME} ▶ ShareLocationScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [isLocationSharing, setIsLocationSharing] = useState(true);
  const [shareDuration, setShareDuration] = useState<'1h' | '8h' | '24h' | 'always'>('24h');
  const [sharedWithContacts, setSharedWithContacts] = useState<SharedWith[]>([
    {
      id: '1',
      name: 'Mère',
      relationship: 'Mère',
      isSharing: true,
    },
    {
      id: '2',
      name: 'Meilleure amie',
      relationship: 'Amie',
      isSharing: true,
    },
  ]);

  useFocusEffect(
    useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
    }, [])
  );

  const handleToggleShare = (state: boolean) => {
    console.log(`${FILE_NAME} ▶ handleToggleShare() called with state: ${state}`);

    setIsLocationSharing(state);
    Toast.show({
      type: state ? 'success' : 'info',
      text1: state ? 'Partage activé' : 'Partage désactivé',
      text2: state
        ? 'Votre position est partagée'
        : 'Votre position n\'est pas partagée',
      position: 'bottom',
    });
  };

  const handleDurationChange = (duration: typeof shareDuration) => {
    console.log(`${FILE_NAME} ▶ handleDurationChange() called with: ${duration}`);

    setShareDuration(duration);
    Toast.show({
      type: 'info',
      text1: 'Durée mise à jour',
      text2: `Partage jusqu\'à ${getDurationLabel(duration)}`,
      position: 'bottom',
    });
  };

  const handleShareWith = (contactId: string) => {
    console.log(`${FILE_NAME} ▶ handleShareWith() called for: ${contactId}`);

    setSharedWithContacts(
      sharedWithContacts.map(contact =>
        contact.id === contactId
          ? { ...contact, isSharing: !contact.isSharing }
          : contact
      )
    );

    const contact = sharedWithContacts.find(c => c.id === contactId);
    if (contact) {
      Toast.show({
        type: 'success',
        text1: contact.isSharing ? 'Partage supprimé' : 'Partage activé',
        text2: `Position ${contact.isSharing ? 'non ' : ''}partagée avec ${contact.name}`,
        position: 'bottom',
      });
    }
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case '1h':
        return '1 heure';
      case '8h':
        return '8 heures';
      case '24h':
        return '24 heures';
      case 'always':
        return 'Toujours';
      default:
        return duration;
    }
  };

  const activeShares = sharedWithContacts.filter(c => c.isSharing).length;

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
          {t('share.location', 'Partager ma localisation')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Main sharing toggle */}
        <LinearGradient
          colors={
            isLocationSharing
              ? [theme.colors.primary + '20', theme.colors.primary + '10']
              : ['#f5f5f5', '#fafafa']
          }
          style={[
            styles.shareCard,
            {
              borderColor: isLocationSharing ? theme.colors.primary : theme.colors.background,
            },
          ]}
        >
          <View style={styles.shareCardContent}>
            <View style={styles.shareCardLeft}>
              <View
                style={[
                  styles.shareCardIcon,
                  {
                    backgroundColor: isLocationSharing
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.shareCardText}>
                <Text
                  style={[
                    styles.shareCardTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  {isLocationSharing
                    ? 'Partage activé'
                    : 'Partage désactivé'}
                </Text>
                <Text
                  style={[
                    styles.shareCardSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isLocationSharing
                    ? `Partage avec ${activeShares} contact(s)`
                    : 'Personne ne peut voir votre position'}
                </Text>
              </View>
            </View>
            <Switch
              value={isLocationSharing}
              onValueChange={handleToggleShare}
              trackColor={{
                false: '#ccc',
                true: theme.colors.primary + '80',
              }}
              thumbColor={isLocationSharing ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </LinearGradient>

        {/* Duration selection */}
        {isLocationSharing && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text },
              ]}
            >
              {t('share.duration', 'Durée du partage')}
            </Text>

            <View style={styles.durationButtons}>
              {(['1h', '8h', '24h', 'always'] as const).map(duration => (
                <TouchableOpacity
                  key={duration}
                  onPress={() => handleDurationChange(duration)}
                  style={[
                    styles.durationButton,
                    {
                      backgroundColor:
                        shareDuration === duration
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      {
                        color:
                          shareDuration === duration
                            ? 'white'
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {getDurationLabel(duration)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Shared with section */}
        {isLocationSharing && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                {t('share.sharedWith', 'Partagé avec')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {sharedWithContacts.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('share.noContacts', 'Aucun contact sélectionné')}
              </Text>
            ) : (
              <View style={styles.contactsList}>
                {sharedWithContacts.map(contact => (
                  <View
                    key={contact.id}
                    style={[
                      styles.contactItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.background,
                      },
                    ]}
                  >
                    <View style={styles.contactInfo}>
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor: theme.colors.primary + '30',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={32}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.contactName,
                            { color: theme.colors.text },
                          ]}
                        >
                          {contact.name}
                        </Text>
                        <Text
                          style={[
                            styles.contactRelationship,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {contact.relationship}
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={contact.isSharing}
                      onValueChange={() => handleShareWith(contact.id)}
                      trackColor={{
                        false: '#ccc',
                        true: theme.colors.primary + '80',
                      }}
                      thumbColor={
                        contact.isSharing ? theme.colors.primary : '#f4f3f4'
                      }
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Info section */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="shield-check"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.text },
              ]}
            >
              {t('share.privacy', 'Votre position est chiffrée et sécurisée')}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="history"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.text },
              ]}
            >
              {t('share.timeLimit', 'Le partage s\'arrête automatiquement')}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="stop-circle"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.text },
              ]}
            >
              {t('share.control', 'Vous pouvez arrêter à tout moment')}
            </Text>
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
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  shareCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  shareCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  shareCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareCardText: {
    flex: 1,
    gap: 2,
  },
  shareCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  shareCardSubtitle: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactsList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
});

export default ShareLocationScreen;
