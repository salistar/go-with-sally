// ============================================================
// 📄 chatSlice.ts — GoWithSally
// LOG SUMMARY:
//   • console.log('[chatSlice.ts] ▶ Module loaded')
//   • console.log('[chatSlice.ts] ▶ addMessage() called')
//   • console.log('[chatSlice.ts] ▶ markAsRead() called')
//   • console.log('[chatSlice.ts] ▶ setTypingStatus() called')
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

const FILE_NAME = '[chatSlice.ts]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Chat message type
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

/**
 * Conversation type
 */
export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
  typingUsers: string[];
}

/**
 * Chat state interface
 */
export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
  typingIndicators: Record<string, boolean>;
  connectionMode: 'offline' | 'hybrid' | 'online';
}

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  loading: false,
  error: null,
  typingIndicators: {},
  connectionMode: 'online',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Conversation management
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      console.log(`${FILE_NAME} ▶ setConversations() called`);
      state.conversations = action.payload;
    },

    addConversation: (state, action: PayloadAction<Conversation>) => {
      console.log(`${FILE_NAME} ▶ addConversation() called for: ${action.payload.id}`);
      const exists = state.conversations.find(c => c.id === action.payload.id);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },

    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      console.log(`${FILE_NAME} ▶ setCurrentConversation() called for: ${action.payload}`);
      state.currentConversationId = action.payload;
    },

    // Message management
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      console.log(`${FILE_NAME} ▶ addMessage() called for message: ${action.payload.id}`);
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.messages.push(action.payload);
        conversation.lastMessage = action.payload.text;
        conversation.lastMessageTime = action.payload.timestamp;

        // Move conversation to top if it exists
        const index = state.conversations.indexOf(conversation);
        if (index > 0) {
          const [moved] = state.conversations.splice(index, 1);
          state.conversations.unshift(moved);
        }
      }
    },

    updateMessageStatus: (state, action: PayloadAction<{ messageId: string; status: ChatMessage['status'] }>) => {
      console.log(`${FILE_NAME} ▶ updateMessageStatus() called for: ${action.payload.messageId}`);
      state.conversations.forEach(conversation => {
        const message = conversation.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.status = action.payload.status;
        }
      });
    },

    removeMessage: (state, action: PayloadAction<string>) => {
      console.log(`${FILE_NAME} ▶ removeMessage() called for: ${action.payload}`);
      state.conversations.forEach(conversation => {
        conversation.messages = conversation.messages.filter(m => m.id !== action.payload);
      });
    },

    // Read status
    markAsRead: (state, action: PayloadAction<string>) => {
      console.log(`${FILE_NAME} ▶ markAsRead() called for conversation: ${action.payload}`);
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.unreadCount = 0;
        conversation.messages.forEach(msg => {
          if (msg.status !== 'read') {
            msg.status = 'read';
          }
        });
      }
    },

    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      console.log(`${FILE_NAME} ▶ incrementUnreadCount() called for: ${action.payload}`);
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.unreadCount++;
      }
    },

    // Typing indicators
    setTypingStatus: (state, action: PayloadAction<{ conversationId: string; isTyping: boolean }>) => {
      console.log(`${FILE_NAME} ▶ setTypingStatus() called for: ${action.payload.conversationId}`);
      state.typingIndicators[action.payload.conversationId] = action.payload.isTyping;
    },

    setIsTyping: (state, action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>) => {
      console.log(`${FILE_NAME} ▶ setIsTyping() called for user: ${action.payload.userId}`);
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        if (action.payload.isTyping) {
          if (!conversation.typingUsers.includes(action.payload.userId)) {
            conversation.typingUsers.push(action.payload.userId);
          }
        } else {
          conversation.typingUsers = conversation.typingUsers.filter(
            id => id !== action.payload.userId
          );
        }
      }
    },

    // Online status
    setParticipantOnlineStatus: (state, action: PayloadAction<{ conversationId: string; isOnline: boolean }>) => {
      console.log(`${FILE_NAME} ▶ setParticipantOnlineStatus() called for: ${action.payload.conversationId}`);
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.isOnline = action.payload.isOnline;
      }
    },

    // Connection mode
    setConnectionMode: (state, action: PayloadAction<'offline' | 'hybrid' | 'online'>) => {
      console.log(`${FILE_NAME} ▶ setConnectionMode() called: ${action.payload}`);
      state.connectionMode = action.payload;
    },

    // Loading & errors
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear all data
    clearChat: (state) => {
      console.log(`${FILE_NAME} ▶ clearChat() called`);
      state.conversations = [];
      state.currentConversationId = null;
      state.typingIndicators = {};
      state.error = null;
    },
  },
});

// ============================================================================
// SELECTORS
// ============================================================================

export const selectConversations = (state: RootState) => state.chat.conversations;

export const selectCurrentConversation = (state: RootState) => {
  const conversationId = state.chat.currentConversationId;
  if (!conversationId) return null;
  return state.chat.conversations.find(c => c.id === conversationId);
};

export const selectCurrentConversationMessages = (state: RootState) => {
  const conversation = selectCurrentConversation(state);
  return conversation?.messages || [];
};

export const selectUnreadCount = (state: RootState) => {
  return state.chat.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
};

export const selectTypingIndicators = (state: RootState) => state.chat.typingIndicators;

export const selectConnectionMode = (state: RootState) => state.chat.connectionMode;

export const selectIsLoading = (state: RootState) => state.chat.loading;

export const selectChatError = (state: RootState) => state.chat.error;

export const {
  setConversations,
  addConversation,
  setCurrentConversation,
  addMessage,
  updateMessageStatus,
  removeMessage,
  markAsRead,
  incrementUnreadCount,
  setTypingStatus,
  setIsTyping,
  setParticipantOnlineStatus,
  setConnectionMode,
  setLoading,
  setError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
