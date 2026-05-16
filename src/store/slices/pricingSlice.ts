/**
 * ============================================================================
 * GO WITH SALLY - PRICING SLICE
 * ============================================================================
 * @module store/slices/pricingSlice
 * @version 1.0.0
 * 
 * Gestion du pricing flexible:
 * - Prix suggéré par l'algorithme
 * - Prix proposé par la passagère (min/max)
 * - Calcul de probabilité d'acceptation
 * - Historique des prix pour analytics
 * ============================================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// TYPES
// ============================================================================

export type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

export interface PriceBreakdown {
  base: number;
  distance: number;
  duration: number;
  service: number;
  surge: number;
  total: number;
}

export interface PriceEstimate {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  breakdown: PriceBreakdown;
  currency: string;
  serviceType: ServiceType;
  surgeMultiplier: number;
  surgeReason: string | null;
}

export interface AcceptanceLikelihood {
  likelihood: 'very_high' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  percentage: number;
  emoji: string;
  color: string;
}

export interface PriceHistoryEntry {
  id: string;
  price: number;
  serviceType: ServiceType;
  wasAccepted: boolean;
  timestamp: string;
}

export interface SurgeInfo {
  isActive: boolean;
  multiplier: number;
  reason: 'rush_hour' | 'night_rate' | 'high_demand' | 'weather' | null;
  expiresAt?: string;
}

export interface PricingState {
  // Current pricing
  currentEstimate: PriceEstimate | null;
  proposedPrice: number;
  selectedService: ServiceType;
  selectedPayment: PaymentMethod;
  
  // Acceptance
  acceptanceLikelihood: AcceptanceLikelihood | null;
  
  // Surge
  surgeInfo: SurgeInfo | null;
  
  // History
  priceHistory: PriceHistoryEntry[];
  averageAcceptanceRate: number;
  
  // Quick prices (suggestions)
  quickPrices: number[];
  
  // Status
  isCalculating: boolean;
  error: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SERVICE_PRICING = {
  sally_confort: {
    basePrice: 15,
    pricePerKm: 5.5,
    pricePerMinute: 0.8,
    minimumFare: 35,
    multiplier: 1.4,
  },
  sally_standard: {
    basePrice: 10,
    pricePerKm: 4.0,
    pricePerMinute: 0.5,
    minimumFare: 20,
    multiplier: 1.0,
  },
  sally_eco: {
    basePrice: 7,
    pricePerKm: 3.0,
    pricePerMinute: 0.3,
    minimumFare: 15,
    multiplier: 0.8,
  },
  sally_pool: {
    basePrice: 5,
    pricePerKm: 2.5,
    pricePerMinute: 0.2,
    minimumFare: 10,
    multiplier: 0.6,
  },
};

const LIKELIHOOD_CONFIG = {
  very_high: { minRatio: 1.2, emoji: '🚀', color: '#22C55E', percentage: 95, minutes: 1 },
  high: { minRatio: 1.0, emoji: '⚡', color: '#3B82F6', percentage: 80, minutes: 3 },
  medium: { minRatio: 0.85, emoji: '⏳', color: '#F59E0B', percentage: 60, minutes: 5 },
  low: { minRatio: 0, emoji: '🐢', color: '#EF4444', percentage: 30, minutes: 10 },
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PricingState = {
  currentEstimate: null,
  proposedPrice: 0,
  selectedService: 'sally_standard',
  selectedPayment: 'cash',
  
  acceptanceLikelihood: null,
  
  surgeInfo: null,
  
  priceHistory: [],
  averageAcceptanceRate: 0.75,
  
  quickPrices: [],
  
  isCalculating: false,
  error: null,
};

// ============================================================================
// HELPERS
// ============================================================================

function calculateLikelihood(proposedPrice: number, suggestedPrice: number): AcceptanceLikelihood {
  const ratio = proposedPrice / suggestedPrice;
  
  let level: 'very_high' | 'high' | 'medium' | 'low';
  
  if (ratio >= LIKELIHOOD_CONFIG.very_high.minRatio) {
    level = 'very_high';
  } else if (ratio >= LIKELIHOOD_CONFIG.high.minRatio) {
    level = 'high';
  } else if (ratio >= LIKELIHOOD_CONFIG.medium.minRatio) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  const config = LIKELIHOOD_CONFIG[level];
  
  return {
    likelihood: level,
    estimatedMinutes: config.minutes,
    percentage: config.percentage,
    emoji: config.emoji,
    color: config.color,
  };
}

function generateQuickPrices(min: number, max: number, suggested: number): number[] {
  const prices: number[] = [];
  const step = 5;
  
  // Prix minimum
  prices.push(min);
  
  // Prix entre min et suggéré
  const midLow = Math.round((min + suggested) / 2 / step) * step;
  if (midLow > min && midLow < suggested) {
    prices.push(midLow);
  }
  
  // Prix suggéré
  prices.push(suggested);
  
  // Prix entre suggéré et max
  const midHigh = Math.round((suggested + max) / 2 / step) * step;
  if (midHigh > suggested && midHigh < max) {
    prices.push(midHigh);
  }
  
  // Prix maximum
  if (max > suggested) {
    prices.push(max);
  }
  
  return [...new Set(prices)].sort((a, b) => a - b);
}

function calculateSurge(): SurgeInfo {
  const hour = new Date().getHours();
  let multiplier = 1.0;
  let reason: SurgeInfo['reason'] = null;
  
  // Heures de pointe
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    multiplier = 1.2 + Math.random() * 0.3;
    reason = 'rush_hour';
  }
  // Tarif nuit
  else if (hour >= 22 || hour <= 5) {
    multiplier = 1.3;
    reason = 'night_rate';
  }
  // Haute demande (random pour simulation)
  else if (Math.random() < 0.1) {
    multiplier = 1.15;
    reason = 'high_demand';
  }
  
  return {
    isActive: multiplier > 1,
    multiplier: Math.round(multiplier * 100) / 100,
    reason,
  };
}

// ============================================================================
// THUNKS
// ============================================================================

export const calculatePrice = createAsyncThunk(
  'pricing/calculate',
  async (
    params: {
      distanceKm: number;
      durationMinutes: number;
      serviceType: ServiceType;
    },
    { rejectWithValue }
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const config = SERVICE_PRICING[params.serviceType];
      const surge = calculateSurge();
      
      // Calculs de base
      const basePrice = config.basePrice;
      const distancePrice = params.distanceKm * config.pricePerKm;
      const durationPrice = params.durationMinutes * config.pricePerMinute;
      const serviceMultiplier = config.multiplier;
      
      // Prix brut avec surge
      const rawPrice = (basePrice + distancePrice + durationPrice) * serviceMultiplier * surge.multiplier;
      
      // Arrondir au 5 MAD
      const suggestedPrice = Math.max(
        config.minimumFare,
        Math.round(rawPrice / 5) * 5
      );
      
      // Min/Max
      const minPrice = Math.max(
        config.minimumFare,
        Math.round(suggestedPrice * 0.75 / 5) * 5
      );
      const maxPrice = Math.round(suggestedPrice * 1.35 / 5) * 5;
      
      const breakdown: PriceBreakdown = {
        base: basePrice,
        distance: Math.round(distancePrice * 100) / 100,
        duration: Math.round(durationPrice * 100) / 100,
        service: Math.round((rawPrice / surge.multiplier - basePrice - distancePrice - durationPrice) * 100) / 100,
        surge: surge.isActive ? Math.round(rawPrice * (1 - 1 / surge.multiplier) * 100) / 100 : 0,
        total: suggestedPrice,
      };
      
      const estimate: PriceEstimate = {
        suggestedPrice,
        minPrice,
        maxPrice,
        breakdown,
        currency: 'MAD',
        serviceType: params.serviceType,
        surgeMultiplier: surge.multiplier,
        surgeReason: surge.reason,
      };
      
      const quickPrices = generateQuickPrices(minPrice, maxPrice, suggestedPrice);
      const likelihood = calculateLikelihood(suggestedPrice, suggestedPrice);
      
      return {
        estimate,
        surgeInfo: surge,
        quickPrices,
        likelihood,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    // Service & Payment
    setSelectedService: (state, action: PayloadAction<ServiceType>) => {
      state.selectedService = action.payload;
      state.currentEstimate = null;
      state.proposedPrice = 0;
      state.acceptanceLikelihood = null;
      state.quickPrices = [];
    },
    
    setSelectedPayment: (state, action: PayloadAction<PaymentMethod>) => {
      state.selectedPayment = action.payload;
    },
    
    // Price
    setProposedPrice: (state, action: PayloadAction<number>) => {
      state.proposedPrice = action.payload;
      
      // Recalculer likelihood
      if (state.currentEstimate) {
        state.acceptanceLikelihood = calculateLikelihood(
          action.payload,
          state.currentEstimate.suggestedPrice
        );
      }
    },
    
    selectQuickPrice: (state, action: PayloadAction<number>) => {
      state.proposedPrice = action.payload;
      
      if (state.currentEstimate) {
        state.acceptanceLikelihood = calculateLikelihood(
          action.payload,
          state.currentEstimate.suggestedPrice
        );
      }
    },
    
    // History
    addToPriceHistory: (state, action: PayloadAction<{
      price: number;
      serviceType: ServiceType;
      wasAccepted?: boolean;
    }>) => {
      const entry: PriceHistoryEntry = {
        id: `price_${Date.now()}`,
        price: action.payload.price,
        serviceType: action.payload.serviceType,
        wasAccepted: action.payload.wasAccepted ?? true,
        timestamp: new Date().toISOString(),
      };
      
      state.priceHistory.unshift(entry);
      
      // Garder seulement les 50 derniers
      if (state.priceHistory.length > 50) {
        state.priceHistory = state.priceHistory.slice(0, 50);
      }
      
      // Recalculer le taux d'acceptation
      const accepted = state.priceHistory.filter(p => p.wasAccepted).length;
      state.averageAcceptanceRate = accepted / state.priceHistory.length;
    },
    
    markPriceAccepted: (state, action: PayloadAction<string>) => {
      const entry = state.priceHistory.find(p => p.id === action.payload);
      if (entry) {
        entry.wasAccepted = true;
      }
    },
    
    markPriceRejected: (state, action: PayloadAction<string>) => {
      const entry = state.priceHistory.find(p => p.id === action.payload);
      if (entry) {
        entry.wasAccepted = false;
      }
    },
    
    // Error
    clearPricingError: (state) => {
      state.error = null;
    },
    
    // Reset
    resetPricing: (state) => {
      state.currentEstimate = null;
      state.proposedPrice = 0;
      state.acceptanceLikelihood = null;
      state.surgeInfo = null;
      state.quickPrices = [];
      state.isCalculating = false;
      state.error = null;
    },
    
    // Full reset (garde l'historique)
    resetForNewRide: (state) => {
      state.currentEstimate = null;
      state.proposedPrice = 0;
      state.selectedService = 'sally_standard';
      state.selectedPayment = 'cash';
      state.acceptanceLikelihood = null;
      state.surgeInfo = null;
      state.quickPrices = [];
      state.isCalculating = false;
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(calculatePrice.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(calculatePrice.fulfilled, (state, action) => {
        state.isCalculating = false;
        state.currentEstimate = action.payload.estimate;
        state.proposedPrice = action.payload.estimate.suggestedPrice;
        state.surgeInfo = action.payload.surgeInfo;
        state.quickPrices = action.payload.quickPrices;
        state.acceptanceLikelihood = action.payload.likelihood;
      })
      .addCase(calculatePrice.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setSelectedService,
  setSelectedPayment,
  setProposedPrice,
  selectQuickPrice,
  addToPriceHistory,
  markPriceAccepted,
  markPriceRejected,
  clearPricingError,
  resetPricing,
  resetForNewRide,
} = pricingSlice.actions;

export default pricingSlice.reducer;

// Types déjà exportés en haut du fichier:
// PricingState, PriceEstimate, PriceBreakdown, AcceptanceLikelihood,
// SurgeInfo, PriceHistoryEntry, ServiceType, PaymentMethod