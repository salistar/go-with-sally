// ============================================================
// 📄 paymentService.ts — GoWithSally
// LOG SUMMARY:
//   • console.log('[paymentService.ts] ▶ Module loaded')
//   • console.log('[paymentService.ts] ▶ initialize() called')
//   • console.log('[paymentService.ts] ▶ getWallet() called')
//   • console.log('[paymentService.ts] ▶ topUpWallet() called')
//   • console.log('[paymentService.ts] ▶ processPayment() called')
//   • console.log('[paymentService.ts] ▶ getTransactionHistory() called')
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletAPI, transactionAPI, paymentAPI } from './api';

const FILE_NAME = '[paymentService.ts]';
console.log(`${FILE_NAME} ▶ Module loaded`);

// ==================== TYPES ====================

export interface Wallet {
  balance: number;
  currency: string;
  lastTopUp?: string;
  totalTopUps: number;
  totalSpent: number;
}

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'wallet' | 'apple_pay' | 'google_pay';
  isDefault: boolean;
  lastDigits?: string;
  holderName?: string;
}

export interface Transaction {
  _id: string;
  type: 'topup' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  paymentMethod?: string;
  rideId?: string;
  createdAt: string;
}

export interface TopUpRequest {
  amount: number;
  paymentMethod: string;
  currency: string;
}

export interface TopUpResponse {
  success: boolean;
  transactionId: string;
  newBalance: number;
  amount: number;
  timestamp: string;
  error?: string;
}

export interface PaymentRequest {
  rideId: string;
  amount: number;
  paymentMethod: string;
  currency: string;
}

// ==================== SERVICE ====================

class PaymentService {
  private cachedWallet: Wallet | null = null;
  private cachedMethods: PaymentMethod[] = [];
  private lastWalletFetch: number = 0;
  private cacheTimeout: number = 60000; // 1 minute

  // ==================== INITIALIZATION ====================

  async initialize(): Promise<void> {
    console.log(`${FILE_NAME} ▶ initialize() called`);

    try {
      const cached = await AsyncStorage.getItem('payment_service_wallet');
      if (cached) {
        this.cachedWallet = JSON.parse(cached);
        console.log(`${FILE_NAME} ✓ Wallet loaded from cache: ${this.cachedWallet?.balance}`);
      }

      const cachedMethods = await AsyncStorage.getItem('payment_methods');
      if (cachedMethods) {
        this.cachedMethods = JSON.parse(cachedMethods);
        console.log(`${FILE_NAME} ✓ Payment methods loaded: ${this.cachedMethods.length} methods`);
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Initialization error:`, error);
    }
  }

  // ==================== WALLET ====================

  async getWallet(): Promise<Wallet | null> {
    console.log(`${FILE_NAME} ▶ getWallet() called`);

    try {
      // Check cache validity
      const now = Date.now();
      if (this.cachedWallet && now - this.lastWalletFetch < this.cacheTimeout) {
        console.log(`${FILE_NAME} ✓ Returning cached wallet`);
        return this.cachedWallet;
      }

      const response = await walletAPI.getWallet();
      if (response.success && response.data) {
        const wallet = response.data.wallet;
        this.cachedWallet = wallet;
        this.lastWalletFetch = now;

        // Cache to AsyncStorage
        await AsyncStorage.setItem('payment_service_wallet', JSON.stringify(wallet));

        console.log(`${FILE_NAME} ✓ Wallet fetched: ${wallet.balance} ${wallet.currency}`);
        return wallet;
      } else {
        console.error(`${FILE_NAME} ✗ Failed to fetch wallet: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in getWallet():`, error);
      return this.cachedWallet;
    }
  }

  // ==================== TOP UP ====================

  async topUpWallet(amount: number, paymentMethod: string): Promise<TopUpResponse | null> {
    console.log(`${FILE_NAME} ▶ topUpWallet() called with amount: ${amount}, method: ${paymentMethod}`);

    try {
      const response = await walletAPI.topUpWallet(amount, paymentMethod);

      if (response.success && response.data) {
        const result = response.data;
        console.log(`${FILE_NAME} ✓ Top-up successful: transaction ${result.transactionId}`);

        // Update local cache
        if (this.cachedWallet) {
          this.cachedWallet.balance = result.newBalance;
          this.cachedWallet.lastTopUp = new Date().toISOString();
          this.cachedWallet.totalTopUps += result.amount;
          await AsyncStorage.setItem('payment_service_wallet', JSON.stringify(this.cachedWallet));
        }

        return {
          success: true,
          transactionId: result.transactionId,
          newBalance: result.newBalance,
          amount: result.amount,
          timestamp: result.timestamp,
        };
      } else {
        console.error(`${FILE_NAME} ✗ Top-up failed: ${response.error}`);
        return {
          success: false,
          transactionId: '',
          newBalance: 0,
          amount: 0,
          timestamp: '',
          error: response.error || 'Top-up failed',
        };
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in topUpWallet():`, error);
      return {
        success: false,
        transactionId: '',
        newBalance: 0,
        amount: 0,
        timestamp: '',
        error: 'Network error',
      };
    }
  }

  // ==================== PAYMENT ====================

  async processPayment(rideId: string, amount: number, paymentMethod: string): Promise<boolean> {
    console.log(`${FILE_NAME} ▶ processPayment() called for ride: ${rideId}, amount: ${amount}`);

    try {
      const currency = this.cachedWallet?.currency || 'MAD';
      const response = await paymentAPI.initiatePayment({
        rideId,
        amount,
        paymentMethod,
        currency,
      });

      if (response.success) {
        console.log(`${FILE_NAME} ✓ Payment processed for ride ${rideId}`);

        // Update wallet if using wallet payment
        if (paymentMethod === 'wallet' && this.cachedWallet) {
          this.cachedWallet.balance -= amount;
          this.cachedWallet.totalSpent += amount;
          await AsyncStorage.setItem('payment_service_wallet', JSON.stringify(this.cachedWallet));
        }

        return true;
      } else {
        console.error(`${FILE_NAME} ✗ Payment failed: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in processPayment():`, error);
      return false;
    }
  }

  // ==================== TRANSACTION HISTORY ====================

  async getTransactionHistory(limit: number = 50): Promise<Transaction[]> {
    console.log(`${FILE_NAME} ▶ getTransactionHistory() called with limit: ${limit}`);

    try {
      const response = await transactionAPI.getTransactions(limit);

      if (response.success && response.data) {
        const transactions = response.data.transactions || [];
        console.log(`${FILE_NAME} ✓ Loaded ${transactions.length} transactions`);
        return transactions;
      } else {
        console.error(`${FILE_NAME} ✗ Failed to load transactions: ${response.error}`);
        return [];
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in getTransactionHistory():`, error);
      return [];
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    console.log(`${FILE_NAME} ▶ getTransactionById() called for transaction: ${transactionId}`);

    try {
      const response = await transactionAPI.getTransaction(transactionId);

      if (response.success && response.data) {
        console.log(`${FILE_NAME} ✓ Transaction loaded: ${transactionId}`);
        return response.data.transaction;
      } else {
        console.error(`${FILE_NAME} ✗ Failed to load transaction: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in getTransactionById():`, error);
      return null;
    }
  }

  // ==================== PAYMENT METHODS ====================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    console.log(`${FILE_NAME} ▶ getPaymentMethods() called`);

    try {
      // Return cached methods
      if (this.cachedMethods.length > 0) {
        console.log(`${FILE_NAME} ✓ Returning cached payment methods: ${this.cachedMethods.length}`);
        return this.cachedMethods;
      }

      const response = await paymentAPI.getPaymentMethods();

      if (response.success && response.data) {
        this.cachedMethods = response.data.methods || [];
        await AsyncStorage.setItem('payment_methods', JSON.stringify(this.cachedMethods));
        console.log(`${FILE_NAME} ✓ Payment methods loaded: ${this.cachedMethods.length} methods`);
        return this.cachedMethods;
      } else {
        console.error(`${FILE_NAME} ✗ Failed to load payment methods: ${response.error}`);
        return [];
      }
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Exception in getPaymentMethods():`, error);
      return this.cachedMethods;
    }
  }

  // ==================== UTILITIES ====================

  async clearCache(): Promise<void> {
    console.log(`${FILE_NAME} ▶ clearCache() called`);

    try {
      await AsyncStorage.removeItem('payment_service_wallet');
      await AsyncStorage.removeItem('payment_methods');
      this.cachedWallet = null;
      this.cachedMethods = [];
      this.lastWalletFetch = 0;
      console.log(`${FILE_NAME} ✓ Cache cleared`);
    } catch (error) {
      console.error(`${FILE_NAME} ✗ Error clearing cache:`, error);
    }
  }

  formatCurrency(amount: number, currency: string): string {
    return `${amount.toFixed(0)} ${currency}`;
  }

  isWalletSufficientForPayment(amount: number): boolean {
    return this.cachedWallet ? this.cachedWallet.balance >= amount : false;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

export default paymentService;
