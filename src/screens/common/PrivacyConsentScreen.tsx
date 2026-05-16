// ============================================================
// 📄 PrivacyConsentScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PrivacyConsentScreen.tsx] ▶ Module loaded')
//   • console.log('[PrivacyConsentScreen.tsx] ▶ PrivacyConsentScreen() rendered')
//   • console.log('[PrivacyConsentScreen.tsx] ▶ handleAccept() called')
//   • console.log('[PrivacyConsentScreen.tsx] ▶ handleReject() called')
//   • console.log('[PrivacyConsentScreen.tsx] ▶ toggleConsent() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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

const FILE_NAME = '[PrivacyConsentScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface ConsentOption {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon: string;
}

const PrivacyConsentScreen: React.FC = () => {
  console.log(`${FILE_NAME} ▶ PrivacyConsentScreen() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isRTL } = useRTL();

  const [consents, setConsents] = useState<Record<string, boolean>>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    thirdparty: false,
  });

  const [allOptional, setAllOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log(`${FILE_NAME} ▶ useEffect() mounted`);
    loadExistingConsents();
  }, []);

  const loadExistingConsents = async () => {
    console.log(`${FILE_NAME} ▶ loadExistingConsents() called`);
    try {
      setLoading(true);
      const response = await gdprAPI.getConsentStatus();
      if (response.success && response.data) {
        setConsents(response.data.consents || consents);
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Failed to load consents:`, error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = (key: string) => {
    console.log(`${FILE_NAME} ▶ toggleConsent() called for key: ${key}`);

    if (key === 'necessary') {
      // Cannot toggle necessary consent
      Toast.show({
        type: 'info',
        text1: t('privacy.necessary', 'Consentement obligatoire'),
        text2: t('privacy.necessaryDesc', 'Ce consentement est requis'),
        duration: 2000,
      });
      return;
    }

    setConsents({
      ...consents,
      [key]: !consents[key],
    });
  };

  const toggleAllOptional = () => {
    console.log(`${FILE_NAME} ▶ toggleAllOptional() called`);
    const newValue = !allOptional;
    setAllOptional(newValue);
    setConsents({
      ...consents,
      analytics: newValue,
      marketing: newValue,
      thirdparty: newValue,
    });
  };

  const handleAccept = async () => {
    console.log(`${FILE_NAME} ▶ handleAccept() called`);

    setSubmitting(true);
    try {
      const response = await gdprAPI.submitConsent(consents);

      if (response.success) {
        console.log(`${FILE_NAME} ✓ Consents saved successfully`);
        Toast.show({
          type: 'success',
          text1: t('privacy.consentSaved', 'Préférences sauvegardées'),
          duration: 2000,
        });
        navigation.goBack();
      } else {
        throw new Error(response.error || 'Failed to save consents');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ Error saving consents:`, error);
      Alert.alert(
        t('common.error', 'Erreur'),
        error.message || t('privacy.saveFailed', 'Impossible de sauvegarder')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    console.log(`${FILE_NAME} ▶ handleReject() called`);

    Alert.alert(
      t('privacy.rejectTitle', 'Refuser les consentements optionnels'),
      t('privacy.rejectMsg', 'Vous refuserez les consentements optionnels'),
      [
        { text: t('common.cancel', 'Annuler'), onPress: () => { } },
        {
          text: t('common.confirm', 'Confirmer'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const rejectConsents = {
                necessary: true,
                analytics: false,
                marketing: false,
                thirdparty: false,
              };

              const response = await gdprAPI.submitConsent(rejectConsents);
              if (response.success) {
                console.log(`${FILE_NAME} ✓ Rejected optional consents`);
                Toast.show({
                  type: 'success',
                  text1: t('privacy.consentUpdated', 'Préférences mises à jour'),
                  duration: 2000,
                });
                navigation.goBack();
              }
            } catch (error: any) {
              console.error(`${FILE_NAME} ✗ Error rejecting:`, error);
              Alert.alert(t('common.error', 'Erreur'), error.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const consentOptions: ConsentOption[] = [
    {
      id: 'necessary',
      title: t('privacy.necessary', 'Cookies obligatoires'),
      description: t('privacy.necessaryDesc', 'Essentiels au fonctionnement'),
      required: true,
      icon: 'shield-check',
    },
    {
      id: 'analytics',
      title: t('privacy.analytics', 'Analyse'),
      description: t('privacy.analyticsDesc', 'Améliorer votre expérience'),
      required: false,
      icon: 'chart-line',
    },
    {
      id: 'marketing',
      title: t('privacy.marketing', 'Marketing'),
      description: t('privacy.marketingDesc', 'Vous envoyer des offres'),
      required: false,
      icon: 'megaphone',
    },
    {
      id: 'thirdparty',
      title: t('privacy.thirdParty', 'Tiers'),
      description: t('privacy.thirdPartyDesc', 'Partenaires de confiance'),
      required: false,
      icon: 'handshake',
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const optionalConsents = consentOptions.filter((c) => !c.required);
  const allOptionalSelected = optionalConsents.every((c) => consents[c.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingHorizontal: 16 }}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="shield-alert"
              size={48}
              color={theme.colors.primary}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('privacy.consentTitle', 'Vos préférences')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('privacy.consentSubtitle', 'Contrôlez comment nous utilisons vos données')}
            </Text>
          </View>

          {/* Consent Options */}
          <View style={styles.optionsContainer}>
            {consentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.consentCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: consents[option.id]
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => toggleConsent(option.id)}
                disabled={option.required}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: consents[option.id]
                          ? theme.colors.primary + '20'
                          : theme.colors.background,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={20}
                      color={
                        consents[option.id]
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                        {option.title}
                      </Text>
                      {option.required && (
                        <View
                          style={[
                            styles.requiredBadge,
                            { backgroundColor: theme.colors.primary + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.requiredText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {t('privacy.required', 'Obligatoire')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>

                <Switch
                  value={consents[option.id]}
                  onValueChange={() => toggleConsent(option.id)}
                  disabled={option.required}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary + '50',
                  }}
                  thumbColor={
                    consents[option.id] ? theme.colors.primary : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Select All Optional */}
          <TouchableOpacity
            style={[
              styles.selectAllCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={toggleAllOptional}
          >
            <View style={styles.selectAllLeft}>
              <Text style={[styles.selectAllText, { color: theme.colors.text }]}>
                {t('privacy.selectAll', 'Accepter tous les optionnels')}
              </Text>
            </View>
            <Switch
              value={allOptionalSelected}
              onValueChange={toggleAllOptional}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + '50',
              }}
              thumbColor={
                allOptionalSelected
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>

          {/* Info Box */}
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
              {t('privacy.infoText', 'Vous pouvez modifier ces préférences à tout moment')}
            </Text>
          </View>

          {/* Legal Links */}
          <View style={styles.linksContainer}>
            <TouchableOpacity style={styles.link}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {t('privacy.privacyPolicy', 'Politique de confidentialité')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.linkDivider, { color: theme.colors.border }]}>
              •
            </Text>
            <TouchableOpacity style={styles.link}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {t('privacy.termsOfService', 'Conditions d\'utilisation')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.footer,
          { borderTopColor: theme.colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.rejectBtn,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={handleReject}
          disabled={submitting}
        >
          <Text style={[styles.rejectBtnText, { color: theme.colors.text }]}>
            {t('common.reject', 'Refuser')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.acceptBtn,
            { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 },
          ]}
          onPress={handleAccept}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.acceptBtnText}>
              {t('common.accept', 'Accepter')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  optionsContainer: {
    gap: 12,
    marginVertical: 16,
  },
  consentCard: {
    borderRadius: 12,
    borderWidth: 1.5,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
  },
  selectAllCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  selectAllLeft: {
    flex: 1,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
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
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  link: {
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  linkDivider: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrivacyConsentScreen;
