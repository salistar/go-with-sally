import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BaseToast = ({ type, text1, text2, onPress }: any) => {
  const colors: Record<string, string> = {
    success: '#4CAF50',
    error: '#F44336',
    info: '#2196F3',
    warning: '#FF9800',
    ride: '#FF69B4'
  };
  const icons: Record<string, string> = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'information',
    warning: 'alert',
    ride: 'car'
  };

  const color = colors[type] || '#333';
  const icon = icons[type] || 'information';

  return (
    <View style={[styles.container, { borderLeftColor: color }]} onTouchEnd={onPress}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  textContainer: { marginLeft: 12, flex: 1 },
  text1: { fontSize: 16, fontWeight: '600', color: '#333' },
  text2: { fontSize: 14, color: '#666', marginTop: 2 },
});

export const toastConfig = {
  success: (props: any) => <BaseToast {...props} type="success" />,
  error: (props: any) => <BaseToast {...props} type="error" />,
  info: (props: any) => <BaseToast {...props} type="info" />,
  warning: (props: any) => <BaseToast {...props} type="warning" />,
  ride: (props: any) => <BaseToast {...props} type="ride" />,
};
