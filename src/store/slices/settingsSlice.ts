import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  language: 'fr' | 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: { push: boolean; email: boolean; sms: boolean; rideUpdates: boolean; promotions: boolean; };
}

const initialState: SettingsState = {
  language: 'fr',
  theme: 'system',
  notifications: { push: true, email: true, sms: false, rideUpdates: true, promotions: true },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'fr' | 'ar' | 'en'>) => { state.language = action.payload; },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => { state.theme = action.payload; },
    updateNotifications: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => { state.notifications = { ...state.notifications, ...action.payload }; },
  },
});

export const { setLanguage, setTheme, updateNotifications } = settingsSlice.actions;
export default settingsSlice.reducer;
