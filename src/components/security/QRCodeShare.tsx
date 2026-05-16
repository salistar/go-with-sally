// ============================================================
// 📄 QRCodeShare.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[QRCodeShare.tsx] ▶ Module loaded')
//   • console.log('[QRCodeShare.tsx] ▶ QRCodeShare() rendered')
//   • console.log('[QRCodeShare.tsx] ▶ handleGenerateQR() called')
//   • console.log('[QRCodeShare.tsx] ▶ handleShare() called')
//   • console.log('[QRCodeShare.tsx] ▶ handleDownload() called')
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[QRCodeShare.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface QRCodeShareProps {
  tripId: string;
  driverName: string;
  driverPhone: string;
  onShare?: () => void;
}

const QRCodeShare: React.FC<QRCodeShareProps> = ({
  tripId,
  driverName,
  driverPhone,
  onShare,
}) => {
  console.log(`${FILE_NAME} ▶ QRCodeShare() rendered for trip: ${tripId}`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const qrViewRef = useRef(null);

  const handleGenerateQR = async () => {
    console.log(`${FILE_NAME} ▶ handleGenerateQR() called`);

    setIsLoading(true);

    try {
      // QR code data payload
      const qrData = JSON.stringify({
        tripId,
        driverName,
        driverPhone,
        timestamp: new Date().getTime(),
      });

      // Using a QR code generation service (you would need to integrate with a library)
      // For now, we'll create a mock QR code
      const encodedData = btoa(qrData);
      setQrCode(encodedData);

      Toast.show({
        type: 'success',
        text1: 'Code QR généré',
        text2: 'Code QR prêt à être partagé',
        position: 'bottom',
      });

      if (onShare) {
        onShare();
      }
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error generating QR code:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de générer le code QR',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    console.log(`${FILE_NAME} ▶ handleShare() called`);

    try {
      const message = `Parcourez avec Sally - Trajet ID: ${tripId}\nConducteur: ${driverName}\nTéléphone: ${driverPhone}`;

      await Share.share({
        message,
        title: 'Partager les détails du trajet',
      });
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error sharing:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de partager',
        position: 'bottom',
      });
    }
  };

  const handleDownload = async () => {
    console.log(`${FILE_NAME} ▶ handleDownload() called`);

    try {
      setIsLoading(true);

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 20px; text-align: center; }
              .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .qr-container { margin: 20px 0; }
              .info { text-align: left; margin-top: 20px; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">Code QR - Sally Ride Share</div>
            <div class="qr-container">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="white"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" font-size="12">${qrCode}</text>
              </svg>
            </div>
            <div class="info">
              <div class="info-row"><span class="label">ID Trajet:</span> ${tripId}</div>
              <div class="info-row"><span class="label">Conducteur:</span> ${driverName}</div>
              <div class="info-row"><span class="label">Téléphone:</span> ${driverPhone}</div>
              <div class="info-row"><span class="label">Date:</span> ${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html: htmlContent,
      });

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Code QR téléchargé',
        position: 'bottom',
      });
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error downloading:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de télécharger',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
          },
        ]}
      >
        Partager les détails du trajet
      </Text>

      {/* QR Code display placeholder */}
      <View
        ref={qrViewRef}
        style={[
          styles.qrContainer,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        {qrCode ? (
          <View style={styles.qrPlaceholder}>
            <MaterialCommunityIcons
              name="qrcode"
              size={80}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.qrText,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Code QR généré
            </Text>
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={60}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.qrPlaceholderText,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Code QR
            </Text>
          </View>
        )}
      </View>

      {/* Trip info */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.infoRow}>
          <Text
            style={[
              styles.infoLabel,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            Conducteur
          </Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {driverName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text
            style={[
              styles.infoLabel,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            Téléphone
          </Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {driverPhone}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text
            style={[
              styles.infoLabel,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            ID Trajet
          </Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            {tripId}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View
        style={[
          styles.actions,
          isRTL && styles.actionsRTL,
        ]}
      >
        <TouchableOpacity
          onPress={handleGenerateQR}
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
            <>
              <MaterialCommunityIcons name="qrcode" size={20} color="white" />
              <Text style={styles.buttonText}>Générer QR</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons name="share-variant" size={20} color="white" />
          <Text style={styles.buttonText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownload}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.primary,
            },
            isLoading && styles.buttonDisabled,
          ]}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="download" size={20} color="white" />
          <Text style={styles.buttonText}>Télécharger</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  qrContainer: {
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  qrText: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrPlaceholderText: {
    fontSize: 12,
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QRCodeShare;
