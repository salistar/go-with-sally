// ============================================================
// 📄 EmergencyContactCard.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[EmergencyContactCard.tsx] ▶ Module loaded')
//   • console.log('[EmergencyContactCard.tsx] ▶ EmergencyContactCard() rendered')
//   • console.log('[EmergencyContactCard.tsx] ▶ handleCall() called')
//   • console.log('[EmergencyContactCard.tsx] ▶ handleEdit() called')
//   • console.log('[EmergencyContactCard.tsx] ▶ handleDelete() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[EmergencyContactCard.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: 'high' | 'medium' | 'low';
}

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onCall?: (phone: string, name: string) => void;
  onEdit?: (contact: EmergencyContact) => void;
  onDelete?: (contactId: string) => void;
  isEditable?: boolean;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  onCall,
  onEdit,
  onDelete,
  isEditable = true,
}) => {
  console.log(`${FILE_NAME} ▶ EmergencyContactCard() rendered for: ${contact.id}`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [showActions, setShowActions] = useState(false);

  const handleCall = () => {
    console.log(`${FILE_NAME} ▶ handleCall() called for: ${contact.phone}`);

    Alert.alert(
      'Appeler ' + contact.name,
      `Voulez-vous appeler ${contact.name} au ${contact.phone}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          style: 'default',
          onPress: () => {
            if (onCall) {
              onCall(contact.phone, contact.name);
            } else {
              Linking.openURL(`tel:${contact.phone}`).catch(() => {
                Toast.show({
                  type: 'error',
                  text1: 'Erreur',
                  text2: 'Impossible d\'effectuer l\'appel',
                  position: 'bottom',
                });
              });
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    console.log(`${FILE_NAME} ▶ handleEdit() called for: ${contact.id}`);
    if (onEdit) {
      onEdit(contact);
    }
  };

  const handleDelete = () => {
    console.log(`${FILE_NAME} ▶ handleDelete() called for: ${contact.id}`);

    Alert.alert(
      'Supprimer le contact',
      `Êtes-vous sûr de vouloir supprimer ${contact.name}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(contact.id);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Priorité haute';
      case 'medium':
        return 'Priorité moyenne';
      case 'low':
        return 'Priorité basse';
      default:
        return priority;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.background,
        },
      ]}
    >
      {/* Priority indicator */}
      <View
        style={[
          styles.priorityIndicator,
          {
            backgroundColor: getPriorityColor(contact.priority),
          },
        ]}
      />

      {/* Card content */}
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        {/* Name & Relationship */}
        <View style={styles.nameSection}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {contact.name}
          </Text>
          <Text
            style={[
              styles.relationship,
              {
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {contact.relationship}
          </Text>
        </View>

        {/* Phone number */}
        <View
          style={[
            styles.phoneSection,
            isRTL && styles.phoneSectionRTL,
          ]}
        >
          <MaterialCommunityIcons
            name="phone"
            size={20}
            color={theme.colors.primary}
            style={styles.phoneIcon}
          />
          <Text
            style={[
              styles.phone,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {contact.phone}
          </Text>
        </View>

        {/* Priority badge */}
        <View style={styles.priorityBadge}>
          <Text
            style={[
              styles.priorityText,
              {
                color: getPriorityColor(contact.priority),
              },
            ]}
          >
            {getPriorityLabel(contact.priority)}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View
        style={[
          styles.actions,
          isRTL && styles.actionsRTL,
        ]}
      >
        <TouchableOpacity
          onPress={handleCall}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.primary + '20',
            },
          ]}
        >
          <MaterialCommunityIcons
            name="phone"
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {isEditable && (
          <>
            <TouchableOpacity
              onPress={handleEdit}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.primary + '20',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.actionButton,
                {
                  backgroundColor: '#F44336' + '20',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="delete"
                size={20}
                color="#F44336"
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  content: {
    flex: 1,
    marginLeft: 8,
    gap: 6,
  },
  contentRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  nameSection: {
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  relationship: {
    fontSize: 12,
    fontWeight: '400',
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneSectionRTL: {
    flexDirection: 'row-reverse',
  },
  phoneIcon: {
    marginRight: 4,
  },
  phone: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EmergencyContactCard;
