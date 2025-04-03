import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Image 
} from 'react-native';
import { useApp } from '../context/AppContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useApp();
  const [showModal, setShowModal] = useState(false);

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Image
          source={{ 
            uri: language === 'es' 
              ? 'https://flagcdn.com/w80/es.png'
              : 'https://flagcdn.com/w80/gb.png'
          }}
          style={styles.flagImage}
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'es' && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageChange('es')}
            >
              <Image
                source={{ uri: 'https://flagcdn.com/w80/es.png' }}
                style={styles.optionFlagImage}
              />
              <Text style={styles.languageText}>Español</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Image
                source={{ uri: 'https://flagcdn.com/w80/gb.png' }}
                style={styles.optionFlagImage}
              />
              <Text style={styles.languageText}>English</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 30,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flagImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedLanguage: {
    backgroundColor: '#F3F4F6',
  },
  optionFlagImage: {
    width: 24,
    height: 18,
    marginRight: 10,
    borderRadius: 2,
  },
  languageText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default LanguageSwitcher;
