/**
 * ============================================================================
 * GO WITH SALLY - RIDE SLICE (MIS À JOUR v3.0)
 * ============================================================================
 * @module store/slices/rideSlice
 * @version 3.0.0
 * 
 * AJOUTS:
 * - proposedPrice (prix proposé par passagère)
 * - serviceType (type de service sélectionné)
 * - paymentMethod (méthode de paiement)
 * - priceEstimate (estimation de prix complète)
 * - surgeInfo (info surge pricing)
 * ============================================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OFFLINE_MODE } from '../../services/api';

// ============================================================================
// TYPES - SERVICES & PRICING
// ============================================================================

export type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

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
  breakdown: {
    base: number;
    distance: number;
    duration: number;
    service: number;
    surge: number;
  };
}

export interface SurgeInfo {
  multiplier: number;
  reason: string | null;
  isActive: boolean;
}

export interface AcceptanceLikelihood {
  likelihood: 'very_high' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  percentage: number;
}

// ============================================================================
// TYPES - LOCATION
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  placeId?: string;
}

// ============================================================================
// TYPES - DRIVER
// ============================================================================

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  rating: number;
  totalRides: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  eta?: number;
  distance?: number;
  // 🆕 Nouveaux champs
  badge?: {
    level: 'none' | 'basic' | 'verified' | 'premium' | 'elite';
    icon: string;
  };
  servicesOffered?: ServiceType[];
  isSimulated?: boolean;
}

// ============================================================================
// TYPES - RIDE
// ============================================================================

export type RideStatus = 
  | 'idle'
  | 'selecting_service'    // 🆕 Sélection du service
  | 'proposing_price'      // 🆕 Proposition de prix
  | 'searching'
  | 'driver_found'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  pickup: Location;
  destination: Location;
  distance: number;
  duration: number;
  
  // 🆕 Nouveaux champs pricing
  serviceType: ServiceType;
  proposedPrice: number;
  finalPrice?: number;
  priceEstimate?: PriceEstimate;
  paymentMethod: PaymentMethod;
  
  status: RideStatus;
  driver?: Driver;
  
  // Timestamps
  requestedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // 🆕 Simulation
  isSimulated?: boolean;
  
  // Rating
  rating?: number;
  review?: string;
}

// ============================================================================
// STATE
// ============================================================================

interface RideState {
  currentRide: Ride | null;
  rideHistory: Ride[];
  
  // Locations
  pickup: Location | null;
  destination: Location | null;
  
  // Route info
  routeDistance: number | null;
  routeDuration: number | null;
  routePolyline: string | null;
  
  // 🆕 Service & Pricing
  selectedService: ServiceType;
  proposedPrice: number;
  priceEstimate: PriceEstimate | null;
  surgeInfo: SurgeInfo | null;
  acceptanceLikelihood: AcceptanceLikelihood | null;
  paymentMethod: PaymentMethod;
  
  // Driver search
  nearbyDrivers: Driver[];
  searchingForDriver: boolean;
  searchTimeout: number;
  
  // Status
  status: RideStatus;
  isLoading: boolean;
  error: string | null;
  
  // 🆕 Simulation mode
  isSimulatedRide: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: RideState = {
  currentRide: null,
  rideHistory: [],
  
  pickup: null,
  destination: null,
  
  routeDistance: null,
  routeDuration: null,
  routePolyline: null,
  
  // 🆕 Service & Pricing defaults
  selectedService: 'sally_standard',
  proposedPrice: 0,
  priceEstimate: null,
  surgeInfo: null,
  acceptanceLikelihood: null,
  paymentMethod: 'cash',
  
  nearbyDrivers: [],
  searchingForDriver: false,
  searchTimeout: 60,
  
  status: 'idle',
  isLoading: false,
  error: null,
  
  isSimulatedRide: false,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DRIVERS: Driver[] = [
  {
    id: 'driver_001',
    firstName: 'Amina',
    lastName: 'El Amrani',
    phone: '+212623456789',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    rating: 4.9,
    totalRides: 542,
    vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc', plateNumber: '12345-A-1' },
    badge: { level: 'premium', icon: '💜' },
    servicesOffered: ['sally_standard', 'sally_confort'],
  },
  {
    id: 'driver_002',
    firstName: 'Fatima',
    lastName: 'Benali',
    phone: '+212634567890',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    totalRides: 328,
    vehicle: { brand: 'Renault', model: 'Clio', color: 'Gris', plateNumber: '54321-B-2' },
    badge: { level: 'verified', icon: '✅' },
    servicesOffered: ['sally_standard', 'sally_eco'],
  },
  {
    id: 'driver_003',
    firstName: 'Khadija',
    lastName: 'Mansouri',
    phone: '+212645678901',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.95,
    totalRides: 1247,
    vehicle: { brand: 'Mercedes', model: 'Classe C', color: 'Noir', plateNumber: '98765-C-3' },
    badge: { level: 'elite', icon: '👑' },
    servicesOffered: ['sally_standard', 'sally_confort', 'sally_eco'],
  },
  {
    id: 'driver_004',
    firstName: 'Salma',
    lastName: 'Chakir',
    phone: '+212656789012',
    avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    rating: 4.7,
    totalRides: 156,
    vehicle: { brand: 'Peugeot', model: '208', color: 'Rouge', plateNumber: '11111-D-4' },
    badge: { level: 'basic', icon: '🔵' },
    servicesOffered: ['sally_eco', 'sally_standard'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// 🆕 Calculer la probabilité d'acceptation basée sur le prix proposé
function calculateAcceptanceLikelihood(proposedPrice: number, suggestedPrice: number): AcceptanceLikelihood {
  const ratio = proposedPrice / suggestedPrice;
  
  if (ratio >= 1.2) {
    return { likelihood: 'very_high', estimatedMinutes: 1, percentage: 95 };
  }
  if (ratio >= 1.0) {
    return { likelihood: 'high', estimatedMinutes: 3, percentage: 80 };
  }
  if (ratio >= 0.85) {
    return { likelihood: 'medium', estimatedMinutes: 5, percentage: 60 };
  }
  return { likelihood: 'low', estimatedMinutes: 10, percentage: 30 };
}

// ============================================================================
// THUNKS
// ============================================================================

// 🆕 Calculate Price Estimate
export const calculatePriceEstimate = createAsyncThunk(
  'ride/calculatePriceEstimate',
  async (
    params: {
      distanceKm: number;
      durationMinutes: number;
      serviceType: ServiceType;
      pickupLocation: Location;
    },
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Configuration de pricing par service
        const serviceConfig: Record<ServiceType, { base: number; perKm: number; perMin: number; multiplier: number }> = {
          sally_confort: { base: 15, perKm: 5.5, perMin: 0.8, multiplier: 1.4 },
          sally_standard: { base: 10, perKm: 4.0, perMin: 0.5, multiplier: 1.0 },
          sally_eco: { base: 7, perKm: 3.0, perMin: 0.3, multiplier: 0.8 },
          sally_pool: { base: 5, perKm: 2.5, perMin: 0.2, multiplier: 0.6 },
        };
        
        const config = serviceConfig[params.serviceType];
        
        // Calculer surge (heure de pointe simulée)
        const hour = new Date().getHours();
        let surgeMultiplier = 1.0;
        let surgeReason: string | null = null;
        
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          surgeMultiplier = 1.2 + Math.random() * 0.3;
          surgeReason = 'rush_hour';
        } else if (hour >= 22 || hour <= 5) {
          surgeMultiplier = 1.3;
          surgeReason = 'night_rate';
        }
        
        // Calculs
        const basePrice = config.base;
        const distancePrice = params.distanceKm * config.perKm;
        const durationPrice = params.durationMinutes * config.perMin;
        const serviceMultiplier = config.multiplier;
        
        const rawPrice = (basePrice + distancePrice + durationPrice) * serviceMultiplier * surgeMultiplier;
        const suggestedPrice = Math.round(rawPrice / 5) * 5; // Arrondir à 5 MAD
        
        const minPrice = Math.max(Math.round(suggestedPrice * 0.75 / 5) * 5, 15);
        const maxPrice = Math.round(suggestedPrice * 1.35 / 5) * 5;
        
        const estimate: PriceEstimate = {
          suggestedPrice,
          minPrice,
          maxPrice,
          basePrice,
          distancePrice: Math.round(distancePrice * 100) / 100,
          durationPrice: Math.round(durationPrice * 100) / 100,
          serviceMultiplier,
          surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
          currency: 'MAD',
          breakdown: {
            base: basePrice,
            distance: Math.round(distancePrice * 100) / 100,
            duration: Math.round(durationPrice * 100) / 100,
            service: Math.round((rawPrice / surgeMultiplier - basePrice - distancePrice - durationPrice) * 100) / 100,
            surge: surgeMultiplier > 1 ? Math.round(rawPrice * (1 - 1 / surgeMultiplier) * 100) / 100 : 0,
          },
        };
        
        const surgeInfo: SurgeInfo = {
          multiplier: Math.round(surgeMultiplier * 100) / 100,
          reason: surgeReason,
          isActive: surgeMultiplier > 1,
        };
        
        return { estimate, surgeInfo };
      }
      
      // En production: appeler l'API
      return { estimate: null, surgeInfo: null };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Request Ride (mis à jour)
export const requestRide = createAsyncThunk(
  'ride/requestRide',
  async (
    params: {
      pickup: Location;
      destination: Location;
      distance: number;
      duration: number;
      serviceType: ServiceType;
      proposedPrice: number;
      paymentMethod: PaymentMethod;
      priceEstimate?: PriceEstimate;
    },
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const ride: Ride = {
          id: `ride_${Date.now()}`,
          passengerId: 'current_user',
          pickup: params.pickup,
          destination: params.destination,
          distance: params.distance,
          duration: params.duration,
          serviceType: params.serviceType,
          proposedPrice: params.proposedPrice,
          priceEstimate: params.priceEstimate,
          paymentMethod: params.paymentMethod,
          status: 'searching',
          requestedAt: new Date().toISOString(),
          isSimulated: true,
        };
        
        return ride;
      }
      
      // En production: appeler l'API
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Search for Driver (mis à jour)
export const searchForDriver = createAsyncThunk(
  'ride/searchForDriver',
  async (
    params: { 
      rideId: string;
      serviceType: ServiceType;
      proposedPrice: number;
      suggestedPrice: number;
    }, 
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        // Délai basé sur le prix proposé vs suggéré
        const likelihood = calculateAcceptanceLikelihood(params.proposedPrice, params.suggestedPrice);
        const delay = likelihood.estimatedMinutes * 1000; // Simuler en secondes au lieu de minutes
        
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5000)));
        
        // Trouver un driver compatible avec le service
        const compatibleDrivers = MOCK_DRIVERS.filter(
          d => d.servicesOffered?.includes(params.serviceType)
        );
        
        if (compatibleDrivers.length === 0) {
          return rejectWithValue('Aucune conductrice disponible pour ce service');
        }
        
        const driver = compatibleDrivers[Math.floor(Math.random() * compatibleDrivers.length)];
        
        return {
          ...driver,
          location: {
            latitude: 33.5731 + (Math.random() - 0.5) * 0.02,
            longitude: -7.5898 + (Math.random() - 0.5) * 0.02,
            heading: Math.random() * 360,
          },
          eta: Math.floor(Math.random() * 10) + 3,
          distance: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
          isSimulated: true,
        };
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Get Nearby Drivers
export const getNearbyDrivers = createAsyncThunk(
  'ride/getNearbyDrivers',
  async (
    params: { 
      latitude: number; 
      longitude: number;
      serviceType?: ServiceType;
    }, 
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        let drivers = MOCK_DRIVERS.map((driver) => ({
          ...driver,
          location: {
            latitude: params.latitude + (Math.random() - 0.5) * 0.02,
            longitude: params.longitude + (Math.random() - 0.5) * 0.02,
            heading: Math.random() * 360,
          },
          eta: Math.floor(Math.random() * 10) + 3,
          distance: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
        }));
        
        // Filtrer par service si spécifié
        if (params.serviceType) {
          drivers = drivers.filter(d => d.servicesOffered?.includes(params.serviceType!));
        }
        
        return drivers;
      }
      
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Complete Ride
export const completeRide = createAsyncThunk(
  'ride/completeRide',
  async (
    params: { 
      rideId: string; 
      rating?: number; 
      review?: string;
      tip?: number;
    }, 
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          rideId: params.rideId,
          rating: params.rating,
          review: params.review,
          tip: params.tip,
          completedAt: new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Cancel Ride
export const cancelRide = createAsyncThunk(
  'ride/cancelRide',
  async (
    params: { rideId: string; reason?: string }, 
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          rideId: params.rideId,
          reason: params.reason,
          cancelledAt: new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    // Locations
    setPickup: (state, action: PayloadAction<Location | null>) => {
      state.pickup = action.payload;
    },
    
    setDestination: (state, action: PayloadAction<Location | null>) => {
      state.destination = action.payload;
    },
    
    swapLocations: (state) => {
      const temp = state.pickup;
      state.pickup = state.destination;
      state.destination = temp;
    },
    
    // Route
    setRouteInfo: (state, action: PayloadAction<{ distance: number; duration: number; polyline?: string }>) => {
      state.routeDistance = action.payload.distance;
      state.routeDuration = action.payload.duration;
      state.routePolyline = action.payload.polyline || null;
    },
    
    // 🆕 Service & Pricing
    setSelectedService: (state, action: PayloadAction<ServiceType>) => {
      state.selectedService = action.payload;
      // Reset price when service changes
      state.proposedPrice = 0;
      state.priceEstimate = null;
      state.acceptanceLikelihood = null;
    },
    
    setProposedPrice: (state, action: PayloadAction<number>) => {
      state.proposedPrice = action.payload;
      // Recalculer la probabilité d'acceptation
      if (state.priceEstimate) {
        state.acceptanceLikelihood = calculateAcceptanceLikelihood(
          action.payload, 
          state.priceEstimate.suggestedPrice
        );
      }
    },
    
    setPriceEstimate: (state, action: PayloadAction<PriceEstimate | null>) => {
      state.priceEstimate = action.payload;
      if (action.payload) {
        state.proposedPrice = action.payload.suggestedPrice;
        state.acceptanceLikelihood = calculateAcceptanceLikelihood(
          action.payload.suggestedPrice,
          action.payload.suggestedPrice
        );
      }
    },
    
    setSurgeInfo: (state, action: PayloadAction<SurgeInfo | null>) => {
      state.surgeInfo = action.payload;
    },
    
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    
    // Status
    setStatus: (state, action: PayloadAction<RideStatus>) => {
      state.status = action.payload;
    },
    
    // Driver
    updateDriverLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; heading?: number }>) => {
      if (state.currentRide?.driver) {
        state.currentRide.driver.location = action.payload;
      }
    },
    
    // 🆕 Simulation
    setSimulatedRide: (state, action: PayloadAction<boolean>) => {
      state.isSimulatedRide = action.payload;
    },
    
    // Error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset
    resetRide: (state) => {
      state.currentRide = null;
      state.pickup = null;
      state.destination = null;
      state.routeDistance = null;
      state.routeDuration = null;
      state.routePolyline = null;
      state.selectedService = 'sally_standard';
      state.proposedPrice = 0;
      state.priceEstimate = null;
      state.surgeInfo = null;
      state.acceptanceLikelihood = null;
      state.paymentMethod = 'cash';
      state.nearbyDrivers = [];
      state.searchingForDriver = false;
      state.status = 'idle';
      state.isLoading = false;
      state.error = null;
      state.isSimulatedRide = false;
    },
    
    // Reset for new ride (keep locations)
    resetForNewRide: (state) => {
      state.currentRide = null;
      state.selectedService = 'sally_standard';
      state.proposedPrice = 0;
      state.priceEstimate = null;
      state.surgeInfo = null;
      state.acceptanceLikelihood = null;
      state.paymentMethod = 'cash';
      state.nearbyDrivers = [];
      state.searchingForDriver = false;
      state.status = 'idle';
      state.isLoading = false;
      state.error = null;
      state.isSimulatedRide = false;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // 🆕 CALCULATE PRICE ESTIMATE
      .addCase(calculatePriceEstimate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calculatePriceEstimate.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.estimate) {
          state.priceEstimate = action.payload.estimate;
          state.proposedPrice = action.payload.estimate.suggestedPrice;
          state.acceptanceLikelihood = calculateAcceptanceLikelihood(
            action.payload.estimate.suggestedPrice,
            action.payload.estimate.suggestedPrice
          );
        }
        if (action.payload.surgeInfo) {
          state.surgeInfo = action.payload.surgeInfo;
        }
      })
      .addCase(calculatePriceEstimate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // REQUEST RIDE
      .addCase(requestRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'searching';
      })
      .addCase(requestRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentRide = action.payload;
          state.status = 'searching';
          state.searchingForDriver = true;
          state.isSimulatedRide = action.payload.isSimulated || false;
        }
      })
      .addCase(requestRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.status = 'idle';
      })

      // SEARCH FOR DRIVER
      .addCase(searchForDriver.pending, (state) => {
        state.searchingForDriver = true;
        state.error = null;
      })
      .addCase(searchForDriver.fulfilled, (state, action) => {
        state.searchingForDriver = false;
        if (action.payload && state.currentRide) {
          state.currentRide.driver = action.payload;
          state.currentRide.driverId = action.payload.id;
          state.currentRide.status = 'driver_found';
          state.currentRide.acceptedAt = new Date().toISOString();
          state.status = 'driver_found';
        }
      })
      .addCase(searchForDriver.rejected, (state, action) => {
        state.searchingForDriver = false;
        state.error = action.payload as string;
      })

      // GET NEARBY DRIVERS
      .addCase(getNearbyDrivers.fulfilled, (state, action) => {
        if (action.payload) {
          state.nearbyDrivers = action.payload;
        }
      })

      // COMPLETE RIDE
      .addCase(completeRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload && state.currentRide) {
          state.currentRide.status = 'completed';
          state.currentRide.completedAt = action.payload.completedAt;
          state.currentRide.rating = action.payload.rating;
          state.currentRide.review = action.payload.review;
          state.currentRide.finalPrice = state.currentRide.proposedPrice + (action.payload.tip || 0);
          state.status = 'completed';
          
          // Ajouter à l'historique
          state.rideHistory.unshift(state.currentRide);
        }
      })
      .addCase(completeRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // CANCEL RIDE
      .addCase(cancelRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload && state.currentRide) {
          state.currentRide.status = 'cancelled';
          state.currentRide.cancelledAt = action.payload.cancelledAt;
          state.status = 'cancelled';
        }
      })
      .addCase(cancelRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setPickup,
  setDestination,
  swapLocations,
  setRouteInfo,
  setSelectedService,
  setProposedPrice,
  setPriceEstimate,
  setSurgeInfo,
  setPaymentMethod,
  setStatus,
  updateDriverLocation,
  setSimulatedRide,
  clearError,
  resetRide,
  resetForNewRide,
} = rideSlice.actions;

export default rideSlice.reducer;