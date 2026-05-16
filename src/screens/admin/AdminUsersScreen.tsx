/**
 * ============================================================================
 * GO WITH SALLY - ADMIN USERS SCREEN
 * ============================================================================
 * Gestion des utilisatrices (passagères) - Connecté à l'API
 * 
 * Fonctionnalités:
 * - Liste des utilisatrices avec recherche
 * - Filtres par statut (toutes, actives, bloquées)
 * - Modal de détails avec actions (appeler, bloquer, débloquer)
 * - Support des 3 modes (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Support multilingue (FR, AR, EN)
 * - Animations d'entrée
 * 
 * @module screens/admin/AdminUsersScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  I18nManager,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Theme
import { useTheme } from '../../utils/ThemeContext';

// API
import { adminAPI } from '../../services/api';

// Configuration des modes
import {
  APP_MODE,
  IS_OFFLINE,
  IS_HYBRID,
  IS_ONLINE,
  getModeEmoji,
  getModeDescription,
} from '../../config/appMode';

// ============================================================================
// CONSTANTES
// ============================================================================

const FILE_NAME = '[AdminUsersScreen]';
const isRTL = I18nManager.isRTL;

// ============================================================================
// TYPES
// ============================================================================

interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  status?: 'active' | 'inactive' | 'blocked';
  totalRides?: number;
  totalSpent?: number;
  rating?: number;
  joinedAt?: string;
  createdAt?: string;
  lastRide?: string;
  favoritePayment?: 'cash' | 'card' | 'wallet';
}

type FilterType = 'all' | 'active' | 'blocked';

// ============================================================================
// DONNÉES MOCK
// ============================================================================

const MOCK_USERS: User[] = [
  {
    _id: 'user_001',
    firstName: 'Fatima',
    lastName: 'Benali',
    email: 'fatima.benali@email.com',
    phone: '+212612345678',
    isActive: true,
    status: 'active',
    totalRides: 45,
    totalSpent: 2850,
    rating: 4.8,
    createdAt: '2024-03-15',
    lastRide: 'Il y a 2 jours',
    favoritePayment: 'cash',
  },
  {
    _id: 'user_002',
    firstName: 'Amina',
    lastName: 'El Amrani',
    email: 'amina.elamrani@email.com',
    phone: '+212698765432',
    isActive: true,
    status: 'active',
    totalRides: 23,
    totalSpent: 1450,
    rating: 4.9,
    createdAt: '2024-06-20',
    lastRide: 'Il y a 1 semaine',
    favoritePayment: 'card',
  },
  {
    _id: 'user_003',
    firstName: 'Salma',
    lastName: 'Tazi',
    email: 'salma.tazi@email.com',
    phone: '+212655443322',
    isActive: true,
    status: 'active',
    totalRides: 12,
    totalSpent: 780,
    rating: 4.5,
    createdAt: '2024-09-10',
    lastRide: 'Hier',
    favoritePayment: 'wallet',
  },
  {
    _id: 'user_004',
    firstName: 'Nadia',
    lastName: 'Chaoui',
    email: 'nadia.chaoui@email.com',
    phone: '+212677889900',
    isActive: false,
    status: 'blocked',
    totalRides: 8,
    totalSpent: 520,
    rating: 3.2,
    createdAt: '2024-07-05',
    lastRide: 'Bloquée',
  },
  {
    _id: 'user_005',
    firstName: 'Khadija',
    lastName: 'Alaoui',
    email: 'khadija.alaoui@email.com',
    phone: '+212611223344',
    isActive: true,
    status: 'active',
    totalRides: 67,
    totalSpent: 4200,
    rating: 4.7,
    createdAt: '2024-01-20',
    lastRide: 'Aujourd\'hui',
    favoritePayment: 'cash',
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AdminUsersScreen: React.FC = () => {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ==========================================================================
  // LOGS DE DÉMARRAGE
  // ==========================================================================

  useEffect(() => {
    console.log(`${FILE_NAME} ════════════════════════════════════════`);
    console.log(`${FILE_NAME} 🚀 Initialisation`);
    console.log(`${FILE_NAME} ${getModeEmoji()} Mode: ${APP_MODE}`);
    console.log(`${FILE_NAME} 🎨 Thème: ${isDark ? 'Sombre' : 'Clair'}`);
    console.log(`${FILE_NAME} 🌍 Langue: ${i18n.language}`);
    console.log(`${FILE_NAME} ════════════════════════════════════════`);

    return () => {
      console.log(`${FILE_NAME} 👋 Composant démonté`);
    };
  }, []);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ==========================================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================================

  const loadUsers = useCallback(async () => {
    console.log(`${FILE_NAME} 📊 Chargement des utilisatrices...`);

    // Mode OFFLINE
    if (IS_OFFLINE) {
      console.log(`${FILE_NAME} 🔴 Mode OFFLINE - Données mock`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = MOCK_USERS;
      if (filter === 'active') {
        filtered = MOCK_USERS.filter((u) => u.isActive && u.status !== 'blocked');
      } else if (filter === 'blocked') {
        filtered = MOCK_USERS.filter((u) => !u.isActive || u.status === 'blocked');
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.firstName?.toLowerCase().includes(query) ||
            u.lastName?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        );
      }

      setUsers(filtered);
      setLoading(false);
      setRefreshing(false);
      console.log(`${FILE_NAME} ✅ ${filtered.length} utilisatrices (mock)`);
      return;
    }

    // Mode HYBRID / ONLINE
    try {
      console.log(`${FILE_NAME} ${getModeEmoji()} Appel API getUsers...`);

      const response = await adminAPI.getUsers({
        page: 1,
        limit: 50,
        search: searchQuery || undefined,
        status: filter === 'all' ? undefined : filter,
      });

      if (response.data.success) {
        const fetchedUsers = response.data.data.users || [];
        const normalizedUsers = fetchedUsers.map((u: any) => ({
          ...u,
          id: u._id || u.id,
          status: u.isActive === false ? 'blocked' : 'active',
        }));
        setUsers(normalizedUsers);
        console.log(`${FILE_NAME} ✅ ${normalizedUsers.length} utilisatrices`);
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Erreur:`, error?.message);

      // Fallback en mode HYBRID
      if (IS_HYBRID) {
        console.log(`${FILE_NAME} 🟡 Fallback données mock`);
        let filtered = MOCK_USERS;
        if (filter === 'active') {
          filtered = MOCK_USERS.filter((u) => u.isActive && u.status !== 'blocked');
        } else if (filter === 'blocked') {
          filtered = MOCK_USERS.filter((u) => !u.isActive || u.status === 'blocked');
        }
        setUsers(filtered);
      } else {
        Toast.show({
          type: 'error',
          text1: t('errors.error'),
          text2: t('admin.users.loadError'),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter, t]);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        loadUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 Pull to refresh`);
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleViewDetails = useCallback((user: User) => {
    console.log(`${FILE_NAME} 👤 Détails: ${user._id}`);
    setSelectedUser(user);
    setModalVisible(true);
  }, []);

  const handleBlock = useCallback(
    async (user: User) => {
      Alert.alert(
        t('admin.users.blockTitle'),
        t('admin.users.blockConfirm', { name: `${user.firstName} ${user.lastName}` }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('admin.users.block'),
            style: 'destructive',
            onPress: async () => {
              setProcessing(true);

              // Mode OFFLINE
              if (IS_OFFLINE) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setUsers((prev) =>
                  prev.map((u) =>
                    u._id === user._id ? { ...u, isActive: false, status: 'blocked' as const } : u
                  )
                );
                setModalVisible(false);
                setProcessing(false);
                Toast.show({
                  type: 'info',
                  text1: t('admin.users.blocked'),
                  text2: t('admin.users.blockedDesc', { name: user.firstName }),
                });
                return;
              }

              try {
                const response = await adminAPI.toggleBlockUser(user._id);

                if (response.data.success) {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u._id === user._id ? { ...u, isActive: false, status: 'blocked' as const } : u
                    )
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: t('admin.users.blocked'),
                    text2: t('admin.users.blockedDesc', { name: user.firstName }),
                  });
                }
              } catch (error: any) {
                console.error(`${FILE_NAME} ❌ Erreur blocage:`, error?.message);

                if (IS_HYBRID) {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u._id === user._id ? { ...u, isActive: false, status: 'blocked' as const } : u
                    )
                  );
                  setModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: t('admin.users.blocked'),
                    text2: t('admin.users.blockedDesc', { name: user.firstName }),
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: t('errors.error'),
                    text2: error?.message || t('admin.users.blockError'),
                  });
                }
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
    },
    [t]
  );

  const handleUnblock = useCallback(
    async (user: User) => {
      setProcessing(true);

      // Mode OFFLINE
      if (IS_OFFLINE) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isActive: true, status: 'active' as const } : u
          )
        );
        setModalVisible(false);
        setProcessing(false);
        Toast.show({
          type: 'success',
          text1: t('admin.users.unblocked'),
          text2: t('admin.users.unblockedDesc', { name: user.firstName }),
        });
        return;
      }

      try {
        const response = await adminAPI.toggleBlockUser(user._id);

        if (response.data.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u._id === user._id ? { ...u, isActive: true, status: 'active' as const } : u
            )
          );
          setModalVisible(false);
          Toast.show({
            type: 'success',
            text1: t('admin.users.unblocked'),
            text2: t('admin.users.unblockedDesc', { name: user.firstName }),
          });
        }
      } catch (error: any) {
        console.error(`${FILE_NAME} ❌ Erreur déblocage:`, error?.message);

        if (IS_HYBRID) {
          setUsers((prev) =>
            prev.map((u) =>
              u._id === user._id ? { ...u, isActive: true, status: 'active' as const } : u
            )
          );
          setModalVisible(false);
          Toast.show({
            type: 'success',
            text1: t('admin.users.unblocked'),
            text2: t('admin.users.unblockedDesc', { name: user.firstName }),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t('errors.error'),
            text2: error?.message || t('admin.users.unblockError'),
          });
        }
      } finally {
        setProcessing(false);
      }
    },
    [t]
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getStatusColor = useCallback((user: User) => {
    if (!user.isActive || user.status === 'blocked') return '#F44336';
    return '#4CAF50';
  }, []);

  const getStatusLabel = useCallback(
    (user: User) => {
      if (!user.isActive || user.status === 'blocked') return t('admin.users.statusBlocked');
      return t('admin.users.statusActive');
    },
    [t]
  );

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive !== false && u.status !== 'blocked').length,
    blocked: users.filter((u) => u.isActive === false || u.status === 'blocked').length,
  };

  // Filtrer les utilisateurs (déjà filtré côté API/mock mais pour la recherche locale)
  const filteredUsers = users;

  // ==========================================================================
  // COMPOSANTS INTERNES
  // ==========================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444';
      if (IS_HYBRID) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={[styles.modeBadge, { backgroundColor: getBadgeColor() + '20' }]}>
        <Text style={styles.modeBadgeEmoji}>{getModeEmoji()}</Text>
        <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>
          {APP_MODE.toUpperCase()}
        </Text>
      </View>
    );
  };

  // ==========================================================================
  // RENDU - LOADING STATE
  // ==========================================================================

  if (loading && users.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('admin.users.loading')}
        </Text>
      </View>
    );
  }

  // ==========================================================================
  // RENDU PRINCIPAL
  // ==========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('admin.users.title')}</Text>

        {__DEV__ ? <ModeBadge /> : <View style={{ width: 40 }} />}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.colors.surface, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('admin.users.searchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={[styles.filterContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {[
          { key: 'all', label: `${t('admin.users.filterAll')} (${stats.total})` },
          { key: 'active', label: `${t('admin.users.filterActive')} (${stats.active})` },
          { key: 'blocked', label: `${t('admin.users.filterBlocked')} (${stats.blocked})` },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.key ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={() => setFilter(f.key as FilterType)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === f.key ? 'white' : theme.colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {filteredUsers.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleViewDetails(user)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.avatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {user.firstName?.[0] || '?'}
                    {user.lastName?.[0] || '?'}
                  </Text>
                </View>
                <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={[styles.cardEmail, { color: theme.colors.textSecondary }]}>
                    {user.email}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(user)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(user) }]}>
                    {getStatusLabel(user)}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.cardStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <MaterialCommunityIcons name="car" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.cardStatText, { color: theme.colors.text }]}>
                    {user.totalRides || 0} {t('admin.users.rides')}
                  </Text>
                </View>
                <View style={[styles.cardStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <MaterialCommunityIcons name="phone" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.cardStatText, { color: theme.colors.text }]}>
                    {user.phone || 'N/A'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.cardFooter,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.lastRide, { color: theme.colors.textSecondary }]}>
                  {user.lastRide || `${t('admin.users.joined')}: ${user.createdAt?.substring(0, 10) || 'N/A'}`}
                </Text>
                <MaterialCommunityIcons
                  name={isRTL ? 'chevron-left' : 'chevron-right'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('admin.users.empty')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Mode Footer */}
        <View style={[styles.modeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.modeFooterText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
      </ScrollView>

      {/* Modal Détails */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {selectedUser && (
              <>
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('admin.users.profileTitle')}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* User Info */}
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalUserHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.modalAvatar, { backgroundColor: `${theme.colors.primary}20` }]}>
                        <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>
                          {selectedUser.firstName?.[0]}
                          {selectedUser.lastName?.[0]}
                        </Text>
                      </View>
                      <View style={[styles.modalUserInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.modalUserName, { color: theme.colors.text }]}>
                          {selectedUser.firstName} {selectedUser.lastName}
                        </Text>
                        {selectedUser.rating && (
                          <View style={[styles.modalRatingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                            <Text style={[styles.modalRating, { color: theme.colors.text }]}>
                              {selectedUser.rating}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Contact */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.users.contact')}
                  </Text>
                  <View style={[styles.modalSection, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {selectedUser.email}
                      </Text>
                    </View>
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                      <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        {selectedUser.phone || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t('admin.users.statistics')}
                  </Text>
                  <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                      <MaterialCommunityIcons name="car-multiple" size={24} color={theme.colors.primary} />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {selectedUser.totalRides || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        {t('admin.users.rides')}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                      <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {(selectedUser.totalSpent || 0).toLocaleString()}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        DH {t('admin.users.spent')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Actions */}
                <View
                  style={[
                    styles.modalActions,
                    { borderTopColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="phone" size={20} color="#4CAF50" />
                    <Text style={styles.callBtnText}>{t('admin.users.call')}</Text>
                  </TouchableOpacity>
                  {selectedUser.isActive === false || selectedUser.status === 'blocked' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.unblockBtn]}
                      onPress={() => handleUnblock(selectedUser)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color="white" />
                          <Text style={styles.unblockBtnText}>{t('admin.users.unblock')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.blockBtn]}
                      onPress={() => handleBlock(selectedUser)}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="block-helper" size={20} color="white" />
                          <Text style={styles.blockBtnText}>{t('admin.users.block')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modeBadgeEmoji: { fontSize: 10 },
  modeBadgeText: { fontSize: 9, fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  // Filter
  filterRow: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Card
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginHorizontal: 12 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardEmail: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardStats: { justifyContent: 'space-between', marginTop: 12 },
  cardStat: { alignItems: 'center', gap: 6 },
  cardStatText: { fontSize: 13 },
  cardFooter: { justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  lastRide: { fontSize: 12 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },

  // Mode Footer
  modeFooter: { alignItems: 'center', paddingTop: 20 },
  modeFooterText: { fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 16 },
  modalSection: { borderRadius: 16, padding: 16, marginBottom: 16 },
  modalUserHeader: { alignItems: 'center' },
  modalAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { fontSize: 20, fontWeight: 'bold' },
  modalUserInfo: { marginHorizontal: 16 },
  modalUserName: { fontSize: 18, fontWeight: '600' },
  modalRatingRow: { alignItems: 'center', marginTop: 4, gap: 4 },
  modalRating: { fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoRow: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  infoText: { fontSize: 14 },
  statsGrid: { gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  modalActions: { padding: 16, gap: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  callBtn: { backgroundColor: '#E8F5E9' },
  callBtnText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  blockBtn: { backgroundColor: '#F44336' },
  blockBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  unblockBtn: { backgroundColor: '#4CAF50' },
  unblockBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

// ============================================================================
// EXPORT
// ============================================================================

export default AdminUsersScreen;