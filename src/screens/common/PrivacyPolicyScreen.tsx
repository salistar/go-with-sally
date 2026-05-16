// ============================================================
// 📄 PrivacyPolicyScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[PrivacyPolicyScreen.tsx] ▶ Module loaded')
//   • console.log('[PrivacyPolicyScreen.tsx] ▶ PrivacyPolicyScreen() rendered')
//   • console.log('[PrivacyPolicyScreen.tsx] ▶ handleLanguageChange() called')
//   • console.log('[PrivacyPolicyScreen.tsx] ▶ toggleSection() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';

const FILE_NAME = '[PrivacyPolicyScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface PolicySection {
  id: string;
  titleKey: string;
  contentKey: string;
}

const PrivacyPolicyScreen: React.FC = () => {
  console.log(`${FILE_NAME} ▶ PrivacyPolicyScreen() rendered`);

  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { setLanguage } = useLanguage();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const handleLanguageChange = (lang: string) => {
    console.log(`${FILE_NAME} ▶ handleLanguageChange() called for language: ${lang}`);
    setCurrentLanguage(lang);
    setLanguage(lang);
  };

  const toggleSection = (sectionId: string) => {
    console.log(`${FILE_NAME} ▶ toggleSection() called for section: ${sectionId}`);
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId],
    });
  };

  const sections: PolicySection[] = [
    {
      id: 'introduction',
      titleKey: 'privacy.introduction',
      contentKey: 'privacy.introductionContent',
    },
    {
      id: 'dataCollection',
      titleKey: 'privacy.dataCollection',
      contentKey: 'privacy.dataCollectionContent',
    },
    {
      id: 'dataUsage',
      titleKey: 'privacy.dataUsage',
      contentKey: 'privacy.dataUsageContent',
    },
    {
      id: 'dataProtection',
      titleKey: 'privacy.dataProtection',
      contentKey: 'privacy.dataProtectionContent',
    },
    {
      id: 'userRights',
      titleKey: 'privacy.userRights',
      contentKey: 'privacy.userRightsContent',
    },
    {
      id: 'contact',
      titleKey: 'privacy.contactUs',
      contentKey: 'privacy.contactContent',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('privacy.policyTitle', 'Politique de confidentialité')}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Language Selector */}
          <View style={[styles.languageSelector, { backgroundColor: theme.colors.surface }]}>
            {['fr', 'ar', 'en'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: currentLanguage === lang ? theme.colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text
                  style={[
                    styles.langText,
                    {
                      color: currentLanguage === lang ? 'white' : theme.colors.text,
                      fontWeight: currentLanguage === lang ? '700' : '500',
                    },
                  ]}
                >
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Last Updated */}
          <View
            style={[
              styles.updateInfo,
              { backgroundColor: theme.colors.primary + '10' },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.updateText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('privacy.lastUpdated', 'Dernière mise à jour')}: 2024-03-18
            </Text>
          </View>

          {/* Sections */}
          <View style={styles.sectionsContainer}>
            {sections.map((section) => {
              const isExpanded = expandedSections[section.id];

              return (
                <View key={section.id}>
                  <TouchableOpacity
                    style={[
                      styles.sectionHeader,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: isExpanded ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => toggleSection(section.id)}
                  >
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      {t(section.titleKey, section.id)}
                    </Text>
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View
                      style={[
                        styles.sectionContent,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.contentText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {t(section.contentKey, getDefaultContent(section.id))}
                      </Text>

                      {/* Sub-points for certain sections */}
                      {section.id === 'dataCollection' && (
                        <View style={styles.bulletPoints}>
                          <BulletPoint
                            text={t('privacy.personalInfo', 'Informations personnelles')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.locationData', 'Données de localisation')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.paymentInfo', 'Informations de paiement')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.deviceInfo', 'Informations de l\'appareil')}
                            theme={theme}
                          />
                        </View>
                      )}

                      {section.id === 'userRights' && (
                        <View style={styles.bulletPoints}>
                          <BulletPoint
                            text={t('privacy.rightAccess', 'Droit d\'accès')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.rightRectification', 'Droit de rectification')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.rightDeletion', 'Droit à l\'oubli')}
                            theme={theme}
                          />
                          <BulletPoint
                            text={t('privacy.rightObjection', 'Droit d\'opposition')}
                            theme={theme}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Contact Section */}
          <View
            style={[
              styles.contactSection,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
              {t('privacy.haveQuestions', 'Vous avez des questions?')}
            </Text>

            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.contactLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('privacy.emailLabel', 'Email')}
                </Text>
                <Text style={[styles.contactValue, { color: theme.colors.text }]}>
                  privacy@gowithsally.com
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={18}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.contactLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('privacy.addressLabel', 'Adresse')}
                </Text>
                <Text style={[styles.contactValue, { color: theme.colors.text }]}>
                  Casablanca, Maroc
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              {t('privacy.footerText', 'Cette politique peut être mise à jour à tout moment')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Bullet Point Component
 */
const BulletPoint: React.FC<{ text: string; theme: any }> = ({ text, theme }) => (
  <View style={styles.bulletPoint}>
    <View
      style={[
        styles.bullet,
        { backgroundColor: theme.colors.primary },
      ]}
    />
    <Text style={[styles.bulletText, { color: theme.colors.text }]}>
      {text}
    </Text>
  </View>
);

/**
 * Get default content for sections
 */
const getDefaultContent = (sectionId: string): string => {
  const contents: Record<string, string> = {
    introduction:
      'Cette Politique de Confidentialité explique comment GoWithSally collecte, utilise et protège vos données personnelles.',
    dataCollection:
      'Nous collectons les données nécessaires pour vous fournir nos services de transport.',
    dataUsage:
      'Vos données sont utilisées uniquement pour améliorer nos services et vous fournir une meilleure expérience.',
    dataProtection:
      'Vos données sont protégées par des mesures de sécurité avancées et conformes aux normes internationales.',
    userRights:
      'Vous avez des droits importants concernant vos données personnelles en vertu du RGPD.',
    contact:
      'Pour toute question, veuillez nous contacter à privacy@gowithsally.com.',
  };

  return contents[sectionId] || '';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 6,
    gap: 6,
    marginBottom: 12,
  },
  langButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  langText: {
    fontSize: 12,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  updateText: {
    fontSize: 11,
    flex: 1,
  },
  sectionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    padding: 14,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  contentText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  bulletPoints: {
    gap: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 12,
    flex: 1,
    paddingTop: 2,
  },
  contactSection: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;
