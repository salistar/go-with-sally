/**
 * GO WITH SALLY - BADGE PROGRESS COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { BadgeLevel, DocumentType } from '../../types/badges.types';
import { BADGE_CONFIGS, DOCUMENT_LABELS, getNextBadgeRequirements } from '../../constants/badges';

interface BadgeProgressProps {
  currentLevel: BadgeLevel;
  verifiedDocuments: DocumentType[];
  onUploadDocument?: (type: DocumentType) => void;
  compact?: boolean;
}

export const BadgeProgress: React.FC<BadgeProgressProps> = ({
  currentLevel,
  verifiedDocuments,
  onUploadDocument,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'ar' | 'en';
  const isRTL = I18nManager.isRTL;

  const currentConfig = BADGE_CONFIGS[currentLevel];
  const nextBadge = getNextBadgeRequirements(currentLevel, verifiedDocuments);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.compactHeader, isRTL && styles.rtlRow]}>
          <Text style={[styles.compactIcon, isRTL && { marginRight: 0, marginLeft: 10 }]}>{currentConfig.icon}</Text>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactLevel, { color: currentConfig.color }]}>
              {currentConfig.name[lang]}
            </Text>
            {nextBadge && (
              <Text style={[styles.compactNext, { color: theme.colors.textSecondary }]}>
                {t('badges.nextLevel')}: {BADGE_CONFIGS[nextBadge.nextLevel].name[lang]}
              </Text>
            )}
          </View>
        </View>
        
        {nextBadge && (
          <View style={[styles.compactProgress, isRTL && styles.rtlRow]}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${nextBadge.progress}%`,
                    backgroundColor: BADGE_CONFIGS[nextBadge.nextLevel].color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }, isRTL && { marginLeft: 0, marginRight: 8 }]}>
              {Math.round(nextBadge.progress)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Current Badge */}
      <View style={[styles.currentBadge, isRTL && styles.rtlRow]}>
        <View style={[styles.badgeCircle, { backgroundColor: currentConfig.backgroundColor, borderColor: currentConfig.color }, isRTL && { marginRight: 0, marginLeft: 16 }]}>
          <Text style={styles.badgeIcon}>{currentConfig.icon}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeLevel, { color: currentConfig.color }]}>
            {currentConfig.name[lang]}
          </Text>
          <Text style={[styles.badgeDesc, { color: theme.colors.textSecondary }]}>
            {currentConfig.description[lang]}
          </Text>
        </View>
      </View>

      {/* Benefits */}
      {currentConfig.benefits.length > 0 && (
        <View style={styles.benefitsContainer}>
          <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>
            {t('badges.yourBenefits')}
          </Text>
          {currentConfig.benefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitRow, isRTL && styles.rtlRow]}>
              <Text style={[styles.benefitCheck, { color: currentConfig.color }, isRTL && { marginRight: 0, marginLeft: 8 }]}>✓</Text>
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>
                {benefit[lang]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Badge Progress */}
      {nextBadge && (
        <View style={[styles.nextBadgeContainer, { borderTopColor: theme.colors.border }]}>
          <View style={[styles.nextBadgeHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.nextBadgeIcon, isRTL && { marginRight: 0, marginLeft: 12 }]}>{BADGE_CONFIGS[nextBadge.nextLevel].icon}</Text>
            <View style={styles.nextBadgeInfo}>
              <Text style={[styles.nextBadgeTitle, { color: theme.colors.text }]}>
                {t('badges.nextLevel')}: {BADGE_CONFIGS[nextBadge.nextLevel].name[lang]}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${nextBadge.progress}%`,
                      backgroundColor: BADGE_CONFIGS[nextBadge.nextLevel].color,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.progressPercent, { color: BADGE_CONFIGS[nextBadge.nextLevel].color }, isRTL && { marginLeft: 0, marginRight: 12 }]}>
              {Math.round(nextBadge.progress)}%
            </Text>
          </View>

          {/* Missing Documents */}
          {nextBadge.missingDocuments.length > 0 && (
            <View style={styles.missingDocs}>
              <Text style={[styles.missingTitle, { color: theme.colors.text }]}>
                {t('badges.documentsNeeded')}
              </Text>
              {nextBadge.missingDocuments.slice(0, 3).map((docType, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.missingDocRow, { backgroundColor: `${BADGE_CONFIGS[nextBadge.nextLevel].color}10` }]}
                  onPress={() => onUploadDocument?.(docType)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.missingDocText, { color: theme.colors.text }]}>
                    {DOCUMENT_LABELS[docType][lang]}
                  </Text>
                  <Text style={[styles.uploadIcon, { color: BADGE_CONFIGS[nextBadge.nextLevel].color }]}>
                    +
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Elite achieved */}
      {!nextBadge && currentLevel === 'elite' && (
        <View style={[styles.eliteContainer, { backgroundColor: '#FEF9C3' }, isRTL && styles.rtlRow]}>
          <Text style={[styles.eliteIcon, isRTL && { marginRight: 0, marginLeft: 8 }]}>🎉</Text>
          <Text style={[styles.eliteText, { color: '#92400E' }]}>
            {t('badges.eliteAchieved')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
  },
  rtlRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 13,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 13,
  },
  nextBadgeContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  nextBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextBadgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  nextBadgeInfo: {
    flex: 1,
  },
  nextBadgeTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  missingDocs: {
    marginTop: 12,
  },
  missingTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  missingDocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  missingDocText: {
    fontSize: 13,
  },
  uploadIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eliteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  eliteIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  eliteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Compact styles
  compactContainer: {
    borderRadius: 12,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  compactInfo: {
    flex: 1,
  },
  compactLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactNext: {
    fontSize: 11,
    marginTop: 2,
  },
  compactProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default BadgeProgress;