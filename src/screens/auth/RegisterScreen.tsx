/**
 * ============================================================================
 * GO WITH SALLY - REGISTER SCREEN (MIS À JOUR v3.0)
 * ============================================================================
 * Écran d'inscription pour les nouvelles utilisatrices
 * 
 * MISES À JOUR v3.0:
 * - Confirmation genre féminin (femme-only platform)
 * - Intégration genderVerified, faceEnrolled
 * - Utilise register() thunk qui calcule verificationStep
 * - Le RootNavigator gère la navigation post-inscription
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * 
 * Flow après inscription:
 * → phone → email → gender → face → complete
 * 
 * @module screens/auth/RegisterScreen
 * @version 3.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';
import { useRTL } from '../../hooks/useRTL';

// Redux
import { register, clearError } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[RegisterScreen]';
const { width, height } = Dimensions.get('window');

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const RegisterScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isRTL } = useRTL();

  const { isLoading, error, user, token, verificationStep } = useAppSelector((state) => state.auth);

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    dispatch(clearError());

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('+212');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  
  // 🆕 Confirmation genre féminin
  const [confirmFemale, setConfirmFemale] = useState<boolean>(false);

  // Erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Gestion des erreurs Redux
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: t('errors.error') || 'Erreur',
        text2: error,
      });
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  // Navigation automatique après inscription réussie
  // Le RootNavigator gère la redirection selon verificationStep
  useEffect(() => {
    if (token && user) {
      console.log(`${FILE_NAME} ✅ Inscription réussie!`);
      console.log(`${FILE_NAME} 👤 User: ${user.firstName} (${user.role})`);
      console.log(`${FILE_NAME} 📋 verificationStep: ${verificationStep}`);
      console.log(`${FILE_NAME} 👩 genderVerified: ${user.genderVerified}`);
      console.log(`${FILE_NAME} 📸 faceEnrolled: ${user.faceEnrolled}`);
      // Le RootNavigator gère automatiquement la navigation
    }
  }, [token, user, verificationStep]);

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const isValidPhone = (phoneValue: string): boolean => {
    const phoneRegex = /^\+212[5-7][0-9]{8}$/;
    return phoneRegex.test(phoneValue);
  };

  const validatePassword = (
    passwordValue: string
  ): { isValid: boolean; message: string } => {
    if (passwordValue.length < 8) {
      return { isValid: false, message: t('auth.passwordTooShort') || 'Minimum 8 caractères' };
    }
    if (!/[A-Z]/.test(passwordValue)) {
      return { isValid: false, message: t('auth.passwordNeedsUppercase') || 'Doit contenir une majuscule' };
    }
    if (!/[0-9]/.test(passwordValue)) {
      return { isValid: false, message: t('auth.passwordNeedsNumber') || 'Doit contenir un chiffre' };
    }
    return { isValid: true, message: '' };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('auth.firstNameRequired') || 'Prénom requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('auth.lastNameRequired') || 'Nom requis';
    }

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired') || 'Email requis';
    } else if (!isValidEmail(email)) {
      newErrors.email = t('auth.emailInvalid') || 'Email invalide';
    }

    if (!phone || phone === '+212') {
      newErrors.phone = t('auth.phoneRequired') || 'Téléphone requis';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = t('auth.invalidPhone') || 'Format: +212612345678';
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired') || 'Mot de passe requis';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNotMatch') || 'Les mots de passe ne correspondent pas';
    }

    // 🆕 Validation confirmation femme
    if (!confirmFemale) {
      newErrors.gender = t('auth.confirmFemaleRequired') || 'Veuillez confirmer être une femme';
    }

    if (!acceptTerms) {
      newErrors.terms = t('auth.acceptTermsRequired') || 'Veuillez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleRegister = useCallback(async (): Promise<void> => {
    console.log(`${FILE_NAME} 📝 === DÉBUT INSCRIPTION ===`);

    if (!validateForm()) {
      console.log(`${FILE_NAME} ❌ Validation échouée`);
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Toast.show({
          type: 'error',
          text1: t('errors.error') || 'Erreur',
          text2: firstError,
        });
      }
      return;
    }

    // Confirmation supplémentaire pour le genre
    if (!confirmFemale) {
      Alert.alert(
        t('auth.genderConfirmTitle') || 'Confirmation',
        t('auth.genderConfirmMessage') || 'Go With Sally est exclusivement réservé aux femmes. Confirmez-vous être une femme ?',
        [
          { text: t('common.cancel') || 'Annuler', style: 'cancel' },
          { 
            text: t('common.confirm') || 'Confirmer', 
            onPress: () => {
              setConfirmFemale(true);
              // Re-submit après confirmation
              setTimeout(() => handleRegister(), 100);
            }
          },
        ]
      );
      return;
    }

    console.log(`${FILE_NAME} ✅ Validation réussie`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);

    try {
      // 🆕 Utiliser le thunk register() qui calcule verificationStep
      const result = await dispatch(
        register({
          firstName,
          lastName,
          email: email.toLowerCase().trim(),
          phone,
          password,
          role: 'user',
          gender: 'female', // 🆕 Go With Sally = femmes uniquement
        })
      ).unwrap();

      console.log(`${FILE_NAME} ✅ Inscription réussie!`);
      console.log(`${FILE_NAME} 👤 User: ${result.user.firstName}`);
      console.log(`${FILE_NAME} 📋 verificationStep: ${result.verificationStep}`);

      // Message de succès
      Toast.show({
        type: 'success',
        text1: t('common.success') || 'Succès',
        text2: t('auth.registerSuccess') || `Bienvenue ${result.user.firstName}! Vérifiez votre téléphone.`,
      });

      // PAS DE NAVIGATION MANUELLE
      // Le RootNavigator redirige automatiquement vers PhoneVerification

    } catch (err: any) {
      console.error(`${FILE_NAME} ❌ Inscription échouée:`, err);
      // L'erreur est gérée par Redux et affichée via le useEffect
    }

    console.log(`${FILE_NAME} 📝 === FIN INSCRIPTION ===`);
  }, [
    firstName,
    lastName,
    email,
    phone,
    password,
    confirmPassword,
    acceptTerms,
    confirmFemale,
    errors,
    dispatch,
    t,
  ]);

  const handleSocialRegister = useCallback(
    (provider: string): void => {
      Toast.show({
        type: 'info',
        text1: provider,
        text2: t('common.comingSoon') || 'Bientôt disponible',
      });
    },
    [t]
  );

  const handleDriverRegister = useCallback((): void => {
    navigation.navigate('DriverRegister');
  }, [navigation]);

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20', borderColor: getBadgeColor() }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {IS_OFFLINE ? 'TEST' : IS_HYBRID ? 'HYBRID' : 'API'}
        </Text>
      </View>
    );
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    secureTextEntry,
    showToggle,
    onToggle,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string;
    error?: string;
    secureTextEntry?: boolean;
    showToggle?: boolean;
    onToggle?: () => void;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words';
  }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.background,
            borderColor: error ? '#F44336' : theme.colors.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={error ? '#F44336' : theme.colors.textSecondary}
        />
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={!isLoading}
        />
        {showToggle !== undefined && onToggle && (
          <TouchableOpacity onPress={onToggle} disabled={isLoading}>
            <MaterialCommunityIcons
              name={showToggle ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#fff5f8', '#ffe0eb', '#ffc0d0']}
        style={styles.gradient}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('auth.createAccount') || 'Créer un compte'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('auth.registerSubtitle') || 'Rejoignez la communauté Sally'}
            </Text>
          </View>

          {__DEV__ && <ModeBadge />}
        </View>

        {/* ================================================================ */}
        {/* 🆕 BANNER FEMME ONLY */}
        {/* ================================================================ */}
        <View style={styles.genderBanner}>
          <View style={styles.genderBannerIcon}>
            <Text style={styles.genderBannerEmoji}>👩</Text>
          </View>
          <View style={styles.genderBannerText}>
            <Text style={[styles.genderBannerTitle, isRTL && styles.rtlText]}>
              {t('auth.femaleOnlyTitle') || 'Service réservé aux femmes'}
            </Text>
            <Text style={[styles.genderBannerSubtitle, isRTL && styles.rtlText]}>
              {t('auth.femaleOnlySubtitle') || 'Go With Sally connecte les femmes entre elles pour des trajets en toute sécurité'}
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* FORMULAIRE */}
        {/* ================================================================ */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              backgroundColor: theme.colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 🆕 Checkbox confirmation femme */}
          <TouchableOpacity
            style={[
              styles.genderCheckContainer,
              { 
                borderColor: errors.gender ? '#F44336' : confirmFemale ? theme.colors.primary : theme.colors.border,
                backgroundColor: confirmFemale ? theme.colors.primary + '10' : theme.colors.background,
              }
            ]}
            onPress={() => {
              setConfirmFemale(!confirmFemale);
              if (errors.gender) {
                setErrors(prev => {
                  const { gender, ...rest } = prev;
                  return rest;
                });
              }
            }}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: errors.gender ? '#F44336' : theme.colors.primary,
                  backgroundColor: confirmFemale ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {confirmFemale && <MaterialCommunityIcons name="check" size={16} color="white" />}
            </View>
            <View style={styles.genderCheckTextContainer}>
              <Text style={[styles.genderCheckTitle, { color: theme.colors.text }]}>
                {t('auth.confirmFemale') || 'Je confirme être une femme'}
              </Text>
              <Text style={[styles.genderCheckSubtitle, { color: theme.colors.textSecondary }]}>
                {t('auth.confirmFemaleHint') || 'Obligatoire pour utiliser Go With Sally'}
              </Text>
            </View>
            <MaterialCommunityIcons 
              name="gender-female" 
              size={24} 
              color={confirmFemale ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
          {errors.gender && <Text style={[styles.errorText, { marginTop: -8, marginBottom: 12 }]}>{errors.gender}</Text>}

          {/* Ligne Prénom + Nom */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <InputField
                label={t('auth.firstName') || 'Prénom'}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('auth.firstNamePlaceholder') || 'Fatima'}
                icon="account-outline"
                error={errors.firstName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfInput}>
              <InputField
                label={t('auth.lastName') || 'Nom'}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('auth.lastNamePlaceholder') || 'Benali'}
                icon="account-outline"
                error={errors.lastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <InputField
            label={t('auth.email') || 'Email'}
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            placeholder={t('auth.emailPlaceholder') || 'exemple@email.com'}
            icon="email-outline"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Téléphone */}
          <InputField
            label={t('auth.phone') || 'Téléphone'}
            value={phone}
            onChangeText={(text) => {
              if (text.length < 4) {
                setPhone('+212');
              } else {
                setPhone(text);
              }
            }}
            placeholder={t('auth.phonePlaceholder') || '+212612345678'}
            icon="phone-outline"
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <Text style={[styles.inputHint, { color: theme.colors.textSecondary }]}>
            {t('auth.phoneHint') || 'Format marocain: +212 suivi de 9 chiffres'}
          </Text>

          {/* Mot de passe */}
          <InputField
            label={t('auth.password') || 'Mot de passe'}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder') || '••••••••'}
            icon="lock-outline"
            error={errors.password}
            secureTextEntry={!showPassword}
            showToggle={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />

          {/* Indicateur force */}
          <View style={styles.passwordStrength}>
            <View
              style={[
                styles.strengthBar,
                { backgroundColor: password.length >= 8 ? '#4CAF50' : theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.strengthBar,
                { backgroundColor: /[A-Z]/.test(password) ? '#4CAF50' : theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.strengthBar,
                { backgroundColor: /[0-9]/.test(password) ? '#4CAF50' : theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.strengthBar,
                { backgroundColor: /[!@#$%^&*]/.test(password) ? '#4CAF50' : theme.colors.border },
              ]}
            />
          </View>
          <Text style={[styles.inputHint, { color: theme.colors.textSecondary }]}>
            {t('auth.passwordHint') || '8+ caractères, 1 majuscule, 1 chiffre'}
          </Text>

          {/* Confirmation mot de passe */}
          <InputField
            label={t('auth.confirmPassword') || 'Confirmer le mot de passe'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('auth.passwordPlaceholder') || '••••••••'}
            icon="lock-check-outline"
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            showToggle={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {/* Indicateur correspondance */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchIndicator}>
              <MaterialCommunityIcons
                name={password === confirmPassword ? 'check-circle' : 'close-circle'}
                size={16}
                color={password === confirmPassword ? '#4CAF50' : '#F44336'}
              />
              <Text
                style={[
                  styles.matchText,
                  { color: password === confirmPassword ? '#4CAF50' : '#F44336' },
                ]}
              >
                {password === confirmPassword
                  ? (t('auth.passwordsMatch') || 'Les mots de passe correspondent')
                  : (t('auth.passwordsNotMatch') || 'Les mots de passe ne correspondent pas')}
              </Text>
            </View>
          )}

          {/* Checkbox Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: errors.terms ? '#F44336' : theme.colors.primary,
                  backgroundColor: acceptTerms ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {acceptTerms && <MaterialCommunityIcons name="check" size={16} color="white" />}
            </View>
            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
              {t('auth.acceptTerms') || "J'accepte les"}{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {t('auth.termsOfService') || 'CGU'}
              </Text>{' '}
              {t('auth.and') || 'et'}{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {t('auth.privacyPolicy') || 'Politique de confidentialité'}
              </Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          {/* Bouton Inscription */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: theme.colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={22} color="white" />
                <Text style={styles.registerButtonText}>{t('auth.register') || "S'inscrire"}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info vérification */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '15' }]}>
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.infoBoxText, { color: theme.colors.primary }]}>
              {t('auth.verificationInfo') || 'Après inscription, vous devrez vérifier votre téléphone, email et identité.'}
            </Text>
          </View>
        </Animated.View>

        {/* ================================================================ */}
        {/* LIEN CONDUCTRICE */}
        {/* ================================================================ */}
        <TouchableOpacity 
          style={[styles.driverLink, { backgroundColor: theme.colors.surface }]}
          onPress={handleDriverRegister}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={[styles.driverLinkIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialCommunityIcons name="car" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.driverLinkText}>
            <Text style={[styles.driverLinkTitle, { color: theme.colors.text }]}>
              {t('auth.becomeDriver') || 'Devenir conductrice'}
            </Text>
            <Text style={[styles.driverLinkSubtitle, { color: theme.colors.textSecondary }]}>
              {t('auth.becomeDriverHint') || 'Gagnez de l\'argent en conduisant'}
            </Text>
          </View>
          <MaterialCommunityIcons 
            name={isRTL ? 'chevron-left' : 'chevron-right'} 
            size={24} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* ================================================================ */}
        {/* SÉPARATEUR */}
        {/* ================================================================ */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
            {t('auth.orContinueWith') || 'ou continuer avec'}
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* ================================================================ */}
        {/* INSCRIPTION SOCIALE */}
        {/* ================================================================ */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialRegister('Google')}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialRegister('Facebook')}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="facebook" size={24} color="#4267B2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSocialRegister('Apple')}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="apple" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('auth.hasAccount') || 'Déjà inscrite ?'}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
            <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
              {t('auth.login') || 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Footer */}
        <View style={styles.modeFooter}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  rtlText: {
    textAlign: 'right',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  titleContainer: {
    flex: 1,
    marginStart: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  modeBadgeEmoji: {
    fontSize: 12,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Gender Banner
  genderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
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
    lineHeight: 16,
  },

  // Form
  formContainer: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Gender Check
  genderCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  genderCheckTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  genderCheckTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderCheckSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  halfInput: {
    flex: 1,
  },

  // Input
  inputContainer: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },

  inputWrapper: {
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },

  inputHint: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
  },

  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Password Strength
  passwordStrength: {
    flexDirection: 'row',
    gap: 4,
    marginTop: -8,
    marginBottom: 4,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  // Match Indicator
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
    gap: 4,
  },

  matchText: {
    fontSize: 12,
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },

  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Register Button
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginTop: 12,
    gap: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  // Driver Link
  driverLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  driverLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverLinkText: {
    flex: 1,
  },
  driverLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  driverLinkSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
  },

  // Social
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },

  footerText: {
    fontSize: 14,
  },

  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Mode Footer
  modeFooter: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modeFooterText: {
    fontSize: 11,
  },
});

// ============================================================================
// EXPORT
// ============================================================================

export default RegisterScreen;