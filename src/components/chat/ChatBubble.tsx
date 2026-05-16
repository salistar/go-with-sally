// ============================================================
// 📄 ChatBubble.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[ChatBubble.tsx] ▶ Module loaded')
//   • console.log('[ChatBubble.tsx] ▶ ChatBubble() rendered')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  I18nManager,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[ChatBubble.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Message interface for typing
 */
interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaSize?: number;
}

interface ChatBubbleProps {
  message: ChatMessage;
  showName?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  showName = false,
  onPress,
  onLongPress,
}) => {
  console.log(`${FILE_NAME} ▶ ChatBubble() rendered for message: ${message.id}`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const renderStatusIcon = () => {
    console.log(`${FILE_NAME} ▶ renderStatusIcon() called with status: ${message.status}`);

    switch (message.status) {
      case 'sending':
        return (
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={theme.colors.textSecondary}
            style={styles.statusIcon}
          />
        );
      case 'sent':
        return (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={theme.colors.textSecondary}
            style={styles.statusIcon}
          />
        );
      case 'delivered':
        return (
          <MaterialCommunityIcons
            name="check-all"
            size={14}
            color={theme.colors.textSecondary}
            style={styles.statusIcon}
          />
        );
      case 'read':
        return (
          <MaterialCommunityIcons
            name="check-all"
            size={14}
            color={theme.colors.primary}
            style={styles.statusIcon}
          />
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const bubbleStyle = [
    styles.bubble,
    message.isOwn
      ? [
          styles.ownBubble,
          {
            backgroundColor: theme.colors.primary,
          },
        ]
      : [
          styles.otherBubble,
          {
            backgroundColor: theme.colors.surface,
          },
        ],
  ];

  const containerStyle = [
    styles.messageContainer,
    message.isOwn ? styles.ownContainer : styles.otherContainer,
    isRTL && styles.containerRTL,
  ];

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {showName && !message.isOwn && (
          <Text style={[styles.senderName, { color: theme.colors.primary }]}>
            {message.senderName}
          </Text>
        )}

        <View style={bubbleStyle}>
          {message.mediaUrl && message.mediaType === 'image' && (
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          )}

          {message.mediaUrl && message.mediaType === 'audio' && (
            <View style={[styles.audioContainer, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons
                name="volume-high"
                size={20}
                color={message.isOwn ? 'white' : theme.colors.primary}
              />
              <View
                style={[
                  styles.audioProgress,
                  {
                    backgroundColor: message.isOwn
                      ? 'rgba(255, 255, 255, 0.3)'
                      : theme.colors.primary + '30',
                  },
                ]}
              />
              <Text style={[styles.audioTime, { color: message.isOwn ? 'white' : theme.colors.text }]}>
                0:32
              </Text>
            </View>
          )}

          {message.text && (
            <Text
              style={[
                styles.text,
                {
                  color: message.isOwn ? 'white' : theme.colors.text,
                },
              ]}
            >
              {message.text}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.timeContainer,
            message.isOwn ? styles.timeOwnContainer : styles.timeOtherContainer,
            isRTL && styles.timeRTL,
          ]}
        >
          <Text
            style={[
              styles.time,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
          {message.isOwn && renderStatusIcon()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    marginVertical: 4,
  },
  messageContainer: {
    marginHorizontal: 12,
    marginBottom: 2,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  ownBubble: {
    borderBottomRightRadius: 0,
  },
  otherBubble: {
    borderBottomLeftRadius: 0,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: 160,
  },
  audioProgress: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  audioTime: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 30,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  timeOwnContainer: {
    justifyContent: 'flex-end',
  },
  timeOtherContainer: {
    justifyContent: 'flex-start',
  },
  timeRTL: {
    flexDirection: 'row-reverse',
  },
  time: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
});

export default ChatBubble;
