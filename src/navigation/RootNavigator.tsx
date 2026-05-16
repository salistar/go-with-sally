/**
 * ============================================================================
 * GO WITH SALLY - ROOT NAVIGATOR (v2.1.0 COMPLETE)
 * ============================================================================
 * ✅ CORRECTIONS:
 * - Ajout des écrans manquants: EditProfile, BecomeDriver, Favorites, 
 *   EmergencyContacts, NotificationSettings, Help
 * - Support complet des 3 langues (fr, ar, en)
 * - Support des 3 modes (offline, hybrid, online)
 * 
 * FLUX DE VÉRIFICATION:
 * phone → email → gender → face → [documents pour drivers] → complete
 * 
 * @module navigation/RootNavigator
 * @version 2.1.0
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store';
import { setVerificationStep, setGenderVerified } from '../store/slices/authSlice';
import { APP_MODE } from '../config/appMode';

// ============================================================================
// AUTH SCREENS
// ============================================================================
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyPhoneScreen from '../screens/auth/VerifyPhoneScreen';
import VerifyFaceScreen from '../screens/auth/VerifyFaceScreen';

// ➕ ÉCRANS VERIFICATION
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import DriverRegisterScreen from '../screens/auth/DriverRegisterScreen';
import FaceLockScreen from '../screens/verification/FaceLockScreen';

// ============================================================================
// USER SCREENS
// ============================================================================
import HomeScreen from '../screens/user/HomeScreen';
import SearchLocationScreen from '../screens/user/SearchLocationScreen';
import ConfirmRideScreen from '../screens/user/ConfirmRideScreen';
import SearchingDriverScreen from '../screens/user/SearchingDriverScreen';
import RideInProgressScreen from '../screens/user/RideInProgressScreen';
import RideCompletedScreen from '../screens/user/RideCompletedScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import SettingsScreen from '../screens/user/SettingsScreen';
import RideHistoryScreen from '../screens/user/RideHistoryScreen';

// ============================================================================
// DRIVER SCREENS
// ============================================================================
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import IncomingRideScreen from '../screens/driver/IncomingRideScreen';
import NavigateToPickupScreen from '../screens/driver/NavigateToPickupScreen';
import DriverRideInProgressScreen from '../screens/driver/DriverRideInProgressScreen';
import DriverRideCompletedScreen from '../screens/driver/DriverRideCompletedScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverDocumentsScreen from '../screens/driver/DriverDocumentsScreen';
import DocumentUploadScreen from '../screens/driver/DocumentUploadScreen';

// ============================================================================
// ADMIN SCREENS
// ============================================================================
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminDriversScreen from '../screens/admin/AdminDriversScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminRidesScreen from '../screens/admin/AdminRidesScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminActivitiesScreen from '../screens/admin/AdminActivitiesScreen';

// ============================================================================
// CHAT SCREENS
// ============================================================================
import ChatScreen from '../screens/common/ChatScreen';
import ConversationsListScreen from '../screens/common/ConversationsListScreen';
import CallScreen from '../screens/common/CallScreen';
import ReceiptScreen from '../screens/common/ReceiptScreen';
import ShareTripScreen from '../screens/common/ShareTripScreen';

// ============================================================================
// REACT NATIVE IMPORTS
// ============================================================================
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Switch,
  Linking,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// ============================================================================
// PLACEHOLDER SCREENS - AVEC SUPPORT MULTILINGUE
// ============================================================================

/**
 * Écran Notifications
 */
const NotificationsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="bell" size={60} color={theme.colors.primary} />
      <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
        {t('notifications.title', 'Notifications')}
      </Text>
      <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
        {t('notifications.empty', 'Aucune notification')}
      </Text>
      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>{t('common.back', 'Retour')}</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Écran SOS
 */
const SOSScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const handleEmergencyCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="shield-alert" size={60} color="#F44336" />
      <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
        {t('sos.title', 'SOS - Urgence')}
      </Text>
      <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
        {t('sos.description', "En cas d'urgence, appelez:")}
      </Text>
      
      <View style={styles.sosButtons}>
        <TouchableOpacity 
          style={[styles.sosBtn, { backgroundColor: '#F44336' }]}
          onPress={() => handleEmergencyCall('15')}
        >
          <MaterialCommunityIcons name="ambulance" size={24} color="white" />
          <Text style={styles.sosBtnText}>SAMU (15)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sosBtn, { backgroundColor: '#2196F3' }]}
          onPress={() => handleEmergencyCall('19')}
        >
          <MaterialCommunityIcons name="police-badge" size={24} color="white" />
          <Text style={styles.sosBtnText}>Police (19)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sosBtn, { backgroundColor: '#FF9800' }]}
          onPress={() => handleEmergencyCall('15')}
        >
          <MaterialCommunityIcons name="fire-truck" size={24} color="white" />
          <Text style={styles.sosBtnText}>Pompiers (15)</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: theme.colors.border, marginTop: 30 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backBtnText, { color: theme.colors.text }]}>
          {t('common.back', 'Retour')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Écran Choisir sur la carte
 */
const ChooseOnMapScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="map-marker-plus" size={60} color={theme.colors.primary} />
      <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
        {t('map.chooseOnMap', 'Choisir sur la carte')}
      </Text>
      <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
        {t('common.comingSoon', 'Bientôt disponible')}
      </Text>
      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>{t('common.back', 'Retour')}</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Écran Modes de paiement
 */
const PaymentMethodsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const paymentMethods = [
    { icon: 'cash', label: t('payment.cash', 'Espèces'), active: true },
    { icon: 'credit-card', label: t('payment.card', 'Carte bancaire'), active: false },
    { icon: 'wallet', label: t('payment.wallet', 'Portefeuille Sally'), active: false },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('payment.methods', 'Modes de paiement')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {paymentMethods.map((method, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons 
                name={method.icon as any} 
                size={24} 
                color={method.active ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text style={[styles.listItemText, { color: theme.colors.text }]}>
                {method.label}
              </Text>
            </View>
            {method.active && (
              <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.addBtn, { borderColor: theme.colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
          <Text style={[styles.addBtnText, { color: theme.colors.primary }]}>
            {t('payment.addCard', 'Ajouter une carte')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Modifier le profil
 */
const EditProfileScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    Alert.alert(
      t('profile.saved', 'Profil sauvegardé'),
      t('profile.savedMessage', 'Vos modifications ont été enregistrées.'),
      [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.edit', 'Modifier le profil')}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerAction, { color: theme.colors.primary }]}>
            {t('common.save', 'Enregistrer')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {firstName.charAt(0)}{lastName.charAt(0)}
            </Text>
          </View>
          <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="camera" size={20} color={theme.colors.primary} />
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
              {t('profile.changePhoto', 'Changer la photo')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            {t('auth.firstName', 'Prénom')}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('auth.firstName', 'Prénom')}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            {t('auth.lastName', 'Nom')}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('auth.lastName', 'Nom')}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            {t('auth.email', 'Email')}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email', 'Email')}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            editable={false}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            {t('auth.phone', 'Téléphone')}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phone', 'Téléphone')}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            editable={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Devenir conductrice
 */
const BecomeDriverScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const benefits = [
    { icon: 'clock-outline', title: t('driver.benefit1Title', 'Horaires flexibles'), desc: t('driver.benefit1Desc', 'Travaillez quand vous voulez') },
    { icon: 'cash-multiple', title: t('driver.benefit2Title', 'Revenus attractifs'), desc: t('driver.benefit2Desc', 'Gagnez jusqu\'à 5000 DH/mois') },
    { icon: 'shield-check', title: t('driver.benefit3Title', 'Sécurité garantie'), desc: t('driver.benefit3Desc', 'Courses entre femmes uniquement') },
    { icon: 'account-group', title: t('driver.benefit4Title', 'Communauté'), desc: t('driver.benefit4Desc', 'Rejoignez +500 conductrices') },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('driver.becomeDriver', 'Devenir conductrice')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <MaterialCommunityIcons name="steering" size={80} color={theme.colors.primary} />
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            {t('driver.heroTitle', 'Rejoignez Sally!')}
          </Text>
          <Text style={[styles.heroDesc, { color: theme.colors.textSecondary }]}>
            {t('driver.heroDesc', 'Devenez conductrice et gagnez de l\'argent en toute sécurité')}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('driver.benefits', 'Avantages')}
        </Text>

        {benefits.map((benefit, index) => (
          <View key={index} style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <MaterialCommunityIcons name={benefit.icon as any} size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>{benefit.title}</Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>{benefit.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('DriverRegister')}
        >
          <Text style={styles.primaryBtnText}>
            {t('driver.startRegistration', 'Commencer l\'inscription')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: theme.colors.textSecondary }]}>
          {t('driver.requirements', 'Vous devez avoir un permis de conduire valide et un véhicule en bon état.')}
        </Text>
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Lieux favoris
 */
const FavoritesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [favorites, setFavorites] = useState([
    { id: '1', name: t('favorites.home', 'Maison'), address: 'Hay Riad, Rabat', icon: 'home' },
    { id: '2', name: t('favorites.work', 'Travail'), address: 'Technopolis, Salé', icon: 'briefcase' },
  ]);

  const handleAddFavorite = () => {
    Alert.alert(
      t('favorites.add', 'Ajouter un lieu'),
      t('favorites.addMessage', 'Cette fonctionnalité sera bientôt disponible.'),
      [{ text: t('common.ok', 'OK') }]
    );
  };

  const handleDeleteFavorite = (id: string) => {
    Alert.alert(
      t('favorites.delete', 'Supprimer'),
      t('favorites.deleteConfirm', 'Voulez-vous supprimer ce lieu?'),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        { 
          text: t('common.delete', 'Supprimer'), 
          style: 'destructive',
          onPress: () => setFavorites(favorites.filter(f => f.id !== id))
        }
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('favorites.title', 'Lieux favoris')}
        </Text>
        <TouchableOpacity onPress={handleAddFavorite}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-star" size={60} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('favorites.empty', 'Aucun lieu favori')}
            </Text>
          </View>
        ) : (
          favorites.map((fav) => (
            <View key={fav.id} style={[styles.listItem, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.listItemLeft}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialCommunityIcons name={fav.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={[styles.listItemText, { color: theme.colors.text }]}>{fav.name}</Text>
                  <Text style={[styles.listItemSubtext, { color: theme.colors.textSecondary }]}>{fav.address}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteFavorite(fav.id)}>
                <MaterialCommunityIcons name="delete-outline" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Contacts d'urgence
 */
const EmergencyContactsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [contacts, setContacts] = useState([
    { id: '1', name: 'Maman', phone: '+212612345678', relationship: t('emergency.mother', 'Mère') },
    { id: '2', name: 'Sœur', phone: '+212698765432', relationship: t('emergency.sister', 'Sœur') },
  ]);

  const handleAddContact = () => {
    Alert.alert(
      t('emergency.add', 'Ajouter un contact'),
      t('emergency.addMessage', 'Cette fonctionnalité sera bientôt disponible.'),
      [{ text: t('common.ok', 'OK') }]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('emergency.title', "Contacts d'urgence")}
        </Text>
        <TouchableOpacity onPress={handleAddContact}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {t('emergency.info', 'Ces contacts recevront une alerte en cas d\'urgence pendant vos courses.')}
          </Text>
        </View>

        {contacts.map((contact) => (
          <View key={contact.id} style={[styles.contactCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.contactInfo}>
              <View style={[styles.contactAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.contactName, { color: theme.colors.text }]}>{contact.name}</Text>
                <Text style={[styles.contactPhone, { color: theme.colors.textSecondary }]}>{contact.phone}</Text>
                <Text style={[styles.contactRelation, { color: theme.colors.primary }]}>{contact.relationship}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.callBtn, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleCall(contact.phone)}
            >
              <MaterialCommunityIcons name="phone" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[styles.addBtn, { borderColor: theme.colors.primary }]} onPress={handleAddContact}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
          <Text style={[styles.addBtnText, { color: theme.colors.primary }]}>
            {t('emergency.addContact', 'Ajouter un contact')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Paramètres de notifications
 */
const NotificationSettingsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [settings, setSettings] = useState({
    push: true,
    email: true,
    sms: false,
    promotions: true,
    rideUpdates: true,
    messages: true,
    safety: true,
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const notificationItems = [
    { key: 'push', icon: 'bell', label: t('notifications.push', 'Notifications push') },
    { key: 'email', icon: 'email', label: t('notifications.email', 'Notifications email') },
    { key: 'sms', icon: 'message-text', label: t('notifications.sms', 'Notifications SMS') },
    { key: 'rideUpdates', icon: 'car', label: t('notifications.rideUpdates', 'Mises à jour des courses') },
    { key: 'messages', icon: 'chat', label: t('notifications.messages', 'Messages') },
    { key: 'promotions', icon: 'tag', label: t('notifications.promotions', 'Promotions et offres') },
    { key: 'safety', icon: 'shield', label: t('notifications.safety', 'Alertes de sécurité') },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('notifications.settings', 'Paramètres de notifications')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {notificationItems.map((item) => (
          <View key={item.key} style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{item.label}</Text>
            </View>
            <Switch
              value={settings[item.key as keyof typeof settings]}
              onValueChange={() => toggleSetting(item.key)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={settings[item.key as keyof typeof settings] ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Aide et support
 */
const HelpScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const helpItems = [
    { icon: 'frequently-asked-questions', title: t('help.faq', 'FAQ'), desc: t('help.faqDesc', 'Questions fréquentes') },
    { icon: 'headset', title: t('help.contact', 'Contacter le support'), desc: t('help.contactDesc', 'Assistance 24h/24') },
    { icon: 'shield-alert', title: t('help.safety', 'Centre de sécurité'), desc: t('help.safetyDesc', 'Conseils de sécurité') },
    { icon: 'file-document', title: t('help.terms', 'Conditions d\'utilisation'), desc: t('help.termsDesc', 'Nos conditions') },
    { icon: 'shield-lock', title: t('help.privacy', 'Politique de confidentialité'), desc: t('help.privacyDesc', 'Protection des données') },
    { icon: 'information', title: t('help.about', 'À propos'), desc: t('help.aboutDesc', 'Version 1.0.0') },
  ];

  const handleItemPress = (title: string) => {
    if (title === t('help.contact', 'Contacter le support')) {
      Alert.alert(
        t('help.contactTitle', 'Contacter le support'),
        t('help.contactMessage', 'Email: support@gowithsally.ma\nTél: +212 5XX-XXXXXX'),
        [
          { text: t('common.cancel', 'Annuler'), style: 'cancel' },
          { text: t('help.callNow', 'Appeler'), onPress: () => Linking.openURL('tel:+212500000000') },
        ]
      );
    } else {
      Alert.alert(title, t('common.comingSoon', 'Bientôt disponible'));
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('help.title', 'Aide et support')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {helpItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.helpItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleItemPress(item.title)}
          >
            <View style={[styles.helpIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.helpContent}>
              <Text style={[styles.helpTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[styles.helpDesc, { color: theme.colors.textSecondary }]}>{item.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Go With Sally v1.0.0
          </Text>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            {t('help.madeWith', 'Fait avec ❤️ au Maroc')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * ➕ Écran Vérification du genre
 */
const GenderVerificationScreen = ({ onVerificationComplete }: { onVerificationComplete?: () => void }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    // Simulation de vérification
    setTimeout(() => {
      dispatch(setGenderVerified(true));
      setLoading(false);
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    }, 1500);
  };

  // Auto-verify en mode dev
  useEffect(() => {
    if (APP_MODE === 'offline' || APP_MODE === 'hybrid') {
      const timer = setTimeout(() => {
        dispatch(setGenderVerified(true));
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="gender-female" size={80} color={theme.colors.primary} />
      <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
        {t('verification.genderTitle', 'Vérification du genre')}
      </Text>
      <Text style={[styles.placeholderText, { color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 30 }]}>
        {t('verification.genderDescription', 'Go With Sally est un service exclusivement réservé aux femmes pour garantir votre sécurité.')}
      </Text>
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, marginTop: 30 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? t('common.verifying', 'Vérification...') : t('verification.confirmGender', 'Je confirme être une femme')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Placeholder styles
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Screen styles
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listItemSubtext: {
    fontSize: 14,
    marginTop: 2,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 8,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Form section
  formSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 8,
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  heroDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },

  // Section title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },

  // Benefit card
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefitDesc: {
    fontSize: 14,
    marginTop: 2,
  },

  // Primary button
  primaryBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footnote
  footnote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },

  // Icon circle
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Contact card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Settings item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },

  // Help item
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  helpDesc: {
    fontSize: 14,
    marginTop: 2,
  },

  // Version section
  versionSection: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  versionText: {
    fontSize: 14,
  },

  // SOS buttons
  sosButtons: {
    gap: 12,
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sosBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

// ============================================================================
// NAVIGATORS
// ============================================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================================
// USER TAB NAVIGATOR
// ============================================================================

const UserTabNavigator = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            HomeTab: 'home',
            Activity: 'history',
            Messages: 'message-text',
            Profile: 'account',
          };
          return <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home', 'Accueil') }}
      />
      <Tab.Screen
        name="Activity"
        component={RideHistoryScreen}
        options={{ tabBarLabel: t('navigation.activity', 'Activité') }}
      />
      <Tab.Screen
        name="Messages"
        component={ConversationsListScreen}
        options={{ tabBarLabel: t('navigation.messages', 'Messages') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('navigation.profile', 'Profil') }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// DRIVER TAB NAVIGATOR
// ============================================================================

const DriverTabNavigator = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            DriverHomeTab: 'steering',
            Earnings: 'cash',
            DriverMessages: 'message-text',
            DriverProfile: 'account',
          };
          return <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverHomeTab"
        component={DriverHomeScreen}
        options={{ tabBarLabel: t('navigation.home', 'Accueil') }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{ tabBarLabel: t('navigation.earnings', 'Gains') }}
      />
      <Tab.Screen
        name="DriverMessages"
        component={ConversationsListScreen}
        options={{ tabBarLabel: t('navigation.messages', 'Messages') }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('navigation.profile', 'Profil') }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// AUTH STACK
// ============================================================================

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
  </Stack.Navigator>
);

// ============================================================================
// USER STACK - AVEC TOUS LES ÉCRANS
// ============================================================================

const UserStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Tabs */}
    <Stack.Screen name="UserTabs" component={UserTabNavigator} />
    
    {/* Ride Flow */}
    <Stack.Screen name="SearchLocation" component={SearchLocationScreen} />
    <Stack.Screen name="ChooseOnMap" component={ChooseOnMapScreen} />
    <Stack.Screen name="ConfirmRide" component={ConfirmRideScreen} />
    <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} />
    <Stack.Screen name="RideInProgress" component={RideInProgressScreen} />
    <Stack.Screen name="RideCompleted" component={RideCompletedScreen} />
    
    {/* Chat */}
    <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Call" component={CallScreen} />
    
    {/* Receipts & Share */}
    <Stack.Screen name="Receipt" component={ReceiptScreen} />
    <Stack.Screen name="ShareTrip" component={ShareTripScreen} />
    <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
    
    {/* Profile & Settings */}
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} />
    <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
    <Stack.Screen name="BecomeDriver" component={BecomeDriverScreen} />
    
    {/* Other */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <Stack.Screen name="SOS" component={SOSScreen} />
    <Stack.Screen name="FaceLock" component={FaceLockScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);

// ============================================================================
// DRIVER STACK - AVEC TOUS LES ÉCRANS
// ============================================================================

const DriverStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Tabs */}
    <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
    <Stack.Screen name="DriverHome" component={DriverTabNavigator} />
    
    {/* Ride Flow */}
    <Stack.Screen name="IncomingRide" component={IncomingRideScreen} />
    <Stack.Screen name="NavigateToPickup" component={NavigateToPickupScreen} />
    <Stack.Screen name="DriverRideInProgress" component={DriverRideInProgressScreen} />
    <Stack.Screen name="DriverRideCompleted" component={DriverRideCompletedScreen} />
    
    {/* Chat */}
    <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Call" component={CallScreen} />
    
    {/* Receipts & Share */}
    <Stack.Screen name="Receipt" component={ReceiptScreen} />
    <Stack.Screen name="ShareTrip" component={ShareTripScreen} />
    <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
    
    {/* Profile & Settings */}
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} />
    <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
    
    {/* Documents */}
    <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
    <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    
    {/* Other */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="SOS" component={SOSScreen} />
    <Stack.Screen name="FaceLock" component={FaceLockScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);

// ============================================================================
// ADMIN STACK
// ============================================================================

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminVerifications" component={AdminVerificationsScreen} />
    <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminRides" component={AdminRidesScreen} />
    <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <Stack.Screen name="AdminActivities" component={AdminActivitiesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
  </Stack.Navigator>
);

// ============================================================================
// VERIFICATION STACKS - AVEC CALLBACKS
// ============================================================================

/**
 * Stack de vérification téléphone
 */
const PhoneVerificationStack = () => {
  const dispatch = useAppDispatch();

  const handleComplete = () => {
    console.log('[RootNavigator] 📱 Phone verified → email');
    dispatch(setVerificationStep('email'));
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneVerification">
        {(props) => (
          <PhoneVerificationScreen {...props} onVerificationComplete={handleComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

/**
 * Stack de vérification email
 */
const EmailVerificationStack = () => {
  const dispatch = useAppDispatch();

  const handleComplete = () => {
    console.log('[RootNavigator] 📧 Email verified → gender');
    dispatch(setVerificationStep('gender'));
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmailVerification">
        {(props) => (
          <EmailVerificationScreen {...props} onVerificationComplete={handleComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

/**
 * Stack de vérification du genre
 */
const GenderVerificationStack = () => {
  const dispatch = useAppDispatch();

  const handleComplete = () => {
    console.log('[RootNavigator] 👩 Gender verified → face');
    dispatch(setVerificationStep('face'));
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GenderVerification">
        {(props) => (
          <GenderVerificationScreen {...props} onVerificationComplete={handleComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

/**
 * Stack de vérification faciale
 */
const FaceVerificationStack = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleComplete = () => {
    // Si driver non vérifié → documents, sinon complete
    if (user?.role === 'driver' && !user.isVerified) {
      console.log('[RootNavigator] 👤 Face verified → documents');
      dispatch(setVerificationStep('documents'));
    } else {
      console.log('[RootNavigator] 👤 Face verified → complete');
      dispatch(setVerificationStep('complete'));
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FaceVerification">
        {(props) => (
          <FaceLockScreen {...props} onVerificationSuccess={handleComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

/**
 * Stack de vérification des documents (drivers)
 */
const DocumentsVerificationStack = () => {
  const dispatch = useAppDispatch();

  const handleComplete = () => {
    console.log('[RootNavigator] 📄 Documents verified → complete');
    dispatch(setVerificationStep('complete'));
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverDocuments">
        {(props) => (
          <DriverDocumentsScreen {...props} onVerificationComplete={handleComplete} />
        )}
      </Stack.Screen>
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    </Stack.Navigator>
  );
};

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

const RootNavigator = () => {
  const { isAuthenticated, verificationStep, token, user, genderVerified, faceEnrolled, requiresDailyFaceCheck, lastFaceVerification } = useAppSelector((state) => state.auth);

  console.log('[RootNavigator] ═══════════════════════════════════════');
  console.log(`[RootNavigator] 🟡 Mode: ${APP_MODE}`);
  console.log('[RootNavigator] 🔍 État actuel:');
  console.log('[RootNavigator]   - token:', token ? '✅' : '❌');
  console.log('[RootNavigator]   - isAuthenticated:', isAuthenticated);
  console.log('[RootNavigator]   - verificationStep:', verificationStep);
  console.log('[RootNavigator]   - user:', user?.email || 'null');
  console.log('[RootNavigator]   - role:', user?.role || 'null');
  console.log('[RootNavigator]   - genderVerified:', genderVerified);
  console.log('[RootNavigator]   - faceEnrolled:', faceEnrolled);
  console.log('[RootNavigator]   - requiresDailyFaceCheck:', requiresDailyFaceCheck);
  console.log('[RootNavigator]   - lastFaceVerification:', lastFaceVerification ? new Date(lastFaceVerification).toDateString() : 'null');
  console.log('[RootNavigator] ═══════════════════════════════════════');

  // ══════════════════════════════════════════════════════════════════════════
  // PAS DE TOKEN → AUTH
  // ══════════════════════════════════════════════════════════════════════════
  if (!token) {
    console.log('[RootNavigator] 🔓 → AuthStack');
    return <AuthStack />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPES DE VÉRIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  
  if (verificationStep === 'phone') {
    console.log('[RootNavigator] 📱 → PhoneVerificationStack');
    return <PhoneVerificationStack />;
  }

  if (verificationStep === 'email') {
    console.log('[RootNavigator] 📧 → EmailVerificationStack');
    return <EmailVerificationStack />;
  }

  if (verificationStep === 'gender') {
    // Auto-skip en mode offline/hybrid si non vérifié
    if (!genderVerified) {
      console.log('[RootNavigator] 👩 → GenderVerificationStack');
      return <GenderVerificationStack />;
    }
  }

  if (verificationStep === 'face') {
    console.log('[RootNavigator] 👤 → FaceVerificationStack');
    return <FaceVerificationStack />;
  }

  if (verificationStep === 'documents') {
    console.log('[RootNavigator] 📄 → DocumentsVerificationStack');
    return <DocumentsVerificationStack />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VÉRIFICATION COMPLÈTE → NAVIGATION SELON LE RÔLE
  // ══════════════════════════════════════════════════════════════════════════
  
  if (verificationStep === 'complete' && user) {
    console.log('[RootNavigator] ✅ Complete - Rôle:', user.role);

    switch (user.role) {
      case 'driver':
        console.log('[RootNavigator] 🚗 → DriverStack');
        return <DriverStack />;
      case 'admin':
        console.log('[RootNavigator] 👑 → AdminStack');
        return <AdminStack />;
      default:
        console.log('[RootNavigator] 👩 → UserStack');
        return <UserStack />;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAR DÉFAUT → AUTH
  // ══════════════════════════════════════════════════════════════════════════
  console.log('[RootNavigator] ⚠️ État inconnu → AuthStack');
  return <AuthStack />;
};

export default RootNavigator;