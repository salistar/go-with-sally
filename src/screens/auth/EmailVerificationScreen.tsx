// screens/auth/EmailVerificationScreen.tsx
// Écran de vérification email Go With Sally

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { 
  sendEmailVerification, 
  verifyEmail,
  setEmailVerified 
} from '../../store/slices/verificationSlice';
import { emailVerificationService } from '../../services/emailVerification';
import { EMAIL_VERIFICATION, VERIFICATION_PATTERNS } from '../../constants/verification';
import { IS_OFFLINE, IS_HYBRID } from '../../config/appMode';
import { AppDispatch, RootState } from '../../store';

// ==================== TYPES ====================

interface EmailVerificationScreenProps {
  onVerificationComplete?: () => void;
  email?: string;
  isFirstTime?: boolean;
}

// ==================== COMPONENT ====================

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  onVerificationComplete,
  email: initialEmail,
  isFirstTime = true,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const isRTL = i18n.language === 'ar';
  
  // Redux state
  const emailState = useSelector((state: RootState) => state.verification.email);
  const { isSending, isVerifying, isVerified, error } = emailState;
  
  // Local state
  const [email, setEmail] = useState(initialEmail || '');
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Animation
  const successAnim = new Animated.Value(0);
  
  // ==================== EFFECTS ====================
  
  useEffect(() => {
    if (isVerified) {
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          onVerificationComplete?.();
        }, 1000);
      });
    }
  }, [isVerified]);
  
  useEffect(() => {
    if (emailSent && !canResend) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [emailSent, canResend]);
  
  // ==================== VALIDATION ====================
  
  const validateEmail = useCallback((value: string): boolean => {
    if (!value) {
      setEmailError(t('verification.errors.emailRequired'));
      return false;
    }
    if (!VERIFICATION_PATTERNS.EMAIL.test(value)) {
      setEmailError(t('verification.errors.invalidEmail'));
      return false;
    }
    setEmailError(null);
    return true;
  }, [t]);
  
  // ==================== HANDLERS ====================
  
  const handleSendEmail = useCallback(async () => {
    if (!validateEmail(email)) return;
    
    const result = await dispatch(sendEmailVerification({ email })).unwrap();
    
    if (result.success) {
      setEmailSent(true);
      setCanResend(false);
      setResendCooldown(EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60);
    }
  }, [dispatch, email, validateEmail]);
  
  const handleResendEmail = useCallback(async () => {
    if (!canResend) return;
    
    const result = await dispatch(sendEmailVerification({ email })).unwrap();
    
    if (result.success) {
      setCanResend(false);
      setResendCooldown(EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60);
    }
  }, [dispatch, email, canResend]);
  
  const handleOpenMail = useCallback(() => {
    // Essayer d'ouvrir l'app mail
    const mailApps = [
      { scheme: 'googlegmail://', name: 'Gmail' },
      { scheme: 'ms-outlook://', name: 'Outlook' },
      { scheme: 'message://', name: 'Mail' },
    ];
    
    Linking.openURL('mailto:');
  }, []);
  
  // Pour le mode dev - simuler la vérification
  const handleDevVerify = useCallback(async () => {
    if (IS_OFFLINE || IS_HYBRID) {
      await emailVerificationService.setVerified(email);
      dispatch(setEmailVerified(true));
    }
  }, [dispatch, email]);
  
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  
  // ==================== RENDER HELPERS ====================
  
  const renderEmailInput = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isRTL && styles.rtlText]}>
        {t('verification.emailAddress')}
      </Text>
      <View style={[styles.inputWrapper, emailError && styles.inputError]}>
        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, isRTL && styles.rtlInput]}
          value={email}
          onChangeText={(text) => {
            setEmail(text.toLowerCase());
            if (emailError) validateEmail(text);
          }}
          placeholder={t('verification.emailPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!emailSent}
        />
      </View>
      {emailError && (
        <Text style={styles.errorText}>{emailError}</Text>
      )}
    </View>
  );
  
  const renderEmailSent = () => (
    <View style={styles.sentContainer}>
      <View style={styles.sentIconContainer}>
        <Ionicons name="mail-open" size={48} color="#8E44AD" />
      </View>
      
      <Text style={[styles.sentTitle, isRTL && styles.rtlText]}>
        {t('verification.checkYourEmail')}
      </Text>
      
      <Text style={[styles.sentDescription, isRTL && styles.rtlText]}>
        {t('verification.emailSentTo', { email })}
      </Text>
      
      <TouchableOpacity style={styles.openMailButton} onPress={handleOpenMail}>
        <Ionicons name="open-outline" size={20} color="#8E44AD" />
        <Text style={styles.openMailText}>
          {t('verification.openMailApp')}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>
          {t('verification.didntReceiveEmail')}
        </Text>
        <TouchableOpacity 
          onPress={handleResendEmail}
          disabled={!canResend}
        >
          <Text style={[
            styles.resendButton,
            !canResend && styles.resendButtonDisabled,
          ]}>
            {canResend 
              ? t('verification.resendEmail')
              : t('verification.resendIn', { 
                  seconds: `${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}` 
                })
            }
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Dev mode - simulate verification */}
      {(IS_OFFLINE || IS_HYBRID) && (
        <TouchableOpacity style={styles.devButton} onPress={handleDevVerify}>
          <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
          <Text style={styles.devButtonText}>
            [DEV] Simuler la vérification
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  const renderSuccess = () => (
    <Animated.View 
      style={[
        styles.successContainer,
        {
          opacity: successAnim,
          transform: [{
            scale: successAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        },
      ]}
    >
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#27AE60" />
      </View>
      
      <Text style={[styles.successTitle, isRTL && styles.rtlText]}>
        {t('verification.emailVerified')}
      </Text>
      
      <Text style={[styles.successDescription, isRTL && styles.rtlText]}>
        {t('verification.emailVerifiedDescription')}
      </Text>
    </Animated.View>
  );
  
  // ==================== RENDER ====================
  
  if (isVerified) {
    return (
      <SafeAreaView style={styles.container}>
        {renderSuccess()}
      </SafeAreaView>
    );
  }
  
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
          </View>
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={40} color="#8E44AD" />
            </View>
          </View>
          
          {/* Title */}
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {t('verification.verifyEmail')}
          </Text>
          
          <Text style={[styles.description, isRTL && styles.rtlText]}>
            {isFirstTime 
              ? t('verification.emailFirstTimeDescription')
              : t('verification.emailDescription')
            }
          </Text>
          
          {/* Content */}
          {emailSent ? renderEmailSent() : (
            <>
              {renderEmailInput()}
              
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!email || isSending) && styles.primaryButtonDisabled,
                ]}
                onPress={handleSendEmail}
                disabled={!email || isSending}
              >
                <Text style={styles.primaryButtonText}>
                  {isSending ? t('common.sending') : t('verification.sendVerificationEmail')}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#E74C3C" />
              <Text style={styles.errorMessage}>
                {t(`verification.errors.${error}`, { defaultValue: error })}
              </Text>
            </View>
          )}
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
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  sentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sentIconContainer: {
    marginBottom: 24,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sentDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  openMailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    marginBottom: 24,
  },
  openMailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    marginLeft: 8,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    marginTop: 4,
  },
  resendButtonDisabled: {
    color: '#999',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E9F7EF',
    borderRadius: 12,
    marginTop: 24,
  },
  devButtonText: {
    fontSize: 14,
    color: '#27AE60',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;

