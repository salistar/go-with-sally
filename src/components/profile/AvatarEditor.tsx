// ============================================================
// 📄 AvatarEditor.tsx — GoWithSally
// LOG SUMMARY:
//   • console.log('[AvatarEditor.tsx] ▶ Module loaded')
//   • console.log('[AvatarEditor.tsx] ▶ AvatarEditor() rendered')
//   • console.log('[AvatarEditor.tsx] ▶ handlePickImage() called')
//   • console.log('[AvatarEditor.tsx] ▶ handleUpload() called')
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../utils/ThemeContext';

const FILE_NAME = '[AvatarEditor.tsx]';
console.log(`${FILE_NAME} ▶ Module loaded`);

interface AvatarEditorProps {
  avatarUrl?: string;
  userName?: string;
  onAvatarChange?: (uri: string) => void;
  isEditable?: boolean;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({
  avatarUrl,
  userName = 'User',
  onAvatarChange,
  isEditable = true,
}) => {
  console.log(`${FILE_NAME} ▶ AvatarEditor() rendered`);

  const { theme } = useTheme();
  const isRTL = I18nManager.isRTL;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(avatarUrl || null);

  const handlePickImage = async () => {
    console.log(`${FILE_NAME} ▶ handlePickImage() called`);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);

        if (!isLoading) {
          handleUpload(asset.uri);
        }
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

  const handleUpload = async (imageUri: string) => {
    console.log(`${FILE_NAME} ▶ handleUpload() called with uri: ${imageUri}`);

    setIsLoading(true);

    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (onAvatarChange) {
        onAvatarChange(imageUri);
      }

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Avatar mis à jour',
        position: 'bottom',
      });
    } catch (error) {
      console.error(`${FILE_NAME} ▶ Error uploading avatar:`, error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de télécharger l\'avatar',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Supprimer l\'avatar',
      'Êtes-vous sûr de vouloir supprimer votre avatar?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            if (onAvatarChange) {
              onAvatarChange('');
            }
            Toast.show({
              type: 'success',
              text1: 'Avatar supprimé',
              text2: 'Votre avatar a été supprimé',
              position: 'bottom',
            });
          },
        },
      ]
    );
  };

  const initials = userName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarContainer,
          {
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary,
          },
        ]}
      >
        {selectedImage ? (
          <>
            <Image
              source={{ uri: selectedImage }}
              style={styles.avatar}
            />
            {isLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <ActivityIndicator color="white" size="large" />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.placeholderAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.placeholderText}>{initials}</Text>
          </View>
        )}

        {/* Edit button */}
        {isEditable && (
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={isLoading}
            style={[
              styles.editButton,
              {
                backgroundColor: theme.colors.primary,
              },
              isLoading && styles.editButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      {isEditable && selectedImage && (
        <View style={[styles.actions, isRTL && styles.actionsRTL]}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
              },
            ]}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name="image-plus"
              size={18}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: theme.colors.primary,
                },
              ]}
            >
              Changer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRemoveAvatar}
            style={[
              styles.actionButton,
              {
                backgroundColor: '#FF4444' + '20',
                borderColor: '#FF4444',
              },
            ]}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name="delete"
              size={18}
              color="#FF4444"
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: '#FF4444',
                },
              ]}
            >
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload hint */}
      {!selectedImage && isEditable && (
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={isLoading}
          style={[
            styles.uploadHint,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cloud-upload-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.uploadHintText,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            Cliquez pour ajouter une photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  editButtonDisabled: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uploadHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
  },
  uploadHintText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});

export default AvatarEditor;
