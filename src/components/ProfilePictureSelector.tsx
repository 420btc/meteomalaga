import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  Image,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

// Default fallback avatar URL (guaranteed to work)
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/png?seed=Fallback';

// Array of available avatar URLs
// Using Lego avatars from randomuser.me and cartoon avatars from Dicebear API
const AVATAR_OPTIONS = [
  // Lego avatars (all available options from randomuser.me)
  'https://randomuser.me/api/portraits/lego/0.jpg',
  'https://randomuser.me/api/portraits/lego/1.jpg',
  'https://randomuser.me/api/portraits/lego/2.jpg',
  'https://randomuser.me/api/portraits/lego/3.jpg',
  'https://randomuser.me/api/portraits/lego/4.jpg',
  'https://randomuser.me/api/portraits/lego/5.jpg',
  'https://randomuser.me/api/portraits/lego/6.jpg',
  'https://randomuser.me/api/portraits/lego/7.jpg',
  'https://randomuser.me/api/portraits/lego/8.jpg',
  'https://randomuser.me/api/portraits/lego/9.jpg',
  
  // Cartoon avatars from Dicebear API - Avataaars style
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Milo&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Zoe&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Max&backgroundColor=ffd5dc',
  
  // Cartoon avatars from Dicebear API - Bottts style (robot cartoons)
  'https://api.dicebear.com/7.x/bottts/png?seed=Dusty&backgroundColor=ffadad',
  'https://api.dicebear.com/7.x/bottts/png?seed=Mittens&backgroundColor=ffd6a5',
  'https://api.dicebear.com/7.x/bottts/png?seed=Misty&backgroundColor=fdffb6',
  'https://api.dicebear.com/7.x/bottts/png?seed=Oscar&backgroundColor=caffbf',
  'https://api.dicebear.com/7.x/bottts/png?seed=Lucy&backgroundColor=9bf6ff',
  
  // Cartoon avatars from Dicebear API - Pixel Art style
  'https://api.dicebear.com/7.x/pixel-art/png?seed=Bella&backgroundColor=d0f4de',
  'https://api.dicebear.com/7.x/pixel-art/png?seed=Kitty&backgroundColor=a0c4ff',
  'https://api.dicebear.com/7.x/pixel-art/png?seed=Coco&backgroundColor=bdb2ff',
  'https://api.dicebear.com/7.x/pixel-art/png?seed=Tiger&backgroundColor=ffc6ff',
  'https://api.dicebear.com/7.x/pixel-art/png?seed=Simba&backgroundColor=fffffc',
  
  // Cartoon avatars from Dicebear API - Adventurer style
  'https://api.dicebear.com/7.x/adventurer/png?seed=Jasper&backgroundColor=ffcfd2',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Daisy&backgroundColor=f1c0e8',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Rocky&backgroundColor=cfbaf0',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Pepper&backgroundColor=a3c4f3',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Shadow&backgroundColor=90dbf4',
];

interface ProfilePictureSelectorProps {
  currentAvatar?: string;
}

const ProfilePictureSelector: React.FC<ProfilePictureSelectorProps> = ({ 
  currentAvatar 
}) => {
  const { user, updateAvatar } = useApp();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(
    currentAvatar || user?.avatar || DEFAULT_AVATAR
  );
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});
  
  const handleOpenModal = () => {
    setModalVisible(true);
    // Reset image load errors when opening modal
    setImageLoadErrors({});
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  const handleSelectAvatar = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setLoading(true);
    
    try {
      await updateAvatar(avatarUrl);
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };
  
  const handleImageError = (avatarUrl: string) => {
    console.log(`Image failed to load: ${avatarUrl}`);
    setImageLoadErrors(prev => ({
      ...prev,
      [avatarUrl]: true
    }));
    
    // If the current selected avatar fails to load, use the default
    if (selectedAvatar === avatarUrl) {
      setSelectedAvatar(DEFAULT_AVATAR);
    }
  };
  
  // Filter out any avatars that failed to load
  const filteredAvatars = AVATAR_OPTIONS.filter(url => !imageLoadErrors[url]);
  
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handleOpenModal}>
        <View style={styles.avatarContainer}>
          {selectedAvatar ? (
            <Image 
              source={{ uri: selectedAvatar }} 
              style={styles.avatar} 
              resizeMode="cover"
              onError={() => handleImageError(selectedAvatar || '')}
            />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Feather name="user" size={40} color="#CCCCCC" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.changeText}>Cambiar foto</Text>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu avatar</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Actualizando avatar...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.categoryTitle}>Lego y Dibujos Animados</Text>
                <FlatList
                  data={filteredAvatars}
                  keyExtractor={(item) => item}
                  numColumns={3}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.avatarOption,
                        selectedAvatar === item && styles.selectedAvatarOption
                      ]}
                      onPress={() => handleSelectAvatar(item)}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={styles.avatarImage} 
                        resizeMode="cover"
                        onError={() => handleImageError(item)}
                      />
                      {selectedAvatar === item && (
                        <View style={styles.selectedBadge}>
                          <Feather name="check" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.avatarList}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F0F0F0', // Background color while loading
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  avatarList: {
    paddingBottom: 20,
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F0F0', // Background color while loading
  },
  selectedAvatarOption: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0', // Background color while loading
  },
  selectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ProfilePictureSelector;
