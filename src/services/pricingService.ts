/**
 * GO WITH SALLY - PRICING SERVICE
 * Service de calcul des prix et estimations
 */

import { ServiceType } from '../types/services.types';
import {
  PRICING_CONFIG,
  SERVICE_PRICING,
  SURGE_CONFIGS,
  LIKELIHOOD_CONFIGS,
  SurgeReasonKey,
  LikelihoodLevel,
  roundPrice,
  calculateEstimatedPrice,
  getPriceRange,
  getLikelihoodLevel,
  calculateSurgeMultiplier,
  formatPrice as formatPriceHelper,
} from '../constants/pricing';

// ============================================================================
// TYPES
// ============================================================================

export interface PriceCalculationParams {
  distanceKm: number;
  durationMinutes: number;
  serviceType: ServiceType;
  pickupLocation?: { lat: number; lng: number };
  customSurgeMultiplier?: number;
}

export interface PriceBreakdown {
  base: number;
  distance: number;
  duration: number;
  serviceMultiplier: number;
  surgeMultiplier: number;
  subtotal: number;
  total: number;
}

export interface PriceEstimate {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  breakdown: PriceBreakdown;
  currency: string;
  currencySymbol: string;
}

export interface SurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason: SurgeReasonKey | null;
  icon: string | null;
  color: string | null;
  name: { fr: string; ar: string; en: string } | null;
}

export interface AcceptanceLikelihood {
  level: LikelihoodLevel;
  percentage: number;
  estimatedMinutes: number;
  emoji: string;
  color: string;
  name: { fr: string; ar: string; en: string };
}

export interface CommissionResult {
  grossPrice: number;
  commission: number;
  commissionRate: number;
  driverEarnings: number;
  badgeBonus: number;
  finalEarnings: number;
}

// ============================================================================
// PRICING SERVICE CLASS
// ============================================================================

class PricingService {
  // ==========================================================================
  // PRICE CALCULATION
  // ==========================================================================

  /**
   * Calcule l'estimation complète du prix
   */
  calculateEstimate(params: {
    distanceKm: number;
    durationMinutes: number;
    serviceType: ServiceType;
    customSurgeMultiplier?: number;
  }): { estimate: PriceEstimate; surgeInfo: SurgeInfo } {
    const { distanceKm, durationMinutes, serviceType, customSurgeMultiplier } = params;
    const pricing = SERVICE_PRICING[serviceType];
    
    // Calculer le surge
    const { multiplier: autoSurge, reason } = calculateSurgeMultiplier();
    const surgeMultiplier = customSurgeMultiplier ?? autoSurge;
    
    // Calculs détaillés
    const basePrice = pricing.basePrice;
    const distancePrice = distanceKm * pricing.pricePerKm;
    const durationPrice = durationMinutes * pricing.pricePerMinute;
    const subtotal = basePrice + distancePrice + durationPrice;
    const withServiceMultiplier = subtotal * pricing.multiplier;
    const withSurge = withServiceMultiplier * surgeMultiplier;
    
    // Prix final arrondi
    const suggestedPrice = Math.max(roundPrice(withSurge), pricing.minimumFare);
    
    // Range de prix
    const { min: minPrice, max: maxPrice } = getPriceRange(suggestedPrice);
    
    // Breakdown
    const breakdown: PriceBreakdown = {
      base: basePrice,
      distance: Math.round(distancePrice * 100) / 100,
      duration: Math.round(durationPrice * 100) / 100,
      serviceMultiplier: pricing.multiplier,
      surgeMultiplier,
      subtotal: Math.round(subtotal * 100) / 100,
      total: suggestedPrice,
    };
    
    // Estimate
    const estimate: PriceEstimate = {
      suggestedPrice,
      minPrice,
      maxPrice,
      breakdown,
      currency: PRICING_CONFIG.currency,
      currencySymbol: PRICING_CONFIG.currencySymbol,
    };
    
    // Surge info
    const surgeConfig = reason ? SURGE_CONFIGS[reason] : null;
    const surgeInfo: SurgeInfo = {
      isActive: surgeMultiplier > 1,
      multiplier: Math.round(surgeMultiplier * 100) / 100,
      reason,
      icon: surgeConfig?.icon ?? null,
      color: surgeConfig?.color ?? null,
      name: surgeConfig?.name ?? null,
    };
    
    return { estimate, surgeInfo };
  }

  /**
   * Calcul simplifié du prix
   */
  quickEstimate(
    distanceKm: number,
    durationMinutes: number,
    serviceType: ServiceType
  ): number {
    return calculateEstimatedPrice(distanceKm, durationMinutes, serviceType);
  }

  /**
   * Alias pour calculateEstimate - compatibilité avec usePricing
   */
  async calculatePrice(params: PriceCalculationParams): Promise<PriceEstimate> {
    const { estimate } = this.calculateEstimate({
      distanceKm: params.distanceKm,
      durationMinutes: params.durationMinutes,
      serviceType: params.serviceType,
      customSurgeMultiplier: params.customSurgeMultiplier,
    });
    return estimate;
  }

  /**
   * Obtient le multiplicateur de surge pour une localisation
   */
  getSurgeMultiplier(pickupLocation?: { lat: number; lng: number }): {
    isActive: boolean;
    multiplier: number;
    reason?: string;
  } {
    const { multiplier, reason } = calculateSurgeMultiplier();
    return {
      isActive: multiplier > 1,
      multiplier,
      reason: reason || undefined,
    };
  }

  /**
   * Valide un prix proposé par rapport à l'estimation
   */
  validateProposedPrice(
    proposedPrice: number,
    estimate: PriceEstimate
  ): { isValid: boolean; message?: string } {
    if (proposedPrice < estimate.minPrice) {
      return {
        isValid: false,
        message: `Le prix minimum est ${estimate.minPrice} ${estimate.currencySymbol}`,
      };
    }
    
    if (proposedPrice > estimate.maxPrice) {
      return {
        isValid: false,
        message: `Le prix maximum est ${estimate.maxPrice} ${estimate.currencySymbol}`,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Estime le temps d'acceptation basé sur le prix proposé
   */
  estimateAcceptanceTime(
    proposedPrice: number,
    suggestedPrice: number
  ): {
    estimatedMinutes: number;
    likelihood: LikelihoodLevel;
    message: string;
  } {
    const likelihood = this.calculateAcceptanceLikelihood(proposedPrice, suggestedPrice);
    
    const messages: Record<LikelihoodLevel, string> = {
      very_high: 'Acceptation quasi instantanée !',
      high: 'Très bonne chance d\'acceptation',
      medium: 'Chance moyenne, peut prendre du temps',
      low: 'Prix bas, peu de conductrices accepteront',
    };
    
    return {
      estimatedMinutes: likelihood.estimatedMinutes,
      likelihood: likelihood.level,
      message: messages[likelihood.level],
    };
  }

  // ==========================================================================
  // ACCEPTANCE LIKELIHOOD
  // ==========================================================================

  /**
   * Calcule la probabilité d'acceptation basée sur le ratio prix proposé/suggéré
   */
  calculateAcceptanceLikelihood(
    proposedPrice: number,
    suggestedPrice: number
  ): AcceptanceLikelihood {
    if (suggestedPrice === 0) {
      return {
        level: 'medium',
        percentage: 55,
        estimatedMinutes: 5,
        emoji: '⏳',
        color: '#EAB308',
        name: { fr: 'Normal', ar: 'عادي', en: 'Normal' },
      };
    }
    
    const ratio = proposedPrice / suggestedPrice;
    const level = getLikelihoodLevel(ratio);
    const config = LIKELIHOOD_CONFIGS[level];
    
    return {
      level,
      percentage: config.percentage,
      estimatedMinutes: config.estimatedMinutes,
      emoji: config.emoji,
      color: config.color,
      name: config.name,
    };
  }

  // ==========================================================================
  // SURGE PRICING
  // ==========================================================================

  /**
   * Récupère les informations de surge actuelles
   */
  getCurrentSurge(): SurgeInfo {
    const { multiplier, reason } = calculateSurgeMultiplier();
    const config = reason ? SURGE_CONFIGS[reason] : null;
    
    return {
      isActive: multiplier > 1,
      multiplier,
      reason,
      icon: config?.icon ?? null,
      color: config?.color ?? null,
      name: config?.name ?? null,
    };
  }

  // ==========================================================================
  // COMMISSION CALCULATION
  // ==========================================================================

  /**
   * Calcule la commission Sally et les gains de la conductrice
   * Supporte deux syntaxes:
   * - calculateCommission({ price, serviceType, badgeEarningsBonus })
   * - calculateCommission(price, serviceType)
   */
  calculateCommission(
    paramsOrPrice: { price: number; serviceType: ServiceType; badgeEarningsBonus?: number } | number,
    serviceTypeArg?: ServiceType
  ): CommissionResult {
    let price: number;
    let serviceType: ServiceType;
    let badgeEarningsBonus: number;

    if (typeof paramsOrPrice === 'number') {
      // Syntaxe: calculateCommission(price, serviceType)
      price = paramsOrPrice;
      serviceType = serviceTypeArg || 'sally_standard';
      badgeEarningsBonus = 0;
    } else {
      // Syntaxe: calculateCommission({ price, serviceType, badgeEarningsBonus })
      price = paramsOrPrice.price;
      serviceType = paramsOrPrice.serviceType;
      badgeEarningsBonus = paramsOrPrice.badgeEarningsBonus || 0;
    }

    const pricing = SERVICE_PRICING[serviceType];
    
    const commissionRate = pricing.commissionRate;
    const commission = Math.round(price * commissionRate * 100) / 100;
    const driverEarnings = price - commission;
    const badgeBonus = Math.round(driverEarnings * badgeEarningsBonus * 100) / 100;
    const finalEarnings = driverEarnings + badgeBonus;
    
    return {
      grossPrice: price,
      commission,
      commissionRate,
      driverEarnings: Math.round(driverEarnings * 100) / 100,
      badgeBonus,
      finalEarnings: Math.round(finalEarnings * 100) / 100,
    };
  }

  // ==========================================================================
  // QUICK PRICES
  // ==========================================================================

  /**
   * Génère les suggestions de prix rapides
   */
  generateQuickPrices(suggestedPrice: number): {
    min: number;
    suggested: number;
    max: number;
    options: number[];
  } {
    const { min, max } = getPriceRange(suggestedPrice);
    
    // Options intermédiaires
    const step = PRICING_CONFIG.priceStep;
    const options: number[] = [min];
    
    // Ajouter des options entre min et max
    let current = min + step * 2;
    while (current < suggestedPrice) {
      options.push(current);
      current += step * 2;
    }
    
    options.push(suggestedPrice);
    
    current = suggestedPrice + step * 2;
    while (current < max) {
      options.push(current);
      current += step * 2;
    }
    
    options.push(max);
    
    return {
      min,
      suggested: suggestedPrice,
      max,
      options: [...new Set(options)].sort((a, b) => a - b),
    };
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Valide si un prix est dans les limites acceptables
   */
  validatePrice(
    price: number,
    suggestedPrice: number
  ): { isValid: boolean; error?: string } {
    const { min, max } = getPriceRange(suggestedPrice);
    
    if (price < min) {
      return {
        isValid: false,
        error: `Le prix minimum est ${formatPriceHelper(min)}`,
      };
    }
    
    if (price > max) {
      return {
        isValid: false,
        error: `Le prix maximum est ${formatPriceHelper(max)}`,
      };
    }
    
    return { isValid: true };
  }

  // ==========================================================================
  // FORMATTING
  // ==========================================================================

  /**
   * Formate un prix pour l'affichage
   * @param amount - Le montant à formater
   * @param currency - La devise (optionnel, utilise la config par défaut)
   */
  formatPrice(amount: number, currency?: string): string {
    const symbol = currency || PRICING_CONFIG.currencySymbol;
    return `${amount} ${symbol}`;
  }

  /**
   * Formate un range de prix
   */
  formatPriceRange(min: number, max: number): string {
    return `${min} - ${max} ${PRICING_CONFIG.currencySymbol}`;
  }

  /**
   * Arrondit un prix au step configuré
   */
  roundPrice(price: number): number {
    return roundPrice(price);
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /**
   * Récupère la configuration de pricing pour un service
   */
  getServicePricing(serviceType: ServiceType) {
    return SERVICE_PRICING[serviceType];
  }

  /**
   * Récupère la configuration générale
   */
  getPricingConfig() {
    return PRICING_CONFIG;
  }

  /**
   * Récupère les configurations de likelihood
   */
  getLikelihoodConfigs() {
    return LIKELIHOOD_CONFIGS;
  }

  /**
   * Récupère les configurations de surge
   */
  getSurgeConfigs() {
    return SURGE_CONFIGS;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const pricingService = new PricingService();
export default pricingService;

// Ré-export des types depuis pricing pour commodité
export { LikelihoodLevel, SurgeReasonKey } from '../constants/pricing';