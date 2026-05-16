/**
 * ============================================================================
 * GO WITH SALLY - AUTH SLICE (v3.2.0 - FIXED)
 * ============================================================================
 * @module store/slices/authSlice
 * @version 3.2.0
 * 
 * FIXED v3.2:
 * - Added setLoading action to manually control loading state
 * - Prevents infinite loading loop on LoginScreen
 * 
 * FIXED v3.1:
 * - Added genderVerified and faceEnrolled as direct AuthState properties
 * - Export AuthState interface for type safety
 * - Added selectors for all state properties
 * 
 * FEATURES:
 * - genderVerified (vérification genre femme)
 * - faceEnrolled (enregistrement facial)
 * - badge (système de badges conductrices)
 * - servicesOffered (services proposés par conductrice)
 * - paymentMethodsAccepted (paiements acceptés)
 * - lastFaceVerification (face lock quotidien)
 * ============================================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, OFFLINE_MODE } from '../../services/api';

// ============================================================================
// TYPES - BADGE SYSTEM
// ============================================================================

export type BadgeLevel = 'none' | 'basic' | 'verified' | 'premium' | 'elite';

export interface DriverBadge {
  level: BadgeLevel;
  earnedAt?: Date | string;
  documentsVerified: number;
  benefits: string[];
  earningsBonus: number;
}

// ============================================================================
// TYPES - SERVICES & PAYMENTS
// ============================================================================

export type ServiceType = 'sally_confort' | 'sally_standard' | 'sally_eco' | 'sally_pool';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

// ============================================================================
// TYPES - USER
// ============================================================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'driver' | 'admin';
  
  // Vérifications de base
  isVerified: boolean;
  emailVerified?: boolean;
  phoneVerified: boolean;
  faceVerified: boolean;
  
  // Nouvelles vérifications Sally
  genderVerified: boolean;
  faceEnrolled: boolean;
  gender?: 'female' | 'male';
  
  // Système de badges (conductrices)
  badge?: DriverBadge;
  
  // Services et paiements (conductrices)
  servicesOffered?: ServiceType[];
  paymentMethodsAccepted?: PaymentMethod[];
  
  // Préférences
  preferredLanguage?: string;
  
  // Gamification
  points?: number;
  level?: string;
  totalRides?: number;
  
  // Stats
  stats?: {
    totalRides: number;
    averageRating: number;
  };
  
  // Driver specific
  vehicle?: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  isOnline?: boolean;
  rating?: number;
  
  // Documents
  documents?: {
    type: string;
    status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    url?: string;
  }[];
}

// ============================================================================
// TYPES - PAYLOAD & STATE
// ============================================================================

interface SetUserPayload {
  user: User;
  token: string;
  refreshToken: string;
}

// Ajout de 'gender' dans les étapes de vérification
export type VerificationStep = 'phone' | 'email' | 'gender' | 'face' | 'documents' | 'complete';

// 🆕 FIXED: Export AuthState with genderVerified and faceEnrolled as direct properties
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  verificationStep: VerificationStep;
  error: string | null;
  pendingPhone?: string;
  pendingEmail?: string;
  
  // 🆕 FIXED: Direct state properties (mirrored from user for easy access)
  genderVerified: boolean;
  faceEnrolled: boolean;
  
  // Face lock quotidien
  lastFaceVerification: string | null;
  requiresDailyFaceCheck: boolean;
}

// ============================================================================
// MOCK ACCOUNTS
// ============================================================================

interface MockAccount {
  email: string;
  password: string;
  user: User;
}

const MOCK_ACCOUNTS: MockAccount[] = [
  // ✅ Utilisatrice complètement vérifiée
  {
    email: 'user@test.com',
    password: 'test123',
    user: {
      id: 'user_001',
      firstName: 'Fatima',
      lastName: 'Benali',
      email: 'user@test.com',
      phone: '+212612345678',
      role: 'user',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      points: 450,
      level: 'Silver',
      totalRides: 23,
      preferredLanguage: 'fr',
      stats: { totalRides: 23, averageRating: 4.8 },
    },
  },
  
  // ✅ Conductrice Premium vérifiée
  {
    email: 'driver@test.com',
    password: 'test123',
    user: {
      id: 'driver_001',
      firstName: 'Amina',
      lastName: 'El Amrani',
      email: 'driver@test.com',
      phone: '+212623456789',
      role: 'driver',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      badge: {
        level: 'premium',
        earnedAt: '2024-06-15',
        documentsVerified: 7,
        benefits: ['sally_confort_access', 'higher_earnings', 'badge_visible', 'priority_rides'],
        earningsBonus: 0.10,
      },
      servicesOffered: ['sally_standard', 'sally_confort'],
      paymentMethodsAccepted: ['cash', 'card'],
      points: 1200,
      level: 'Gold',
      totalRides: 542,
      preferredLanguage: 'fr',
      vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc', plateNumber: '12345-A-1' },
      isOnline: true,
      rating: 4.9,
      stats: { totalRides: 542, averageRating: 4.9 },
      documents: [
        { type: 'nationalId', status: 'verified' },
        { type: 'nationalIdBack', status: 'verified' },
        { type: 'drivingLicense', status: 'verified' },
        { type: 'drivingLicenseBack', status: 'verified' },
        { type: 'vehicleRegistration', status: 'verified' },
        { type: 'insurance', status: 'verified' },
        { type: 'profilePhoto', status: 'verified' },
      ],
    },
  },
  
  // ✅ Conductrice Elite
  {
    email: 'elite@test.com',
    password: 'test123',
    user: {
      id: 'driver_002',
      firstName: 'Khadija',
      lastName: 'Mansouri',
      email: 'elite@test.com',
      phone: '+212634567890',
      role: 'driver',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      badge: {
        level: 'elite',
        earnedAt: '2024-01-10',
        documentsVerified: 9,
        benefits: ['all_premium', 'dedicated_support', 'priority_matching', 'sally_confort_access', 'highest_earnings'],
        earningsBonus: 0.15,
      },
      servicesOffered: ['sally_standard', 'sally_confort', 'sally_eco'],
      paymentMethodsAccepted: ['cash', 'card', 'wallet'],
      points: 3500,
      level: 'Diamond',
      totalRides: 1247,
      preferredLanguage: 'fr',
      vehicle: { brand: 'Mercedes', model: 'Classe C', color: 'Noir', plateNumber: '98765-C-3' },
      isOnline: true,
      rating: 4.95,
      stats: { totalRides: 1247, averageRating: 4.95 },
      documents: [
        { type: 'nationalId', status: 'verified' },
        { type: 'nationalIdBack', status: 'verified' },
        { type: 'drivingLicense', status: 'verified' },
        { type: 'drivingLicenseBack', status: 'verified' },
        { type: 'vehicleRegistration', status: 'verified' },
        { type: 'insurance', status: 'verified' },
        { type: 'vehiclePhotoFront', status: 'verified' },
        { type: 'vehiclePhotoBack', status: 'verified' },
        { type: 'criminalRecord', status: 'verified' },
      ],
    },
  },
  
  // ✅ Conductrice Basic (documents partiels)
  {
    email: 'basic@test.com',
    password: 'test123',
    user: {
      id: 'driver_basic_001',
      firstName: 'Salma',
      lastName: 'Chakir',
      email: 'basic@test.com',
      phone: '+212600777888',
      role: 'driver',
      avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      badge: {
        level: 'basic',
        earnedAt: '2024-11-01',
        documentsVerified: 2,
        benefits: ['can_accept_rides'],
        earningsBonus: 0,
      },
      servicesOffered: ['sally_eco', 'sally_standard'],
      paymentMethodsAccepted: ['cash'],
      points: 150,
      level: 'Bronze',
      totalRides: 45,
      preferredLanguage: 'fr',
      vehicle: { brand: 'Peugeot', model: '208', color: 'Rouge', plateNumber: '11111-D-4' },
      isOnline: false,
      rating: 4.7,
      stats: { totalRides: 45, averageRating: 4.7 },
      documents: [
        { type: 'nationalId', status: 'verified' },
        { type: 'drivingLicense', status: 'verified' },
      ],
    },
  },
  
  // ✅ Admin (test)
  {
    email: 'admin@test.com',
    password: 'test123',
    user: {
      id: 'admin_001',
      firstName: 'Admin',
      lastName: 'Sally',
      email: 'admin@test.com',
      phone: '+212600000000',
      role: 'admin',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      points: 0,
      level: 'Diamond',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 5.0 },
    },
  },

  // ✅ Admin (production - identique à la base de données)
  {
    email: 'admin@gowithsally.ma',
    password: 'Admin@2024',
    user: {
      id: 'admin_002',
      firstName: 'Admin',
      lastName: 'Sally',
      email: 'admin@gowithsally.ma',
      phone: '+212600000000',
      role: 'admin',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      points: 0,
      level: 'Diamond',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 5.0 },
    },
  },

  // ✅ Support (production - hybrid mode)
  {
    email: 'support@gowithsally.ma',
    password: 'Support@2024',
    user: {
      id: 'support_001',
      firstName: 'Support',
      lastName: 'Sally',
      email: 'support@gowithsally.ma',
      phone: '+212600000001',
      role: 'admin',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      points: 0,
      level: 'Diamond',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 5.0 },
    },
  },

  // ✅ Driver 1 (production - hybrid mode)
  {
    email: 'fatima.driver@gmail.com',
    password: 'Driver@2024',
    user: {
      id: 'driver_prod_001',
      firstName: 'Fatima',
      lastName: 'Ben Mohamed',
      email: 'fatima.driver@gmail.com',
      phone: '+212612345671',
      role: 'driver',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      badge: {
        level: 'premium',
        earnedAt: '2024-06-15',
        documentsVerified: 7,
        benefits: ['sally_confort_access', 'higher_earnings', 'badge_visible', 'priority_rides'],
        earningsBonus: 0.10,
      },
      servicesOffered: ['sally_standard', 'sally_confort'],
      paymentMethodsAccepted: ['cash', 'card'],
      points: 800,
      level: 'Gold',
      totalRides: 87,
      preferredLanguage: 'fr',
      vehicle: { brand: 'Dacia', model: 'Logan', color: 'Blanc', plateNumber: '12345-A-1' },
      isOnline: true,
      rating: 4.8,
      stats: { totalRides: 87, averageRating: 4.8 },
      documents: [
        { type: 'nationalId', status: 'verified' },
        { type: 'nationalIdBack', status: 'verified' },
        { type: 'drivingLicense', status: 'verified' },
        { type: 'drivingLicenseBack', status: 'verified' },
        { type: 'vehicleRegistration', status: 'verified' },
        { type: 'insurance', status: 'verified' },
        { type: 'profilePhoto', status: 'verified' },
      ],
    },
  },

  // ✅ User 1 (production - hybrid mode)
  {
    email: 'sara.user@gmail.com',
    password: 'User@2024',
    user: {
      id: 'user_prod_001',
      firstName: 'Sara',
      lastName: 'Alami',
      email: 'sara.user@gmail.com',
      phone: '+212612345681',
      role: 'user',
      avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: true,
      genderVerified: true,
      faceEnrolled: true,
      gender: 'female',
      points: 320,
      level: 'Silver',
      totalRides: 15,
      preferredLanguage: 'fr',
      stats: { totalRides: 15, averageRating: 4.9 },
    },
  },

  // 🆕 Nouvelle utilisatrice (NON VÉRIFIÉE - flow complet)
  {
    email: 'newuser@test.com',
    password: 'test123',
    user: {
      id: 'newuser_001',
      firstName: 'Nouvelle',
      lastName: 'Utilisatrice',
      email: 'newuser@test.com',
      phone: '+212600111222',
      role: 'user',
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      faceVerified: false,
      genderVerified: false,
      faceEnrolled: false,
      points: 0,
      level: 'Bronze',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 0 },
    },
  },
  
  // 🆕 Nouvelle conductrice (NON VÉRIFIÉE - flow complet)
  {
    email: 'newdriver@test.com',
    password: 'test123',
    user: {
      id: 'newdriver_001',
      firstName: 'Nouvelle',
      lastName: 'Conductrice',
      email: 'newdriver@test.com',
      phone: '+212600333444',
      role: 'driver',
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      faceVerified: false,
      genderVerified: false,
      faceEnrolled: false,
      badge: {
        level: 'none',
        documentsVerified: 0,
        benefits: [],
        earningsBonus: 0,
      },
      servicesOffered: [],
      paymentMethodsAccepted: ['cash'],
      points: 0,
      level: 'Bronze',
      totalRides: 0,
      preferredLanguage: 'fr',
      vehicle: { brand: '', model: '', color: '', plateNumber: '' },
      isOnline: false,
      rating: 0,
      stats: { totalRides: 0, averageRating: 0 },
      documents: [],
    },
  },
  
  // 🆕 Utilisatrice phone+email OK, mais gender non vérifié
  {
    email: 'nogender@test.com',
    password: 'test123',
    user: {
      id: 'nogender_001',
      firstName: 'Test',
      lastName: 'Gender',
      email: 'nogender@test.com',
      phone: '+212600555666',
      role: 'user',
      isVerified: false,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: false,
      genderVerified: false,
      faceEnrolled: false,
      points: 0,
      level: 'Bronze',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 0 },
    },
  },
  
  // 🆕 Utilisatrice gender OK, mais face non vérifié
  {
    email: 'noface@test.com',
    password: 'test123',
    user: {
      id: 'noface_001',
      firstName: 'Test',
      lastName: 'Face',
      email: 'noface@test.com',
      phone: '+212600666777',
      role: 'user',
      isVerified: false,
      emailVerified: true,
      phoneVerified: true,
      faceVerified: false,
      genderVerified: true,
      faceEnrolled: false,
      gender: 'female',
      points: 0,
      level: 'Bronze',
      totalRides: 0,
      preferredLanguage: 'fr',
      stats: { totalRides: 0, averageRating: 0 },
    },
  },
];

// ============================================================================
// HELPER - VERIFICATION STEP
// ============================================================================

function getVerificationStep(user: User): VerificationStep {
  console.log('🔐 [authSlice] getVerificationStep:', user.email);
  console.log('🔐 [authSlice] phoneVerified:', user.phoneVerified);
  console.log('🔐 [authSlice] emailVerified:', user.emailVerified);
  console.log('🔐 [authSlice] genderVerified:', user.genderVerified);
  console.log('🔐 [authSlice] faceEnrolled:', user.faceEnrolled);
  console.log('🔐 [authSlice] faceVerified:', user.faceVerified);

  // Admin bypass toutes les vérifications
  if (user.role === 'admin') {
    return 'complete';
  }

  // Ordre des vérifications: phone → email → gender → face → documents
  if (!user.phoneVerified) return 'phone';
  if (!user.emailVerified) return 'email';
  
  // Vérification genre AVANT face (Sally = femmes only)
  if (!user.genderVerified) return 'gender';
  
  // Face enrollment (premier enregistrement) ou vérification
  if (!user.faceEnrolled || !user.faceVerified) return 'face';
  
  // Documents pour conductrices uniquement
  if (user.role === 'driver' && !user.isVerified) return 'documents';
  
  return 'complete';
}

// Helper pour vérifier si face lock quotidien requis
function needsDailyFaceCheck(lastVerification?: string | null): boolean {
  if (!lastVerification) return true;
  
  const today = new Date().toDateString();
  return lastVerification !== today;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  verificationStep: 'complete',
  error: null,
  
  // 🆕 FIXED: Initialize direct state properties
  genderVerified: false,
  faceEnrolled: false,
  
  lastFaceVerification: null,
  requiresDailyFaceCheck: false,
};

// ============================================================================
// THUNKS
// ============================================================================

// --- LOGIN ---
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    console.log('🔐 [authSlice] login:', credentials.email);

    try {
      // Check mock accounts first (works in both OFFLINE and HYBRID modes)
      const account = MOCK_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === credentials.email.toLowerCase() && acc.password === credentials.password
      );

      if (account) {
        console.log('🔐 [authSlice] ✅ Mock account found:', account.user.firstName);
        const verificationStep = getVerificationStep(account.user);
        await new Promise((resolve) => setTimeout(resolve, 500));

        const token = `mock_token_${Date.now()}`;
        const refreshToken = `mock_refresh_${Date.now()}`;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(account.user));

        // Récupérer lastFaceVerification
        const lastFaceVerification = await AsyncStorage.getItem('lastFaceVerification');
        const requiresDailyFaceCheck = account.user.faceEnrolled && needsDailyFaceCheck(lastFaceVerification);

        console.log('🔐 [authSlice] ✅ Login OK - verificationStep:', verificationStep);
        console.log('🔐 [authSlice] requiresDailyFaceCheck:', requiresDailyFaceCheck);

        return { 
          user: account.user, 
          token, 
          refreshToken, 
          verificationStep,
          genderVerified: account.user.genderVerified,
          faceEnrolled: account.user.faceEnrolled,
          lastFaceVerification: lastFaceVerification || null,
          requiresDailyFaceCheck,
        };
      }

      // Try API if not in OFFLINE mode
      if (!OFFLINE_MODE) {
        try {
          const { data } = await authAPI.login(credentials);
          if (data.success && data.data) {
            await AsyncStorage.setItem('token', data.data.token);
            await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
            const verificationStep = data.data.verificationStep || getVerificationStep(data.data.user);
            
            return { 
              ...data.data, 
              verificationStep,
              genderVerified: data.data.user.genderVerified ?? false,
              faceEnrolled: data.data.user.faceEnrolled ?? false,
              lastFaceVerification: null,
              requiresDailyFaceCheck: false,
            };
          }
          return rejectWithValue(data.message || 'Erreur de connexion');
        } catch (apiError: any) {
          console.log('🔐 [authSlice] API failed, no mock account found');
        }
      }

      return rejectWithValue('Email ou mot de passe incorrect');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur de connexion');
    }
  }
);

// --- REGISTER ---
export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      role?: 'user' | 'driver';
      gender?: 'female';
    },
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        const newUser: User = {
          id: `user_${Date.now()}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'user',
          gender: userData.gender,
          isVerified: false,
          emailVerified: false,
          phoneVerified: false,
          faceVerified: false,
          genderVerified: false,
          faceEnrolled: false,
          points: 0,
          level: 'Bronze',
          totalRides: 0,
          stats: { totalRides: 0, averageRating: 0 },
          // Défauts pour conductrices
          ...(userData.role === 'driver' && {
            badge: { level: 'none' as BadgeLevel, documentsVerified: 0, benefits: [], earningsBonus: 0 },
            servicesOffered: [] as ServiceType[],
            paymentMethodsAccepted: ['cash'] as PaymentMethod[],
            vehicle: { brand: '', model: '', color: '', plateNumber: '' },
            isOnline: false,
            rating: 0,
            documents: [],
          }),
        };

        await new Promise((resolve) => setTimeout(resolve, 800));
        const token = `offline_token_${Date.now()}`;
        const refreshToken = `offline_refresh_${Date.now()}`;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));

        return { 
          user: newUser, 
          token, 
          refreshToken, 
          verificationStep: 'phone' as VerificationStep,
          genderVerified: false,
          faceEnrolled: false,
          lastFaceVerification: null,
          requiresDailyFaceCheck: false,
        };
      }

      const { data } = await authAPI.register(userData);
      if (data.success && data.data) {
        await AsyncStorage.setItem('token', data.data.token);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        return { 
          ...data.data, 
          verificationStep: 'phone' as VerificationStep,
          genderVerified: false,
          faceEnrolled: false,
          lastFaceVerification: null,
          requiresDailyFaceCheck: false,
        };
      }
      return rejectWithValue(data.message || "Erreur d'inscription");
    } catch (error: any) {
      return rejectWithValue(error.message || "Erreur d'inscription");
    }
  }
);

// --- VERIFY PHONE ---
export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async (code: string, { rejectWithValue }) => {
    try {
      if (OFFLINE_MODE) {
        if (code.length === 6) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { verified: true, nextStep: 'email' as VerificationStep };
        }
        return rejectWithValue('Code invalide');
      }
      const { data } = await authAPI.verifyPhone(code);
      if (data.success) return { verified: true, nextStep: 'email' as VerificationStep };
      return rejectWithValue(data.message || 'Code invalide');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Code invalide');
    }
  }
);

// --- VERIFY EMAIL ---
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (code: string, { rejectWithValue }) => {
    try {
      if (OFFLINE_MODE) {
        if (code.length === 6) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Après email → vérification genre
          return { verified: true, nextStep: 'gender' as VerificationStep };
        }
        return rejectWithValue('Code invalide');
      }
      return { verified: true, nextStep: 'gender' as VerificationStep };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Code invalide');
    }
  }
);

// --- VERIFY GENDER ---
export const verifyGender = createAsyncThunk(
  'auth/verifyGender',
  async (
    payload: { 
      imageBase64?: string; 
      method: 'face' | 'document' | 'manual';
    },
    { rejectWithValue }
  ) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Simuler vérification (95% de succès)
        const isSuccess = Math.random() < 0.95;
        
        if (!isSuccess) {
          return rejectWithValue('Vérification du genre échouée. Go With Sally est réservé aux femmes.');
        }
        
        return { verified: true, nextStep: 'face' as VerificationStep };
      }
      
      // En production: appeler l'API de vérification genre
      return { verified: true, nextStep: 'face' as VerificationStep };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Vérification du genre échouée');
    }
  }
);

// --- VERIFY FACE (enrollment initial) ---
export const verifyFace = createAsyncThunk(
  'auth/verifyFace',
  async (faceImage: string, { rejectWithValue, getState }) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const state = getState() as { auth: AuthState };
        const user = state.auth.user;
        
        // Premier enregistrement facial
        const isFirstEnrollment = !user?.faceEnrolled;
        
        // Déterminer prochaine étape
        let nextStep: VerificationStep = 'complete';
        if (user?.role === 'driver' && !user.isVerified) {
          nextStep = 'documents';
        }
        
        // Sauvegarder la date de vérification
        const today = new Date().toDateString();
        await AsyncStorage.setItem('lastFaceVerification', today);
        
        return { 
          verified: true, 
          enrolled: isFirstEnrollment,
          nextStep,
          verifiedAt: today,
        };
      }
      
      const { data } = await authAPI.verifyFace(faceImage);
      if (data.success) {
        const today = new Date().toDateString();
        await AsyncStorage.setItem('lastFaceVerification', today);
        return { verified: true, enrolled: true, nextStep: 'complete' as VerificationStep, verifiedAt: today };
      }
      return rejectWithValue(data.message || 'Vérification échouée');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Vérification échouée');
    }
  }
);

// --- VERIFY DAILY FACE (face lock quotidien) ---
export const verifyDailyFace = createAsyncThunk(
  'auth/verifyDailyFace',
  async (faceImage: string, { rejectWithValue }) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // Simuler comparaison faciale (90% de succès)
        const isMatch = Math.random() < 0.90;
        
        if (!isMatch) {
          return rejectWithValue('Visage non reconnu. Veuillez réessayer.');
        }
        
        const today = new Date().toDateString();
        await AsyncStorage.setItem('lastFaceVerification', today);
        
        return { verified: true, verifiedAt: today };
      }
      
      // En production: comparer avec le visage enregistré
      const today = new Date().toDateString();
      await AsyncStorage.setItem('lastFaceVerification', today);
      return { verified: true, verifiedAt: today };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Vérification échouée');
    }
  }
);

// --- LOGOUT ---
export const logout = createAsyncThunk('auth/logout', async () => {
  try { 
    if (!OFFLINE_MODE) await authAPI.logout(); 
  } catch (e) {}
  await AsyncStorage.multiRemove(['token', 'refreshToken', 'user', 'lastFaceVerification']);
  return null;
});

// --- RESTORE SESSION ---
export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const userStr = await AsyncStorage.getItem('user');
    const lastFaceVerification = await AsyncStorage.getItem('lastFaceVerification');

    if (!token || !userStr) return rejectWithValue('Pas de session');

    const user = JSON.parse(userStr) as User;
    const verificationStep = getVerificationStep(user);
    
    // Vérifier si face lock quotidien requis
    const requiresDailyFaceCheck = user.faceEnrolled && needsDailyFaceCheck(lastFaceVerification);
    
    return { 
      user, 
      token, 
      refreshToken: refreshToken || '', 
      verificationStep,
      genderVerified: user.genderVerified ?? false,
      faceEnrolled: user.faceEnrolled ?? false,
      lastFaceVerification: lastFaceVerification || null,
      requiresDailyFaceCheck,
    };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// --- UPDATE DRIVER SERVICES ---
export const updateDriverServices = createAsyncThunk(
  'auth/updateDriverServices',
  async (services: ServiceType[], { rejectWithValue }) => {
    try {
      if (services.length === 0) {
        return rejectWithValue('Au moins un service est requis');
      }
      
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { services };
      }
      
      return { services };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// --- UPDATE DRIVER PAYMENTS ---
export const updateDriverPayments = createAsyncThunk(
  'auth/updateDriverPayments',
  async (payments: PaymentMethod[], { rejectWithValue }) => {
    try {
      if (payments.length === 0) {
        return rejectWithValue('Au moins un mode de paiement est requis');
      }
      
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { payments };
      }
      
      return { payments };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// --- UPDATE DRIVER BADGE ---
export const updateDriverBadge = createAsyncThunk(
  'auth/updateDriverBadge',
  async (badge: DriverBadge, { rejectWithValue }) => {
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { badge };
      }
      return { badge };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    // 🆕 v3.2: Ajout de setLoading pour contrôler manuellement l'état de chargement
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setVerificationStep: (state, action: PayloadAction<VerificationStep>) => {
      state.verificationStep = action.payload;
      if (action.payload === 'complete') state.isAuthenticated = true;
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Sync direct state properties
        if (action.payload.genderVerified !== undefined) {
          state.genderVerified = action.payload.genderVerified;
        }
        if (action.payload.faceEnrolled !== undefined) {
          state.faceEnrolled = action.payload.faceEnrolled;
        }
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setUser: (state, action: PayloadAction<SetUserPayload>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.verificationStep = 'complete';
      state.isLoading = false;
      state.error = null;
      state.genderVerified = action.payload.user.genderVerified ?? false;
      state.faceEnrolled = action.payload.user.faceEnrolled ?? false;
    },
    
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.verificationStep = 'complete';
      state.isLoading = false;
      state.error = null;
      state.genderVerified = false;
      state.faceEnrolled = false;
      state.lastFaceVerification = null;
      state.requiresDailyFaceCheck = false;
    },
    
    // Actions pour les vérifications
    setGenderVerified: (state, action: PayloadAction<boolean>) => {
      state.genderVerified = action.payload;
      if (state.user) {
        state.user.genderVerified = action.payload;
        if (action.payload) state.user.gender = 'female';
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setFaceEnrolled: (state, action: PayloadAction<boolean>) => {
      state.faceEnrolled = action.payload;
      if (state.user) {
        state.user.faceEnrolled = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setLastFaceVerification: (state, action: PayloadAction<string | null>) => {
      state.lastFaceVerification = action.payload;
      state.requiresDailyFaceCheck = false;
    },
    
    setRequiresDailyFaceCheck: (state, action: PayloadAction<boolean>) => {
      state.requiresDailyFaceCheck = action.payload;
    },
    
    updateBadge: (state, action: PayloadAction<DriverBadge>) => {
      if (state.user && state.user.role === 'driver') {
        state.user.badge = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setDriverOnlineStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user && state.user.role === 'driver') {
        state.user.isOnline = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setServicesOffered: (state, action: PayloadAction<ServiceType[]>) => {
      if (state.user && state.user.role === 'driver') {
        state.user.servicesOffered = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    setPaymentMethodsAccepted: (state, action: PayloadAction<PaymentMethod[]>) => {
      if (state.user && state.user.role === 'driver') {
        state.user.paymentMethodsAccepted = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.verificationStep = action.payload.verificationStep;
        state.pendingPhone = action.payload.user.phone;
        state.pendingEmail = action.payload.user.email;
        // 🆕 FIXED: Set direct state properties
        state.genderVerified = action.payload.genderVerified ?? action.payload.user.genderVerified ?? false;
        state.faceEnrolled = action.payload.faceEnrolled ?? action.payload.user.faceEnrolled ?? false;
        state.lastFaceVerification = action.payload.lastFaceVerification ?? null;
        state.requiresDailyFaceCheck = action.payload.requiresDailyFaceCheck ?? false;
        state.isAuthenticated = action.payload.verificationStep === 'complete' && !action.payload.requiresDailyFaceCheck;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // REGISTER
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.verificationStep = 'phone';
        state.isAuthenticated = false;
        state.genderVerified = false;
        state.faceEnrolled = false;
        state.requiresDailyFaceCheck = false;
        state.lastFaceVerification = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // VERIFY PHONE
      .addCase(verifyPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStep = action.payload.nextStep;
        if (state.user) state.user.phoneVerified = true;
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // VERIFY EMAIL
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStep = action.payload.nextStep;
        if (state.user) state.user.emailVerified = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // VERIFY GENDER
      .addCase(verifyGender.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyGender.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStep = action.payload.nextStep;
        state.genderVerified = true;
        if (state.user) {
          state.user.genderVerified = true;
          state.user.gender = 'female';
        }
      })
      .addCase(verifyGender.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // VERIFY FACE (enrollment)
      .addCase(verifyFace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyFace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStep = action.payload.nextStep;
        state.lastFaceVerification = action.payload.verifiedAt;
        state.requiresDailyFaceCheck = false;
        state.faceEnrolled = true;
        if (state.user) {
          state.user.faceVerified = true;
          state.user.faceEnrolled = true;
          if (action.payload.nextStep === 'complete') {
            state.user.isVerified = true;
          }
        }
        if (action.payload.nextStep === 'complete') {
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyFace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // VERIFY DAILY FACE
      .addCase(verifyDailyFace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyDailyFace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastFaceVerification = action.payload.verifiedAt;
        state.requiresDailyFaceCheck = false;
        state.isAuthenticated = true;
        if (state.user) state.user.faceVerified = true;
      })
      .addCase(verifyDailyFace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.verificationStep = 'complete';
        state.isLoading = false;
        state.error = null;
        state.genderVerified = false;
        state.faceEnrolled = false;
        state.lastFaceVerification = null;
        state.requiresDailyFaceCheck = false;
      })

      // RESTORE SESSION
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.verificationStep = action.payload.verificationStep;
        // 🆕 FIXED: Set direct state properties
        state.genderVerified = action.payload.genderVerified ?? action.payload.user.genderVerified ?? false;
        state.faceEnrolled = action.payload.faceEnrolled ?? action.payload.user.faceEnrolled ?? false;
        state.lastFaceVerification = action.payload.lastFaceVerification ?? null;
        state.requiresDailyFaceCheck = action.payload.requiresDailyFaceCheck ?? false;
        state.isAuthenticated = action.payload.verificationStep === 'complete' && !action.payload.requiresDailyFaceCheck;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.genderVerified = false;
        state.faceEnrolled = false;
        state.lastFaceVerification = null;
        state.requiresDailyFaceCheck = false;
      })

      // UPDATE DRIVER SERVICES
      .addCase(updateDriverServices.fulfilled, (state, action) => {
        if (state.user && state.user.role === 'driver') {
          state.user.servicesOffered = action.payload.services;
          AsyncStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(updateDriverServices.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // UPDATE DRIVER PAYMENTS
      .addCase(updateDriverPayments.fulfilled, (state, action) => {
        if (state.user && state.user.role === 'driver') {
          state.user.paymentMethodsAccepted = action.payload.payments;
          AsyncStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(updateDriverPayments.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // UPDATE DRIVER BADGE
      .addCase(updateDriverBadge.fulfilled, (state, action) => {
        if (state.user && state.user.role === 'driver') {
          state.user.badge = action.payload.badge;
          AsyncStorage.setItem('user', JSON.stringify(state.user));
        }
      });
  },
});

// ============================================================================
// EXPORTS - ACTIONS
// ============================================================================

export const {
  clearError,
  setLoading,  // 🆕 v3.2: Nouvelle action exportée
  setVerificationStep,
  updateUser,
  setUser,
  resetAuth,
  setGenderVerified,
  setFaceEnrolled,
  setLastFaceVerification,
  setRequiresDailyFaceCheck,
  updateBadge,
  setDriverOnlineStatus,
  setServicesOffered,
  setPaymentMethodsAccepted,
} = authSlice.actions;

export default authSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
export const selectVerificationStep = (state: { auth: AuthState }) => state.auth.verificationStep;

// 🆕 FIXED: Direct state property selectors
export const selectGenderVerified = (state: { auth: AuthState }) => state.auth.genderVerified;
export const selectFaceEnrolled = (state: { auth: AuthState }) => state.auth.faceEnrolled;
export const selectRequiresDailyFaceCheck = (state: { auth: AuthState }) => state.auth.requiresDailyFaceCheck;
export const selectLastFaceVerification = (state: { auth: AuthState }) => state.auth.lastFaceVerification;

// Driver specific selectors
export const selectDriverBadge = (state: { auth: AuthState }) => state.auth.user?.badge;
export const selectDriverServices = (state: { auth: AuthState }) => state.auth.user?.servicesOffered;
export const selectDriverPayments = (state: { auth: AuthState }) => state.auth.user?.paymentMethodsAccepted;
export const selectIsDriverOnline = (state: { auth: AuthState }) => state.auth.user?.isOnline;