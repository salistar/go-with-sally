// components/verification/OTPInput.tsx
// Composant d'entrée OTP Go With Sally

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';

// ==================== TYPES ====================

interface OTPInputProps {
  /** Longueur du code OTP */
  length?: number;
  /** Valeur actuelle */
  value: string;
  /** Callback de changement */
  onChange: (code: string) => void;
  /** Désactivé */
  disabled?: boolean;
  /** Erreur (string, null ou boolean) */
  error?: string | null | boolean;
  /** Focus automatique */
  autoFocus?: boolean;
}

// ==================== COMPONENT ====================

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = null,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Auto-focus sur le premier champ
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Animation de shake sur erreur
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  // Gérer l'entrée de texte
  const handleChange = (text: string, index: number) => {
    // Ne garder que les chiffres
    const digit = text.replace(/\D/g, '').slice(-1);
    
    // Construire le nouveau code
    const codeArray = value.split('');
    codeArray[index] = digit;
    const newCode = codeArray.join('').slice(0, length);
    
    onChange(newCode);
    
    // Passer au champ suivant si un chiffre a été entré
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // Gérer le backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Si le champ est vide, revenir au précédent
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
        
        // Supprimer le chiffre précédent
        const codeArray = value.split('');
        codeArray[index - 1] = '';
        onChange(codeArray.join(''));
      } else {
        // Supprimer le chiffre actuel
        const codeArray = value.split('');
        codeArray[index] = '';
        onChange(codeArray.join(''));
      }
    }
  };

  // Gérer le collage
  const handlePaste = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    
    // Focus sur le dernier champ rempli ou le suivant
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    setFocusedIndex(nextIndex);
    
    // Si le code est complet, fermer le clavier
    if (digits.length === length) {
      Keyboard.dismiss();
    }
  };

  // Déterminer s'il y a une erreur (boolean)
  const hasError = Boolean(error);

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            hasError && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => {
            // Détecter si c'est un collage (plusieurs caractères)
            if (text.length > 1) {
              handlePaste(text);
            } else {
              handleChange(text, index);
            }
          }}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          keyboardType="number-pad"
          maxLength={length} // Pour permettre le collage
          editable={!disabled}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        />
      ))}
    </Animated.View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24,
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputFocused: {
    borderColor: '#8E44AD',
    backgroundColor: '#F3E5F5',
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDEDEC',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: '#F0F0F0',
  },
});

export default OTPInput;