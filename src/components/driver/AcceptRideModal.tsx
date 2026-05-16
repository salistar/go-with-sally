// ============================================================
// 📄 AcceptRideModal.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[AcceptRideModal.tsx] ▶ Module loaded')
//   • console.log('[AcceptRideModal.tsx] ▶ AcceptRideModal() rendered')
//   • console.log('[AcceptRideModal.tsx] ▶ handleConfirmAccept() called')
//   • console.log('[AcceptRideModal.tsx] ▶ handleCancel() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  I18nManager,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[AcceptRideModal.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

const screenWidth = Dimensions.get('window').width;

/**
 * Ride details interface
 */
interface RideDetails {
  id: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  distance: number;
  estimatedDuration: number;
  offeredPrice: number;
  passengerPhone?: string;
}

/**
 * AcceptRideModal Props
 */
interface AcceptRideModalProps {
  visible: boolean;
  rideDetails?: RideDetails;
  onConfirm?: (rideId: string) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

/**
 * AcceptRideModal Component
 * Modal confirmation for accepting a ride request
 */
const AcceptRideModal: React.FC<AcceptRideModalProps> = ({
  visible,
  rideDetails,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  console.log(`${FILE_NAME} ▶ AcceptRideModal() rendered with visible: ${visible}`);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmAccept = async () => {
    console.log(`${FILE_NAME} ▶ handleConfirmAccept() called for ride ${rideDetails?.id}`);

    if (!rideDetails) return;

    setIsConfirming(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm?.(rideDetails.id);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    console.log(`${FILE_NAME} ▶ handleCancel() called`);

    if (isConfirming) return;
    onCancel?.();
  };

  if (!rideDetails) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('driver.confirmRide', 'Confirmer l\'acceptation')}
            </Text>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isConfirming}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Ride Details */}
          <View style={styles.detailsSection}>
            {/* Passenger Info */}
            <View style={styles.passengerSection}>
              <View
                style={[
                  styles.passengerImage,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.passengerInfo}>
                <Text style={[styles.passengerName, { color: theme.colors.text }]}>
                  {rideDetails.passengerName}
                </Text>
                {rideDetails.passengerPhone && (
                  <TouchableOpacity style={styles.phoneRow}>
                    <MaterialCommunityIcons
                      name="phone"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={[styles.phoneText, { color: theme.colors.primary }]}>
                      {rideDetails.passengerPhone}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Route Info */}
            <View style={styles.routeSection}>
              <View style={styles.routeItem}>
                <MaterialCommunityIcons
                  name="map-marker-check"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.routeText}>
                  <Text
                    style={[
                      styles.routeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t('driver.pickup', 'Départ')}
                  </Text>
                  <Text
                    style={[
                      styles.routeAddress,
                      { color: theme.colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {rideDetails.pickupLocation}
                  </Text>
                </View>
              </View>

              {/* Connector */}
              <View style={styles.routeConnector}>
                <View
                  style={[
                    styles.connectorLine,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              </View>

              <View style={styles.routeItem}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.routeText}>
                  <Text
                    style={[
                      styles.routeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t('driver.dropoff', 'Destination')}
                  </Text>
                  <Text
                    style={[
                      styles.routeAddress,
                      { color: theme.colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {rideDetails.dropoffLocation}
                  </Text>
                </View>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailsCard}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
                  {rideDetails.distance.toFixed(1)} km
                </Text>
                <Text
                  style={[
                    styles.detailsLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('driver.distance', 'Distance')}
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
                  {rideDetails.estimatedDuration} min
                </Text>
                <Text
                  style={[
                    styles.detailsLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('driver.duration', 'Durée')}
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <MaterialCommunityIcons
                  name="cash"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={[styles.detailsValue, { color: theme.colors.text }]}>
                  {rideDetails.offeredPrice.toFixed(0)} MAD
                </Text>
                <Text
                  style={[
                    styles.detailsLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('driver.payment', 'Prix')}
                </Text>
              </View>
            </View>
          </View>

          {/* Important Notice */}
          <View style={[styles.noticeBox, { backgroundColor: `${theme.colors.primary}15` }]}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={[styles.noticeText, { color: theme.colors.text }]}>
              {t('driver.confirmRideNotice', 'En confirmant, vous vous engagez à effectuer ce trajet')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={handleCancel}
              disabled={isConfirming}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>
                {t('common.cancel', 'Annuler')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: theme.colors.primary },
                isConfirming && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirmAccept}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                  <Text style={styles.confirmBtnText}>
                    {t('driver.acceptRide', 'Accepter la course')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  passengerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeSection: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    gap: 12,
  },
  routeText: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  routeAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  routeConnector: {
    marginLeft: 20,
    marginVertical: 6,
  },
  connectorLine: {
    width: 2,
    height: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 4,
  },
  detailsLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  noticeBox: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AcceptRideModal;
