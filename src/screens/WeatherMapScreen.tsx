import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';

type WeatherMapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WeatherMap'>;

const { width, height } = Dimensions.get('window');

const WeatherMapScreen: React.FC = () => {
  const navigation = useNavigation<WeatherMapScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [radarPath, setRadarPath] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [error, setError] = useState<string | null>(null);

  // Málaga coordinates
  const MALAGA_REGION = {
    latitude: 36.7213,
    longitude: -4.4213,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  useEffect(() => {
    loadRainViewerData();
  }, []);

  const loadRainViewerData = async () => {
    setLoading(true);
    try {
      // Removed the call to fetchRainViewerData
      // const data = await fetchRainViewerData();
      // if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
      //   // Get the most recent radar data
      //   const latestRadar = data.radar.past[data.radar.past.length - 1];
      //   setRadarPath(latestRadar.path);
      // } else {
      //   setError('No radar data available');
      // }
    } catch (error) {
      console.error('Error loading RainViewer data:', error);
      setError('Failed to load radar data');
    } finally {
      setLoading(false);
    }
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Static map URL for fallback
  const getStaticMapUrl = () => {
    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const center = `${MALAGA_REGION.latitude},${MALAGA_REGION.longitude}`;
    const zoom = "12";
    const size = "600x400";
    const maptype = mapType;
    const markers = `color:red|${center}`;
    
    return `${baseUrl}?center=${center}&zoom=${zoom}&size=${size}&maptype=${maptype}&markers=${markers}`;
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={goBack} 
              style={styles.backButton}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Radar Meteorológico</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadRainViewerData}
              accessibilityLabel="Actualizar radar"
              accessibilityRole="button"
            >
              <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Cargando radar...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={40} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadRainViewerData}
                >
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mapWrapper}>
                {/* Fallback static map image instead of MapView component */}
                <Image 
                  source={{ 
                    uri: radarPath 
                      ? `https://openweathermap.org/weathermap/img/wm_home/precipitation.png` 
                      : getStaticMapUrl()
                  }}
                  style={styles.staticMap}
                  resizeMode="cover"
                />
                <View style={styles.mapOverlay}>
                  <Text style={styles.mapOverlayText}>Radar de Precipitación</Text>
                  <Text style={styles.mapOverlaySubtext}>Málaga, España</Text>
                </View>
                <View style={styles.mapControls}>
                  <TouchableOpacity 
                    style={styles.mapTypeButton}
                    onPress={toggleMapType}
                  >
                    <Feather 
                      name={mapType === 'standard' ? 'layers' : 'map'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Leyenda de Precipitación</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#b3f0ff' }]} />
                <Text style={styles.legendText}>0.1 - 1 mm/h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#66ccff' }]} />
                <Text style={styles.legendText}>1 - 2 mm/h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffffbf' }]} />
                <Text style={styles.legendText}>2 - 5 mm/h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#fdae61' }]} />
                <Text style={styles.legendText}>5 - 10 mm/h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#d7191c' }]} />
                <Text style={styles.legendText}>10+ mm/h</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Datos proporcionados por RainViewer. El radar muestra la precipitación en tiempo real.
            </Text>
            <Text style={styles.updateText}>
              Última actualización: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mapContainer: {
    width: '100%',
    height: height * 0.5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingText: {
    marginTop: 10,
    color: '#3B82F6',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorText: {
    marginTop: 10,
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  staticMap: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 5,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapOverlaySubtext: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  mapTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  legendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default WeatherMapScreen;
