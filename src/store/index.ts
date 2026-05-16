/**
 * ============================================================================
 * GO WITH SALLY - REDUX STORE (MIS À JOUR v3.0)
 * ============================================================================
 * @module store/index
 * @version 3.0.0
 * 
 * AJOUTS:
 * - simulationSlice (gestion mode simulation)
 * - pricingSlice (gestion pricing flexible)
 * ============================================================================
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Slices
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import settingsReducer from './slices/settingsSlice';
import documentsReducer from './slices/documentsSlice';
import verificationReducer from './slices/verificationSlice';

// 🆕 Nouveaux slices
import simulationReducer from './slices/simulationSlice';
import pricingReducer from './slices/pricingSlice';

// ============================================================================
// PERSIST CONFIG
// ============================================================================

const persistConfig = {
  key: 'root',
  version: 3, // 🆕 Incrementé pour migration
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'pricing'], // 🆕 Ajout pricing
  blacklist: ['ride', 'documents', 'verification', 'simulation'], // 🆕 simulation non persisté
};

// ============================================================================
// ROOT REDUCER
// ============================================================================

const rootReducer = combineReducers({
  auth: authReducer,
  ride: rideReducer,
  settings: settingsReducer,
  documents: documentsReducer,
  verification: verificationReducer,
  
  // 🆕 Nouveaux reducers
  simulation: simulationReducer,
  pricing: pricingReducer,
});

// ============================================================================
// PERSISTED REDUCER
// ============================================================================

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ============================================================================
// STORE
// ============================================================================

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

// ============================================================================
// PERSISTOR
// ============================================================================

export const persistor = persistStore(store);

// ============================================================================
// TYPES
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================================================
// TYPED HOOKS (à utiliser dans les composants)
// ============================================================================

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============================================================================
// EXPORTS
// ============================================================================

export default store;

// Re-export des types et actions utiles
export type { 
  User, 
  VerificationStep, 
  BadgeLevel, 
  DriverBadge,
  ServiceType as AuthServiceType,
  PaymentMethod as AuthPaymentMethod,
} from './slices/authSlice';

export type {
  Ride,
  RideStatus,
  Location,
  Driver,
  PriceEstimate,
  SurgeInfo,
  AcceptanceLikelihood,
  ServiceType,
  PaymentMethod,
} from './slices/rideSlice';

// 🆕 Export des types des nouveaux slices
export type {
  SimulationMode,
  SimulationState,
  SimulatedDriver,
} from './slices/simulationSlice';

export type {
  PricingState,
} from './slices/pricingSlice';