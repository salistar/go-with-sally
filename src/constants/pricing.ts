/**
 * GO WITH SALLY - PRICING CONSTANTS
 * Configuration des prix et tarifs
 */

import { ServiceType } from '../types/services.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ServicePricing {
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  multiplier: number;
  commissionRate: number;
}

export interface PricingConfigType {
  currency: string;
  currencySymbol: string;
  minPricePercentage: number;
  maxPricePercentage: number;
  defaultCommissionRate: number;
  priceStep: number;
  surgeMultiplierMax: number;
}

export type SurgeReasonKey = 'rush_hour' | 'high_demand' | 'night_rate' | 'bad_weather' | 'special_event' | 'weekend';
export type LikelihoodLevel = 'very_high' | 'high' | 'medium' | 'low';

// ============================================================================
// PRICING CONFIG
// ============================================================================

export const PRICING_CONFIG: PricingConfigType = {
  currency: 'MAD',
  currencySymbol: 'DH',
  minPricePercentage: 0.75,
  maxPricePercentage: 1.35,
  defaultCommissionRate: 0.15,
  priceStep: 5,
  surgeMultiplierMax: 2.0,
};

// ============================================================================
// SERVICE PRICING
// ============================================================================

export const SERVICE_PRICING: Record<ServiceType, ServicePricing> = {
  sally_confort: {
    basePrice: 15,
    pricePerKm: 5.5,
    pricePerMinute: 0.8,
    minimumFare: 35,
    multiplier: 1.4,
    commissionRate: 0.18,
  },
  sally_standard: {
    basePrice: 10,
    pricePerKm: 4.0,
    pricePerMinute: 0.5,
    minimumFare: 20,
    multiplier: 1.0,
    commissionRate: 0.15,
  },
  sally_eco: {
    basePrice: 7,
    pricePerKm: 3.0,
    pricePerMinute: 0.3,
    minimumFare: 15,
    multiplier: 0.8,
    commissionRate: 0.12,
  },
  sally_pool: {
    basePrice: 5,
    pricePerKm: 2.5,
    pricePerMinute: 0.2,
    minimumFare: 10,
    multiplier: 0.6,
    commissionRate: 0.10,
  },
};

// ============================================================================
// SURGE PRICING
// ============================================================================

export const SURGE_REASONS: Record<SurgeReasonKey, { fr: string; ar: string; en: string }> = {
  rush_hour: {
    fr: 'Heure de pointe',
    ar: 'ساعة الذروة',
    en: 'Rush hour',
  },
  high_demand: {
    fr: 'Forte demande',
    ar: 'طلب مرتفع',
    en: 'High demand',
  },
  night_rate: {
    fr: 'Tarif de nuit',
    ar: 'تعريفة ليلية',
    en: 'Night rate',
  },
  bad_weather: {
    fr: 'Mauvais temps',
    ar: 'طقس سيء',
    en: 'Bad weather',
  },
  special_event: {
    fr: 'Événement spécial',
    ar: 'حدث خاص',
    en: 'Special event',
  },
  weekend: {
    fr: 'Week-end',
    ar: 'نهاية الأسبوع',
    en: 'Weekend',
  },
};

export const SURGE_CONFIGS: Record<SurgeReasonKey, { 
  multiplier: number; 
  icon: string; 
  color: string;
  name: { fr: string; ar: string; en: string };
}> = {
  rush_hour: {
    multiplier: 1.3,
    icon: '🚦',
    color: '#F59E0B',
    name: SURGE_REASONS.rush_hour,
  },
  high_demand: {
    multiplier: 1.2,
    icon: '📈',
    color: '#EF4444',
    name: SURGE_REASONS.high_demand,
  },
  night_rate: {
    multiplier: 1.25,
    icon: '🌙',
    color: '#6366F1',
    name: SURGE_REASONS.night_rate,
  },
  bad_weather: {
    multiplier: 1.15,
    icon: '🌧️',
    color: '#3B82F6',
    name: SURGE_REASONS.bad_weather,
  },
  special_event: {
    multiplier: 1.35,
    icon: '🎉',
    color: '#EC4899',
    name: SURGE_REASONS.special_event,
  },
  weekend: {
    multiplier: 1.1,
    icon: '📅',
    color: '#8B5CF6',
    name: SURGE_REASONS.weekend,
  },
};

// ============================================================================
// LIKELIHOOD CONFIG
// ============================================================================

export const LIKELIHOOD_CONFIGS: Record<LikelihoodLevel, {
  minRatio: number;
  percentage: number;
  estimatedMinutes: number;
  emoji: string;
  color: string;
  name: { fr: string; ar: string; en: string };
}> = {
  very_high: {
    minRatio: 1.15,
    percentage: 95,
    estimatedMinutes: 1,
    emoji: '🚀',
    color: '#22C55E',
    name: { fr: 'Très rapide', ar: 'سريع جدا', en: 'Very fast' },
  },
  high: {
    minRatio: 1.0,
    percentage: 80,
    estimatedMinutes: 3,
    emoji: '⚡',
    color: '#84CC16',
    name: { fr: 'Rapide', ar: 'سريع', en: 'Fast' },
  },
  medium: {
    minRatio: 0.85,
    percentage: 55,
    estimatedMinutes: 5,
    emoji: '⏳',
    color: '#EAB308',
    name: { fr: 'Normal', ar: 'عادي', en: 'Normal' },
  },
  low: {
    minRatio: 0,
    percentage: 25,
    estimatedMinutes: 10,
    emoji: '🐢',
    color: '#EF4444',
    name: { fr: 'Lent', ar: 'بطيء', en: 'Slow' },
  },
};

export const PRICE_LIKELIHOOD_COLORS: Record<LikelihoodLevel, string> = {
  very_high: '#22C55E',
  high: '#84CC16',
  medium: '#EAB308',
  low: '#EF4444',
};

export const PRICE_LIKELIHOOD_ICONS: Record<LikelihoodLevel, string> = {
  very_high: '🚀',
  high: '⚡',
  medium: '⏳',
  low: '🐢',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function roundPrice(price: number): number {
  return Math.round(price / PRICING_CONFIG.priceStep) * PRICING_CONFIG.priceStep;
}

export function calculateEstimatedPrice(
  distanceKm: number,
  durationMinutes: number,
  serviceType: ServiceType,
  surgeMultiplier: number = 1.0
): number {
  const pricing = SERVICE_PRICING[serviceType];
  const rawPrice = (pricing.basePrice + distanceKm * pricing.pricePerKm + durationMinutes * pricing.pricePerMinute) 
    * pricing.multiplier * surgeMultiplier;
  return Math.max(roundPrice(rawPrice), pricing.minimumFare);
}

export function getPriceRange(suggestedPrice: number): { min: number; max: number } {
  const min = roundPrice(suggestedPrice * PRICING_CONFIG.minPricePercentage);
  const max = roundPrice(suggestedPrice * PRICING_CONFIG.maxPricePercentage);
  return { min, max };
}

export function getLikelihoodLevel(priceRatio: number): LikelihoodLevel {
  if (priceRatio >= LIKELIHOOD_CONFIGS.very_high.minRatio) return 'very_high';
  if (priceRatio >= LIKELIHOOD_CONFIGS.high.minRatio) return 'high';
  if (priceRatio >= LIKELIHOOD_CONFIGS.medium.minRatio) return 'medium';
  return 'low';
}

export function formatPrice(amount: number): string {
  return `${amount} ${PRICING_CONFIG.currencySymbol}`;
}

export function calculateSurgeMultiplier(): { multiplier: number; reason: SurgeReasonKey | null } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Vérifier heure de nuit (22h - 5h)
  if (hour >= 22 || hour < 5) {
    return { multiplier: SURGE_CONFIGS.night_rate.multiplier, reason: 'night_rate' };
  }
  
  // Vérifier heure de pointe (7h-9h et 17h-19h)
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
    return { multiplier: SURGE_CONFIGS.rush_hour.multiplier, reason: 'rush_hour' };
  }
  
  // Vérifier weekend
  if (day === 0 || day === 6) {
    return { multiplier: SURGE_CONFIGS.weekend.multiplier, reason: 'weekend' };
  }
  
  return { multiplier: 1.0, reason: null };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  PRICING_CONFIG,
  SERVICE_PRICING,
  SURGE_REASONS,
  SURGE_CONFIGS,
  LIKELIHOOD_CONFIGS,
  PRICE_LIKELIHOOD_COLORS,
  PRICE_LIKELIHOOD_ICONS,
  roundPrice,
  calculateEstimatedPrice,
  getPriceRange,
  getLikelihoodLevel,
  formatPrice,
  calculateSurgeMultiplier,
};