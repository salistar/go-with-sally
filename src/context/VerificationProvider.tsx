// context/VerificationProvider.tsx
// Provider de vérification Go With Sally

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { faceVerificationService } from '../services/faceVerification';
import { otpService } from '../services/otpService';
import { emailVerificationService } from '../services/emailVerification';
import { 
  setFaceVerified, 
  checkFaceSession,
  setVerificationStep 
} from '../store/slices/verificationSlice';
import { FEATURES } from '../config/appMode';
import { AppDispatch, RootState } from '../store';

// ==================== TYPES ====================

interface VerificationContextType {
  // État
  isAppActive: boolean;
  requiresFaceVerification: boolean;
  verificationStep: string;
  
  // Actions
  triggerFaceVerification: () => void;
  skipFaceVerification: () => void;
  checkVerificationStatus: () => Promise<void>;
  
  // Status
  isFullyVerified: boolean;
  canDrive: boolean;
}

interface VerificationProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================

const VerificationContext = createContext<VerificationContextType | null>(null);

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within VerificationProvider');
  }
  return context;
};

// ==================== PROVIDER ====================

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  
  // Redux state
  const verification = useSelector((state: RootState) => state.verification);
  const { face, otp, email, isFullyVerified, verificationStep } = verification;
  
  // Local state
  const [isAppActive, setIsAppActive] = useState(true);
  const [requiresFaceVerification, setRequiresFaceVerification] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState<Date | null>(null);
  
  // ==================== APP STATE HANDLING ====================
  
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasActive = isAppActive;
      const isNowActive = nextAppState === 'active';
      
      setIsAppActive(isNowActive);
      
      // App revient au premier plan
      if (!wasActive && isNowActive) {
        console.log('[VerificationProvider] App became active');
        
        if (FEATURES.FACE_VERIFICATION.requiredOnAppOpen) {
          // Vérifier si la session faciale est encore valide
          const sessionValid = await faceVerificationService.isSessionValid();
          
          if (!sessionValid && face.isVerified) {
            console.log('[VerificationProvider] Face session expired');
            dispatch(setFaceVerified(false));
          }
          
          // Déclencher la vérification si nécessaire
          const isEnrolled = await faceVerificationService.isEnrolled();
          if (isEnrolled && !sessionValid) {
            setRequiresFaceVerification(true);
          }
        }
        
        setLastActiveTime(new Date());
      }
      
      // App passe en arrière-plan
      if (wasActive && !isNowActive) {
        console.log('[VerificationProvider] App went to background');
        
        if (FEATURES.FACE_VERIFICATION.requiredOnAppClose) {
          // Invalider la session
          dispatch(setFaceVerified(false));
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [dispatch, face.isVerified, isAppActive]);
  
  // ==================== INITIAL CHECK ====================
  
  useEffect(() => {
    const initializeVerification = async () => {
      console.log('[VerificationProvider] Initializing...');
      
      // Initialiser les services
      await faceVerificationService.initialize();
      await otpService.initialize();
      await emailVerificationService.initialize();
      
      // Vérifier l'état initial
      await checkVerificationStatus();
    };
    
    initializeVerification();
  }, []);
  
  // ==================== ACTIONS ====================
  
  const triggerFaceVerification = useCallback(() => {
    console.log('[VerificationProvider] Triggering face verification');
    setRequiresFaceVerification(true);
    navigation.navigate('FaceLock');
  }, [navigation]);
  
  const skipFaceVerification = useCallback(() => {
    console.log('[VerificationProvider] Skipping face verification');
    setRequiresFaceVerification(false);
  }, []);
  
  const checkVerificationStatus = useCallback(async () => {
    console.log('[VerificationProvider] Checking verification status');
    
    // Vérifier la session faciale
    const faceSessionValid = await faceVerificationService.isSessionValid();
    if (!faceSessionValid && face.isVerified) {
      dispatch(setFaceVerified(false));
    }
    
    // Vérifier l'email
    const emailVerified = await emailVerificationService.checkVerificationStatus();
    
    // Déterminer l'étape actuelle
    if (!otp.isVerified) {
      dispatch(setVerificationStep('phone_pending'));
    } else if (!email.isVerified) {
      dispatch(setVerificationStep('email_pending'));
    } else if (!face.isVerified) {
      const isEnrolled = await faceVerificationService.isEnrolled();
      dispatch(setVerificationStep(isEnrolled ? 'face_verification' : 'face_enrollment'));
    } else {
      dispatch(setVerificationStep('complete'));
    }
  }, [dispatch, face.isVerified, otp.isVerified, email.isVerified]);
  
  // ==================== COMPUTED ====================
  
  const canDrive = isFullyVerified && !requiresFaceVerification;
  
  // ==================== CONTEXT VALUE ====================
  
  const contextValue: VerificationContextType = {
    // État
    isAppActive,
    requiresFaceVerification,
    verificationStep,
    
    // Actions
    triggerFaceVerification,
    skipFaceVerification,
    checkVerificationStatus,
    
    // Status
    isFullyVerified,
    canDrive,
  };
  
  return (
    <VerificationContext.Provider value={contextValue}>
      {children}
    </VerificationContext.Provider>
  );
};

export default VerificationProvider;