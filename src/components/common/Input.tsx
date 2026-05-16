import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps, I18nManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

const Input: React.FC<InputProps> = ({ label, error, leftIcon, rightIcon, onRightIconPress, style, ...props }) => {
  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const leftIconStyle = isRTL ? [styles.leftIcon, styles.leftIconRTL] : styles.leftIcon;
  const errorStyle = isRTL ? [styles.error, styles.errorRTL] : styles.error;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: error ? theme.colors.error : theme.colors.border }]}>
        {leftIcon && <MaterialCommunityIcons name={leftIcon as any} size={22} color={theme.colors.textSecondary} style={leftIconStyle} />}
        <TextInput style={[styles.input, { color: theme.colors.text }, style]} placeholderTextColor={theme.colors.textLight} {...props} />
        {rightIcon && <TouchableOpacity onPress={onRightIconPress}><MaterialCommunityIcons name={rightIcon as any} size={22} color={theme.colors.textSecondary} /></TouchableOpacity>}
      </View>
      {error && <Text style={[errorStyle, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 56 },
  leftIcon: { marginRight: 12 },
  leftIconRTL: { marginRight: 0, marginLeft: 12 },
  input: { flex: 1, fontSize: 16 },
  error: { fontSize: 12, marginTop: 4, marginLeft: 4 },
  errorRTL: { marginLeft: 0, marginRight: 4 },
});

export default Input;
