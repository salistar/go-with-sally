/**
 * ============================================================================
 * GO WITH SALLY - CONVERSATIONS LIST SCREEN
 * ============================================================================
 * Liste des conversations de l'utilisateur
 * 
 * @module screens/common/ConversationsListScreen
 * @version 1.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utils/ThemeContext';
import { chatAPI, Conversation } from '../../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  theme: any;
}

// ============================================================================
// CONVERSATION ITEM COMPONENT
// ============================================================================

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  onPress,
  theme,
}) => {
  const { t } = useTranslation();
  
  // Trouver l'autre participant
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUserId
  ) || conversation.participants[0];

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('chat.justNow') || 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  // Obtenir le preview du dernier message
  const getMessagePreview = () => {
    if (!conversation.lastMessage) return t('chat.noMessages') || 'Aucun message';
    
    const msg = conversation.lastMessage;
    const isMyMessage = msg.sender._id === currentUserId;
    const prefix = isMyMessage ? (t('chat.you') || 'Vous') + ': ' : '';

    switch (msg.type) {
      case 'text':
        return prefix + (msg.content || '');
      case 'image':
        return prefix + '📷 ' + (t('chat.photo') || 'Photo');
      case 'video':
        return prefix + '🎥 ' + (t('chat.video') || 'Vidéo');
      case 'audio':
        return prefix + '🎤 ' + (t('chat.voiceMessage') || 'Message vocal');
      case 'file':
        return prefix + '📎 ' + (t('chat.file') || 'Fichier');
      case 'location':
        return prefix + '📍 ' + (t('chat.location') || 'Position');
      default:
        return prefix + (t('chat.message') || 'Message');
    }
  };

  // Obtenir les initiales
  const getInitials = () => {
    const first = otherParticipant.firstName?.charAt(0) || '';
    const last = otherParticipant.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        { backgroundColor: hasUnread ? theme.colors.primaryLight + '20' : theme.colors.surface },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {otherParticipant.avatar ? (
          <Image source={{ uri: otherParticipant.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        )}
        {/* Badge non lu */}
        {hasUnread && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.unreadBadgeText}>
              {conversation.unreadCount! > 9 ? '9+' : conversation.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.conversationName,
              { color: theme.colors.text },
              hasUnread && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {otherParticipant.firstName} {otherParticipant.lastName}
          </Text>
          <Text style={[styles.conversationTime, { color: theme.colors.textSecondary }]}>
            {conversation.lastMessage
              ? formatDate(conversation.lastMessage.createdAt)
              : formatDate(conversation.updatedAt)}
          </Text>
        </View>
        <Text
          style={[
            styles.conversationPreview,
            { color: theme.colors.textSecondary },
            hasUnread && styles.unreadPreview,
          ]}
          numberOfLines={1}
        >
          {getMessagePreview()}
        </Text>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ConversationsListScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  // États
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Récupérer depuis le store Redux
  const currentUserId = 'user_001';

  // ============================================================================
  // CHARGEMENT DES CONVERSATIONS
  // ============================================================================

  const loadConversations = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await chatAPI.getConversations();
      
      if (response.data.success) {
        setConversations(response.data.conversations || []);
      } else {
        setError(t('chat.errorLoadingConversations') || 'Erreur de chargement');
      }
    } catch (err: any) {
      console.error('[ConversationsList] Erreur:', err);
      setError(err.message || t('chat.errorLoadingConversations') || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations(true);
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const openChat = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find(
      (p) => p._id !== currentUserId
    ) || conversation.participants[0];

    navigation.navigate('Chat', {
      recipientId: otherParticipant._id,
      recipientName: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
      recipientAvatar: otherParticipant.avatar,
      conversationId: conversation._id,
      rideId: conversation.rideId,
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      currentUserId={currentUserId}
      onPress={() => openChat(item)}
      theme={theme}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="message-text-outline"
        size={80}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('chat.noConversations') || 'Aucune conversation'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {t('chat.noConversationsHint') || 'Vos conversations apparaîtront ici'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={80}
        color={theme.colors.error}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('common.error') || 'Erreur'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => loadConversations()}
      >
        <Text style={styles.retryButtonText}>{t('common.retry') || 'Réessayer'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('chat.messages') || 'Messages'}
        </Text>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {t('common.loading') || 'Chargement...'}
          </Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationPreview: {
    fontSize: 14,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  unreadPreview: {
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginLeft: 84,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationsListScreen;