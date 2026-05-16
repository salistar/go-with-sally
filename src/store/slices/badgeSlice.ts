// ============================================================
// 📄 badgeSlice.ts — GoWithSally
// LOG SUMMARY:
//   • console.log('[badgeSlice.ts] ▶ Module loaded')
//   • console.log('[badgeSlice.ts] ▶ setBadges() action dispatched')
//   • console.log('[badgeSlice.ts] ▶ unlockBadge() action dispatched')
//   • console.log('[badgeSlice.ts] ▶ updateBadgeProgress() action dispatched')
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const FILE_NAME = '[badgeSlice.ts]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Badge interface
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  unlockedDate?: Date;
  progress?: number; // 0-100
  requirement: string;
  category: 'travel' | 'safety' | 'social' | 'achievement';
}

/**
 * Badge state interface
 */
interface BadgeState {
  badges: Badge[];
  loading: boolean;
  error: string | null;
  totalProgress: number;
}

/**
 * Initial state
 */
const initialState: BadgeState = {
  badges: [],
  loading: false,
  error: null,
  totalProgress: 0,
};

/**
 * Badge slice
 */
const badgeSlice = createSlice({
  name: 'badge',
  initialState,
  reducers: {
    /**
     * Set all badges
     */
    setBadges: (state, action: PayloadAction<Badge[]>) => {
      console.log(`${FILE_NAME} ▶ setBadges() action dispatched with ${action.payload.length} badges`);
      state.badges = action.payload;
      calculateTotalProgress(state);
    },

    /**
     * Unlock a badge
     */
    unlockBadge: (state, action: PayloadAction<string>) => {
      console.log(`${FILE_NAME} ▶ unlockBadge() action dispatched for badge ${action.payload}`);

      const badge = state.badges.find(b => b.id === action.payload);
      if (badge) {
        badge.isUnlocked = true;
        badge.unlockedDate = new Date();
        badge.progress = 100;
      }
      calculateTotalProgress(state);
    },

    /**
     * Update badge progress
     */
    updateBadgeProgress: (
      state,
      action: PayloadAction<{ badgeId: string; progress: number }>
    ) => {
      console.log(
        `${FILE_NAME} ▶ updateBadgeProgress() action dispatched for badge ${action.payload.badgeId} with progress ${action.payload.progress}`
      );

      const badge = state.badges.find(b => b.id === action.payload.badgeId);
      if (badge && !badge.isUnlocked) {
        badge.progress = Math.min(100, action.payload.progress);

        // Auto-unlock if progress reaches 100
        if (badge.progress >= 100) {
          badge.isUnlocked = true;
          badge.unlockedDate = new Date();
        }
      }
      calculateTotalProgress(state);
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Reset badge state
     */
    resetBadges: () => {
      return initialState;
    },
  },
});

/**
 * Helper function to calculate total progress
 */
function calculateTotalProgress(state: BadgeState) {
  if (state.badges.length === 0) {
    state.totalProgress = 0;
    return;
  }

  const totalProgress = state.badges.reduce((sum, badge) => {
    return sum + (badge.progress || (badge.isUnlocked ? 100 : 0));
  }, 0);

  state.totalProgress = Math.round(totalProgress / state.badges.length);
}

export const {
  setBadges,
  unlockBadge,
  updateBadgeProgress,
  setLoading,
  setError,
  resetBadges,
} = badgeSlice.actions;

export default badgeSlice.reducer;
