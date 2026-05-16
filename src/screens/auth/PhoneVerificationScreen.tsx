// screens/auth/PhoneVerificationScreen.tsx
// Écran de vérification téléphone Go With Sally

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import OTPInput from '../../components/verification/OTPInput';
import OTPTimer from '../../components/verification/OTPTimer';
import { sendOTP, verifyOTP, resendOTP } from '../../store/slices/verificationSlice';
import { useOTPTimer } from '../../hooks/useOTPTimer';
import { OTP_VERIFICATION, COUNTRY_CODES } from '../../constants/verification';
import { IS_OFFLINE, IS_HYBRID } from '../../config/appMode';
import { MOCK_VERIFICATION_CONFIG } from '../../mocks/verification.mock';
import { AppDispatch, RootState } from '../../store';

// ==================== TYPES ====================

interface PhoneVerificationScreenProps {
  onVerificationComplete?: () => void;
}

type SendType = 'sms' | 'whatsapp' | 'call';

// ==================== COMPONENT ====================

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({
  onVerificationComplete,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const isRTL = i18n.language === 'ar';
  
  // Redux state
  const otpState = useSelector((state: RootState) => state.verification.otp);
  const { isSending, isVerifying, isVerified, error } = otpState;
  
  // Local state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+212');
  const [otpCode, setOTPCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [sendType, setSendType] = useState<SendType>('sms');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  // Timer hook
  const {
    remainingTime,
    isExpired,
    formattedTime,
    canResend,
    startTimer,
    startResendCooldown,
    resetTimer,
  } = useOTPTimer({
    onExpire: () => {
      // OTP expiré, retourner à l'étape téléphone
    },
  });
  
  // Refs
  const phoneInputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // ==================== EFFECTS ====================
  
  useEffect(() => {
    if (isVerified) {
      onVerificationComplete?.();
    }
  }, [isVerified, onVerificationComplete]);
  
  useEffect(() => {
    if (error) {
      // Animation de shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);
  
  // ==================== HANDLERS ====================
  
  const handleSendOTP = useCallback(async () => {
    if (!phone || phone.length < 9) return;
    
    Keyboard.dismiss();
    
    const result = await dispatch(sendOTP({ phone, countryCode, type: sendType })).unwrap();
    
    if (result.success) {
      setStep('otp');
      startTimer(result.expiresAt); // Now accepts string | null
      startResendCooldown();
    }
  }, [dispatch, phone, countryCode, sendType, startTimer, startResendCooldown]);
  
  const handleVerifyOTP = useCallback(async (code: string) => {
    if (code.length !== OTP_VERIFICATION.CODE_LENGTH) return;
    
    const result = await dispatch(verifyOTP({ code })).unwrap();
    
    if (result.verified) {
      resetTimer();
    }
  }, [dispatch, resetTimer]);
  
  const handleResendOTP = useCallback(async () => {
    if (!canResend) return;
    
    const result = await dispatch(resendOTP({ type: sendType })).unwrap();
    
    if (result.success) {
      startTimer(result.expiresAt); // Now accepts string | null
      startResendCooldown();
      setOTPCode('');
    }
  }, [dispatch, canResend, sendType, startTimer, startResendCooldown]);
  
  const handleOTPChange = useCallback((code: string) => {
    setOTPCode(code);
    if (code.length === OTP_VERIFICATION.CODE_LENGTH) {
      handleVerifyOTP(code);
    }
  }, [handleVerifyOTP]);
  
  const handleBack = useCallback(() => {
    if (step === 'otp') {
      setStep('phone');
      setOTPCode('');
      resetTimer();
    } else {
      navigation.goBack();
    }
  }, [step, navigation, resetTimer]);
  
  const formatPhone = (value: string) => {
    // Supprimer tout sauf les chiffres
    const cleaned = value.replace(/\D/g, '');
    
    // Limiter à 10 chiffres
    const limited = cleaned.slice(0, 10);
    
    // Formater avec des espaces
    if (limited.length > 6) {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    } else if (limited.length > 3) {
      return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    }
    return limited;
  };
  
  // ==================== RENDER HELPERS ====================
  
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isRTL && styles.rtlText]}>
        {t('verification.enterPhone')}
      </Text>
      <Text style={[styles.stepDescription, isRTL && styles.rtlText]}>
        {t('verification.phoneDescription')}
      </Text>
      
      <View style={styles.phoneInputContainer}>
        <TouchableOpacity 
          style={styles.countryCodeButton}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
        
        <TextInput
          ref={phoneInputRef}
          style={[styles.phoneInput, isRTL && styles.rtlInput]}
          value={formatPhone(phone)}
          onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
          placeholder={t('verification.phonePlaceholder') || '6XX XXX XXX'}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={12}
          autoFocus
        />
      </View>
      
      {/* Send type selector */}
      <View style={styles.sendTypeContainer}>
        {(['sms', 'whatsapp'] as SendType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.sendTypeButton,
              sendType === type && styles.sendTypeButtonActive,
            ]}
            onPress={() => setSendType(type)}
          >
            <Ionicons 
              name={type === 'sms' ? 'chatbubble' : 'logo-whatsapp'} 
              size={20} 
              color={sendType === type ? '#FFF' : '#666'} 
            />
            <Text style={[
              styles.sendTypeText,
              sendType === type && styles.sendTypeTextActive,
            ]}>
              {t(`verification.sendVia.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Mock code hint for dev */}
      {(IS_OFFLINE || IS_HYBRID) && (
        <View style={styles.devHint}>
          <Ionicons name="information-circle" size={16} color="#3498DB" />
          <Text style={styles.devHintText}>
            Code de test: {MOCK_VERIFICATION_CONFIG.mockOTPCode}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!phone || phone.length < 9 || isSending) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSendOTP}
        disabled={!phone || phone.length < 9 || isSending}
      >
        {isSending ? (
          <Text style={styles.primaryButtonText}>{t('common.sending')}</Text>
        ) : (
          <Text style={styles.primaryButtonText}>{t('verification.sendCode')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  const renderOTPStep = () => (
    <Animated.View style={[styles.stepContainer, { transform: [{ translateX: shakeAnim }] }]}>
      <Text style={[styles.stepTitle, isRTL && styles.rtlText]}>
        {t('verification.enterOTP')}
      </Text>
      <Text style={[styles.stepDescription, isRTL && styles.rtlText]}>
        {t('verification.otpSentTo', { phone: `${countryCode}${phone}` })}
      </Text>
      
      <OTPInput
        length={OTP_VERIFICATION.CODE_LENGTH}
        value={otpCode}
        onChange={handleOTPChange}
        disabled={isVerifying}
        error={!!error} // Convert string | null to boolean
      />
      
      <OTPTimer
        remainingTime={remainingTime}
        formattedTime={formattedTime}
        isExpired={isExpired}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#E74C3C" />
          <Text style={styles.errorText}>
            {t(`verification.errors.${error}`, { defaultValue: t('verification.errors.invalidCode') })}
          </Text>
        </View>
      )}
      
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>
          {t('verification.didntReceive')}
        </Text>
        <TouchableOpacity 
          onPress={handleResendOTP}
          disabled={!canResend}
        >
          <Text style={[
            styles.resendButton,
            !canResend && styles.resendButtonDisabled,
          ]}>
            {canResend 
              ? t('verification.resend')
              : t('verification.resendIn', { seconds: Math.ceil((otpState.resendCooldown || 0)) })
            }
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (otpCode.length !== OTP_VERIFICATION.CODE_LENGTH || isVerifying) && styles.primaryButtonDisabled,
        ]}
        onPress={() => handleVerifyOTP(otpCode)}
        disabled={otpCode.length !== OTP_VERIFICATION.CODE_LENGTH || isVerifying}
      >
        <Text style={styles.primaryButtonText}>
          {isVerifying ? t('common.verifying') : t('verification.verify')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
  
  // ==================== RENDER ====================
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons 
                name={isRTL ? 'arrow-forward' : 'arrow-back'} 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, step === 'phone' && styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={[styles.progressDot, step === 'otp' && styles.progressDotActive]} />
            </View>
          </View>
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait" size={40} color="#8E44AD" />
            </View>
          </View>
          
          {/* Content */}
          {step === 'phone' ? renderPhoneStep() : renderOTPStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#8E44AD',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sendTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sendTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  sendTypeButtonActive: {
    backgroundColor: '#8E44AD',
  },
  sendTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  sendTypeTextActive: {
    color: '#FFF',
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    marginBottom: 20,
  },
  devHintText: {
    fontSize: 12,
    color: '#3498DB',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  primaryButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    marginLeft: 4,
  },
  resendButtonDisabled: {
    color: '#999',
  },
});

export default PhoneVerificationScreen;