// ============================================================
// 📄 VehicleInfoScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[VehicleInfoScreen.tsx] ▶ Module loaded')
//   • console.log('[VehicleInfoScreen.tsx] ▶ VehicleInfoScreen() rendered')
//   • console.log('[VehicleInfoScreen.tsx] ▶ handleSaveVehicle() called')
//   • console.log('[VehicleInfoScreen.tsx] ▶ handleEditField() called')
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  I18nManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[VehicleInfoScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  seats: number;
  fuelType: string;
  insurance: string;
  insuranceExpiry: string;
}

const VehicleInfoScreen = () => {
  console.log(`${FILE_NAME} ▶ VehicleInfoScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: 'Renault',
    model: 'Dacia Logan',
    year: 2022,
    color: 'Blanc',
    licensePlate: 'AB-12345',
    vin: 'XXXXXXXXXXXXXXXXX',
    seats: 4,
    fuelType: 'Essence',
    insurance: 'CNIA Assurances',
    insuranceExpiry: '2025-12-31',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedInfo, setEditedInfo] = useState<VehicleInfo>(vehicleInfo);

  useFocusEffect(
    useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
    }, [])
  );

  const handleEditField = (field: keyof VehicleInfo, value: string | number) => {
    console.log(`${FILE_NAME} ▶ handleEditField() called for: ${field}`);

    setEditedInfo({
      ...editedInfo,
      [field]: value,
    });
  };

  const handleSaveVehicle = () => {
    console.log(`${FILE_NAME} ▶ handleSaveVehicle() called`);

    // Validation
    if (!editedInfo.make.trim() || !editedInfo.model.trim() || !editedInfo.licensePlate.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez remplir tous les champs obligatoires',
        position: 'bottom',
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setVehicleInfo(editedInfo);
      setIsEditing(false);
      setIsLoading(false);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Informations du véhicule mises à jour',
        position: 'bottom',
      });
    }, 1200);
  };

  const handleCancel = () => {
    setEditedInfo(vehicleInfo);
    setIsEditing(false);
  };

  const displayInfo = isEditing ? editedInfo : vehicleInfo;

  const fuelTypes = ['Essence', 'Diesel', 'Électrique', 'Hybride'];
  const colors = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge'];
  const insuranceCompanies = ['CNIA Assurances', 'Allianz Maroc', 'Axa Assurance', 'AIG', 'Autres'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('vehicle.title', 'Informations du véhicule')}
        </Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.headerAction}
        >
          <MaterialCommunityIcons
            name={isEditing ? 'close' : 'pencil'}
            size={24}
            color={isEditing ? '#F44336' : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Vehicle Image Section */}
        <View style={[styles.vehicleImageSection, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons
            name="car-side"
            size={80}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.vehicleModelText,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {displayInfo.make} {displayInfo.model}
          </Text>
          <Text
            style={[
              styles.vehicleYearText,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {displayInfo.year} • {displayInfo.color}
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {t('vehicle.basicInfo', 'Informations de base')}
          </Text>

          <View style={styles.formGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              Marque *
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.background,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="Renault"
                placeholderTextColor={theme.colors.textSecondary}
                value={editedInfo.make}
                onChangeText={value => handleEditField('make', value)}
              />
            ) : (
              <View
                style={[
                  styles.displayValue,
                  {
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {displayInfo.make}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              Modèle *
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.background,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="Dacia Logan"
                placeholderTextColor={theme.colors.textSecondary}
                value={editedInfo.model}
                onChangeText={value => handleEditField('model', value)}
              />
            ) : (
              <View
                style={[
                  styles.displayValue,
                  {
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {displayInfo.model}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.halfFormGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Année
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="2022"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={displayInfo.year.toString()}
                  onChangeText={value => handleEditField('year', parseInt(value))}
                  keyboardType="numeric"
                />
              ) : (
                <View
                  style={[
                    styles.displayValue,
                    {
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.displayText,
                      {
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {displayInfo.year}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.halfFormGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Couleur
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Blanc"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editedInfo.color}
                  onChangeText={value => handleEditField('color', value)}
                />
              ) : (
                <View
                  style={[
                    styles.displayValue,
                    {
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.displayText,
                      {
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {displayInfo.color}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* License & Insurance */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {t('vehicle.license', 'Immatriculation et assurance')}
          </Text>

          <View style={styles.formGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              Plaque d'immatriculation *
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.background,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="AB-12345"
                placeholderTextColor={theme.colors.textSecondary}
                value={editedInfo.licensePlate}
                onChangeText={value => handleEditField('licensePlate', value.toUpperCase())}
              />
            ) : (
              <View
                style={[
                  styles.displayValue,
                  {
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {displayInfo.licensePlate}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              Numéro VIN
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.background,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="VIN"
                placeholderTextColor={theme.colors.textSecondary}
                value={editedInfo.vin}
                onChangeText={value => handleEditField('vin', value.toUpperCase())}
              />
            ) : (
              <View
                style={[
                  styles.displayValue,
                  {
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {displayInfo.vin}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {t('vehicle.additional', 'Informations supplémentaires')}
          </Text>

          <View style={styles.row}>
            <View style={styles.halfFormGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Sièges
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="4"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={displayInfo.seats.toString()}
                  onChangeText={value => handleEditField('seats', parseInt(value))}
                  keyboardType="numeric"
                />
              ) : (
                <View
                  style={[
                    styles.displayValue,
                    {
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.displayText,
                      {
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {displayInfo.seats}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.halfFormGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Carburant
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Essence"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editedInfo.fuelType}
                  onChangeText={value => handleEditField('fuelType', value)}
                />
              ) : (
                <View
                  style={[
                    styles.displayValue,
                    {
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.displayText,
                      {
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {displayInfo.fuelType}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {isEditing && (
        <View
          style={[
            styles.actionButtons,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.background,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.background,
              },
            ]}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme.colors.text,
                },
              ]}
            >
              {t('common.cancel', 'Annuler')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveVehicle}
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary,
              },
              isLoading && styles.buttonDisabled,
            ]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonTextPrimary}>
                {t('common.save', 'Enregistrer')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  vehicleImageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    gap: 8,
  },
  vehicleModelText: {
    fontSize: 18,
    fontWeight: '700',
  },
  vehicleYearText: {
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfFormGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  displayValue: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  displayText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VehicleInfoScreen;
