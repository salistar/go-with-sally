/**
 * GO WITH SALLY - SERVICES CONSTANTS
 * Types de services proposés par les conductrices
 * @version 2.1.0 - Fixed property names to match ServiceConfig type
 */

import { ServiceType, ServiceConfig, PaymentMethod, PaymentConfig } from '../types/services.types';

export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  sally_eco: {
    type: 'sally_eco',
    name: { fr: 'Sally Éco', ar: 'سالي إيكو', en: 'Sally Eco' },
    shortDescription: { fr: 'Économique', ar: 'اقتصادي', en: 'Economic' },
    description: {
      fr: 'Option la plus abordable',
      ar: 'الخيار الأكثر اقتصادية',
      en: 'Most affordable option',
    },
    icon: '💰',
    color: '#22C55E',
    backgroundColor: '#DCFCE7',
    features: [
      { fr: 'Prix réduit', ar: 'سعر مخفض', en: 'Reduced price' },
      { fr: 'Sécurité garantie', ar: 'أمان مضمون', en: 'Safety guaranteed' },
      { fr: 'Trajet direct', ar: 'رحلة مباشرة', en: 'Direct route' },
    ],
    requiredBadge: 'none',
    estimatedWaitTime: { min: 5, max: 15 },
    capacity: { min: 1, max: 4 },
    allowsLuggage: false,
    pricing: {
      basePrice: 8,
      pricePerKm: 3,
      pricePerMinute: 0.3,
      minimumFare: 15,
      multiplier: 1.0,
      commissionRate: 0.15,
    },
    isActive: true,
    order: 1,
  },
  sally_standard: {
    type: 'sally_standard',
    name: { fr: 'Sally Standard', ar: 'سالي ستاندارد', en: 'Sally Standard' },
    shortDescription: { fr: 'Standard', ar: 'قياسي', en: 'Standard' },
    description: {
      fr: 'Confort et sécurité au meilleur prix',
      ar: 'راحة وأمان بأفضل سعر',
      en: 'Comfort and safety at the best price',
    },
    icon: '🚗',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    features: [
      { fr: 'Véhicule confortable', ar: 'سيارة مريحة', en: 'Comfortable vehicle' },
      { fr: 'Conductrice vérifiée', ar: 'سائقة موثقة', en: 'Verified driver' },
      { fr: 'Suivi GPS en temps réel', ar: 'تتبع GPS في الوقت الحقيقي', en: 'Real-time GPS tracking' },
    ],
    requiredBadge: 'basic',
    estimatedWaitTime: { min: 3, max: 10 },
    capacity: { min: 1, max: 4 },
    allowsLuggage: true,
    pricing: {
      basePrice: 10,
      pricePerKm: 4,
      pricePerMinute: 0.4,
      minimumFare: 20,
      multiplier: 1.0,
      commissionRate: 0.18,
    },
    isActive: true,
    order: 2,
  },
  sally_confort: {
    type: 'sally_confort',
    name: { fr: 'Sally Confort', ar: 'سالي كومفورت', en: 'Sally Comfort' },
    shortDescription: { fr: 'Premium', ar: 'فاخر', en: 'Premium' },
    description: {
      fr: 'Véhicule premium, eau offerte, WiFi disponible',
      ar: 'سيارة فاخرة، ماء مجاني، واي فاي متاح',
      en: 'Premium vehicle, free water, WiFi available',
    },
    icon: '🌟',
    color: '#A855F7',
    backgroundColor: '#F3E8FF',
    features: [
      { fr: 'Véhicule haut de gamme', ar: 'سيارة فاخرة', en: 'Premium vehicle' },
      { fr: 'Eau offerte', ar: 'ماء مجاني', en: 'Free water' },
      { fr: 'WiFi disponible', ar: 'واي فاي متاح', en: 'WiFi available' },
      { fr: 'Chargeur téléphone', ar: 'شاحن هاتف', en: 'Phone charger' },
      { fr: 'Climatisation garantie', ar: 'تكييف مضمون', en: 'AC guaranteed' },
    ],
    requiredBadge: 'premium',
    estimatedWaitTime: { min: 5, max: 15 },
    capacity: { min: 1, max: 4 },
    allowsLuggage: true,
    pricing: {
      basePrice: 15,
      pricePerKm: 6,
      pricePerMinute: 0.6,
      minimumFare: 30,
      multiplier: 1.2,
      commissionRate: 0.20,
    },
    isActive: true,
    order: 3,
  },
  sally_pool: {
    type: 'sally_pool',
    name: { fr: 'Sally Pool', ar: 'سالي بول', en: 'Sally Pool' },
    shortDescription: { fr: 'Partagé', ar: 'مشترك', en: 'Shared' },
    description: {
      fr: 'Partagez le trajet, divisez le prix',
      ar: 'شاركي الرحلة، قسمي السعر',
      en: 'Share the ride, split the price',
    },
    icon: '👥',
    color: '#F97316',
    backgroundColor: '#FFEDD5',
    features: [
      { fr: 'Prix partagé', ar: 'سعر مشترك', en: 'Shared price' },
      { fr: "Jusqu'à 3 passagères", ar: 'حتى 3 راكبات', en: 'Up to 3 passengers' },
      { fr: 'Écologique', ar: 'صديقة للبيئة', en: 'Eco-friendly' },
      { fr: 'Rencontres entre femmes', ar: 'لقاءات بين النساء', en: 'Meet other women' },
    ],
    requiredBadge: 'basic',
    estimatedWaitTime: { min: 5, max: 20 },
    capacity: { min: 1, max: 3 },
    allowsLuggage: false,
    pricing: {
      basePrice: 6,
      pricePerKm: 2.5,
      pricePerMinute: 0.25,
      minimumFare: 12,
      multiplier: 0.8,
      commissionRate: 0.15,
    },
    isActive: true,
    order: 4,
  },
};

export const PAYMENT_CONFIGS: Record<PaymentMethod, PaymentConfig> = {
  cash: {
    method: 'cash',
    name: { fr: 'Espèces', ar: 'نقداً', en: 'Cash' },
    description: { fr: 'Paiement en espèces à la fin du trajet', ar: 'الدفع نقداً في نهاية الرحلة', en: 'Cash payment at the end of the ride' },
    icon: '💵',
    color: '#22C55E',
    isAvailable: true,
    requiresSetup: false,
  },
  card: {
    method: 'card',
    name: { fr: 'Carte bancaire', ar: 'بطاقة مصرفية', en: 'Credit Card' },
    description: { fr: 'Paiement automatique par carte', ar: 'دفع تلقائي بالبطاقة', en: 'Automatic card payment' },
    icon: '💳',
    color: '#3B82F6',
    isAvailable: true,
    requiresSetup: true,
  },
  wallet: {
    method: 'wallet',
    name: { fr: 'Portefeuille Sally', ar: 'محفظة سالي', en: 'Sally Wallet' },
    description: { fr: 'Paiement depuis votre solde Sally', ar: 'الدفع من رصيدك في سالي', en: 'Payment from your Sally balance' },
    icon: '👛',
    color: '#A855F7',
    isAvailable: true,
    requiresSetup: true,
  },
  transfer: {
    method: 'transfer',
    name: { fr: 'Virement bancaire', ar: 'تحويل بنكي', en: 'Bank Transfer' },
    description: { fr: 'Virement après le trajet', ar: 'تحويل بعد الرحلة', en: 'Transfer after the ride' },
    icon: '🏦',
    color: '#6B7280',
    isAvailable: false,
    requiresSetup: true,
  },
};

export const DEFAULT_DRIVER_SERVICES: ServiceType[] = ['sally_standard'];
export const DEFAULT_DRIVER_PAYMENTS: PaymentMethod[] = ['cash'];

export function getServiceConfig(type: ServiceType): ServiceConfig {
  return SERVICE_CONFIGS[type] || SERVICE_CONFIGS.sally_standard;
}

export function getPaymentConfig(method: PaymentMethod): PaymentConfig {
  return PAYMENT_CONFIGS[method] || PAYMENT_CONFIGS.cash;
}

export function getAvailableServices(badgeLevel: string): ServiceType[] {
  const badgeOrder = ['none', 'basic', 'verified', 'premium', 'elite'];
  const userBadgeIndex = badgeOrder.indexOf(badgeLevel);

  return (Object.keys(SERVICE_CONFIGS) as ServiceType[]).filter(type => {
    const requiredIndex = badgeOrder.indexOf(SERVICE_CONFIGS[type].requiredBadge);
    return userBadgeIndex >= requiredIndex;
  });
}

export default {
  SERVICE_CONFIGS,
  PAYMENT_CONFIGS,
  DEFAULT_DRIVER_SERVICES,
  DEFAULT_DRIVER_PAYMENTS,
  getServiceConfig,
  getPaymentConfig,
  getAvailableServices,
};