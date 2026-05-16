// ============================================================
// 📄 ConversationItem.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ConversationItem.tsx] ▶ Module loaded')
//   • console.log('[ConversationItem.tsx] ▶ ConversationItem() rendered')
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  I18nManager,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ConversationItem.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
  participantStatus?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
}) => {
  console.log(`${FILE_NAME} ▶ ConversationItem() rendered for: ${conversation.id}`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;

  const formattedTime = useMemo(() => {
    const now = new Date();
    const messageTime = new Date(conversation.lastMessageTime);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return messageTime.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  }, [conversation.lastMessageTime]);

  const truncatedMessage = useMemo(() => {
    const maxLength = 50;
    return conversation.lastMessage.length > maxLength
      ? conversation.lastMessage.substring(0, maxLength) + '...'
      : conversation.lastMessage;
  }, [conversation.lastMessage]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: conversation.unreadCount > 0 ? theme.colors.primary + '10' : 'transparent',
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.6}
    >
      {/* Avatar Container */}
      <View style={styles.avatarContainer}>
        {conversation.participantAvatar ? (
          <Image
            source={{ uri: conversation.participantAvatar }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={44}
              color="white"
            />
          </View>
        )}

        {/* Online Indicator */}
        {conversation.isOnline && (
          <View
            style={[
              styles.onlineIndicator,
              {
                backgroundColor: '#4CAF50',
              },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View
        style={[
          styles.content,
          {
            borderBottomColor: theme.colors.background,
          },
          isRTL && styles.contentRTL,
        ]}
      >
        {/* Header - Name & Time */}
        <View
          style={[
            styles.header,
            isRTL && styles.headerRTL,
          ]}
        >
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
                fontWeight: conversation.unreadCount > 0 ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {conversation.participantName}
          </Text>

          <Text
            style={[
              styles.time,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        {/* Message Preview */}
        <View
          style={[
            styles.messageRow,
            isRTL && styles.messageRowRTL,
          ]}
        >
          <Text
            style={[
              styles.message,
              {
                color: conversation.unreadCount > 0 ? theme.colors.text : theme.colors.textSecondary,
                fontWeight: conversation.unreadCount > 0 ? '500' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {truncatedMessage}
          </Text>

          {/* Unread Badge */}
          {conversation.unreadCount > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  contentRTL: {
    flexDirection: 'row-reverse',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  name: {
    fontSize: 15,
    maxWidth: Dimensions.get('window').width * 0.4,
  },
  time: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageRowRTL: {
    flexDirection: 'row-reverse',
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ConversationItem;
