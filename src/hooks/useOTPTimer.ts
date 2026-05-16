// hooks/useOTPTimer.ts
// Hook pour le timer OTP Go With Sally

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { 
  updateOTPRemainingTime, 
  updateOTPResendCooldown 
} from '../store/slices/verificationSlice';
import { otpService } from '../services/otpService';
import { OTP_VERIFICATION } from '../constants/verification';
import { AppDispatch } from '../store';

// ==================== TYPES ====================

interface UseOTPTimerOptions {
  expirySeconds?: number;
  resendCooldownSeconds?: number;
  onExpire?: () => void;
  onResendAvailable?: () => void;
  autoStart?: boolean;
}

interface UseOTPTimerReturn {
  // Expiry timer
  remainingTime: number;
  isExpired: boolean;
  formattedTime: string;
  
  // Resend cooldown
  resendCooldown: number;
  canResend: boolean;
  formattedResendTime: string;
  
  // Actions
  startTimer: (expiresAt?: Date | string | number | null) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  startResendCooldown: () => void;
}

// ==================== HOOK ====================

export function useOTPTimer(
  options: UseOTPTimerOptions = {}
): UseOTPTimerReturn {
  const {
    expirySeconds = OTP_VERIFICATION.EXPIRY_MINUTES * 60,
    resendCooldownSeconds = OTP_VERIFICATION.RESEND_COOLDOWN_SECONDS,
    onExpire,
    onResendAvailable,
    autoStart = false,
  } = options;
  
  // Try to get dispatch, but don't fail if not in Redux context
  let dispatch: AppDispatch | null = null;
  try {
    dispatch = useDispatch<AppDispatch>();
  } catch (e) {
    // Not in Redux provider context, that's ok
  }
  
  // State
  const [remainingTime, setRemainingTime] = useState(expirySeconds);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Refs pour les intervals
  const expiryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== EXPIRY TIMER ====================
  
  const startTimer = useCallback((expiresAt?: Date | string | number | null) => {
    // Clear existing interval
    if (expiryIntervalRef.current) {
      clearInterval(expiryIntervalRef.current);
    }
    
    let initialTime = expirySeconds;
    
    // Calculate from expiresAt if provided
    if (expiresAt != null) {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      initialTime = Math.max(0, Math.floor((expiryTime - now) / 1000));
    } else {
      // Get remaining time from service if available
      try {
        const serviceTime = otpService.getRemainingTime();
        if (serviceTime > 0) {
          initialTime = serviceTime;
        }
      } catch (e) {
        // Service not available
      }
    }
    
    setRemainingTime(initialTime);
    
    expiryIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        
        // Dispatch to Redux if available
        if (dispatch) {
          dispatch(updateOTPRemainingTime(newTime));
        }
        
        if (newTime <= 0) {
          if (expiryIntervalRef.current) {
            clearInterval(expiryIntervalRef.current);
            expiryIntervalRef.current = null;
          }
          onExpire?.();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  }, [dispatch, expirySeconds, onExpire]);
  
  const stopTimer = useCallback(() => {
    if (expiryIntervalRef.current) {
      clearInterval(expiryIntervalRef.current);
      expiryIntervalRef.current = null;
    }
  }, []);
  
  const resetTimer = useCallback(() => {
    stopTimer();
    setRemainingTime(expirySeconds);
    if (dispatch) {
      dispatch(updateOTPRemainingTime(expirySeconds));
    }
  }, [stopTimer, expirySeconds, dispatch]);
  
  // ==================== RESEND COOLDOWN ====================
  
  const startResendCooldown = useCallback(() => {
    // Clear existing interval
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
    }
    
    setResendCooldown(resendCooldownSeconds);
    if (dispatch) {
      dispatch(updateOTPResendCooldown(resendCooldownSeconds));
    }
    
    resendIntervalRef.current = setInterval(() => {
      setResendCooldown(prev => {
        const newTime = prev - 1;
        
        // Dispatch to Redux if available
        if (dispatch) {
          dispatch(updateOTPResendCooldown(newTime));
        }
        
        if (newTime <= 0) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
            resendIntervalRef.current = null;
          }
          onResendAvailable?.();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  }, [dispatch, resendCooldownSeconds, onResendAvailable]);
  
  // ==================== EFFECTS ====================
  
  // Auto start if enabled
  useEffect(() => {
    if (autoStart) {
      startTimer();
      startResendCooldown();
    }
    
    return () => {
      stopTimer();
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, [autoStart, startTimer, startResendCooldown, stopTimer]);
  
  // Sync with service on mount
  useEffect(() => {
    try {
      const serviceTime = otpService.getRemainingTime();
      if (serviceTime > 0) {
        setRemainingTime(serviceTime);
      }
      
      const serviceCooldown = otpService.getResendCooldown();
      if (serviceCooldown > 0) {
        setResendCooldown(serviceCooldown);
      }
    } catch (e) {
      // Service not available
    }
  }, []);
  
  // ==================== FORMATTERS ====================
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ==================== COMPUTED ====================
  
  const isExpired = remainingTime <= 0;
  const canResend = resendCooldown <= 0;
  const formattedTime = formatTime(remainingTime);
  const formattedResendTime = formatTime(resendCooldown);
  
  return {
    // Expiry timer
    remainingTime,
    isExpired,
    formattedTime,
    
    // Resend cooldown
    resendCooldown,
    canResend,
    formattedResendTime,
    
    // Actions
    startTimer,
    stopTimer,
    resetTimer,
    startResendCooldown,
  };
}

export default useOTPTimer;