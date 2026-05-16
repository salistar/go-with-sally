// ============================================================
// 📄 RideRequestForm.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[RideRequestForm.tsx] ▶ Module loaded')
//   • console.log('[RideRequestForm.tsx] ▶ RideRequestForm() rendered')
//   • console.log('[RideRequestForm.tsx] ▶ handleLocationPress() called')
//   • console.log('[RideRequestForm.tsx] ▶ handleDateChange() called')
//   • console.log('[RideRequestForm.tsx] ▶ handlePriceChange() called')
//   • console.log('[RideRequestForm.tsx] ▶ handleSubmit() called')
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetime-picker';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[RideRequestForm.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Ride request interface
 */
interface RideRequest {
  pickupLocation: string;
  dropoffLocation: string;
  date: Date;
  time: Date;
  estimatedPrice?: number;
  notes?: string;
}

/**
 * RideRequestForm Props
 */
interface RideRequestFormProps {
  onSubmit: (rideRequest: RideRequest) => void;
  onLocationChange?: (location: 'pickup' | 'dropoff') => void;
  isLoading?: boolean;
}

/**
 * RideRequestForm Component
 * Form for creating a new ride request with autocomplete
 */
const RideRequestForm: React.FC<RideRequestFormProps> = ({
  onSubmit,
  onLocationChange,
  isLoading = false,
}) => {
  console.log(`${FILE_NAME} ▶ RideRequestForm() rendered`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [rideRequest, setRideRequest] = useState<RideRequest>({
    pickupLocation: '',
    dropoffLocation: '',
    date: new Date(),
    time: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestions, setActiveSuggestions] = useState<'pickup' | 'dropoff' | null>(null);

  const mockSuggestions = [
    'Avenue Hassan II, Casablanca',
    'Centre Commercial, Rabat',
    'Gare ONCF, Fès',
    'Aéroport International',
    'Hôpital Ibn Sina',
  ];

  const handleLocationPress = (type: 'pickup' | 'dropoff') => {
    console.log(`${FILE_NAME} ▶ handleLocationPress() called for ${type}`);
    setActiveSuggestions(type);
    setSuggestions(mockSuggestions);
    onLocationChange?.(type);
  };

  const handleLocationChange = (text: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setRideRequest(prev => ({ ...prev, pickupLocation: text }));
    } else {
      setRideRequest(prev => ({ ...prev, dropoffLocation: text }));
    }

    // Filter suggestions
    if (text.length > 0) {
      const filtered = mockSuggestions.filter(s =>
        s.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (location: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setRideRequest(prev => ({ ...prev, pickupLocation: location }));
    } else {
      setRideRequest(prev => ({ ...prev, dropoffLocation: location }));
    }
    setActiveSuggestions(null);
    setSuggestions([]);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log(`${FILE_NAME} ▶ handleDateChange() called`);

    if (selectedDate) {
      setRideRequest(prev => ({ ...prev, date: selectedDate }));
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    console.log(`${FILE_NAME} ▶ handleTimeChange() called`);

    if (selectedTime) {
      setRideRequest(prev => ({ ...prev, time: selectedTime }));
    }
    setShowTimePicker(false);
  };

  const handlePriceChange = (price: string) => {
    console.log(`${FILE_NAME} ▶ handlePriceChange() called with price: ${price}`);

    const numPrice = parseFloat(price) || 0;
    setRideRequest(prev => ({ ...prev, estimatedPrice: numPrice }));
  };

  const handleSubmit = () => {
    console.log(`${FILE_NAME} ▶ handleSubmit() called`);

    if (!rideRequest.pickupLocation || !rideRequest.dropoffLocation) {
      return;
    }

    onSubmit(rideRequest);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        style={styles.form}
        scrollEnabled={activeSuggestions !== null}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pickup Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('ride.pickupLocation', 'Lieu de départ')}
          </Text>
          <TouchableOpacity
            style={[styles.locationInput, { backgroundColor: theme.colors.background }]}
            onPress={() => handleLocationPress('pickup')}
          >
            <MaterialCommunityIcons
              name="map-marker-check"
              size={20}
              color={theme.colors.primary}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, flex: 1 }]}
              placeholder={t('ride.enterPickupLocation', 'Entrez votre point de départ')}
              placeholderTextColor={theme.colors.textSecondary}
              value={rideRequest.pickupLocation}
              onChangeText={text => handleLocationChange(text, 'pickup')}
              onFocus={() => setActiveSuggestions('pickup')}
              editable={!isLoading}
            />
            {rideRequest.pickupLocation && (
              <TouchableOpacity
                onPress={() => setRideRequest(prev => ({ ...prev, pickupLocation: '' }))}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Suggestions */}
          {activeSuggestions === 'pickup' && suggestions.length > 0 && (
            <View style={[styles.suggestions, { backgroundColor: theme.colors.background }]}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(suggestion, 'pickup')}
                >
                  <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
                  <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Dropoff Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('ride.dropoffLocation', 'Lieu de destination')}
          </Text>
          <TouchableOpacity
            style={[styles.locationInput, { backgroundColor: theme.colors.background }]}
            onPress={() => handleLocationPress('dropoff')}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={theme.colors.primary}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, flex: 1 }]}
              placeholder={t('ride.enterDropoffLocation', 'Entrez votre destination')}
              placeholderTextColor={theme.colors.textSecondary}
              value={rideRequest.dropoffLocation}
              onChangeText={text => handleLocationChange(text, 'dropoff')}
              onFocus={() => setActiveSuggestions('dropoff')}
              editable={!isLoading}
            />
            {rideRequest.dropoffLocation && (
              <TouchableOpacity
                onPress={() => setRideRequest(prev => ({ ...prev, dropoffLocation: '' }))}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Suggestions */}
          {activeSuggestions === 'dropoff' && suggestions.length > 0 && (
            <View style={[styles.suggestions, { backgroundColor: theme.colors.background }]}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(suggestion, 'dropoff')}
                >
                  <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
                  <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeInput, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateTimeValue, { color: theme.colors.text }]}>
                {formatDate(rideRequest.date)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateTimeInput, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowTimePicker(true)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="clock" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateTimeValue, { color: theme.colors.text }]}>
                {formatTime(rideRequest.time)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estimated Price */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('ride.estimatedPrice', 'Prix estimé (MAD)')}
          </Text>
          <View style={[styles.locationInput, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="cash" size={20} color={theme.colors.primary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text, flex: 1 }]}
              placeholder={t('ride.enterPrice', 'Entrez le prix')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              value={rideRequest.estimatedPrice?.toString() || ''}
              onChangeText={handlePriceChange}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('ride.notes', 'Notes')}
          </Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            placeholder={t('ride.notesPlaceholder', 'Remarques spéciales...')}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            value={rideRequest.notes || ''}
            onChangeText={text => setRideRequest(prev => ({ ...prev, notes: text }))}
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: theme.colors.primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={isLoading || !rideRequest.pickupLocation || !rideRequest.dropoffLocation}
      >
        <Text style={styles.submitBtnText}>
          {t('ride.requestRide', 'Demander une course')}
        </Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={rideRequest.date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={rideRequest.time}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  input: {
    fontSize: 14,
  },
  suggestions: {
    marginTop: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  suggestionText: {
    fontSize: 13,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  notesInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RideRequestForm;
