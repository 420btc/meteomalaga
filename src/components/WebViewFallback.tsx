import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WebViewFallbackProps {
  url: string;
  title: string;
  thumbnailUrl: string;
}

const WebViewFallback: React.FC<WebViewFallbackProps> = ({ url, title, thumbnailUrl }) => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: thumbnailUrl }} 
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>
          Para ver esta cámara en vivo, haz clic en el siguiente botón:
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => Linking.openURL(url)}
        >
          <Feather name="external-link" size={16} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Abrir en navegador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default WebViewFallback;
