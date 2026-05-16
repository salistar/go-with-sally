import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  colors: {
    primary: '#FF69B4',
    primaryDark: '#FF1493',
    primaryLight: '#FFB6C1',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    text: '#1A1A2E',
    textSecondary: '#666666',
    textLight: '#999999',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
};

const darkTheme = {
  colors: {
    primary: '#FF69B4',
    primaryDark: '#FF1493',
    primaryLight: '#FFB6C1',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textLight: '#808080',
    border: '#404040',
    error: '#CF6679',
    success: '#81C784',
    warning: '#FFB74D',
    info: '#64B5F6',
  },
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((stored) => {
      if (stored) setThemeModeState(stored as ThemeMode);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
