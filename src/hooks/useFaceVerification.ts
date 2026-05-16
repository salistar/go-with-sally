// hooks/useFaceVerification.ts
// Hook pour la vérification faciale Go With Sally

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  enrollFace, 
  verifyFace, 
  checkFaceSession,
  setFaceVerified,
  resetFaceFailedAttempts 
} from '../store/slices/verificationSlice';
import { faceVerificationService } from '../services/faceVerification';
import { FaceVerificationStatus } from '../types/verification';
import { FACE_VERIFICATION } from '../constants/verification';
import { AppDispatch, RootState } from '../store';

// ==================== TYPES ====================

interface UseFaceVerificationOptions {
  autoVerifyOnResume?: boolean;
  requireVerificationOnStart?: boolean;
}

interface UseFaceVerificationReturn {
  // State
  isVerified: boolean;
  isVerifying: boolean;
  isEnrolled: boolean;
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockUntil: string | null;
  error: string | null;
  status: FaceVerificationStatus;
  
  // Actions
  enroll: (faceDescriptor: number[], userId: string) => Promise<boolean>;
  verify: (faceDescriptor: number[]) => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  reset: () => void;
  
  // Session
  isSessionValid: boolean;
  sessionExpiry: string | null;
}

// ==================== HOOK ====================

export function useFaceVerification(
  options: UseFaceVerificationOptions = {}
): UseFaceVerificationReturn {
  const {
    autoVerifyOnResume = true,
    requireVerificationOnStart = true,
  } = options;
  
  const dispatch = useDispatch<AppDispatch>();
  const appState = useRef(AppState.currentState);
  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [status, setStatus] = useState<FaceVerificationStatus>('idle');
  
  // Selectors
  const faceState = useSelector((state: RootState) => state.verification.face);
  const {
    isVerified,
    isVerifying,
    isLocked,
    failedAttempts,
    lockUntil,
    sessionExpiry,
    error,
  } = faceState;
  
  // ==================== EFFECTS ====================
  
  // Check enrollment status on mount
  useEffect(() => {
    const checkEnrollment = async () => {
      const enrolled = await faceVerificationService.isEnrolled();
      setIsEnrolled(enrolled);
    };
    checkEnrollment();
  }, []);
  
  // Check session validity on mount
  useEffect(() => {
    if (requireVerificationOnStart) {
      dispatch(checkFaceSession());
    }
  }, [dispatch, requireVerificationOnStart]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App revient au premier plan
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[useFaceVerification] App came to foreground');
        
        if (autoVerifyOnResume && isEnrolled) {
          // Vérifier si la session est toujours valide
          const sessionValid = await faceVerificationService.isSessionValid();
          
          if (!sessionValid) {
            console.log('[useFaceVerification] Session expired, requiring verification');
            dispatch(setFaceVerified(false));
          }
        }
      }
      
      // App passe en arrière-plan
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('[useFaceVerification] App went to background');
        // Invalider la session quand l'app passe en arrière-plan
        dispatch(setFaceVerified(false));
      }
      
      appState.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [dispatch, autoVerifyOnResume, isEnrolled]);
  
  // Update status based on state
  useEffect(() => {
    if (isLocked) {
      setStatus('locked');
    } else if (isVerifying) {
      setStatus('verifying');
    } else if (isVerified) {
      setStatus('success');
    } else if (error) {
      setStatus('failed');
    } else {
      setStatus('idle');
    }
  }, [isVerified, isVerifying, isLocked, error]);
  
  // ==================== ACTIONS ====================
  
  const enroll = useCallback(async (
    faceDescriptor: number[],
    userId: string
  ): Promise<boolean> => {
    setStatus('verifying');
    
    try {
      const result = await dispatch(enrollFace({ faceDescriptor, userId })).unwrap();
      
      if (result.success) {
        setIsEnrolled(true);
        setStatus('success');
        return true;
      } else {
        setStatus('failed');
        return false;
      }
    } catch (error) {
      setStatus('error');
      return false;
    }
  }, [dispatch]);
  
  const verify = useCallback(async (faceDescriptor: number[]): Promise<boolean> => {
    if (isLocked) {
      return false;
    }
    
    setStatus('verifying');
    
    try {
      const result = await dispatch(verifyFace({ faceDescriptor })).unwrap();
      
      if (result.verified) {
        setStatus('success');
        return true;
      } else {
        setStatus('failed');
        return false;
      }
    } catch (error) {
      setStatus('error');
      return false;
    }
  }, [dispatch, isLocked]);
  
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dispatch(checkFaceSession()).unwrap();
      return result;
    } catch {
      return false;
    }
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(resetFaceFailedAttempts());
    setStatus('idle');
  }, [dispatch]);
  
  // ==================== COMPUTED ====================
  
  const isSessionValid = Boolean(
    sessionExpiry && new Date(sessionExpiry) > new Date()
  );
  
  const remainingAttempts = Math.max(
    0,
    FACE_VERIFICATION.MAX_FAILED_ATTEMPTS - failedAttempts
  );
  
  return {
    // State
    isVerified,
    isVerifying,
    isEnrolled,
    isLocked,
    failedAttempts,
    remainingAttempts,
    lockUntil,
    error,
    status,
    
    // Actions
    enroll,
    verify,
    checkSession,
    reset,
    
    // Session
    isSessionValid,
    sessionExpiry,
  };
}

export default useFaceVerification;