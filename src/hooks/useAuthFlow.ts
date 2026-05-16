/**
 * GO WITH SALLY - USE AUTH FLOW HOOK
 * Hook personnalisé pour gérer le flux d'authentification et vérification
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  logout, 
  setVerificationStep,
  updateUser,
  VerificationStep as AuthVerificationStep,
} from '../store/slices/authSlice';
import { genderVerificationService } from '../services/genderVerificationService';

// ============================================================================
// TYPES
// ============================================================================

// Réutiliser le type de authSlice pour cohérence
export type VerificationStep = AuthVerificationStep;

export type UserRole = 'user' | 'driver' | 'admin';

export interface AuthFlowState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  role: UserRole;
  verificationStep: VerificationStep;
  requiresDailyFaceCheck: boolean;
  genderVerified: boolean;
  faceEnrolled: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  documentsVerified: boolean;
}

export interface AuthFlowActions {
  // Navigation
  navigateToNextStep: () => void;
  navigateToVerification: (step: VerificationStep) => void;
  
  // Verification
  completePhoneVerification: () => Promise<void>;
  completeEmailVerification: () => Promise<void>;
  completeGenderVerification: () => Promise<void>;
  completeFaceEnrollment: () => Promise<void>;
  completeDocumentsVerification: () => Promise<void>;
  
  // Daily check
  checkDailyFaceRequired: () => Promise<boolean>;
  completeDailyFaceCheck: () => Promise<void>;
  
  // Auth
  handleLogout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VERIFICATION_SCREENS: Record<VerificationStep, string> = {
  phone: 'PhoneVerification',
  email: 'EmailVerification',
  gender: 'GenderVerification',
  face: 'FaceEnrollment',
  documents: 'DocumentsUpload',
  complete: 'Home',
};

// ============================================================================
// HOOK
// ============================================================================

export function useAuthFlow(): AuthFlowState & AuthFlowActions {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    verificationStep: reduxVerificationStep,
    requiresDailyFaceCheck,
  } = useAppSelector((state) => state.auth);

  // Local state
  const [localLoading, setLocalLoading] = useState(false);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  const role: UserRole = user?.role || 'user';
  const genderVerified = user?.genderVerified ?? false;
  const faceEnrolled = user?.faceEnrolled ?? false;
  const phoneVerified = user?.phoneVerified ?? false;
  const emailVerified = user?.emailVerified ?? false;
  
  // Calculer documentsVerified à partir du tableau documents
  const documentsVerified = checkDocumentsVerified(user?.documents);

  // Calculer l'étape de vérification actuelle
  const verificationStep = calculateVerificationStep({
    phoneVerified,
    emailVerified,
    genderVerified,
    faceEnrolled,
    documentsVerified,
    role,
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Synchroniser l'étape de vérification avec Redux si différente
  useEffect(() => {
    if (reduxVerificationStep !== verificationStep) {
      dispatch(setVerificationStep(verificationStep));
    }
  }, [verificationStep, reduxVerificationStep, dispatch]);

  // ==========================================================================
  // NAVIGATION ACTIONS
  // ==========================================================================

  const navigateToNextStep = useCallback(() => {
    const screenName = VERIFICATION_SCREENS[verificationStep];
    console.log(`[useAuthFlow] 🧭 Navigation vers: ${screenName} (step: ${verificationStep})`);
    
    if (verificationStep === 'complete') {
      // Naviguer vers l'écran principal selon le rôle
      if (role === 'driver') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverHome' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } else {
      navigation.navigate(screenName);
    }
  }, [verificationStep, role, navigation]);

  const navigateToVerification = useCallback((step: VerificationStep) => {
    const screenName = VERIFICATION_SCREENS[step];
    console.log(`[useAuthFlow] 🧭 Navigation forcée vers: ${screenName}`);
    navigation.navigate(screenName);
  }, [navigation]);

  // ==========================================================================
  // VERIFICATION ACTIONS
  // ==========================================================================

  const completePhoneVerification = useCallback(async () => {
    console.log('[useAuthFlow] 📱 Téléphone vérifié');
    setLocalLoading(true);
    
    try {
      dispatch(updateUser({ phoneVerified: true }));
      
      // Attendre un peu pour l'animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Naviguer vers l'étape suivante
      navigateToNextStep();
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, navigateToNextStep]);

  const completeEmailVerification = useCallback(async () => {
    console.log('[useAuthFlow] 📧 Email vérifié');
    setLocalLoading(true);
    
    try {
      dispatch(updateUser({ emailVerified: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      navigateToNextStep();
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, navigateToNextStep]);

  const completeGenderVerification = useCallback(async () => {
    console.log('[useAuthFlow] 👩 Genre vérifié');
    setLocalLoading(true);
    
    try {
      // Utiliser le service de vérification
      const result = await genderVerificationService.selfDeclare({
        userId: user?.id || '',
        declaredGender: 'female',
      });
      
      if (result.isVerified || result.status === 'pending') {
        dispatch(updateUser({ genderVerified: true, gender: 'female' }));
        await new Promise(resolve => setTimeout(resolve, 500));
        navigateToNextStep();
      }
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, user, navigateToNextStep]);

  const completeFaceEnrollment = useCallback(async () => {
    console.log('[useAuthFlow] 🤳 Face enrollée');
    setLocalLoading(true);
    
    try {
      dispatch(updateUser({ 
        faceEnrolled: true,
        faceVerified: true,
      }));
      await new Promise(resolve => setTimeout(resolve, 500));
      navigateToNextStep();
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, navigateToNextStep]);

  const completeDocumentsVerification = useCallback(async () => {
    console.log('[useAuthFlow] 📄 Documents vérifiés');
    setLocalLoading(true);
    
    try {
      // Mettre à jour les documents comme vérifiés
      const verifiedDocuments = [
        { type: 'nationalId', status: 'verified' as const },
        { type: 'drivingLicense', status: 'verified' as const },
        { type: 'vehicleRegistration', status: 'verified' as const },
        { type: 'insurance', status: 'verified' as const },
      ];
      dispatch(updateUser({ documents: verifiedDocuments, isVerified: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      navigateToNextStep();
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, navigateToNextStep]);

  // ==========================================================================
  // DAILY FACE CHECK
  // ==========================================================================

  const checkDailyFaceRequired = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !requiresDailyFaceCheck) return false;
    
    const required = await genderVerificationService.requiresDailyCheck(user.id);
    console.log(`[useAuthFlow] 🔄 Daily face check required: ${required}`);
    return required;
  }, [user, requiresDailyFaceCheck]);

  const completeDailyFaceCheck = useCallback(async () => {
    console.log('[useAuthFlow] ✅ Daily face check complété');
    // Le service met à jour la date automatiquement
  }, []);

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================

  const handleLogout = useCallback(async () => {
    console.log('[useAuthFlow] 🚪 Déconnexion...');
    setLocalLoading(true);
    
    try {
      await genderVerificationService.resetVerification();
      dispatch(logout());
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, navigation]);

  const refreshAuthState = useCallback(async () => {
    console.log('[useAuthFlow] 🔄 Rafraîchissement état auth...');
    // Recharger les données utilisateur depuis le backend
    // En mode offline, utiliser les données locales
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    isAuthenticated,
    isLoading: isLoading || localLoading,
    user,
    role,
    verificationStep,
    requiresDailyFaceCheck,
    genderVerified,
    faceEnrolled,
    phoneVerified,
    emailVerified,
    documentsVerified,
    
    // Actions
    navigateToNextStep,
    navigateToVerification,
    completePhoneVerification,
    completeEmailVerification,
    completeGenderVerification,
    completeFaceEnrollment,
    completeDocumentsVerification,
    checkDailyFaceRequired,
    completeDailyFaceCheck,
    handleLogout,
    refreshAuthState,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifie si les documents sont tous vérifiés
 */
function checkDocumentsVerified(documents?: { type: string; status: string }[]): boolean {
  if (!documents || documents.length === 0) return false;
  
  const requiredDocs = ['nationalId', 'drivingLicense', 'vehicleRegistration', 'insurance'];
  const verifiedDocs = documents.filter(d => d.status === 'verified').map(d => d.type);
  
  return requiredDocs.every(doc => verifiedDocs.includes(doc));
}

function calculateVerificationStep(params: {
  phoneVerified: boolean;
  emailVerified: boolean;
  genderVerified: boolean;
  faceEnrolled: boolean;
  documentsVerified: boolean;
  role: UserRole;
}): VerificationStep {
  const {
    phoneVerified,
    emailVerified,
    genderVerified,
    faceEnrolled,
    documentsVerified,
    role,
  } = params;

  // Vérification téléphone d'abord
  if (!phoneVerified) return 'phone';
  
  // Puis email
  if (!emailVerified) return 'email';
  
  // Puis genre (femme only)
  if (!genderVerified) return 'gender';
  
  // Puis face enrollment
  if (!faceEnrolled) return 'face';
  
  // Pour les conductrices, vérifier les documents
  if (role === 'driver' && !documentsVerified) return 'documents';
  
  // Tout est vérifié
  return 'complete';
}

/**
 * Helper pour obtenir le pourcentage de progression
 */
export function getVerificationProgress(step: VerificationStep, role: UserRole): number {
  const steps: VerificationStep[] = role === 'driver'
    ? ['phone', 'email', 'gender', 'face', 'documents', 'complete']
    : ['phone', 'email', 'gender', 'face', 'complete'];
  
  const currentIndex = steps.indexOf(step);
  if (currentIndex === -1) return 0;
  
  return Math.round((currentIndex / (steps.length - 1)) * 100);
}

/**
 * Helper pour obtenir le nom de l'étape en français
 */
export function getStepName(step: VerificationStep): string {
  const names: Record<VerificationStep, string> = {
    phone: 'Téléphone',
    email: 'Email',
    gender: 'Genre',
    face: 'Visage',
    documents: 'Documents',
    complete: 'Terminé',
  };
  return names[step];
}

/**
 * Helper pour obtenir l'icône de l'étape
 */
export function getStepIcon(step: VerificationStep): string {
  const icons: Record<VerificationStep, string> = {
    phone: 'phone',
    email: 'email',
    gender: 'gender-female',
    face: 'face-recognition',
    documents: 'file-document',
    complete: 'check-circle',
  };
  return icons[step];
}

export default useAuthFlow;