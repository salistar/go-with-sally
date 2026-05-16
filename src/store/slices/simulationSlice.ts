/**
 * ============================================================================
 * GO WITH SALLY - SIMULATION SLICE
 * ============================================================================
 * @module store/slices/simulationSlice
 * @version 1.0.0
 * 
 * Gère le mode simulation pour tests sans backend:
 * - OFFLINE: 100% simulé localement
 * - HYBRID: Backend + simulation pour conductrices manquantes
 * - ONLINE: Backend uniquement
 * ============================================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// TYPES
// ============================================================================

export type SimulationMode = 'offline' | 'hybrid' | 'online';

export interface SimulatedDriver {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  rating: number;
  totalRides: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  badge: {
    level: 'none' | 'basic' | 'verified' | 'premium' | 'elite';
    icon: string;
  };
  servicesOffered: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  isSimulated: true;
}

export interface SimulatedMessage {
  id: string;
  type: 'driver_accepted' | 'driver_arriving' | 'driver_arrived' | 'ride_started' | 'ride_completed';
  delay: number; // ms
  message: {
    fr: string;
    ar: string;
    en: string;
  };
}

export interface SimulationState {
  mode: SimulationMode;
  isEnabled: boolean;
  
  // Simulated drivers pool
  simulatedDrivers: SimulatedDriver[];
  
  // Current simulation
  activeSimulationId: string | null;
  currentSimulatedDriver: SimulatedDriver | null;
  
  // Timings
  acceptDelayMin: number;
  acceptDelayMax: number;
  arrivalTimeMin: number;
  arrivalTimeMax: number;
  
  // Chat simulation
  autoMessages: SimulatedMessage[];
  
  // GPS simulation
  isSimulatingGPS: boolean;
  gpsUpdateInterval: number;
  
  // Stats
  totalSimulatedRides: number;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// SIMULATED DRIVERS POOL
// ============================================================================

const SIMULATED_DRIVERS: SimulatedDriver[] = [
  {
    id: 'sim_driver_001',
    firstName: 'Amina',
    lastName: 'El Amrani',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    phone: '+212600000001',
    rating: 4.9,
    totalRides: 542,
    vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc', plateNumber: '12345-A-1' },
    badge: { level: 'premium', icon: '💜' },
    servicesOffered: ['sally_standard', 'sally_confort'],
    location: { latitude: 33.5731, longitude: -7.5898 },
    isSimulated: true,
  },
  {
    id: 'sim_driver_002',
    firstName: 'Fatima',
    lastName: 'Benali',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    phone: '+212600000002',
    rating: 4.8,
    totalRides: 328,
    vehicle: { brand: 'Renault', model: 'Clio', color: 'Gris', plateNumber: '54321-B-2' },
    badge: { level: 'verified', icon: '✅' },
    servicesOffered: ['sally_standard', 'sally_eco'],
    location: { latitude: 33.5831, longitude: -7.6098 },
    isSimulated: true,
  },
  {
    id: 'sim_driver_003',
    firstName: 'Khadija',
    lastName: 'Mansouri',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    phone: '+212600000003',
    rating: 4.95,
    totalRides: 1247,
    vehicle: { brand: 'Mercedes', model: 'Classe C', color: 'Noir', plateNumber: '98765-C-3' },
    badge: { level: 'elite', icon: '👑' },
    servicesOffered: ['sally_standard', 'sally_confort', 'sally_eco'],
    location: { latitude: 33.5631, longitude: -7.5798 },
    isSimulated: true,
  },
  {
    id: 'sim_driver_004',
    firstName: 'Salma',
    lastName: 'Chakir',
    avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    phone: '+212600000004',
    rating: 4.7,
    totalRides: 156,
    vehicle: { brand: 'Peugeot', model: '208', color: 'Rouge', plateNumber: '11111-D-4' },
    badge: { level: 'basic', icon: '🔵' },
    servicesOffered: ['sally_eco', 'sally_standard'],
    location: { latitude: 33.5531, longitude: -7.5698 },
    isSimulated: true,
  },
  {
    id: 'sim_driver_005',
    firstName: 'Nadia',
    lastName: 'Tahiri',
    avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
    phone: '+212600000005',
    rating: 4.85,
    totalRides: 412,
    vehicle: { brand: 'Toyota', model: 'Yaris', color: 'Bleu', plateNumber: '22222-E-5' },
    badge: { level: 'verified', icon: '✅' },
    servicesOffered: ['sally_standard', 'sally_pool'],
    location: { latitude: 33.5931, longitude: -7.6198 },
    isSimulated: true,
  },
];

// ============================================================================
// SIMULATED MESSAGES
// ============================================================================

const SIMULATED_MESSAGES: SimulatedMessage[] = [
  {
    id: 'msg_accepted',
    type: 'driver_accepted',
    delay: 0,
    message: {
      fr: 'Votre conductrice arrive !',
      ar: 'سائقتك في الطريق!',
      en: 'Your driver is on the way!',
    },
  },
  {
    id: 'msg_arriving',
    type: 'driver_arriving',
    delay: 30000,
    message: {
      fr: 'Je suis à 2 minutes',
      ar: 'أنا على بعد دقيقتين',
      en: "I'm 2 minutes away",
    },
  },
  {
    id: 'msg_arrived',
    type: 'driver_arrived',
    delay: 60000,
    message: {
      fr: 'Je suis arrivée ! Je suis devant l\'entrée',
      ar: 'وصلت! أنا أمام المدخل',
      en: "I've arrived! I'm at the entrance",
    },
  },
  {
    id: 'msg_started',
    type: 'ride_started',
    delay: 0,
    message: {
      fr: 'C\'est parti ! Bonne route 🚗',
      ar: 'انطلقنا! رحلة سعيدة 🚗',
      en: "Let's go! Have a nice trip 🚗",
    },
  },
  {
    id: 'msg_completed',
    type: 'ride_completed',
    delay: 0,
    message: {
      fr: 'Merci d\'avoir voyagé avec Sally ! ⭐',
      ar: 'شكرا للسفر مع سالي! ⭐',
      en: 'Thanks for riding with Sally! ⭐',
    },
  },
];

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SimulationState = {
  mode: 'offline',
  isEnabled: true,
  
  simulatedDrivers: SIMULATED_DRIVERS,
  
  activeSimulationId: null,
  currentSimulatedDriver: null,
  
  acceptDelayMin: 3000,
  acceptDelayMax: 8000,
  arrivalTimeMin: 3,
  arrivalTimeMax: 12,
  
  autoMessages: SIMULATED_MESSAGES,
  
  isSimulatingGPS: false,
  gpsUpdateInterval: 3000,
  
  totalSimulatedRides: 0,
  
  isLoading: false,
  error: null,
};

// ============================================================================
// THUNKS
// ============================================================================

// Simulate driver acceptance
export const simulateDriverAcceptance = createAsyncThunk(
  'simulation/acceptRide',
  async (
    params: { 
      serviceType: string;
      pickupLocation: { latitude: number; longitude: number };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { simulation: SimulationState };
      const { simulatedDrivers, acceptDelayMin, acceptDelayMax, arrivalTimeMin, arrivalTimeMax } = state.simulation;
      
      // Filtrer les conductrices compatibles avec le service
      const compatibleDrivers = simulatedDrivers.filter(
        d => d.servicesOffered.includes(params.serviceType)
      );
      
      if (compatibleDrivers.length === 0) {
        return rejectWithValue('Aucune conductrice simulée disponible pour ce service');
      }
      
      // Délai aléatoire avant acceptation
      const delay = Math.random() * (acceptDelayMax - acceptDelayMin) + acceptDelayMin;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Sélectionner une conductrice au hasard
      const driver = compatibleDrivers[Math.floor(Math.random() * compatibleDrivers.length)];
      
      // Calculer ETA et distance
      const distance = calculateDistance(
        params.pickupLocation.latitude,
        params.pickupLocation.longitude,
        driver.location.latitude,
        driver.location.longitude
      );
      
      const eta = Math.max(
        arrivalTimeMin,
        Math.min(arrivalTimeMax, Math.round(distance * 3))
      );
      
      return {
        driver: {
          ...driver,
          location: {
            ...driver.location,
            // Légère variation pour réalisme
            latitude: driver.location.latitude + (Math.random() - 0.5) * 0.01,
            longitude: driver.location.longitude + (Math.random() - 0.5) * 0.01,
          },
        },
        eta,
        distance: Math.round(distance * 10) / 10,
        acceptedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Simulate GPS updates
export const startGPSSimulation = createAsyncThunk(
  'simulation/startGPS',
  async (
    params: {
      from: { latitude: number; longitude: number };
      to: { latitude: number; longitude: number };
      durationMs: number;
    },
    { dispatch }
  ) => {
    const steps = 20;
    const interval = params.durationMs / steps;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = params.from.latitude + (params.to.latitude - params.from.latitude) * progress;
      const lng = params.from.longitude + (params.to.longitude - params.from.longitude) * progress;
      
      dispatch(updateSimulatedLocation({
        latitude: lat + (Math.random() - 0.5) * 0.0005,
        longitude: lng + (Math.random() - 0.5) * 0.0005,
        heading: Math.random() * 360,
        speed: 30 + Math.random() * 20,
      }));
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return { completed: true };
  }
);

// ============================================================================
// HELPERS
// ============================================================================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// SLICE
// ============================================================================

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    // Mode
    setSimulationMode: (state, action: PayloadAction<SimulationMode>) => {
      state.mode = action.payload;
      state.isEnabled = action.payload !== 'online';
    },
    
    toggleSimulation: (state) => {
      state.isEnabled = !state.isEnabled;
    },
    
    // Active simulation
    startSimulation: (state, action: PayloadAction<string>) => {
      state.activeSimulationId = action.payload;
      state.isLoading = true;
    },
    
    endSimulation: (state) => {
      state.activeSimulationId = null;
      state.currentSimulatedDriver = null;
      state.isSimulatingGPS = false;
      state.totalSimulatedRides += 1;
    },
    
    setCurrentSimulatedDriver: (state, action: PayloadAction<SimulatedDriver | null>) => {
      state.currentSimulatedDriver = action.payload;
    },
    
    // GPS
    startGPSTracking: (state) => {
      state.isSimulatingGPS = true;
    },
    
    stopGPSTracking: (state) => {
      state.isSimulatingGPS = false;
    },
    
    updateSimulatedLocation: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    }>) => {
      if (state.currentSimulatedDriver) {
        state.currentSimulatedDriver.location = {
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
        };
      }
    },
    
    // Timings
    setAcceptDelay: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.acceptDelayMin = action.payload.min;
      state.acceptDelayMax = action.payload.max;
    },
    
    setArrivalTime: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.arrivalTimeMin = action.payload.min;
      state.arrivalTimeMax = action.payload.max;
    },
    
    // Error
    clearSimulationError: (state) => {
      state.error = null;
    },
    
    // Reset
    resetSimulation: (state) => {
      state.activeSimulationId = null;
      state.currentSimulatedDriver = null;
      state.isSimulatingGPS = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // SIMULATE DRIVER ACCEPTANCE
      .addCase(simulateDriverAcceptance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(simulateDriverAcceptance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSimulatedDriver = action.payload.driver;
      })
      .addCase(simulateDriverAcceptance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // START GPS SIMULATION
      .addCase(startGPSSimulation.pending, (state) => {
        state.isSimulatingGPS = true;
      })
      .addCase(startGPSSimulation.fulfilled, (state) => {
        state.isSimulatingGPS = false;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setSimulationMode,
  toggleSimulation,
  startSimulation,
  endSimulation,
  setCurrentSimulatedDriver,
  startGPSTracking,
  stopGPSTracking,
  updateSimulatedLocation,
  setAcceptDelay,
  setArrivalTime,
  clearSimulationError,
  resetSimulation,
} = simulationSlice.actions;

export default simulationSlice.reducer;

// Types déjà exportés en haut du fichier:
// SimulationMode, SimulatedDriver, SimulatedMessage, SimulationState