// store/slices/verificationSlice.ts
// Redux slice pour la vérification Go With Sally

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  VerificationState,
  FaceVerificationState,
  OTPState,
  EmailVerificationState,
  FaceVerificationResponse,
  OTPSendResponse,
  OTPVerifyResponse,
  EmailVerificationResponse,
  VerificationStep
} from '../../types/verification';
import { faceVerificationService } from '../../services/faceVerification';
import { otpService, OTPSendType } from '../../services/otpService';
import { emailVerificationService } from '../../services/emailVerification';
import { MOCK_FACE_STATE, MOCK_OTP_STATE, MOCK_EMAIL_STATE } from '../../mocks/verification.mock';

// ==================== INITIAL STATE ====================

const initialFaceState: FaceVerificationState = {
  ...MOCK_FACE_STATE,
};

const initialOTPState: OTPState = {
  ...MOCK_OTP_STATE,
};

const initialEmailState: EmailVerificationState = {
  ...MOCK_EMAIL_STATE,
};

const initialState: VerificationState = {
  face: initialFaceState,
  otp: initialOTPState,
  email: initialEmailState,
  isFullyVerified: false,
  verificationStep: 'none',
};

// ==================== ASYNC THUNKS ====================

// Face Verification
export const enrollFace = createAsyncThunk<
  FaceVerificationResponse,
  { faceDescriptor: number[]; userId: string },
  { rejectValue: string }
>('verification/enrollFace', async ({ faceDescriptor, userId }, { rejectWithValue }) => {
  try {
    const result = await faceVerificationService.enrollFace(faceDescriptor, userId);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to enroll face');
  }
});

export const verifyFace = createAsyncThunk<
  FaceVerificationResponse,
  { faceDescriptor: number[] },
  { rejectValue: string }
>('verification/verifyFace', async ({ faceDescriptor }, { rejectWithValue }) => {
  try {
    const result = await faceVerificationService.verifyFace(faceDescriptor);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to verify face');
  }
});

export const checkFaceSession = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>('verification/checkFaceSession', async (_, { rejectWithValue }) => {
  try {
    return await faceVerificationService.isSessionValid();
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// OTP Verification
export const sendOTP = createAsyncThunk<
  OTPSendResponse,
  { phone: string; countryCode?: string; type?: OTPSendType },
  { rejectValue: string }
>('verification/sendOTP', async ({ phone, countryCode = '+212', type = 'sms' }, { rejectWithValue }) => {
  try {
    const result = await otpService.sendOTP(phone, countryCode, type);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to send OTP');
  }
});

export const verifyOTP = createAsyncThunk<
  OTPVerifyResponse,
  { code: string },
  { rejectValue: string }
>('verification/verifyOTP', async ({ code }, { rejectWithValue }) => {
  try {
    const result = await otpService.verifyOTP(code);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to verify OTP');
  }
});

export const resendOTP = createAsyncThunk<
  OTPSendResponse,
  { type?: OTPSendType },
  { rejectValue: string }
>('verification/resendOTP', async ({ type = 'sms' }, { rejectWithValue }) => {
  try {
    const result = await otpService.resendOTP(type);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to resend OTP');
  }
});

// Email Verification
export const sendEmailVerification = createAsyncThunk<
  EmailVerificationResponse,
  { email: string },
  { rejectValue: string }
>('verification/sendEmail', async ({ email }, { rejectWithValue }) => {
  try {
    const result = await emailVerificationService.sendVerificationEmail(email);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to send email');
  }
});

export const verifyEmail = createAsyncThunk<
  EmailVerificationResponse,
  { token: string },
  { rejectValue: string }
>('verification/verifyEmail', async ({ token }, { rejectWithValue }) => {
  try {
    const result = await emailVerificationService.verifyEmail(token);
    return result;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to verify email');
  }
});

export const checkEmailStatus = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>('verification/checkEmailStatus', async (_, { rejectWithValue }) => {
  try {
    return await emailVerificationService.checkVerificationStatus();
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// ==================== SLICE ====================

const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    // Face actions
    setFaceVerified: (state, action: PayloadAction<boolean>) => {
      state.face.isVerified = action.payload;
      state.face.lastVerification = action.payload ? new Date().toISOString() : null;
      updateFullyVerified(state);
    },
    
    setFaceSessionExpiry: (state, action: PayloadAction<string | null>) => {
      state.face.sessionExpiry = action.payload;
    },
    
    incrementFaceFailedAttempts: (state) => {
      state.face.failedAttempts += 1;
    },
    
    resetFaceFailedAttempts: (state) => {
      state.face.failedAttempts = 0;
      state.face.isLocked = false;
      state.face.lockUntil = null;
    },
    
    setFaceLocked: (state, action: PayloadAction<{ locked: boolean; until?: string }>) => {
      state.face.isLocked = action.payload.locked;
      state.face.lockUntil = action.payload.until || null;
    },
    
    clearFaceError: (state) => {
      state.face.error = null;
    },
    
    // OTP actions
    setOTPPhone: (state, action: PayloadAction<string>) => {
      state.otp.phone = action.payload;
    },
    
    setOTPVerified: (state, action: PayloadAction<boolean>) => {
      state.otp.isVerified = action.payload;
      updateFullyVerified(state);
    },
    
    updateOTPRemainingTime: (state, action: PayloadAction<number>) => {
      state.otp.remainingTime = action.payload;
    },
    
    updateOTPResendCooldown: (state, action: PayloadAction<number>) => {
      state.otp.resendCooldown = action.payload;
      state.otp.canResend = action.payload === 0;
    },
    
    clearOTPError: (state) => {
      state.otp.error = null;
    },
    
    resetOTPState: (state) => {
      state.otp = { ...initialOTPState };
    },
    
    // Email actions
    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.email.isVerified = action.payload;
      if (action.payload) {
        state.email.verifiedAt = new Date().toISOString();
      }
      updateFullyVerified(state);
    },
    
    clearEmailError: (state) => {
      state.email.error = null;
    },
    
    // Global actions
    setVerificationStep: (state, action: PayloadAction<VerificationStep>) => {
      state.verificationStep = action.payload;
    },
    
    resetVerificationState: (state) => {
      return initialState;
    },
    
    // Initialize from stored state
    hydrateVerificationState: (state, action: PayloadAction<Partial<VerificationState>>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Face Enroll
    builder.addCase(enrollFace.pending, (state) => {
      state.face.isVerifying = true;
      state.face.error = null;
    });
    builder.addCase(enrollFace.fulfilled, (state, action) => {
      state.face.isVerifying = false;
      if (action.payload.success) {
        state.face.isVerified = true;
        state.face.lastVerification = new Date().toISOString();
        state.face.sessionExpiry = action.payload.expiresAt || null;
        state.verificationStep = 'complete';
      } else {
        state.face.error = action.payload.error || 'Enrollment failed';
      }
      updateFullyVerified(state);
    });
    builder.addCase(enrollFace.rejected, (state, action) => {
      state.face.isVerifying = false;
      state.face.error = action.payload || 'Enrollment failed';
    });
    
    // Face Verify
    builder.addCase(verifyFace.pending, (state) => {
      state.face.isVerifying = true;
      state.face.error = null;
    });
    builder.addCase(verifyFace.fulfilled, (state, action) => {
      state.face.isVerifying = false;
      if (action.payload.verified) {
        state.face.isVerified = true;
        state.face.lastVerification = new Date().toISOString();
        state.face.sessionExpiry = action.payload.expiresAt || null;
        state.face.failedAttempts = 0;
      } else {
        state.face.failedAttempts += 1;
        state.face.error = action.payload.error || 'Verification failed';
        
        if (action.payload.error === 'account_locked') {
          state.face.isLocked = true;
        }
      }
      updateFullyVerified(state);
    });
    builder.addCase(verifyFace.rejected, (state, action) => {
      state.face.isVerifying = false;
      state.face.error = action.payload || 'Verification failed';
    });
    
    // Check Face Session
    builder.addCase(checkFaceSession.fulfilled, (state, action) => {
      state.face.isVerified = action.payload;
      if (!action.payload) {
        state.face.sessionExpiry = null;
      }
    });
    
    // Send OTP
    builder.addCase(sendOTP.pending, (state) => {
      state.otp.isSending = true;
      state.otp.error = null;
    });
    builder.addCase(sendOTP.fulfilled, (state, action) => {
      state.otp.isSending = false;
      if (action.payload.success) {
        state.otp.sessionId = action.payload.sessionId;
        state.otp.expiresAt = action.payload.expiresAt;
        state.otp.remainingTime = 5 * 60; // 5 minutes
        state.otp.attempts = 0;
        state.otp.canResend = false;
        state.otp.resendCooldown = 60;
      } else {
        state.otp.error = action.payload.error || 'Failed to send OTP';
      }
    });
    builder.addCase(sendOTP.rejected, (state, action) => {
      state.otp.isSending = false;
      state.otp.error = action.payload || 'Failed to send OTP';
    });
    
    // Verify OTP
    builder.addCase(verifyOTP.pending, (state) => {
      state.otp.isVerifying = true;
      state.otp.error = null;
    });
    builder.addCase(verifyOTP.fulfilled, (state, action) => {
      state.otp.isVerifying = false;
      if (action.payload.verified) {
        state.otp.isVerified = true;
        state.otp.sessionId = null;
        state.otp.expiresAt = null;
        state.verificationStep = 'email_pending';
      } else {
        state.otp.attempts += 1;
        state.otp.error = action.payload.error || 'Invalid code';
      }
      updateFullyVerified(state);
    });
    builder.addCase(verifyOTP.rejected, (state, action) => {
      state.otp.isVerifying = false;
      state.otp.error = action.payload || 'Verification failed';
    });
    
    // Resend OTP
    builder.addCase(resendOTP.pending, (state) => {
      state.otp.isSending = true;
    });
    builder.addCase(resendOTP.fulfilled, (state, action) => {
      state.otp.isSending = false;
      if (action.payload.success) {
        state.otp.sessionId = action.payload.sessionId;
        state.otp.expiresAt = action.payload.expiresAt;
        state.otp.remainingTime = 5 * 60;
        state.otp.canResend = false;
        state.otp.resendCooldown = 60;
      }
    });
    builder.addCase(resendOTP.rejected, (state, action) => {
      state.otp.isSending = false;
      state.otp.error = action.payload || 'Failed to resend';
    });
    
    // Send Email
    builder.addCase(sendEmailVerification.pending, (state) => {
      state.email.isSending = true;
      state.email.error = null;
    });
    builder.addCase(sendEmailVerification.fulfilled, (state, action) => {
      state.email.isSending = false;
      if (action.payload.success) {
        state.email.sentAt = new Date().toISOString();
      } else {
        state.email.error = action.payload.error || 'Failed to send email';
      }
    });
    builder.addCase(sendEmailVerification.rejected, (state, action) => {
      state.email.isSending = false;
      state.email.error = action.payload || 'Failed to send email';
    });
    
    // Verify Email
    builder.addCase(verifyEmail.pending, (state) => {
      state.email.isVerifying = true;
      state.email.error = null;
    });
    builder.addCase(verifyEmail.fulfilled, (state, action) => {
      state.email.isVerifying = false;
      if (action.payload.verified) {
        state.email.isVerified = true;
        state.email.verifiedAt = new Date().toISOString();
        state.verificationStep = 'face_enrollment';
      } else {
        state.email.error = action.payload.error || 'Verification failed';
      }
      updateFullyVerified(state);
    });
    builder.addCase(verifyEmail.rejected, (state, action) => {
      state.email.isVerifying = false;
      state.email.error = action.payload || 'Verification failed';
    });
    
    // Check Email Status
    builder.addCase(checkEmailStatus.fulfilled, (state, action) => {
      state.email.isVerified = action.payload;
      updateFullyVerified(state);
    });
  },
});

// Helper function
function updateFullyVerified(state: VerificationState): void {
  state.isFullyVerified = 
    state.face.isVerified && 
    state.otp.isVerified && 
    state.email.isVerified;
}

export const {
  setFaceVerified,
  setFaceSessionExpiry,
  incrementFaceFailedAttempts,
  resetFaceFailedAttempts,
  setFaceLocked,
  clearFaceError,
  setOTPPhone,
  setOTPVerified,
  updateOTPRemainingTime,
  updateOTPResendCooldown,
  clearOTPError,
  resetOTPState,
  setEmailVerified,
  clearEmailError,
  setVerificationStep,
  resetVerificationState,
  hydrateVerificationState,
} = verificationSlice.actions;

export default verificationSlice.reducer;

