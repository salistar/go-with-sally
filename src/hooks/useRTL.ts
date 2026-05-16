/**
 * ============================================================================
 * GO WITH SALLY - useRTL Hook
 * ============================================================================
 * Hook réactif pour le support RTL (Right-to-Left)
 * Se met à jour automatiquement quand la langue change
 *
 * @module hooks/useRTL
 * @version 1.0.0
 * ============================================================================
 */

import { useMemo } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Hook réactif pour le support RTL
 * Retourne des valeurs RTL-aware qui se mettent à jour quand la langue change
 */
export const useRTL = () => {
  const { i18n } = useTranslation();

  const isRTL = useMemo(() => {
    // Re-evaluate when language changes
    return i18n.language === 'ar' || I18nManager.isRTL;
  }, [i18n.language]);

  const rtlStyle = useMemo(() => ({
    flexDirection: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left',
    writingDirection: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  }), [isRTL]);

  return {
    isRTL,
    flexRow: rtlStyle.flexDirection,
    textAlign: rtlStyle.textAlign,
    writingDirection: rtlStyle.writingDirection,
    // Helper to flip margins/paddings
    marginStart: (value: number) => isRTL ? { marginRight: value } : { marginLeft: value },
    marginEnd: (value: number) => isRTL ? { marginLeft: value } : { marginRight: value },
    paddingStart: (value: number) => isRTL ? { paddingRight: value } : { paddingLeft: value },
    paddingEnd: (value: number) => isRTL ? { paddingLeft: value } : { paddingRight: value },
    // Transform for icons that should flip in RTL
    iconTransform: isRTL ? [{ scaleX: -1 }] : [],
  };
};

export default useRTL;
