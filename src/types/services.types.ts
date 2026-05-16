/**
 * GO WITH SALLY - SERVICES TYPES
 */

import { BadgeLevel } from './badges.types';

export type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

export interface LocalizedString {
  fr: string;
  ar: string;
  en: string;
}

export interface ServiceConfig {
  type: ServiceType;
  name: LocalizedString;
  description: LocalizedString;
  shortDescription: LocalizedString;
  icon: string;
  emoji?: string;
  color: string;
  backgroundColor: string;
  features: LocalizedString[];
  requiredBadge: BadgeLevel;
  pricing: {
    basePrice: number;
    pricePerKm: number;
    pricePerMinute: number;
    minimumFare: number;
    multiplier: number;
    commissionRate: number;
  };
  estimatedWaitTime: {
    min: number;
    max: number;
  };
  capacity: {
    min: number;
    max: number;
  };
  allowsLuggage: boolean;
  isActive: boolean;
  order: number;
}

export interface PaymentConfig {
  method: PaymentMethod;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  color: string;
  isAvailable: boolean;
  requiresSetup: boolean;
  processingFee?: number;
}

export interface ServiceEstimate {
  serviceType: ServiceType;
  price: number;
  eta: number;
  distance?: number;
  isAvailable: boolean;
}

export interface ServiceSelection {
  serviceType: ServiceType;
  estimatedPrice: number;
  eta: number;
  paymentMethod: PaymentMethod;
}