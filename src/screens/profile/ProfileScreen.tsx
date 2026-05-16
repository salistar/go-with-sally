/**
 * ============================================================================
 * GO WITH SALLY - PROFILE SCREEN
 * ============================================================================
 * Écran de profil utilisateur avec:
 * - Informations personnelles
 * - Statistiques (courses, note, points)
 * - Menu de navigation vers les sous-écrans
 * - Badge du mode actuel (offline/hybrid/online)
 * - Support RTL pour l'arabe
 * - Design moderne avec animations
 * 
 * @module screens/profile/ProfileScreen
 * @version 2.0.0
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Animated,
  I18nManager,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context & Store
import { useTheme } from '../../utils/ThemeContext';
import { logout } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';

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
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// ============================================================================
// COMPONENT
// ============================================================================

const ProfileScreen: React.FC = () => {
  // Hooks
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  // State
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Animation au montage
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ============================================================================
  // MENU ITEMS
  // ============================================================================

  const menuItems = [
    {
      icon: 'history',
      label: t('profile.rideHistory'),
      subtitle: t('profile.viewAllRides'),
      color: '#FF69B4',
      screen: 'RideHistory',
    },
    {
      icon: 'credit-card-outline',
      label: t('profile.paymentMethods'),
      subtitle: t('profile.managePayments'),
      color: '#4CAF50',
      screen: 'PaymentMethods',
    },
    {
      icon: 'map-marker-star',
      label: t('profile.savedPlaces'),
      subtitle: t('profile.homeWorkFavorites'),
      color: '#2196F3',
      screen: 'SavedPlaces',
    },
    {
      icon: 'shield-account-outline',
      label: t('profile.emergencyContacts'),
      subtitle: t('profile.safetyFirst'),
      color: '#FF9800',
      screen: 'EmergencyContacts',
    },
    {
      icon: 'gift-outline',
      label: t('profile.rewards'),
      subtitle: t('profile.pointsAndOffers'),
      color: '#E91E63',
      screen: 'Rewards',
    },
    {
      icon: 'cog-outline',
      label: t('profile.settings'),
      subtitle: t('profile.appPreferences'),
      color: '#9C27B0',
      screen: 'Settings',
    },
    {
      icon: 'help-circle-outline',
      label: t('profile.help'),
      subtitle: t('profile.supportFaq'),
      color: '#00BCD4',
      screen: 'Help',
    },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simuler un refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { 
          text: t('common.cancel'), 
          style: 'cancel' 
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // ============================================================================
  // MODE BADGE COMPONENT
  // ============================================================================

  const ModeBadge = () => {
    const getBadgeColor = () => {
      if (IS_OFFLINE) return '#EF4444'; // Rouge
      if (IS_HYBRID) return '#F59E0B'; // Orange
      return '#10B981'; // Vert
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

  // ============================================================================
  // STATS CARD COMPONENT
  // ============================================================================

  const StatCard = ({ 
    value, 
    label, 
    icon 
  }: { 
    value: string | number; 
    label: string; 
    icon: string;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={20} color="white" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // ============================================================================
  // MENU ITEM COMPONENT
  // ============================================================================

  const MenuItem = ({ 
    item, 
    index 
  }: { 
    item: typeof menuItems[0]; 
    index: number;
  }) => {
    const [pressed, setPressed] = useState(false);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20 * (index + 1), 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.menuItem,
            { 
              backgroundColor: theme.colors.surface,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={() => navigation.navigate(item.screen)}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={0.9}
        >
          {/* Icon */}
          <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={24} 
              color={item.color} 
            />
          </View>

          {/* Text Container */}
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
              {item.label}
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
              {item.subtitle}
            </Text>
          </View>

          {/* Chevron */}
          <MaterialCommunityIcons
            name={isRTL ? 'chevron-left' : 'chevron-right'}
            size={24}
            color={theme.colors.textLight}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#FF69B4']}
          tintColor="#FF69B4"
        />
      }
    >
      {/* ================================================================== */}
      {/* HEADER GRADIENT */}
      {/* ================================================================== */}
      <LinearGradient
        colors={['#FF69B4', '#FF1493', '#DB7093']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        {/* Mode Badge */}
        <View style={styles.headerTop}>
          <ModeBadge />
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase()}
                {user?.lastName?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          
          {/* Verification Badge */}
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#4CAF50" />
            </View>
          )}
        </Animated.View>

        {/* Name & Email */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </Animated.View>

        {/* Level Badge */}
        {user?.level && (
          <View style={styles.levelBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
            <Text style={styles.levelText}>{user.level}</Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            value={user?.stats?.totalRides || 0}
            label={t('profile.rides')}
            icon="car"
          />
          <StatCard
            value={user?.stats?.averageRating?.toFixed(1) || '5.0'}
            label={t('profile.rating')}
            icon="star"
          />
          <StatCard
            value={user?.points || 0}
            label={t('profile.points')}
            icon="gift"
          />
        </View>
      </LinearGradient>

      {/* ================================================================== */}
      {/* MENU ITEMS */}
      {/* ================================================================== */}
      <View style={styles.menuContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('profile.quickActions')}
        </Text>
        
        {menuItems.map((item, index) => (
          <MenuItem key={item.screen} item={item} index={index} />
        ))}
      </View>

      {/* ================================================================== */}
      {/* LOGOUT BUTTON */}
      {/* ================================================================== */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          { 
            backgroundColor: theme.colors.error + '10',
            borderColor: theme.colors.error + '30',
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="logout" size={22} color={theme.colors.error} />
        <Text style={[styles.logoutText, { color: theme.colors.error }]}>
          {t('profile.logout')}
        </Text>
      </TouchableOpacity>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <View style={styles.footer}>
        <Text style={[styles.version, { color: theme.colors.textLight }]}>
          Go With Sally v1.0.0
        </Text>
        <View style={styles.modeInfo}>
          <Text style={[styles.modeInfoText, { color: theme.colors.textLight }]}>
            {getModeEmoji()} {getModeDescription()}
          </Text>
        </View>
        <Text style={[styles.copyright, { color: theme.colors.textLight }]}>
          © 2025 Go With Sally. {t('profile.allRightsReserved')}
        </Text>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
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
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Mode Badge
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  modeBadgeEmoji: {
    fontSize: 14,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Edit Button
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // User Info
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  phone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },

  // Level Badge
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  levelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu
  menuContainer: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  version: {
    fontSize: 13,
    fontWeight: '500',
  },
  modeInfo: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  modeInfoText: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ProfileScreen;