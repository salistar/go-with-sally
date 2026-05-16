// ============================================================
// 📄 MessageInput.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[MessageInput.tsx] ▶ Module loaded')
//   • console.log('[MessageInput.tsx] ▶ MessageInput() rendered')
//   • console.log('[MessageInput.tsx] ▶ handleSendMessage() called')
//   • console.log('[MessageInput.tsx] ▶ handlePickImage() called')
//   • console.log('[MessageInput.tsx] ▶ handleRecordAudio() called')
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  I18nManager,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[MessageInput.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface MessageInputProps {
  onSendMessage: (message: string, media?: { uri: string; type: 'image' | 'audio' }) => void;
  onTyping?: () => void;
  disabled?: boolean;
  isRecording?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  isRecording = false,
}) => {
  console.log(`${FILE_NAME} ▶ MessageInput() rendered`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const textInputRef = useRef<TextInput>(null);

  const handleSendMessage = async () => {
    console.log(`${FILE_NAME} ▶ handleSendMessage() called with text: ${text}`);

    if (!text.trim() || disabled) {
      return;
    }

    setIsLoading(true);
    onSendMessage(text.trim());
    setText('');
    setIsLoading(false);

    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handlePickImage = async () => {
    console.log(`${FILE_NAME} ▶ handlePickImage() called`);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setIsLoading(true);
        onSendMessage('📸 Image', { uri: asset.uri, type: 'image' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error picking image:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger l\'image',
        position: 'bottom',
      });
    }
  };

  const handleRecordAudio = async () => {
    console.log(`${FILE_NAME} ▶ handleRecordAudio() called`);

    try {
      if (recording) {
        const status = await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
          setIsLoading(true);
          onSendMessage('🎤 Audio', { uri, type: 'audio' });
          setIsLoading(false);
        }

        setRecording(null);
      } else {
        const permission = await Audio.requestPermissionsAsync();

        if (permission.granted) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const newRecording = new Audio.Recording();
          await newRecording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          await newRecording.startAsync();
          setRecording(newRecording);
        }
      }
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error recording audio:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'enregistrer l\'audio',
        position: 'bottom',
      });
    }
  };

  const handleEmojiPicker = () => {
    console.log(`${FILE_NAME} ▶ handleEmojiPicker() called`);

    const emojis = ['😂', '😍', '😍', '👍', '❤️', '🔥', '✨', '😘'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setText(text + randomEmoji);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (onTyping && newText.trim()) {
      onTyping();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.background,
        },
      ]}
    >
      <View style={[styles.inputWrapper, isRTL && styles.inputWrapperRTL]}>
        {/* Emoji Button */}
        <TouchableOpacity
          onPress={handleEmojiPicker}
          style={styles.actionButton}
          disabled={disabled || isLoading}
        >
          <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={textInputRef}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.primary,
            },
          ]}
          placeholder="Votre message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={handleTextChange}
          editable={!disabled && !isLoading}
          multiline
          maxLength={500}
          scrollEnabled
        />

        {/* Image Button */}
        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.actionButton}
          disabled={disabled || isLoading}
        >
          <MaterialCommunityIcons name="image-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Audio Button */}
        <TouchableOpacity
          onPress={handleRecordAudio}
          style={[
            styles.actionButton,
            recording && styles.recordingButton,
          ]}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <MaterialCommunityIcons
              name={recording ? 'microphone' : 'microphone-outline'}
              size={24}
              color={recording ? '#FF4444' : theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Send Button */}
      <View style={styles.sendButtonContainer}>
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.colors.primary,
            },
            (disabled || !text.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          disabled={disabled || !text.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingVertical: 4,
  },
  inputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  recordingButton: {
    opacity: 0.8,
  },
  sendButtonContainer: {
    paddingBottom: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default MessageInput;
