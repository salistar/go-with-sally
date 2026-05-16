/**
 * GO WITH SALLY - GENDER VERIFICATION MODAL COMPONENT
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';

interface GenderVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerifyWithFace: () => void;
  onVerifyWithDocument: () => void;
  onRequestManual: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const GenderVerificationModal: React.FC<GenderVerificationModalProps> = ({
  visible,
  onClose,
  onVerifyWithFace,
  onVerifyWithDocument,
  onRequestManual,
  isLoading = false,
  error = null,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>👩</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('verification.gender.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('verification.gender.subtitle')}
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
            </View>
          )}

          {/* Options */}
          <View style={styles.options}>
            {/* Face Verification */}
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: '#E0E7FF', borderColor: '#6366F1' }]}
              onPress={onVerifyWithFace}
              disabled={isLoading}
            >
              <Text style={styles.optionIcon}>📸</Text>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: '#4338CA' }]}>
                  {t('verification.gender.faceOption')}
                </Text>
                <Text style={[styles.optionDesc, { color: '#6366F1' }]}>
                  {t('verification.gender.faceDesc')}
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>

            {/* Document Verification */}
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: '#DCFCE7', borderColor: '#22C55E' }]}
              onPress={onVerifyWithDocument}
              disabled={isLoading}
            >
              <Text style={styles.optionIcon}>🪪</Text>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: '#15803D' }]}>
                  {t('verification.gender.documentOption')}
                </Text>
                <Text style={[styles.optionDesc, { color: '#22C55E' }]}>
                  {t('verification.gender.documentDesc')}
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>

            {/* Manual Verification */}
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
              onPress={onRequestManual}
              disabled={isLoading}
            >
              <Text style={styles.optionIcon}>📞</Text>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: '#B45309' }]}>
                  {t('verification.gender.manualOption')}
                </Text>
                <Text style={[styles.optionDesc, { color: '#F59E0B' }]}>
                  {t('verification.gender.manualDesc')}
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                {t('verification.gender.verifying')}
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {t('verification.gender.privacyNote')}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { borderColor: theme.colors.border }]}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  options: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
  },
  optionArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GenderVerificationModal;