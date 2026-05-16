// ============================================================
// 📄 WithdrawModal.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[WithdrawModal.tsx] ▶ Module loaded')
//   • console.log('[WithdrawModal.tsx] ▶ WithdrawModal() rendered')
//   • console.log('[WithdrawModal.tsx] ▶ handleWithdraw() called')
//   • console.log('[WithdrawModal.tsx] ▶ validateRIB() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  I18nManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[WithdrawModal.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface WithdrawModalProps {
  visible: boolean;
  balance: number;
  currency: string;
  onClose: () => void;
  onSubmit: (data: WithdrawalData) => Promise<void>;
  loading?: boolean;
}

interface WithdrawalData {
  amount: number;
  bankName: string;
  rib: string; // RIB = Relevé d'Identité Bancaire
  accountHolder: string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  balance,
  currency,
  onClose,
  onSubmit,
  loading = false,
}) => {
  console.log(`${FILE_NAME} ▶ WithdrawModal() rendered with balance: ${balance}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [rib, setRib] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateRIB = (ribValue: string): boolean => {
    console.log(`${FILE_NAME} ▶ validateRIB() called for RIB: ${ribValue.substring(0, 5)}...`);
    // Moroccan RIB format: 28 digits
    const ribRegex = /^\d{28}$/;
    return ribRegex.test(ribValue.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = t('withdrawal.amountRequired', 'Montant requis');
    } else if (amountNum <= 0) {
      newErrors.amount = t('withdrawal.positiveAmount', 'Montant positif requis');
    } else if (amountNum > balance) {
      newErrors.amount = t('withdrawal.insufficientBalance', 'Solde insuffisant');
    } else if (amountNum < 50) {
      newErrors.amount = t('withdrawal.minimumAmount', 'Montant minimum: 50 MAD');
    }

    // Bank name validation
    if (!bankName.trim()) {
      newErrors.bankName = t('withdrawal.bankNameRequired', 'Nom de la banque requis');
    }

    // RIB validation
    if (!rib.trim()) {
      newErrors.rib = t('withdrawal.ribRequired', 'RIB requis');
    } else if (!validateRIB(rib)) {
      newErrors.rib = t('withdrawal.invalidRIB', 'RIB invalide (28 chiffres)');
    }

    // Account holder validation
    if (!accountHolder.trim()) {
      newErrors.accountHolder = t('withdrawal.holderRequired', 'Nom du titulaire requis');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    console.log(`${FILE_NAME} ▶ handleWithdraw() called`);

    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: t('withdrawal.validationError', 'Erreur de validation'),
        text2: t('withdrawal.checkFields', 'Veuillez vérifier vos données'),
        duration: 3000,
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        bankName: bankName.trim(),
        rib: rib.replace(/\s/g, ''),
        accountHolder: accountHolder.trim(),
      });

      Toast.show({
        type: 'success',
        text1: t('withdrawal.success', 'Succès'),
        text2: t('withdrawal.submitted', 'Demande de retrait soumise'),
        duration: 3000,
      });

      // Reset form
      setAmount('');
      setBankName('');
      setRib('');
      setAccountHolder('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ Withdrawal error:`, error);
      Toast.show({
        type: 'error',
        text1: t('withdrawal.error', 'Erreur'),
        text2: error.message || t('withdrawal.failedToSubmit', 'Impossible de soumettre'),
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [100, 200, 500];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setErrors({ ...errors, amount: '' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('withdrawal.title', 'Retrait de gains')}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={submitting}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Balance Display */}
            <View
              style={[
                styles.balanceCard,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
                {t('withdrawal.availableBalance', 'Solde disponible')}
              </Text>
              <View style={styles.balanceAmount}>
                <Text style={[styles.amount, { color: theme.colors.primary }]}>
                  {balance.toFixed(0)}
                </Text>
                <Text style={[styles.currency, { color: theme.colors.primary }]}>
                  {currency}
                </Text>
              </View>
            </View>

            {/* Amount Section */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('withdrawal.amount', 'Montant du retrait')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: errors.amount ? '#FF6B6B' : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('withdrawal.enterAmount', 'Entrez le montant')}
                placeholderTextColor={theme.colors.textSecondary}
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                keyboardType="decimal-pad"
                editable={!submitting}
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}

              {/* Quick Select */}
              <View style={styles.quickSelect}>
                {presetAmounts.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.quickBtn,
                      {
                        backgroundColor: amount === preset.toString() ? theme.colors.primary : theme.colors.surface,
                      },
                    ]}
                    onPress={() => handleQuickAmount(preset)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.quickBtnText,
                        {
                          color: amount === preset.toString() ? 'white' : theme.colors.text,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bank Details */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('withdrawal.bankDetails', 'Détails bancaires')}
              </Text>

              {/* Bank Name */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('withdrawal.bankName', 'Nom de la banque')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: errors.bankName ? '#FF6B6B' : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('withdrawal.bankNamePlaceholder', 'Ex: Attijariwafa bank')}
                placeholderTextColor={theme.colors.textSecondary}
                value={bankName}
                onChangeText={(val) => {
                  setBankName(val);
                  if (errors.bankName) setErrors({ ...errors, bankName: '' });
                }}
                editable={!submitting}
              />
              {errors.bankName && (
                <Text style={styles.errorText}>{errors.bankName}</Text>
              )}

              {/* Account Holder */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('withdrawal.accountHolder', 'Titulaire du compte')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: errors.accountHolder ? '#FF6B6B' : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('withdrawal.holderPlaceholder', 'Nom complet')}
                placeholderTextColor={theme.colors.textSecondary}
                value={accountHolder}
                onChangeText={(val) => {
                  setAccountHolder(val);
                  if (errors.accountHolder) setErrors({ ...errors, accountHolder: '' });
                }}
                editable={!submitting}
              />
              {errors.accountHolder && (
                <Text style={styles.errorText}>{errors.accountHolder}</Text>
              )}

              {/* RIB */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('withdrawal.rib', 'RIB (28 chiffres)')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: errors.rib ? '#FF6B6B' : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('withdrawal.ribPlaceholder', 'Relevé d\'Identité Bancaire')}
                placeholderTextColor={theme.colors.textSecondary}
                value={rib}
                onChangeText={(val) => {
                  // Format: XXXX XXXX XXXX XXXX XXXX XXXX XX
                  const cleaned = val.replace(/\s/g, '');
                  const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
                  setRib(formatted);
                  if (errors.rib) setErrors({ ...errors, rib: '' });
                }}
                keyboardType="numeric"
                maxLength={31}
                editable={!submitting}
              />
              {errors.rib && (
                <Text style={styles.errorText}>{errors.rib}</Text>
              )}
            </View>

            {/* Information */}
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
                {t('withdrawal.info', 'Les retraits sont traités en 2-5 jours ouvrables')}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View
            style={[
              styles.footer,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>
                {t('common.cancel', 'Annuler')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: submitting ? 0.6 : 1,
                },
              ]}
              onPress={handleWithdraw}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="bank-transfer-out"
                    size={18}
                    color="white"
                  />
                  <Text style={styles.submitBtnText}>
                    {t('withdrawal.submit', 'Confirmer le retrait')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 12,
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    marginTop: 4,
  },
  quickSelect: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default WithdrawModal;
