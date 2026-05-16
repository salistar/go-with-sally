/**
 * GO WITH SALLY - PRICING TYPES
 */

import { ServiceType } from './services.types';

export interface PriceEstimate {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  distancePrice: number;
  durationPrice: number;
  serviceMultiplier: number;
  surgeMultiplier: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  base: number;
  distance: number;
  duration: number;
  service: number;
  surge: number;
}

export interface PriceCalculationParams {
  distanceKm: number;
  durationMinutes: number;
  serviceType: ServiceType;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  destinationLocation: {
    latitude: number;
    longitude: number;
  };
  scheduledTime?: Date;
}

export interface SurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason?: string;
  reasonKey?: string;
  expiresAt?: Date;
}

export interface PriceValidation {
  isValid: boolean;
  message?: string;
  messageKey?: string;
  adjustedPrice?: number;
}

export interface CommissionInfo {
  commission: number;
  driverEarnings: number;
  commissionRate: number;
}

export type AcceptanceLikelihood = 'low' | 'medium' | 'high' | 'very_high';

export interface AcceptanceEstimate {
  estimatedMinutes: number;
  likelihood: AcceptanceLikelihood;
  message: string;
  messageKey: string;
}

export interface PriceProposal {
  id: string;
  rideId: string;
  passengerId: string;
  proposedPrice: number;
  suggestedPrice: number;
  serviceType: ServiceType;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface ServicePricing {
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  multiplier: number;
  commissionRate: number;
}

export interface PricingConfig {
  currency: string;
  currencySymbol: string;
  minPricePercentage: number;
  maxPricePercentage: number;
  defaultCommissionRate: number;
  priceStep: number;
  surgeMultiplierMax: number;
}