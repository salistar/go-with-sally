// hooks/useAppState.ts
// Hook pour gérer l'état de l'application Go With Sally

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// ==================== TYPES ====================

type AppStateCallback = (state: AppStateStatus) => void;
type TransitionCallback = (from: AppStateStatus, to: AppStateStatus) => void;

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  onChange?: AppStateCallback;
  onTransition?: TransitionCallback;
}

interface UseAppStateReturn {
  currentState: AppStateStatus;
  previousState: AppStateStatus | null;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
  timeSinceBackground: number | null;
}

// ==================== HOOK ====================

export function useAppState(options: UseAppStateOptions = {}): UseAppStateReturn {
  const {
    onForeground,
    onBackground,
    onInactive,
    onChange,
    onTransition,
  } = options;
  
  const [currentState, setCurrentState] = useState<AppStateStatus>(AppState.currentState);
  const previousStateRef = useRef<AppStateStatus | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  
  // Track time since background
  const [timeSinceBackground, setTimeSinceBackground] = useState<number | null>(null);
  
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const prevState = currentState;
    
    // Callback de transition
    if (onTransition) {
      onTransition(prevState, nextAppState);
    }
    
    // Callback général
    if (onChange) {
      onChange(nextAppState);
    }
    
    // Callbacks spécifiques
    if (nextAppState === 'active') {
      // App revient au premier plan
      if (prevState.match(/inactive|background/)) {
        if (backgroundTimeRef.current) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          setTimeSinceBackground(elapsed);
        }
        onForeground?.();
      }
      backgroundTimeRef.current = null;
    } else if (nextAppState === 'background') {
      // App passe en arrière-plan
      backgroundTimeRef.current = Date.now();
      onBackground?.();
    } else if (nextAppState === 'inactive') {
      // App inactive (transition)
      onInactive?.();
    }
    
    previousStateRef.current = prevState;
    setCurrentState(nextAppState);
  }, [currentState, onForeground, onBackground, onInactive, onChange, onTransition]);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);
  
  return {
    currentState,
    previousState: previousStateRef.current,
    isActive: currentState === 'active',
    isBackground: currentState === 'background',
    isInactive: currentState === 'inactive',
    timeSinceBackground,
  };
}

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook pour déclencher une action quand l'app revient au premier plan
 */
export function useOnForeground(callback: () => void, deps: any[] = []): void {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback, ...deps]);
  
  useAppState({
    onForeground: () => savedCallback.current(),
  });
}

/**
 * Hook pour déclencher une action quand l'app passe en arrière-plan
 */
export function useOnBackground(callback: () => void, deps: any[] = []): void {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback, ...deps]);
  
  useAppState({
    onBackground: () => savedCallback.current(),
  });
}

/**
 * Hook pour vérifier si l'app a été en arrière-plan pendant plus de X ms
 */
export function useBackgroundTimeout(
  timeoutMs: number,
  onTimeout: () => void
): void {
  const savedCallback = useRef(onTimeout);
  
  useEffect(() => {
    savedCallback.current = onTimeout;
  }, [onTimeout]);
  
  const { timeSinceBackground, isActive } = useAppState();
  
  useEffect(() => {
    if (isActive && timeSinceBackground && timeSinceBackground > timeoutMs) {
      savedCallback.current();
    }
  }, [isActive, timeSinceBackground, timeoutMs]);
}

/**
 * Hook pour la vérification faciale à la reprise de l'app
 */
export function useFaceVerificationOnResume(
  requireVerification: () => void,
  isVerified: boolean
): void {
  useAppState({
    onForeground: () => {
      // Toujours demander la vérification faciale au retour
      if (!isVerified) {
        requireVerification();
      }
    },
    onBackground: () => {
      // Invalider la session quand on part
      // La vérification sera requise au retour
    },
  });
}

export default useAppState;