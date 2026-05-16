/**
 * ============================================================================
 * GO WITH SALLY - DRIVER REGISTER SCREEN (MIS À JOUR v3.0)
 * ============================================================================
 * @module screens/auth/DriverRegisterScreen
 * @version 3.0.0
 * 
 * AJOUTS:
 * - Sélection du genre (femme only pour Sally)
 * - Sélection des services offerts
 * - Sélection des méthodes de paiement acceptées
 * - Informations véhicule basiques
 * - Intégration Redux avec nouveaux thunks
 * ============================================================================
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { register, ServiceType, PaymentMethod } from '../../store/slices/authSlice';

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // 🆕 Nouveaux champs
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlateNumber: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlateNumber?: string;
  services?: string;
  payments?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SERVICE_OPTIONS: { type: ServiceType; icon: string; color: string }[] = [
  { type: 'sally_eco', icon: '🌱', color: '#22C55E' },
  { type: 'sally_standard', icon: '🚗', color: '#3B82F6' },
  { type: 'sally_confort', icon: '✨', color: '#A855F7' },
  { type: 'sally_pool', icon: '👥', color: '#06B6D4' },
];

const PAYMENT_OPTIONS: { method: PaymentMethod; icon: string; color: string }[] = [
  { method: 'cash', icon: 'cash-outline', color: '#22C55E' },
  { method: 'card', icon: 'card-outline', color: '#3B82F6' },
  { method: 'wallet', icon: 'wallet-outline', color: '#F59E0B' },
  { method: 'transfer', icon: 'swap-horizontal-outline', color: '#8B5CF6' },
];

// ============================================================================
// COMPONENT
// ============================================================================

const DriverRegisterScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const isRTL = i18n.language === 'ar';
  
  // Current step (multi-step form)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlateNumber: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmFemaleOnly, setConfirmFemaleOnly] = useState(false);
  
  // 🆕 Services et paiements sélectionnés
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(['sally_standard']);
  const [selectedPayments, setSelectedPayments] = useState<PaymentMethod[]>(['cash']);
  
  // Refs
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const vehicleBrandRef = useRef<TextInput>(null);
  const vehicleModelRef = useRef<TextInput>(null);
  const vehicleColorRef = useRef<TextInput>(null);
  const vehiclePlateRef = useRef<TextInput>(null);
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return t('auth.fieldRequired');
        if (value.length < 2) return t('auth.nameTooShort');
        break;
      case 'email':
        if (!value.trim()) return t('auth.fieldRequired');
        if (!/^\S+@\S+\.\S+$/.test(value)) return t('auth.invalidEmail');
        break;
      case 'phone':
        if (!value.trim()) return t('auth.fieldRequired');
        if (!/^[0-9]{9,10}$/.test(value.replace(/\s/g, ''))) return t('auth.invalidPhone');
        break;
      case 'password':
        if (!value) return t('auth.fieldRequired');
        if (value.length < 8) return t('auth.passwordTooShort');
        if (!/[A-Z]/.test(value)) return t('auth.passwordNeedsUppercase', 'Doit contenir une majuscule');
        if (!/[0-9]/.test(value)) return t('auth.passwordNeedsNumber', 'Doit contenir un chiffre');
        break;
      case 'confirmPassword':
        if (!value) return t('auth.fieldRequired');
        if (value !== formData.password) return t('auth.passwordsDoNotMatch');
        break;
      case 'vehicleBrand':
      case 'vehicleModel':
      case 'vehicleColor':
        if (!value.trim()) return t('auth.fieldRequired');
        break;
      case 'vehiclePlateNumber':
        if (!value.trim()) return t('auth.fieldRequired');
        // Format marocain: 12345-A-1 ou similaire
        if (!/^[0-9]{1,5}-[A-Z]-[0-9]{1,2}$/i.test(value.replace(/\s/g, ''))) {
          return t('auth.invalidPlateNumber', 'Format: 12345-A-1');
        }
        break;
    }
    return undefined;
  };
  
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 1) {
      ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'].forEach((field) => {
        const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
        if (error) newErrors[field as keyof FormErrors] = error;
      });
      
      if (!confirmFemaleOnly) {
        Alert.alert(
          t('auth.genderConfirmTitle', 'Confirmation'),
          t('auth.genderConfirmMessage', 'Go With Sally est exclusivement réservé aux femmes. Confirmez-vous être une femme ?'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.confirm'), onPress: () => setConfirmFemaleOnly(true) },
          ]
        );
        return false;
      }
    }
    
    if (step === 2) {
      ['vehicleBrand', 'vehicleModel', 'vehicleColor', 'vehiclePlateNumber'].forEach((field) => {
        const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
        if (error) newErrors[field as keyof FormErrors] = error;
      });
    }
    
    if (step === 3) {
      if (selectedServices.length === 0) {
        newErrors.services = t('auth.selectAtLeastOneService', 'Sélectionnez au moins un service');
      }
      if (selectedPayments.length === 0) {
        newErrors.payments = t('auth.selectAtLeastOnePayment', 'Sélectionnez au moins un mode de paiement');
      }
      if (!acceptedTerms) {
        Alert.alert(t('auth.error'), t('auth.acceptTermsRequired'));
        return false;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  
  const handleBlur = (field: keyof FormData) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };
  
  const handleServiceToggle = (service: ServiceType) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        // Ne pas permettre de tout désélectionner
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== service);
      }
      return [...prev, service];
    });
    if (errors.services) {
      setErrors((prev) => ({ ...prev, services: undefined }));
    }
  };
  
  const handlePaymentToggle = (payment: PaymentMethod) => {
    setSelectedPayments((prev) => {
      if (prev.includes(payment)) {
        // Ne pas permettre de tout désélectionner
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== payment);
      }
      return [...prev, payment];
    });
    if (errors.payments) {
      setErrors((prev) => ({ ...prev, payments: undefined }));
    }
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  const handleRegister = async () => {
    if (!validateStep(currentStep)) return;
    
    try {
      const result = await dispatch(
        register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'driver',
          gender: 'female',
        })
      ).unwrap();
      
      // Naviguer vers la vérification téléphone
      navigation.navigate('PhoneVerification', {
        phone: formData.phone,
        email: formData.email,
        // 🆕 Passer les données supplémentaires pour les sauvegarder après vérification
        driverData: {
          vehicle: {
            brand: formData.vehicleBrand,
            model: formData.vehicleModel,
            color: formData.vehicleColor,
            plateNumber: formData.vehiclePlateNumber,
          },
          servicesOffered: selectedServices,
          paymentMethodsAccepted: selectedPayments,
        },
      });
    } catch (error: any) {
      Alert.alert(t('auth.error'), error || t('auth.registrationFailed'));
    }
  };
  
  const handleLogin = () => {
    navigation.navigate('Login');
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderInput = (
    field: keyof FormData,
    icon: string,
    placeholder: string,
    options: {
      keyboardType?: any;
      secureTextEntry?: boolean;
      autoCapitalize?: any;
      ref?: React.RefObject<TextInput>;
      nextRef?: React.RefObject<TextInput>;
      showToggle?: boolean;
      isVisible?: boolean;
      onToggle?: () => void;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <Ionicons name={icon as any} size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          ref={options.ref}
          style={[styles.input, isRTL && styles.rtlInput]}
          value={formData[field]}
          onChangeText={(value) => handleChange(field, value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={options.keyboardType}
          secureTextEntry={options.secureTextEntry && !options.isVisible}
          autoCapitalize={options.autoCapitalize || 'none'}
          returnKeyType={options.nextRef ? 'next' : 'done'}
          onSubmitEditing={() => options.nextRef?.current?.focus()}
          blurOnSubmit={!options.nextRef}
        />
        {options.showToggle && (
          <TouchableOpacity onPress={options.onToggle}>
            <Ionicons name={options.isVisible ? 'eye-off' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );
  
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              step <= currentStep && styles.progressDotActive,
              step < currentStep && styles.progressDotCompleted,
            ]}
          >
            {step < currentStep ? (
              <Ionicons name="checkmark" size={12} color="#FFF" />
            ) : (
              <Text style={[styles.progressDotText, step <= currentStep && styles.progressDotTextActive]}>
                {step}
              </Text>
            )}
          </View>
          {step < 3 && (
            <View style={[styles.progressLine, step < currentStep && styles.progressLineActive]} />
          )}
        </View>
      ))}
    </View>
  );
  
  const renderStep1 = () => (
    <>
      {/* 🆕 Gender Confirmation Banner */}
      <View style={styles.genderBanner}>
        <View style={styles.genderBannerIcon}>
          <Text style={styles.genderBannerEmoji}>👩</Text>
        </View>
        <View style={styles.genderBannerText}>
          <Text style={[styles.genderBannerTitle, isRTL && styles.rtlText]}>
            {t('auth.femaleOnlyTitle', 'Service réservé aux femmes')}
          </Text>
          <Text style={[styles.genderBannerSubtitle, isRTL && styles.rtlText]}>
            {t('auth.femaleOnlySubtitle', 'Go With Sally connecte les femmes entre elles pour des trajets en toute sécurité')}
          </Text>
        </View>
      </View>
      
      {/* Gender Confirmation Checkbox */}
      <TouchableOpacity
        style={styles.genderCheckContainer}
        onPress={() => setConfirmFemaleOnly(!confirmFemaleOnly)}
      >
        <View style={[styles.checkbox, confirmFemaleOnly && styles.checkboxChecked]}>
          {confirmFemaleOnly && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text style={[styles.genderCheckText, isRTL && styles.rtlText]}>
          {t('auth.confirmFemale', 'Je confirme être une femme')}
        </Text>
      </TouchableOpacity>
      
      {/* Personal Info */}
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t('auth.personalInfo', 'Informations personnelles')}
      </Text>
      
      {renderInput('firstName', 'person-outline', t('auth.firstName'), {
        autoCapitalize: 'words',
        nextRef: lastNameRef,
      })}
      
      {renderInput('lastName', 'person-outline', t('auth.lastName'), {
        autoCapitalize: 'words',
        ref: lastNameRef,
        nextRef: emailRef,
      })}
      
      {renderInput('email', 'mail-outline', t('auth.email'), {
        keyboardType: 'email-address',
        ref: emailRef,
        nextRef: phoneRef,
      })}
      
      {renderInput('phone', 'call-outline', t('auth.phone'), {
        keyboardType: 'phone-pad',
        ref: phoneRef,
        nextRef: passwordRef,
      })}
      
      {renderInput('password', 'lock-closed-outline', t('auth.password'), {
        secureTextEntry: true,
        ref: passwordRef,
        nextRef: confirmPasswordRef,
        showToggle: true,
        isVisible: showPassword,
        onToggle: () => setShowPassword(!showPassword),
      })}
      
      {renderInput('confirmPassword', 'lock-closed-outline', t('auth.confirmPassword'), {
        secureTextEntry: true,
        ref: confirmPasswordRef,
        showToggle: true,
        isVisible: showConfirmPassword,
        onToggle: () => setShowConfirmPassword(!showConfirmPassword),
      })}
    </>
  );
  
  const renderStep2 = () => (
    <>
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t('auth.vehicleInfo', 'Informations véhicule')}
      </Text>
      <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
        {t('auth.vehicleInfoSubtitle', 'Ces informations seront visibles par vos passagères')}
      </Text>
      
      {renderInput('vehicleBrand', 'car-outline', t('auth.vehicleBrand', 'Marque (ex: Dacia)'), {
        autoCapitalize: 'words',
        ref: vehicleBrandRef,
        nextRef: vehicleModelRef,
      })}
      
      {renderInput('vehicleModel', 'car-sport-outline', t('auth.vehicleModel', 'Modèle (ex: Logan)'), {
        autoCapitalize: 'words',
        ref: vehicleModelRef,
        nextRef: vehicleColorRef,
      })}
      
      {renderInput('vehicleColor', 'color-palette-outline', t('auth.vehicleColor', 'Couleur'), {
        autoCapitalize: 'words',
        ref: vehicleColorRef,
        nextRef: vehiclePlateRef,
      })}
      
      {renderInput('vehiclePlateNumber', 'document-text-outline', t('auth.vehiclePlateNumber', 'Immatriculation (ex: 12345-A-1)'), {
        autoCapitalize: 'characters',
        ref: vehiclePlateRef,
      })}
      
      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#8E44AD" />
        <Text style={[styles.infoBoxText, isRTL && styles.rtlText]}>
          {t('auth.vehicleInfoNote', 'Vous pourrez modifier ces informations plus tard et ajouter des photos de votre véhicule.')}
        </Text>
      </View>
    </>
  );
  
  const renderStep3 = () => (
    <>
      {/* 🆕 Services Selection */}
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t('auth.selectServices', 'Services proposés')}
      </Text>
      <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
        {t('auth.selectServicesSubtitle', 'Choisissez les types de courses que vous souhaitez accepter')}
      </Text>
      
      <View style={styles.optionsGrid}>
        {SERVICE_OPTIONS.map((service) => {
          const isSelected = selectedServices.includes(service.type);
          const isDisabled = service.type === 'sally_confort'; // Nécessite badge Premium
          
          return (
            <TouchableOpacity
              key={service.type}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                isDisabled && styles.optionCardDisabled,
                { borderColor: isSelected ? service.color : '#E5E7EB' },
              ]}
              onPress={() => !isDisabled && handleServiceToggle(service.type)}
              disabled={isDisabled}
            >
              <Text style={styles.optionEmoji}>{service.icon}</Text>
              <Text style={[styles.optionTitle, isSelected && { color: service.color }]}>
                {t(`services.${service.type}`, service.type.replace('sally_', 'Sally '))}
              </Text>
              {isDisabled && (
                <View style={styles.optionBadge}>
                  <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
                  <Text style={styles.optionBadgeText}>Premium</Text>
                </View>
              )}
              {isSelected && (
                <View style={[styles.optionCheck, { backgroundColor: service.color }]}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.services && <Text style={styles.errorText}>{errors.services}</Text>}
      
      {/* 🆕 Payment Methods Selection */}
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: 24 }]}>
        {t('auth.selectPayments', 'Modes de paiement acceptés')}
      </Text>
      <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
        {t('auth.selectPaymentsSubtitle', 'Comment vos passagères pourront vous payer')}
      </Text>
      
      <View style={styles.optionsGrid}>
        {PAYMENT_OPTIONS.map((payment) => {
          const isSelected = selectedPayments.includes(payment.method);
          
          return (
            <TouchableOpacity
              key={payment.method}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                { borderColor: isSelected ? payment.color : '#E5E7EB' },
              ]}
              onPress={() => handlePaymentToggle(payment.method)}
            >
              <Ionicons name={payment.icon as any} size={28} color={isSelected ? payment.color : '#6B7280'} />
              <Text style={[styles.optionTitle, isSelected && { color: payment.color }]}>
                {t(`payments.${payment.method}`, payment.method)}
              </Text>
              {isSelected && (
                <View style={[styles.optionCheck, { backgroundColor: payment.color }]}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.payments && <Text style={styles.errorText}>{errors.payments}</Text>}
      
      {/* Terms */}
      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
          {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text style={[styles.termsText, isRTL && styles.rtlText]}>
          {t('auth.acceptTerms')}{' '}
          <Text style={styles.termsLink}>{t('auth.termsAndConditions')}</Text>
          {' '}{t('auth.andThe', 'et la')}{' '}
          <Text style={styles.termsLink}>{t('auth.driverCharter', 'Charte des conductrices')}</Text>
        </Text>
      </TouchableOpacity>
    </>
  );
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={currentStep > 1 ? handlePrevious : () => navigation.goBack()}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.stepIndicator}>
              {currentStep}/{totalSteps}
            </Text>
          </View>
          
          {/* Progress Bar */}
          {renderProgressBar()}
          
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>
              {currentStep === 1 && t('auth.driverRegister', 'Devenir conductrice')}
              {currentStep === 2 && t('auth.yourVehicle', 'Votre véhicule')}
              {currentStep === 3 && t('auth.yourPreferences', 'Vos préférences')}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
              {currentStep === 1 && t('auth.driverRegisterSubtitle', 'Rejoignez la communauté Sally')}
              {currentStep === 2 && t('auth.vehicleSubtitle', 'Présentez votre véhicule')}
              {currentStep === 3 && t('auth.preferencesSubtitle', 'Personnalisez votre expérience')}
            </Text>
          </View>
          
          {/* Form Steps */}
          <View style={styles.form}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={[styles.primaryButton, (!confirmFemaleOnly && currentStep === 1) && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={!confirmFemaleOnly && currentStep === 1}
              >
                <Text style={styles.primaryButtonText}>{t('common.next', 'Suivant')}</Text>
                <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>{t('auth.register', "S'inscrire")}</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.alreadyHaveAccount', 'Déjà inscrite ?')}</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>{t('auth.login', 'Se connecter')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#8E44AD',
  },
  progressDotCompleted: {
    backgroundColor: '#22C55E',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  progressDotTextActive: {
    color: '#FFF',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#22C55E',
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F5F5F5',
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  // Gender Banner
  genderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  genderBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  genderBannerEmoji: {
    fontSize: 24,
  },
  genderBannerText: {
    flex: 1,
  },
  genderBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BE185D',
    marginBottom: 2,
  },
  genderBannerSubtitle: {
    fontSize: 12,
    color: '#9D174D',
  },
  genderCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
  },
  genderCheckText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: '#FAFAFA',
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  optionBadgeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  optionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#7C3AED',
    lineHeight: 18,
  },
  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#8E44AD',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#8E44AD',
    fontWeight: '600',
  },
  // Buttons
  buttonsContainer: {
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E44AD',
    marginLeft: 4,
  },
});

export default DriverRegisterScreen;