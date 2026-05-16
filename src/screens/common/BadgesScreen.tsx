// ============================================================
// 📄 BadgesScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[BadgesScreen.tsx] ▶ Module loaded')
//   • console.log('[BadgesScreen.tsx] ▶ BadgesScreen() rendered')
//   • console.log('[BadgesScreen.tsx] ▶ handleBadgePress() called')
//   • console.log('[BadgesScreen.tsx] ▶ loadBadges() called')
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[BadgesScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

/**
 * Badge interface
 */
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  unlockedDate?: Date;
  progress?: number; // 0-100
  requirement: string;
}

/**
 * BadgesScreen Component
 * Displays user achievements and badges
 */
const BadgesScreen = () => {
  console.log(`${FILE_NAME} ▶ BadgesScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [badges, setBadges] = useState<Badge[]>([
    {
      id: '1',
      name: t('badge.traveler', 'Voyageuse'),
      description: t('badge.travelerDesc', 'Effectuez 10 trajets'),
      icon: 'suitcase',
      color: '#FF6B6B',
      isUnlocked: true,
      unlockedDate: new Date('2025-02-15'),
      requirement: t('badge.requirement10', '10 trajets'),
    },
    {
      id: '2',
      name: t('badge.earlyBird', 'Lève-tôt'),
      description: t('badge.earlyBirdDesc', 'Effectuez 5 trajets avant 7h00'),
      icon: 'sun-clock',
      color: '#FFD93D',
      isUnlocked: true,
      unlockedDate: new Date('2025-02-20'),
      requirement: t('badge.requirement5Morning', '5 trajets matin'),
    },
    {
      id: '3',
      name: t('badge.nightOwl', 'Noctambule'),
      description: t('badge.nightOwlDesc', 'Effectuez 5 trajets après 22h00'),
      icon: 'moon-waning-crescent',
      color: '#4D96FF',
      isUnlocked: false,
      progress: 60,
      requirement: t('badge.requirement5Night', '5 trajets nuit'),
    },
    {
      id: '4',
      name: t('badge.longDistance', 'Grande voyageuse'),
      description: t('badge.longDistanceDesc', 'Cumulez 100km en trajets'),
      icon: 'map-path',
      color: '#95E1D3',
      isUnlocked: false,
      progress: 45,
      requirement: t('badge.requirement100km', '100 km'),
    },
    {
      id: '5',
      name: t('badge.safeDriver', 'Conductrice sûre'),
      description: t('badge.safeDriverDesc', 'Maintenez une note de 4.8+ pendant 20 trajets'),
      icon: 'shield-check',
      color: '#38ADA9',
      isUnlocked: false,
      progress: 85,
      requirement: t('badge.requirement4.8', '4.8+ note'),
    },
    {
      id: '6',
      name: t('badge.socialButterfly', 'Sociable'),
      description: t('badge.socialButterflyDesc', 'Participez à 10 trajets groupés'),
      icon: 'people-circle',
      color: '#F77F00',
      isUnlocked: false,
      progress: 30,
      requirement: t('badge.requirement10Pool', '10 trajets pool'),
    },
  ]);

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
      loadBadges();
    }, [])
  );

  const loadBadges = async () => {
    console.log(`${FILE_NAME} ▶ loadBadges() called`);

    setLoading(true);
    try {
      // In a real app, fetch from backend
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgePress = (badge: Badge) => {
    console.log(`${FILE_NAME} ▶ handleBadgePress() called for badge ${badge.id}`);

    setSelectedBadge(badge);
  };

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const renderBadgeCard = ({ item }: { item: Badge }) => (
    <TouchableOpacity
      style={[styles.badgeCard, { backgroundColor: item.isUnlocked ? theme.colors.surface : theme.colors.background }]}
      onPress={() => handleBadgePress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badgeIconWrapper,
          {
            backgroundColor: `${item.color}20`,
            opacity: item.isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={32}
          color={item.color}
        />
      </View>

      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.badgeDescription, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        {!item.isUnlocked && item.progress !== undefined && (
          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: item.color,
                    width: `${item.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {item.progress}%
            </Text>
          </View>
        )}
      </View>

      {item.isUnlocked && (
        <MaterialCommunityIcons
          name="check-circle"
          size={24}
          color={item.color}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerTitleText, { color: theme.colors.text }]}>
            {t('badges.title', 'Badges')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {unlockedCount} {t('badges.unlocked', 'débloqués')}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadgeCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            paddingBottom: insets.bottom + 20,
          }}
          numColumns={2}
          columnWrapperStyle={styles.badgesGrid}
        />
      )}

      {/* Badge Detail Modal - Simplified */}
      {selectedBadge && (
        <View
          style={[
            styles.detailOverlay,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        >
          <View
            style={[
              styles.detailCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <TouchableOpacity
              style={styles.detailClose}
              onPress={() => setSelectedBadge(null)}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <LinearGradient
              colors={[selectedBadge.color, selectedBadge.color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailHeader}
            >
              <MaterialCommunityIcons
                name={selectedBadge.icon as any}
                size={60}
                color="white"
              />
              <Text style={styles.detailName}>{selectedBadge.name}</Text>
            </LinearGradient>

            <View style={styles.detailContent}>
              <Text style={[styles.detailDescription, { color: theme.colors.text }]}>
                {selectedBadge.description}
              </Text>

              <Text
                style={[
                  styles.detailRequirement,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('badges.requirement', 'Exigence')}: {selectedBadge.requirement}
              </Text>

              {selectedBadge.isUnlocked && selectedBadge.unlockedDate && (
                <View
                  style={[
                    styles.unlockedBadge,
                    { backgroundColor: `${selectedBadge.color}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={selectedBadge.color}
                  />
                  <Text
                    style={[
                      styles.unlockedText,
                      { color: selectedBadge.color },
                    ]}
                  >
                    {t('badges.unlockedOn', 'Débloqué le')}{' '}
                    {selectedBadge.unlockedDate.toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}

              {!selectedBadge.isUnlocked && selectedBadge.progress !== undefined && (
                <View style={styles.detailProgress}>
                  <View
                    style={[
                      styles.detailProgressBar,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.detailProgressFill,
                        {
                          backgroundColor: selectedBadge.color,
                          width: `${selectedBadge.progress}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.detailProgressText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {selectedBadge.progress}% {t('badges.complete', 'complet')}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.detailCloseBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedBadge(null)}
            >
              <Text style={styles.detailCloseBtnText}>
                {t('common.close', 'Fermer')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesGrid: {
    gap: 12,
  },
  badgeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  badgeIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeInfo: {
    flex: 1,
    width: '100%',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  progressSection: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
    textAlign: 'center',
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailCard: {
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 300,
  },
  detailClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  detailName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  detailContent: {
    padding: 16,
    gap: 12,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  detailRequirement: {
    fontSize: 12,
    textAlign: 'center',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailProgress: {
    gap: 8,
  },
  detailProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
  },
  detailProgressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  detailCloseBtn: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BadgesScreen;
