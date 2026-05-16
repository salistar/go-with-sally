/**
 * ============================================================================
 * GO WITH SALLY - RECEIPT SERVICE
 * ============================================================================
 * Service de génération et téléchargement de reçus PDF
 * 
 * Fonctionnalités:
 * - Génération PDF locale avec expo-print
 * - Téléchargement via API (mode online)
 * - Support des 3 modes (offline/hybrid/online)
 * - Partage via expo-sharing
 * - Sauvegarde locale avec expo-file-system
 * 
 * @module services/receiptService
 * @version 1.0.0
 * ============================================================================
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  API_URL,
  getModeEmoji,
} from '../config/appMode';

// ============================================================================
// TYPES
// ============================================================================

export interface RideData {
  rideId: string;
  pickup: {
    address: string;
    lat?: number;
    lng?: number;
  };
  destination: {
    address: string;
    lat?: number;
    lng?: number;
  };
  driver: {
    firstName: string;
    lastName?: string;
    rating?: number;
    photo?: string;
  };
  vehicle: {
    brand: string;
    model: string;
    plateNumber: string;
    color?: string;
  };
  fare: number;
  distance: string;
  duration: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'apple_pay' | 'google_pay';
  tip?: number;
  discount?: number;
  promoCode?: string | null;
  baseFare?: number;
  distanceFare?: number;
  timeFare?: number;
}

// Alias pour compatibilité
export type ReceiptData = RideData;

export interface ReceiptResult {
  success: boolean;
  filePath?: string;
  error?: string;
  mode: 'online' | 'offline' | 'hybrid';
}

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[ReceiptService]';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formate une date ISO en format lisible
 */
const formatDate = (isoDate: string, locale: string = 'fr'): string => {
  try {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-US' : 'fr-FR', options);
  } catch {
    return isoDate;
  }
};

/**
 * Formate une heure ISO en format lisible
 */
const formatTime = (isoDate: string, locale: string = 'fr'): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-US' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Obtient l'icône du mode de paiement
 */
const getPaymentMethodLabel = (method: string, locale: string = 'fr'): string => {
  const labels: Record<string, Record<string, string>> = {
    cash: { fr: 'Espèces', en: 'Cash', ar: 'نقداً' },
    card: { fr: 'Carte bancaire', en: 'Credit Card', ar: 'بطاقة بنكية' },
    wallet: { fr: 'Portefeuille Sally', en: 'Sally Wallet', ar: 'محفظة سالي' },
    apple_pay: { fr: 'Apple Pay', en: 'Apple Pay', ar: 'Apple Pay' },
    google_pay: { fr: 'Google Pay', en: 'Google Pay', ar: 'Google Pay' },
  };
  return labels[method]?.[locale] || method;
};

/**
 * Obtient les labels traduits
 */
const getLabels = (locale: string = 'fr') => {
  const translations: Record<string, Record<string, string>> = {
    fr: {
      title: 'Reçu de course',
      rideId: 'ID de course',
      tripSummary: 'Résumé du trajet',
      from: 'Départ',
      to: 'Destination',
      date: 'Date',
      time: 'Heure',
      distance: 'Distance',
      duration: 'Durée',
      fareBreakdown: 'Détail du tarif',
      baseFare: 'Tarif de base',
      distanceFare: 'Tarif distance',
      timeFare: 'Tarif temps',
      tip: 'Pourboire',
      discount: 'Réduction',
      total: 'Total',
      paymentMethod: 'Mode de paiement',
      driver: 'Conductrice',
      vehicle: 'Véhicule',
      plateNumber: 'Immatriculation',
      thankYou: 'Merci d\'avoir voyagé avec Sally !',
      generatedOn: 'Généré le',
      currency: 'DH',
    },
    en: {
      title: 'Trip Receipt',
      rideId: 'Ride ID',
      tripSummary: 'Trip Summary',
      from: 'Pickup',
      to: 'Destination',
      date: 'Date',
      time: 'Time',
      distance: 'Distance',
      duration: 'Duration',
      fareBreakdown: 'Fare Breakdown',
      baseFare: 'Base Fare',
      distanceFare: 'Distance Fare',
      timeFare: 'Time Fare',
      tip: 'Tip',
      discount: 'Discount',
      total: 'Total',
      paymentMethod: 'Payment Method',
      driver: 'Driver',
      vehicle: 'Vehicle',
      plateNumber: 'Plate Number',
      thankYou: 'Thank you for riding with Sally!',
      generatedOn: 'Generated on',
      currency: 'MAD',
    },
    ar: {
      title: 'إيصال الرحلة',
      rideId: 'رقم الرحلة',
      tripSummary: 'ملخص الرحلة',
      from: 'نقطة الانطلاق',
      to: 'الوجهة',
      date: 'التاريخ',
      time: 'الوقت',
      distance: 'المسافة',
      duration: 'المدة',
      fareBreakdown: 'تفاصيل الأجرة',
      baseFare: 'الأجرة الأساسية',
      distanceFare: 'أجرة المسافة',
      timeFare: 'أجرة الوقت',
      tip: 'إكرامية',
      discount: 'خصم',
      total: 'المجموع',
      paymentMethod: 'طريقة الدفع',
      driver: 'السائقة',
      vehicle: 'المركبة',
      plateNumber: 'رقم اللوحة',
      thankYou: 'شكراً لاستخدامك سالي!',
      generatedOn: 'تم الإنشاء في',
      currency: 'درهم',
    },
  };
  return translations[locale] || translations.fr;
};

// ============================================================================
// HTML TEMPLATE
// ============================================================================

/**
 * Génère le HTML du reçu pour impression PDF
 */
const generateReceiptHTML = (data: RideData, locale: string = 'fr'): string => {
  const labels = getLabels(locale);
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  // Calcul des tarifs
  const baseFare = Math.round(data.fare * 0.6);
  const distanceFare = Math.round(data.fare * 0.3);
  const timeFare = data.fare - baseFare - distanceFare;
  const tip = data.tip || 0;
  const discount = data.discount || 0;
  const subtotal = data.fare;
  const total = subtotal + tip - discount;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title} - ${data.rideId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      direction: ${direction};
      text-align: ${textAlign};
    }
    
    .receipt {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #FF69B4, #FF1493);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .logo-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
    
    .header-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .ride-id {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .total-amount {
      font-size: 36px;
      font-weight: bold;
      margin-top: 15px;
    }
    
    .section {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #FF1493;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .route {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .route-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }
    
    .route-dot.pickup {
      background: #4CAF50;
    }
    
    .route-dot.destination {
      background: #FF1493;
    }
    
    .route-line {
      width: 2px;
      height: 20px;
      background: #ddd;
      margin-${isRTL ? 'right' : 'left'}: 5px;
    }
    
    .route-text {
      font-size: 14px;
      color: #333;
      flex: 1;
    }
    
    .route-label {
      font-size: 11px;
      color: #999;
      margin-bottom: 2px;
    }
    
    .stats-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 15px;
    }
    
    .stat {
      flex: 1;
      text-align: center;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 10px;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: #333;
    }
    
    .stat-label {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }
    
    .fare-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dashed #eee;
    }
    
    .fare-row:last-child {
      border-bottom: none;
    }
    
    .fare-row.total {
      border-top: 2px solid #333;
      border-bottom: none;
      margin-top: 10px;
      padding-top: 15px;
    }
    
    .fare-label {
      font-size: 14px;
      color: #666;
    }
    
    .fare-value {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .fare-row.total .fare-label,
    .fare-row.total .fare-value {
      font-size: 18px;
      font-weight: 700;
      color: #FF1493;
    }
    
    .fare-row.discount .fare-value {
      color: #4CAF50;
    }
    
    .driver-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .driver-avatar {
      width: 50px;
      height: 50px;
      border-radius: 15px;
      background: linear-gradient(135deg, #FF69B4, #FF1493);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: bold;
    }
    
    .driver-details {
      flex: 1;
    }
    
    .driver-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .driver-rating {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }
    
    .vehicle-info {
      margin-top: 15px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 10px;
    }
    
    .vehicle-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .vehicle-plate {
      font-size: 14px;
      font-weight: 700;
      color: #FF1493;
      margin-top: 4px;
    }
    
    .payment-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      background: #f0fff0;
      border-radius: 10px;
    }
    
    .payment-icon {
      font-size: 24px;
    }
    
    .payment-text {
      font-size: 14px;
      color: #333;
    }
    
    .payment-status {
      font-size: 12px;
      color: #4CAF50;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding: 25px 20px;
      background: #fafafa;
    }
    
    .thank-you {
      font-size: 16px;
      color: #FF1493;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .generated {
      font-size: 11px;
      color: #999;
    }
    
    .brand {
      margin-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #FF1493;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="logo-icon">🚗</div>
      <div class="logo">Go With Sally</div>
      <div class="header-title">${labels.title}</div>
      <div class="ride-id">${labels.rideId}: ${data.rideId}</div>
      <div class="total-amount">${total} ${labels.currency}</div>
    </div>
    
    <!-- Trip Summary -->
    <div class="section">
      <div class="section-title">${labels.tripSummary}</div>
      <div class="route">
        <div class="route-point">
          <div class="route-dot pickup"></div>
          <div>
            <div class="route-label">${labels.from}</div>
            <div class="route-text">${data.pickup.address}</div>
          </div>
        </div>
        <div class="route-line"></div>
        <div class="route-point">
          <div class="route-dot destination"></div>
          <div>
            <div class="route-label">${labels.to}</div>
            <div class="route-text">${data.destination.address}</div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">${formatDate(data.date, locale)}</div>
          <div class="stat-label">${labels.date}</div>
        </div>
        <div class="stat">
          <div class="stat-value">${formatTime(data.date, locale)}</div>
          <div class="stat-label">${labels.time}</div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">${data.distance}</div>
          <div class="stat-label">${labels.distance}</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.duration}</div>
          <div class="stat-label">${labels.duration}</div>
        </div>
      </div>
    </div>
    
    <!-- Fare Breakdown -->
    <div class="section">
      <div class="section-title">${labels.fareBreakdown}</div>
      
      <div class="fare-row">
        <span class="fare-label">${labels.baseFare}</span>
        <span class="fare-value">${baseFare} ${labels.currency}</span>
      </div>
      
      <div class="fare-row">
        <span class="fare-label">${labels.distanceFare}</span>
        <span class="fare-value">${distanceFare} ${labels.currency}</span>
      </div>
      
      <div class="fare-row">
        <span class="fare-label">${labels.timeFare}</span>
        <span class="fare-value">${timeFare} ${labels.currency}</span>
      </div>
      
      ${tip > 0 ? `
      <div class="fare-row">
        <span class="fare-label">${labels.tip}</span>
        <span class="fare-value">+${tip} ${labels.currency}</span>
      </div>
      ` : ''}
      
      ${discount > 0 ? `
      <div class="fare-row discount">
        <span class="fare-label">${labels.discount}${data.promoCode ? ` (${data.promoCode})` : ''}</span>
        <span class="fare-value">-${discount} ${labels.currency}</span>
      </div>
      ` : ''}
      
      <div class="fare-row total">
        <span class="fare-label">${labels.total}</span>
        <span class="fare-value">${total} ${labels.currency}</span>
      </div>
    </div>
    
    <!-- Driver Info -->
    <div class="section">
      <div class="section-title">${labels.driver}</div>
      
      <div class="driver-info">
        <div class="driver-avatar">
          ${data.driver.firstName.charAt(0).toUpperCase()}
        </div>
        <div class="driver-details">
          <div class="driver-name">${data.driver.firstName} ${data.driver.lastName ? data.driver.lastName.charAt(0) + '.' : ''}</div>
          <div class="driver-rating">⭐ ${data.driver.rating || 4.9}</div>
        </div>
      </div>
      
      <div class="vehicle-info">
        <div class="vehicle-name">${data.vehicle.brand} ${data.vehicle.model}${data.vehicle.color ? ` - ${data.vehicle.color}` : ''}</div>
        <div class="vehicle-plate">${data.vehicle.plateNumber}</div>
      </div>
    </div>
    
    <!-- Payment -->
    <div class="section">
      <div class="section-title">${labels.paymentMethod}</div>
      
      <div class="payment-info">
        <span class="payment-icon">
          ${data.paymentMethod === 'cash' ? '💵' : data.paymentMethod === 'card' ? '💳' : '👛'}
        </span>
        <div>
          <div class="payment-text">${getPaymentMethodLabel(data.paymentMethod, locale)}</div>
          <div class="payment-status">✓ ${locale === 'ar' ? 'تم الدفع' : locale === 'en' ? 'Paid' : 'Payé'}</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="thank-you">${labels.thankYou}</div>
      <div class="generated">${labels.generatedOn} ${formatDate(new Date().toISOString(), locale)}</div>
      <div class="brand">💖 Go With Sally</div>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

class ReceiptService {
  private static instance: ReceiptService;

  private constructor() {
    console.log(`${FILE_NAME} 🧾 Service initialisé`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
  }

  public static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  // ==========================================================================
  // GÉNÉRATION PDF LOCALE
  // ==========================================================================

  /**
   * Génère un PDF localement avec expo-print
   */
  private async generatePDFLocal(data: RideData, locale: string = 'fr'): Promise<string> {
    console.log(`${FILE_NAME} 📄 Génération PDF locale...`);

    const html = generateReceiptHTML(data, locale);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log(`${FILE_NAME} ✅ PDF généré: ${uri}`);

    // Renommer le fichier avec un nom significatif
    const fileName = `Sally_Receipt_${data.rideId}_${Date.now()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    console.log(`${FILE_NAME} 📁 PDF sauvegardé: ${newUri}`);

    return newUri;
  }

  // ==========================================================================
  // TÉLÉCHARGEMENT VIA API
  // ==========================================================================

  /**
   * Télécharge le PDF via l'API backend
   */
  private async downloadPDFFromAPI(rideId: string): Promise<string> {
    console.log(`${FILE_NAME} 🌐 Téléchargement PDF depuis l'API...`);

    const url = `${API_URL}/api/rides/${rideId}/receipt`;
    const fileName = `Sally_Receipt_${rideId}_${Date.now()}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        // Ajouter le token d'auth si nécessaire
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (downloadResult.status !== 200) {
      throw new Error(`Erreur HTTP: ${downloadResult.status}`);
    }

    console.log(`${FILE_NAME} ✅ PDF téléchargé depuis l'API: ${fileUri}`);

    return fileUri;
  }

  // ==========================================================================
  // MÉTHODE PRINCIPALE - DOWNLOAD
  // ==========================================================================

  /**
   * Télécharge le reçu selon le mode actif
   */
  public async downloadReceipt(
    data: RideData,
    locale: string = 'fr'
  ): Promise<ReceiptResult> {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 📥 Téléchargement reçu - Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🆔 Ride ID: ${data.rideId}`);
    console.log(`${FILE_NAME} 🌍 Locale: ${locale}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    try {
      let filePath: string;

      if (IS_OFFLINE) {
        // =====================================================================
        // MODE OFFLINE - Génération locale uniquement
        // =====================================================================
        console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Génération locale`);
        filePath = await this.generatePDFLocal(data, locale);

        return {
          success: true,
          filePath,
          mode: 'offline',
        };
      } else if (IS_HYBRID) {
        // =====================================================================
        // MODE HYBRID - Tentative API avec fallback local
        // =====================================================================
        console.log(`${FILE_NAME} 🟡 Mode HYBRID - Tentative API...`);

        try {
          filePath = await this.downloadPDFFromAPI(data.rideId);
          console.log(`${FILE_NAME} ✅ API success`);

          return {
            success: true,
            filePath,
            mode: 'hybrid',
          };
        } catch (apiError: any) {
          console.log(`${FILE_NAME} ⚠️ API failed, fallback local`);
          console.log(`${FILE_NAME} Erreur: ${apiError.message}`);

          filePath = await this.generatePDFLocal(data, locale);

          return {
            success: true,
            filePath,
            mode: 'hybrid',
          };
        }
      } else {
        // =====================================================================
        // MODE ONLINE - API uniquement
        // =====================================================================
        console.log(`${FILE_NAME} 🟢 Mode ONLINE - API uniquement`);

        try {
          filePath = await this.downloadPDFFromAPI(data.rideId);

          return {
            success: true,
            filePath,
            mode: 'online',
          };
        } catch (apiError: any) {
          console.error(`${FILE_NAME} ❌ API error:`, apiError.message);

          // En mode online, on peut quand même faire un fallback local
          // pour une meilleure UX
          console.log(`${FILE_NAME} ⚠️ Fallback sur génération locale`);
          filePath = await this.generatePDFLocal(data, locale);

          return {
            success: true,
            filePath,
            mode: 'online',
          };
        }
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error.message);

      return {
        success: false,
        error: error.message,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    }
  }

  // ==========================================================================
  // PARTAGE
  // ==========================================================================

  /**
   * Génère et partage le fichier PDF
   */
  public async shareReceipt(data: RideData, locale: string = 'fr'): Promise<ReceiptResult> {
    console.log(`${FILE_NAME} 📤 Partage du reçu...`);

    try {
      // D'abord générer le PDF
      const downloadResult = await this.downloadReceipt(data, locale);
      
      if (!downloadResult.success || !downloadResult.filePath) {
        return {
          success: false,
          error: downloadResult.error || 'Erreur génération PDF',
          mode: downloadResult.mode,
        };
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        console.error(`${FILE_NAME} ❌ Partage non disponible`);
        return {
          success: false,
          error: 'Partage non disponible sur cet appareil',
          mode: downloadResult.mode,
        };
      }

      await Sharing.shareAsync(downloadResult.filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager le reçu',
        UTI: 'com.adobe.pdf',
      });

      console.log(`${FILE_NAME} ✅ Reçu partagé`);
      return {
        success: true,
        filePath: downloadResult.filePath,
        mode: downloadResult.mode,
      };
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur partage:`, error.message);
      return {
        success: false,
        error: error.message,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    }
  }

  // ==========================================================================
  // EMAIL
  // ==========================================================================

  /**
   * Envoie le reçu par email selon le mode actif
   */
  public async emailReceipt(
    data: RideData,
    locale: string = 'fr'
  ): Promise<ReceiptResult> {
    console.log(`${FILE_NAME} 📧 Envoi par email...`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);

    try {
      if (IS_OFFLINE) {
        // =====================================================================
        // MODE OFFLINE - Génère PDF et ouvre le client mail avec pièce jointe
        // =====================================================================
        console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Ouverture client mail local`);
        
        // Générer le PDF d'abord
        const downloadResult = await this.downloadReceipt(data, locale);
        
        if (!downloadResult.success || !downloadResult.filePath) {
          return {
            success: false,
            error: 'Impossible de générer le PDF',
            mode: 'offline',
          };
        }

        // Partager le PDF via le système (qui permet d'ouvrir mail)
        await Sharing.shareAsync(downloadResult.filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Envoyer par email',
          UTI: 'com.adobe.pdf',
        });

        return {
          success: true,
          filePath: downloadResult.filePath,
          mode: 'offline',
        };
      } else if (IS_HYBRID) {
        // =====================================================================
        // MODE HYBRID - Tentative API avec fallback local
        // =====================================================================
        console.log(`${FILE_NAME} 🟡 Mode HYBRID - Tentative API...`);

        try {
          const response = await fetch(`${API_URL}/api/rides/${data.rideId}/receipt/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locale }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          console.log(`${FILE_NAME} ✅ Email envoyé via API`);
          return {
            success: true,
            mode: 'hybrid',
          };
        } catch (apiError: any) {
          console.log(`${FILE_NAME} ⚠️ API failed, fallback local`);
          
          // Fallback: générer PDF et partager
          const downloadResult = await this.downloadReceipt(data, locale);
          
          if (downloadResult.success && downloadResult.filePath) {
            await Sharing.shareAsync(downloadResult.filePath, {
              mimeType: 'application/pdf',
              dialogTitle: 'Envoyer par email',
              UTI: 'com.adobe.pdf',
            });
          }

          return {
            success: true,
            filePath: downloadResult.filePath,
            mode: 'hybrid',
          };
        }
      } else {
        // =====================================================================
        // MODE ONLINE - API uniquement
        // =====================================================================
        console.log(`${FILE_NAME} 🟢 Mode ONLINE - API`);

        try {
          const response = await fetch(`${API_URL}/api/rides/${data.rideId}/receipt/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locale }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          console.log(`${FILE_NAME} ✅ Email envoyé via API`);
          return {
            success: true,
            mode: 'online',
          };
        } catch (apiError: any) {
          console.error(`${FILE_NAME} ❌ API error:`, apiError.message);
          
          // Fallback local même en mode online pour meilleure UX
          const downloadResult = await this.downloadReceipt(data, locale);
          
          if (downloadResult.success && downloadResult.filePath) {
            await Sharing.shareAsync(downloadResult.filePath, {
              mimeType: 'application/pdf',
              dialogTitle: 'Envoyer par email',
              UTI: 'com.adobe.pdf',
            });
            
            return {
              success: true,
              filePath: downloadResult.filePath,
              mode: 'online',
            };
          }

          return {
            success: false,
            error: apiError.message,
            mode: 'online',
          };
        }
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur email:`, error.message);
      return {
        success: false,
        error: error.message,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    }
  }

  // ==========================================================================
  // IMPRESSION
  // ==========================================================================

  /**
   * Imprime le reçu (fonctionne dans tous les modes car local)
   */
  public async printReceipt(data: RideData, locale: string = 'fr'): Promise<ReceiptResult> {
    console.log(`${FILE_NAME} 🖨️ Impression du reçu...`);

    try {
      const html = generateReceiptHTML(data, locale);
      await Print.printAsync({ html });

      console.log(`${FILE_NAME} ✅ Impression lancée`);
      return {
        success: true,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur impression:`, error.message);
      return {
        success: false,
        error: error.message,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    }
  }

  // ==========================================================================
  // PRÉVISUALISATION
  // ==========================================================================

  /**
   * Prévisualise le reçu (génère et ouvre le PDF)
   */
  public async previewReceipt(data: RideData, locale: string = 'fr'): Promise<ReceiptResult> {
    console.log(`${FILE_NAME} 👁️ Prévisualisation...`);

    try {
      // Génère le PDF
      const result = await this.downloadReceipt(data, locale);
      
      if (!result.success || !result.filePath) {
        return {
          success: false,
          error: result.error || 'Erreur génération',
          mode: result.mode,
        };
      }

      // Ouvre le PDF pour prévisualisation
      await Sharing.shareAsync(result.filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Prévisualisation du reçu',
        UTI: 'com.adobe.pdf',
      });

      console.log(`${FILE_NAME} ✅ Prévisualisation ouverte`);
      return {
        success: true,
        filePath: result.filePath,
        mode: result.mode,
      };
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur preview:`, error.message);
      return {
        success: false,
        error: error.message,
        mode: IS_OFFLINE ? 'offline' : IS_HYBRID ? 'hybrid' : 'online',
      };
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const receiptService = ReceiptService.getInstance();

export default receiptService;