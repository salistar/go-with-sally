// ============================================================
// 📄 EmergencyContactsScreen.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[EmergencyContactsScreen.tsx] ▶ Module loaded')
//   • console.log('[EmergencyContactsScreen.tsx] ▶ EmergencyContactsScreen() rendered')
//   • console.log('[EmergencyContactsScreen.tsx] ▶ handleAddContact() called')
//   • console.log('[EmergencyContactsScreen.tsx] ▶ handleEditContact() called')
//   • console.log('[EmergencyContactsScreen.tsx] ▶ handleDeleteContact() called')
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Modal,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';
import EmergencyContactCard, { EmergencyContact } from '../../components/security/EmergencyContactCard';

const FILE_NAME = '[EmergencyContactsScreen.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

const EmergencyContactsScreen = () => {
  console.log(`${FILE_NAME} ▶ EmergencyContactsScreen() rendered`);

  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Mère',
      phone: '+212 6 XX XX XX XX',
      relationship: 'Mère',
      priority: 'high',
    },
    {
      id: '2',
      name: 'Meilleure amie',
      phone: '+212 6 XX XX XX XX',
      relationship: 'Amie',
      priority: 'medium',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    priority: 'medium' as const,
  });

  useFocusEffect(
    useCallback(() => {
      console.log(`${FILE_NAME} ▶ Screen focused`);
    }, [])
  );

  const handleAddContact = () => {
    console.log(`${FILE_NAME} ▶ handleAddContact() called`);

    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      relationship: '',
      priority: 'medium',
    });
    setShowModal(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    console.log(`${FILE_NAME} ▶ handleEditContact() called for: ${contact.id}`);

    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      priority: contact.priority,
    });
    setShowModal(true);
  };

  const handleDeleteContact = (contactId: string) => {
    console.log(`${FILE_NAME} ▶ handleDeleteContact() called for: ${contactId}`);

    setContacts(contacts.filter(c => c.id !== contactId));
    Toast.show({
      type: 'success',
      text1: 'Contact supprimé',
      text2: 'Le contact a été supprimé avec succès',
      position: 'bottom',
    });
  };

  const handleSaveContact = () => {
    console.log(`${FILE_NAME} ▶ handleSaveContact() called`);

    if (!formData.name.trim() || !formData.phone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez remplir tous les champs',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (editingContact) {
        setContacts(
          contacts.map(c =>
            c.id === editingContact.id
              ? {
                  ...c,
                  name: formData.name,
                  phone: formData.phone,
                  relationship: formData.relationship,
                  priority: formData.priority,
                }
              : c
          )
        );
        Toast.show({
          type: 'success',
          text1: 'Contact modifié',
          text2: 'Le contact a été mis à jour',
          position: 'bottom',
        });
      } else {
        const newContact: EmergencyContact = {
          id: Math.random().toString(),
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          priority: formData.priority,
        };
        setContacts([...contacts, newContact]);
        Toast.show({
          type: 'success',
          text1: 'Contact ajouté',
          text2: 'Le nouveau contact a été enregistré',
          position: 'bottom',
        });
      }

      setLoading(false);
      setShowModal(false);
      Keyboard.dismiss();
    }, 800);
  };

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('emergency.contacts', 'Contacts d\'urgence')}
        </Text>
        <TouchableOpacity onPress={handleAddContact} style={styles.headerAction}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="phone-alert-outline"
              size={64}
              color={theme.colors.textSecondary}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.colors.text },
              ]}
            >
              {t('emergency.noContacts', 'Aucun contact')}
            </Text>
            <Text
              style={[
                styles.emptyMessage,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('emergency.addFirst', 'Ajoutez votre premier contact d\'urgence')}
            </Text>
            <TouchableOpacity
              onPress={handleAddContact}
              style={[
                styles.emptyButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.emptyButtonText}>
                {t('common.add', 'Ajouter')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map(contact => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                isEditable={true}
              />
            ))}
          </View>
        )}

        {/* Info section */}
        <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.infoText}>
              <Text
                style={[
                  styles.infoTitle,
                  { color: theme.colors.text },
                ]}
              >
                {t('emergency.tip1', 'En cas d\'urgence')}
              </Text>
              <Text
                style={[
                  styles.infoMessage,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('emergency.tip1Desc', 'Vos contacts d\'urgence seront avertis')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.text },
                ]}
              >
                {editingContact ? 'Modifier le contact' : 'Ajouter un contact'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Nom
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Entrez le nom"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.name}
                  onChangeText={name => setFormData({ ...formData, name })}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Numéro de téléphone
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="+212 6 XX XX XX XX"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.phone}
                  onChangeText={phone => setFormData({ ...formData, phone })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Relationship */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Relation
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.background,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Mère, Amie, etc..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.relationship}
                  onChangeText={relationship =>
                    setFormData({ ...formData, relationship })
                  }
                />
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Priorité
                </Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high'] as const).map(priority => (
                    <TouchableOpacity
                      key={priority}
                      onPress={() => setFormData({ ...formData, priority })}
                      style={[
                        styles.priorityButton,
                        formData.priority === priority && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          {
                            color:
                              formData.priority === priority
                                ? 'white'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {priority === 'low'
                          ? 'Basse'
                          : priority === 'medium'
                          ? 'Moyenne'
                          : 'Haute'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  {t('common.cancel', 'Annuler')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveContact}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary },
                  loading && styles.buttonDisabled,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>
                    {editingContact ? 'Modifier' : 'Ajouter'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contactsList: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 12,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmergencyContactsScreen;
