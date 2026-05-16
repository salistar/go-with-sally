// ============================================================
// 📄 LanguageSwitcher.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[LanguageSwitcher.tsx] ▶ Module loaded')
//   • console.log('[LanguageSwitcher.tsx] ▶ LanguageSwitcher() rendered')
//   • console.log('[LanguageSwitcher.tsx] ▶ handleLanguageChange() called')
//   • console.log('[LanguageSwitcher.tsx] ▶ handleRestart() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  I18nManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[LanguageSwitcher.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface Language {
  code: 'en' | 'fr' | 'ar';
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  showRestartPrompt?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  showRestartPrompt = true,
}) => {
  console.log(`${FILE_NAME} ▶ LanguageSwitcher() rendered`);

  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
    },
    {
      code: 'fr',
      name: 'Français',
      nativeName: 'Français',
      flag: '🇫🇷',
    },
    {
      code: 'ar',
      name: 'العربية',
      nativeName: 'العربية',
      flag: '🇲🇦',
    },
  ];

  const currentLanguage = languages.find(
    lang => lang.code === (i18n.language as 'en' | 'fr' | 'ar')
  );

  const handleLanguageChange = async (languageCode: 'en' | 'fr' | 'ar') => {
    console.log(`${FILE_NAME} ▶ handleLanguageChange() called with: ${languageCode}`);

    if (languageCode === i18n.language) {
      setShowModal(false);
      return;
    }

    setIsChanging(true);

    try {
      await i18n.changeLanguage(languageCode);

      // Update RTL mode
      const isRTL = languageCode === 'ar';
      I18nManager.forceRTL(isRTL);

      if (onLanguageChange) {
        onLanguageChange(languageCode);
      }

      if (showRestartPrompt) {
        handleRestart();
      } else {
        setShowModal(false);
      }
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error changing language:`, error);
      Alert.alert(
        'Error',
        'Unable to change language. Please try again.'
      );
    } finally {
      setIsChanging(false);
    }
  };

  const handleRestart = () => {
    console.log(`${FILE_NAME} ▶ handleRestart() called`);

    Alert.alert(
      'Redémarrage requis',
      'L\'application va redémarrer pour appliquer la nouvelle langue',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Redémarrer',
          style: 'default',
          onPress: () => {
            // In a real app, you would trigger app restart
            setShowModal(false);
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={[
          styles.triggerButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="translate"
          size={20}
          color={theme.colors.primary}
        />
        <Text
          style={[
            styles.triggerText,
            {
              color: theme.colors.text,
            },
          ]}
        >
          {currentLanguage?.flag} {currentLanguage?.nativeName}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Language selection modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isChanging && setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isChanging && setShowModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Choisir une langue
              </Text>
              <TouchableOpacity
                onPress={() => !isChanging && setShowModal(false)}
                disabled={isChanging}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Language options */}
            <View style={styles.languageList}>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  disabled={isChanging}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor:
                        currentLanguage?.code === lang.code
                          ? theme.colors.primary + '15'
                          : 'transparent',
                      borderColor:
                        currentLanguage?.code === lang.code
                          ? theme.colors.primary
                          : theme.colors.background,
                    },
                  ]}
                >
                  <View style={styles.languageOptionLeft}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.languageName,
                          {
                            color: theme.colors.text,
                            fontWeight:
                              currentLanguage?.code === lang.code
                                ? '700'
                                : '500',
                          },
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text
                        style={[
                          styles.languageNative,
                          {
                            color: theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                    </View>
                  </View>

                  {currentLanguage?.code === lang.code && (
                    isChanging ? (
                      <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Info */}
            <View
              style={[
                styles.infoSection,
                {
                  backgroundColor: theme.colors.background,
                  borderTopColor: theme.colors.background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                {showRestartPrompt
                  ? 'L\'application redémarrera après le changement de langue'
                  : 'La langue a été changée'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  languageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: 14,
  },
  languageNative: {
    fontSize: 12,
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default LanguageSwitcher;
