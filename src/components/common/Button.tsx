import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, I18nManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, loading = false, disabled = false, variant = 'primary', size = 'medium', icon, style, textStyle }) => {
  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const buttonStyles = {
    primary: { backgroundColor: theme.colors.primary, borderWidth: 0 },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary },
    ghost: { backgroundColor: 'transparent', borderWidth: 0 },
  };

  const textColors = { primary: 'white', outline: theme.colors.primary, ghost: theme.colors.primary };
  const sizes = { small: { paddingVertical: 8, paddingHorizontal: 16 }, medium: { paddingVertical: 14, paddingHorizontal: 24 }, large: { paddingVertical: 18, paddingHorizontal: 32 } };
  const fontSizes = { small: 14, medium: 16, large: 18 };

  const iconStyle = isRTL ? [styles.icon, styles.iconRTL] : styles.icon;

  return (
    <TouchableOpacity style={[styles.button, buttonStyles[variant], sizes[size], disabled && styles.disabled, style]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={textColors[variant]} /> : (
        <>
          {icon && <MaterialCommunityIcons name={icon as any} size={fontSizes[size] + 4} color={textColors[variant]} style={iconStyle} />}
          <Text style={[styles.text, { color: textColors[variant], fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  text: { fontWeight: '600' },
  icon: { marginRight: 8 },
  iconRTL: { marginRight: 0, marginLeft: 8 },
  disabled: { opacity: 0.5 },
});

export default Button;
