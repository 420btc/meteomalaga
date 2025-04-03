import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WeatherMapProps {
  mapType?: 'rain' | 'temp' | 'wind' | 'clouds';
  region?: 'malaga' | 'spain' | 'europe';
}

const { width } = Dimensions.get('window');

const WeatherMap: React.FC<WeatherMapProps> = ({
  mapType = 'rain',
  region = 'malaga'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  // OpenWeatherMap API key (free tier)
  const apiKey = '5ae0c9a3137234e18e032e3d6024629e';

  // Fallback static map URLs - using high quality images
  const staticMapUrls = {
    rain: 'https://openweathermap.org/weathermap/img/wm_home/precipitation.png',
    temp: 'https://openweathermap.org/weathermap/img/wm_home/temperature.png',
    wind: 'https://openweathermap.org/weathermap/img/wm_home/wind.png',
    clouds: 'https://openweathermap.org/weathermap/img/wm_home/clouds.png'
  };

  // Coordinates for different regions
  const regionCoords = {
    malaga: { lat: 36.7213, lon: -4.4213, zoom: 10 },
    spain: { lat: 40.4637, lon: -3.7492, zoom: 6 },
    europe: { lat: 48.8566, lon: 2.3522, zoom: 4 }
  };

  useEffect(() => {
    generateMapUrl();
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [mapType, region]);

  const generateMapUrl = () => {
    const coords = regionCoords[region];
    const mapTypeParam = mapType === 'rain' ? 'precipitation_new' : 
                         mapType === 'temp' ? 'temp_new' : 
                         mapType === 'wind' ? 'wind_new' : 'clouds_new';
    
    // Create a URL for the OpenWeatherMap iframe
    const url = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=${mapTypeParam}&lat=${coords.lat}&lon=${coords.lon}&zoom=${coords.zoom}`;
    
    setMapUrl(url);
  };

  const openExternalMap = () => {
    Linking.openURL(mapUrl).catch(err => {
      console.error('Error opening external map:', err);
      setError(true);
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
              source={{ uri: staticMapUrls[mapType] }}
              style={styles.fallbackImage}
              resizeMode="contain"
              onError={() => setError(true)}
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

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>
          {mapType === 'rain' ? 'Precipitación (mm)' : 
           mapType === 'temp' ? 'Temperatura (°C)' : 
           mapType === 'wind' ? 'Viento (m/s)' : 'Nubosidad (%)'}
        </Text>
        <View style={styles.legendItems}>
          {mapType === 'rain' && (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#b3f0ff' }]} />
                <Text style={styles.legendText}>0.1 - 1</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#66ccff' }]} />
                <Text style={styles.legendText}>1 - 2</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffffbf' }]} />
                <Text style={styles.legendText}>2 - 5</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#fdae61' }]} />
                <Text style={styles.legendText}>5 - 10</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#d7191c' }]} />
                <Text style={styles.legendText}>10+</Text>
              </View>
            </>
          )}
          
          {mapType === 'temp' && (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#b3f0ff' }]} />
                <Text style={styles.legendText}>-20°C</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffff00' }]} />
                <Text style={styles.legendText}>0°C</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ff9900' }]} />
                <Text style={styles.legendText}>20°C</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ff0000' }]} />
                <Text style={styles.legendText}>40°C</Text>
              </View>
            </>
          )}
          
          {mapType === 'wind' && (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#b3f0ff' }]} />
                <Text style={styles.legendText}>1 m/s</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#66ccff' }]} />
                <Text style={styles.legendText}>5 m/s</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#007acc' }]} />
                <Text style={styles.legendText}>10 m/s</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#004c80' }]} />
                <Text style={styles.legendText}>20+ m/s</Text>
              </View>
            </>
          )}
          
          {mapType === 'clouds' && (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffffff' }]} />
                <Text style={styles.legendText}>0%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#cccccc' }]} />
                <Text style={styles.legendText}>25%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#999999' }]} />
                <Text style={styles.legendText}>50%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#666666' }]} />
                <Text style={styles.legendText}>100%</Text>
              </View>
            </>
          )}
        </View>
      </View>

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
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
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
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  openExternalText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  legendContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  locationsList: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  locationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
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
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
});

export default WeatherMap;
