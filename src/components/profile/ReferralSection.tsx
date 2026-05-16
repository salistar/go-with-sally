// ============================================================
// 📄 ReferralSection.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ReferralSection.tsx] ▶ Module loaded')
//   • console.log('[ReferralSection.tsx] ▶ ReferralSection() rendered')
//   • console.log('[ReferralSection.tsx] ▶ handleCopyCode() called')
//   • console.log('[ReferralSection.tsx] ▶ handleShareWhatsApp() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ReferralSection.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface ReferralSectionProps {
  referralCode: string;
  referralLink?: string;
  bonusAmount?: number;
  referredCount?: number;
  onShareSuccess?: () => void;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode,
  referralLink = 'https://gowithsally.app/ref/',
  bonusAmount = 50,
  referredCount = 3,
  onShareSuccess,
}) => {
  console.log(`${FILE_NAME} ▶ ReferralSection() rendered`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    console.log(`${FILE_NAME} ▶ handleCopyCode() called`);

    try {
      await Clipboard.setString(referralCode);
      setCopied(true);

      Toast.show({
        type: 'success',
        text1: 'Code copié',
        text2: `Code ${referralCode} copié dans le presse-papiers`,
        position: 'bottom',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error copying code:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de copier le code',
        position: 'bottom',
      });
    }
  };

  const handleShareWhatsApp = async () => {
    console.log(`${FILE_NAME} ▶ handleShareWhatsApp() called`);

    const message = `Rejoins-moi sur Sally et économise 50dh ! 🚗
Code: ${referralCode}
Lien: ${referralLink}${referralCode}`;

    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(whatsappUrl);

      if (supported) {
        await Linking.openURL(whatsappUrl);
        if (onShareSuccess) {
          onShareSuccess();
        }
      } else {
        Alert.alert(
          'WhatsApp non installé',
          'WhatsApp n\'est pas installé sur votre appareil'
        );
      }
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error sharing WhatsApp:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de partager sur WhatsApp',
        position: 'bottom',
      });
    }
  };

  const handleShareOther = async () => {
    console.log(`${FILE_NAME} ▶ handleShareOther() called`);

    const message = `Rejoins-moi sur Sally et économise 50dh !
Code: ${referralCode}`;

    try {
      await Linking.openURL(
        `mailto:?subject=Rejoins-moi sur Sally&body=${encodeURIComponent(message)}`
      );
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error sharing:`, error);
    }
  };

  const fullLink = referralLink + referralCode;

  return (
    <LinearGradient
      colors={[theme.colors.primary + '15', theme.colors.primary + '05']}
      style={[
        styles.container,
        {
          borderColor: theme.colors.background,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="gift"
            size={24}
            color={theme.colors.primary}
          />
          <View>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              Programme de parrainage
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Gagnez des bonus à chaque référence
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsContainer,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            {bonusAmount}dh
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            Par référence
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.background }]} />

        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            {referredCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            Personnes référées
          </Text>
        </View>
      </View>

      {/* Referral code */}
      <View style={styles.codeSection}>
        <Text
          style={[
            styles.codeLabel,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          Votre code de parrainage
        </Text>

        <TouchableOpacity
          onPress={handleCopyCode}
          style={[
            styles.codeBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: copied ? theme.colors.primary : theme.colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.code,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {referralCode}
          </Text>
          <MaterialCommunityIcons
            name={copied ? 'check' : 'content-copy'}
            size={20}
            color={copied ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.codeHint,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          Appuyez pour copier
        </Text>
      </View>

      {/* Share buttons */}
      <View
        style={[
          styles.shareButtons,
          isRTL && styles.shareButtonsRTL,
        ]}
      >
        <TouchableOpacity
          onPress={handleShareWhatsApp}
          style={[
            styles.shareButton,
            {
              backgroundColor: '#25D366',
            },
          ]}
        >
          <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
          <Text style={styles.shareButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShareOther}
          style={[
            styles.shareButton,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons name="share" size={20} color="white" />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <View
        style={[
          styles.terms,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.termsText,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          Le bonus est crédité dans votre portefeuille après la première course du nouveau client
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
  },
  codeSection: {
    gap: 8,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  codeHint: {
    fontSize: 11,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  termsText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
});

export default ReferralSection;
