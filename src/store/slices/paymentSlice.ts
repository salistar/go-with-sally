// ============================================================
// 📄 paymentSlice.ts — GoWithSally
// LOG SUMMARY:
//   • console.log('[paymentSlice.ts] ▶ Module loaded')
//   • console.log('[paymentSlice.ts] ▶ setWallet() action dispatched')
//   • console.log('[paymentSlice.ts] ▶ updateBalance() action dispatched')
//   • console.log('[paymentSlice.ts] ▶ addTransaction() action dispatched')
//   • console.log('[paymentSlice.ts] ▶ setPaymentMethods() action dispatched')
//   • console.log('[paymentSlice.ts] ▶ setSelectedPaymentMethod() action dispatched')
// ============================================================

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentService } from '../../services/paymentService';

const FILE_NAME = '[paymentSlice.ts]';
console.log(`${FILE_NAME} ▶ Module loaded`);

// ==================== TYPES ====================

export interface Wallet {
  balance: number;
  currency: string;
  lastTopUp?: string;
  totalTopUps: number;
  totalSpent: number;
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

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'wallet' | 'apple_pay' | 'google_pay';
  isDefault: boolean;
  lastDigits?: string;
  holderName?: string;
}

export interface PaymentState {
  wallet: Wallet | null;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  loading: boolean;
  error: string | null;
  topUpLoading: boolean;
}

// ==================== INITIAL STATE ====================

const initialState: PaymentState = {
  wallet: null,
  transactions: [],
  paymentMethods: [],
  selectedPaymentMethod: null,
  loading: false,
  error: null,
  topUpLoading: false,
};

// ==================== ASYNC THUNKS ====================

export const fetchWallet = createAsyncThunk(
  'payment/fetchWallet',
  async (_, { rejectWithValue }) => {
    console.log(`${FILE_NAME} ▶ fetchWallet() thunk called`);
    try {
      const wallet = await paymentService.getWallet();
      if (wallet) {
        return wallet;
      } else {
        return rejectWithValue('Failed to fetch wallet');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ fetchWallet error:`, error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'payment/fetchTransactions',
  async (limit: number = 50, { rejectWithValue }) => {
    console.log(`${FILE_NAME} ▶ fetchTransactions() thunk called with limit: ${limit}`);
    try {
      const transactions = await paymentService.getTransactionHistory(limit);
      return transactions;
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ fetchTransactions error:`, error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    console.log(`${FILE_NAME} ▶ fetchPaymentMethods() thunk called`);
    try {
      const methods = await paymentService.getPaymentMethods();
      return methods;
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ fetchPaymentMethods error:`, error);
      return rejectWithValue(error.message);
    }
  }
);

export const topUpWallet = createAsyncThunk(
  'payment/topUpWallet',
  async (
    { amount, paymentMethod }: { amount: number; paymentMethod: string },
    { rejectWithValue }
  ) => {
    console.log(`${FILE_NAME} ▶ topUpWallet() thunk called: amount=${amount}, method=${paymentMethod}`);
    try {
      const result = await paymentService.topUpWallet(amount, paymentMethod);
      if (result && result.success) {
        return result;
      } else {
        return rejectWithValue(result?.error || 'Top-up failed');
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ✗ topUpWallet error:`, error);
      return rejectWithValue(error.message);
    }
  }
);

// ==================== SLICE ====================

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    /**
     * Set wallet data
     */
    setWallet: (state, action: PayloadAction<Wallet>) => {
      console.log(`${FILE_NAME} ▶ setWallet() action dispatched with balance: ${action.payload.balance}`);
      state.wallet = action.payload;
      state.error = null;
    },

    /**
     * Update wallet balance
     */
    updateBalance: (state, action: PayloadAction<number>) => {
      console.log(`${FILE_NAME} ▶ updateBalance() action dispatched with new balance: ${action.payload}`);
      if (state.wallet) {
        state.wallet.balance = action.payload;
      }
    },

    /**
     * Add transaction to list
     */
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      console.log(`${FILE_NAME} ▶ addTransaction() action dispatched for type: ${action.payload.type}`);
      state.transactions.unshift(action.payload);
    },

    /**
     * Set transactions
     */
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      console.log(`${FILE_NAME} ▶ setTransactions() action dispatched with ${action.payload.length} transactions`);
      state.transactions = action.payload;
    },

    /**
     * Set payment methods
     */
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      console.log(`${FILE_NAME} ▶ setPaymentMethods() action dispatched with ${action.payload.length} methods`);
      state.paymentMethods = action.payload;
    },

    /**
     * Set selected payment method
     */
    setSelectedPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      console.log(`${FILE_NAME} ▶ setSelectedPaymentMethod() action dispatched: ${action.payload.type}`);
      state.selectedPaymentMethod = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      console.log(`${FILE_NAME} ▶ clearError() action dispatched`);
      state.error = null;
    },

    /**
     * Reset payment state
     */
    resetPaymentState: () => {
      console.log(`${FILE_NAME} ▶ resetPaymentState() action dispatched`);
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchWallet
    builder
      .addCase(fetchWallet.pending, (state) => {
        console.log(`${FILE_NAME} ▶ fetchWallet.pending`);
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        console.log(`${FILE_NAME} ✓ fetchWallet.fulfilled with balance: ${action.payload.balance}`);
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        console.log(`${FILE_NAME} ✗ fetchWallet.rejected: ${action.payload}`);
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchTransactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        console.log(`${FILE_NAME} ▶ fetchTransactions.pending`);
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        console.log(`${FILE_NAME} ✓ fetchTransactions.fulfilled with ${action.payload.length} transactions`);
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        console.log(`${FILE_NAME} ✗ fetchTransactions.rejected: ${action.payload}`);
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchPaymentMethods
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        console.log(`${FILE_NAME} ▶ fetchPaymentMethods.pending`);
        state.loading = true;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        console.log(`${FILE_NAME} ✓ fetchPaymentMethods.fulfilled with ${action.payload.length} methods`);
        state.loading = false;
        state.paymentMethods = action.payload;
        // Set first method as default if not already selected
        if (!state.selectedPaymentMethod && action.payload.length > 0) {
          state.selectedPaymentMethod = action.payload[0];
        }
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        console.log(`${FILE_NAME} ✗ fetchPaymentMethods.rejected: ${action.payload}`);
        state.loading = false;
        state.error = action.payload as string;
      });

    // topUpWallet
    builder
      .addCase(topUpWallet.pending, (state) => {
        console.log(`${FILE_NAME} ▶ topUpWallet.pending`);
        state.topUpLoading = true;
        state.error = null;
      })
      .addCase(topUpWallet.fulfilled, (state, action) => {
        console.log(`${FILE_NAME} ✓ topUpWallet.fulfilled: new balance = ${action.payload.newBalance}`);
        state.topUpLoading = false;
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance;
          state.wallet.lastTopUp = action.payload.timestamp;
          state.wallet.totalTopUps += action.payload.amount;
        }
        // Add transaction
        state.transactions.unshift({
          _id: action.payload.transactionId,
          type: 'topup',
          amount: action.payload.amount,
          status: 'completed',
          createdAt: action.payload.timestamp,
        });
      })
      .addCase(topUpWallet.rejected, (state, action) => {
        console.log(`${FILE_NAME} ✗ topUpWallet.rejected: ${action.payload}`);
        state.topUpLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setWallet,
  updateBalance,
  addTransaction,
  setTransactions,
  setPaymentMethods,
  setSelectedPaymentMethod,
  clearError,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
