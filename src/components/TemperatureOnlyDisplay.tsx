import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface TemperatureOnlyDisplayProps {
  onRefresh?: () => void;
}

const TemperatureOnlyDisplay: React.FC<TemperatureOnlyDisplayProps> = ({ 
  onRefresh
}) => {
  const { getCurrentTemperature } = useApp();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [temperature, setTemperature] = useState<{ min: number; max: number; current: number } | null>(null);
  
  useEffect(() => {
    loadTemperatureData();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      loadTemperatureData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadTemperatureData = async () => {
    setLoading(true);
    try {
      // Get current temperature
      const tempData = await getCurrentTemperature();
      setTemperature(tempData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading current temperature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTemperatureData();
    if (onRefresh) {
      onRefresh();
    }
    
    // Simular animación de actualización
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemperatureEmoji = (temp: number) => {
    if (temp < 0) return '❄️';
    if (temp < 10) return '🥶';
    if (temp < 20) return '😎';
    if (temp < 30) return '☀️';
    if (temp < 40) return '🔥';
    return '🌋';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Temperatura Actual en Málaga 📍</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={loading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Cargando datos... ⏳</Text>
        </View>
      ) : temperature ? (
        <View style={styles.weatherContent}>
          {/* Large Temperature Display */}
          <View style={styles.temperatureHighlight}>
            <Text style={styles.temperatureValue}>
              {temperature.current.toFixed(1)}
              <Text style={styles.temperatureUnit}>°C</Text>
            </Text>
            <Text style={styles.temperatureLabel}>TEMPERATURA ACTUAL</Text>
          </View>
          
          {/* Temperature Details */}
          <View style={styles.temperatureDetails}>
            <View style={styles.temperatureItem}>
              <View style={styles.temperatureIconContainer}>
                <Text style={styles.temperatureEmoji}>
                  {getTemperatureEmoji(temperature.min)}
                </Text>
              </View>
              <View style={styles.temperatureTextContainer}>
                <Text style={styles.temperatureItemLabel}>MÍNIMA</Text>
                <Text style={styles.temperatureItemValue}>
                  {temperature.min.toFixed(1)}°C
                </Text>
              </View>
            </View>
            
            <View style={styles.temperatureItem}>
              <View style={styles.temperatureIconContainer}>
                <Text style={styles.temperatureEmoji}>
                  {getTemperatureEmoji(temperature.max)}
                </Text>
              </View>
              <View style={styles.temperatureTextContainer}>
                <Text style={styles.temperatureItemLabel}>MÁXIMA</Text>
                <Text style={styles.temperatureItemValue}>
                  {temperature.max.toFixed(1)}°C
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.locationInfo}>
            <Feather name="map-pin" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.locationText}>Málaga, España</Text>
            {lastUpdated && (
              <Text style={styles.updatedText}>
                Actualizado: {formatTime(lastUpdated)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.errorText}>No se pudieron cargar los datos de temperatura ❌</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  refreshButton: { 
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  weatherContent: {
    alignItems: 'center',
  },
  temperatureHighlight: {
    alignItems: 'center',
    marginBottom: 4,
  },
  temperatureValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    lineHeight: 65,
  },
  temperatureUnit: {
    fontSize: 40,
    fontWeight: 'normal',
  },
  temperatureLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  temperatureDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  temperatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  temperatureIconContainer: {
    marginRight: 8,
  },
  temperatureEmoji: {
    fontSize: 20,
  },
  temperatureTextContainer: {
    flex: 1,
  },
  temperatureItemLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    fontWeight: 'bold',
  },
  temperatureItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  updatedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  }
});

export default TemperatureOnlyDisplay;
