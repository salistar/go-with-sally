/**
 * ============================================================================
 * GO WITH SALLY - CHAT SCREEN
 * ============================================================================
 * Fichier: src/screens/common/ChatScreen.tsx
 * Description: Écran de discussion avec support multimédia complet
 * Features: Text, Audio, Video, Images + 3 modes (Offline/Hybrid/Online)
 * Auteur: Go With Sally Team
 * Date: Janvier 2025
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';
import { RootState } from '../../store';

const FILE_NAME = '[ChatScreen.tsx]';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ConnectionMode = 'offline' | 'hybrid' | 'online';
type MessageType = 'text' | 'image' | 'audio' | 'video' | 'file';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MediaContent {
  uri: string;
  duration?: number;
  thumbnail?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

interface Message {
  id: string;
  type: MessageType;
  text?: string;
  media?: MediaContent;
  senderId: string;
  timestamp: string;
  status: MessageStatus;
  replyTo?: string;
}

interface QuickMessage {
  id: string;
  text: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUICK_MESSAGES: QuickMessage[] = [
  { id: 'q1', text: 'chat.quickOnMyWay', icon: 'car' },
  { id: 'q2', text: 'chat.quickArrived', icon: 'map-marker-check' },
  { id: 'q3', text: 'chat.quickWaiting', icon: 'clock-outline' },
  { id: 'q4', text: 'chat.quickBeRight', icon: 'run' },
  { id: 'q5', text: 'chat.quickThankYou', icon: 'heart' },
  { id: 'q6', text: 'chat.quickOk', icon: 'check' },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    type: 'text',
    text: 'Bonjour, je suis en route!',
    senderId: 'driver_001',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'read',
  },
  {
    id: 'm2',
    type: 'text',
    text: "D'accord, merci!",
    senderId: 'user_001',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    status: 'read',
  },
  {
    id: 'm3',
    type: 'image',
    media: {
      uri: 'https://picsum.photos/400/300',
      thumbnail: 'https://picsum.photos/100/75',
    },
    senderId: 'driver_001',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    status: 'read',
  },
  {
    id: 'm4',
    type: 'text',
    text: 'Je serai là dans environ 3 minutes',
    senderId: 'driver_001',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    status: 'read',
  },
];

const CONNECTION_MODES: { mode: ConnectionMode; icon: string; color: string }[] = [
  { mode: 'offline', icon: 'cloud-off-outline', color: '#9E9E9E' },
  { mode: 'hybrid', icon: 'cloud-sync', color: '#FF9800' },
  { mode: 'online', icon: 'cloud-check', color: '#4CAF50' },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ChatScreen: React.FC = () => {
  console.log(`${FILE_NAME} 🚀 Initialisation du composant`);

  // -------------------------------------------------------------------------
  // Hooks & Context
  // -------------------------------------------------------------------------
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useSelector((state: RootState) => state.auth);

  // -------------------------------------------------------------------------
  // Route Params
  // -------------------------------------------------------------------------
  const recipientId = route.params?.recipientId || 'driver_001';
  const recipientName = route.params?.recipientName || 'Conductrice';
  const recipientAvatar = route.params?.recipientAvatar;
  const rideId = route.params?.rideId;

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('hybrid');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);

  // Audio/Video State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // -------------------------------------------------------------------------
  // Animations
  // -------------------------------------------------------------------------
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------
  useEffect(() => {
    console.log(`${FILE_NAME} ✅ Composant monté - Mode: ${connectionMode}`);
    setupAudio();

    // Simulate connection status based on mode
    if (connectionMode === 'offline') {
      setIsOnline(false);
    } else if (connectionMode === 'online') {
      setIsOnline(true);
    } else {
      // Hybrid - simulate intermittent connection
      const interval = setInterval(() => {
        setIsOnline((prev) => Math.random() > 0.3);
      }, 5000);
      return () => clearInterval(interval);
    }

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
      cleanupAudio();
    };
  }, [connectionMode]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  useEffect(() => {
    Animated.timing(attachMenuAnim, {
      toValue: showAttachMenu ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showAttachMenu]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordingAnim.setValue(1);
    }
  }, [isRecording]);

  // -------------------------------------------------------------------------
  // Audio Setup
  // -------------------------------------------------------------------------
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Audio setup error:`, error);
    }
  };

  const cleanupAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // -------------------------------------------------------------------------
  // Message Handlers
  // -------------------------------------------------------------------------
  const handleSendMessage = useCallback(
    (text?: string, type: MessageType = 'text', media?: MediaContent) => {
      const messageText = text || inputText.trim();
      if (!messageText && type === 'text') return;

      console.log(`${FILE_NAME} 📤 Envoi message [${type}]: "${messageText || 'media'}"`);

      const newMessage: Message = {
        id: `m_${Date.now()}`,
        type,
        text: messageText || undefined,
        media,
        senderId: user?.id || 'user_001',
        timestamp: new Date().toISOString(),
        status: connectionMode === 'offline' ? 'sent' : 'sending',
      };

      setMessages((prev) => [...prev, newMessage]);
      setInputText('');
      setShowQuickMessages(false);
      setShowAttachMenu(false);
      Keyboard.dismiss();

      // Handle based on connection mode
      if (connectionMode === 'offline') {
        // Offline: Store locally, simulate response
        setTimeout(() => simulateResponse(), 2000);
      } else if (connectionMode === 'hybrid') {
        // Hybrid: Try to send, queue if offline
        if (isOnline) {
          simulateSendToServer(newMessage.id);
        } else {
          setPendingMessages((prev) => [...prev, newMessage.id]);
          Toast.show({
            type: 'info',
            text1: t('chat.messageQueued'),
            text2: t('chat.willSendWhenOnline'),
          });
        }
      } else {
        // Online: Send immediately
        simulateSendToServer(newMessage.id);
      }
    },
    [inputText, connectionMode, isOnline, user?.id, t]
  );

  const simulateSendToServer = (messageId: string) => {
    // Simulate network delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' } : m))
      );
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: 'delivered' } : m))
        );
        simulateResponse();
      }, 1000);
    }, 500);
  };

  const simulateResponse = () => {
    console.log(`${FILE_NAME} 🤖 Simulation réponse`);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "D'accord!",
        'Pas de problème',
        'Je comprends',
        'Très bien, merci!',
        "J'arrive bientôt",
        '👍',
        'Super!',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const responseMessage: Message = {
        id: `m_${Date.now()}`,
        type: 'text',
        text: randomResponse,
        senderId: recipientId,
        timestamp: new Date().toISOString(),
        status: 'read',
      };

      setMessages((prev) => [...prev, responseMessage]);
    }, 1500);
  };

  const handleQuickMessage = (quickMessage: QuickMessage) => {
    console.log(`${FILE_NAME} ⚡ Message rapide: ${quickMessage.id}`);
    handleSendMessage(t(quickMessage.text));
  };

  // -------------------------------------------------------------------------
  // Call Handler
  // -------------------------------------------------------------------------
  const handleCall = useCallback((callType: 'audio' | 'video') => {
    console.log(`${FILE_NAME} 📞 Démarrage appel ${callType}`);
    navigation.navigate('Call', {
      recipientId,
      recipientName,
      recipientAvatar,
      callType,
      isIncoming: false,
    });
  }, [navigation, recipientId, recipientName, recipientAvatar]);

  // -------------------------------------------------------------------------
  // Media Handlers
  // -------------------------------------------------------------------------
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: t('chat.permissionRequired') });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSendMessage(undefined, 'image', {
          uri: asset.uri,
          thumbnail: asset.uri,
        });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Image picker error:`, error);
      Toast.show({ type: 'error', text1: t('chat.mediaError') });
    }
  };

  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: t('chat.permissionRequired') });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSendMessage(undefined, 'video', {
          uri: asset.uri,
          duration: asset.duration ?? undefined,
          thumbnail: asset.uri,
        });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Video picker error:`, error);
      Toast.show({ type: 'error', text1: t('chat.mediaError') });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: t('chat.permissionRequired') });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSendMessage(undefined, 'image', {
          uri: asset.uri,
          thumbnail: asset.uri,
        });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Camera error:`, error);
      Toast.show({ type: 'error', text1: t('chat.mediaError') });
    }
  };

  const handlePickFile = async () => {
    // DocumentPicker requires: npx expo install expo-document-picker
    Toast.show({
      type: 'info',
      text1: t('common.comingSoon'),
      text2: 'expo-document-picker required',
    });
  };

  // -------------------------------------------------------------------------
  // Audio Recording
  // -------------------------------------------------------------------------
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: t('chat.permissionRequired') });
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      console.log(`${FILE_NAME} 🎤 Recording started`);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Recording error:`, error);
      Toast.show({ type: 'error', text1: t('chat.recordingError') });
    }
  };

  const stopRecording = async (send: boolean = true) => {
    try {
      if (!recordingRef.current) return;

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      setIsRecording(false);
      setRecordingDuration(0);

      if (send && uri && recordingDuration >= 1) {
        handleSendMessage(undefined, 'audio', {
          uri,
          duration: recordingDuration,
        });
      }

      recordingRef.current = null;
      console.log(`${FILE_NAME} 🎤 Recording stopped - Send: ${send}`);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Stop recording error:`, error);
    }
  };

  // -------------------------------------------------------------------------
  // Audio Playback
  // -------------------------------------------------------------------------
  const playAudio = async (message: Message) => {
    try {
      if (!message.media?.uri) return;

      // Stop current playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        if (playingAudioId === message.id) {
          setPlayingAudioId(null);
          return;
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.media.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            const progress = status.positionMillis / (status.durationMillis || 1);
            setAudioProgress((prev) => ({ ...prev, [message.id]: progress }));

            if (status.didJustFinish) {
              setPlayingAudioId(null);
              setAudioProgress((prev) => ({ ...prev, [message.id]: 0 }));
            }
          }
        }
      );

      soundRef.current = sound;
      setPlayingAudioId(message.id);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Audio playback error:`, error);
      Toast.show({ type: 'error', text1: t('chat.playbackError') });
    }
  };

  // -------------------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------------------
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOwnMessage = (senderId: string): boolean => {
    return senderId === (user?.id || 'user_001');
  };

  const getStatusIcon = (status: MessageStatus): string => {
    switch (status) {
      case 'sending':
        return 'clock-outline';
      case 'sent':
        return 'check';
      case 'delivered':
        return 'check-all';
      case 'read':
        return 'check-all';
      case 'failed':
        return 'alert-circle';
      default:
        return 'check';
    }
  };

  const getStatusColor = (status: MessageStatus): string => {
    if (status === 'read') return '#4FC3F7';
    if (status === 'failed') return '#F44336';
    return 'rgba(255,255,255,0.5)';
  };

  const getModeConfig = () => {
    return CONNECTION_MODES.find((m) => m.mode === connectionMode) || CONNECTION_MODES[1];
  };

  // -------------------------------------------------------------------------
  // Render Functions
  // -------------------------------------------------------------------------
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = isOwnMessage(item.senderId);
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    return (
      <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
        {/* Avatar */}
        {!isOwn && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {recipientName.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}

        {/* Message Bubble */}
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? [styles.ownBubble, { backgroundColor: theme.colors.primary }]
              : [styles.otherBubble, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }],
            item.type !== 'text' && styles.mediaBubble,
          ]}
        >
          {renderMessageContent(item, isOwn)}

          {/* Time & Status */}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
            {isOwn && (
              <MaterialCommunityIcons
                name={getStatusIcon(item.status) as any}
                size={14}
                color={getStatusColor(item.status)}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderMessageContent = (message: Message, isOwn: boolean) => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.messageText, { color: isOwn ? 'white' : theme.colors.text }]}>
            {message.text}
          </Text>
        );

      case 'image':
        return (
          <TouchableOpacity onPress={() => setSelectedMedia(message)} activeOpacity={0.9}>
            <Image
              source={{ uri: message.media?.uri }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'video':
        return (
          <TouchableOpacity onPress={() => setSelectedMedia(message)} activeOpacity={0.9}>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.media?.thumbnail }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="white" />
              </View>
              {message.media?.duration && (
                <View style={styles.videoDuration}>
                  <Text style={styles.videoDurationText}>
                    {formatDuration(Math.floor(message.media.duration / 1000))}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'audio':
        const isPlaying = playingAudioId === message.id;
        const progress = audioProgress[message.id] || 0;

        return (
          <TouchableOpacity onPress={() => playAudio(message)} style={styles.audioContainer}>
            <View style={[styles.audioPlayButton, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.colors.primary + '20' }]}>
              <MaterialCommunityIcons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color={isOwn ? 'white' : theme.colors.primary}
              />
            </View>
            <View style={styles.audioWaveform}>
              <View style={[styles.audioProgressBg, { backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : theme.colors.border }]}>
                <View
                  style={[
                    styles.audioProgressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isOwn ? 'white' : theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.audioDuration, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
                {formatDuration(message.media?.duration || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <MaterialCommunityIcons
              name="file-document"
              size={32}
              color={isOwn ? 'white' : theme.colors.primary}
            />
            <View style={styles.fileInfo}>
              <Text
                style={[styles.fileName, { color: isOwn ? 'white' : theme.colors.text }]}
                numberOfLines={1}
              >
                {message.media?.fileName || 'Document'}
              </Text>
              <Text style={[styles.fileSize, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
                {message.media?.fileSize
                  ? `${(message.media.fileSize / 1024).toFixed(1)} KB`
                  : ''}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerInfo} onPress={() => {}}>
        <View style={[styles.headerAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.headerAvatarText}>{recipientName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: theme.colors.text }]}>{recipientName}</Text>
          {isTyping ? (
            <Text style={[styles.typingText, { color: theme.colors.primary }]}>
              {t('chat.typing')}
            </Text>
          ) : (
            <View style={styles.onlineStatus}>
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                {isOnline ? t('chat.online') : t('chat.offline')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Connection Mode Indicator */}
      <TouchableOpacity
        style={[styles.modeButton, { backgroundColor: getModeConfig().color + '20' }]}
        onPress={() => setShowModeSelector(true)}
      >
        <MaterialCommunityIcons
          name={getModeConfig().icon as any}
          size={20}
          color={getModeConfig().color}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.callButton}
        onPress={() => handleCall('audio')}
      >
        <MaterialCommunityIcons name="phone" size={22} color={theme.colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.callButton}
        onPress={() => handleCall('video')}
      >
        <MaterialCommunityIcons name="video" size={22} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderQuickMessages = () => {
    if (!showQuickMessages) return null;

    return (
      <View style={styles.quickMessagesContainer}>
        <FlatList
          horizontal
          data={QUICK_MESSAGES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickMessagesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.quickMessageButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickMessage(item)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={16}
                color={theme.colors.primary}
                style={styles.quickMessageIcon}
              />
              <Text style={[styles.quickMessageText, { color: theme.colors.text }]}>
                {t(item.text)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderAttachMenu = () => {
    const attachOptions = [
      { id: 'camera', icon: 'camera', label: t('chat.attachCamera'), action: handleTakePhoto, color: '#E91E63' },
      { id: 'image', icon: 'image', label: t('chat.attachImage'), action: handlePickImage, color: '#9C27B0' },
      { id: 'video', icon: 'video', label: t('chat.attachVideo'), action: handlePickVideo, color: '#2196F3' },
      { id: 'file', icon: 'file-document', label: t('chat.attachFile'), action: handlePickFile, color: '#FF9800' },
    ];

    return (
      <Animated.View
        style={[
          styles.attachMenu,
          {
            backgroundColor: theme.colors.surface,
            transform: [
              {
                translateY: attachMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: attachMenuAnim,
          },
        ]}
      >
        {attachOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.attachOption}
            onPress={() => {
              setShowAttachMenu(false);
              option.action();
            }}
          >
            <View style={[styles.attachIconContainer, { backgroundColor: option.color }]}>
              <MaterialCommunityIcons name={option.icon as any} size={24} color="white" />
            </View>
            <Text style={[styles.attachLabel, { color: theme.colors.text }]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  const renderInput = () => (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Attach Button */}
      <TouchableOpacity
        style={styles.attachButton}
        onPress={() => setShowAttachMenu(!showAttachMenu)}
      >
        <MaterialCommunityIcons
          name={showAttachMenu ? 'close' : 'plus'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Input or Recording */}
      {isRecording ? (
        <View style={styles.recordingContainer}>
          <Animated.View
            style={[
              styles.recordingDot,
              { transform: [{ scale: recordingAnim }] },
            ]}
          />
          <Text style={[styles.recordingText, { color: theme.colors.text }]}>
            {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity
            style={styles.cancelRecording}
            onPress={() => stopRecording(false)}
          >
            <Text style={{ color: theme.colors.error }}>{t('chat.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              color: theme.colors.text,
            },
          ]}
          placeholder={t('chat.typeMessage')}
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          onFocus={() => {
            setShowQuickMessages(false);
            setShowAttachMenu(false);
          }}
        />
      )}

      {/* Send or Record Button */}
      {inputText.trim() ? (
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleSendMessage()}
        >
          <MaterialCommunityIcons name="send" size={20} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: isRecording ? '#F44336' : theme.colors.primary,
            },
          ]}
          onPress={() => (isRecording ? stopRecording(true) : startRecording())}
          onLongPress={startRecording}
        >
          <MaterialCommunityIcons
            name={isRecording ? 'stop' : 'microphone'}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderModeSelector = () => (
    <Modal
      visible={showModeSelector}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModeSelector(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowModeSelector(false)}>
        <View style={[styles.modeModal, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modeModalTitle, { color: theme.colors.text }]}>
            {t('chat.connectionMode')}
          </Text>
          <Text style={[styles.modeModalSubtitle, { color: theme.colors.textSecondary }]}>
            {t('chat.connectionModeDesc')}
          </Text>

          {CONNECTION_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.mode}
              style={[
                styles.modeOption,
                connectionMode === mode.mode && {
                  backgroundColor: mode.color + '15',
                  borderColor: mode.color,
                },
              ]}
              onPress={() => {
                setConnectionMode(mode.mode);
                setShowModeSelector(false);
                Toast.show({
                  type: 'success',
                  text1: t(`chat.mode${mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}`),
                });
              }}
            >
              <View style={[styles.modeIconContainer, { backgroundColor: mode.color + '20' }]}>
                <MaterialCommunityIcons name={mode.icon as any} size={24} color={mode.color} />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeOptionTitle, { color: theme.colors.text }]}>
                  {t(`chat.mode${mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}`)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: theme.colors.textSecondary }]}>
                  {t(`chat.mode${mode.mode.charAt(0).toUpperCase() + mode.mode.slice(1)}Desc`)}
                </Text>
              </View>
              {connectionMode === mode.mode && (
                <MaterialCommunityIcons name="check-circle" size={24} color={mode.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  const renderMediaViewer = () => {
    if (!selectedMedia) return null;

    return (
      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.mediaViewer}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.9)' }]} />

          <TouchableOpacity
            style={styles.closeMediaButton}
            onPress={() => setSelectedMedia(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </TouchableOpacity>

          {selectedMedia.type === 'image' && (
            <Image
              source={{ uri: selectedMedia.media?.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}

          {selectedMedia.type === 'video' && (
            <Video
              source={{ uri: selectedMedia.media?.uri || '' }}
              style={styles.fullVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>
    );
  };

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {renderHeader()}

      {/* Connection Mode Banner */}
      {connectionMode !== 'online' && (
        <View style={[styles.modeBanner, { backgroundColor: getModeConfig().color + '20' }]}>
          <MaterialCommunityIcons
            name={getModeConfig().icon as any}
            size={16}
            color={getModeConfig().color}
          />
          <Text style={[styles.modeBannerText, { color: getModeConfig().color }]}>
            {t(`chat.mode${connectionMode.charAt(0).toUpperCase() + connectionMode.slice(1)}Active`)}
          </Text>
          {pendingMessages.length > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: getModeConfig().color }]}>
              <Text style={styles.pendingBadgeText}>{pendingMessages.length}</Text>
            </View>
          )}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {renderQuickMessages()}
      {showAttachMenu && renderAttachMenu()}
      {renderInput()}
      {renderModeSelector()}
      {renderMediaViewer()}
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typingText: {
    fontSize: 12,
    marginTop: 2,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  modeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mode Banner
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  modeBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  // Messages
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 28,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
  },
  mediaBubble: {
    padding: 4,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  statusIcon: {
    marginLeft: 4,
  },

  // Media
  mediaImage: {
    width: 220,
    height: 160,
    borderRadius: 16,
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },

  // Audio
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  audioPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flex: 1,
    marginLeft: 12,
  },
  audioProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 11,
    marginTop: 4,
  },

  // File
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 160,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },

  // Quick Messages
  quickMessagesContainer: {
    paddingVertical: 8,
  },
  quickMessagesList: {
    paddingHorizontal: 12,
  },
  quickMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickMessageIcon: {
    marginRight: 6,
  },
  quickMessageText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Attach Menu
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachOption: {
    alignItems: 'center',
  },
  attachIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    fontSize: 15,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recording
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 12,
  },
  recordingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelRecording: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // Mode Selector Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modeModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
  },
  modeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modeModalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeOptionDesc: {
    fontSize: 13,
  },

  // Media Viewer
  mediaViewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeMediaButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  fullVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
});

export default ChatScreen;