import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Linking,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import WebViewFallback from './WebViewFallback';

// Conditionally import WebView to handle environments where it's not available
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (error) {
  console.log('WebView not available:', error);
}

const InteractiveMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [webViewSupported, setWebViewSupported] = useState(WebView !== null);

  useEffect(() => {
    // Check if WebView is available
    setWebViewSupported(WebView !== null);
    
    // Simulate loading
    setLoading(true);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to open external map in browser
  const openExternalMap = () => {
    const mapUrl = 'https://www.rainviewer.com/map.html?loc=36.6642,-4.5636,10.015177236948498&oCS=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1&ts=1';
    
    Linking.openURL(mapUrl).catch(err => {
      console.error('Error opening external map:', err);
      setMapError(true);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : (
          <View style={styles.fallbackContainer}>
            <Image 
              source={{ uri: 'https://openweathermap.org/weathermap/img/wm_home/precipitation.png' }}
              style={styles.fallbackImage}
              resizeMode="contain"
              onError={() => setMapError(true)}
            />
            <Text style={styles.fallbackText}>
              Vista previa del mapa meteorológico
            </Text>
            <TouchableOpacity 
              style={styles.openExternalButton}
              onPress={openExternalMap}
            >
              <Feather name="external-link" size={16} color="#FFFFFF" />
              <Text style={styles.openExternalText}>Ver mapa interactivo en navegador</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.openExternalButton}
        onPress={openExternalMap}
      >
        <Feather name="external-link" size={16} color="#FFFFFF" />
        <Text style={styles.openExternalText}>Ver mapa completo</Text>
      </TouchableOpacity>
      
      <View style={styles.locationsList}>
        <Text style={styles.locationsTitle}>Ubicaciones principales:</Text>
        <View style={styles.locationItem}>
          <Feather name="map-pin" size={16} color="#3B82F6" />
          <Text style={styles.locationText}>Centro de Málaga (36.7213, -4.4214)</Text>
        </View>
        <View style={styles.locationItem}>
          <Feather name="map-pin" size={16} color="#3B82F6" />
          <Text style={styles.locationText}>Aeropuerto de Málaga (36.6749, -4.4883)</Text>
        </View>
        <View style={styles.locationItem}>
          <Feather name="map-pin" size={16} color="#3B82F6" />
          <Text style={styles.locationText}>Playa de la Malagueta (36.7197, -4.4097)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: Platform?.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fallbackImage: {
    width: '100%',
    height: 150,
    marginBottom: 16,
  },
  fallbackText: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 16,
    fontFamily: Platform?.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  openExternalText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  locationsList: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  locationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Platform?.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontFamily: Platform?.OS === 'android' ? 'sans-serif' : 'Arial',
  },
});

export default InteractiveMap;
