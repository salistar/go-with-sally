/**
 * GO WITH SALLY - USE PRICING HOOK
 * Hook pour la gestion des prix flexibles
 */

import { useState, useCallback, useEffect } from 'react';
import { pricingService, PriceEstimate, PriceCalculationParams } from '../services/pricingService';
import { ServiceType } from '../types/services.types';

interface UsePricingReturn {
  isLoading: boolean;
  priceEstimate: PriceEstimate | null;
  proposedPrice: number;
  error: string | null;
  calculatePrice: (params: PriceCalculationParams) => Promise<void>;
  setProposedPrice: (price: number) => void;
  validatePrice: () => { isValid: boolean; message?: string };
  getAcceptanceLikelihood: () => {
    estimatedMinutes: number;
    likelihood: 'low' | 'medium' | 'high' | 'very_high';
    message: string;
  };
  getCommission: () => { commission: number; driverEarnings: number; commissionRate: number } | null;
  formatPrice: (price: number) => string;
  surgeInfo: { isActive: boolean; multiplier: number; reason?: string } | null;
}

export function usePricing(serviceType: ServiceType = 'sally_standard'): UsePricingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [proposedPrice, setProposedPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [surgeInfo, setSurgeInfo] = useState<{ isActive: boolean; multiplier: number; reason?: string } | null>(null);

  const calculatePrice = useCallback(async (params: PriceCalculationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const estimate = await pricingService.calculatePrice(params);
      setPriceEstimate(estimate);
      setProposedPrice(estimate.suggestedPrice);

      const surge = pricingService.getSurgeMultiplier(params.pickupLocation);
      setSurgeInfo({
        isActive: surge.isActive,
        multiplier: surge.multiplier,
        reason: surge.reason,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul du prix');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validatePrice = useCallback(() => {
    if (!priceEstimate) {
      return { isValid: false, message: 'Prix non calculé' };
    }
    return pricingService.validateProposedPrice(proposedPrice, priceEstimate);
  }, [proposedPrice, priceEstimate]);

  const getAcceptanceLikelihood = useCallback(() => {
    if (!priceEstimate) {
      return {
        estimatedMinutes: 0,
        likelihood: 'medium' as const,
        message: '',
      };
    }
    return pricingService.estimateAcceptanceTime(proposedPrice, priceEstimate.suggestedPrice);
  }, [proposedPrice, priceEstimate]);

  const getCommission = useCallback(() => {
    if (!priceEstimate) return null;
    return pricingService.calculateCommission(proposedPrice, serviceType);
  }, [proposedPrice, serviceType]);

  const formatPrice = useCallback((price: number) => {
    return pricingService.formatPrice(price, priceEstimate?.currency);
  }, [priceEstimate]);

  return {
    isLoading,
    priceEstimate,
    proposedPrice,
    error,
    calculatePrice,
    setProposedPrice,
    validatePrice,
    getAcceptanceLikelihood,
    getCommission,
    formatPrice,
    surgeInfo,
  };
}

export default usePricing;